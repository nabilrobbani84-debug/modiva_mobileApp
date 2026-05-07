package domain

import "errors"

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrDuplicateEmail     = errors.New("email already registered")
	ErrNotFound           = errors.New("record not found")
	ErrForbidden          = errors.New("forbidden")
	ErrValidation         = errors.New("validation failed")
)
