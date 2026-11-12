create index if not exists idx_oauth_authorization_codes_graph
on oauth_authorization_codes (graph_id);

create index if not exists idx_oauth_login_sessions_expires
on oauth_login_sessions (expires_at);

create index if not exists idx_oauth_authorization_codes_expires
on oauth_authorization_codes (expires_at);

create index if not exists idx_oauth_access_tokens_expires
on oauth_access_tokens (expires_at);

create index if not exists idx_oauth_refresh_tokens_expires
on oauth_refresh_tokens (expires_at);
