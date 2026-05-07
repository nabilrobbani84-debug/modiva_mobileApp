package security

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"io"
)

type FieldCipher struct {
	gcm cipher.AEAD
}

func NewFieldCipher(key string) (*FieldCipher, error) {
	rawKey, err := decodeKey(key)
	if err != nil {
		return nil, err
	}
	block, err := aes.NewCipher(rawKey)
	if err != nil {
		return nil, err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	return &FieldCipher{gcm: gcm}, nil
}

func (c *FieldCipher) Encrypt(plainText string) ([]byte, error) {
	nonce := make([]byte, c.gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, err
	}
	sealed := c.gcm.Seal(nonce, nonce, []byte(plainText), nil)
	return sealed, nil
}

func (c *FieldCipher) Decrypt(cipherText []byte) (string, error) {
	if len(cipherText) < c.gcm.NonceSize() {
		return "", errors.New("ciphertext is too short")
	}
	nonce := cipherText[:c.gcm.NonceSize()]
	payload := cipherText[c.gcm.NonceSize():]
	plainText, err := c.gcm.Open(nil, nonce, payload, nil)
	if err != nil {
		return "", err
	}
	return string(plainText), nil
}

func HashEmail(secret, email string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(email))
	return hex.EncodeToString(mac.Sum(nil))
}

func decodeKey(key string) ([]byte, error) {
	if decoded, err := base64.StdEncoding.DecodeString(key); err == nil && validAESKeySize(len(decoded)) {
		return decoded, nil
	}
	raw := []byte(key)
	if validAESKeySize(len(raw)) {
		return raw, nil
	}
	return nil, errors.New("FIELD_ENCRYPTION_KEY must be 16, 24, or 32 bytes, optionally base64 encoded")
}

func validAESKeySize(size int) bool {
	return size == 16 || size == 24 || size == 32
}
