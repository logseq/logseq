(* logseq.db.frontend.kv-entity — kv entities used by logseq db.
   The cljs ns builds the map via defkeywords pairs; here the same
   (kw -> config) assoc list keeps the data verbatim so derived
   selections (e.g. :rtc/ignore-entity-when-init-upload) stay faithful. *)

type config =
  { doc : string
  ; rtc : (string * bool) list
  }

let kv_entities : (string * config) list =
  [ ( "logseq.kv/db-type"
    , { doc = "Set to \"db\" if it's a db-graph"; rtc = [] } )
  ; ( "logseq.kv/graph-uuid"
    , { doc = "Store graph-uuid if it's a rtc enabled graph"
      ; rtc = [ "rtc/ignore-entity-when-init-upload", true ]
      } )
  ; ( "logseq.kv/local-graph-uuid"
    , { doc = "Store graph-uuid if it's a local graph"
      ; rtc = [ "rtc/ignore-entity-when-init-upload", true ]
      } )
  ; ( "logseq.kv/import-type"
    , { doc =
          "If graph is imported, identifies how a graph is imported \
           including which UI or CLI import process. CLI scripts can \
           set this to a custom value.\n\
           UI values include :file-graph and :sqlite-db and CLI values \
           start with :cli e.g. :cli/default."
      ; rtc = []
      } )
  ; ( "logseq.kv/imported-at"
    , { doc = "Time if graph is imported"; rtc = [] } )
  ; ( "logseq.kv/graph-local-tx"
    , { doc = "local rtc tx-id"
      ; rtc = [ "rtc/ignore-entity-when-init-upload", true ]
      } )
  ; ( "logseq.kv/schema-version"
    , { doc = "Graph's current schema version"; rtc = [] } )
  ; ( "logseq.kv/remote-schema-version"
    , { doc =
          "Graph's remote schema version.\n\
           RTC won't start when major-schema-versions don't match"
      ; rtc = [ "rtc/ignore-entity-when-init-upload", true ]
      } )
  ; ( "logseq.kv/graph-created-at"
    , { doc = "Graph's created at time"; rtc = [] } )
  ; ( "logseq.kv/latest-code-lang"
    , { doc = "Latest lang used by a #Code-block"
      ; rtc = [ "rtc/ignore-entity-when-init-upload", true ]
      } )
  ; ( "logseq.kv/graph-backup-folder"
    , { doc = "Backup folder for automated backup feature"
      ; rtc = [ "rtc/ignore-entity-when-init-upload", true ]
      } )
  ; ( "logseq.kv/graph-initial-schema-version"
    , { doc = "Graph's schema version when created"; rtc = [] } )
  ; ( "logseq.kv/graph-last-gc-at"
    , { doc = "Last time graph gc at"
      ; rtc = [ "rtc/ignore-entity-when-init-upload", true ]
      } )
  ; ( "logseq.kv/graph-rtc-e2ee?"
    , { doc = "true if it's a rtc graph with E2EE enabled"; rtc = [] } )
  ; ( "logseq.kv/graph-remote?"
    , { doc = "true if it's a remote graph"; rtc = [] } )
  ]

let doc (ident : string) : string option =
  match List.assoc_opt ident kv_entities with
  | Some c -> Some c.doc
  | None -> None

(* keep (fn [[k {:keys [rtc]}]] (:rtc/ignore-entity-when-init-upload rtc)) *)
let ignore_entity_when_init_upload (ident : string) : bool =
  match List.assoc_opt ident kv_entities with
  | Some c -> List.mem_assoc "rtc/ignore-entity-when-init-upload" c.rtc
  | None -> false

let entities_ignored_when_init_upload : string list =
  List.filter_map
    (fun (ident, _c) ->
      if ignore_entity_when_init_upload ident then Some ident else None)
    kv_entities
