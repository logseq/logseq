open Plugin_protocol

exception Rejected of error
type write_result = Applied | Inserted of string | Page_identity of string | Created | Renamed

let check_wire value =
  let nodes = ref 0 in
  let bytes = ref 0 in
  let text value =
    bytes := !bytes + String.length value;
    if String.length value > max_string_bytes || !bytes > max_message_bytes then
      raise (Rejected Resource_limit);
    if not (valid_utf8 value) then raise (Rejected Invalid_request)
  in
  let integer value =
    let number = Int64.to_float value in
    if number >= Int64.to_float Int64.max_int || Int64.of_float number <> value then
      raise (Rejected Unsupported)
  in
  let rec visit depth value =
    incr nodes;
    bytes := !bytes + 16;
    if !nodes > max_nodes || depth > max_depth || !bytes > max_message_bytes then
      raise (Rejected Resource_limit);
    match value with
    | Wire.Nil | Wire.Bool _ -> ()
    | Wire.Int value -> integer (Int64.of_int value)
    | Wire.Int64 value | Wire.Date_ms value -> integer value
    | Wire.Float value -> if not (Float.is_finite value) then raise (Rejected Unsupported)
    | Wire.String value | Wire.Keyword value | Wire.Symbol value
    | Wire.Uuid value | Wire.Uri value -> text value
    | Wire.Array values | Wire.List values | Wire.Set values ->
        List.iter (visit (depth + 1)) values
    | Wire.Map fields ->
        List.iter (fun (key, value) ->
          (match key with
           | Wire.String _ | Wire.Keyword _ | Wire.Symbol _ | Wire.Uuid _ -> ()
           | _ -> raise (Rejected Unsupported));
          visit (depth + 1) key;
          visit (depth + 1) value) fields
    | Wire.Binary _ | Wire.Big_decimal _ | Wire.Big_int _ | Wire.Tagged _ ->
        raise (Rejected Unsupported)
  in
  visit 0 value

let checked_json convert value =
  check_wire value;
  let json = convert value in
  match validate_value json with
  | Ok () -> json
  | Error error -> raise (Rejected error)

let capture_editor ~id =
  let snapshot = Runtime.model () in
  let generation = !(Runtime.load_gen) in
  let editing = Option.map (fun editor ->
    editor, Editor_actions.live_buffer editor.Editor_state.uuid) (Editor_state.editing ()) in
  let selected = Editor_actions.selected_uuids () in
  let selection_scope = Editor_state.selection_scope () in
  let today = Dates.today () in
  let editing_current () =
    match editing, Editor_state.editing () with
    | None, None -> true
    | Some (before, text), Some after ->
        before.epoch == after.epoch && before.uuid = after.uuid
        && before.scope = after.scope && before.model == after.model
        && Editor_actions.live_buffer after.uuid = text
    | _ -> false
  in
  let current () =
    let model = Runtime.model () in
    model.Model.repo = snapshot.Model.repo
    && model.Model.route = snapshot.Model.route
    && model.Model.context_revision = snapshot.Model.context_revision
    && !(Runtime.load_gen) = generation
    && editing_current ()
    && Editor_state.selection_scope () = selection_scope
    && Editor_actions.selected_uuids () = selected
  in
  let immediate run =
    Ui_task.resolve
      (if not (current ()) then Error Stale_context
       else try run () with Rejected error -> Error error)
  in
  let await request convert =
    if not (current ()) then Ui_task.resolve (Error Stale_context)
    else Ui_task.create (fun ~resolve ~reject:_ ->
      ignore (Js.Promise.catch
        (fun _ -> resolve (Error Runtime_failure); Js.Promise.resolve ())
        (Js.Promise.then_
          (fun value ->
            let result =
              if not (current ()) then Error Stale_context
              else try convert value with Rejected error -> Error error
            in
            resolve result;
            Js.Promise.resolve ())
          (request ()))))
  in
  let context () =
    match editing with
    | None -> Ok None
    | Some (editor, text) ->
        Result.map Option.some
          (editing_context ~block_uuid:editor.uuid ~text)
  in
  let entity_result convert wire =
    match wire with
    | Wire.Nil -> Ok None
    | _ -> Result.map Option.some (entity (checked_json convert wire))
  in
  let lookup_with convert identity =
    match snapshot.Model.repo with
    | None -> immediate (fun () -> Ok None)
    | Some repo ->
        let key = match identity with
          | Entity_id value -> Js.Json.number (float_of_int value)
          | Uuid value | Page_name value -> Js.Json.string value
        in
        await (fun () -> Sdk_util.get_entity_json_for_repo repo key)
          (fun wire -> match wire with
            | Wire.Nil -> Ok None
            | _ -> Result.map Option.some (convert wire))
  in
  let lookup convert = lookup_with (fun wire -> entity (checked_json convert wire)) in
  let get_many repo ids =
    Promise_ext.(let* records = Sdk_util.get_many_for_repo repo
      (List.map (fun id -> Wire.Int id) ids) in
    Js.Promise.resolve (Wire.Array (List.map (function
      | Some record -> record
      | None -> invalid_arg "Missing block metadata") records)))
  in
  let sibling_block direction identity =
    let reference = match identity with
      | Entity_id value -> Some (Wire.Int value)
      | Uuid value -> Some (Wire.Array [Wire.kw "block/uuid"; Wire.Uuid value])
      | Page_name _ -> None in
    match reference, snapshot.Model.repo with
    | None, _ -> immediate (fun () -> Error Invalid_request)
    | Some _, None -> immediate (fun () -> Ok None)
    | Some key, Some repo ->
        let relation = match direction with
          | Previous_sibling -> "left"
          | Next_sibling -> "right" in
        await (fun () -> Runtime.invoke3 "thread-api/get-block-sibling"
          (Wire.String repo) key (Wire.kw relation))
          (entity_result Sdk_convert.json_of_wire)
  in
  let block_properties identity =
    match snapshot.Model.repo, identity with
    | _, Page_name _ -> immediate (fun () -> Error Invalid_request)
    | None, (Entity_id _ | Uuid _) -> immediate (fun () -> Ok Json.Null)
    | Some repo, (Entity_id _ | Uuid _) ->
        let key = match identity with
          | Entity_id value -> Js.Json.number (float_of_int value)
          | Uuid value -> Js.Json.string value
          | Page_name _ -> assert false in
        let source = await (fun () -> Sdk_util.get_entity_json_for_repo repo key)
          (fun wire -> match Wire.get wire "block/properties" with
            | Some (Wire.Map _ as props) ->
                check_wire props; Ok (Some (Wire.map_get_int wire "db/id", props))
            | _ -> Ok None) in
        Ui_task.bind source (function
          | Error error -> Ui_task.resolve (Error error)
          | Ok (Some (db_id, props)) ->
              await (fun () -> Sdk_util.all_block_properties_for_repo repo db_id props)
                (fun wire -> match wire with
                  | Wire.Map fields -> Ok (checked_json Sdk_convert.result_json_of_wire
                      (Sdk_util.readable_properties fields))
                  | _ -> Error Runtime_failure)
          | Ok None -> immediate (fun () -> Ok Json.Null))
  in
  let entities wire =
    let value = checked_json Sdk_convert.json_of_wire wire in
    match value with
    | Json.Array values ->
        Array.fold_right (fun value result ->
          Result.bind result (fun rest -> Result.map (fun entity -> entity :: rest) (entity value))) values (Ok [])
    | Json.Null -> Ok []
    | _ -> Error Runtime_failure in
  let page_blocks_tree identity =
    match snapshot.Model.repo with
    | None -> immediate (fun () -> Ok [])
    | Some repo ->
        let key = match identity with Entity_id id -> Wire.Int id
          | Uuid uuid -> Wire.Array [Wire.kw "block/uuid"; Wire.Uuid uuid]
          | Page_name name -> Wire.String name in
        await (fun () -> Runtime.invoke3 "thread-api/get-page-blocks-tree"
          (Wire.String repo) key (Wire.Map [])) entities in
  let block_children identity =
    match snapshot.Model.repo, identity with
    | _, Page_name _ -> immediate (fun () -> Error Invalid_request)
    | None, _ -> immediate (fun () -> Ok [])
    | Some repo, _ ->
        let key = match identity with Entity_id id -> Js.Json.number (float_of_int id)
          | Uuid uuid -> Js.Json.string uuid | Page_name _ -> assert false in
        let source = await (fun () -> Sdk_util.get_entity_json_for_repo repo key)
          (fun block -> Ok (Wire.map_get_int block "db/id")) in
        Ui_task.bind source (function
          | Error error -> Ui_task.resolve (Error error)
          | Ok None -> immediate (fun () -> Ok [])
          | Ok (Some id) ->
              let ids = await (fun () -> Runtime.invoke2 "thread-api/q" (Wire.String repo)
                (Wire.Array [Wire.String "[:find [?e ...] :in $ ?parent :where [?e :block/parent ?parent] (not [?e :logseq.property/created-from-property]) (not [?e :block/closed-value-property]) (not [?e :logseq.property/deleted-at])]";
                Wire.Int id]))
                (fun wire -> check_wire wire; Ok (Wire.elems wire)) in
              Ui_task.bind ids (function
                | Error error -> Ui_task.resolve (Error error)
                | Ok ids -> await (fun () ->
                    let open Promise_ext in
                    let* blocks = Sdk_util.get_many_for_repo repo ids in
                    let blocks = List.map (function Some block -> block | None -> raise (Rejected Runtime_failure)) blocks in
                    let order block = match Wire.map_get_string block "block/order" with
                      | Some order -> order | None -> raise (Rejected Runtime_failure) in
                    Js.Promise.resolve (Wire.Array (List.sort (fun a b -> String.compare (order a) (order b)) blocks))) entities)) in
  let apply ~check mutation =
    let cancelled = ref false in
    let failure = ref Runtime_failure in
    let stop error = failure := error; raise (Rejected error) in
    let guard () =
      if !cancelled then stop Cancelled;
      (match check () with Ok () -> () | Error error -> stop error);
      if not (current ()) then stop Stale_context in
    let run () =
      let open Promise_ext in
      guard ();
      let repo = match snapshot.Model.repo with Some repo -> repo | None -> stop Invalid_request in
      let get identity =
        let key = match identity with
          | Entity_id value -> Js.Json.number (float_of_int value)
          | Uuid value | Page_name value -> Js.Json.string value in
        let* block = Sdk_util.get_entity_json_for_repo repo key in
        guard ();
        let uuid = match Sdk_util.block_uuid_of block with Some uuid -> uuid | None -> stop Invalid_request in
        Js.Promise.resolve (block, uuid) in
      let parents uuid =
        let* value = Runtime.invoke3 "thread-api/get-block-parents" (Wire.String repo)
          (Wire.Array [Wire.kw "block/uuid"; Wire.Uuid uuid]) (Wire.Int max_nodes) in
        guard ();
        let chain = List.filter_map Sdk_util.block_uuid_of (Wire.elems value) in
        if List.length chain >= max_nodes then stop Resource_limit;
        check_wire (Wire.Array (List.map (fun uuid -> Wire.Uuid uuid) chain));
        Js.Promise.resolve chain in
      let protect uuid =
        if Option.bind snapshot.Model.route_page (fun page -> page.Model.page_uuid) = Some uuid
        then stop Unsupported;
        match editing with
        | None -> Js.Promise.resolve ()
        | Some (editor, _) ->
            if editor.Editor_state.uuid = uuid then stop Unsupported;
            let* chain = parents editor.uuid in
            if List.mem uuid chain then stop Unsupported;
            Js.Promise.resolve () in
      let property_ops uuid changes =
        let idents = List.map (fun (key, _) ->
          "plugin.property." ^ plugin_id_value id ^ "/" ^ property_key_value key) changes in
        let* existing = Sdk_util.get_many_for_repo repo (List.map Wire.kw idents) in
        guard ();
        if List.length existing <> List.length changes then stop Runtime_failure;
        let ops = List.concat_map (fun (((key, value), ident), existing) ->
          match value with
          | None -> (match existing with None -> [] | Some _ ->
              [Wire.Array [Wire.kw "remove-block-property"; Wire.Array [Wire.Uuid uuid; Wire.kw ident]]])
          | Some value ->
              let wire, property_type = match value with
                | Text_value text -> Wire.String text, "default"
                | Number_value number -> Wire.Float number, "number"
                | Checkbox_value flag -> Wire.Bool flag, "checkbox" in
              let create = match existing with
                | None -> [Wire.Array [Wire.kw "upsert-property"; Wire.Array [Wire.kw ident;
                    Wire.Map [Wire.kw "logseq.property/type", Wire.kw property_type;
                      Wire.kw "db/cardinality", Wire.kw "db.cardinality/one"];
                    Wire.Map [Wire.kw "property-name", Wire.String (property_key_value key)]]]]
                | Some property ->
                    if Wire.get property "logseq.property/type" <> Some (Wire.kw property_type)
                       || Wire.get property "db/cardinality" <> Some (Wire.kw "db.cardinality/one")
                    then stop Unsupported;
                    [] in
              create @ [Wire.Array [Wire.kw "set-block-property";
                Wire.Array [Wire.Uuid uuid; Wire.kw ident; wire]]])
          (List.combine (List.combine changes idents) existing) in
        Js.Promise.resolve ops in
      let page_reply uuid =
        let* wire = Sdk_util.get_entity_for_repo repo uuid in
        guard ();
        match Wire.map_get_int wire "db/id", Sdk_util.block_uuid_of wire,
              Wire.map_get_string wire "block/name" with
        | Some id, Some uuid, Some name ->
            (match entity (Json.Object ["id", Json.Number (float_of_int id);
                "uuid", Json.String uuid; "name", Json.String name]) with
             | Ok value -> Js.Promise.resolve (Page (Some value))
             | Error error -> stop error)
        | _ -> stop Runtime_failure in
      let* ops, inserted = match mutation with
        | Insert_block (identity, text, options) ->
            let* block, uuid = get identity in
            (match insertion_position options with
             | Before | After when Option.is_some (Wire.get block "block/name") -> stop Invalid_request
             | First_child | Last_child | Before | After -> ());
            let insert_uuid = match custom_uuid options with
              | Some value -> value | None -> Ui_services.env_random_uuid () in
            let* existing = Sdk_util.get_entity_for_repo repo insert_uuid in
            if existing <> Wire.Nil then stop Invalid_request;
            let sibling direction = Runtime.invoke3 "thread-api/get-block-sibling"
              (Wire.String repo) (Wire.Array [Wire.kw "block/uuid"; Wire.Uuid uuid]) (Wire.kw direction) in
            let* target, sibling = match insertion_position options with
              | After -> Js.Promise.resolve (uuid, true)
              | Last_child ->
                  let* last = sibling "last-child" in
                  (match Sdk_util.block_uuid_of last with
                   | Some target -> Js.Promise.resolve (target, true)
                   | None -> Js.Promise.resolve (uuid, false))
              | First_child -> Js.Promise.resolve (uuid, false)
              | Before ->
                  let* left = sibling "left" in
                  (match Sdk_util.block_uuid_of left with
                   | Some target -> Js.Promise.resolve (target, true)
                   | None ->
                       let* parent = Runtime.invoke2 "thread-api/get-block-parent"
                         (Wire.String repo) (Wire.Uuid uuid) in
                       match Sdk_util.block_uuid_of parent with
                       | Some target -> Js.Promise.resolve (target, false)
                       | None -> stop Invalid_request) in
            let* parsed = Title_refs.parse ~origin_repo:repo text in
            let new_block = Wire.Map (
              [Wire.kw "block/title", Wire.String parsed.Title_refs.title;
               Wire.kw "block/uuid", Wire.Uuid insert_uuid] @ Title_refs.kvs_of_parsed parsed) in
            let insert_opts = Wire.Map [Wire.kw "sibling?", Wire.Bool sibling;
              Wire.kw "keep-uuid?", Wire.Bool true; Wire.kw "outliner-op", Wire.kw "insert-blocks"] in
            Js.Promise.resolve ([Wire.Array [Wire.kw "insert-blocks";
              Wire.Array [Wire.Array [new_block]; Wire.Uuid target; insert_opts]]], Inserted insert_uuid)
        | Update_block (identity, text, properties) ->
            let* block, uuid = get identity in
            if Option.fold ~none:false ~some:(fun editor -> editor.Editor_state.uuid = uuid)
                 (Editor_state.editing ()) || Option.is_some (Wire.get block "block/name")
            then stop Unsupported;
            let* parsed = Title_refs.parse ~origin_repo:repo text in
            let* properties = property_ops uuid properties in
            Js.Promise.resolve (Wire.Array [Wire.kw "save-block"; Wire.Array [Wire.Map (
              [Wire.kw "block/uuid", Wire.Uuid uuid;
               Wire.kw "block/title", Wire.String parsed.Title_refs.title]
              @ Title_refs.kvs_of_parsed parsed); Wire.Map []]] :: properties, Applied)
        | Upsert_block_property (identity, key, value) ->
            let* _, uuid = get identity in
            let* ops = property_ops uuid [key, Some value] in Js.Promise.resolve (ops, Applied)
        | Remove_block_property (identity, key) ->
            let* _, uuid = get identity in
            let* ops = property_ops uuid [key, None] in Js.Promise.resolve (ops, Applied)
        | Remove_block identity ->
            let* block, uuid = get identity in
            if Option.is_some (Wire.get block "block/name") then stop Invalid_request;
            let* () = protect uuid in
            Js.Promise.resolve ([Wire.Array [Wire.kw "delete-blocks";
              Wire.Array [Wire.Array [Wire.Uuid uuid]; Wire.Map []]]], Applied)
        | Move_block (source, target, position) ->
            let* block, uuid = get source in
            let* destination, target_uuid = get target in
            if Option.is_some (Wire.get block "block/name") || uuid = target_uuid then stop Invalid_request;
            let* () = protect uuid in
            let* chain = parents target_uuid in
            if List.mem uuid chain then stop Invalid_request;
            if position <> Move_into && Option.is_some (Wire.get destination "block/name") then stop Invalid_request;
            let* target_uuid, sibling = match position with
              | Move_after -> Js.Promise.resolve (target_uuid, true)
              | Move_into -> Js.Promise.resolve (target_uuid, false)
              | Move_before ->
                  let* left = Runtime.invoke3 "thread-api/get-block-sibling" (Wire.String repo)
                    (Wire.Array [Wire.kw "block/uuid"; Wire.Uuid target_uuid]) (Wire.kw "left") in
                  (match Sdk_util.block_uuid_of left with
                   | Some left -> Js.Promise.resolve (left, true)
                   | None -> let* parent = Runtime.invoke2 "thread-api/get-block-parent"
                       (Wire.String repo) (Wire.Uuid target_uuid) in
                       match Sdk_util.block_uuid_of parent with Some parent -> Js.Promise.resolve (parent, false)
                       | None -> stop Invalid_request) in
            let ops = if target_uuid = uuid then [] else [Wire.Array [Wire.kw "move-blocks";
              Wire.Array [Wire.Array [Wire.Uuid uuid]; Wire.Uuid target_uuid;
                Wire.Map [Wire.kw "sibling?", Wire.Bool sibling; Wire.kw "outliner-op", Wire.kw "move-blocks"]]]] in
            Js.Promise.resolve (ops, Applied)
        | Create_page (title, custom) ->
            let* existing = Sdk_util.get_entity_for_repo repo title in
            (match Sdk_util.block_uuid_of existing with
             | Some uuid -> if Option.is_none (Wire.get existing "block/name") then stop Invalid_request;
                 Js.Promise.resolve ([], Page_identity uuid)
             | None ->
                 let uuid = Option.value custom ~default:(Ui_services.env_random_uuid ()) in
                 let* existing = Sdk_util.get_entity_for_repo repo uuid in
                 if existing <> Wire.Nil then stop Invalid_request;
                 Js.Promise.resolve ([Wire.Array [Wire.kw "create-page"; Wire.Array [Wire.String title;
                   Wire.Map [Wire.kw "uuid", Wire.Uuid uuid; Wire.kw "split-namespace?", Wire.Bool true]]]], Created))
        | Rename_page (identity, title) ->
            let* block, uuid = get identity in
            if Option.is_none (Wire.get block "block/name") then stop Invalid_request;
            let* () = protect uuid in
            let* existing = Sdk_util.get_entity_for_repo repo title in
            (match Sdk_util.block_uuid_of existing with Some other when other <> uuid -> stop Invalid_request | _ -> ());
            Js.Promise.resolve ([Wire.Array [Wire.kw "rename-page"; Wire.Array [Wire.Uuid uuid; Wire.String title]]], Renamed)
        | Delete_page identity ->
            let* block, uuid = get identity in
            if Option.is_none (Wire.get block "block/name") then stop Invalid_request;
            let schema_page = match Wire.get block "block/tags" with
              | None -> false
              | Some tags -> List.exists (fun tag ->
                  match Wire.get tag "db/ident" with
                  | Some (Wire.Keyword name) | Some (Wire.String name) ->
                      name = "logseq.class/Tag" || name = "logseq.class/Property"
                  | _ -> false) (Wire.elems tags) in
            if schema_page || Option.is_some (Wire.get block "block/journal-day")
            then stop Unsupported;
            let* () = protect uuid in
            Js.Promise.resolve ([Wire.Array [Wire.kw "delete-page"; Wire.Array [Wire.Uuid uuid; Wire.Map []]]], Applied)
      in
      guard ();
      let* result = match ops with
        | [] -> Js.Promise.resolve Wire.Nil
        | _ -> Sdk_util.apply_ops_for_repo ~before_commit:guard ~refresh:false repo ops (Wire.Map []) in
      guard ();
      match inserted with
      | Applied -> Js.Promise.resolve Mutation_applied
      | Renamed -> Js.Promise.resolve Page_renamed
      | Page_identity uuid -> page_reply uuid
      | Inserted inserted_uuid ->
          let* wire = Sdk_util.get_entity_for_repo repo inserted_uuid in
          guard ();
          (match entity_result Sdk_convert.result_json_of_wire wire with
           | Ok (Some value) -> Js.Promise.resolve (Block (Some value))
           | Ok None -> stop Runtime_failure
           | Error error -> stop error)
      | Created ->
          let uuid = match Wire.elems result with [ _; Wire.Uuid uuid ] | [ _; Wire.String uuid ] -> uuid
            | _ -> stop Runtime_failure in
          page_reply uuid
    in
    Ui_task.create ~cancel:(fun () -> cancelled := true) (fun ~resolve ~reject:_ ->
      try ignore (Js.Promise.catch (fun _ -> resolve (Error !failure); Js.Promise.resolve ())
        (Js.Promise.then_ (fun reply -> resolve (Ok reply); Js.Promise.resolve ()) (run ())))
      with Rejected error -> resolve (Error error))
  in
  let block_tree identity =
    match identity, snapshot.Model.repo with
    | Page_name _, _ -> immediate (fun () -> Error Invalid_request)
    | _, None -> immediate (fun () -> Ok None)
    | _, Some repo ->
        Ui_task.bind (lookup Sdk_convert.json_of_wire identity) (function
          | Error error -> Ui_task.resolve (Error error)
          | Ok None -> Ui_task.resolve (Ok None)
          | Ok (Some root) ->
              let json = reply_value (Block (Some root)) in
              let uuid = match Json.get "uuid" json with
                | Some (Json.String uuid) -> uuid
                | _ -> invalid_arg "Block is missing its UUID" in
              let node_id node = match Json.get "id" node with
                | Some (Json.Number id) when id >= 1. && id <= 2147483647. && Float.floor id = id -> int_of_float id
                | _ -> raise (Rejected Runtime_failure) in
              let node_children node = match Json.get "children" node with
                | Some (Json.Array nodes) -> nodes
                | _ -> raise (Rejected Runtime_failure) in
              let tree_read = await (fun () -> Runtime.invoke3 "thread-api/get-page-blocks-tree"
                (Wire.String repo) (Wire.Array [Wire.kw "block/uuid"; Wire.Uuid uuid]) (Wire.Map []))
                (fun wire ->
                  let tree = checked_json Sdk_convert.json_of_wire wire in
                  let children = match tree with
                    | Json.Array [|node|] when Json.get "uuid" node = Some (Json.String uuid) ->
                        Json.Array (node_children node)
                    | Json.Array _ -> tree
                    | _ -> raise (Rejected Runtime_failure) in
                  let ids = ref [] in
                  let rec collect = function
                    | Json.Array nodes -> Array.iter (fun node ->
                        ids := node_id node :: !ids;
                        collect (Json.Array (node_children node))) nodes
                    | _ -> raise (Rejected Runtime_failure) in
                  collect children;
                  Ok (children, List.sort_uniq Stdlib.compare !ids)) in
              Ui_task.bind tree_read (function
                | Error error -> Ui_task.resolve (Error error)
                | Ok (children, ids) ->
                    let rebuild nested = match json with
                      | Json.Object fields -> Result.map Option.some
                          (entity (Json.Object (("children", nested) :: List.remove_assoc "children" fields)))
                      | _ -> Error Runtime_failure in
                    if ids = [] then immediate (fun () -> rebuild children)
                    else await (fun () -> get_many repo ids) (fun wire ->
                      let properties = Hashtbl.create (List.length ids) in
                      List.iter2 (fun id metadata ->
                        if Wire.map_get_int metadata "db/id" <> Some id then raise (Rejected Runtime_failure);
                        let property_values = match Wire.get metadata "block/properties" with
                          | Some (Wire.Map _ as property_wire) -> checked_json Sdk_convert.json_of_wire property_wire
                          | _ -> raise (Rejected Runtime_failure) in
                        Hashtbl.add properties id property_values) ids (Wire.elems wire);
                      let rec hydrate = function
                        | Json.Array nodes -> Json.Array (Array.map (fun node ->
                            match node with
                            | Json.Object fields -> Json.Object (
                                ("properties", Hashtbl.find properties (node_id node)) ::
                                ("children", hydrate (Json.Array (node_children node))) ::
                                List.remove_assoc "properties" (List.remove_assoc "children" fields))
                            | _ -> raise (Rejected Runtime_failure)) nodes)
                        | _ -> raise (Rejected Runtime_failure) in
                      rebuild (hydrate children))))
  in
  let page_linked_references identity =
    match snapshot.Model.repo with
    | None -> immediate (fun () -> Ok None)
    | Some repo ->
        Ui_task.bind (lookup_with (fun wire -> match Wire.map_get_int wire "db/id" with
          | Some id -> Ok id | None -> Error Runtime_failure) identity) (function
          | Error error -> Ui_task.resolve (Error error)
          | Ok None -> Ui_task.resolve (Ok None)
          | Ok (Some target_id) ->
              let references = await (fun () -> Runtime.invoke2 "thread-api/get-block-refs"
                (Wire.String repo) (Wire.Int target_id)) (fun wire ->
                  check_wire wire;
                  match wire with
                  | Wire.Array blocks | Wire.List blocks -> Ok blocks
                  | _ -> Error Runtime_failure) in
              Ui_task.bind references (function
                | Error error -> Ui_task.resolve (Error error)
                | Ok blocks ->
                    let groups = Hashtbl.create 16 in
                    let page_order_rev = ref [] in
                    let page_id block = match Wire.get block "block/page" with
                      | Some (Wire.Int id) -> Some id
                      | Some (Wire.Map _ as page) -> Wire.map_get_int page "db/id"
                      | _ when Option.is_some (Wire.get block "block/name") -> Wire.map_get_int block "db/id"
                      | _ -> None in
                    let grouped = List.for_all (fun block -> match page_id block with
                      | None -> false
                      | Some id ->
                          if not (Hashtbl.mem groups id) then page_order_rev := id :: !page_order_rev;
                          let existing = Option.value ~default:[] (Hashtbl.find_opt groups id) in
                          Hashtbl.replace groups id (block :: existing);
                          true) blocks in
                    if not grouped then Ui_task.resolve (Error Runtime_failure)
                    else if blocks = [] then Ui_task.resolve (Ok (Some []))
                    else
                      let page_ids = List.rev !page_order_rev in
                      await (fun () -> get_many repo page_ids) (fun wire ->
                          let pages = Wire.elems wire in
                          let result = List.map2 (fun id page_wire ->
                            if Wire.map_get_int page_wire "db/id" <> Some id then raise (Rejected Runtime_failure);
                            let page_entity = match entity (checked_json Sdk_convert.result_json_of_wire page_wire) with
                              | Ok converted_page -> converted_page | Error error -> raise (Rejected error) in
                            let reference_entities = List.rev (Hashtbl.find groups id) |> List.map (fun reference_wire ->
                              match entity (checked_json Sdk_convert.json_of_wire reference_wire) with
                              | Ok reference_entity -> reference_entity | Error error -> raise (Rejected error)) in
                            page_entity, reference_entities) page_ids pages in
                          let reply = Page_linked_references (Some result) in
                          match validate_value (reply_value reply) with
                          | Ok () -> Ok (Some result)
                          | Error error -> Error error)))
  in
  let current_block () =
    match editing, selected with
    | Some (editor, _), _ -> lookup Sdk_convert.json_of_wire (Uuid editor.uuid)
    | None, uuid :: _ -> lookup Sdk_convert.json_of_wire (Uuid uuid)
    | None, [] -> immediate (fun () -> Ok None)
  in
  let current_page () =
    match snapshot.Model.repo, snapshot.Model.route_page with
    | Some repo, Some page ->
        (match page.Model.page_uuid with
         | Some uuid ->
             await (fun () -> Sdk_util.get_by_id_for_repo repo (Wire.Uuid uuid))
               (fun wire -> page_result (checked_json Sdk_convert.result_json_of_wire wire))
         | None -> immediate (fun () ->
             let json = Json.Object ["title", Json.String page.page_title;
                                     "name", Json.String page.page_title] in
             page_result json))
    | _ -> immediate (fun () -> page_result Json.Null)
  in
  let entities convert wire =
    match checked_json convert wire with
    | Json.Null -> Ok []
    | Json.Array values ->
        Array.fold_left (fun result value ->
          Result.bind result (fun values ->
            Result.map (fun value -> value :: values) (entity value)))
          (Ok []) values |> Result.map List.rev
    | _ -> Error Runtime_failure
  in
  let current_page_blocks_tree () =
    match snapshot.Model.repo, snapshot.Model.route_page with
    | Some repo, Some { Model.page_uuid = Some uuid; _ } ->
        await (fun () -> Runtime.invoke3 "thread-api/get-page-blocks-tree"
          (Wire.String repo)
          (Wire.Uuid uuid) (Wire.Map []))
          (entities Sdk_convert.json_of_wire)
    | _ -> immediate (fun () -> Ok [])
  in
  let selected_blocks () =
    match snapshot.Model.repo, selected with
    | Some repo, _ :: _ ->
        await (fun () -> Sdk_util.get_many_for_repo repo (List.map (fun uuid ->
            Wire.Uuid uuid) selected))
          (fun values ->
            let wire = Wire.Array (List.map (function
              | None | Some Wire.Nil -> raise (Rejected Stale_context)
              | Some value -> value) values) in
            entities Sdk_convert.json_of_wire wire)
    | _ -> immediate (fun () -> Ok [])
  in
  let property_key = function
    | Wire.Keyword key | Wire.String key ->
        if String.starts_with ~prefix:":" key
        then String.sub key 1 (String.length key - 1) else key
    | _ -> raise (Rejected Runtime_failure)
  in
  let property_fields = function
    | Wire.Nil -> []
    | Wire.Map fields -> fields
    | _ -> raise (Rejected Runtime_failure)
  in
  let properties ~page identity project =
    match identity, snapshot.Model.repo with
    | Page_name _, _ when not page -> immediate (fun () -> Error Invalid_request)
    | _, None -> immediate (fun () -> Ok Json.Null)
    | _, Some repo ->
        let key = match identity with
          | Entity_id id -> Js.Json.number (float_of_int id)
          | Uuid uuid | Page_name uuid -> Js.Json.string uuid in
        let source = await (fun () -> Sdk_util.get_entity_json_for_repo repo key)
          (function
            | Wire.Nil -> Ok None
            | block ->
                if page && Option.is_none (Wire.map_get_string block "block/name")
                then Error Invalid_request
                else match Wire.map_get_int block "db/id" with
                  | None -> Error Runtime_failure
                  | Some id ->
                      let own = property_fields (Option.value ~default:Wire.Nil
                        (Wire.get block "block/properties")) in
                      Ok (Some (id, own))) in
        Ui_task.bind source (function
          | Error error -> Ui_task.resolve (Error error)
          | Ok None -> immediate (fun () -> Ok Json.Null)
          | Ok (Some (id, own)) ->
              await (fun () -> Runtime.invoke2 "thread-api/get-block-class-default-properties"
                (Wire.String repo) (Wire.Int id))
                (fun defaults ->
                  let value = project own (property_fields defaults) in
                  Ok (checked_json Sdk_convert.json_of_wire value)))
  in
  let block_property identity key =
    let key = property_ident_value key in
    properties ~page:false identity (fun own defaults ->
      let find fields = List.find_map (fun (name, value) ->
        if property_key name = key then Some value else None) fields in
      match find own with
      | Some value -> value
      | None -> Option.value ~default:Wire.Nil (find defaults))
  in
  let page_properties identity =
    properties ~page:true identity (fun own defaults ->
      let keys = Hashtbl.create (List.length own) in
      List.iter (fun (key, _) -> Hashtbl.replace keys (property_key key) ()) own;
      let inherited = List.filter (fun (key, _) ->
        not (Hashtbl.mem keys (property_key key))) defaults in
      Wire.Map (List.map (fun (key, value) ->
        Wire.String (":" ^ property_key key), value) (inherited @ own)))
  in
  let today_page () = lookup Sdk_convert.result_json_of_wire (Page_name today) in
  let all_pages () =
    match snapshot.Model.repo with
    | None -> immediate (fun () -> Ok [])
    | Some repo ->
        await (fun () -> Runtime.invoke2 "thread-api/q" (Wire.String repo)
          (Wire.Array [Wire.String
            "[:find [(pull ?page [:db/id :block/uuid :block/name :block/title :block/created-at :block/updated-at]) ...] :where [?page :block/name] [(get-else $ ?page :logseq.property/hide? false) ?hide] [(false? ?hide)]]"]))
          (fun wire ->
            check_wire wire;
            let rows = match wire with
              | Wire.Array rows | Wire.List rows | Wire.Set rows -> rows
              | _ -> raise (Rejected Runtime_failure) in
            let title block = match Wire.map_get_string block "block/title" with
              | Some title -> title | None -> raise (Rejected Runtime_failure) in
            let compare_page first second =
              match String.compare (title first) (title second) with
              | 0 -> Stdlib.compare (Wire.map_get_int first "db/id") (Wire.map_get_int second "db/id")
              | order -> order in
            entities Sdk_convert.result_json_of_wire
              (Wire.Array (List.sort compare_page rows)))
  in
  let query request =
    match snapshot.Model.repo with
    | None -> immediate (fun () -> Error Invalid_request)
    | Some repo ->
        let inputs = query_inputs request |> Array.to_list
          |> List.map (fun value -> Sdk_convert.wire_of_json value) in
        let options = Wire.Map (
          (Wire.kw "today-title", Wire.String (Dates.today ())) ::
          (match Option.bind snapshot.Model.route_page (fun page -> page.Model.page_uuid) with
           | None -> []
           | Some uuid -> [Wire.kw "current-page", Wire.String uuid])) in
        let resolved = await (fun () ->
          Runtime.invoke3 "thread-api/resolve-query-inputs"
            (Wire.String repo) (Wire.Array inputs) options)
          (fun value ->
            check_wire value;
            match value with
            | Wire.Array inputs | Wire.List inputs -> Ok inputs
            | _ -> Error Runtime_failure) in
        Ui_task.bind resolved (function
          | Error error -> Ui_task.resolve (Error error)
          | Ok inputs ->
              await (fun () -> Runtime.invoke2 "thread-api/q" (Wire.String repo)
                (Wire.Array (Wire.String (query_text request) :: inputs)))
                (fun value -> Ok (checked_json (Sdk_convert.json_of_wire ~camel:false) value)))
  in
  let services : Plugin_broker.services = {
    current;
    get_editing_context = (fun () -> immediate (fun () ->
      match context () with
      | Ok (Some value) -> Ok value
      | Ok None -> Error Invalid_request
      | Error error -> Error error));
  } in
  let reads : Plugin_broker.read_services = {
    editing_state = (fun () -> immediate context);
    current_block;
    current_page;
    get_block = lookup Sdk_convert.json_of_wire;
    get_block_tree = block_tree;
    get_page = lookup Sdk_convert.result_json_of_wire;
    page_linked_references;
    sibling_block;
    current_page_blocks_tree;
    selected_blocks;
    block_property;
    page_properties;
    today_page;
    all_pages;
    block_properties;
    page_blocks_tree;
    block_children;
    query;
    log = (fun level text -> immediate (fun () ->
      let message = "[plugin:" ^ plugin_id_value id ^ "] " ^ text in
      (match level with
       | Log_error | Log_warn -> Ui_services.log_error_message message
       | Log_debug | Log_info -> Ui_services.log_info message);
      Ok ()));
  } in
  services, reads, ({apply} : Plugin_broker.write_services)

let capture ~id =
  let services, reads, _ = capture_editor ~id in
  services, reads
