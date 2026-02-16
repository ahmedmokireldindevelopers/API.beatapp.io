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

create table if not exists ghl_webhook_events (
  id bigserial primary key,
  webhook_id text not null,
  event_type text not null,
  location_id text not null default '',
  company_id text not null default '',
  webhook_timestamp timestamptz,
  signature_valid boolean not null default false,
  status text not null,               -- 'accepted', 'ignored', 'rejected'
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now()
);

create unique index if not exists ghl_webhook_events_webhook_id_unique
on ghl_webhook_events(webhook_id);

create index if not exists ghl_webhook_events_event_type_idx
on ghl_webhook_events(event_type);

create index if not exists ghl_webhook_events_received_at_idx
on ghl_webhook_events(received_at desc);
