package http

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"go.uber.org/zap"

	"github.com/modiva/fintech-core-api/pkg/httpx"
	"github.com/modiva/fintech-core-api/services/transaction/internal/domain"
	"github.com/modiva/fintech-core-api/services/transaction/internal/usecase"
)

type AuthClient interface {
	ValidateToken(ctx context.Context, token string) (domain.Principal, error)
}

type RouterConfig struct {
	Usecase       *usecase.TransactionUsecase
	AuthClient    AuthClient
	Logger        *zap.Logger
	AllowedOrigin string
}

type Handler struct {
	uc     *usecase.TransactionUsecase
	auth   AuthClient
	logger *zap.Logger
}

type createAccountRequest struct {
	UserID   string `json:"user_id"`
	Currency string `json:"currency" binding:"required"`
}

type mutationRequest struct {
	AccountID   string `json:"account_id" binding:"required"`
	AmountCents int64  `json:"amount_cents" binding:"required"`
	Reference   string `json:"reference"`
}

type transferRequest struct {
	FromAccountID string `json:"from_account_id" binding:"required"`
	ToAccountID   string `json:"to_account_id" binding:"required"`
	AmountCents   int64  `json:"amount_cents" binding:"required"`
	Reference     string `json:"reference"`
}

func NewRouter(cfg RouterConfig) *gin.Engine {
	if cfg.Logger == nil {
		cfg.Logger = zap.NewNop()
	}
	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	router.Use(gin.Recovery(), httpx.RequestID(), httpx.SecurityHeaders(cfg.AllowedOrigin))

	handler := &Handler{uc: cfg.Usecase, auth: cfg.AuthClient, logger: cfg.Logger}

	router.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	v1 := router.Group("/v1", handler.AuthRequired())
	v1.POST("/accounts", handler.CreateAccount)
	v1.GET("/accounts", handler.ListAccounts)
	v1.GET("/accounts/:id", handler.GetAccount)
	v1.GET("/transactions", handler.ListTransactions)
	v1.GET("/transactions/stream", handler.StreamTransactions)
	v1.POST("/transactions/deposit", handler.Deposit)
	v1.POST("/transactions/withdraw", handler.Withdraw)
	v1.POST("/transactions/transfer", handler.Transfer)
	v1.GET("/reports/monthly-balances", handler.MonthlyBalances)

	return router
}

func (h *Handler) CreateAccount(c *gin.Context) {
	var req createAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httpx.JSONError(c, http.StatusBadRequest, "invalid request payload")
		return
	}
	account, err := h.uc.CreateAccount(c.Request.Context(), principalFromContext(c), usecase.CreateAccountInput{
		UserID: req.UserID, Currency: req.Currency,
	})
	if err != nil {
		h.writeError(c, err)
		return
	}
	c.JSON(http.StatusCreated, account)
}

func (h *Handler) ListAccounts(c *gin.Context) {
	accounts, err := h.uc.ListAccounts(c.Request.Context(), principalFromContext(c))
	if err != nil {
		h.writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": accounts})
}

func (h *Handler) GetAccount(c *gin.Context) {
	account, err := h.uc.GetAccount(c.Request.Context(), principalFromContext(c), c.Param("id"))
	if err != nil {
		h.writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, account)
}

func (h *Handler) Deposit(c *gin.Context) {
	var req mutationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httpx.JSONError(c, http.StatusBadRequest, "invalid request payload")
		return
	}
	transaction, err := h.uc.Deposit(c.Request.Context(), usecase.MutationInput{
		Principal: principalFromContext(c), AccountID: req.AccountID, AmountCents: req.AmountCents,
		Reference: req.Reference, IdempotencyKey: c.GetHeader("Idempotency-Key"),
	})
	if err != nil {
		h.writeError(c, err)
		return
	}
	c.JSON(http.StatusCreated, transaction)
}

func (h *Handler) Withdraw(c *gin.Context) {
	var req mutationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httpx.JSONError(c, http.StatusBadRequest, "invalid request payload")
		return
	}
	transaction, err := h.uc.Withdraw(c.Request.Context(), usecase.MutationInput{
		Principal: principalFromContext(c), AccountID: req.AccountID, AmountCents: req.AmountCents,
		Reference: req.Reference, IdempotencyKey: c.GetHeader("Idempotency-Key"),
	})
	if err != nil {
		h.writeError(c, err)
		return
	}
	c.JSON(http.StatusCreated, transaction)
}

func (h *Handler) Transfer(c *gin.Context) {
	var req transferRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httpx.JSONError(c, http.StatusBadRequest, "invalid request payload")
		return
	}
	transaction, err := h.uc.Transfer(c.Request.Context(), usecase.TransferInput{
		Principal: principalFromContext(c), FromAccountID: req.FromAccountID, ToAccountID: req.ToAccountID,
		AmountCents: req.AmountCents, Reference: req.Reference, IdempotencyKey: c.GetHeader("Idempotency-Key"),
	})
	if err != nil {
		h.writeError(c, err)
		return
	}
	c.JSON(http.StatusCreated, transaction)
}

func (h *Handler) ListTransactions(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	transactions, err := h.uc.ListTransactions(c.Request.Context(), principalFromContext(c), limit)
	if err != nil {
		h.writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": transactions})
}

func (h *Handler) MonthlyBalances(c *gin.Context) {
	accountID := c.Query("account_id")
	months, _ := strconv.Atoi(c.DefaultQuery("months", "12"))
	points, err := h.uc.MonthlyBalances(c.Request.Context(), principalFromContext(c), accountID, months)
	if err != nil {
		h.writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": points})
}

func (h *Handler) StreamTransactions(c *gin.Context) {
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	principal := principalFromContext(c)
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	send := func() bool {
		transactions, err := h.uc.ListTransactions(c.Request.Context(), principal, 10)
		if err != nil {
			h.logger.Error("stream transactions", zap.Error(err))
			return false
		}
		payload, _ := json.Marshal(gin.H{"data": transactions})
		fmt.Fprintf(c.Writer, "event: transactions\ndata: %s\n\n", payload)
		c.Writer.Flush()
		return true
	}

	if !send() {
		return
	}
	for {
		select {
		case <-c.Request.Context().Done():
			return
		case <-ticker.C:
			if !send() {
				return
			}
		}
	}
}

func (h *Handler) AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := bearerToken(c.GetHeader("Authorization"))
		if token == "" {
			httpx.JSONError(c, http.StatusUnauthorized, "missing bearer token")
			c.Abort()
			return
		}
		principal, err := h.auth.ValidateToken(c.Request.Context(), token)
		if err != nil {
			httpx.JSONError(c, http.StatusUnauthorized, "invalid bearer token")
			c.Abort()
			return
		}
		c.Set("principal", principal)
		c.Next()
	}
}

func (h *Handler) writeError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, domain.ErrValidation):
		httpx.JSONError(c, http.StatusBadRequest, "validation failed")
	case errors.Is(err, domain.ErrForbidden):
		httpx.JSONError(c, http.StatusForbidden, "forbidden")
	case errors.Is(err, domain.ErrNotFound):
		httpx.JSONError(c, http.StatusNotFound, "record not found")
	case errors.Is(err, domain.ErrInsufficientFunds):
		httpx.JSONError(c, http.StatusConflict, "insufficient funds")
	case errors.Is(err, domain.ErrInactiveAccount):
		httpx.JSONError(c, http.StatusConflict, "inactive account")
	case errors.Is(err, domain.ErrCurrencyMismatch):
		httpx.JSONError(c, http.StatusConflict, "currency mismatch")
	default:
		h.logger.Error("transaction request failed", zap.Error(err))
		httpx.JSONError(c, http.StatusInternalServerError, "internal server error")
	}
}

func bearerToken(header string) string {
	const prefix = "Bearer "
	if !strings.HasPrefix(header, prefix) {
		return ""
	}
	return strings.TrimSpace(strings.TrimPrefix(header, prefix))
}

func principalFromContext(c *gin.Context) domain.Principal {
	principal, _ := c.Get("principal")
	return principal.(domain.Principal)
}
