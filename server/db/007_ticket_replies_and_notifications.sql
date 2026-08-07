-- Ticket replies + notifications
--
-- Adds an admin_reply/replied_at pair directly onto `tickets` (a ticket has
-- at most one reply thread in this model - simple Q&A, not a full message
-- thread) and a generic `notifications` table that other features (plan
-- expiry reminders, etc.) can reuse later without a schema change, since
-- `type` + `link`-style fields (ticket_id here) generalize past tickets.

ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS admin_reply TEXT,
  ADD COLUMN IF NOT EXISTS replied_at  TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(30) NOT NULL DEFAULT 'ticket_reply'
                CHECK (type IN ('ticket_reply')),
    title       VARCHAR(255) NOT NULL,
    body        TEXT,
    ticket_id   UUID REFERENCES tickets(id) ON DELETE CASCADE,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id      ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread  ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at   ON notifications(created_at DESC);