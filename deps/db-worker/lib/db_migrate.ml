(* Port of frontend.worker.db.migrate
   (src/main/frontend/worker/db/migrate.cljs): delete-property, the
   schema-version -> updates table, ensure-built-in-data-exists!,
   upgrade-version! and migrate.

   Tx data items are Wire.t (rendered to EDN by Db_transact.transact);
   Block_map.t items convert via wire_map / Ds_wire.transit_of_tx_op. *)

open Datascript

let kw s = Wire.Keyword s

let wire_map (kvs : (attr * value) list) : Wire.t =
  Wire.Map (List.map (fun (a, v) -> (kw a, Ds_wire.transit_of_value v)) kvs)

let add_ident (e : entity_id) (a : attr) (ident : string) : Wire.t =
  Wire.Array [ kw "db/add"; Wire.Int e; kw a; kw ident ]

let retract (e : entity_id) (a : attr) : Wire.t =
  Wire.Array [ kw "db/retract"; Wire.Int e; kw a ]

let retract_v (e : entity_id) (a : attr) (v : value) : Wire.t =
  Wire.Array [ kw "db/retract"; Wire.Int e; kw a; Ds_wire.transit_of_value v ]

(* db-migrate/delete-property *)
let delete_property (db : db) (property_key : attr) : Wire.t list =
  let property_entity = Ldb.ent_of_ref db (Ident property_key) in
  let property_page =
    match property_entity with
    | Some e -> Ldb.is_property e
    | None -> false
  in
  let direct_remove : tx_op list =
    List.of_seq (datoms db Avet ~a:property_key ())
    |> List.map (fun (d : datom) -> Retract (Entity_id d.e, property_key, None))
  in
  let remove_datoms : tx_op list =
    if property_page then
      Outliner_page.build_page_retract_tx db
        (match property_entity with
         | Some e -> e
         | None -> assert false)
    else
      direct_remove
      @ (match property_entity with
         | Some _ -> [ RetractEntity (Ident property_key) ]
         | None -> [])
  in
  let cleanup = Delete_blocks.update_refs_history db remove_datoms in
  let all =
    List.fold_left
      (fun acc (tx : tx_op) ->
        if List.exists (fun x -> x = tx) acc then acc else acc @ [ tx ])
      []
      (cleanup @ remove_datoms)
  in
  List.map Ds_wire.transit_of_tx_op all

(* db-migrate/remove-block-path-refs *)
let remove_block_path_refs (db : db) : Wire.t list =
  delete_property db "block/path-refs"

(* db-migrate/remove-position-property-from-url-properties *)
let remove_position_property_from_url_properties (db : db) : Wire.t list =
  List.of_seq
    (datoms db Avet ~a:"logseq.property/type" ~v:(Keyword "url") ())
  |> List.filter_map (fun (d : datom) ->
         match Ldb.ent_of_id db d.e with
         | Some e ->
             (match Ldb.value e "logseq.property/ui-position" with
              | Some _ -> Some (retract d.e "logseq.property/ui-position")
              | None -> None)
         | None -> None)

let q_result_ids (rows : query_result list list) : entity_id list =
  List.filter_map
    (function
      | [ Result_entity id ] -> Some id
      | [ Result_value (Int id) ] -> Some id
      | [ Result_value (Ref id) ] -> Some id
      | _ -> None)
    rows

(* db-migrate/tag-comment-blocks *)
let tag_comment_blocks (db : db) : Wire.t list =
  match Ldb.ent_of_ref db (Ident "logseq.class/Comments") with
  | None -> []
  | Some _ ->
      q_result_ids
        (q_string db
           "[:find [?comment ...]
             :where
               [?comments-area :block/tags :logseq.class/Comments]
               [?comment :block/parent ?comments-area]]")
      |> List.map (fun e ->
             add_ident e "block/tags" "logseq.class/Comment")

(* db-migrate/add-single-block-comment-targets *)
let add_single_block_comment_targets (db : db) : Wire.t list =
  match Ldb.ent_of_ref db (Ident "logseq.class/Comments") with
  | None -> []
  | Some _ ->
      q_string db
        "[:find ?comments-area-id ?parent-id
          :where
            [?comments-area-id :block/tags :logseq.class/Comments]
            [?comments-area-id :block/parent ?parent-id]]"
      |> List.filter_map (fun (row : query_result list) ->
             match row with
             | [ Result_value (Int ca); Result_value (Int parent) ]
             | [ Result_entity ca; Result_entity parent ]
             | [ Result_value (Ref ca); Result_value (Ref parent) ] ->
                 (match Ldb.ent_of_id db ca with
                  | Some area ->
                      (match Ldb.values area "logseq.property.comments/blocks" with
                       | [] ->
                           Some
                             (Wire.Array
                                [ kw "db/add"; Wire.Int ca
                                ; kw "logseq.property.comments/blocks"
                                ; Wire.Int parent ])
                       | _ -> None)
                  | None -> None)
             | _ -> None)

(* db-migrate/repair-comment-classes-and-targets *)
let repair_comment_classes_and_targets (db : db) : Wire.t list =
  let root_id =
    match Ldb.ent_of_ref db (Ident "logseq.class/Root") with
    | Some e -> Some e.id
    | None -> None
  in
  add_single_block_comment_targets db
  @ List.concat_map
      (fun class_ident ->
        match Ldb.ent_of_ref db (Ident class_ident) with
        | Some class_ ->
            let missing_extends =
              match Ldb.values class_ "logseq.property.class/extends" with
              | [] -> true
              | _ -> false
            in
            (match root_id, missing_extends with
             | Some rid, true ->
                 [ Wire.Array
                     [ kw "db/add"; Wire.Int class_.id
                     ; kw "logseq.property.class/extends"; Wire.Int rid ] ]
             | _ -> [])
            @ (match Ldb.value class_ "block/order" with
               | Some o -> [ retract_v class_.id "block/order" o ]
               | None -> [])
        | None -> [])
      [ "logseq.class/Comments"; "logseq.class/Comment" ]

(* db-migrate/deprecated-ensure-graph-uuid [_db] -> nil *)
let deprecated_ensure_graph_uuid (_db : db) : Wire.t list = []

(* db-migrate/add-quick-add-page *)
let add_quick_add_page (_db : db) : Wire.t list =
  [ wire_map
      (Sqlite_create_graph.mark_block_as_built_in
         (Sqlite_create_graph.build_new_page Ldb.quick_add_page_name)) ]

(* db-migrate/add-missing-page-name *)
let add_missing_page_name (db : db) : Wire.t list =
  List.of_seq (datoms db Avet ~a:"block/name" ~v:(String "") ())
  |> List.filter_map (fun (d : datom) ->
         match Ldb.ent_of_id db d.e with
         | Some e ->
             (match Ldb.string_value e "block/title" with
              | Some title when String.trim title <> "" ->
                  Some
                    (wire_map
                       [ "db/id", Int d.e
                       ; "block/name",
                         String (Ldb.page_name_sanity_lc title) ])
              | _ -> None)
         | None -> None)

(* db-migrate/schema-version->updates *)
type update_spec =
  { u_fix : (db -> Wire.t list) option
  ; u_properties : attr list
  ; u_classes : string list
  ; u_delete_properties : attr list
  }

let update ?fix ?(properties = []) ?(classes = [])
    ?(delete_properties = []) () =
  { u_fix = fix
  ; u_properties = properties
  ; u_classes = classes
  ; u_delete_properties = delete_properties }

let schema_version_updates : (string * update_spec) list =
  [ "65.7", update ~fix:add_quick_add_page ()
  ; "65.8", update ~fix:add_missing_page_name ()
  ; ( "65.10"
    , update
        ~properties:
          [ "block/journal-day"
          ; "logseq.property.view/sort-groups-by-property"
          ; "logseq.property.view/sort-groups-desc?" ] () )
  ; "65.11", update ~fix:remove_block_path_refs ()
  ; "65.12", update ~fix:remove_position_property_from_url_properties ()
  ; "65.13",
    update ~properties:[ "logseq.property.asset/width"; "logseq.property.asset/height" ] ()
  ; "65.14", update ~properties:[ "logseq.property.asset/external-src" ] ()
  ; "65.16", update ~properties:[ "logseq.property.asset/external-file-name" ] ()
  ; "65.17", update ~properties:[ "logseq.property.publish/published-url" ] ()
  ; "65.18", update ~fix:deprecated_ensure_graph_uuid ()
  ; "65.19",
    update
      ~properties:[ "logseq.property/choice-classes"; "logseq.property/choice-exclusions" ] ()
  ; "65.20",
    update
      ~properties:
        [ "logseq.property.class/bidirectional-property-title"
        ; "logseq.property.class/enable-bidirectional?" ] ()
  ; "65.21", update ~properties:[ "logseq.property.sync/large-title-object" ] ()
  ; "65.22",
    update ~properties:[ "logseq.property.reaction/emoji-id"; "logseq.property.reaction/target" ] ()
  ; "65.23", update ~properties:[ "logseq.property.asset/align" ] ()
  ; "65.24",
    update
      ~properties:
        [ "logseq.property/deleted-at"; "logseq.property/deleted-by-ref"
        ; "logseq.property.recycle/original-parent"
        ; "logseq.property.recycle/original-page"
        ; "logseq.property.recycle/original-order" ] ()
  ; "65.25",
    update
      ~delete_properties:
        [ "block/pre-block?"; "logseq.property.embedding/hnsw-label"
        ; "logseq.property.embedding/hnsw-label-updated-at" ] ()
  ; "65.26", update ~properties:[ "logseq.property.repeat/repeat-type" ] ()
  ; "65.27",
    update ~classes:[ "logseq.class/Comments" ]
      ~properties:[ "logseq.property.comments/blocks" ] ()
  ; "65.28", update ~classes:[ "logseq.class/Comment" ] ~fix:tag_comment_blocks ()
  ; "65.29", update ~fix:add_single_block_comment_targets ()
  ; "65.30", update ~properties:[ "logseq.property/assignee" ] ()
  ; "65.31", update ~properties:[ "logseq.property.agent/session-id" ] ()
  ; "65.32", update ~fix:repair_comment_classes_and_targets ()
  ; "65.33",
    update
      ~properties:
        [ "logseq.property.view/gallery-asset-property"
        ; "logseq.property.view/gallery-display-properties"
        ; "logseq.property.view/gallery-card-size"
        ; "logseq.property.view/gallery-card-width"
        ; "logseq.property.view/gallery-card-height" ] () ]

(* cljs (sqlite-create-graph/build-db-initial-data config-content) restricted
   to what ensure-built-in-data-exists! consumes: the seed entity maps
   (Block_map.t), composed in cljs order from Sqlite_create_graph's helpers.
   The import-type/graph-git-sha/remote? opts are unused here. *)
let seed_initial_data () : Block_map.t list =
  let open Sqlite_create_graph in
  let properties_tx, db_ident_to_properties = build_initial_properties () in
  let default_classes = build_initial_classes db_ident_to_properties in
  let bootstrap_class_idents =
    [ "logseq.class/Root"; "logseq.class/Property"; "logseq.class/Tag"
    ; "logseq.class/Page"; "logseq.class/Template" ]
  in
  let is_bootstrap_class (m : Block_map.t) =
    match Block_map.attr_value m "db/ident" with
    | Some (Keyword i) | Some (String i) -> List.mem i bootstrap_class_idents
    | _ -> false
  in
  (* cljs build-db-initial-data emits bootstrap-class-ids first — stub
     entities {db/ident, block/uuid} for Root/Property/Tag/Page/Template —
     so properties-tx/class maps can reference those idents. *)
  let bootstrap_class_ids =
    List.map
      (fun m ->
        List.filter (fun (a, _) -> a = "db/ident" || a = "block/uuid") m)
      (List.filter is_bootstrap_class default_classes)
  in
  let classes_tx =
    List.map
      (fun m -> Block_map.remove_attr m "db/ident")
      (List.filter is_bootstrap_class default_classes)
    @ List.filter
        (fun m -> not (is_bootstrap_class m))
        default_classes
  in
  bootstrap_class_ids
  @ [ kv "logseq.kv/db-type" (String "db")
  ; kv "logseq.kv/schema-version" db_schema_version
  ; kv "logseq.kv/graph-initial-schema-version" db_schema_version
  ; kv "logseq.kv/graph-created-at"
      (Instant (Date_time_util.time_ms ()))
  ; [ "db/ident", Keyword "logseq.property/empty-placeholder"
    ; ( "block/uuid"
      , Uuid
          (Common_uuid.gen_uuid "builtin-block-uuid"
             "logseq.property/empty-placeholder") ) ]
  ; (let s = Common_uuid.new_block_id () in
     kv "logseq.kv/local-graph-uuid"
       (Uuid ("00000000" ^ String.sub s 8 (String.length s - 8)))) ]
  @ properties_tx
  @ classes_tx
  @ build_initial_files ""
  @ List.map
      (fun n -> mark_block_as_built_in (build_new_page n))
      built_in_pages_names
  @ (build_initial_views ()
     @ build_favorites_page ()
     @ build_recycle_page ())

(* db-migrate/ensure-built-in-data-exists! *)
let ensure_built_in_data_exists (conn : conn) : tx_report option =
  let db = Conn.db conn in
  let uuids : (string, string) Hashtbl.t = Hashtbl.create 7 in
  let ent_to_map (e : entity) : (attr * value) list =
    List.of_seq (datoms db Eavt ~e:e.id ())
    |> List.fold_left
         (fun (m : (attr * value) list) (d : datom) ->
           if List.mem d.a Db_schema.card_many_attributes then
             let cur =
               match List.assoc_opt d.a m with
               | Some (Set xs) -> xs
               | Some v -> [ v ]
               | None -> []
             in
             (d.a, Set (cur @ [ d.v ])) :: List.remove_assoc d.a m
           else m @ [ (d.a, d.v) ])
         []
  in
  (* cljs (update data k (fn [v] ...)) — f sees data's current value *)
  let update_value (k : attr) (existing_v : value) (v : value option) : value =
    if k = "logseq.property/built-in?" then Bool true
    else if k = "logseq.property/type" then
      match v with Some x -> x | None -> Nil
    else
      match v with
      | Some ((Set _ | Vector _ | List _) as coll) -> coll
      | _ ->
          let existing' =
            match existing_v with
            | Set xs -> List (List.filter (fun x -> x <> Nil) xs)
            | Vector xs -> List (List.filter (fun x -> x <> Nil) xs)
            | List xs -> List (List.filter (fun x -> x <> Nil) xs)
            | _ -> existing_v
          in
          if k = "block/title" || k = "block/name" then
            match v with Some x -> x | None -> Nil
          else
            match existing' with
            | Nil -> (match v with Some x -> x | None -> Nil)
            | x -> x
  in
  let keep_item (data : Block_map.t) : Block_map.t option =
    let is_kv =
      (* db/ident is stored as a Keyword value, so string_attr misses it *)
      match Block_map.attr_value data "db/ident" with
      | Some (Keyword i) | Some (String i) ->
          Ns_util.str_starts_with i "logseq.kv/"
      | _ -> false
    in
    if is_kv then None
    else
      match Block_map.string_attr data "block/title" with
      | Some "Contents" -> None
      | _ ->
          (match Block_map.string_attr data "file/path" with
           | Some path ->
               (match Ldb.ent_of_ref db (Lookup_ref ("file/path", String path)) with
                | Some block ->
                    let existing_data =
                      ("db/id", Int block.id) :: ent_to_map block
                    in
                    Some (Block_map.merge data existing_data)
                | None -> Some data)
           | None ->
               let keys = List.map fst data in
               if
                 keys = [ "block/uuid"; "logseq.property/built-in?" ]
               then Some data
               else
                 (match Block_map.uuid_attr data "block/uuid" with
                  | Some u ->
                      (match
                         Ldb.ent_of_ref db (Lookup_ref ("block/uuid", Uuid u))
                       with
                       | Some block ->
                           (match Ldb.string_value block "block/uuid" with
                            | Some u' -> Hashtbl.replace uuids u u'
                            | None -> ());
                           let existing_data =
                             ("db/id", Int block.id) :: ent_to_map block
                           in
                           Some
                             (List.fold_left
                                (fun (m : Block_map.t) (k, existing_v) ->
                                  let v = Block_map.attr_value m k in
                                  Block_map.put m k
                                    (update_value k existing_v v))
                                data existing_data)
                       | None -> Some data)
                  | None -> Some data))
  in
  let data =
    seed_initial_data ()
    |> List.filter_map keep_item
    |> List.map
         (fun (m : Block_map.t) ->
           (* common-util/fast-remove-nils *)
           List.filter (fun (_, v) -> v <> Nil) m)
  in
  (* cljs walk/prewalk: [ :block/uuid x ] -> [ :block/uuid (@*uuids x) ] *)
  let rec prewalk (v : value) : value =
    let replaced =
      match v with
      | Vector [ Keyword "block/uuid"; x ] ->
          (match x with
           | Uuid u ->
               (match Hashtbl.find_opt uuids u with
                | Some u' -> Vector [ Keyword "block/uuid"; Uuid u' ]
                | None -> v)
           | _ -> v)
      | Ref_to (Lookup_ref ("block/uuid", x)) ->
          (match x with
           | Uuid u ->
               (match Hashtbl.find_opt uuids u with
                | Some u' -> Ref_to (Lookup_ref ("block/uuid", Uuid u'))
                | None -> v)
           | _ -> v)
      | _ -> v
    in
    match replaced with
    | Map kvs -> Map (List.map (fun (k, v) -> (k, prewalk v)) kvs)
    | Vector xs -> Vector (List.map prewalk xs)
    | List xs -> List (List.map prewalk xs)
    | Set xs -> Set (List.map prewalk xs)
    | Tuple vs -> Tuple (List.map (Option.map prewalk) vs)
    | _ -> replaced
  in
  let data' =
    List.map
      (fun (m : Block_map.t) ->
        m
        |> List.map (fun (k, v) -> (k, prewalk v))
        |> List.filter (fun (k, _) -> k <> "db/id"))
      data
  in
  (* cljs (ldb/transact! conn data' {:fix-db? true :db-migrate? true}) —
     Db_tx.transact runs the worker pipeline like ldb/transact!, and the
     tx_op path (entity_tx) keeps Map values on non-ref attrs as stored
     values like cljs datascript, which the EDN fast path
     (Db_transact.transact) cannot express. *)
  Some
    (Db_tx.transact
       ~tx_meta:[ "fix-db?", Bool true; "db-migrate?", Bool true ]
       conn
       (List.map (Sqlite_create_graph.entity_tx db) data'))

(* db-migrate/upgrade-version! *)
let upgrade_version (conn : conn) (version : string) (update : update_spec) :
    tx_report option =
  let version_map = Db_schema.parse_schema_version (String version) in
  let db = Conn.db conn in
  let new_properties =
    Builtin_data.built_in_properties
    |> List.filter (fun (b : Builtin_data.builtin_property) ->
           if
             List.mem b.Builtin_data.ident update.u_properties
             && Ldb.ent_of_ref db (Ident b.Builtin_data.ident) <> None
           then
             failwith
               ("DB migration: property already exists " ^ b.Builtin_data.ident)
           else List.mem b.Builtin_data.ident update.u_properties)
    |> Sqlite_create_graph.build_properties
    |> List.map (fun m ->
           wire_map (Sqlite_create_graph.mark_block_as_built_in m))
  in
  let classes' =
    List.fold_left
      (fun acc c -> if List.mem c acc then acc else acc @ [ c ])
      [ "logseq.class/Property"; "logseq.class/Tag"; "logseq.class/Page"
      ; "logseq.class/Journal"; "logseq.class/Whiteboard" ]
      update.u_classes
  in
  let selected_classes =
    List.filter
      (fun (c : Builtin_data.builtin_class) ->
        List.mem c.Builtin_data.c_ident classes')
      Builtin_data.built_in_classes
    |> List.filter (fun (c : Builtin_data.builtin_class) ->
           Ldb.ent_of_ref db (Ident c.Builtin_data.c_ident) = None)
  in
  let new_class_maps =
    Sqlite_create_graph.build_initial_class_entries selected_classes
      (List.map (fun p -> (p, [])) update.u_properties)
    |> List.map Sqlite_create_graph.mark_block_as_built_in
  in
  let new_class_idents =
    List.filter_map
      (fun (m : Block_map.t) ->
        match Block_map.attr_value m "db/ident" with
        | Some (Keyword i) -> Some (wire_map [ "db/ident", Keyword i ])
        | _ -> None)
      new_class_maps
  in
  let new_classes = List.map wire_map new_class_maps in
  let fixes =
    match update.u_fix with Some f -> f db | None -> []
  in
  let delete_properties_tx =
    List.concat_map (fun a -> delete_property db a) update.u_delete_properties
  in
  let kv_tx =
    (* vector-op form: a Map value on non-ref kv/value is stored as a
       plain value; the entity-map form would treat it as a nested
       entity and throw "nested entity attribute requires ref schema" *)
    [ Wire.Array
        [ Keyword "db/add"
        ; Wire.Array
            [ Keyword "db/ident"; Keyword "logseq.kv/schema-version" ]
        ; Keyword "kv/value"
        ; Map
            [ Keyword "major", Int version_map.sv_major
            ; Keyword "minor",
              (match version_map.sv_minor with
               | Some n -> Int n
               | None -> Nil) ] ] ]
  in
  let tx_data =
    kv_tx @ new_class_idents @ new_properties @ new_classes @ fixes
    @ delete_properties_tx
  in
  Db_transact.transact conn tx_data
    [ "db-migrate?", Bool true; "skip-validate-db?", Bool true ]

type migrate_result =
  { from_version : Db_schema.schema_version
  ; to_version : Db_schema.schema_version
  ; upgrade_reports : tx_report option list }

(* db-migrate/migrate *)
let migrate ?(target_version = Db_schema.version) (conn : conn) :
    migrate_result option =
  let db = Conn.db conn in
  let kv_v =
    match Ldb.ent_of_ref db (Ident "logseq.kv/schema-version") with
    | Some e -> Ldb.value e "kv/value"
    | None -> None
  in
  let version_in_db =
    Db_schema.parse_schema_version
      (match kv_v with Some v -> v | None -> Int 0)
  in
  let compare_result =
    Db_schema.compare_schema_version target_version version_in_db
  in
  if compare_result = 0 then None
  else if compare_result < 0 then
    (Broadcast.to_clients ~kind:"notification"
       ~transit_payload:
         (Transit_codec.to_string
            (Wire.Array
               [ kw "notification"
               ; Wire.Array
                   [ Wire.String
                       "Your app is using an outdated version that is \
                        incompatible with your current graph. Please update \
                        your app before editing this graph."
                   ; kw "error"; Wire.Bool false ] ]));
     None)
  else (
    let updates =
      List.filter_map
        (fun (v_str, u) ->
          let v = Db_schema.parse_schema_version (String v_str) in
          if
            Db_schema.compare_schema_version version_in_db v < 0
            && Db_schema.compare_schema_version v target_version <= 0
          then Some (v_str, u)
          else None)
        schema_version_updates
    in
    (* upgrades run before ensure-built-in-data-exists! — OCaml evaluates
       @'s right operand first, so the call must be sequenced explicitly
       (cljs runs it after the upgrade doseq). *)
    let reports =
      List.map (fun (v_str, u) -> upgrade_version conn v_str u) updates
    in
    let reports = reports @ [ ensure_built_in_data_exists conn ] in
    Some
      { from_version = version_in_db
      ; to_version = target_version
      ; upgrade_reports = reports })
