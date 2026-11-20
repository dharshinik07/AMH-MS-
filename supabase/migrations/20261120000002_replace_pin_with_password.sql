-- Migration: 20261120000002_replace_pin_with_password.sql
-- Description: Replace legacy PIN-based authentication with ID (username) + Password architecture.
-- Drops pin_hash column after creating a secure backup table.

BEGIN;

-- 1. Create secure backup table for legacy PIN hashes prior to dropping
CREATE TABLE IF NOT EXISTS users_pin_backup AS
SELECT 
    id AS user_id,
    pin_hash,
    NOW() AS backed_up_at
FROM users;

-- 2. Drop legacy pin_hash column from users table
ALTER TABLE users DROP COLUMN IF EXISTS pin_hash;

-- 3. Add modern Username + Password columns to users table
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS username TEXT,
    ADD COLUMN IF NOT EXISTS username_lower TEXT,
    ADD COLUMN IF NOT EXISTS password_hash TEXT,
    ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS uses_initial_password BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS failed_attempts INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- 4. Unique case-insensitive index on username_lower
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower ON users(username_lower);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 5. Seed owner username identifiers (display 'Aishowner', lower 'aishowner')
UPDATE users
SET 
    username = 'Aishowner',
    username_lower = 'aishowner',
    uses_initial_password = true
WHERE email = 'sundararajan@aishwaryahostels.com' OR role = 'owner';

COMMIT;
