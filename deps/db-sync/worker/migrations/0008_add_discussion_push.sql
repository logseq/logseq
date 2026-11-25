CREATE TABLE discussion_push_devices (
  installation_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('apns', 'apns-sandbox', 'fcm')),
  token TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (platform, token)
);

CREATE INDEX discussion_push_devices_by_user ON discussion_push_devices (user_id, updated_at);

CREATE TABLE discussion_push_outbox (
  graph_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  next_attempt_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (graph_id, event_id, recipient_id)
);

CREATE INDEX discussion_push_due ON discussion_push_outbox (next_attempt_at);
CREATE INDEX discussion_push_sender ON discussion_push_outbox (sender_id, created_at);

CREATE TABLE discussion_push_receipts (
  graph_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  installation_id TEXT NOT NULL,
  sent_at INTEGER NOT NULL,
  PRIMARY KEY (graph_id, event_id, recipient_id, installation_id)
);
