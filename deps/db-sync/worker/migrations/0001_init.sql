create table if not exists graphs (
  graph_id text primary key,
  graph_name text,
  user_id text,
  schema_version text,
  created_at integer,
  updated_at integer
);

create table if not exists users (
  id text primary key,
  email text,
  email_verified integer,
  username text
);

create table if not exists user_rsa_keys (
  user_id text primary key,
  public_key text,
  encrypted_private_key text,
  created_at integer,
  updated_at integer
);

create table if not exists graph_members (
  user_id text,
  graph_id text,
  role text,
  invited_by text,
  created_at integer,
  primary key (user_id, graph_id),
  check (role in ('manager', 'member'))
);

create table if not exists graph_aes_keys (
  graph_id text,
  user_id text,
  encrypted_aes_key text,
  created_at integer,
  updated_at integer,
  primary key (graph_id, user_id)
);
