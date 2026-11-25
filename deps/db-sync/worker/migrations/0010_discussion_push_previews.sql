ALTER TABLE discussion_push_outbox ADD COLUMN sender_name TEXT;
ALTER TABLE discussion_push_outbox ADD COLUMN avatar_url TEXT;
ALTER TABLE discussion_push_outbox ADD COLUMN reaction_glyph TEXT;
ALTER TABLE discussion_push_outbox ADD COLUMN comment_preview TEXT;

CREATE TRIGGER encrypted_graph_remove_discussion_previews
AFTER UPDATE OF graph_e2ee ON graphs
WHEN NEW.graph_e2ee IS NOT 0
BEGIN
  UPDATE discussion_push_outbox SET comment_preview = NULL WHERE graph_id = NEW.graph_id;
END;
