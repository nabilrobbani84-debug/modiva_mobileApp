CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  email_hash CHAR(64) NOT NULL UNIQUE,
  email_ciphertext VARBINARY(768) NOT NULL,
  full_name_ciphertext VARBINARY(1024) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  status ENUM('active', 'blocked') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_status (status)
);
