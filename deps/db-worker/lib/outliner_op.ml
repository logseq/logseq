(* outliner-op — :thread-api/apply-outliner-ops dispatch.
   Source: deps/outliner/src/logseq/outliner/op.cljs *)

open Datascript

(* op entries: [:op-kw [arg1 arg2 ...]] as Wire.t *)
exception Invalid_outliner_op of string

(* op-construct/semantic-outliner-ops *)
let semantic_outliner_op_names =
  [ "save-block"; "insert-blocks"; "apply-template"; "move-blocks"
  ; "move-blocks-up-down"; "indent-outdent-blocks"; "delete-blocks"
  ; "create-page"; "rename-page"; "delete-page"; "restore-recycled"
  ; "recycle-delete-permanently"; "upsert-property" ]

(* ---------- wire arg decoding ---------- *)

let op_of_entry (entry : Wire.t) : (string * Wire.t list) option =
  match entry with
  | Wire.Array [ Wire.Keyword op; Wire.Array args ]
  | Wire.Array [ Wire.Keyword op; Wire.List args ]
  | Wire.List [ Wire.Keyword op; Wire.Array args ]
  | Wire.List [ Wire.Keyword op; Wire.List args ] ->
      Some (op, args)
  | Wire.Array [ Wire.Keyword op ] | Wire.List [ Wire.Keyword op ] ->
      Some (op, [])
  | _ -> None

let uuid_of_wire (w : Wire.t) : string option =
  match w with
  | Wire.Uuid u -> Some u
  | Wire.String u -> Some u
  | _ -> None

let entity_of_uuid db (u : string) : entity option =
  entity db (Lookup_ref ("block/uuid", Uuid u))

let entities_of_uuids db (ws : Wire.t list) : entity list =
  List.filter_map (fun w -> Option.bind (uuid_of_wire w) (entity_of_uuid db)) ws

let block_map_of_wire (w : Wire.t) : Block_map.t =
  match Ds_wire.value_of_transit w with
  | Map kvs ->
      List.filter_map
        (fun (k, v) ->
          match k with
          | Keyword a -> Some (a, v)
          | String a -> Some (a, v)
          | _ -> None)
        kvs
  | _ -> []

let kw_value (w : Wire.t) : string option =
  match w with Wire.Keyword s | Wire.String s -> Some s | _ -> None

let bool_of_wire (w : Wire.t) : bool option =
  match w with Wire.Bool b -> Some b | _ -> None

let opt_bool opts k = Option.value (Option.bind (Cljs_map.get opts k) bool_of_wire) ~default:false

(* cljs save-block opts keys *)
let save_opts_of (opts : Wire.t) : Outliner_core.save_opts =
  { retract_attributes = Option.value (Option.bind (Cljs_map.get opts "retract-attributes?") bool_of_wire) ~default:true
  ; retract_attr_list =
      (match Cljs_map.get opts "retract-attribute-list" with
       | Some (Wire.Array xs) | Some (Wire.List xs) ->
           List.filter_map kw_value xs
       | _ -> [])
  ; outliner_op = Option.bind (Cljs_map.get opts "outliner-op") kw_value }

(* cljs insert-blocks opts keys *)
let insert_opts_of (opts : Wire.t) : Outliner_core.insert_opts =
  { sibling = opt_bool opts "sibling?"
  ; bottom = opt_bool opts "bottom?"
  ; top = opt_bool opts "top?"
  ; indent = opt_bool opts "indent?"
  ; up = opt_bool opts "up?"
  ; keep_uuid = opt_bool opts "keep-uuid?"
  ; keep_block_order = opt_bool opts "keep-block-order?"
  ; outliner_op = Option.bind (Cljs_map.get opts "outliner-op") kw_value
  ; outliner_real_op = Option.bind (Cljs_map.get opts "outliner-real-op") kw_value
  ; replace_empty_target = opt_bool opts "replace-empty-target?"
  ; replace_empty_target_specified =
      Option.is_some (Cljs_map.get opts "replace-empty-target?")
  ; update_timestamps =
      Option.value
        (Option.bind (Cljs_map.get opts "update-timestamps?") bool_of_wire)
        ~default:true
  ; insert_template = opt_bool opts "insert-template?"
  ; created_from_property =
      Option.map Ds_wire.value_of_transit
        (Cljs_map.get opts "created-from-property") }

(* ---------- op helpers ---------- *)

(* toggle-reaction! *)
let reaction_user_id (reaction : entity) : entity_id option =
  match Ldb.ref_ent reaction "logseq.property/created-by-ref" with
  | Some e -> Some e.id
  | None -> None

let toggle_reaction (conn : conn) (target_uuid : string) (emoji_id : string)
    (user_uuid : string option) : bool =
  match entity_of_uuid (Conn.db conn) target_uuid with
  | None -> false
  | Some target ->
      let db = Conn.db conn in
      let user_id =
        Option.bind user_uuid (entity_of_uuid db)
        |> Option.map (fun e -> e.id)
      in
      let reactions = Ldb.ref_ents target "logseq.property.reaction/_target" in
      let existing =
        List.find_opt
          (fun r ->
            Ldb.value r "logseq.property.reaction/emoji-id" = Some (String emoji_id)
            &&
            (match user_id with
             | Some uid -> reaction_user_id r = Some uid
             | None -> reaction_user_id r = None))
          reactions
      in
      (match existing with
       | Some existing ->
           ignore (Db_tx.transact ~tx_meta:[ ("outliner-op", Keyword "toggle-reaction") ]
             conn [ RetractEntity (Entity_id existing.id) ]);
           true
       | None ->
           let now = Date_time_util.time_ms () in
           let attrs =
             [ ("block/uuid", One_value (Uuid (Common_uuid.new_block_id ())))
             ; ("block/created-at", One_value (Instant now))
             ; ("logseq.property.reaction/emoji-id", One_value (String emoji_id))
             ; ("logseq.property.reaction/target", One_entity { db_id = Some (Entity_id target.id); attrs = [] }) ]
           in
           let attrs =
             match user_id with
             | Some uid ->
                 attrs
                 @ [ ("logseq.property/created-by-ref"
                     , One_entity { db_id = Some (Entity_id uid); attrs = [] }) ]
             | None -> attrs
           in
           ignore (Db_tx.transact ~tx_meta:[ ("outliner-op", Keyword "toggle-reaction") ]
             conn [ Entity { db_id = None; attrs } ]);
           true)

(* apply-insert-blocks-op! *)
let apply_insert_blocks_op conn result_ref (blocks : Wire.t list)
    (target_block_id : Wire.t) (opts : Wire.t) : unit =
  match Option.bind (uuid_of_wire target_block_id) (entity_of_uuid (Conn.db conn)) with
  | None -> ()
  | Some target_block ->
      let blocks = List.map block_map_of_wire blocks in
      let target_bm = Block_map.of_entity target_block in
      let r =
        Outliner_core.insert_blocks_conn conn blocks target_bm
          (insert_opts_of opts) (block_map_of_wire opts)
      in
      result_ref :=
        Option.map
          (fun (r : Outliner_core.tx_result) ->
            Ds_wire.transit_of_tx_result r.tx_data r.tx_meta)
          r

(* template-children-blocks — cljs takes rest of get-block-and-children
   (children only); the first child carries
   :logseq.property/used-template = template's db/id *)
let template_children_blocks (db : db) (template_id : Wire.t)
    : Block_map.t list =
  match uuid_of_wire template_id with
  | None -> []
  | Some uuid -> (
      match entity db (Lookup_ref ("block/uuid", Uuid uuid)) with
      | None -> []
      | Some template -> (
          match
            Ldb.get_block_and_children db ~include_property_block:true
              uuid
          with
          | _root :: first_child :: others ->
              Block_map.put (Block_map.of_entity first_child)
                "logseq.property/used-template" (Ref template.id)
              :: List.map Block_map.of_entity others
          | _ -> []))

(* apply-template-op! *)
let apply_template_op conn result_ref (template_id : Wire.t)
    (target_block_id : Wire.t) (opts : Wire.t) : unit =
  match Option.bind (uuid_of_wire target_block_id) (entity_of_uuid (Conn.db conn)) with
  | None -> ()
  | Some target ->
      let db = Conn.db conn in
      let blocks =
        match Cljs_map.get opts "template-blocks" with
        | Some (Wire.Array xs) | Some (Wire.List xs) when xs <> [] ->
            List.map block_map_of_wire xs
        | _ -> template_children_blocks db template_id
      in
      (* ensure-template-journal-pages! *)
      List.iter
        (fun journal_day ->
          match Ldb.get_journal_page_by_day db journal_day with
          | Some _ -> ()
          | None ->
              let title =
                match
                  Ldb.ent_of_ref db (Ident "logseq.class/Journal")
                with
                | Some e -> (
                    match Ldb.string_value e "logseq.property.journal/title-format" with
                    | Some fmt -> Ldb.journal_title_of_day journal_day fmt
                    | None -> Ldb.journal_title_of_day journal_day
                                Date_time_util.default_journal_title_formatter)
                | None ->
                    Ldb.journal_title_of_day journal_day
                      Date_time_util.default_journal_title_formatter
              in
              ignore
                (Outliner_page.create_bang conn title
                   ~opts:(fun () ->
                     Outliner_page.create db title ~journal:true ())
                   ()))
        (Outliner_template.dynamic_template_journal_days blocks);
      let blocks =
        Outliner_template.resolve_dynamic_template_blocks db target blocks
      in
      (match blocks with
       | [] -> ()
       | _ ->
           let sibling =
             match Option.bind (Cljs_map.get opts "sibling?") bool_of_wire with
             | Some s -> s
             | None ->
                 (match Ldb.ref_ents target "block/_parent" with
                  | _ :: _ -> false
                  | [] -> true)
           in
           let opts' =
             { (insert_opts_of opts) with
               sibling
             ; insert_template = true
             ; outliner_op = Some "insert-template-blocks" }
           in
           let opts_entry =
             Block_map.put (block_map_of_wire opts) "outliner-op"
               (Keyword "insert-template-blocks")
           in
           let r =
             Outliner_core.insert_blocks_conn conn blocks
               (Block_map.of_entity target) opts' opts_entry
           in
           result_ref :=
             Option.map
               (fun (r : Outliner_core.tx_result) ->
                 Ds_wire.transit_of_tx_result r.tx_data r.tx_meta)
               r)

(* resolve-indent-outdent-opts — resolves :parent-original uuid to
   entity; missing parent throws *)
exception Missing_parent_original

let resolve_indent_outdent_opts (db : db) (opts : Wire.t)
    : (entity option * Wire.t) =
  match Cljs_map.get_in opts [ "parent-original"; "block/uuid" ] with
  | Some w -> (
      match uuid_of_wire w with
      | Some u -> (
          match entity_of_uuid db u with
          | Some e -> (Some e, opts)
          | None -> raise Missing_parent_original)
      | None -> (None, opts))
  | None -> (None, opts)

(* outliner.op/ops-schema — [:sequential op-schema], each op
   [:catn [:op :keyword] [:args [:tuple specs]]] dispatched on first.
   Mirrored declaratively on Wire.t so apply_ops asserts the same shape
   the cljs malli validator enforces (e.g. ::block-id is uuid?, which
   rejects lookup-ref vectors). *)
type op_arg_spec =
  | SBlock
  | SSchema
  | SBlockId
  | SEmojiId
  | SPropertyId
  | SValue
  | SOption
  | SImportEdn
  | STitle
  | SUuid
  | SMaybeUuid
  | SBool
  | SMaybe of op_arg_spec
  | SSeqOf of op_arg_spec

let op_args_spec : (string * op_arg_spec list) list =
  [ "save-block", [ SBlock; SOption ]
  ; "insert-blocks", [ SSeqOf SBlock; SBlockId; SOption ]
  ; "apply-template", [ SBlockId; SBlockId; SOption ]
  ; "delete-blocks", [ SSeqOf SBlockId; SOption ]
  ; "move-blocks", [ SSeqOf SBlockId; SBlockId; SOption ]
  ; "move-blocks-up-down", [ SSeqOf SBlockId; SBool ]
  ; "indent-outdent-blocks", [ SSeqOf SBlockId; SBool; SOption ]
  ; "collapse-expand-blocks", [ SSeqOf SBlock; SOption ]
  ; "upsert-property", [ SMaybe SPropertyId; SSchema; SOption ]
  ; "set-block-property", [ SBlockId; SPropertyId; SValue ]
  ; "remove-block-property", [ SBlockId; SPropertyId ]
  ; "delete-property-value", [ SBlockId; SPropertyId; SValue ]
  ; "batch-delete-property-value",
    [ SSeqOf SBlockId; SPropertyId; SValue ]
  ; "create-property-text-block",
    [ SMaybe SBlockId; SPropertyId; SValue; SOption ]
  ; "collapse-expand-block-property", [ SBlockId; SPropertyId; SBool ]
  ; "batch-set-property",
    [ SSeqOf SBlockId; SPropertyId; SValue; SOption ]
  ; "batch-remove-property", [ SSeqOf SBlockId; SPropertyId ]
  ; "class-add-property", [ SBlockId; SPropertyId ]
  ; "class-remove-property", [ SBlockId; SPropertyId ]
  ; "upsert-closed-value", [ SPropertyId; SOption ]
  ; "delete-closed-value", [ SPropertyId; SBlockId ]
  ; "add-existing-values-to-closed-values",
    [ SPropertyId; SSeqOf SValue ]
  ; "batch-import-edn", [ SImportEdn; SOption ]
  ; "transact", [ SSeqOf SValue; SOption ]
  ; "create-page", [ STitle; SOption ]
  ; "rename-page", [ SUuid; STitle ]
  ; "delete-page", [ SUuid; SOption ]
  ; "restore-recycled", [ SUuid ]
  ; "recycle-delete-permanently", [ SUuid ]
  ; "toggle-reaction", [ SUuid; SEmojiId; SMaybeUuid ] ]

let rec arg_ok (spec : op_arg_spec) (v : Wire.t) : bool =
  match spec with
  | SValue -> true
  | SBlock | SSchema | SImportEdn ->
      (match v with Wire.Map _ -> true | _ -> false)
  | SBlockId | SUuid -> (match v with Wire.Uuid _ -> true | _ -> false)
  | SMaybeUuid ->
      (match v with Wire.Uuid _ | Wire.Nil -> true | _ -> false)
  | SEmojiId | STitle -> (match v with Wire.String _ -> true | _ -> false)
  | SPropertyId ->
      (match v with
       | Wire.Keyword s ->
           (match String.index_opt s '/' with
            | Some i -> i > 0 && i < String.length s - 1
            | None -> false)
       | _ -> false)
  | SOption -> (match v with Wire.Map _ | Wire.Nil -> true | _ -> false)
  | SBool -> (match v with Wire.Bool _ -> true | _ -> false)
  | SMaybe s -> (match v with Wire.Nil -> true | _ -> arg_ok s v)
  | SSeqOf s ->
      (match v with
       | Wire.Array xs | Wire.List xs -> List.for_all (arg_ok s) xs
       | _ -> false)

let validate_ops (raw_entries : Wire.t list) : unit =
  List.iter
    (fun entry ->
      match op_of_entry entry with
      | Some (op, args) ->
          (match List.assoc_opt op op_args_spec with
           | Some specs
             when List.length args = List.length specs
                  && List.for_all2 arg_ok specs args ->
               ()
           | _ -> raise (Invalid_outliner_op "invalid op args"))
      | None -> raise (Invalid_outliner_op "invalid op"))
    raw_entries

(* cljs ops arg shapes — used by apply_op dispatch *)

let get_block_ids (w : Wire.t) : Wire.t list =
  match w with
  | Wire.Array xs | Wire.List xs | Wire.Set xs -> xs
  | _ -> []

(* apply-op! — returns the op result wire value (or None) *)
let apply_op (conn : conn) (opts' : Wire.t) (op : string) (args : Wire.t list)
    : Wire.t option =
  let db () = Conn.db conn in
  match op, args with
  (* blocks *)
  | "save-block", [ block; opts ] ->
      let opts_map =
        match opts with Wire.Map _ -> opts | _ -> Cljs_map.empty_map
      in
      ignore
        (Outliner_core.save_block_conn conn (block_map_of_wire block)
           (save_opts_of opts_map) (block_map_of_wire opts_map));
      None
  | "insert-blocks", [ blocks; target_block_id; opts ] ->
      let result_ref = ref None in
      apply_insert_blocks_op conn result_ref (get_block_ids blocks)
        target_block_id
        (match opts with Wire.Map _ -> opts | _ -> Cljs_map.empty_map);
      !result_ref
  | "apply-template", [ template_id; target_block_id; opts ] ->
      let result_ref = ref None in
      apply_template_op conn result_ref template_id target_block_id
        (match opts with Wire.Map _ -> opts | _ -> Cljs_map.empty_map);
      !result_ref
  | "delete-blocks", [ block_ids; opts ] ->
      let blocks = entities_of_uuids (db ()) (get_block_ids block_ids) in
      let opts_merged = Cljs_map.merge opts opts' in
      ignore
        (Outliner_core.delete_blocks_conn conn
           (List.map Block_map.of_entity blocks)
           (block_map_of_wire opts_merged));
      None
  | "move-blocks", [ block_ids; target_block_id; opts ] ->
      let blocks = entities_of_uuids (db ()) (get_block_ids block_ids) in
      (match
         Option.bind (uuid_of_wire target_block_id) (entity_of_uuid (db ()))
       with
       | Some target_block when blocks <> [] ->
           Outliner_core.move_blocks_conn conn blocks target_block
             (insert_opts_of
                (match opts with Wire.Map _ -> opts | _ -> Cljs_map.empty_map))
             (block_map_of_wire opts)
           |> ignore
       | _ -> ());
      None
  | "move-blocks-up-down", [ block_ids; up ] ->
      let blocks = entities_of_uuids (db ()) (get_block_ids block_ids) in
      let up = Option.value (bool_of_wire up) ~default:false in
      (match blocks with
       | [] -> ()
       | _ -> Outliner_core.move_blocks_up_down_conn conn blocks up);
      None
  | "indent-outdent-blocks", [ block_ids; indent; opts ] ->
      let blocks = entities_of_uuids (db ()) (get_block_ids block_ids) in
      let indent = Option.value (bool_of_wire indent) ~default:false in
      let parent_original, opts' =
        resolve_indent_outdent_opts (db ())
          (match opts with Wire.Map _ -> opts | _ -> Cljs_map.empty_map)
      in
      (match blocks with
       | [] -> ()
       | _ ->
           Outliner_core.indent_outdent_blocks_conn conn blocks indent
             ?parent_original (block_map_of_wire opts'));
      None
  | "collapse-expand-blocks", [ blocks; opts ] ->
      let tx_ops =
        List.filter_map
          (fun w -> Some (Block_map.to_tx_op (db ()) (block_map_of_wire w)))
          (get_block_ids blocks)
      in
      ignore (Db_tx.transact ~tx_meta:(Ds_wire.tx_meta_of_transit opts) conn tx_ops);
      None

  (* properties — Wire-space ops (outliner_property) *)
  | "upsert-property", [ property_id; schema; opts ] ->
      let opts = match opts with Wire.Map _ -> opts | _ -> Cljs_map.empty_map in
      let property_name = Option.bind (Cljs_map.get opts "property-name") kw_value in
      let properties =
        match Cljs_map.get opts "properties" with
        | Some (Wire.Map kvs) ->
            List.filter_map
              (fun (k, v) -> Option.map (fun k -> (k, v)) (kw_value k))
              kvs
        | _ -> []
      in
      let e =
        Outliner_property.upsert_property conn
          (match property_id with Wire.Nil -> None | _ -> kw_value property_id)
          schema ~property_name ~properties
      in
      Some (Plain_value.worker_plain_entity (db ()) e)
  | "set-block-property", [ block_id; property_id; v ] ->
      Outliner_property.set_block_property conn block_id
        (Option.value (kw_value property_id) ~default:"")
        v;
      None
  | "remove-block-property", [ block_id; property_id ] ->
      Outliner_property.remove_block_property conn block_id
        (Option.value (kw_value property_id) ~default:"");
      None
  | "delete-property-value", [ block_id; property_id; v ] ->
      Outliner_property.delete_property_value conn block_id
        (Option.value (kw_value property_id) ~default:"")
        v;
      None
  | "create-property-text-block", [ block_id; property_id; v; opts ] ->
      let block_id' =
        match uuid_of_wire block_id with
        | Some u ->
            Some (Wire.Array [ Wire.Keyword "block/uuid"; Wire.Uuid u ])
        | None -> None
      in
      let opts_map = match opts with Wire.Map _ -> opts | _ -> Cljs_map.empty_map in
      ignore
        (Outliner_property.create_property_text_block conn ~block_id:block_id'
           (Option.value (kw_value property_id) ~default:"") v
           ?new_block_id:(Option.bind (Cljs_map.get opts_map "new-block-id")
                            uuid_of_wire)
           ~set_block_property:
             (Option.value
                (Option.bind (Cljs_map.get opts_map "set-block-property?")
                   bool_of_wire)
                ~default:true)
           ());
      None
  | "batch-set-property", [ block_ids; property_id; v; _opts ] ->
      Outliner_property.batch_set_property conn (get_block_ids block_ids)
        (Option.value (kw_value property_id) ~default:"")
        v
        ?entity_id_opt:(Option.bind (Cljs_map.get
                          (match _opts with Wire.Map _ -> _opts | _ -> Cljs_map.empty_map)
                          "entity-id-opt?") bool_of_wire)
        ?preserve_task_tag:(Option.bind (Cljs_map.get
                              (match _opts with Wire.Map _ -> _opts | _ -> Cljs_map.empty_map)
                              "preserve-task-tag?") bool_of_wire)
        ();
      None
  | "batch-remove-property", [ block_ids; property_id ] ->
      Outliner_property.batch_remove_property conn (get_block_ids block_ids)
        (Option.value (kw_value property_id) ~default:"")
        ();
      None
  | "batch-delete-property-value", [ block_ids; property_id; v ] ->
      Outliner_property.batch_delete_property_value conn (get_block_ids block_ids)
        (Option.value (kw_value property_id) ~default:"")
        v;
      None
  | "class-add-property", [ class_id; property_id ] ->
      Outliner_property.class_add_property conn
        (Option.value (uuid_of_wire class_id) ~default:"")
        (Option.value (kw_value property_id) ~default:"");
      None
  | "class-remove-property", [ class_id; property_id ] ->
      Outliner_property.class_remove_property conn
        (Option.value (uuid_of_wire class_id) ~default:"")
        (Option.value (kw_value property_id) ~default:"");
      None
  | "upsert-closed-value", [ property_id; opts ] ->
      let opts_map = match opts with Wire.Map _ -> opts | _ -> Cljs_map.empty_map in
      Outliner_property.upsert_closed_value conn
        (Option.value (kw_value property_id) ~default:"")
        ~id:(Option.bind (Cljs_map.get opts_map "id") uuid_of_wire)
        ~value:(Option.value (Cljs_map.get opts_map "value") ~default:Wire.Nil)
        ~description:(Option.bind (Cljs_map.get opts_map "description")
                        (fun w -> match w with Wire.String s -> Some s | _ -> None))
        ~scoped_class_id:Wire.Nil;
      None
  | "delete-closed-value", [ property_id; value_block_id ] ->
      Outliner_property.delete_closed_value conn
        (Option.value (kw_value property_id) ~default:"")
        (Option.value (uuid_of_wire value_block_id) ~default:"");
      None
  | "add-existing-values-to-closed-values", [ property_id; values ] ->
      Outliner_property.add_existing_values_to_closed_values conn
        (Option.value (kw_value property_id) ~default:"")
        (List.filter_map uuid_of_wire (get_block_ids values));
      None
  | "batch-import-edn", [ export_map; import_options ] -> (
      match !Sync_deps.batch_import_edn_fn with
      | Some f -> f conn export_map import_options
      | None -> raise (Invalid_outliner_op "batch-import-edn unavailable"))

  (* transact *)
  | "transact", [ tx_data; tx_meta ] ->
      let tx_ops =
        List.filter_map
          (fun w ->
            Outliner_core.tx_op_of_value (db ()) (Ds_wire.value_of_transit w))
          (get_block_ids tx_data)
      in
      ignore (Db_tx.transact ~tx_meta:(Ds_wire.tx_meta_of_transit tx_meta) conn tx_ops);
      None

  (* page ops *)
  | "create-page", [ title; options ] ->
      let opts =
        match options with Wire.Map _ -> options | _ -> Cljs_map.empty_map
      in
      (match kw_value title with
       | Some title ->
           let t, uuid =
             Outliner_page.create_bang conn title
               ~opts:(fun () ->
                 Outliner_page.create (db ()) title
                   ?uuid:(Option.bind (Cljs_map.get opts "uuid") uuid_of_wire)
                   ?tags:(match Cljs_map.get opts "tags" with
                          | Some w -> Some (get_block_ids w)
                          | None -> None)
                   ?properties:(match Cljs_map.get opts "properties" with
                                | Some (Wire.Map kvs) ->
                                    Some (List.filter_map
                                            (fun (k, v) ->
                                               Option.map (fun k -> (k, v))
                                                 (kw_value k))
                                            kvs)
                                | _ -> None)
                   ~class_:(opt_bool opts "class?")
                   ~journal:(opt_bool opts "journal?")
                   ~today_journal:(opt_bool opts "today-journal?")
                   ~split_namespace:(Option.value (Option.bind (Cljs_map.get opts "split-namespace?") bool_of_wire) ~default:false)
                   ~persist_op:(Option.value (Option.bind (Cljs_map.get opts "persist-op?") bool_of_wire) ~default:true)
                   ())
               ()
           in
           Some
             (Wire.Array
                [ Wire.String t
                ; (match uuid with Some u -> Wire.Uuid u | None -> Wire.Nil) ])
       | None -> None)
  | "rename-page", [ page_uuid; new_title ] ->
      let page_uuid = Option.value (uuid_of_wire page_uuid) ~default:"" in
      (match kw_value new_title with
       | Some t when String.trim t = "" ->
           raise (Invalid_outliner_op "Page name shouldn't be blank")
       | Some t ->
           ignore
             (Outliner_core.save_block_conn conn
                [ ("block/uuid", Uuid page_uuid); ("block/title", String t) ]
                Outliner_core.default_save_opts []);
           None
       | None -> None)
  | "delete-page", [ page_uuid; opts ] ->
      let opts_merged = Cljs_map.merge opts opts' in
      (match uuid_of_wire page_uuid with
       | Some u ->
           Some (Outliner_page.delete_conn conn u opts_merged)
       | None -> None)
  | "restore-recycled", [ root_uuid ] ->
      Option.map (fun u -> Wire.Bool (Outliner_recycle.restore conn u))
        (uuid_of_wire root_uuid)
  | "recycle-delete-permanently", [ root_uuid ] ->
      Option.map
        (fun u -> Wire.Bool (Outliner_recycle.permanently_delete conn u))
        (uuid_of_wire root_uuid)
  | "toggle-reaction", [ uuid; emoji_id; user_uuid ] ->
      Some
        (Wire.Bool
           (toggle_reaction conn
              (Option.value (uuid_of_wire uuid) ~default:"")
              (Option.value (kw_value emoji_id) ~default:"")
              (match user_uuid with
               | Wire.Nil -> None
               | w -> uuid_of_wire w)))
  | _ -> raise (Invalid_outliner_op ("unknown outliner op: " ^ op))

(* apply-ops! — runs all ops in one batch transaction, returns the last
   op result. *)
let apply_ops (conn : conn) (ops : Wire.t) (opts : Wire.t) : Wire.t =
  let raw_entries =
    match ops with
    | Wire.Array xs | Wire.List xs -> xs
    | _ -> raise (Invalid_outliner_op "ops must be a vector")
  in
  validate_ops raw_entries;
  let op_entries = List.filter_map op_of_entry raw_entries in
  let semantic_ops =
    List.filter_map
      (fun entry ->
        match op_of_entry entry with
        | Some (op, _) when List.mem op semantic_outliner_op_names -> Some entry
        | _ -> None)
      raw_entries
  in
  let single_op_outliner_op =
    match op_entries with [ (op, _) ] -> Some op | _ -> None
  in
  let import_edn_op =
    List.exists (fun (op, _) -> op = "batch-import-edn") op_entries
  in
  (* opts' enrichment *)
  let opts' =
    let m =
      Cljs_map.assoc opts "local-tx?" (Wire.Bool true)
    in
    let m =
      Cljs_map.assoc m "outliner-ops" (Wire.Array semantic_ops)
    in
    Cljs_map.assoc m "db-sync/tx-id"
      (match Cljs_map.get opts "db-sync/tx-id" with
       | Some (Wire.Uuid _ as u) -> u
       | _ -> Wire.Uuid (Common_uuid.new_block_id ()))
  in
  let opts' =
    match single_op_outliner_op, Cljs_map.get opts' "outliner-op" with
    | Some op, (None | Some Wire.Nil) -> Cljs_map.assoc opts' "outliner-op" (Wire.Keyword op)
    | _ -> opts'
  in
  let opts' =
    if import_edn_op then
      Cljs_map.assoc opts' "logseq.db.sqlite.export/imported-data?" (Wire.Bool true)
    else opts'
  in
  (* tx-meta for the batch = opts' minus internal keys *)
  let tx_meta_wire =
    Cljs_map.dissoc_list opts' [ "additional-tx"; "transact-opts"; "current-block" ]
  in
  let tx_meta = Ds_wire.tx_meta_of_transit tx_meta_wire in
  let result_ref = ref Wire.Nil in
  ignore (Db_tx.batch_transact_with_temp_conn ~tx_meta conn (fun conn' ->
      List.iter
        (fun (op, args) ->
          match apply_op conn' opts' op args with
          | Some v -> result_ref := v
          | None -> ())
        op_entries;
      match Cljs_map.get opts' "additional-tx" with
      | Some (Wire.Array txs) | Some (Wire.List txs) when txs <> [] ->
          let tx_ops =
            List.filter_map
              (fun w ->
                Outliner_core.tx_op_of_value (Conn.db conn')
                  (Ds_wire.value_of_transit w))
              txs
          in
          ignore (Db_tx.transact conn' tx_ops)
      | _ -> ()));
  !result_ref
