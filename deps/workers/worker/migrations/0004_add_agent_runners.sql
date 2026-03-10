create table if not exists agent_runners (
  runner_id text not null,
  user_id text not null,
  base_url text not null,
  agent_token text,
  access_client_id text,
  access_client_secret text,
  status text not null default 'online',
  max_sessions integer not null default 1,
  active_sessions integer not null default 0,
  last_heartbeat_at integer not null,
  created_at integer not null,
  updated_at integer not null,
  primary key (user_id, runner_id)
);

create index if not exists idx_agent_runners_user_status_heartbeat
on agent_runners (user_id, status, last_heartbeat_at desc);
