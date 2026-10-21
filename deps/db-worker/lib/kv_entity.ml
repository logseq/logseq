(* Port of logseq.db.frontend.kv-entity — kv-entities keyword config map.
   cljs config is {:doc str :rtc {:rtc/ignore-entity-when-init-upload
   bool}?}; the nested :rtc map is flattened into a flag here since it is
   the only :rtc key in use. *)

type kv_config =
  { doc : string
  ; rtc_ignore_entity_when_init_upload : bool
  }

let kv_entities : (string * kv_config) list =
  Common_defkeywords.defkeywords
    [ ( "logseq.kv/db-type"
      , { doc = "Set to \"db\" if it's a db-graph"
        ; rtc_ignore_entity_when_init_upload = false
        } )
    ; ( "logseq.kv/graph-uuid"
      , { doc = "Store graph-uuid if it's a rtc enabled graph"
        ; rtc_ignore_entity_when_init_upload = true
        } )
    ; ( "logseq.kv/local-graph-uuid"
      , { doc = "Store graph-uuid if it's a local graph"
        ; rtc_ignore_entity_when_init_upload = true
        } )
    ; ( "logseq.kv/import-type"
      , { doc =
            "If graph is imported, identifies how a graph is imported \
             including which UI or CLI import process. CLI scripts can set \
             this to a custom value. UI values include :file-graph and \
             :sqlite-db and CLI values start with :cli e.g. :cli/default."
        ; rtc_ignore_entity_when_init_upload = false
        } )
    ; ( "logseq.kv/imported-at"
      , { doc = "Time if graph is imported"
        ; rtc_ignore_entity_when_init_upload = false
        } )
    ; ( "logseq.kv/graph-local-tx"
      , { doc = "local rtc tx-id"
        ; rtc_ignore_entity_when_init_upload = true
        } )
    ; ( "logseq.kv/schema-version"
      , { doc = "Graph's current schema version"
        ; rtc_ignore_entity_when_init_upload = false
        } )
    ; ( "logseq.kv/remote-schema-version"
      , { doc =
            "Graph's remote schema version. RTC won't start when \
             major-schema-versions don't match"
        ; rtc_ignore_entity_when_init_upload = true
        } )
    ; ( "logseq.kv/graph-created-at"
      , { doc = "Graph's created at time"
        ; rtc_ignore_entity_when_init_upload = false
        } )
    ; ( "logseq.kv/latest-code-lang"
      , { doc = "Latest lang used by a #Code-block"
        ; rtc_ignore_entity_when_init_upload = true
        } )
    ; ( "logseq.kv/graph-backup-folder"
      , { doc = "Backup folder for automated backup feature"
        ; rtc_ignore_entity_when_init_upload = true
        } )
    ; ( "logseq.kv/graph-initial-schema-version"
      , { doc = "Graph's schema version when created"
        ; rtc_ignore_entity_when_init_upload = false
        } )
    ; ( "logseq.kv/graph-last-gc-at"
      , { doc = "Last time graph gc at"
        ; rtc_ignore_entity_when_init_upload = true
        } )
    ; ( "logseq.kv/graph-rtc-e2ee?"
      , { doc = "true if it's a rtc graph with E2EE enabled"
        ; rtc_ignore_entity_when_init_upload = false
        } )
    ; ( "logseq.kv/graph-remote?"
      , { doc = "true if it's a remote graph"
        ; rtc_ignore_entity_when_init_upload = false
        } )
    ]
