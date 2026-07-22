let can_parse_url = Url_support.can_parse

let is_url value =
  try
    let origin = Url_support.make value |> Url_support.origin in
    not (String.equal origin "null")
  with _ -> false

let namespace_page value =
  String.contains value '/'
  && (not (String.equal (String.trim value) "/"))
  && (not (String.starts_with ~prefix:"../" value))
  && (not (String.starts_with ~prefix:"./" value))
  && not (is_url value)

let get_last_part value =
  if not (namespace_page value) then Some value
  else
    let rec skip_trailing_separators index =
      if index >= 0 && value.[index] = '/' then
        skip_trailing_separators (index - 1)
      else index
    in
    let stop = skip_trailing_separators (String.length value - 1) in
    if stop < 0 then None
    else
      let rec find_separator index =
        if index < 0 || value.[index] = '/' then index
        else find_separator (index - 1)
      in
      let start = find_separator stop + 1 in
      Some (String.sub value start (stop - start + 1))
