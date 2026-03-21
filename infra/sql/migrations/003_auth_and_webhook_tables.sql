create table if not exists refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_refresh_tokens_user_revoked on refresh_tokens(user_id, revoked_at);
create index if not exists idx_refresh_tokens_expires_at on refresh_tokens(expires_at);

create table if not exists stripe_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event_type text not null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_stripe_webhook_events_created_at on stripe_webhook_events(created_at desc);
