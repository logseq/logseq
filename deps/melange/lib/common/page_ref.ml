let left_brackets = "[["
let right_brackets = "]]"
let left_and_right_brackets = left_brackets ^ right_brackets
let page_ref_pattern = "\\[\\[(.*?)\\]\\]"
let page_ref_without_nested_pattern = "\\[\\[([^\\[\\]]+)\\]\\]"
let page_ref_any_pattern = "\\[\\[(.*)\\]\\]"
let markdown_page_ref_pattern = "\\[(.*)\\]\\(file:.*\\)"

let markdown_page_ref_full_re =
  Js.Re.fromString ("^" ^ markdown_page_ref_pattern ^ "$")

let capture_at index result =
  result |> Js.Re.captures |> fun captures ->
  captures.(index) |> Js.Nullable.toOption

let get_file_basename path =
  if String.equal (Js.String.trim path) "" then None
  else
    let normalized =
      String.map
        (fun character -> if character = '+' then '/' else character)
        path
    in
    let rec skip_trailing_slashes index =
      if index >= 0 && normalized.[index] = '/' then
        skip_trailing_slashes (index - 1)
      else index
    in
    let stop = skip_trailing_slashes (String.length normalized - 1) in
    if stop < 0 then Some ""
    else
      let rec find_separator index =
        if index < 0 || normalized.[index] = '/' then index
        else find_separator (index - 1)
      in
      let start = find_separator stop + 1 in
      Some (String.sub normalized start (stop - start + 1))

let is_page_ref value =
  String.starts_with ~prefix:left_brackets value
  && String.ends_with ~suffix:right_brackets value

let to_page_ref page_name = left_brackets ^ page_name ^ right_brackets

let get_page_name value =
  match Js.Re.exec ~str:value markdown_page_ref_full_re with
  | Some result -> capture_at 1 result |> Option.map Js.String.trim
  | None ->
      if is_page_ref value then
        Some
          (Js.String.substring ~start:2 ~end_:(String.length value - 2) value)
      else None

let get_page_name_or_self value =
  match get_page_name value with Some page_name -> page_name | None -> value

let matched_names value =
  if String.starts_with ~prefix:"{{" value then Rrbvec.empty
  else
    let regexp = Js.Re.fromStringWithFlags page_ref_pattern ~flags:"g" in
    let rec collect result =
      match Js.Re.exec ~str:value regexp with
      | None -> result
      | Some match_ -> (
          match capture_at 1 match_ with
          | None -> collect result
          | Some name -> collect (Rrbvec.push_back result name))
    in
    collect Rrbvec.empty
