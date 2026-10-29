create table if not exists oauth_apps (
  id text primary key,
  owner_user_id text not null,
  name text not null,
  description text,
  redirect_uris text not null,
  status text not null,
  review_note text,
  created_at integer not null,
  updated_at integer not null,
  reviewed_at integer,
  check (status in ('pending', 'approved', 'rejected'))
);

create index if not exists idx_oauth_apps_owner_created_at
on oauth_apps (owner_user_id, created_at desc);

create index if not exists idx_oauth_apps_status_created_at
on oauth_apps (status, created_at asc);

create table if not exists oauth_login_sessions (
  id text primary key,
  user_id text not null,
  email text,
  username text,
  csrf_token text not null,
  created_at integer not null,
  expires_at integer not null
);

create table if not exists oauth_authorization_codes (
  code_hash text primary key,
  app_id text not null,
  user_id text not null,
  graph_id text not null,
  redirect_uri text not null,
  scope text not null,
  code_challenge text not null,
  expires_at integer not null,
  created_at integer not null
);

create index if not exists idx_oauth_authorization_codes_app
on oauth_authorization_codes (app_id);

create table if not exists oauth_access_tokens (
  id text primary key,
  token_hash text not null unique,
  token_prefix text not null,
  app_id text not null,
  user_id text not null,
  graph_id text not null,
  scope text not null,
  expires_at integer not null,
  created_at integer not null
);

create index if not exists idx_oauth_access_tokens_app
on oauth_access_tokens (app_id);

create index if not exists idx_oauth_access_tokens_graph
on oauth_access_tokens (graph_id);

create table if not exists oauth_refresh_tokens (
  token_hash text primary key,
  app_id text not null,
  user_id text not null,
  graph_id text not null,
  scope text not null,
  expires_at integer not null,
  created_at integer not null,
  revoked_at integer
);

create index if not exists idx_oauth_refresh_tokens_app
on oauth_refresh_tokens (app_id);

create index if not exists idx_oauth_refresh_tokens_graph
on oauth_refresh_tokens (graph_id);
