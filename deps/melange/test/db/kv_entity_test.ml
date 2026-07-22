open Melange_db

let expect_equal label actual expected =
  if actual <> expected then failwith (label ^ ": unexpected value")

let () =
  Fest.test "KV catalog preserves legacy entries values and order" (fun () ->
      let actual =
        Kv_entity.entries
        |> Rrbvec.map (fun entry ->
            ( Kv_entity.keyword entry,
              Kv_entity.doc entry,
              Kv_entity.ignore_entity_when_init_upload entry ))
        |> Rrbvec.to_array
      in
      expect_equal "KV entries" actual
        [|
          ( "logseq.kv/graph-initial-schema-version",
            "Graph's schema version when created",
            false );
          ( "logseq.kv/import-type",
            "If graph is imported, identifies how a graph is imported \
             including which UI or CLI import process. CLI scripts can set \
             this to a custom value.\n\
            \                                                 UI values \
             include :file-graph and :sqlite-db and CLI values start with :cli \
             e.g. :cli/default.",
            false );
          ("logseq.kv/imported-at", "Time if graph is imported", false);
          ( "logseq.kv/latest-code-lang",
            "Latest lang used by a #Code-block",
            true );
          ("logseq.kv/graph-remote?", "true if it's a remote graph", false);
          ( "logseq.kv/local-graph-uuid",
            "Store graph-uuid if it's a local graph",
            true );
          ( "logseq.kv/graph-rtc-e2ee?",
            "true if it's a rtc graph with E2EE enabled",
            false );
          ("logseq.kv/graph-local-tx", "local rtc tx-id", true);
          ("logseq.kv/schema-version", "Graph's current schema version", false);
          ( "logseq.kv/remote-schema-version",
            "Graph's remote schema version.\n\
             RTC won't start when major-schema-versions don't match",
            true );
          ("logseq.kv/graph-last-gc-at", "Last time graph gc at", true);
          ( "logseq.kv/graph-uuid",
            "Store graph-uuid if it's a rtc enabled graph",
            true );
          ("logseq.kv/graph-created-at", "Graph's created at time", false);
          ( "logseq.kv/graph-backup-folder",
            "Backup folder for automated backup feature",
            true );
          ("logseq.kv/db-type", "Set to \"db\" if it's a db-graph", false);
        |])
