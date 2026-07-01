type formatter = Cli_result.t -> Cli_config.t -> string

let normalize_json v = v

let strip_leading_colon value =
  if String.length value > 0 && value.[0] = ':' then
    String.sub value 1 (String.length value - 1)
  else value

let unquote_transit_value = function
  | Melange_edn_melange.Any (Melange_edn_melange.Tagged (("transit/quote" | "'"), value)) ->
      value
  | value -> value

let rec json_of_value value =
  let value = unquote_transit_value value in
  match
    ( Edn_util.is_null value,
      Edn_util.as_bool value,
      Edn_util.as_int value,
      Edn_util.as_float value,
      Edn_util.as_string_like value,
      Edn_util.as_bytes value,
      Edn_util.as_seq value,
      Edn_util.as_map value )
  with
  | true, _, _, _, _, _, _, _ -> Js.Json.null
  | _, Some b, _, _, _, _, _, _ -> Js.Json.boolean b
  | _, _, Some i, _, _, _, _, _ -> Js.Json.number (float_of_int i)
  | _, _, _, Some f, _, _, _, _ -> Js.Json.number f
  | _, _, _, _, Some s, _, _, _ -> Js.Json.string (strip_leading_colon s)
  | _, _, _, _, _, Some b, _, _ -> Js.Json.string (Bytes.to_string b)
  | _, _, _, _, _, _, Some xs, _ ->
      Js.Json.array (Array.of_list (List.map json_of_value xs))
  | _, _, _, _, _, _, _, Some xs ->
      let object_ = Js.Dict.empty () in
      List.iter
        (fun (k, v) ->
          let key =
            match Edn_util.as_string_like k with
            | Some s -> strip_leading_colon s
            | None -> Melange_edn_melange.to_edn_string k
          in
          Js.Dict.set object_ key (json_of_value v))
        xs;
      Js.Json.object_ object_
  | _ -> Melange_edn_melange.to_json value

let data_to_value = function
  | Cli_result.Message s ->
      Edn_util.map [ (Edn_util.keyword "message", Edn_util.string s) ]
  | Items xs -> Edn_util.vector xs
  | Entity v | Query_result v | Raw v -> v
  | Empty -> Edn_util.nil

let contains_substring ~needle text =
  let needle_len = String.length needle in
  let text_len = String.length text in
  let rec loop index =
    index + needle_len <= text_len
    && (String.sub text index needle_len = needle || loop (index + 1))
  in
  loop 0

let sensitive_field key =
  let key = String.lowercase_ascii (strip_leading_colon key) in
  List.exists
    (fun needle -> contains_substring ~needle key)
    [ "token"; "secret"; "password" ]

let rec redact_sensitive_value value =
  match Edn_util.as_map value with
  | Some fields ->
      fields
      |> List.map (fun (key, value) ->
          let value =
            match Edn_util.as_string_like key with
            | Some key when sensitive_field key -> Edn_util.string "[REDACTED]"
            | _ -> redact_sensitive_value value
          in
          (key, value))
      |> Edn_util.map
  | None -> (
      match Edn_util.as_seq value with
      | Some values -> Edn_util.vector (List.map redact_sensitive_value values)
      | None -> value)

let result_data_value result =
  let data =
    match result.Cli_result.data with
    | Some data -> data_to_value data
    | None -> Edn_util.nil
  in
  match result.Cli_result.command with
  | Some Command_id.Graph_info -> redact_sensitive_value data
  | _ -> data

let candidate_to_value (candidate : Error.candidate) =
  let fields =
    match candidate.name with
    | Some name -> [ (Edn_util.keyword "name", Edn_util.string name) ]
    | None -> []
  in
  let fields =
    match candidate.id with
    | Some id -> (Edn_util.keyword "id", Edn_util.int64 id) :: fields
    | None -> fields
  in
  Edn_util.map fields

let error_to_value ?(edn = false) (error : Error.t) =
  let code_value =
    if edn then Edn_util.any (Error.code_to_keyword error.code)
    else Edn_util.string (Error.code_to_string error.code)
  in
  let fields =
    [
      (Edn_util.keyword "code", code_value);
      (Edn_util.keyword "message", Edn_util.string error.message);
    ]
  in
  let fields =
    match error.hint with
    | None -> fields
    | Some hint -> fields @ [ (Edn_util.keyword "hint", Edn_util.string hint) ]
  in
  let fields =
    match error.candidates with
    | [] -> fields
    | candidates ->
        fields
        @ [
            ( Edn_util.keyword "candidates",
              Edn_util.vector (List.map candidate_to_value candidates) );
          ]
  in
  let fields =
    match error.context with
    | None -> fields
    | Some context -> (
        match Edn_util.as_map context with
        | Some context_fields ->
            let reserved = [ "code"; "message"; "hint"; "candidates" ] in
            fields
            @ List.filter
                (fun (key, _) ->
                  match Edn_util.as_string_like key with
                  | Some key ->
                      not (List.mem (strip_leading_colon key) reserved)
                  | None -> true)
                context_fields
        | None -> fields @ [ (Edn_util.keyword "context", context) ])
  in
  Edn_util.map fields

let to_json result =
  let object_ = Js.Dict.empty () in
  match result.Cli_result.status with
  | Ok ->
      let data = result_data_value result in
      Js.Dict.set object_ "status" (Js.Json.string "ok");
      Js.Dict.set object_ "data" (json_of_value data);
      Js.Json.stringify (Js.Json.object_ object_)
  | Error ->
      let error =
        match result.error with
        | Some e -> error_to_value e
        | None -> Edn_util.map []
      in
      Js.Dict.set object_ "status" (Js.Json.string "error");
      Js.Dict.set object_ "error" (json_of_value error);
      Js.Json.stringify (Js.Json.object_ object_)

let to_edn result =
  let status, payload_key, payload =
    match result.Cli_result.status with
    | Ok ->
        let data = result_data_value result in
        (Edn_util.keyword "ok", Edn_util.keyword "data", data)
    | Error ->
        let error =
          match result.error with
          | Some e -> error_to_value ~edn:true e
          | None -> Edn_util.map []
        in
        (Edn_util.keyword "error", Edn_util.keyword "error", error)
  in
  Melange_edn_melange.to_edn_string
    (Edn_util.map
       [ (Edn_util.keyword "status", status); (payload_key, payload) ])

let render_human table = Output.Human_output.to_string table
let count_footer count = "Count: " ^ Humanize_types.format_count count

let field_label key =
  key |> Edn_util.as_string_like
  |> Option.value ~default:(Melange_edn_melange.to_edn_string key)
  |> strip_leading_colon

let value_text value =
  let value = unquote_transit_value value in
  match
    ( Edn_util.is_null value,
      Edn_util.as_string_like value,
      Edn_util.as_int value,
      Edn_util.as_bool value,
      Edn_util.as_float value )
  with
  | true, _, _, _, _ -> ""
  | _, Some value, _, _, _ -> strip_leading_colon value
  | _, _, Some value, _, _ -> string_of_int value
  | _, _, _, Some value, _ -> string_of_bool value
  | _, _, _, _, Some value -> string_of_float value
  | _ -> Melange_edn_melange.to_edn_string value

let query_result_human value =
  match Edn_util.get value "result" with
  | Some result -> (
      match Edn_util.as_seq result with
      | Some values -> String.concat "\n" (List.map value_text values)
      | None -> value_text result)
  | None -> value_text value

let is_keyword_namespace_char = function
  | 'a' .. 'z' | '0' .. '9' | '.' | '-' | '_' -> true
  | _ -> false

let is_keyword_namespace value =
  value <> "" && String.for_all is_keyword_namespace_char value

let human_header_label label =
  let label = strip_leading_colon label in
  match String.split_on_char '/' label with
  | [ namespace; name ] when is_keyword_namespace namespace && name <> "" ->
      name
  | _ -> label

let add_column acc label = if List.mem label acc then acc else acc @ [ label ]

let discovered_table_columns items =
  items
  |> List.fold_left
       (fun acc fields ->
         fields
         |> List.map (fun (key, _) -> field_label key)
         |> List.fold_left add_column acc)
       []

let order_table_columns header_order columns =
  let ordered =
    header_order
    |> List.filter_map (fun expected ->
        List.find_opt
          (fun label ->
            label = expected || human_header_label label = expected)
          columns)
  in
  let ordered =
    List.fold_left
      (fun acc label -> if List.mem label acc then acc else acc @ [ label ])
      [] ordered
  in
  ordered

let field_by_label label fields =
  fields
  |> List.find_map (fun (key, value) ->
      if field_label key = label then Some value else None)

let is_title_label label =
  match String.lowercase_ascii label with
  | "title" | "block/title" -> true
  | _ -> false

let title_max_display_width config =
  if config.Cli_config.list_title_max_display_width > 0 then
    config.list_title_max_display_width
  else (Cli_config.defaults ()).list_title_max_display_width

let truncate_title_cell max_width value =
  let first_line = value |> String.split_on_char '\n' |> List.hd in
  Display_width.truncate first_line max_width

let is_list_command = function
  | Command_id.List_page | List_tag | List_property | List_task | List_node
  | List_asset ->
      true
  | _ -> false

let is_search_command = function
  | Command_id.Search_block | Search_page | Search_property | Search_tag -> true
  | _ -> false

let is_list_or_search_command command =
  is_list_command command || is_search_command command

let table_columns ~human_table_headers_order items =
  discovered_table_columns items
  |> order_table_columns human_table_headers_order

let should_truncate_title command label =
  is_list_command command && is_title_label label

let is_task_keyword_value_label label =
  match human_header_label label with "status" | "priority" -> true | _ -> false

let list_cell_value_text command label value =
  let value = unquote_transit_value value in
  match command with
  | Command_id.List_task when is_task_keyword_value_label label -> (
      match Edn_util.as_keyword value with
      | Some keyword -> human_header_label keyword
      | None -> value_text value)
  | _ -> value_text value

let list_search_human ?(human_table_headers_order = []) command value config =
  match Option.bind (Edn_util.get value "items") Edn_util.as_seq with
  | None -> None
  | Some items ->
      let mapped = List.filter_map Edn_util.as_map items in
      if List.length mapped <> List.length items then None
      else
        let title_width = title_max_display_width config in
        let columns =
          table_columns ~human_table_headers_order mapped
        in
        let headers = columns in
        let rows =
          mapped
          |> List.map (fun fields ->
              columns
              |> List.map (fun label ->
                  let value =
                    fields |> field_by_label label
                    |> Option.map (list_cell_value_text command label)
                    |> Option.value ~default:""
                  in
                  if should_truncate_title command label then
                    truncate_title_cell title_width value
                  else value))
        in
        Some
          (render_human
             (Output.Human_output.create ~headers
                ~footer:(count_footer (List.length rows))
                ~rows ()))

let graph_list_human value config =
  match Edn_util.as_map value with
  | Some fields -> (
      let configured_graph =
        config.Cli_config.graph |> Option.map Cli_primitive.string_of_graph
      in
      let current_graph =
        match List.assoc_opt (Edn_util.keyword "current-graph") fields with
        | Some value -> (
            match Edn_util.as_string value with
            | Some _ as graph -> graph
            | None -> configured_graph)
        | None -> configured_graph
      in
      match List.assoc_opt (Edn_util.keyword "graphs") fields with
      | Some graphs_value -> (
          match Edn_util.as_vector graphs_value with
          | Some graphs ->
              let rows =
                List.map
                  (fun graph ->
                    let graph =
                      Option.value (Edn_util.as_string graph)
                        ~default:(Melange_edn_melange.to_edn_string graph)
                    in
                    let prefix =
                      if Option.equal String.equal current_graph (Some graph)
                      then "* "
                      else if Option.is_some current_graph then "  "
                      else ""
                    in
                    [ prefix ^ graph ])
                  graphs
              in
              render_human
                (Output.Human_output.create
                   ~footer:(count_footer (List.length rows))
                   ~rows ())
          | None -> "")
      | None -> "")
  | None -> ""

let to_human ?human_table_headers_order result config =
  let human_table_headers_order =
    Option.value human_table_headers_order
      ~default:result.Cli_result.human_table_headers_order
  in
  let output = result.Cli_result.output Output.Mode.Human in
  match (result.Cli_result.command, result.data, output) with
  | Some Command_id.Graph_list, Some (Cli_result.Raw value), Output.Human _ ->
      graph_list_human value config
  | Some Command_id.Query, Some (Cli_result.Query_result value), Output.Human _
    ->
      query_result_human value
  | Some command, Some (Cli_result.Raw value), Output.Human _
    when is_list_or_search_command command -> (
      match
        list_search_human ~human_table_headers_order command value config
      with
      | Some output -> output
      | None -> (
          match output with
          | Output.Human human -> render_human human
          | Output.Json _ | Output.Edn _ -> ""))
  | _, _, Output.Human human -> render_human human
  | _, _, (Output.Json _ | Output.Edn _) -> ""

let format_error err _ =
  "Error (" ^ Error.code_to_string err.Error.code ^ "): " ^ err.message

let format_result ?human_table_headers_order result config =
  match (result.Cli_result.command, result.data) with
  | Some Command_id.Skill_show, Some (Cli_result.Message message) -> message
  | _ -> (
      match config.Cli_config.output_format with
      | Some (Output.Mode.Packed Output.Mode.Json) -> to_json result
      | Some (Output.Mode.Packed Output.Mode.Edn) -> to_edn result
      | Some (Output.Mode.Packed Output.Mode.Human) | None -> (
          match result.Cli_result.status with
          | Ok -> to_human ?human_table_headers_order result config
          | Error -> (
              match result.error with
              | Some err -> format_error err result.command
              | None -> "")))

let format_counted_table ~headers ~rows =
  render_human
    (Output.Human_output.create ~headers
       ~footer:("Count: " ^ Humanize_types.format_count (List.length rows))
       ~rows ())
