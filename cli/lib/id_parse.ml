type parsed = { ids : Cli_primitive.db_id list; multi : bool }

let valid_id id = Int64.compare id 0L > 0

let strip_vector_brackets value =
  let value = String.trim value in
  let len = String.length value in
  if len >= 2 && value.[0] = '[' && value.[len - 1] = ']' then
    String.sub value 1 (len - 2)
  else value

let parse_id_string s =
  try
    let split_ids value =
      value |> String.split_on_char ','
      |> List.concat_map (fun part ->
          part |> String.split_on_char ' '
          |> List.concat_map (String.split_on_char '\t'))
    in
    let ids =
      strip_vector_brackets s |> split_ids
      |> List.filter_map (fun p ->
          let p = String.trim p in
          if p = "" then None else Some (Int64.of_string p))
    in
    if List.for_all valid_id ids then Ok { ids; multi = List.length ids > 1 }
    else Error (Error.invalid_options "invalid id")
  with _ -> Error (Error.invalid_options "invalid id")

let parse_id_option = function
  | Some value -> (
      match (Edn_util.as_int64 value, Edn_util.as_string value) with
      | Some id, _ when valid_id id -> Ok { ids = [ id ]; multi = false }
      | _, Some s -> parse_id_string s
      | _ -> Error (Error.invalid_options "invalid id"))
  | None -> Ok { ids = []; multi = false }

let to_single parsed = match parsed.ids with [ id ] -> Some id | _ -> None
