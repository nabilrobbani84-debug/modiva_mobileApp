package security_test

import (
	"testing"
	"time"

	"github.com/modiva/fintech-core-api/services/auth/internal/domain"
	"github.com/modiva/fintech-core-api/services/auth/internal/security"
)

func TestJWTServiceGenerateAndParse(t *testing.T) {
	service := security.NewJWTService("test-secret-with-enough-length", time.Hour)
	token, err := service.Generate(domain.User{
		ID: "user-1", Email: "user@example.com", Role: domain.RoleCustomer,
	})
	if err != nil {
		t.Fatalf("generate token: %v", err)
	}

	claims, err := service.Parse(token)
	if err != nil {
		t.Fatalf("parse token: %v", err)
	}
	if claims.UserID != "user-1" || claims.Role != string(domain.RoleCustomer) {
		t.Fatalf("unexpected claims: %#v", claims)
	}
}
