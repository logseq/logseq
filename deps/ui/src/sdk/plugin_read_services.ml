open Plugin_protocol

exception Rejected of error

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
  let lookup convert identity =
    match snapshot.Model.repo with
    | None -> immediate (fun () -> Ok None)
    | Some repo ->
        let key = match identity with
          | Entity_id value -> Js.Json.number (float_of_int value)
          | Uuid value | Page_name value -> Js.Json.string value
        in
        await (fun () -> Sdk_util.get_entity_json_for_repo repo key)
          (entity_result convert)
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
      let identity = match mutation with
        | Insert_block (identity, _, _) | Update_block (identity, _)
        | Upsert_block_property (identity, _, _) | Remove_block_property (identity, _) -> identity in
      let key = match identity with
        | Entity_id value -> Js.Json.number (float_of_int value)
        | Uuid value -> Js.Json.string value
        | Page_name _ -> stop Invalid_request in
      let* block = Sdk_util.get_entity_json_for_repo repo key in
      guard ();
      let uuid = match Sdk_util.block_uuid_of block with Some uuid -> uuid | None -> stop Invalid_request in
      let* ops, inserted = match mutation with
        | Insert_block (_, text, options) ->
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
              Wire.Array [Wire.Array [new_block]; Wire.Uuid target; insert_opts]]], Some insert_uuid)
        | Update_block (_, text) ->
            if Option.fold ~none:false ~some:(fun editor -> editor.Editor_state.uuid = uuid)
                 (Editor_state.editing ()) || Option.is_some (Wire.get block "block/name")
            then stop Unsupported;
            let* parsed = Title_refs.parse ~origin_repo:repo text in
            Js.Promise.resolve ([Wire.Array [Wire.kw "save-block"; Wire.Array [Wire.Map (
              [Wire.kw "block/uuid", Wire.Uuid uuid;
               Wire.kw "block/title", Wire.String parsed.Title_refs.title]
              @ Title_refs.kvs_of_parsed parsed); Wire.Map []]]], None)
        | Upsert_block_property (_, key, _) | Remove_block_property (_, key) ->
            let name = property_key_value key in
            let ident = "plugin.property." ^ plugin_id_value id ^ "/" ^ name in
            let* properties = Sdk_util.get_many_for_repo repo [Wire.kw ident] in
            let existing = match properties with [property] -> property | _ -> stop Runtime_failure in
            let ops = match mutation with
              | Upsert_block_property (_, _, value) ->
                  let wire = match value with Text_value text -> Wire.String text
                    | Number_value number -> Wire.Float number | Checkbox_value flag -> Wire.Bool flag in
                  let property_type = match value with Text_value _ -> "default"
                    | Number_value _ -> "number" | Checkbox_value _ -> "checkbox" in
                  let upsert = match existing with
                    | None -> [Wire.Array [Wire.kw "upsert-property"; Wire.Array [Wire.kw ident;
                        Wire.Map [Wire.kw "logseq.property/type", Wire.kw property_type;
                          Wire.kw "db/cardinality", Wire.kw "db.cardinality/one"];
                        Wire.Map [Wire.kw "property-name", Wire.String name]]]]
                    | Some property ->
                        if Wire.get property "logseq.property/type" <> Some (Wire.kw property_type)
                           || Wire.get property "db/cardinality" <> Some (Wire.kw "db.cardinality/one")
                        then stop Unsupported;
                        [] in
                  upsert @ [Wire.Array [Wire.kw "set-block-property";
                    Wire.Array [Wire.Uuid uuid; Wire.kw ident; wire]]]
              | Remove_block_property _ ->
                  (match existing with None -> [] | Some _ ->
                    [Wire.Array [Wire.kw "remove-block-property"; Wire.Array [Wire.Uuid uuid; Wire.kw ident]]])
              | Insert_block _ | Update_block _ -> assert false in
            Js.Promise.resolve (ops, None)
      in
      guard ();
      let* _ = match ops with
        | [] -> Js.Promise.resolve Wire.Nil
        | _ -> Sdk_util.apply_ops_for_repo ~before_commit:guard ~refresh:false repo ops (Wire.Map []) in
      guard ();
      match inserted with
      | None -> Js.Promise.resolve Mutation_applied
      | Some inserted_uuid ->
          let* wire = Sdk_util.get_entity_for_repo repo inserted_uuid in
          guard ();
          (match entity_result Sdk_convert.result_json_of_wire wire with
           | Ok (Some value) -> Js.Promise.resolve (Block (Some value))
           | Ok None -> stop Runtime_failure
           | Error error -> stop error)
    in
    Ui_task.create ~cancel:(fun () -> cancelled := true) (fun ~resolve ~reject:_ ->
      try ignore (Js.Promise.catch (fun _ -> resolve (Error !failure); Js.Promise.resolve ())
        (Js.Promise.then_ (fun reply -> resolve (Ok reply); Js.Promise.resolve ()) (run ())))
      with Rejected error -> resolve (Error error))
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
    get_page = lookup Sdk_convert.result_json_of_wire;
    sibling_block;
    block_properties;
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
