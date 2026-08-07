-- Support Center / Help Center
-- One table backs all three forms on the Support page (contact/support,
-- bug report, feature suggestion) - `type` distinguishes them so the admin
-- side can filter, while `subject`/`message` are reused across all three
-- (e.g. "Issue" maps to subject, "Description" maps to message for bug
-- reports; feature suggestions only use message).

CREATE TABLE IF NOT EXISTS tickets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type        VARCHAR(20) NOT NULL CHECK (type IN ('support', 'bug', 'feature')),
    status      VARCHAR(20) NOT NULL DEFAULT 'open'
                CHECK (status IN ('open', 'in_progress', 'resolved')),
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    name        VARCHAR(150),
    gym_name    VARCHAR(150),
    email       VARCHAR(255),
    subject     VARCHAR(255),
    message     TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_type ON tickets(type);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);

-- Reuses the trigger function already defined in schema.sql
DROP TRIGGER IF EXISTS trg_tickets_updated_at ON tickets;
CREATE TRIGGER trg_tickets_updated_at
BEFORE UPDATE ON tickets
FOR EACH ROW EXECUTE FUNCTION set_updated_at();