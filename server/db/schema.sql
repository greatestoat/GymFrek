-- gym_frek database schema
-- Create the database first (run as a superuser / from psql):
--   CREATE DATABASE gym_frek;
-- Then connect to it and run this file:
--   \c gym_frek
--   \i schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- gives us gen_random_uuid()

CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100)  NOT NULL,
    email           VARCHAR(255)  NOT NULL UNIQUE,
    password_hash   TEXT          NOT NULL,
    goal            VARCHAR(50)   DEFAULT 'general_fitness',
    avatar_color    VARCHAR(20)   DEFAULT '#C6FF3D',
    is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
    failed_attempts SMALLINT      NOT NULL DEFAULT 0,
    locked_until    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Refresh tokens are stored HASHED, never in plaintext.
-- This lets us revoke/rotate them and support logout / "logout everywhere".
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash   TEXT NOT NULL UNIQUE,
    user_agent   TEXT,
    ip_address   VARCHAR(64),
    expires_at   TIMESTAMPTZ NOT NULL,
    revoked_at   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Keep updated_at fresh automatically
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TABLE IF NOT EXISTS gyms (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id        UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(150) NOT NULL UNIQUE,
    owner_name      VARCHAR(100) NOT NULL,
    mobile          VARCHAR(20)  NOT NULL,
    email           VARCHAR(255) NOT NULL,
    address         TEXT         NOT NULL,
    city            VARCHAR(100) NOT NULL,
    state           VARCHAR(100) NOT NULL,
    pincode         VARCHAR(12)  NOT NULL,
    opening_time    TIME         NOT NULL,
    closing_time    TIME         NOT NULL,
    logo_url        TEXT,
    description     TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
 
CREATE INDEX IF NOT EXISTS idx_gyms_owner_id ON gyms(owner_id);
 
DROP TRIGGER IF EXISTS trg_gyms_updated_at ON gyms;
CREATE TRIGGER trg_gyms_updated_at
BEFORE UPDATE ON gyms
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
 
-- ---------------------------------------------------------------------------
-- MEMBERSHIP PLANS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS membership_plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id          UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    duration_months SMALLINT NOT NULL CHECK (duration_months IN (1, 3, 6, 12)),
    price           NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    discount        NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
    final_price     NUMERIC(10,2) NOT NULL CHECK (final_price >= 0),
    features        TEXT[] NOT NULL DEFAULT '{}',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (gym_id, name)
);
 
CREATE INDEX IF NOT EXISTS idx_plans_gym_id ON membership_plans(gym_id);
 
DROP TRIGGER IF EXISTS trg_plans_updated_at ON membership_plans;
CREATE TRIGGER trg_plans_updated_at
BEFORE UPDATE ON membership_plans
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
 
-- ---------------------------------------------------------------------------
-- MEMBERS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS members (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id              UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    full_name           VARCHAR(150) NOT NULL,
    mobile              VARCHAR(20)  NOT NULL,
    email               VARCHAR(255),
    gender              VARCHAR(20),
    date_of_birth       DATE,
    address             TEXT,
    emergency_contact   VARCHAR(20),
    height_cm           NUMERIC(5,2),
    weight_kg           NUMERIC(5,2),
    medical_notes       TEXT,
    join_date           DATE NOT NULL DEFAULT CURRENT_DATE,
    membership_status   VARCHAR(20) NOT NULL DEFAULT 'Active'
                         CHECK (membership_status IN ('Active', 'Expired', 'Paused')),
    photo_url           TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
 
CREATE INDEX IF NOT EXISTS idx_members_gym_id ON members(gym_id);
CREATE INDEX IF NOT EXISTS idx_members_gym_status ON members(gym_id, membership_status);
CREATE INDEX IF NOT EXISTS idx_members_gym_join_date ON members(gym_id, join_date);
CREATE INDEX IF NOT EXISTS idx_members_name_trgm ON members USING gin (to_tsvector('simple', full_name));
 
DROP TRIGGER IF EXISTS trg_members_updated_at ON members;
CREATE TRIGGER trg_members_updated_at
BEFORE UPDATE ON members
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
 
-- ---------------------------------------------------------------------------
-- MEMBER <-> PLAN ASSIGNMENTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS member_plan_assignments (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id        UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    member_id     UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    plan_id       UUID NOT NULL REFERENCES membership_plans(id) ON DELETE RESTRICT,
    start_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date      DATE NOT NULL,
    price_paid    NUMERIC(10,2) NOT NULL CHECK (price_paid >= 0),
    status        VARCHAR(20) NOT NULL DEFAULT 'Active'
                  CHECK (status IN ('Active', 'Expired', 'Cancelled')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
 
CREATE INDEX IF NOT EXISTS idx_assignments_gym_id ON member_plan_assignments(gym_id);
CREATE INDEX IF NOT EXISTS idx_assignments_member_id ON member_plan_assignments(member_id);
CREATE INDEX IF NOT EXISTS idx_assignments_gym_end_date ON member_plan_assignments(gym_id, end_date);
 
-- ---------------------------------------------------------------------------
-- PAYMENTS (optional, used for revenue reporting)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id          UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    member_id       UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    assignment_id   UUID REFERENCES member_plan_assignments(id) ON DELETE SET NULL,
    amount          NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
    payment_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method  VARCHAR(30) NOT NULL DEFAULT 'cash',
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
 
CREATE INDEX IF NOT EXISTS idx_payments_gym_id ON payments(gym_id);
CREATE INDEX IF NOT EXISTS idx_payments_gym_date ON payments(gym_id, payment_date);