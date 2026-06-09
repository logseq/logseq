type status = { ident : Cli_primitive.keyword; value : string }

let kw value = Edn_util.keyword value
let sym value = Edn_util.string ("~$" ^ value)
let vector values = Edn_util.vector values
let vector_t values = Edn_util.vector_t values

let status_closed_values_query =
  vector_t
    [
      kw "find";
      vector [ sym "?status-ident"; sym "..." ];
      kw "where";
      vector [ sym "?property"; kw "db/ident"; kw "logseq.property/status" ];
      vector [ sym "?value"; kw "block/closed-value-property"; sym "?property" ];
      vector [ sym "?value"; kw "db/ident"; sym "?status-ident" ];
    ]

let starts_with ~prefix value =
  let prefix_len = String.length prefix in
  String.length value >= prefix_len && String.sub value 0 prefix_len = prefix

let drop_prefix prefix value =
  if starts_with ~prefix value then
    String.sub value (String.length prefix)
      (String.length value - String.length prefix)
  else value

let normalize_token value =
  value |> String.trim |> String.lowercase_ascii |> drop_prefix ":"
  |> drop_prefix "logseq.property/status."
  |> drop_prefix "status."
  |> String.map (function ' ' | '_' -> '-' | c -> c)

let status_value_of_ident ident =
  ident |> drop_prefix ":"
  |> drop_prefix "logseq.property/status."
  |> drop_prefix "status." |> normalize_token

let keyword_of_string value = Edn_util.keyword_t value

let status_of_value value =
  match Edn_util.as_string_like value with
  | Some ident ->
      let value = status_value_of_ident ident in
      if value = "" || value = ident then None
      else Some { ident = keyword_of_string ident; value }
  | None -> (
      match Edn_util.as_map value with
      | None -> None
      | Some fields -> (
          let value_of_key key =
            List.find_map
              (fun (k, v) ->
                match Edn_util.as_string_like k with
                | Some k when k = key -> Some v
                | _ -> None)
              fields
          in
          let ident =
            match
              Option.bind (value_of_key "ident") Edn_util.as_string_like
            with
            | Some ident -> Some (keyword_of_string ident)
            | None -> None
          in
          let value =
            match
              Option.bind (value_of_key "value") Edn_util.as_string_like
            with
            | Some value -> Some (normalize_token value)
            | _ ->
                Option.map
                  (fun ident ->
                    status_value_of_ident (Edn_util.keyword_to_string ident))
                  ident
          in
          match (ident, value) with
          | Some ident, Some value when value <> "" -> Some { ident; value }
          | _ -> None))

let normalize_available_statuses values =
  values
  |> List.filter_map status_of_value
  |> List.sort (fun a b -> compare (a.value, a.ident) (b.value, b.ident))

let resolve_status_ident value statuses =
  let token = normalize_token value in
  let ident_from_token =
    keyword_of_string ("logseq.property/status." ^ token)
  in
  statuses
  |> List.find_map (fun s ->
      if
        s.value = token
        || s.ident = keyword_of_string value
        || s.ident = ident_from_token
      then Some s.ident
      else None)

let invalid_status_message value statuses =
  let available =
    statuses |> List.map (fun s -> s.value) |> String.concat ", "
  in
  let available = if available = "" then "(none)" else available in
  "Invalid value for option :status: " ^ value ^ ". Available values: "
  ^ available
