type 'a formatter = 'a Cli_result.t -> Cli_config.t -> string

open Melange_edn

let normalize_json v = v

let json_escape value =
  let buffer = Buffer.create (String.length value + 8) in
  String.iter
    (function
      | '"' -> Buffer.add_string buffer "\\\""
      | '\\' -> Buffer.add_string buffer "\\\\"
      | '\n' -> Buffer.add_string buffer "\\n"
      | '\r' -> Buffer.add_string buffer "\\r"
      | '\t' -> Buffer.add_string buffer "\\t"
      | c -> Buffer.add_char buffer c)
    value;
  Buffer.contents buffer

let rec json_of_value value =
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
  | true, _, _, _, _, _, _, _ -> "null"
  | _, Some b, _, _, _, _, _, _ -> if b then "true" else "false"
  | _, _, Some i, _, _, _, _, _ -> string_of_int i
  | _, _, _, Some f, _, _, _, _ -> string_of_float f
  | _, _, _, _, Some s, _, _, _ ->
      "\""
      ^ json_escape
          (if String.length s > 0 && s.[0] = ':' then
             String.sub s 1 (String.length s - 1)
           else s)
      ^ "\""
  | _, _, _, _, _, Some b, _, _ -> "\"" ^ json_escape (Bytes.to_string b) ^ "\""
  | _, _, _, _, _, _, Some xs, _ ->
      "[" ^ String.concat "," (List.map json_of_value xs) ^ "]"
  | _, _, _, _, _, _, _, Some xs ->
      let member (k, v) =
        let key =
          match Edn_util.as_string_like k with
          | Some s ->
              if String.length s > 0 && s.[0] = ':' then
                String.sub s 1 (String.length s - 1)
              else s
          | None -> Melange_edn.to_edn_string k
        in
        "\"" ^ json_escape key ^ "\":" ^ json_of_value v
      in
      "{" ^ String.concat "," (List.map member xs) ^ "}"
  | _ -> Melange_edn.to_json_string value

let rec edn_of_value value =
  match value with
  | Melange_edn.Any Melange_edn.Nil -> "nil"
  | Any (Bool b) -> if b then "true" else "false"
  | Any (Int i) -> (
      match Edn_util.int64_to_int_opt i with
      | Some i -> string_of_int i
      | None -> Int64.to_string i)
  | Any (Bigint i) | Any (Decimal i) -> i
  | Any (Float f) -> string_of_float f
  | Any (String s) -> "\"" ^ json_escape s ^ "\""
  | Any (Keyword s) -> ":" ^ s
  | Any (Tagged ("uuid", uuid)) -> (
      match Edn_util.as_string uuid with
      | Some uuid -> "\"" ^ json_escape uuid ^ "\""
      | None -> Melange_edn.to_edn_string value)
  | Any (Tagged ("bytes", bytes)) -> (
      match Edn_util.as_string bytes with
      | Some bytes -> "\"" ^ json_escape bytes ^ "\""
      | None -> Melange_edn.to_edn_string value)
  | Any (List xs) ->
      "("
      ^ String.concat " " (List.map edn_of_value (Edn_util.iarray_to_list xs))
      ^ ")"
  | Any (Vector xs) ->
      "["
      ^ String.concat " " (List.map edn_of_value (Edn_util.iarray_to_list xs))
      ^ "]"
  | Any (Set xs) ->
      "#{"
      ^ String.concat " " (List.map edn_of_value (Edn_util.iarray_to_list xs))
      ^ "}"
  | Any (Map xs) ->
      "{"
      ^ String.concat ", "
          (List.map
             (fun (k, v) -> edn_of_value k ^ " " ^ edn_of_value v)
             (Edn_util.iarray_to_list xs))
      ^ "}"
  | _ -> Melange_edn.to_edn_string value

let data_to_value = function
  | Cli_result.Message s ->
      Edn_util.map [ (Edn_util.keyword ":message", Edn_util.string s) ]
  | Items xs -> Edn_util.vector xs
  | Entity v | Query_result v | Raw v -> v
  | Empty -> Edn_util.nil

let candidate_to_value (candidate : Error.candidate) =
  let fields =
    match candidate.name with
    | Some name -> [ (Edn_util.keyword ":name", Edn_util.string name) ]
    | None -> []
  in
  let fields =
    match candidate.id with
    | Some id -> (Edn_util.keyword ":id", Edn_util.int64 id) :: fields
    | None -> fields
  in
  Edn_util.map fields

let error_to_value ?(edn = false) (error : Error.t) =
  let code_value =
    if edn then Edn_util.any error.code
    else
      let code = Edn_util.keyword_to_string error.code in
      let code =
        if String.length code > 0 && code.[0] = ':' then
          String.sub code 1 (String.length code - 1)
        else code
      in
      Edn_util.string code
  in
  let fields =
    [
      (Edn_util.keyword ":code", code_value);
      (Edn_util.keyword ":message", Edn_util.string error.message);
    ]
  in
  let fields =
    match error.candidates with
    | [] -> fields
    | candidates ->
        fields
        @ [
            ( Edn_util.keyword ":candidates",
              Edn_util.vector (List.map candidate_to_value candidates) );
          ]
  in
  Edn_util.map fields

let to_json result =
  match result.Cli_result.status with
  | Ok ->
      let data =
        match result.data with
        | Some data -> data_to_value data
        | None -> Edn_util.nil
      in
      "{\"status\":\"ok\",\"data\":" ^ json_of_value data ^ "}"
  | Error ->
      let error =
        match result.error with
        | Some e -> error_to_value e
        | None -> Edn_util.map []
      in
      "{\"status\":\"error\",\"error\":" ^ json_of_value error ^ "}"

let to_edn result =
  match result.Cli_result.status with
  | Ok ->
      let data =
        match result.data with
        | Some data -> data_to_value data
        | None -> Edn_util.nil
      in
      "{:status :ok, :data " ^ edn_of_value data ^ "}"
  | Error ->
      let error =
        match result.error with
        | Some e -> error_to_value ~edn:true e
        | None -> Edn_util.map []
      in
      "{:status :error, :error " ^ edn_of_value error ^ "}"

let render_human table = Output.Human_output.to_string table
let count_footer count = "Count: " ^ Humanize_types.format_count count

let strip_leading_colon value =
  if String.length value > 0 && value.[0] = ':' then
    String.sub value 1 (String.length value - 1)
  else value

let field_label key =
  key |> Edn_util.as_string_like
  |> Option.value ~default:(Melange_edn.to_edn_string key)
  |> strip_leading_colon

let value_text value =
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
  | _ -> Melange_edn.to_edn_string value

let has_suffix ~suffix value =
  let suffix_len = String.length suffix in
  let value_len = String.length value in
  value_len >= suffix_len
  && String.sub value (value_len - suffix_len) suffix_len = suffix

let normalized_label label = String.lowercase_ascii label

let is_created_at_field label =
  has_suffix ~suffix:"created-at" (normalized_label label)

let is_updated_at_field label =
  has_suffix ~suffix:"updated-at" (normalized_label label)

let is_datetime_field label =
  is_created_at_field label || is_updated_at_field label

let move_datetime_columns_last columns =
  let non_datetime, datetime =
    List.partition (fun label -> not (is_datetime_field label)) columns
  in
  let created_at = List.filter is_created_at_field datetime in
  let updated_at = List.filter is_updated_at_field datetime in
  non_datetime @ created_at @ updated_at

let add_column acc label = if List.mem label acc then acc else acc @ [ label ]

let table_columns items =
  items
  |> List.fold_left
       (fun acc fields ->
         fields
         |> List.map (fun (key, _) -> field_label key)
         |> List.fold_left add_column acc)
       []
  |> move_datetime_columns_last

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
  value |> String.split_on_char '\n'
  |> List.map (fun line -> Display_width.truncate line max_width)
  |> String.concat "\n"

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

let search_columns columns =
  let is_label expected label =
    String.equal (String.lowercase_ascii label) expected
  in
  let db_id, rest = List.partition (is_label "db/id") columns in
  let title, rest = List.partition (is_label "block/title") rest in
  db_id @ rest @ title

let asset_column_role label =
  match String.lowercase_ascii label with
  | "id" | "db/id" -> Some "id"
  | "title" | "block/title" -> Some "title"
  | "size" | "logseq.property.asset/size" -> Some "size"
  | "type" | "asset-type" | "logseq.property.asset/type" -> Some "type"
  | _ -> None

let columns_by_role roles columns =
  roles
  |> List.filter_map (fun role ->
         List.find_opt
           (fun label ->
             Option.equal String.equal (asset_column_role label) (Some role))
           columns)

let asset_columns columns =
  let prefix_roles = [ "id"; "title"; "size"; "type" ] in
  let prefix = columns_by_role prefix_roles columns in
  let prefix_or_datetime label =
    Option.is_some (asset_column_role label) || is_datetime_field label
  in
  let middle = List.filter (fun label -> not (prefix_or_datetime label)) columns in
  let created_at = List.filter is_created_at_field columns in
  let updated_at = List.filter is_updated_at_field columns in
  prefix @ middle @ created_at @ updated_at

let columns_for_command command items =
  let columns = table_columns items in
  match command with
  | Command_id.List_asset -> asset_columns columns
  | _ -> if is_search_command command then search_columns columns else columns

let should_truncate_title command label =
  is_list_command command && is_title_label label

let list_search_human command value config =
  match Option.bind (Edn_util.get value ":items") Edn_util.as_seq with
  | None -> None
  | Some items ->
      let mapped = List.filter_map Edn_util.as_map items in
      if List.length mapped <> List.length items then None
      else
        let title_width = title_max_display_width config in
        let columns = columns_for_command command mapped in
        let headers = columns in
        let rows =
          mapped
          |> List.map (fun fields ->
              columns
              |> List.map (fun label ->
                  let value =
                    fields |> field_by_label label |> Option.map value_text
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

let read_text_file path =
  Cli_unix.read_text_file path

let read_current_graph root_dir =
  let path = Filename.concat root_dir "current-graph" in
  if not (Cli_unix.file_exists path) then None
  else
    try
      let graph = String.trim (read_text_file path) in
      if graph = "" then None else Some (Cli_primitive.create_graph graph)
    with _ -> None

let current_graph_of_config config =
  match config.Cli_config.graph with
  | Some _ as graph -> graph
  | None -> read_current_graph config.Cli_config.root_dir

let graph_list_human value config =
  match Edn_util.as_map value with
  | Some fields -> (
      let configured_graph =
        current_graph_of_config config
        |> Option.map Cli_primitive.string_of_graph
      in
      let current_graph =
        match List.assoc_opt (Edn_util.keyword ":current-graph") fields with
        | Some value -> (
            match Edn_util.as_string value with
            | Some _ as graph -> graph
            | None -> configured_graph)
        | None -> configured_graph
      in
      match List.assoc_opt (Edn_util.keyword ":graphs") fields with
      | Some graphs_value -> (
          match Edn_util.as_vector graphs_value with
          | Some graphs ->
              let rows =
                List.map
                  (fun graph ->
                    let graph =
                      Option.value (Edn_util.as_string graph)
                        ~default:(Melange_edn.to_edn_string graph)
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

let to_human : type a. a Cli_result.t -> Cli_config.t -> string =
 fun result config ->
  match (result.Cli_result.command, result.data, result.output) with
  | Some Command_id.Graph_list, Some (Cli_result.Raw value), Output.Human _ ->
      graph_list_human value config
  | Some command, Some (Cli_result.Raw value), Output.Human _
    when is_list_or_search_command command -> (
      match list_search_human command value config with
      | Some output -> output
      | None -> (
          match result.output with
          | Output.Human human -> render_human human
          | Output.Json _ | Output.Edn _ -> ""))
  | _, _, Output.Human human -> render_human human
  | _, _, (Output.Json _ | Output.Edn _) -> ""

let format_error err _ =
  "Error (" ^ Edn_util.keyword_to_string err.Error.code ^ "): " ^ err.message

let format_result result config =
  match config.Cli_config.output_format with
  | Some (Output.Mode.Packed Output.Mode.Json) -> to_json result
  | Some (Output.Mode.Packed Output.Mode.Edn) -> to_edn result
  | Some (Output.Mode.Packed Output.Mode.Human) | None -> (
      match result.Cli_result.status with
      | Ok -> to_human result config
      | Error -> (
          match result.error with
          | Some err -> format_error err result.command
          | None -> ""))

let format_counted_table ~headers ~rows =
  render_human
    (Output.Human_output.create ~headers
       ~footer:("Count: " ^ Humanize_types.format_count (List.length rows))
       ~rows ())
