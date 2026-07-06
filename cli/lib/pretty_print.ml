external stringify_json_with_space :
  Js.Json.t -> (_[@mel.as {json|null|json}]) -> int -> string = "stringify"
[@@mel.scope "JSON"]

let margin = 80
let spaces count = String.make (max 0 count) ' '
let array_to_list = Array.to_list

let rec flat_value (Melange_edn_melange.Any value as any) =
  match value with
  | Melange_edn_melange.Map fields ->
      array_to_list fields
      |> List.map (fun (key, value) -> flat_value key ^ " " ^ flat_value value)
      |> String.concat ", "
      |> fun content -> "{" ^ content ^ "}"
  | Melange_edn_melange.Vector values -> flat_seq "[" "]" (array_to_list values)
  | Melange_edn_melange.List values -> flat_seq "(" ")" (array_to_list values)
  | Melange_edn_melange.Set values -> flat_seq "#{" "}" (array_to_list values)
  | Melange_edn_melange.Tagged (tag, value) -> "#" ^ tag ^ " " ^ flat_value value
  | _ -> Melange_edn_melange.to_edn_string any

and flat_seq open_ close values =
  values |> List.map flat_value |> String.concat " " |> fun content ->
  open_ ^ content ^ close

let rec format_value indent (Melange_edn_melange.Any value as any) =
  let flat = flat_value any in
  if indent + String.length flat <= margin then flat
  else
    match value with
    | Melange_edn_melange.Map fields -> format_map indent (array_to_list fields)
    | Melange_edn_melange.Vector values ->
        format_seq indent "[" "]" 1 (array_to_list values)
    | Melange_edn_melange.List values ->
        format_seq indent "(" ")" 1 (array_to_list values)
    | Melange_edn_melange.Set values ->
        format_seq indent "#{" "}" 2 (array_to_list values)
    | _ -> flat

and format_map indent fields =
  match fields with
  | [] -> "{}"
  | _ ->
      let entry_indent = indent + 1 in
      let last_index = List.length fields - 1 in
      fields
      |> List.mapi (fun index (key, value) ->
          let key = flat_value key in
          let value_indent = entry_indent + String.length key + 1 in
          let prefix = if index = 0 then "{" else spaces entry_indent in
          let suffix = if index = last_index then "" else "," in
          prefix ^ key ^ " " ^ format_value value_indent value ^ suffix)
      |> String.concat "\n"
      |> fun content -> content ^ "}"

and format_seq indent open_ close open_width values =
  match values with
  | [] -> open_ ^ close
  | _ ->
      let entry_indent = indent + open_width in
      values
      |> List.mapi (fun index value ->
          let prefix = if index = 0 then open_ else spaces entry_indent in
          prefix ^ format_value entry_indent value)
      |> String.concat "\n"
      |> fun content -> content ^ close

let pprint_edn value = format_value 0 value ^ "\n"
let pprint_json json = stringify_json_with_space json 2
