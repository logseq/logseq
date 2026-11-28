CREATE TABLE IF NOT EXISTS bots (
  id uuid PRIMARY KEY,
  owner text NOT NULL,
  name text NOT NULL,
  default_agent text NOT NULL,
  repository text NOT NULL DEFAULT '',
  graph_id uuid,
  graph_block_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bots_owner ON bots (owner, created_at DESC);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY,
  bot_id uuid NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  root_message_id uuid NOT NULL UNIQUE,
  title text NOT NULL,
  agent text NOT NULL,
  repository text NOT NULL,
  provider_session_id text,
  provider_url text,
  status text NOT NULL DEFAULT 'queued',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bot_id, id)
);

CREATE INDEX IF NOT EXISTS sessions_bot_order ON sessions (bot_id, updated_at DESC, id);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY,
  bot_id uuid NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  session_id uuid,
  seq bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  author text NOT NULL,
  body text NOT NULL,
  proposal jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (bot_id, session_id) REFERENCES sessions(bot_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS messages_bot_order ON messages (bot_id, seq DESC) WHERE session_id IS NULL;
CREATE INDEX IF NOT EXISTS messages_bot_activity ON messages (bot_id, seq DESC);
CREATE INDEX IF NOT EXISTS messages_session_order ON messages (session_id, seq DESC) WHERE session_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS bot_runs (
  message_id uuid PRIMARY KEY REFERENCES messages(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  seq bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  state text NOT NULL DEFAULT 'queued',
  due_at timestamptz NOT NULL DEFAULT now(),
  provider_cursor text,
  automation boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS bot_runs_ready ON bot_runs (due_at, seq) WHERE state IN ('queued', 'poll');

CREATE TABLE IF NOT EXISTS bot_devin_starts (
  session_id uuid PRIMARY KEY,
  started_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bot_devin_starts_time ON bot_devin_starts (started_at);

CREATE TABLE IF NOT EXISTS bot_automations (
  id uuid PRIMARY KEY,
  bot_id uuid NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  hour smallint NOT NULL CHECK (hour BETWEEN 0 AND 23),
  minute smallint NOT NULL CHECK (minute BETWEEN 0 AND 59),
  time_zone text NOT NULL,
  agent text,
  next_at timestamptz NOT NULL,
  enabled boolean NOT NULL DEFAULT true
);

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS reply_count integer NOT NULL DEFAULT 0;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS provider_cursor text;
ALTER TABLE bot_runs ADD COLUMN IF NOT EXISTS last_reply text;

CREATE TABLE IF NOT EXISTS bot_graph_exports (
  id uuid PRIMARY KEY REFERENCES bot_runs(message_id) ON DELETE CASCADE,
  owner text NOT NULL,
  graph_id uuid NOT NULL,
  block_id uuid NOT NULL,
  title text NOT NULL,
  state text NOT NULL DEFAULT 'queued',
  due_at timestamptz NOT NULL DEFAULT now()
);
