package validator

import (
	"errors"
	"net/mail"
	"strings"
	"unicode"
)

func NormalizeEmail(email string) (string, error) {
	normalized := strings.ToLower(strings.TrimSpace(email))
	if normalized == "" {
		return "", errors.New("email is required")
	}
	if _, err := mail.ParseAddress(normalized); err != nil {
		return "", errors.New("email format is invalid")
	}
	return normalized, nil
}

func ValidatePassword(password string) error {
	if len(password) < 12 {
		return errors.New("password must contain at least 12 characters")
	}
	var hasUpper, hasLower, hasNumber bool
	for _, r := range password {
		hasUpper = hasUpper || unicode.IsUpper(r)
		hasLower = hasLower || unicode.IsLower(r)
		hasNumber = hasNumber || unicode.IsDigit(r)
	}
	if !hasUpper || !hasLower || !hasNumber {
		return errors.New("password must contain uppercase, lowercase, and number")
	}
	return nil
}

func ValidateFullName(name string) error {
	name = strings.TrimSpace(name)
	if len(name) < 2 || len(name) > 120 {
		return errors.New("full name must be between 2 and 120 characters")
	}
	return nil
}
