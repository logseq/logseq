ALTER TABLE discussion_push_devices ADD COLUMN comments INTEGER NOT NULL DEFAULT 1 CHECK (comments IN (0, 1));
ALTER TABLE discussion_push_devices ADD COLUMN reactions INTEGER NOT NULL DEFAULT 1 CHECK (reactions IN (0, 1));
ALTER TABLE discussion_push_outbox ADD COLUMN event_kind TEXT CHECK (event_kind IN ('comment', 'reaction'));
