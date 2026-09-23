(* logseq.db.sqlite.create-graph (deps/db/src/logseq/db/sqlite/create_graph.cljs)
   — builds the tx data that seeds a brand-new DB graph with all built-in
   entities: bootstrap classes, key-value entries, built-in properties with
   their closed-value blocks, built-in classes, initial files, and the default
   + hidden pages.

   WIRING (for the maintainer, do not register here):
   In lib/endpoint_lifecycle.ml, create_or_open_db currently calls
   `Datascript.create_conn ~schema ~storage ()` for a new graph. Wire it to:

     let conn = Datascript.create_conn ~schema ~storage () in
     let tx = Sqlite_create_graph.initial_tx_data
                (Datascript.db conn)            (* or the fresh conn's db *)
                ~config_content:(Rc.inline "templates/config.edn") ()
     in
     ignore (Datascript.transact conn tx ~tx_meta:["initial-db?", Bool true]);

   Optional args mirror the cljs `(select-keys opts [:import-type
   :graph-git-sha :creating-remote-graph?])`:
     ?import_type : value          (e.g. Keyword for the import type)
     ?graph_git_sha : string
     ?creating_remote_graph : bool

   Notes on cljs-map -> OCaml representation:
   - All intermediate entity maps are [Block_map.t] ((attr * value) alists);
     the cljs keyword keys become plain attr strings ("db/ident", "block/title").
   - The ported Db_property_build fns read "db/ident" / "logseq.property/type"
     via Block_map.string_attr, so input config maps carry String values for
     those keys even though the cljs maps hold keywords. Outputs still emit
     Keyword where the cljs tx has keywords (e.g. "db/ident" values and
     "logseq.property/type" on emitted entities come out Keyword via
     build_new_property). Where cljs stores a keyword that must resolve to an
     ident ref at transact time we keep Datascript.Keyword (datascript resolves
     keyword values on ref attrs against the evolving tx schema).
   - property-map keys passed to build_property_values_tx_m additionally carry
     "db/id" = Ref_to (Ident ident) so the created-from-property fallback
     (cljs `{:db/ident k}` nested map, which resolves to the ident entity)
     produces the identical ref. *)

open Datascript

module BM = Block_map
module P = Builtin_data

(* ---------- value <-> block-map helpers ---------- *)

(* Map value -> Block_map.t (cljs map with keyword keys). *)
let block_map_of_value (v : value) : BM.t =
  match v with
  | Map kvs ->
    List.filter_map
      (fun (k, v) ->
        match k with Keyword a | String a -> Some (a, v) | _ -> None)
      kvs
  | _ -> []

(* cljs datascript only expands nested maps into entities on ref attrs;
   a Map on a non-ref attr (e.g. :logseq.property/icon — :type :map) is
   stored as the value itself. Block_map.to_tx_entity always expands Map
   values, so we special-case them here. *)
let entity_tx (db : db) ?(hint : BM.schema_hint option) (m : BM.t) : tx_op =
  let db_id = BM.ref_attr m "db/id" in
  let attrs =
    List.filter_map
      (fun (a, v) ->
        if a = "db/id" then None
        else
          match v with
          | Map kvs
            when not
                   (Ldb.ref_attr db a
                    || List.exists
                         (fun (k, _) -> k = Keyword "db/id" || k = String "db/id")
                         kvs
                    ||
                    (match hint with
                     | Some h -> List.mem a h.BM.ref_attrs
                     | None -> false)) ->
            Some (a, One_value v)
          | _ ->
            (match BM.value_to_tx_value db ?hint a v with
             | Some tv -> Some (a, tv)
             | None -> None))
      m
  in
  Entity { db_id; attrs }

(* entity-util/property? — map has :logseq.class/Property in :block/tags *)
let property_block (m : BM.t) : bool =
  match BM.attr_value m "block/tags" with
  | Some (Set ts) | Some (Vector ts) | Some (List ts) ->
    List.mem (Keyword "logseq.class/Property") ts
  | _ -> false

(* ---------- create-graph/mark-block-as-built-in ---------- *)
let mark_block_as_built_in (m : BM.t) : BM.t =
  BM.put m "logseq.property/built-in?" (Bool true)

(* ---------- create-graph/schema->qualified-property-keyword ---------- *)

(* db-property/schema-properties-map *)
let schema_properties_map : (string * string) list =
  [ "cardinality", "db/cardinality"
  ; "type", "logseq.property/type"
  ; "hide?", "logseq.property/hide?"
  ; "public?", "logseq.property/public?"
  ; "ui-position", "logseq.property/ui-position"
  ; "view-context", "logseq.property/view-context"
  ; "classes", "logseq.property/classes" ]

(* All :schema keys in the table are simple keywords, so each is remapped or
   kept as-is; the cljs only remaps simple-keyword? keys. *)
let schema_to_qualified_property_keyword (schema : (attr * value) list)
    : (attr * value) list =
  List.map
    (fun (k, v) ->
      if not (String.contains k '/') then
        match List.assoc_opt k schema_properties_map with
        | Some k' -> k', v
        | None -> k, v
      else k, v)
    schema

(* The Db_property_build API reads "logseq.property/type" through
   Block_map.string_attr, so the qualified schema carries a String type even
   though cljs schema' keeps a keyword — build_new_property re-emits
   "logseq.property/type" as a Keyword on the entity either way. *)
let qualified_schema (schema : (attr * value) list) : BM.t =
  List.map
    (fun (k, v) ->
      match k with
      | "logseq.property/type" ->
        (match v with
         | Keyword t -> k, String t
         | _ -> k, v)
      | _ -> k, v)
    (schema_to_qualified_property_keyword schema)

(* ---------- closed-value maps ----------

   cljs cv maps: {:value v :db-ident k :uuid u :icon {...} :schema {...}
   :properties {...}}. The ported closed-values->blocks reads "db-ident" via
   string_attr, so we store a String ident (it is put back as Keyword
   "db/ident" on the emitted block — same as cljs). *)
let closed_value_to_map_value (cv : P.builtin_closed_value) : value =
  Map
    (List.filter_map
       (fun x -> x)
       [ Some (Keyword "value", cv.P.cv_value)
       ; Option.map
           (fun i -> Keyword "db-ident", String i)
           cv.P.cv_db_ident
       ; Option.map
           (fun seed ->
             Keyword "uuid",
             Uuid (Common_uuid.gen_uuid "db-ident-block-uuid" seed))
           cv.P.cv_uuid_seed
       ; Option.map
           (fun icon ->
             Keyword "icon",
             Map (List.map (fun (a, v) -> (Keyword a, v)) icon))
           cv.P.cv_icon
       ; Option.map
           (fun schema ->
             Keyword "schema",
             Map (List.map (fun (a, v) -> (Keyword a, v)) schema))
           cv.P.cv_schema
       ; Option.map
           (fun props ->
             Keyword "properties",
             Map (List.map (fun (a, v) -> (Keyword a, v)) props))
           cv.P.cv_properties ])

(* ---------- create-graph/->property-value-tx-m ---------- *)

(* cljs qualifies a properties pair when the key property's built-in schema
   type is a value-ref type (:default :url :number) without closed values, or
   when the block's :build/properties-ref-types remaps the type (entity->
   number for :logseq.property/default-value). *)
let property_value_tx_m (new_block : BM.t) (properties : (attr * value) list)
    : (attr * value) list =
  let ref_type_of (k : attr) : string option =
    match
      List.find_opt (fun (p : P.builtin_property) -> p.P.ident = k)
        P.built_in_properties
    with
    | Some p ->
      let typ =
        match List.assoc_opt "type" p.P.schema with
        | Some (Keyword t) | Some (String t) -> Some t
        | _ -> None
      in
      (match typ with
       | Some t
         when List.mem t Db_property_build.value_ref_property_types
              && p.P.closed_values = [] ->
         Some t
       | Some t ->
         (* (:build/properties-ref-types new-block) — only {:entity :number} *)
         (match BM.attr_value new_block "build/properties-ref-types" with
          | Some (Map kvs) ->
            (match
               List.find_opt
                 (fun (kk, _) -> kk = Keyword t || kk = String t)
                 kvs
             with
             | Some (_, Keyword t') | Some (_, String t') -> Some t'
             | _ -> None)
          | _ -> None)
       | None -> None)
    | None -> None
  in
  let pairs : (value * value) list =
    List.filter_map
      (fun (k, v) ->
        match ref_type_of k with
        | Some t ->
          (* cljs {:db/ident k :logseq.property/type t}; "db/id" gives the
             created-from-property fallback the same ident ref the cljs
             {:db/ident k} nested map resolves to. *)
          Some
            ( Map
                [ Keyword "db/ident", String k
                ; Keyword "db/id", Ref_to (Ident k)
                ; Keyword "logseq.property/type", Keyword t ]
            , v )
        | None -> None)
      properties
  in
  Db_property_build.build_property_values_tx_m ~pure:true new_block pairs

(* ---------- create-graph/build-properties ---------- *)

(* One entry -> [property-tx] + closed-value blocks + value-block tx
   + the merged {:block/uuid ... :properties ...} entity. *)
let build_property_entry (entry : P.builtin_property) : BM.t list =
  let db_ident =
    match entry.P.attribute with Some a -> a | None -> entry.P.ident
  in
  let schema' = qualified_schema entry.P.schema in
  let title =
    match entry.P.title with
    | Some t -> t
    | None -> Db_property_build.name_of_ident db_ident
  in
  let property, others =
    match entry.P.closed_values with
    | [] ->
      ( Db_property_build.build_new_property ~db_ident ~prop_schema:schema'
          ~title ()
      , [] )
    | cvs ->
      (match
         Db_property_build.build_closed_values db_ident title
           [ "db/ident", String db_ident
           ; "schema",
             Db_property_build.block_map_value schema'
           ; "closed-values", Vector (List.map closed_value_to_map_value cvs) ]
       with
       | property :: others -> property, others
       | [] -> invalid_arg "build-closed-values returned no property")
  in
  let new_block =
    BM.merge property
      [ "build/properties-ref-types"
      , Map [ Keyword "entity", Keyword "number" ] ]
  in
  (* No need to create property value if it's an internal ident (cljs remove) *)
  let kept_properties =
    List.filter
      (fun (_k, v) ->
        match v with
        | Keyword s -> not (Db_schema.internal_ident s)
        | _ -> true)
      entry.P.properties
  in
  let pvalue_tx_m = property_value_tx_m new_block kept_properties in
  (* cljs (mapcat #(if (set? %) % [%]) (vals pvalue-tx-m)); a bare
     lookup-ref item becomes a db/id-only map so to_tx_entity emits an
     entity with no assertions (the cljs tx resolves it to a no-op). *)
  let pvalue_blocks : BM.t list =
    List.concat_map
      (fun (_k, v) ->
        let item (v : value) : BM.t =
          match v with
          | Map _ -> block_map_of_value v
          | Ref_to r -> [ "db/id", Ref_to r ]
          | _ -> invalid_arg "property value tx item is not a block"
        in
        match v with
        | Set vs -> List.map item vs
        | _ -> [ item v ])
      pvalue_tx_m
  in
  let base =
    property
    :: others
    @ (if pvalue_tx_m = [] then [] else pvalue_blocks)
  in
  match entry.P.properties with
  | [] -> base
  | _ ->
    let merged =
      (match BM.uuid_attr property "block/uuid" with
       | Some u -> [ "block/uuid", Uuid u ]
       | None -> invalid_arg "property entity without :block/uuid")
      |> (fun m -> BM.merge m entry.P.properties)
      |> (fun m ->
          BM.merge m
            (Db_property_build.build_properties_with_ref_values pvalue_tx_m))
    in
    base @ [ merged ]

let build_properties (entries : P.builtin_property list) : BM.t list =
  List.concat_map build_property_entry entries

(* ---------- create-graph/build-initial-properties ---------- *)

(* cljs bootstrap-idents is a #{set} (unordered); we emit in table order — the
   relative order of bootstrap properties among themselves is semantically
   immaterial as cljs's set order is unspecified. *)
let bootstrap_idents =
  [ "logseq.property/type"; "logseq.property/hide?"; "logseq.property/built-in?"
  ; "logseq.property/created-from-property" ]

let build_bootstrap_property (db_ident : string) : BM.t =
  let entry =
    List.find (fun (p : P.builtin_property) -> p.P.ident = db_ident)
      P.built_in_properties
  in
  let title = entry.P.title in
  Db_property_build.build_new_property ~db_ident
    ~prop_schema:(qualified_schema entry.P.schema)
    ?title ()

(* Returns the tx maps plus the property entities keyed by ident for the
   class builder (cljs {:tx tx :properties properties}). *)
let build_initial_properties () : BM.t list * (string * BM.t) list =
  let bootstrap_properties = List.map build_bootstrap_property bootstrap_idents in
  let keep_attrs = "block/uuid" :: bootstrap_idents in
  let bootstrap_properties_tx =
    List.map (fun m -> BM.dissoc m bootstrap_idents) bootstrap_properties
    @ List.map
        (fun m -> List.filter (fun (a, _) -> List.mem a keep_attrs) m)
        bootstrap_properties
  in
  let properties_tx =
    build_properties
      (List.filter
         (fun (p : P.builtin_property) ->
           not (List.mem p.P.ident bootstrap_idents))
         P.built_in_properties)
  in
  (* cljs mark-block-as-built-in' emits {:block/uuid u :built-in? true};
     items without a block/uuid (bare lookup-ref pvalue items) would emit
     {:block/uuid nil} in cljs — none exist in the table, so we skip them. *)
  let mark (b : BM.t) : BM.t option =
    match BM.uuid_attr b "block/uuid" with
    | Some u -> Some (mark_block_as_built_in [ "block/uuid", Uuid u ])
    | None -> None
  in
  let tx =
    bootstrap_properties_tx
    @ properties_tx
    @ List.filter_map mark bootstrap_properties
    @ List.filter_map mark properties_tx
  in
  (* assert :db/ident entities have db-ident-block-uuid uuids *)
  List.iter
    (fun m ->
      match BM.attr_value m "db/ident", BM.uuid_attr m "block/uuid" with
      | Some _, Some u ->
        if not (String.sub u 0 8 = "00000002") then
          invalid_arg ("ident entity without db-ident-block-uuid: " ^ u)
      | _ -> ())
    tx;
  let db_ident_to_properties =
    List.filter_map
      (fun m ->
        if property_block m then
          match BM.attr_value m "db/ident" with
          | Some (Keyword i) | Some (String i) -> Some (i, m)
          | _ -> None
        else None)
      properties_tx
  in
  tx, db_ident_to_properties

(* ---------- create-graph/validate-tx-for-duplicate-idents ---------- *)

let validate_tx_for_duplicate_idents (tx : tx_op list) : unit =
  let seen = Hashtbl.create 64 in
  List.iter
    (function
      | Entity (e : tx_entity) ->
        (match List.assoc_opt "db/ident" e.attrs with
         | Some (One_value (Keyword s)) | Some (One_value (String s)) ->
           let n = try Hashtbl.find seen s with Not_found -> 0 in
           Hashtbl.replace seen s (n + 1)
         | _ -> ())
      | _ -> ())
    tx;
  let dups =
    Hashtbl.fold (fun k n acc -> if n > 1 then k :: acc else acc) seen []
  in
  match dups with
  | [] -> ()
  | idents ->
    failwith
      ("The following :db/idents are not unique and clobbered each other: ["
       ^ String.concat " " (List.map (fun s -> ":" ^ s) idents) ^ "]")

(* ---------- create-graph/build-initial-classes* ---------- *)

let build_initial_class_entries
    (entries : P.builtin_class list)
    (db_ident_to_properties : (string * BM.t) list) : BM.t list =
  List.map
    (fun (e : P.builtin_class) ->
      let title =
        match e.P.c_title with
        | Some t -> t
        | None -> Db_property_build.name_of_ident e.P.c_ident
      in
      let class_properties =
        List.map
          (fun ident ->
            if not (List.mem_assoc ident db_ident_to_properties) then
              invalid_arg ("Built-in property " ^ ident ^ " is not defined yet");
            Keyword ident)
          e.P.c_schema_properties
      in
      let block =
        [ "block/title", String title
        ; "block/name", String (Ldb.page_name_sanity_lc title)
        ; "db/ident", Keyword e.P.c_ident
        ; "block/uuid"
        , Uuid (Common_uuid.gen_uuid "db-ident-block-uuid" e.P.c_ident) ]
        |> (fun m ->
            if class_properties <> [] then
              BM.put m "logseq.property.class/properties" (Vector class_properties)
            else m)
        |> (fun m -> BM.merge m e.P.c_properties)
        |> Db_property_build.build_new_class
        |> mark_block_as_built_in
      in
      block)
    entries

let build_initial_classes (db_ident_to_properties : (string * BM.t) list)
    : BM.t list =
  build_initial_class_entries P.built_in_classes db_ident_to_properties

(* ---------- create-graph/build-initial-views etc. ---------- *)

(* common-config/views-page-name *)
let views_page_name = "$$$views"
let favorites_page_name = "$$$favorites"
let recycle_page_name = "Recycle"

(* common-config/built-in-pages-names in cljs create-graph *)
let built_in_pages_names =
  [ Ldb.library_page_name; Ldb.quick_add_page_name; "Contents" ]

let build_initial_views () : BM.t list =
  [ Db_property_build.block_with_timestamps
      [ "block/uuid"
      , Uuid (Common_uuid.gen_uuid "builtin-block-uuid" views_page_name)
      ; "block/name", String views_page_name
      ; "block/title", String views_page_name
      ; "block/tags", Set [ Keyword "logseq.class/Page" ]
      ; "logseq.property/hide?", Bool true
      ; "logseq.property/built-in?", Bool true ] ]

let build_recycle_page () : BM.t list =
  [ Db_property_build.block_with_timestamps
      [ "block/uuid"
      , Uuid (Common_uuid.gen_uuid "builtin-block-uuid" recycle_page_name)
      ; "block/name", String (Ldb.page_name_sanity_lc recycle_page_name)
      ; "block/title", String recycle_page_name
      ; "block/tags", Set [ Keyword "logseq.class/Page" ]
      ; "logseq.property/hide?", Bool true
      ; "logseq.property/built-in?", Bool true ] ]

let build_favorites_page () : BM.t list =
  [ Db_property_build.block_with_timestamps
      [ "block/uuid"
      , Uuid (Common_uuid.gen_uuid "builtin-block-uuid" favorites_page_name)
      ; "block/name", String favorites_page_name
      ; "block/title", String favorites_page_name
      ; "block/tags", Set [ Keyword "logseq.class/Page" ]
      ; "logseq.property/hide?", Bool true
      ; "logseq.property/built-in?", Bool true ] ]

(* ---------- sqlite-util/build-new-page ---------- *)
let build_new_page (title : string) : BM.t =
  Db_property_build.block_with_timestamps
    ([ "block/name", String (Ldb.page_name_sanity_lc title)
     ; "block/title", String title
     ; "block/uuid", Uuid (Common_uuid.gen_uuid "builtin-block-uuid" title)
     ; "block/tags", Set [ Keyword "logseq.class/Page" ] ]
     @ if title = Ldb.quick_add_page_name
       then [ "logseq.property/hide?", Bool true ]
       else [])

(* ---------- sqlite-util/kv + import-tx ---------- *)

let kv (k : string) (v : value) : BM.t =
  if not (String.length k > 9 && String.sub k 0 9 = "logseq.kv" && k.[9] = '/')
  then invalid_arg ("kv: key must be under :logseq.kv — " ^ k);
  [ "db/ident", Keyword k; "kv/value", v ]

(* sqlite-util/import-tx *)
let import_tx (db : db) (import_type : value) : tx_op list =
  [ entity_tx db (kv "logseq.kv/import-type" import_type)
  ; entity_tx db
      (kv "logseq.kv/imported-at" (Instant (Date_time_util.time_ms ())))
  ]
  @ List.map
      (fun ident -> RetractEntity (Ident ident))
      [ "logseq.kv/graph-uuid"      (* rtc related *)
      ; "logseq.kv/graph-local-tx"  (* rtc related *)
      ; "logseq.kv/remote-schema-version" (* rtc related *)
      ; "logseq.kv/graph-rtc-e2ee?"       (* rtc related *)
      ]

(* ---------- create-graph/build-initial-files ---------- *)

let build_initial_files (config_content : string) : BM.t list =
  let now = Instant (Date_time_util.time_ms ()) in
  let file (name : string) (content : string) : BM.t =
    [ "block/uuid", Uuid (Common_uuid.gen_uuid "builtin-block-uuid" ("logseq/" ^ name))
    ; "file/path", String ("logseq/" ^ name)
    ; "file/content", String content
    ; "file/created-at", now
    ; "file/last-modified-at", now ]
  in
  [ file "config.edn" config_content
  ; file "custom.css" ""
  ; file "custom.js" ""
  ; file "publish.css" ""
  ; file "publish.js" "" ]

(* ---------- create-graph/build-db-initial-data ---------- *)

(* cljs db-schema/version = (parse-schema-version "65.33") *)
let db_schema_version : value =
  Map [ Keyword "major", Int 65; Keyword "minor", Int 33 ]

(* cljs build-db-initial-data — the whole seed tx for a new graph.
   [db] is the fresh conn's db (used by Block_map.to_tx_op to decide which
   attrs hold entity refs). Mirrors:
     (build-db-initial-data config-content
       & {:keys [import-type graph-git-sha creating-remote-graph?]}) *)
let initial_tx_data
    ~(db : db)
    ~(config_content : string)
    ?(import_type : value option)
    ?(graph_git_sha : string option)
    ?(creating_remote_graph : bool option)
    () : tx_op list =
  let initial_data_bms : BM.t list =
    [ kv "logseq.kv/db-type" (String "db")
    ; kv "logseq.kv/schema-version" db_schema_version
    ; kv "logseq.kv/graph-initial-schema-version" db_schema_version
    ; kv "logseq.kv/graph-created-at"
        (Instant (Date_time_util.time_ms ()))
    ; (* Empty property value used by db.type/ref properties *)
      [ "db/ident", Keyword "logseq.property/empty-placeholder"
      ; "block/uuid"
      , Uuid
          (Common_uuid.gen_uuid "builtin-block-uuid"
             "logseq.property/empty-placeholder") ] ]
    @ (match graph_git_sha with
       | Some sha -> [ kv "logseq.kv/graph-git-sha" (String sha) ]
       | None -> [])
    @ (match creating_remote_graph with
       | Some b -> [ kv "logseq.kv/graph-remote?" (Bool b) ]
       | None -> [])
    @ [ kv "logseq.kv/local-graph-uuid"
          (let s = Common_uuid.new_block_id () in
           Uuid ("00000000" ^ String.sub s 8 (String.length s - 8))) ]
  in
  let file_bms = build_initial_files config_content in
  let properties_tx, db_ident_to_properties = build_initial_properties () in
  let default_classes = build_initial_classes db_ident_to_properties in
  let page_bms =
    List.map (fun n -> mark_block_as_built_in (build_new_page n))
      built_in_pages_names
  in
  let hidden_bms =
    build_initial_views () @ build_favorites_page () @ build_recycle_page ()
  in
  let hint =
    BM.schema_hint_of_bms
      (initial_data_bms @ file_bms @ properties_tx @ default_classes
       @ page_bms @ hidden_bms)
  in
  let entity (m : BM.t) : tx_op = entity_tx ~hint db m in
  let initial_data : tx_op list =
    List.map entity initial_data_bms
    @ (match import_type with
       | Some t -> import_tx db t
       | None -> [])
  in
  let initial_files = List.map entity file_bms in
  let default_pages = List.map entity page_bms in
  let hidden_pages = List.map entity hidden_bms in
  (* These classes bootstrap our tags and properties as they depend on each
     other e.g. Root <-> Tag, classes-tx depends on
     logseq.property.class/extends, properties-tx depends on Property *)
  let bootstrap_class_idents =
    [ "logseq.class/Root"; "logseq.class/Property"; "logseq.class/Tag"
    ; "logseq.class/Page"; "logseq.class/Template" ]
  in
  let is_bootstrap_class (m : BM.t) =
    match BM.attr_value m "db/ident" with
    | Some (Keyword i) | Some (String i) -> List.mem i bootstrap_class_idents
    | _ -> false
  in
  let bootstrap_classes = List.filter is_bootstrap_class default_classes in
  let bootstrap_class_ids =
    List.map
      (fun m ->
        entity (List.filter (fun (a, _) -> a = "db/ident" || a = "block/uuid") m))
      bootstrap_classes
  in
  let classes_tx =
    List.map entity
      (List.map (fun m -> BM.remove_attr m "db/ident") bootstrap_classes
       @ List.filter (fun m -> not (is_bootstrap_class m)) default_classes)
  in
  (* Order of tx is critical. bootstrap-class-ids bootstraps properties-tx and
     classes-tx; coming first gives Root/Tag/Property stable :db/id's 1,2,3 *)
  let tx =
    bootstrap_class_ids
    @ initial_data
    @ List.map entity properties_tx
    @ classes_tx
    @ initial_files
    @ default_pages
    @ hidden_pages
  in
  validate_tx_for_duplicate_idents tx;
  tx
