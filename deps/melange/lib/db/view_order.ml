type value = Missing | Bool of bool | Number of float | Text of string
type direction = Asc | Desc
type row = { index : int; keys : value Rrbvec.t }

let compare_value ~missing_last left right =
  match (left, right) with
  | Missing, Missing -> 0
  | Missing, _ -> if missing_last then 1 else -1
  | _, Missing -> if missing_last then -1 else 1
  | Bool left, Bool right -> Bool.compare left right
  | Number left, Number right -> Float.compare left right
  | Text left, Text right -> String.compare left right
  | _ -> invalid_arg "DB view ordering: mixed scalar types"

let compare_rows directions missing_last left right =
  let rec compare_key index =
    if index = Rrbvec.length directions then 0
    else
      let comparison =
        compare_value
          ~missing_last:(Rrbvec.nth missing_last index)
          (Rrbvec.nth left.keys index)
          (Rrbvec.nth right.keys index)
      in
      let comparison =
        match Rrbvec.nth directions index with
        | Asc -> comparison
        | Desc -> -comparison
      in
      if comparison = 0 then compare_key (index + 1) else comparison
  in
  compare_key 0

let sort_indices_with_missing_last rows directions missing_last =
  let direction_count = Rrbvec.length directions in
  if Rrbvec.length missing_last <> direction_count then
    invalid_arg
      "DB view ordering: missing policy count does not match directions";
  Rrbvec.iter
    (fun row ->
      if Rrbvec.length row.keys <> direction_count then
        invalid_arg "DB view ordering: key count does not match directions")
    rows;
  let rows = Rrbvec.to_array rows in
  Array.stable_sort (compare_rows directions missing_last) rows;
  rows |> Array.map (fun row -> row.index) |> Rrbvec.of_array

let sort_indices rows directions =
  sort_indices_with_missing_last rows directions
    (Rrbvec.map (fun _ -> false) directions)
