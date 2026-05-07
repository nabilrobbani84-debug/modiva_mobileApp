# FinTech Core API

Microservices example for secure financial transactions with Go, MySQL, PostgreSQL, gRPC, REST, Swagger, Docker Compose, and a Next.js reporting dashboard.

## Services

- `auth-service`: JWT authentication, password hashing, RBAC, encrypted user fields, MySQL persistence, REST API, and gRPC token validation.
- `transaction-service`: account creation, deposit, withdrawal, transfer, reporting APIs, PostgreSQL persistence, and row-level locking with `SELECT ... FOR UPDATE`.
- `dashboard`: Next.js reporting UI for transaction history and monthly balance visualization.

## Local Run

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Open:

- Auth Swagger: `http://localhost:8081/swagger/index.html`
- Transaction Swagger: `http://localhost:8082/swagger/index.html`
- Dashboard: `http://localhost:3000`

Default bootstrap admin comes from `.env`:

- Email: `admin@fintech.local`
- Password: `ChangeMe123!Secure`

## Database Migrations

Local orchestration runs migrations through `migrate/migrate` containers:

- Auth MySQL migrations: `services/auth/migrations/mysql`
- Transaction PostgreSQL migrations: `services/transaction/migrations/postgres`

For manual runs:

```powershell
migrate -path services/auth/migrations/mysql -database "mysql://fintech:fintech@tcp(localhost:3306)/authdb" up
migrate -path services/transaction/migrations/postgres -database "postgres://fintech:fintech@localhost:5432/txdb?sslmode=disable" up
```

## Development

```powershell
go test ./...
```

Dashboard:

```powershell
Set-Location apps/dashboard
npm install
npm run dev
```

## Security Notes

- SQL statements use parameterized queries through `database/sql` and `pgx`.
- User email and full name are encrypted with AES-GCM before storage.
- Email lookup uses HMAC-SHA256 instead of plaintext.
- Transaction mutations validate principal role and ownership.
- PostgreSQL row-level locks protect balance updates from race conditions.
- React escapes rendered values by default, and the dashboard avoids raw HTML injection.
- Replace all example secrets before deploying.
