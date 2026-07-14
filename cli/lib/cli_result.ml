type status = Ok | Error

type ok_data =
  | Message of string
  | Items of Melange_edn_melange.any Rrbvec.t
  | Entity of Melange_edn_melange.any
  | Query_result of Melange_edn_melange.any
  | Raw of Melange_edn_melange.any
  | Empty

type error_data = Error.t

type t = {
  status : status;
  data : ok_data option;
  error : error_data option;
  command : Command_id.t option;
  context : Melange_edn_melange.any option;
  output : 'o. 'o Output.Mode.t -> 'o Output.t;
  exit_code : int option;
  human_table_headers_order : string Rrbvec.t;
}

let data_value = function
  | Message s -> Edn_util.string s
  | Items xs -> Edn_util.vector_vec xs
  | Entity v | Query_result v | Raw v -> v
  | Empty -> Edn_util.nil

let human_table ?headers ?footer rows : Output.Human_output.t =
  Output.Human_output.create ?headers ?footer ~rows ()

let human_message message = human_table (Vec.singleton (Vec.singleton message))
let empty_human = human_table Vec.empty
let count_footer count = "Count: " ^ Humanize_types.format_count count

let strip_leading_colon value =
  if String.length value > 0 && value.[0] = ':' then
    String.sub value 1 (String.length value - 1)
  else value

let field_label key =
  key |> Edn_util.as_string_like
  |> Option.value ~default:(Melange_edn_melange.to_edn_string key)
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
  | _ -> Melange_edn_melange.to_edn_string value

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

let field_value_text label value =
  let text = value_text value in
  match Int64.of_string_opt text with
  | Some epoch_ms when is_datetime_field label ->
      Humanize_types.relative_datetime
        ~then_time:(Time.time_of_epoch_ms epoch_ms)
        ~now_time:(Time.now ())
  | _ -> text

let parse_positive_int64 text =
  let text = String.trim text in
  if text = "" then None else Int64.of_string_opt text

let graph_info_timestamp_seconds value =
  let timestamp =
    match Edn_util.as_int64 value with
    | Some value -> Some value
    | None -> parse_positive_int64 (value_text value)
  in
  timestamp
  |> Option.map (fun timestamp ->
      if Int64.compare timestamp 100_000_000_000L >= 0 then
        Int64.div timestamp 1_000L
      else timestamp)

let graph_info_field_value_text label value =
  match graph_info_timestamp_seconds value with
  | Some then_seconds when is_datetime_field label ->
      Humanize_types.datetime
        ~now:(Time.time_to_epoch_seconds (Time.now ()))
        then_seconds
  | _ -> value_text value

let add_column acc label =
  if Vec.mem label acc then acc else Vec.push_back acc label

let table_columns items =
  items
  |> Vec.fold_left
       (fun acc fields ->
         fields
         |> Vec.map (fun (key, _) -> field_label key)
         |> Vec.fold_left add_column acc)
       Vec.empty

let field_by_label label fields =
  fields
  |> Vec.find_map (fun (key, value) ->
      if field_label key = label then Some value else None)

let mapped_items_human items =
  let mapped = Vec.filter_map Edn_util.as_map items in
  if Vec.length mapped = Vec.length items then
    let headers = table_columns mapped in
    let rows =
      mapped
      |> Vec.map (fun fields ->
          headers
          |> Vec.map (fun label ->
              fields |> field_by_label label |> Option.map value_text
              |> Option.value ~default:""))
    in
    human_table ~headers ~footer:(count_footer (Vec.length rows)) rows
  else
    let seqs = Vec.filter_map Edn_util.as_seq items in
    if Vec.length seqs = Vec.length items then
      let width =
        seqs |> Vec.fold_left (fun acc row -> max acc (Vec.length row)) 0
      in
      let headers =
        Vec.init width (fun index -> "Column " ^ string_of_int (index + 1))
      in
      let rows =
        seqs
        |> Vec.map (fun row ->
            Vec.init width (fun index ->
                Vec.nth_opt row index |> Option.map value_text
                |> Option.value ~default:""))
      in
      human_table ~headers ~footer:(count_footer (Vec.length rows)) rows
    else
      human_table ~headers:(Vec.singleton "Value")
        ~footer:(count_footer (Vec.length items))
        (Vec.map (fun value -> Vec.singleton (value_text value)) items)

let items_human value =
  Option.bind (Edn_util.get value "items") Edn_util.as_seq
  |> Option.map mapped_items_human

let list_like_fields =
  Vec.of_array
    [| "items"; "queries"; "checks"; "servers"; "backups"; "graphs"; "routed" |]

let sequence_field_by_label label fields =
  fields
  |> Vec.find_map (fun (key, value) ->
      if field_label key = label then
        value |> Edn_util.as_seq |> Option.map mapped_items_human
      else None)

let list_like_sequence_field fields =
  list_like_fields
  |> Vec.find_map (fun label -> sequence_field_by_label label fields)

let single_result_sequence_field fields =
  match Vec.nth_opt fields 0 with
  | Some (key, value) when Vec.length fields = 1 && field_label key = "result"
    ->
      value |> Edn_util.as_seq |> Option.map mapped_items_human
  | _ -> None

let sequence_field_human fields =
  match list_like_sequence_field fields with
  | Some table -> Some table
  | None -> single_result_sequence_field fields

let field_rows fields =
  Vec.map
    (fun (key, value) ->
      let label = field_label key in
      Vec.of_array [| label; field_value_text label value |])
    fields

let map_human fields = human_table (field_rows fields)

let value_human value =
  match Edn_util.as_map value with
  | Some fields -> (
      match sequence_field_human fields with
      | Some table -> table
      | None -> map_human fields)
  | None -> (
      match Edn_util.as_seq value with
      | Some values -> mapped_items_human values
      | None -> human_message (value_text value))

let graph_list_human value =
  match Edn_util.as_map value with
  | Some fields -> (
      let current_graph =
        match Vec.assoc_opt (Edn_util.keyword "current-graph") fields with
        | Some value -> Edn_util.as_string value
        | None -> None
      in
      match Vec.assoc_opt (Edn_util.keyword "graphs") fields with
      | Some graphs_value -> (
          match Edn_util.as_vector graphs_value with
          | Some graphs ->
              let rows =
                Vec.map
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
                    Vec.singleton (prefix ^ graph))
                  graphs
              in
              human_table ~footer:(count_footer (Vec.length rows)) rows
          | None -> empty_human)
      | None -> empty_human)
  | None -> empty_human

let text_list value key =
  Option.bind (Edn_util.get value key) Edn_util.as_seq
  |> Option.map (Vec.map value_text)
  |> Option.value ~default:Vec.empty

let bullet_lines values =
  if Vec.is_empty values then Vec.singleton "  - (none)"
  else Vec.map (fun value -> "  - " ^ value) values

let example_human value =
  let selector =
    Edn_util.get_string value "selector" |> Option.value ~default:"-"
  in
  let matched_commands = text_list value "matched-commands" in
  let examples = text_list value "examples" in
  let message = Edn_util.get_string value "message" in
  let lines =
    Vec.append
      (match message with
      | Some message -> Vec.singleton message
      | None -> Vec.empty)
      (Vec.of_array [| "Selector: " ^ selector; "Matched commands:" |])
    |> fun lines ->
    Vec.append lines (bullet_lines matched_commands) |> fun lines ->
    Vec.push_back lines "Examples:" |> fun lines ->
    Vec.append lines (bullet_lines examples)
  in
  human_table (Vec.map (fun line -> Vec.singleton line) lines)

let contains_substring ~needle text =
  let needle_len = String.length needle in
  let text_len = String.length text in
  let rec loop index =
    index + needle_len <= text_len
    && (String.sub text index needle_len = needle || loop (index + 1))
  in
  loop 0

let sensitive_field label =
  let label = String.lowercase_ascii label in
  Vec.exists
    (fun needle -> contains_substring ~needle label)
    (Vec.of_array [| "token"; "secret"; "password" |])

let graph_info_human value =
  match Edn_util.as_map value with
  | Some fields ->
      let graph_rows =
        match Vec.assoc_opt (Edn_util.keyword "graph") fields with
        | Some graph ->
            Vec.singleton (Vec.of_array [| "graph"; value_text graph |])
        | None -> Vec.empty
      in
      let kv_rows =
        match Vec.assoc_opt (Edn_util.keyword "kv") fields with
        | Some kv -> (
            match Edn_util.as_map kv with
            | Some kv_fields ->
                Vec.map
                  (fun (key, value) ->
                    let label = field_label key in
                    Vec.of_array
                      [|
                        label;
                        (if sensitive_field label then "[REDACTED]"
                         else graph_info_field_value_text label value);
                      |])
                  kv_fields
            | None -> Vec.empty)
        | None -> Vec.empty
      in
      human_table (Vec.append graph_rows kv_rows)
  | None -> empty_human

let remote_graph_columns =
  Vec.of_array
    [| "graph-name"; "graph-id"; "graph-e2ee?"; "role"; "created-at" |]

let remote_graph_row graph =
  match Edn_util.as_map graph with
  | Some fields ->
      remote_graph_columns
      |> Vec.map (fun label ->
          fields |> field_by_label label |> Option.map value_text
          |> Option.value ~default:"")
  | None -> Vec.of_array [| value_text graph; ""; ""; ""; "" |]

let remote_graphs_human value =
  match Edn_util.as_map value with
  | Some fields -> (
      match Vec.assoc_opt (Edn_util.keyword "graphs") fields with
      | Some graphs_value -> (
          match Edn_util.as_seq graphs_value with
          | Some graphs ->
              let rows = Vec.map remote_graph_row graphs in
              human_table ~headers:remote_graph_columns
                ~footer:(count_footer (Vec.length rows))
                rows
          | None -> empty_human)
      | None -> empty_human)
  | None -> empty_human

let human_output command data =
  match data with
  | Message s -> human_message s
  | Empty -> empty_human
  | Raw value when command = Some Command_id.Graph_list ->
      graph_list_human value
  | Raw value when command = Some Command_id.Graph_info ->
      graph_info_human value
  | Raw value when command = Some Command_id.Example -> example_human value
  | Raw value when command = Some Command_id.Sync_remote_graphs ->
      remote_graphs_human value
  | Raw value -> (
      match items_human value with
      | Some table -> table
      | None -> value_human value)
  | Entity value | Query_result value -> value_human value
  | Items values ->
      human_table ~headers:(Vec.singleton "Value")
        ~footer:(count_footer (Vec.length values))
        (Vec.map
           (fun value ->
             Vec.singleton (Melange_edn_melange.to_edn_string value))
           values)

let output_for_data : type a.
    Command_id.t option -> a Output.Mode.t -> ok_data -> a Output.t =
 fun command mode data ->
  match mode with
  | Output.Mode.Human -> Output.Human (human_output command data)
  | Output.Mode.Json -> Output.Json (data_value data)
  | Output.Mode.Edn -> Output.Edn (data_value data)

let ok ?command ?context mode data =
  let (_ : _ Output.Mode.t) = mode in
  {
    status = Ok;
    data = Some data;
    error = None;
    command;
    context;
    output = (fun mode -> output_for_data command mode data);
    exit_code = None;
    human_table_headers_order = Vec.empty;
  }

let error ?command ?context mode error =
  let (_ : _ Output.Mode.t) = mode in
  let output : type a. a Output.Mode.t -> a Output.t = function
    | Output.Mode.Human -> Output.Human (human_message error.Error.message)
    | Output.Mode.Json -> Output.Json Edn_util.nil
    | Output.Mode.Edn -> Output.Edn Edn_util.nil
  in
  {
    status = Error;
    data = None;
    error = Some error;
    command;
    context;
    output;
    exit_code = Some 1;
    human_table_headers_order = Vec.empty;
  }

let is_error t = t.status = Error

let exit_code t =
  match t.exit_code with Some c -> c | None -> if is_error t then 1 else 0

let data_value t =
  match t.data with
  | Some Empty | None -> None
  | Some data -> Some (data_value data)

let with_command command t = { t with command = Some command }

let with_human_table_headers_order human_table_headers_order t =
  { t with human_table_headers_order }
