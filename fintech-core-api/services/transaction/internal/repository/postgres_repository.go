package repository

import (
	"context"
	"database/sql"
	"errors"
	"sort"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/modiva/fintech-core-api/services/transaction/internal/domain"
	"github.com/modiva/fintech-core-api/services/transaction/internal/usecase"
)

type PostgresRepository struct {
	db *pgxpool.Pool
}

func NewPostgresRepository(db *pgxpool.Pool) *PostgresRepository {
	return &PostgresRepository{db: db}
}

func (r *PostgresRepository) CreateAccount(ctx context.Context, userID, currency string) (domain.Account, error) {
	row := r.db.QueryRow(ctx, `
		INSERT INTO accounts (id, user_id, currency, balance_cents, status)
		VALUES ($1, $2, $3, 0, 'active')
		RETURNING id, user_id, currency, balance_cents, status, created_at, updated_at
	`, uuid.NewString(), userID, currency)
	return scanAccount(row)
}

func (r *PostgresRepository) GetAccount(ctx context.Context, id string) (domain.Account, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, user_id, currency, balance_cents, status, created_at, updated_at
		FROM accounts
		WHERE id = $1
	`, id)
	return scanAccount(row)
}

func (r *PostgresRepository) ListAccounts(ctx context.Context, principal domain.Principal) ([]domain.Account, error) {
	query := `
		SELECT id, user_id, currency, balance_cents, status, created_at, updated_at
		FROM accounts
		WHERE ($1::boolean = true OR user_id = $2)
		ORDER BY created_at DESC
		LIMIT 100
	`
	rows, err := r.db.Query(ctx, query, principal.IsAdmin(), principal.UserID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	accounts := make([]domain.Account, 0)
	for rows.Next() {
		account, err := scanAccount(rows)
		if err != nil {
			return nil, err
		}
		accounts = append(accounts, account)
	}
	return accounts, rows.Err()
}

func (r *PostgresRepository) Deposit(ctx context.Context, input usecase.MutationInput) (domain.Transaction, error) {
	return r.mutateSingleAccount(ctx, input, "deposit")
}

func (r *PostgresRepository) Withdraw(ctx context.Context, input usecase.MutationInput) (domain.Transaction, error) {
	return r.mutateSingleAccount(ctx, input, "withdrawal")
}

func (r *PostgresRepository) Transfer(ctx context.Context, input usecase.TransferInput) (domain.Transaction, error) {
	tx, err := r.db.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.Serializable})
	if err != nil {
		return domain.Transaction{}, err
	}
	defer tx.Rollback(ctx)

	if existing, err := findByIdempotencyKey(ctx, tx, input.IdempotencyKey, input.Principal.UserID); err == nil {
		return existing, nil
	} else if !errors.Is(err, domain.ErrNotFound) {
		return domain.Transaction{}, err
	}

	locked, err := lockAccounts(ctx, tx, input.FromAccountID, input.ToAccountID)
	if err != nil {
		return domain.Transaction{}, err
	}
	fromAccount := locked[input.FromAccountID]
	toAccount := locked[input.ToAccountID]

	if !input.Principal.IsAdmin() && fromAccount.UserID != input.Principal.UserID {
		return domain.Transaction{}, domain.ErrForbidden
	}
	if fromAccount.Status != "active" || toAccount.Status != "active" {
		return domain.Transaction{}, domain.ErrInactiveAccount
	}
	if fromAccount.Currency != toAccount.Currency {
		return domain.Transaction{}, domain.ErrCurrencyMismatch
	}
	if fromAccount.BalanceCents < input.AmountCents {
		return domain.Transaction{}, domain.ErrInsufficientFunds
	}

	fromAccount.BalanceCents -= input.AmountCents
	toAccount.BalanceCents += input.AmountCents
	if err := updateBalance(ctx, tx, fromAccount.ID, fromAccount.BalanceCents); err != nil {
		return domain.Transaction{}, err
	}
	if err := updateBalance(ctx, tx, toAccount.ID, toAccount.BalanceCents); err != nil {
		return domain.Transaction{}, err
	}

	transaction, err := insertTransaction(ctx, tx, transactionInsert{
		Type: "transfer", FromAccountID: input.FromAccountID, ToAccountID: input.ToAccountID,
		AmountCents: input.AmountCents, Currency: fromAccount.Currency, Reference: input.Reference,
		IdempotencyKey: input.IdempotencyKey, CreatedBy: input.Principal.UserID,
	})
	if err != nil {
		return domain.Transaction{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return domain.Transaction{}, err
	}
	return transaction, nil
}

func (r *PostgresRepository) ListTransactions(ctx context.Context, principal domain.Principal, limit int) ([]domain.Transaction, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, type, from_account_id, to_account_id, amount_cents, currency, status, reference,
		       idempotency_key, created_by, created_at
		FROM transactions
		WHERE ($1::boolean = true)
		   OR created_by = $2
		   OR from_account_id IN (SELECT id FROM accounts WHERE user_id = $2)
		   OR to_account_id IN (SELECT id FROM accounts WHERE user_id = $2)
		ORDER BY created_at DESC
		LIMIT $3
	`, principal.IsAdmin(), principal.UserID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	transactions := make([]domain.Transaction, 0)
	for rows.Next() {
		transaction, err := scanTransaction(rows)
		if err != nil {
			return nil, err
		}
		transactions = append(transactions, transaction)
	}
	return transactions, rows.Err()
}

func (r *PostgresRepository) MonthlyBalances(ctx context.Context, principal domain.Principal, accountID string, months int) ([]domain.MonthlyBalance, error) {
	account, err := r.GetAccount(ctx, accountID)
	if err != nil {
		return nil, err
	}
	if !principal.IsAdmin() && account.UserID != principal.UserID {
		return nil, domain.ErrForbidden
	}

	rows, err := r.db.Query(ctx, `
		WITH monthly_delta AS (
		  SELECT date_trunc('month', created_at) AS month,
		         SUM(
		           CASE
		             WHEN to_account_id = $1 THEN amount_cents
		             WHEN from_account_id = $1 THEN -amount_cents
		             ELSE 0
		           END
		         ) AS delta
		  FROM transactions
		  WHERE status = 'posted'
		    AND (from_account_id = $1 OR to_account_id = $1)
		    AND created_at >= date_trunc('month', now()) - ($2::int * INTERVAL '1 month')
		  GROUP BY 1
		)
		SELECT to_char(month, 'YYYY-MM') AS month,
		       (SUM(delta) OVER (ORDER BY month))::bigint AS balance_cents
		FROM monthly_delta
		ORDER BY month
	`, accountID, months)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	points := make([]domain.MonthlyBalance, 0)
	for rows.Next() {
		var point domain.MonthlyBalance
		if err := rows.Scan(&point.Month, &point.BalanceCents); err != nil {
			return nil, err
		}
		points = append(points, point)
	}
	return points, rows.Err()
}

func (r *PostgresRepository) mutateSingleAccount(ctx context.Context, input usecase.MutationInput, mutationType string) (domain.Transaction, error) {
	tx, err := r.db.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.Serializable})
	if err != nil {
		return domain.Transaction{}, err
	}
	defer tx.Rollback(ctx)

	if existing, err := findByIdempotencyKey(ctx, tx, input.IdempotencyKey, input.Principal.UserID); err == nil {
		return existing, nil
	} else if !errors.Is(err, domain.ErrNotFound) {
		return domain.Transaction{}, err
	}

	account, err := lockAccount(ctx, tx, input.AccountID)
	if err != nil {
		return domain.Transaction{}, err
	}
	if !input.Principal.IsAdmin() && account.UserID != input.Principal.UserID {
		return domain.Transaction{}, domain.ErrForbidden
	}
	if account.Status != "active" {
		return domain.Transaction{}, domain.ErrInactiveAccount
	}

	var fromAccountID, toAccountID string
	switch mutationType {
	case "deposit":
		account.BalanceCents += input.AmountCents
		toAccountID = account.ID
	case "withdrawal":
		if account.BalanceCents < input.AmountCents {
			return domain.Transaction{}, domain.ErrInsufficientFunds
		}
		account.BalanceCents -= input.AmountCents
		fromAccountID = account.ID
	default:
		return domain.Transaction{}, domain.ErrValidation
	}

	if err := updateBalance(ctx, tx, account.ID, account.BalanceCents); err != nil {
		return domain.Transaction{}, err
	}

	transaction, err := insertTransaction(ctx, tx, transactionInsert{
		Type: mutationType, FromAccountID: fromAccountID, ToAccountID: toAccountID,
		AmountCents: input.AmountCents, Currency: account.Currency, Reference: input.Reference,
		IdempotencyKey: input.IdempotencyKey, CreatedBy: input.Principal.UserID,
	})
	if err != nil {
		return domain.Transaction{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return domain.Transaction{}, err
	}
	return transaction, nil
}

type transactionInsert struct {
	Type           string
	FromAccountID  string
	ToAccountID    string
	AmountCents    int64
	Currency       string
	Reference      string
	IdempotencyKey string
	CreatedBy      string
}

func lockAccounts(ctx context.Context, tx pgx.Tx, accountIDs ...string) (map[string]domain.Account, error) {
	ordered := append([]string(nil), accountIDs...)
	sort.Strings(ordered)

	accounts := make(map[string]domain.Account, len(ordered))
	for _, id := range ordered {
		account, err := lockAccount(ctx, tx, id)
		if err != nil {
			return nil, err
		}
		accounts[id] = account
	}
	return accounts, nil
}

func lockAccount(ctx context.Context, tx pgx.Tx, id string) (domain.Account, error) {
	row := tx.QueryRow(ctx, `
		SELECT id, user_id, currency, balance_cents, status, created_at, updated_at
		FROM accounts
		WHERE id = $1
		FOR UPDATE
	`, id)
	return scanAccount(row)
}

func updateBalance(ctx context.Context, tx pgx.Tx, accountID string, balanceCents int64) error {
	_, err := tx.Exec(ctx, `
		UPDATE accounts
		SET balance_cents = $2, updated_at = now()
		WHERE id = $1
	`, accountID, balanceCents)
	return err
}

func insertTransaction(ctx context.Context, tx pgx.Tx, input transactionInsert) (domain.Transaction, error) {
	row := tx.QueryRow(ctx, `
		INSERT INTO transactions
			(id, type, from_account_id, to_account_id, amount_cents, currency, status, reference, idempotency_key, created_by)
		VALUES ($1, $2, NULLIF($3, '')::uuid, NULLIF($4, '')::uuid, $5, $6, 'posted', $7, NULLIF($8, ''), $9)
		RETURNING id, type, from_account_id, to_account_id, amount_cents, currency, status, reference,
		          idempotency_key, created_by, created_at
	`, uuid.NewString(), input.Type, input.FromAccountID, input.ToAccountID, input.AmountCents, input.Currency,
		strings.TrimSpace(input.Reference), strings.TrimSpace(input.IdempotencyKey), input.CreatedBy)
	return scanTransaction(row)
}

func findByIdempotencyKey(ctx context.Context, tx pgx.Tx, key, actor string) (domain.Transaction, error) {
	if strings.TrimSpace(key) == "" {
		return domain.Transaction{}, domain.ErrNotFound
	}
	row := tx.QueryRow(ctx, `
		SELECT id, type, from_account_id, to_account_id, amount_cents, currency, status, reference,
		       idempotency_key, created_by, created_at
		FROM transactions
		WHERE idempotency_key = $1 AND created_by = $2
	`, strings.TrimSpace(key), actor)
	return scanTransaction(row)
}

type rowScanner interface {
	Scan(dest ...interface{}) error
}

func scanAccount(row rowScanner) (domain.Account, error) {
	var account domain.Account
	if err := row.Scan(&account.ID, &account.UserID, &account.Currency, &account.BalanceCents, &account.Status, &account.CreatedAt, &account.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Account{}, domain.ErrNotFound
		}
		return domain.Account{}, err
	}
	return account, nil
}

func scanTransaction(row rowScanner) (domain.Transaction, error) {
	var transaction domain.Transaction
	var from, to, idempotency sql.NullString
	if err := row.Scan(&transaction.ID, &transaction.Type, &from, &to, &transaction.AmountCents, &transaction.Currency,
		&transaction.Status, &transaction.Reference, &idempotency, &transaction.CreatedBy, &transaction.CreatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Transaction{}, domain.ErrNotFound
		}
		return domain.Transaction{}, err
	}
	if from.Valid {
		transaction.FromAccountID = &from.String
	}
	if to.Valid {
		transaction.ToAccountID = &to.String
	}
	if idempotency.Valid {
		transaction.IdempotencyKey = &idempotency.String
	}
	return transaction, nil
}
