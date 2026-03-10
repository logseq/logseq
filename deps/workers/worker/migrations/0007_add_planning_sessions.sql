create table if not exists planning_sessions (
  planning_session_id text primary key,
  user_id text not null,
  workflow_id text,
  status text not null default 'queued',
  goal_json text,
  plan_json text,
  project_json text,
  agent_json text,
  approval_status text not null default 'pending',
  require_approval integer not null default 0,
  auto_dispatch integer not null default 1,
  auto_replan integer not null default 0,
  replan_delay_sec integer not null default 0,
  scheduled_actions_json text,
  dispatch_sessions_json text,
  last_error text,
  created_at integer not null,
  updated_at integer not null
);

create index if not exists idx_planning_sessions_user_updated_at
on planning_sessions (user_id, updated_at desc);

create index if not exists idx_planning_sessions_workflow_id
on planning_sessions (workflow_id);
