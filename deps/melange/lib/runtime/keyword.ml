type t = string

let invalid_char = function
  | ' ' | '\t' | '\r' | '\n' | ',' | '(' | ')' | '[' | ']' | '{' | '}' | '"' ->
      true
  | ch -> Char.code ch < 0x20

let contains_invalid_char value =
  let rec loop index =
    index < String.length value
    && (invalid_char value.[index] || loop (index + 1))
  in
  loop 0

let of_string value =
  let length = String.length value in
  if length = 0 then Error "keyword name must not be empty"
  else if value.[0] = ':' then Error "keyword name must not start with ':'"
  else if value.[0] = '/' then Error "keyword name must not start with '/'"
  else if value.[length - 1] = '/' then
    Error "keyword name must not end with '/'"
  else if contains_invalid_char value then
    Error "keyword name contains an invalid delimiter"
  else Ok value

let to_string value = value

let namespace value =
  match String.rindex_opt value '/' with
  | Some index -> Some (String.sub value 0 index)
  | None -> None

let name value =
  match String.rindex_opt value '/' with
  | Some index -> String.sub value (index + 1) (String.length value - index - 1)
  | None -> value

let equal = String.equal
