package usecase

import (
	"testing"

	"github.com/modiva/fintech-core-api/services/transaction/internal/domain"
)

func TestNormalizeCurrency(t *testing.T) {
	if got := normalizeCurrency("usd"); got != "USD" {
		t.Fatalf("expected USD, got %q", got)
	}
	if got := normalizeCurrency("US1"); got != "" {
		t.Fatalf("expected invalid currency, got %q", got)
	}
}

func TestValidateMutation(t *testing.T) {
	err := validateMutation("not-a-uuid", 100)
	if err != domain.ErrValidation {
		t.Fatalf("expected validation error, got %v", err)
	}
}
