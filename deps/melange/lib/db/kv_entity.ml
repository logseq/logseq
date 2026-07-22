type entry = {
  keyword : string;
  doc : string;
  ignore_entity_when_init_upload : bool;
}

let keyword entry = entry.keyword
let doc entry = entry.doc
let ignore_entity_when_init_upload entry = entry.ignore_entity_when_init_upload

let entries =
  Rrbvec.of_array
    [|
      {
        keyword = "logseq.kv/graph-initial-schema-version";
        doc = "Graph's schema version when created";
        ignore_entity_when_init_upload = false;
      };
      {
        keyword = "logseq.kv/import-type";
        doc =
          "If graph is imported, identifies how a graph is imported including \
           which UI or CLI import process. CLI scripts can set this to a \
           custom value.\n\
          \                                                 UI values include \
           :file-graph and :sqlite-db and CLI values start with :cli e.g. \
           :cli/default.";
        ignore_entity_when_init_upload = false;
      };
      {
        keyword = "logseq.kv/imported-at";
        doc = "Time if graph is imported";
        ignore_entity_when_init_upload = false;
      };
      {
        keyword = "logseq.kv/latest-code-lang";
        doc = "Latest lang used by a #Code-block";
        ignore_entity_when_init_upload = true;
      };
      {
        keyword = "logseq.kv/graph-remote?";
        doc = "true if it's a remote graph";
        ignore_entity_when_init_upload = false;
      };
      {
        keyword = "logseq.kv/local-graph-uuid";
        doc = "Store graph-uuid if it's a local graph";
        ignore_entity_when_init_upload = true;
      };
      {
        keyword = "logseq.kv/graph-rtc-e2ee?";
        doc = "true if it's a rtc graph with E2EE enabled";
        ignore_entity_when_init_upload = false;
      };
      {
        keyword = "logseq.kv/graph-local-tx";
        doc = "local rtc tx-id";
        ignore_entity_when_init_upload = true;
      };
      {
        keyword = "logseq.kv/schema-version";
        doc = "Graph's current schema version";
        ignore_entity_when_init_upload = false;
      };
      {
        keyword = "logseq.kv/remote-schema-version";
        doc =
          "Graph's remote schema version.\n\
           RTC won't start when major-schema-versions don't match";
        ignore_entity_when_init_upload = true;
      };
      {
        keyword = "logseq.kv/graph-last-gc-at";
        doc = "Last time graph gc at";
        ignore_entity_when_init_upload = true;
      };
      {
        keyword = "logseq.kv/graph-uuid";
        doc = "Store graph-uuid if it's a rtc enabled graph";
        ignore_entity_when_init_upload = true;
      };
      {
        keyword = "logseq.kv/graph-created-at";
        doc = "Graph's created at time";
        ignore_entity_when_init_upload = false;
      };
      {
        keyword = "logseq.kv/graph-backup-folder";
        doc = "Backup folder for automated backup feature";
        ignore_entity_when_init_upload = true;
      };
      {
        keyword = "logseq.kv/db-type";
        doc = "Set to \"db\" if it's a db-graph";
        ignore_entity_when_init_upload = false;
      };
    |]
