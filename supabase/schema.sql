create table if not exists integrations (
  id bigserial primary key,
  provider text not null,              -- 'ghl' or 'wafeq'
  location_id text not null default '',
  company_id text not null default '',
  user_id text not null default '',
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists integrations_unique
on integrations(provider, location_id, company_id, user_id);
