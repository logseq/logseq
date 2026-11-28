CREATE TABLE IF NOT EXISTS bots (
  id uuid PRIMARY KEY,
  owner text NOT NULL,
  name text NOT NULL,
  default_agent text NOT NULL,
  repository text NOT NULL DEFAULT '',
  graph_id uuid NOT NULL,
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

CREATE INDEX IF NOT EXISTS bot_automations_due ON bot_automations (next_at, id) WHERE enabled;

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


ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]';

CREATE TABLE IF NOT EXISTS bot_uploads (
  id uuid PRIMARY KEY,
  bot_id uuid NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  owner text NOT NULL,
  payload bytea NOT NULL,
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bot_uploads_message ON bot_uploads (message_id) WHERE message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS bot_uploads_unclaimed ON bot_uploads (created_at) WHERE message_id IS NULL;

ALTER TABLE bots ADD COLUMN IF NOT EXISTS shared_graph_id uuid;
ALTER TABLE bots ALTER COLUMN graph_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS bots_shared_graph ON bots (shared_graph_id) WHERE shared_graph_id IS NOT NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS handoff jsonb;

ALTER TABLE messages ADD COLUMN IF NOT EXISTS actor text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS requested_agent text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS requested_agents text[];

ALTER TABLE bot_runs ADD COLUMN IF NOT EXISTS agent text;
ALTER TABLE bot_runs ADD COLUMN IF NOT EXISTS workflow_root_id uuid REFERENCES messages(id) ON DELETE CASCADE;
ALTER TABLE bot_runs ADD COLUMN IF NOT EXISTS remaining_agents text[] NOT NULL DEFAULT '{}';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS in_reply_to uuid;
CREATE INDEX IF NOT EXISTS bot_runs_thread_order ON bot_runs (session_id, seq);

CREATE TABLE IF NOT EXISTS bot_thread_agents (
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  agent text NOT NULL,
  provider_session_id text,
  provider_url text,
  provider_cursor text,
  PRIMARY KEY (session_id, agent)
);

INSERT INTO bot_thread_agents (session_id,agent,provider_session_id,provider_url,provider_cursor)
  SELECT id,agent,provider_session_id,provider_url,provider_cursor FROM sessions WHERE provider_session_id IS NOT NULL
  ON CONFLICT (session_id,agent) DO NOTHING;

CREATE TABLE IF NOT EXISTS bot_runners (
  id uuid PRIMARY KEY,
  owner text NOT NULL,
  name text NOT NULL,
  token_hash bytea NOT NULL,
  agents text[] NOT NULL,
  repository text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  seen_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE INDEX IF NOT EXISTS bot_runners_owner ON bot_runners (owner) WHERE revoked_at IS NULL;
ALTER TABLE bot_thread_agents ADD COLUMN IF NOT EXISTS runner_id uuid REFERENCES bot_runners(id);
ALTER TABLE bot_thread_agents ADD COLUMN IF NOT EXISTS provider_transport text;
ALTER TABLE bot_runs ADD COLUMN IF NOT EXISTS runner_id uuid REFERENCES bot_runners(id);
ALTER TABLE bot_runs ADD COLUMN IF NOT EXISTS lease_id uuid;
ALTER TABLE bot_runs ADD COLUMN IF NOT EXISTS lease_until timestamptz;
ALTER TABLE bot_runs ADD COLUMN IF NOT EXISTS result_hash bytea;
ALTER TABLE bot_runs ADD COLUMN IF NOT EXISTS work_from text;
CREATE INDEX IF NOT EXISTS bot_runs_lease ON bot_runs (lease_until) WHERE lease_until IS NOT NULL;

-- Work started by versions without a durable lease has an unknown outcome.
WITH unconfirmed AS (
  UPDATE bot_runs SET state='attention'
  WHERE state='working' AND runner_id IS NULL AND lease_until IS NULL RETURNING session_id
) UPDATE sessions SET status='attention',updated_at=now()
  WHERE id IN (SELECT session_id FROM unconfirmed);

CREATE TABLE IF NOT EXISTS bot_events (
  version bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  bot_id uuid NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  session_id uuid,
  due_at timestamptz NOT NULL DEFAULT now(),
  attempts integer NOT NULL DEFAULT 0,
  refresh_graph boolean NOT NULL DEFAULT false,
  UNIQUE NULLS NOT DISTINCT (bot_id, session_id)
);
CREATE INDEX IF NOT EXISTS bot_events_due ON bot_events (due_at, version);

CREATE OR REPLACE FUNCTION queue_bot_event() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  changed_bot uuid;
  changed_session uuid;
  refresh_graph_visibility boolean := false;
BEGIN
  IF TG_TABLE_NAME = 'bots' THEN
    changed_bot := NEW.id;
    IF TG_OP = 'UPDATE' THEN
      refresh_graph_visibility := OLD.shared_graph_id IS DISTINCT FROM NEW.shared_graph_id;
    END IF;
  ELSE
    changed_bot := NEW.bot_id;
  END IF;
  IF TG_TABLE_NAME = 'sessions' THEN
    changed_session := NEW.id;
  ELSIF TG_TABLE_NAME = 'messages' THEN
    changed_session := NEW.session_id;
  END IF;
  INSERT INTO bot_events (bot_id, session_id, refresh_graph)
  VALUES (changed_bot, changed_session, refresh_graph_visibility)
  ON CONFLICT (bot_id, session_id) DO UPDATE SET version=DEFAULT, due_at=EXCLUDED.due_at,
    attempts=0, refresh_graph=bot_events.refresh_graph OR EXCLUDED.refresh_graph;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER bot_changed AFTER INSERT OR UPDATE ON bots
  FOR EACH ROW EXECUTE FUNCTION queue_bot_event();
CREATE OR REPLACE TRIGGER bot_session_created AFTER INSERT ON sessions
  FOR EACH ROW EXECUTE FUNCTION queue_bot_event();
CREATE OR REPLACE TRIGGER bot_session_status AFTER UPDATE ON sessions
  FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.provider_url IS DISTINCT FROM NEW.provider_url)
  EXECUTE FUNCTION queue_bot_event();
CREATE OR REPLACE TRIGGER bot_message_added AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION queue_bot_event();
CREATE OR REPLACE TRIGGER bot_automation_changed AFTER INSERT OR UPDATE ON bot_automations
  FOR EACH ROW EXECUTE FUNCTION queue_bot_event();
