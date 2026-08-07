-- Adds invoice numbering + an editable summary message to each paid assignment.
ALTER TABLE member_plan_assignments
  ADD COLUMN IF NOT EXISTS invoice_number  VARCHAR(30),
  ADD COLUMN IF NOT EXISTS summary_message TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_assignments_invoice_number
  ON member_plan_assignments(invoice_number) WHERE invoice_number IS NOT NULL;