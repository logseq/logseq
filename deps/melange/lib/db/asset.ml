let digest_hex bytes =
  Rrbvec.fold_left
    (fun result byte ->
      if byte < 0 || byte > 255 then
        invalid_arg "asset digest byte must be between 0 and 255";
      result ^ Printf.sprintf "%02x" byte)
    "" bytes

let basename path =
  let rec skip_trailing_slashes index =
    if index >= 0 && Char.equal path.[index] '/' then
      skip_trailing_slashes (index - 1)
    else index
  in
  let last = skip_trailing_slashes (String.length path - 1) in
  if last < 0 then ""
  else
    let rec find_start index =
      if index < 0 || Char.equal path.[index] '/' then index + 1
      else find_start (index - 1)
    in
    let start = find_start last in
    String.sub path start (last - start + 1)

let extension_start name =
  if String.equal name ".." then None
  else
    let rec find index =
      if index <= 0 then None
      else if Char.equal name.[index] '.' then Some index
      else find (index - 1)
    in
    find (String.length name - 1)

let path_type path =
  let name = basename path in
  match extension_start name with
  | None -> ""
  | Some index ->
      String.sub name (index + 1) (String.length name - index - 1)
      |> String.lowercase_ascii

let name_title path =
  let name = basename path in
  match extension_start name with
  | None -> name
  | Some index -> String.sub name 0 index
