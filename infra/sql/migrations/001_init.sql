create extension if not exists pgcrypto;

create table charities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null,
  country_code text not null,
  mission text not null,
  hero_image_url text,
  website_url text,
  verified boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  full_name text not null,
  role text not null check (role in ('USER', 'ADMIN')),
  country_code text not null default 'IN',
  preferred_currency text not null default 'INR',
  default_charity_id uuid references charities(id),
  donation_percent numeric(5,2) not null default 10.00 check (donation_percent >= 10 and donation_percent <= 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  plan_interval text not null check (plan_interval in ('MONTHLY', 'YEARLY')),
  status text not null check (status in ('ACTIVE', 'CANCELLED', 'EXPIRED', 'PAST_DUE', 'TRIALING')),
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  cancelled_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_subscriptions_user_status on subscriptions(user_id, status);
create index idx_subscriptions_period_end on subscriptions(current_period_end);

create table scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  score smallint not null check (score between 1 and 45),
  played_at date not null,
  source text not null default 'MANUAL',
  created_at timestamptz not null default now()
);
create index idx_scores_user_created_desc on scores(user_id, created_at desc);

create table draws (
  id uuid primary key default gen_random_uuid(),
  month_key text not null unique,
  mode text not null check (mode in ('RANDOM', 'ALGORITHMIC')),
  status text not null check (status in ('DRAFT', 'SIMULATED', 'PUBLISHED', 'CLOSED')),
  draw_numbers smallint[] not null check (array_length(draw_numbers, 1) = 5),
  simulation_payload jsonb,
  published_at timestamptz,
  created_by uuid not null references users(id),
  created_at timestamptz not null default now()
);

create table prize_pools (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null unique references draws(id) on delete cascade,
  currency text not null,
  active_subscribers_count int not null check (active_subscribers_count >= 0),
  gross_subscription_amount numeric(14,2) not null,
  prize_pool_amount numeric(14,2) not null,
  jackpot_rollover_in numeric(14,2) not null default 0,
  jackpot_rollover_out numeric(14,2) not null default 0,
  tier5_amount numeric(14,2) not null,
  tier4_amount numeric(14,2) not null,
  tier3_amount numeric(14,2) not null,
  created_at timestamptz not null default now()
);

create table winners (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references draws(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  matched_count smallint not null check (matched_count in (3,4,5)),
  gross_amount numeric(14,2) not null,
  proof_url text,
  verification_status text not null default 'PENDING' check (verification_status in ('PENDING', 'VERIFIED', 'REJECTED')),
  payment_status text not null default 'PENDING' check (payment_status in ('PENDING', 'PAID', 'FAILED')),
  verified_by uuid references users(id),
  verified_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique(draw_id, user_id)
);
create index idx_winners_draw_tier on winners(draw_id, matched_count);
create index idx_winners_payment_status on winners(payment_status);

create table donations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  charity_id uuid not null references charities(id),
  subscription_id uuid references subscriptions(id),
  source text not null check (source in ('SUBSCRIPTION_SPLIT', 'EXTRA_DONATION')),
  amount numeric(14,2) not null check (amount > 0),
  currency text not null,
  external_ref text,
  created_at timestamptz not null default now()
);
create index idx_donations_charity_created on donations(charity_id, created_at desc);
