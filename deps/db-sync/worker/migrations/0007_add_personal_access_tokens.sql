create table if not exists personal_access_tokens (
  id text primary key,
  user_id text not null,
  graph_id text not null,
  token_hash text not null unique,
  token_prefix text not null,
  permission text not null,
  created_at integer not null,
  expires_at integer not null,
  last_used_at integer,
  check (permission in ('read', 'write', 'both'))
);

create index if not exists idx_personal_access_tokens_user_created_at
on personal_access_tokens (user_id, created_at desc);

create index if not exists idx_personal_access_tokens_graph_id
on personal_access_tokens (graph_id);
