-- gym_frek: platform admin support
-- Run after 002_gym_features.sql:
--   \i db/003_admin.sql

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'owner'
  CHECK (role IN ('owner', 'admin'));

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- No admin accounts are created here on purpose - see
-- server/scripts/createAdmin.js for how to bootstrap the first one.
-- Admin accounts are never created through a public API endpoint, only
-- through that script (or by a DBA), so there is no self-signup path to
-- platform-admin privileges.
