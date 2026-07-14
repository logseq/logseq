type parsed = { ids : Cli_primitive.db_id Rrbvec.t; multi : bool }

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
      Vec.split_on_char ',' value
      |> Vec.concat_map (fun part ->
          Vec.split_on_char ' ' part
          |> Vec.concat_map (fun part -> Vec.split_on_char '\t' part))
    in
    let ids =
      strip_vector_brackets s |> split_ids
      |> Vec.filter_map (fun p ->
          let p = String.trim p in
          if p = "" then None else Some (Int64.of_string p))
    in
    if Vec.for_all valid_id ids then Ok { ids; multi = Vec.length ids > 1 }
    else Error (Error.invalid_options "invalid id")
  with _ -> Error (Error.invalid_options "invalid id")

let to_single parsed =
  if Vec.length parsed.ids = 1 then Vec.nth_opt parsed.ids 0 else None
