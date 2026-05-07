package domain

import "errors"

var (
	ErrValidation        = errors.New("validation failed")
	ErrForbidden         = errors.New("forbidden")
	ErrNotFound          = errors.New("record not found")
	ErrInsufficientFunds = errors.New("insufficient funds")
	ErrInactiveAccount   = errors.New("inactive account")
	ErrCurrencyMismatch  = errors.New("currency mismatch")
)
