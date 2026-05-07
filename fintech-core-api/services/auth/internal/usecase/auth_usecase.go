package usecase

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"

	"github.com/modiva/fintech-core-api/services/auth/internal/domain"
	"github.com/modiva/fintech-core-api/services/auth/internal/security"
	"github.com/modiva/fintech-core-api/services/auth/internal/validator"
)

type UserRepository interface {
	Create(ctx context.Context, user domain.User, passwordHash string) error
	FindByEmail(ctx context.Context, email string) (*domain.User, string, error)
	FindByID(ctx context.Context, id string) (*domain.User, error)
}

type TokenService interface {
	Generate(user domain.User) (string, error)
}

type AuthUsecase struct {
	users UserRepository
	jwt   TokenService
}

type RegisterInput struct {
	Email    string
	Password string
	FullName string
}

type LoginInput struct {
	Email    string
	Password string
}

type AuthResult struct {
	User        domain.User
	AccessToken string
}

func NewAuthUsecase(users UserRepository, jwt TokenService) *AuthUsecase {
	return &AuthUsecase{users: users, jwt: jwt}
}

func (uc *AuthUsecase) Register(ctx context.Context, input RegisterInput) (AuthResult, error) {
	return uc.createUser(ctx, input.Email, input.Password, input.FullName, domain.RoleCustomer)
}

func (uc *AuthUsecase) EnsureBootstrapAdmin(ctx context.Context, email, password string) error {
	normalizedEmail, err := validator.NormalizeEmail(email)
	if err != nil {
		return err
	}
	if _, _, err := uc.users.FindByEmail(ctx, normalizedEmail); err == nil {
		return nil
	} else if !errors.Is(err, domain.ErrNotFound) {
		return err
	}
	_, err = uc.createUser(ctx, normalizedEmail, password, "FinTech Admin", domain.RoleAdmin)
	return err
}

func (uc *AuthUsecase) Login(ctx context.Context, input LoginInput) (AuthResult, error) {
	email, err := validator.NormalizeEmail(input.Email)
	if err != nil {
		return AuthResult{}, domain.ErrInvalidCredentials
	}
	user, passwordHash, err := uc.users.FindByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			return AuthResult{}, domain.ErrInvalidCredentials
		}
		return AuthResult{}, err
	}
	if user.Status != domain.StatusActive || !security.ComparePassword(passwordHash, input.Password) {
		return AuthResult{}, domain.ErrInvalidCredentials
	}
	token, err := uc.jwt.Generate(*user)
	if err != nil {
		return AuthResult{}, err
	}
	return AuthResult{User: *user, AccessToken: token}, nil
}

func (uc *AuthUsecase) GetUser(ctx context.Context, id string) (domain.User, error) {
	user, err := uc.users.FindByID(ctx, id)
	if err != nil {
		return domain.User{}, err
	}
	return *user, nil
}

func (uc *AuthUsecase) createUser(ctx context.Context, email, password, fullName string, role domain.Role) (AuthResult, error) {
	normalizedEmail, err := validator.NormalizeEmail(email)
	if err != nil {
		return AuthResult{}, domain.ErrValidation
	}
	if err := validator.ValidatePassword(password); err != nil {
		return AuthResult{}, err
	}
	if err := validator.ValidateFullName(fullName); err != nil {
		return AuthResult{}, err
	}
	if !role.Valid() {
		return AuthResult{}, domain.ErrValidation
	}

	passwordHash, err := security.HashPassword(password)
	if err != nil {
		return AuthResult{}, err
	}

	user := domain.User{
		ID:       uuid.NewString(),
		Email:    normalizedEmail,
		FullName: strings.TrimSpace(fullName),
		Role:     role,
		Status:   domain.StatusActive,
	}
	if err := uc.users.Create(ctx, user, passwordHash); err != nil {
		return AuthResult{}, err
	}
	token, err := uc.jwt.Generate(user)
	if err != nil {
		return AuthResult{}, err
	}
	return AuthResult{User: user, AccessToken: token}, nil
}
