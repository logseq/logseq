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

let capture ~id =
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
    query;
    log = (fun level text -> immediate (fun () ->
      let message = "[plugin:" ^ plugin_id_value id ^ "] " ^ text in
      (match level with
       | Log_error | Log_warn -> Ui_services.log_error_message message
       | Log_debug | Log_info -> Ui_services.log_info message);
      Ok ()));
  } in
  services, reads
