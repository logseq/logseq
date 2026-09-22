(* Port of frontend.worker.db.validate
   (src/main/frontend/worker/db/validate.cljs): validate-db (with the
   fix-* repair pipeline) and recompute-checksum-diagnostics.

   Errors are Db_validate.grouped_error records; fixes produce Wire.t tx
   data transacted with {:fix-db? true}. *)

open Datascript

let kw s = Wire.Keyword s

let wire_map (kvs : (attr * value) list) : Wire.t =
  Wire.Map
    (List.map (fun (a, v) -> (kw a, Ds_wire.transit_of_value v)) kvs)

let retract e a : Wire.t =
  Wire.Array [ kw "db/retract"; Wire.Int e; kw a ]

let retract_v e a v : Wire.t =
  Wire.Array
    [ kw "db/retract"; Wire.Int e; kw a; Ds_wire.transit_of_value v ]

let retract_entity e : Wire.t =
  Wire.Array [ kw "db/retractEntity"; Wire.Int e ]

let add e a v : Wire.t =
  Wire.Array [ kw "db/add"; Wire.Int e; kw a; Ds_wire.transit_of_value v ]

let add_ident e a ident : Wire.t =
  Wire.Array [ kw "db/add"; Wire.Int e; kw a; kw ident ]

let namespace_of (s : string) : string option =
  match String.index_opt s '/' with
  | Some i -> Some (String.sub s 0 i)
  | None -> None

let ident_name (s : string) : string =
  match String.rindex_opt s '/' with
  | Some i -> String.sub s (i + 1) (String.length s - i - 1)
  | None -> s

(* cljs db-class/user-class-namespace? *)
let user_class_namespace (ident : string) : bool =
  namespace_of ident = Some "user.class"

(* cljs (ldb/transact! conn tx-data {:fix-db? true}) — ldb/transact!
   routes through transact-sync, which runs the worker pipeline
   (block/tx-id stamping, ref rebuilds) even when :fix-db? skips
   validate-tx-report. Db_transact.transact is the EDN fast path
   without the pipeline, so fix txs render to EDN and go through
   Db_tx.transact instead — its transact_sync does the same
   d/with -> transact-pipeline-fn -> CAS dance. *)
let transact_fix (conn : conn) (tx_data : Wire.t list)
    (tx_meta : tx_meta) : tx_report option =
  if tx_data = [] then None
  else
    Some
      (Db_tx.transact ~tx_meta conn
         (Datascript.parse_tx_data_string (Db_transact.tx_edn tx_data)))

(* cljs get-property-by-title *)
let get_property_by_title (db : db) (title : string) : entity option =
  match Ldb.page_exists_ids db title [ "logseq.class/Property" ] with
  | eid :: _ -> Ldb.ent_of_id db eid
  | [] -> None

let block_missing_uuid (e : entity) : bool =
  Ldb.uuid_value e "block/uuid" = None
  && Ldb.string_value e "block/title" <> None
  && Ldb.ref_ent e "block/page" <> None
  && Ldb.ref_ent e "block/parent" <> None
  && Ldb.string_value e "block/order" <> None
  && Ldb.int_value e "block/created-at" <> None
  && Ldb.int_value e "block/updated-at" <> None

let normal_page_missing_updated_at (e : entity) (dispatch_key : string) : bool =
  dispatch_key = "normal-page"
  && Ldb.int_value e "block/updated-at" = None
  && Ldb.int_value e "block/created-at" <> None

let is_num_prefixed (s : string) : bool =
  String.length s > 0 && s.[0] >= '0' && s.[0] <= '9'

let num_prefix_ident (ident : string) : string =
  match namespace_of ident with
  | Some ns ->
      let n = ident_name ident in
      if is_num_prefixed n then
        ns ^ "/" ^ "NUM-" ^ String.sub n 0 1 ^ String.sub n 1 (String.length n - 1)
      else ident
  | None -> ident

(* fix-invalid-blocks! *)
let fix_invalid_blocks (conn : conn)
    (errors : Db_validate.grouped_error list) : bool =
  let db = Conn.db conn in
  let entity_id_of (ge : Db_validate.grouped_error) : entity_id option =
    match Malli.map_get "db/id" ge.ge_entity with
    | Some (Int id) | Some (Ref id) -> Some id
    | _ -> None
  in
  let fix_tx_data =
    List.concat_map
      (fun (ge : Db_validate.grouped_error) ->
        match entity_id_of ge with
        | None -> []
        | Some eid ->
            (match Ldb.ent_of_id db eid with
             | None -> []
             | Some entity ->
                 let dispatch_key = ge.ge_dispatch_key in
                 let e = entity in
                 let id = e.id in
                 let ident = Ldb.ident_of e in
                 if ident = Some "logseq.property.embedding/hnsw-label" then
                   Db_migrate.delete_property db
                     "logseq.property.embedding/hnsw-label"
                 else if Ldb.value e "logseq.property/parent" <> None then
                   [ retract id "logseq.property/parent" ]
                 else if Ldb.is_class e && Ldb.value e "block/order" <> None
                 then [ retract id "block/order" ]
                 else if
                   (not (Ldb.is_page e))
                   && Ldb.string_value e "block/name" <> None
                 then [ retract id "block/name" ]
                 else if Ldb.value e "hide?" <> None then
                   [ retract id "hide?" ]
                 else if Ldb.value e "public?" <> None then
                   [ retract id "public?" ]
                 else if Ldb.value e "block/pre-block?" <> None then
                   [ retract id "block/pre-block?" ]
                 else if
                   Ldb.value e "logseq.property.embedding/hnsw-label" <> None
                 then [ retract id "logseq.property.embedding/hnsw-label" ]
                 else if
                   Ldb.value e
                     "logseq.property.embedding/hnsw-label-updated-at"
                   <> None
                 then
                   [ retract
                       id "logseq.property.embedding/hnsw-label-updated-at" ]
                 else if normal_page_missing_updated_at e dispatch_key then
                   [ add id "block/updated-at"
                       (Int (Option.get (Ldb.int_value e "block/created-at"))) ]
                 else if
                   Ldb.string_value e "block/title" = Some "External URL"
                   && Ldb.ref_ents e "block/tags" = []
                 then [ retract_entity id ]
                 else if
                   Ldb.is_property e
                   && List.exists
                        (fun (t : entity) ->
                          Ldb.ident_of t = Some "logseq.class/Tag")
                        (Ldb.ref_ents e "block/tags")
                 then
                   [ Wire.Array
                       [ kw "db/retract"; Wire.Int id; kw "block/tags"
                       ; kw "logseq.class/Tag" ] ]
                 else if
                   ident <> None
                   && user_class_namespace (Option.get ident)
                   && Ldb.value e "logseq.property/built-in?" = None
                   && not (Ldb.is_class e)
                 then
                   [ add_ident id "block/tags" "logseq.class/Tag"
                   ; Wire.Array
                       [ kw "db/retract"; Wire.Int id; kw "block/tags"
                       ; kw "logseq.class/Page" ] ]
                 else if
                   Ldb.is_class e && Ldb.value e "kv/value" <> None
                 then [ retract id "kv/value" ]
                 else if
                   Ldb.is_property e
                   && Ldb.ref_ents e "logseq.property.class/extends" <> []
                 then
                   List.map
                     (fun (c : entity) ->
                       Wire.Array
                         [ kw "db/retract"; Wire.Int id
                         ; kw "logseq.property.class/extends"; Wire.Int c.id ])
                     (Ldb.ref_ents e "logseq.property.class/extends")
                 else if Ldb.value e "block/level" <> None then
                   [ retract id "block/level" ]
                 else if
                   Ldb.is_class e && ident = None
                   && Ldb.string_value e "block/title" <> None
                 then
                   [ add id "db/ident"
                       (Keyword
                          (Db_ident.create_user_class_ident_from_name ~db
                             (Option.get (Ldb.string_value e "block/title")))) ]
                 else if
                   (match Ldb.ref_ent e "logseq.property/created-from-property"
                    with
                    | Some p ->
                        Ldb.string_value p "block/title" = Some "description"
                        && Ldb.ref_ent e "block/page" = None
                    | None -> false)
                 then
                   let property_id =
                     (Ldb.ref_ent e "logseq.property/created-from-property"
                      |> Option.get).id
                   in
                   [ add id "block/page" (Ref property_id)
                   ; add id "block/parent" (Ref property_id) ]
                 else if
                   ident <> None
                   && Ldb.value e "logseq.property/built-in?" <> None
                   && Ldb.ref_ent e "block/parent" <> None
                 then [ retract id "block/parent" ]
                 else if Ldb.value e "block/format" <> None then
                   [ retract id "block/format" ]
                 else if
                   Ldb.value e "logseq.property/ls-type"
                   = Some (Keyword "whiteboard-shape")
                 then [ retract_entity id ]
                 else if
                   Ldb.ref_ent e "block/page" <> None
                   && Ldb.ref_ent e "block/parent" = None
                 then
                   [ add id "block/parent"
                       (Ref
                          (Option.get (Ldb.ref_ent e "block/page")).id) ]
                 else if
                   (match Ldb.value e "logseq.property/created-by-ref" with
                    | Some (Ref _) -> false
                    | Some _ -> true
                    | None -> false)
                 then [ retract_entity id ]
                 else if block_missing_uuid e then
                   [ add id "block/uuid" (Uuid (Common_uuid.new_block_id ())) ]
                 else if
                   (match Ldb.value e "logseq.property/value" with
                    | Some (Vector _) -> true
                    | _ -> false)
                 then [ retract_entity id ]
                 else if
                   Ldb.value e "block/tx-id" <> None
                   && Ldb.string_value e "block/title" = None
                 then [ retract_entity id ]
                 else if
                   Ldb.string_value e "block/title" <> None
                   && Ldb.ref_ent e "block/page" = None
                   && Ldb.ref_ent e "block/parent" = None
                   && Ldb.string_value e "block/name" = None
                 then [ retract_entity id ]
                 else if ident = Some "block/path-refs" then
                   (try Db_migrate.remove_block_path_refs db
                    with _ -> [])
                 else if
                   Ldb.ref_ents e "block/tags" <> []
                   && not
                        (List.for_all Ldb.is_class
                           (Ldb.ref_ents e "block/tags"))
                 then
                   List.map
                     (fun (t : entity) ->
                       Wire.Array
                         [ kw "db/retract"; Wire.Int id; kw "block/tags"
                         ; Wire.Int t.id ])
                     (List.filter
                        (fun t -> not (Ldb.is_class t))
                        (Ldb.ref_ents e "block/tags"))
                 else if
                   dispatch_key = "normal-page"
                   && Ldb.ref_ent e "block/page" <> None
                 then [ retract id "block/page" ]
                 else if
                   dispatch_key = "block"
                   && Ldb.string_value e "block/title" = None
                 then [ retract_entity id ]
                 else if
                   dispatch_key = "block" && Ldb.ref_ent e "block/page" = None
                 then
                   let latest_journal_id =
                     match Ldb.get_latest_journals db with
                     | j :: _ -> Some j.id
                     | [] -> None
                   in
                   let page_id =
                     match Ldb.ref_ent e "block/parent" with
                     | Some p ->
                         (match Ldb.ref_ent p "block/page" with
                          | Some pg -> Some pg.id
                          | None -> None)
                     | None -> None
                   in
                   (match page_id, latest_journal_id with
                    | Some pid, _ -> [ add id "block/page" (Ref pid) ]
                    | None, Some jid ->
                        [ add id "block/page" (Ref jid)
                        ; add id "block/parent" (Ref jid) ]
                    | None, None ->
                        Printf.eprintf
                          "Don't know where to put the block %d\n%!" id;
                        [])
                 else if
                   dispatch_key = "block"
                   && (match Ldb.value e "logseq.property.table/sized-columns"
                       with
                       | Some (Map kvs) ->
                           List.exists
                             (fun (k, _) ->
                               match k with
                               | Keyword i ->
                                   namespace_of i = Some "user.class"
                               | _ -> false)
                             kvs
                       | _ -> false)
                 then
                   let new_value =
                     match
                       Ldb.value e "logseq.property.table/sized-columns"
                     with
                     | Some (Map kvs) ->
                         List.filter_map
                           (fun (k, v) ->
                             match k with
                             | Keyword i
                               when namespace_of i = Some "user.class" ->
                                 (match
                                    Ldb.ent_of_ref db (Ident i)
                                  with
                                  | Some class_ ->
                                      (match
                                         Ldb.string_value class_ "block/title"
                                       with
                                       | Some title ->
                                           (match
                                              get_property_by_title db title
                                            with
                                            | Some property ->
                                                (match
                                                   Ldb.ident_of property
                                                 with
                                                 | Some pi ->
                                                     Some (Keyword pi, v)
                                                 | None -> None)
                                            | None -> None)
                                       | None -> None)
                                  | None -> None)
                             | _ -> Some (k, v))
                           kvs
                     | _ -> []
                   in
                   [ add id "logseq.property.table/sized-columns"
                       (Map new_value) ]
                 else if
                   (List.of_seq (datoms db Eavt ~e:id ())
                    |> List.exists (fun (d : datom) ->
                           namespace_of d.a = Some "block.temp"))
                 then
                   List.of_seq (datoms db Eavt ~e:id ())
                   |> List.filter_map (fun (d : datom) ->
                          if namespace_of d.a = Some "block.temp" then
                            Some (retract id d.a)
                          else None)
                 else if
                   Ldb.ref_ent e "block/page" = None
                   && Ldb.ref_ent e "block/parent" = None
                   && Ldb.string_value e "block/name" = None
                 then [ retract_entity id ]
                 else if
                   dispatch_key = "property-value-block"
                   && Ldb.string_value e "block/title" <> None
                 then [ retract id "block/title" ]
                 else if
                   Ldb.is_class e
                   && Ldb.value e "logseq.property.class/extends" = None
                   && ident <> Some "logseq.class/Root"
                 then
                   [ add_ident id "logseq.property.class/extends"
                       "logseq.class/Root" ]
                 else if
                   (Ldb.is_class e || Ldb.is_property e)
                   && Ldb.internal_page e
                 then
                   [ Wire.Array
                       [ kw "db/retract"; Wire.Int id; kw "block/tags"
                       ; kw "logseq.class/Page" ] ]
                 else if
                   Ldb.value e "logseq.property.asset/remote-metadata"
                   <> None
                   && Ldb.value e "logseq.property.asset/type" = None
                 then [ retract_entity id ]
                 else []))
      errors
  in
  let class_as_properties =
    List.concat_map
      (fun ident ->
        List.of_seq (datoms db Avet ~a:ident ())
        |> List.concat_map (fun (d : datom) ->
               match d.v with
               | Ref vid ->
                   (match Ldb.ent_of_id db vid with
                    | Some entity when Ldb.is_class entity ->
                        (match
                           Ldb.string_value entity "block/title"
                         with
                         | Some title ->
                             (match get_property_by_title db title with
                              | Some property ->
                                  (match Ldb.ident_of property with
                                   | Some _ ->
                                       [ retract_v d.e d.a (Ref vid)
                                       ; Wire.Array
                                           [ kw "db/add"; Wire.Int d.e
                                           ; kw d.a; Wire.Int property.id ] ]
                                   | None -> [ retract_v d.e d.a (Ref vid) ])
                              | None -> [ retract_v d.e d.a (Ref vid) ])
                         | None -> [ retract_v d.e d.a (Ref vid) ])
                    | _ -> [])
               | _ -> []))
      [ "logseq.property.view/group-by-property"
      ; "logseq.property.table/pinned-columns" ]
    @ (List.of_seq (datoms db Eavt ())
       |> List.concat_map (fun (d : datom) ->
             if namespace_of d.a = Some "user.class" then
               let class_title =
                 match Ldb.ent_of_ref db (Ident d.a) with
                 | Some c -> Ldb.string_value c "block/title"
                 | None -> None
               in
               let property =
                 Option.bind class_title (fun t ->
                     get_property_by_title db t)
               in
               match property with
               | Some property ->
                   (match Ldb.ident_of property with
                    | Some pi ->
                        [ retract_v d.e d.a d.v
                        ; add d.e pi d.v ]
                    | None -> [ retract_v d.e d.a d.v ])
               | None -> [ retract_v d.e d.a d.v ]
             else []))
  in
  let tx_data = fix_tx_data @ class_as_properties in
  if tx_data = [] then false
  else
    match
      transact_fix conn tx_data [ "fix-db?", Bool true ]
    with
    | Some report -> report.tx_data <> []
    | None -> false

(* fix-num-prefix-db-idents! *)
let fix_num_prefix_db_idents (conn : conn) : unit =
  let db = Conn.db conn in
  let tx_data =
    List.of_seq (datoms db Avet ~a:"db/ident" ())
    |> List.concat_map (fun (d : datom) ->
           match d.v with
           | Keyword ident when is_num_prefixed (ident_name ident) ->
               let new_ident = num_prefix_ident ident in
               let is_prop =
                 match Ldb.ent_of_ref db (Ident ident) with
                 | Some e -> Ldb.is_property e
                 | None -> false
               in
               add d.e "db/ident" (Keyword new_ident)
               :: (if is_prop then
                     List.of_seq (datoms db Avet ~a:ident ())
                     |> List.concat_map (fun (dd : datom) ->
                            [ retract_v dd.e dd.a dd.v
                            ; add dd.e new_ident dd.v ])
                   else [])
           | _ -> [])
  in
  let hidden_columns_tx =
    List.of_seq
      (datoms db Avet ~a:"logseq.property.table/hidden-columns" ())
    |> List.concat_map (fun (d : datom) ->
           match d.v with
           | Keyword ident when is_num_prefixed (ident_name ident) ->
               [ retract_v d.e d.a d.v
               ; add d.e d.a (Keyword (num_prefix_ident ident)) ]
           | _ -> [])
  in
  let tx_data' = tx_data @ hidden_columns_tx in
  if tx_data' <> [] then
    ignore (transact_fix conn tx_data' [])

(* fix-non-closed-values! *)
let fix_non_closed_values (conn : conn) : unit =
  let db = Conn.db conn in
  let all_properties =
    match Ldb.ent_of_ref db (Ident "logseq.class/Property") with
    | Some tag ->
        List.of_seq (datoms db Avet ~a:"block/tags" ~v:(Ref tag.id) ())
        |> List.filter_map (fun (d : datom) -> Ldb.ent_of_id db d.e)
    | None -> []
  in
  let properties =
    List.filter
      (fun (p : entity) -> Ldb.ref_ents p "block/_closed-value-property" <> [])
      all_properties
  in
  let tx_data =
    List.concat_map
      (fun (property : entity) ->
        let matches =
          Ldb.ref_ents property "block/_closed-value-property"
          |> List.map (fun (e : entity) -> e.id)
        in
        match Ldb.ident_of property with
        | Some p_ident ->
            List.of_seq (datoms db Avet ~a:p_ident ())
            |> List.filter_map (fun (d : datom) ->
                   let in_matches =
                     match d.v with
                     | Ref vid -> List.mem vid matches
                     | _ -> false
                   in
                   let is_placeholder =
                     match d.v with
                     | Ref vid ->
                         (match Ldb.ent_of_id db vid with
                          | Some ve ->
                              Ldb.ident_of ve
                              = Some "logseq.property/empty-placeholder"
                          | None -> false)
                     | _ -> false
                   in
                   if in_matches || is_placeholder then None
                   else Some (retract_v d.e p_ident d.v))
        | None -> [])
      properties
  in
  if tx_data <> [] then
    ignore
      (transact_fix conn tx_data [ "fix-db?", Bool true ])

(* fix-icon-wrong-type! *)
let fix_icon_wrong_type (conn : conn) : unit =
  let db = Conn.db conn in
  match Ldb.ent_of_ref db (Ident "logseq.property/icon") with
  | Some icon
    when Ldb.value icon "db/valueType" = Some (Keyword "db.type/ref") ->
      let tx_data =
        retract icon.id "db/valueType"
        :: (List.of_seq
              (datoms db Avet ~a:"logseq.property/icon" ())
            |> List.map (fun (d : datom) -> retract d.e d.a))
      in
      ignore
        (transact_fix conn tx_data [ "fix-db?", Bool true ])
  | _ -> ()

(* fix-extends-cardinality! *)
let fix_extends_cardinality (conn : conn) : unit =
  let db = Conn.db conn in
  let cur =
    match Ldb.ent_of_ref db (Ident "logseq.property.class/extends") with
    | Some e -> Ldb.value e "db/cardinality"
    | None -> None
  in
  if cur <> Some (Keyword "db.cardinality/many") then
    ignore
      (transact_fix conn
         [ wire_map
             [ "db/ident", Keyword "logseq.property.class/extends"
             ; "db/cardinality", Keyword "db.cardinality/many"
             ; "db/index", Bool true ] ]
         [ "fix-db?", Bool true ])

(* validate-db-result *)
type db_result =
  { dr_errors : Db_validate.grouped_error list
  ; dr_datom_count : int
  ; dr_entities : Db_malli_schema.ent_map list
  ; dr_invalid_entity_ids : entity_id list }

let validate_db_result (db : db) : db_result =
  let r = Db_validate.validate_db db in
  let ids =
    List.fold_left
      (fun acc (ge : Db_validate.grouped_error) ->
        match Malli.map_get "db/id" ge.ge_entity with
        | Some (Int id) | Some (Ref id) ->
            if List.mem id acc then acc else acc @ [ id ]
        | _ -> acc)
      [] r.errors
  in
  { dr_errors = r.errors
  ; dr_datom_count = r.datom_count
  ; dr_entities = r.entities
  ; dr_invalid_entity_ids = ids }

let log_validation_errors (errors : Db_validate.grouped_error list) : unit =
  List.iter
    (fun (ge : Db_validate.grouped_error) ->
      Printf.eprintf "validation error entity: %d errors: %d\n%!"
        (match Malli.map_get "db/id" ge.ge_entity with
         | Some (Int i) | Some (Ref i) -> i
         | _ -> -1)
        (List.length ge.ge_errors))
    errors

let humanize_grouped (ge : Db_validate.grouped_error) : Wire.t =
  Wire.Map
    [ kw "entity", Ds_wire.transit_of_value ge.ge_entity
    ; kw "errors",
      Ds_wire.transit_of_value (Malli.humanize ge.ge_errors) ]

let rec validate_and_fix_invalid_blocks (conn : conn) : db_result =
  let result = validate_db_result (Conn.db conn) in
  log_validation_errors result.dr_errors;
  if result.dr_errors <> [] && fix_invalid_blocks conn result.dr_errors then
    validate_and_fix_invalid_blocks conn
  else result

(* worker-db-validate/validate-db — returns the wire result map *)
let validate_db ?(fix = true) (conn : conn) : Wire.t =
  if fix then begin
    fix_extends_cardinality conn;
    fix_icon_wrong_type conn;
    ignore (Db_migrate.ensure_built_in_data_exists conn);
    fix_non_closed_values conn;
    fix_num_prefix_db_idents conn
  end;
  let result =
    if fix then validate_and_fix_invalid_blocks conn
    else
      let r = validate_db_result (Conn.db conn) in
      log_validation_errors r.dr_errors;
      r
  in
  let db = Conn.db conn in
  let counts =
    Db_validate.graph_counts db result.dr_entities result.dr_datom_count
  in
  let errors_wire =
    Wire.Array (List.map humanize_grouped result.dr_errors)
  in
  if result.dr_errors <> [] then begin
    Broadcast.to_clients ~kind:"log"
      ~transit_payload:
        (Transit_codec.to_string
           (Wire.Array
              [ kw "log"
              ; Wire.Array
                  [ kw "db-invalid"; kw "error"
                  ; Wire.Map
                      [ kw "msg", Wire.String "Validation errors"
                      ; kw "errors", errors_wire ] ] ]));
    Broadcast.to_clients ~kind:"notification"
      ~transit_payload:
        (Transit_codec.to_string
           (Wire.Array
              [ kw "notification"
              ; Wire.Array
                  [ Wire.String
                      (Printf.sprintf
                         "Validation detected %d invalid block(s). These \
                          blocks may be buggy.%s"
                         (List.length result.dr_errors)
                         (if fix then
                            " Attempting to fix invalid blocks. Run \
                             validation again to see if they were fixed."
                          else ""))
                  ; kw "warning"; Wire.Bool false ] ]))
  end
  else
    Broadcast.to_clients ~kind:"notification"
      ~transit_payload:
        (Transit_codec.to_string
           (Wire.Array
              [ kw "notification"
              ; Wire.Array
                  [ Wire.String
                      (Printf.sprintf
                         "Your graph is valid! {:entities %d, :pages %d,                           :blocks %d, :classes %d, :properties %d,                           :objects %d, :property-pairs %d, :datoms %d}"
                         counts.entities counts.pages counts.blocks
                         counts.classes counts.properties counts.objects
                         counts.property_pairs counts.datoms)
                  ; kw "success"; Wire.Bool false ] ]));
  Wire.Map
    [ kw "errors", errors_wire
    ; ( kw "invalid-entity-ids"
      , Wire.Array
          (List.map (fun i -> Wire.Int i) result.dr_invalid_entity_ids) )
    ; kw "entities", Wire.Int counts.entities
    ; kw "pages", Wire.Int counts.pages
    ; kw "blocks", Wire.Int counts.blocks
    ; kw "classes", Wire.Int counts.classes
    ; kw "properties", Wire.Int counts.properties
    ; kw "objects", Wire.Int counts.objects
    ; kw "property-pairs", Wire.Int counts.property_pairs
    ; kw "datoms", Wire.Int counts.datoms ]

(* db-core.cljs notify-invalid-data — cljs checks (not dev?) via
   goog.DEBUG; OCaml worker has no dev flag, treated as production. *)
let notify_invalid_data (report : tx_report) (errors : string list) : unit =
  let meta_flag k = Db_tx.tx_meta_flag report.tx_meta k in
  let undo_or_redo = meta_flag "undo?" || meta_flag "redo?" in
  if not undo_or_redo then begin
    Broadcast.to_clients ~kind:"notification"
      ~transit_payload:
        (Transit_codec.to_string
           (Wire.Array
              [ kw "notification"
              ; Wire.Array
                  [ Wire.Nil; kw "error"; Wire.Nil; Wire.Nil; Wire.Nil
                  ; Wire.Map
                      [ kw "i18n-key"
                      , kw "storage/invalid-data-writing" ] ] ]));
    Comlink.post_message
      (Transit_codec.to_string
         (Wire.Array
            [ kw "capture-error"
            ; Wire.Map
                [ ( kw "error"
                  , Wire.String "Invalid data writing to db" )
                ; ( kw "extra"
                  , Wire.Map
                      [ ( kw "errors"
                        , Wire.String (String.concat "; " errors) )
                      ; ( kw "tx-meta"
                        , Ds_wire.transit_of_tx_meta report.tx_meta ) ] ) ] ]))
  end

(* worker-db-validate/recompute-checksum-diagnostics *)
let recompute_checksum_diagnostics (_repo : string) (conn : conn)
    (local_checksum : value) (remote_checksum : value) : Wire.t =
  let diag =
    Db_sync_checksum.recompute_checksum_diagnostics (Conn.db conn)
  in
  let get k =
    match diag with
    | Wire.Map kvs ->
        Option.value
          (List.assoc_opt (kw k) kvs) ~default:Wire.Nil
    | _ -> Wire.Nil
  in
  Wire.Map
    [ kw "recomputed-checksum", get "checksum"
    ; kw "local-checksum", Ds_wire.transit_of_value local_checksum
    ; kw "remote-checksum", Ds_wire.transit_of_value remote_checksum
    ; kw "e2ee?", get "e2ee?"
    ; kw "checksum-attrs", get "attrs"
    ; kw "blocks", get "blocks" ]
