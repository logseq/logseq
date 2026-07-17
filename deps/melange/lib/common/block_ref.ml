let left_parens = "(("
let right_parens = "))"
let left_and_right_parens = left_parens ^ right_parens

let block_ref_pattern =
  "\\(\\(([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})\\)\\)"

let block_ref_re = Js.Re.fromString block_ref_pattern
let block_ref_full_re = Js.Re.fromString ("^" ^ block_ref_pattern ^ "$")

let get_block_ref_id value =
  match Js.Re.exec ~str:value block_ref_full_re with
  | None -> None
  | Some result ->
      result |> Js.Re.captures |> fun captures ->
      captures.(1) |> Js.Nullable.toOption

let get_string_block_ref_id value =
  Js.String.substring ~start:2 ~end_:(String.length value - 2) value

let is_block_ref value = Option.is_some (get_block_ref_id value)

let is_string_block_ref value =
  String.starts_with ~prefix:left_parens value
  && String.ends_with ~suffix:right_parens value

let to_block_ref block_id = left_parens ^ block_id ^ right_parens
