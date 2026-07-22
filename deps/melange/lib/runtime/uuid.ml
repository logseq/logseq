type t = string

let is_hex = function
  | '0' .. '9' | 'a' .. 'f' | 'A' .. 'F' -> true
  | _ -> false

let is_hyphen_index = function 8 | 13 | 18 | 23 -> true | _ -> false

let valid value =
  String.length value = 36
  &&
  let rec loop index =
    index = 36
    ||
    let ch = value.[index] in
    if is_hyphen_index index then ch = '-' && loop (index + 1)
    else is_hex ch && loop (index + 1)
  in
  loop 0

let of_string value =
  if valid value then Ok (String.lowercase_ascii value)
  else Error "UUID must use the canonical 8-4-4-4-12 hexadecimal form"

let to_string value = value
let equal = String.equal
