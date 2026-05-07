package http

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"go.uber.org/zap"

	"github.com/modiva/fintech-core-api/pkg/httpx"
	"github.com/modiva/fintech-core-api/services/auth/internal/domain"
	"github.com/modiva/fintech-core-api/services/auth/internal/security"
	"github.com/modiva/fintech-core-api/services/auth/internal/usecase"
)

type RouterConfig struct {
	Usecase       *usecase.AuthUsecase
	JWT           *security.JWTService
	Logger        *zap.Logger
	AllowedOrigin string
}

type Handler struct {
	uc     *usecase.AuthUsecase
	jwt    *security.JWTService
	logger *zap.Logger
}

type registerRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
	FullName string `json:"full_name" binding:"required"`
}

type loginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type userResponse struct {
	ID       string `json:"id"`
	Email    string `json:"email"`
	FullName string `json:"full_name"`
	Role     string `json:"role"`
	Status   string `json:"status"`
}

type authResponse struct {
	User        userResponse `json:"user"`
	AccessToken string       `json:"access_token"`
	TokenType   string       `json:"token_type"`
}

func NewRouter(cfg RouterConfig) *gin.Engine {
	if cfg.Logger == nil {
		cfg.Logger = zap.NewNop()
	}
	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	router.Use(gin.Recovery(), httpx.RequestID(), httpx.SecurityHeaders(cfg.AllowedOrigin))

	handler := &Handler{uc: cfg.Usecase, jwt: cfg.JWT, logger: cfg.Logger}

	router.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	v1 := router.Group("/v1")
	v1.POST("/auth/register", handler.Register)
	v1.POST("/auth/login", handler.Login)
	v1.GET("/me", handler.AuthRequired(), handler.Me)
	v1.GET("/admin/users/:id", handler.AuthRequired(), handler.RequireRole(domain.RoleAdmin), handler.GetUser)

	return router
}

// Register godoc
// @Summary Register customer
// @Tags auth
// @Accept json
// @Produce json
// @Param request body registerRequest true "Register payload"
// @Success 201 {object} authResponse
// @Router /auth/register [post]
func (h *Handler) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httpx.JSONError(c, http.StatusBadRequest, "invalid request payload")
		return
	}
	result, err := h.uc.Register(c.Request.Context(), usecase.RegisterInput{
		Email: req.Email, Password: req.Password, FullName: req.FullName,
	})
	if err != nil {
		h.writeError(c, err)
		return
	}
	c.JSON(http.StatusCreated, toAuthResponse(result))
}

// Login godoc
// @Summary Login
// @Tags auth
// @Accept json
// @Produce json
// @Param request body loginRequest true "Login payload"
// @Success 200 {object} authResponse
// @Router /auth/login [post]
func (h *Handler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httpx.JSONError(c, http.StatusBadRequest, "invalid request payload")
		return
	}
	result, err := h.uc.Login(c.Request.Context(), usecase.LoginInput{Email: req.Email, Password: req.Password})
	if err != nil {
		h.writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, toAuthResponse(result))
}

func (h *Handler) Me(c *gin.Context) {
	claims := c.MustGet("claims").(*security.Claims)
	user, err := h.uc.GetUser(c.Request.Context(), claims.UserID)
	if err != nil {
		h.writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, toUserResponse(user))
}

func (h *Handler) GetUser(c *gin.Context) {
	user, err := h.uc.GetUser(c.Request.Context(), c.Param("id"))
	if err != nil {
		h.writeError(c, err)
		return
	}
	c.JSON(http.StatusOK, toUserResponse(user))
}

func (h *Handler) AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := bearerToken(c.GetHeader("Authorization"))
		if token == "" {
			httpx.JSONError(c, http.StatusUnauthorized, "missing bearer token")
			c.Abort()
			return
		}
		claims, err := h.jwt.Parse(token)
		if err != nil {
			httpx.JSONError(c, http.StatusUnauthorized, "invalid bearer token")
			c.Abort()
			return
		}
		c.Set("claims", claims)
		c.Next()
	}
}

func (h *Handler) RequireRole(roles ...domain.Role) gin.HandlerFunc {
	allowed := make(map[string]struct{}, len(roles))
	for _, role := range roles {
		allowed[string(role)] = struct{}{}
	}
	return func(c *gin.Context) {
		claims := c.MustGet("claims").(*security.Claims)
		if _, ok := allowed[claims.Role]; !ok {
			httpx.JSONError(c, http.StatusForbidden, "forbidden")
			c.Abort()
			return
		}
		c.Next()
	}
}

func (h *Handler) writeError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, domain.ErrInvalidCredentials):
		httpx.JSONError(c, http.StatusUnauthorized, "invalid credentials")
	case errors.Is(err, domain.ErrDuplicateEmail):
		httpx.JSONError(c, http.StatusConflict, "email already registered")
	case errors.Is(err, domain.ErrNotFound):
		httpx.JSONError(c, http.StatusNotFound, "record not found")
	case errors.Is(err, domain.ErrForbidden):
		httpx.JSONError(c, http.StatusForbidden, "forbidden")
	default:
		h.logger.Error("auth request failed", zap.Error(err))
		httpx.JSONError(c, http.StatusBadRequest, err.Error())
	}
}

func bearerToken(header string) string {
	const prefix = "Bearer "
	if !strings.HasPrefix(header, prefix) {
		return ""
	}
	return strings.TrimSpace(strings.TrimPrefix(header, prefix))
}

func toAuthResponse(result usecase.AuthResult) authResponse {
	return authResponse{
		User:        toUserResponse(result.User),
		AccessToken: result.AccessToken,
		TokenType:   "Bearer",
	}
}

func toUserResponse(user domain.User) userResponse {
	return userResponse{
		ID: user.ID, Email: user.Email, FullName: user.FullName,
		Role: string(user.Role), Status: string(user.Status),
	}
}
