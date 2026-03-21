-- ================================================================
-- Golf Charity Subscription Platform — Full PostgreSQL Schema
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------
-- 1. USERS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  full_name       TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER','ADMIN')),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  default_charity_id UUID,
  donation_percent NUMERIC(5,2) NOT NULL DEFAULT 10 CHECK (donation_percent >= 10 AND donation_percent <= 100),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users (email);

-- ----------------------------------------------------------------
-- 2. REFRESH TOKENS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_token_hash ON refresh_tokens (token_hash);
CREATE INDEX idx_refresh_user ON refresh_tokens (user_id);

-- ----------------------------------------------------------------
-- 3. CHARITIES
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS charities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  category        TEXT NOT NULL,
  country_code    VARCHAR(3) NOT NULL DEFAULT 'IN',
  mission         TEXT NOT NULL,
  hero_image_url  TEXT,
  website_url     TEXT,
  verified        BOOLEAN NOT NULL DEFAULT FALSE,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_charities_slug ON charities (slug);
CREATE INDEX idx_charities_category ON charities (category);

ALTER TABLE users ADD CONSTRAINT fk_users_charity FOREIGN KEY (default_charity_id) REFERENCES charities(id);

-- ----------------------------------------------------------------
-- 4. SUBSCRIPTIONS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT UNIQUE,
  plan_interval           TEXT NOT NULL CHECK (plan_interval IN ('MONTHLY','YEARLY')),
  status                  TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','TRIALING','PAST_DUE','CANCELLED','EXPIRED')),
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  cancel_at_period_end    BOOLEAN DEFAULT FALSE,
  cancelled_at            TIMESTAMPTZ,
  ended_at                TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subs_user ON subscriptions (user_id);
CREATE INDEX idx_subs_status ON subscriptions (status);

-- ----------------------------------------------------------------
-- 5. STRIPE WEBHOOK EVENTS (Idempotency)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      TEXT UNIQUE NOT NULL,
  event_type    TEXT NOT NULL,
  processed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- 6. SCORES
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score       INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
  played_at   DATE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scores_user ON scores (user_id, created_at DESC);

-- ----------------------------------------------------------------
-- 7. DRAWS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS draws (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month_key     VARCHAR(7) NOT NULL,
  mode          TEXT NOT NULL DEFAULT 'RANDOM' CHECK (mode IN ('RANDOM','ALGORITHMIC')),
  status        TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PUBLISHED')),
  draw_numbers  INTEGER[] NOT NULL,
  created_by    UUID REFERENCES users(id),
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_draws_month ON draws (month_key);
CREATE INDEX idx_draws_status ON draws (status);

-- ----------------------------------------------------------------
-- 8. PRIZE POOLS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prize_pools (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id                   UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  currency                  VARCHAR(3) NOT NULL DEFAULT 'INR',
  active_subscribers_count  INTEGER NOT NULL DEFAULT 0,
  gross_subscription_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  prize_pool_amount         NUMERIC(14,2) NOT NULL DEFAULT 0,
  jackpot_rollover_in       NUMERIC(14,2) NOT NULL DEFAULT 0,
  jackpot_rollover_out      NUMERIC(14,2) NOT NULL DEFAULT 0,
  tier5_amount              NUMERIC(14,2) NOT NULL DEFAULT 0,
  tier4_amount              NUMERIC(14,2) NOT NULL DEFAULT 0,
  tier3_amount              NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- 9. WINNERS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS winners (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id               UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  matched_count         INTEGER NOT NULL CHECK (matched_count BETWEEN 3 AND 5),
  gross_amount          NUMERIC(14,2) NOT NULL DEFAULT 0,
  proof_url             TEXT,
  verification_status   TEXT NOT NULL DEFAULT 'UNVERIFIED' CHECK (verification_status IN ('UNVERIFIED','PENDING','VERIFIED','REJECTED')),
  verified_by           UUID REFERENCES users(id),
  verified_at           TIMESTAMPTZ,
  payment_status        TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING','PAID','FAILED')),
  paid_at               TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_winners_user ON winners (user_id);
CREATE INDEX idx_winners_draw ON winners (draw_id);

-- ----------------------------------------------------------------
-- 10. DONATIONS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS donations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  charity_id  UUID NOT NULL REFERENCES charities(id),
  amount      NUMERIC(14,2) NOT NULL,
  currency    VARCHAR(3) NOT NULL DEFAULT 'INR',
  source      TEXT NOT NULL DEFAULT 'SUBSCRIPTION',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_donations_user ON donations (user_id);
CREATE INDEX idx_donations_charity ON donations (charity_id);

-- ================================================================
-- SEED DATA — Demo Charities
-- ================================================================
INSERT INTO charities (name, slug, category, country_code, mission, hero_image_url, verified, active) VALUES
  ('Green Earth Foundation', 'green-earth-foundation', 'Environment', 'IN', 'Planting 1 million trees across rural India by 2030', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600', TRUE, TRUE),
  ('Teach India Trust', 'teach-india-trust', 'Education', 'IN', 'Providing quality education to underprivileged children in 500 villages', 'https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=600', TRUE, TRUE),
  ('Clean Water Initiative', 'clean-water-initiative', 'Health', 'IN', 'Delivering clean drinking water to 100,000 families across 12 states', 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=600', TRUE, TRUE),
  ('Sports For All', 'sports-for-all', 'Sports', 'IN', 'Making sports accessible to youth from underprivileged backgrounds', 'https://images.unsplash.com/photo-1461896836934-bd45ba8c0e78?w=600', TRUE, TRUE),
  ('Hunger Free India', 'hunger-free-india', 'Humanitarian', 'IN', 'Fighting hunger by providing 10 million meals annually to those in need', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600', TRUE, TRUE),
  ('Digital Literacy Mission', 'digital-literacy-mission', 'Technology', 'IN', 'Bridging the digital divide by equipping 50,000 students with computer skills', 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600', FALSE, TRUE)
ON CONFLICT DO NOTHING;
