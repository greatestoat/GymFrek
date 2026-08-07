-- Personal Training support
-- Reuses membership_plans + member_plan_assignments so PT plans get the
-- same Active/Expired lifecycle, history, invoicing, and dues logic as
-- regular membership plans - only a `plan_type` discriminator and trainer
-- details are new.

ALTER TABLE membership_plans
  ADD COLUMN IF NOT EXISTS plan_type VARCHAR(20) NOT NULL DEFAULT 'membership'
  CHECK (plan_type IN ('membership', 'personal_training'));

CREATE INDEX IF NOT EXISTS idx_plans_gym_type ON membership_plans(gym_id, plan_type);

ALTER TABLE member_plan_assignments
  ADD COLUMN IF NOT EXISTS trainer_name   VARCHAR(100),
  ADD COLUMN IF NOT EXISTS trainer_mobile VARCHAR(20),
  ADD COLUMN IF NOT EXISTS trainer_fee    NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS trainer_notes  TEXT;

CREATE INDEX IF NOT EXISTS idx_assignments_gym_trainer
  ON member_plan_assignments(gym_id)
  WHERE trainer_name IS NOT NULL;