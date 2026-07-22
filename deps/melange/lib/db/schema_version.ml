type t = { major : int; minor : int option }

let make major minor = { major; minor }
let major version = version.major
let minor version = version.minor

let parse value =
  let parts = String.split_on_char '.' value |> Array.of_list in
  let major =
    if Array.length parts = 0 then None else int_of_string_opt parts.(0)
  in
  match major with
  | None -> invalid_arg ("Bad schema version: " ^ value)
  | Some major ->
      let minor =
        if Array.length parts < 2 then None else int_of_string_opt parts.(1)
      in
      { major; minor }

let compare_minor left right =
  match (left, right) with
  | None, None -> 0
  | None, Some _ -> -1
  | Some _, None -> 1
  | Some left, Some right -> Int.compare left right

let compare left right =
  let major_comparison = Int.compare left.major right.major in
  if major_comparison <> 0 then major_comparison
  else compare_minor left.minor right.minor

let to_string version =
  match version.minor with
  | None -> Int.to_string version.major
  | Some minor -> Int.to_string version.major ^ "." ^ Int.to_string minor

let version = parse "65.33"
