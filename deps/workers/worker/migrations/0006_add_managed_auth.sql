create table if not exists managed_auth_sessions (
  auth_id text primary key,
  user_id text not null,
  provider text not null,
  auth_method text not null,
  access_token text,
  refresh_token text,
  id_token text,
  token_type text,
  scope text,
  issued_at integer not null,
  expires_at integer not null default 0,
  created_at integer not null,
  updated_at integer not null,
  revoked_at integer
);

create unique index if not exists idx_managed_auth_sessions_user_provider_method
on managed_auth_sessions (user_id, provider, auth_method);

create index if not exists idx_managed_auth_sessions_user_updated_at
on managed_auth_sessions (user_id, updated_at desc);
