package main

import (
	"context"
	"database/sql"
	"errors"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"go.uber.org/zap"
	"google.golang.org/grpc"

	"github.com/modiva/fintech-core-api/pkg/logging"
	_ "github.com/modiva/fintech-core-api/services/auth/docs"
	"github.com/modiva/fintech-core-api/services/auth/internal/config"
	grpcdelivery "github.com/modiva/fintech-core-api/services/auth/internal/delivery/grpc"
	httpdelivery "github.com/modiva/fintech-core-api/services/auth/internal/delivery/http"
	"github.com/modiva/fintech-core-api/services/auth/internal/repository"
	"github.com/modiva/fintech-core-api/services/auth/internal/security"
	"github.com/modiva/fintech-core-api/services/auth/internal/usecase"
)

// @title FinTech Auth Service API
// @version 1.0
// @description Authentication, JWT, and RBAC APIs for FinTech Core.
// @BasePath /v1
func main() {
	cfg := config.Load()

	logger, err := logging.New(cfg.Environment)
	if err != nil {
		panic(err)
	}
	defer logger.Sync()

	db, err := sql.Open("mysql", cfg.MySQLDSN)
	if err != nil {
		logger.Fatal("open mysql", zap.Error(err))
	}
	db.SetMaxOpenConns(20)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(30 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		logger.Fatal("ping mysql", zap.Error(err))
	}

	fieldCipher, err := security.NewFieldCipher(cfg.FieldEncryptionKey)
	if err != nil {
		logger.Fatal("create field cipher", zap.Error(err))
	}
	jwtService := security.NewJWTService(cfg.JWTSecret, cfg.JWTTTL)
	userRepo := repository.NewMySQLUserRepository(db, fieldCipher, cfg.EmailHashSecret)
	authUsecase := usecase.NewAuthUsecase(userRepo, jwtService)

	if cfg.BootstrapAdminEmail != "" && cfg.BootstrapAdminPassword != "" {
		if err := authUsecase.EnsureBootstrapAdmin(context.Background(), cfg.BootstrapAdminEmail, cfg.BootstrapAdminPassword); err != nil {
			logger.Fatal("bootstrap admin", zap.Error(err))
		}
	}

	router := httpdelivery.NewRouter(httpdelivery.RouterConfig{
		Usecase:       authUsecase,
		JWT:           jwtService,
		Logger:        logger,
		AllowedOrigin: cfg.AllowedOrigin,
	})

	httpServer := &http.Server{
		Addr:              cfg.HTTPAddr,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
	}

	grpcServer := grpc.NewServer()
	grpcdelivery.RegisterAuthService(grpcServer, jwtService)

	grpcListener, err := net.Listen("tcp", cfg.GRPCAddr)
	if err != nil {
		logger.Fatal("listen grpc", zap.Error(err))
	}

	go func() {
		logger.Info("auth http listening", zap.String("addr", cfg.HTTPAddr))
		if err := httpServer.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Fatal("serve auth http", zap.Error(err))
		}
	}()

	go func() {
		logger.Info("auth grpc listening", zap.String("addr", cfg.GRPCAddr))
		if err := grpcServer.Serve(grpcListener); err != nil {
			logger.Fatal("serve auth grpc", zap.Error(err))
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer shutdownCancel()

	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		logger.Error("shutdown auth http", zap.Error(err))
	}
	grpcServer.GracefulStop()
}
