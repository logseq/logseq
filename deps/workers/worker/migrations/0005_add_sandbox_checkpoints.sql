create table if not exists sandbox_checkpoints (
  repo_key text not null,
  branch text not null,
  provider text not null,
  snapshot_id text not null,
  checkpoint_at integer not null,
  updated_at integer not null,
  expires_at integer not null,
  primary key (repo_key, branch)
);

create index if not exists idx_sandbox_checkpoints_expires_at
on sandbox_checkpoints (expires_at);
