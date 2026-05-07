CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  currency CHAR(3) NOT NULL,
  balance_cents BIGINT NOT NULL DEFAULT 0 CHECK (balance_cents >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer')),
  from_account_id UUID NULL REFERENCES accounts(id),
  to_account_id UUID NULL REFERENCES accounts(id),
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  currency CHAR(3) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'posted' CHECK (status IN ('posted', 'reversed')),
  reference VARCHAR(255) NOT NULL DEFAULT '',
  idempotency_key VARCHAR(128) NULL,
  created_by VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (from_account_id IS NOT NULL OR to_account_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_from_account ON transactions(from_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_account ON transactions(to_account_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_idempotency_actor
  ON transactions(created_by, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
