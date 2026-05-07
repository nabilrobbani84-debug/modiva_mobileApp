package config

import "os"

type Config struct {
	Environment    string
	HTTPAddr       string
	PostgresDSN    string
	AuthGRPCTarget string
	AllowedOrigin  string
}

func Load() Config {
	return Config{
		Environment:    getEnv("ENVIRONMENT", "development"),
		HTTPAddr:       getEnv("TRANSACTION_HTTP_ADDR", ":8082"),
		PostgresDSN:    getEnv("POSTGRES_DSN", "postgres://fintech:fintech@localhost:5432/txdb?sslmode=disable"),
		AuthGRPCTarget: getEnv("AUTH_GRPC_TARGET", "localhost:9091"),
		AllowedOrigin:  getEnv("ALLOWED_ORIGIN", "*"),
	}
}

func getEnv(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
