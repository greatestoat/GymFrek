-- Session Replacement
-- Adds a "reason" for why a session (refresh_token row) was revoked, and a
-- partial index to make "find this user's active session(s)" fast — this is
-- the query run on every login to enforce single-session-per-user.

ALTER TABLE refresh_tokens
    ADD COLUMN IF NOT EXISTS revoked_reason VARCHAR(20);
    -- expected values: 'logout' | 'replaced' | 'rotated' | 'inactive' | 'expired'

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_active
    ON refresh_tokens (user_id)
    WHERE revoked_at IS NULL;