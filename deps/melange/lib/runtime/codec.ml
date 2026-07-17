type transit_mode = Normal | Verbose

module Edn = Melange_edn_melange
module Transit = Transit_melange.Transit.Json
module Vector = Persistent_vector

let ( let* ) result next =
  match result with Ok value -> next value | Error _ as error -> error

let map_array mapper values =
  Array.fold_left
    (fun result value ->
      let* mapped = result in
      let* value = mapper value in
      Ok (Vector.push_back mapped value))
    (Ok Vector.empty) values

let map_pair_array mapper entries =
  Array.fold_left
    (fun result (key, value) ->
      let* mapped = result in
      let* key = mapper key in
      let* value = mapper value in
      Ok (Vector.push_back mapped (key, value)))
    (Ok Vector.empty) entries

let map_list mapper values = map_array mapper (Array.of_list values)
let map_pair_list mapper values = map_pair_array mapper (Array.of_list values)
let is_digit = function '0' .. '9' -> true | _ -> false

let strict_int64_text value =
  let length = String.length value in
  let start, limit =
    if length > 0 && value.[0] = '-' then (1, "9223372036854775808")
    else if length > 0 && value.[0] = '+' then (1, "9223372036854775807")
    else (0, "9223372036854775807")
  in
  let rec all_digits index =
    index = length || (is_digit value.[index] && all_digits (index + 1))
  in
  if start = length || not (all_digits start) then false
  else
    let rec skip_zeroes index =
      if index < length && value.[index] = '0' then skip_zeroes (index + 1)
      else index
    in
    let significant_start = skip_zeroes start in
    let significant_length = length - significant_start in
    significant_length < String.length limit
    || significant_length = String.length limit
       && String.compare
            (String.sub value significant_start significant_length)
            limit
          <= 0

let edn_delimiter = function
  | ' ' | '\t' | '\r' | '\n' | ',' | '(' | ')' | '[' | ']' | '{' | '}' | ';' ->
      true
  | _ -> false

let decimal_integer_token token =
  let length = String.length token in
  let start =
    if length > 0 && (token.[0] = '-' || token.[0] = '+') then 1 else 0
  in
  start < length
  &&
  let rec loop index =
    index = length || (is_digit token.[index] && loop (index + 1))
  in
  loop start

let validate_edn_ints text =
  let length = String.length text in
  let rec skip_string index escaped =
    if index >= length then length
    else
      let ch = text.[index] in
      if escaped then skip_string (index + 1) false
      else if ch = '\\' then skip_string (index + 1) true
      else if ch = '"' then index + 1
      else skip_string (index + 1) false
  in
  let rec skip_comment index =
    if index >= length || text.[index] = '\n' then index
    else skip_comment (index + 1)
  in
  let rec token_stop index =
    if index >= length || edn_delimiter text.[index] then index
    else token_stop (index + 1)
  in
  let rec loop index =
    if index >= length then Ok ()
    else
      match text.[index] with
      | '"' -> loop (skip_string (index + 1) false)
      | ';' -> loop (skip_comment (index + 1))
      | ch when edn_delimiter ch -> loop (index + 1)
      | _ ->
          let stop = token_stop index in
          let token = String.sub text index (stop - index) in
          if decimal_integer_token token && not (strict_int64_text token) then
            Error ("EDN decode error: integer is outside int64: " ^ token)
          else loop stop
  in
  loop 0

let rec value_of_edn (Edn.Any value) =
  match value with
  | Edn.Nil -> Ok Value.Nil
  | Edn.Bool value -> Ok (Value.Bool value)
  | Edn.String value -> Ok (Value.String value)
  | Edn.Char value -> Ok (Value.Char value)
  | Edn.Symbol value -> Ok (Value.Symbol value)
  | Edn.Keyword value ->
      let* keyword = Keyword.of_string (Edn.keyword_to_string value) in
      Ok (Value.Keyword keyword)
  | Edn.Int value -> Ok (Value.Int value)
  | Edn.Bigint value -> Ok (Value.Big_int value)
  | Edn.Float value -> Ok (Value.Float value)
  | Edn.Decimal value -> Ok (Value.Decimal value)
  | Edn.Ratio value -> Ok (Value.Ratio value)
  | Edn.Regex value -> Ok (Value.Regex value)
  | Edn.List values ->
      let* values = map_array value_of_edn values in
      Ok (Value.List values)
  | Edn.Vector values ->
      let* values = map_array value_of_edn values in
      Ok (Value.Vector values)
  | Edn.Map entries ->
      let* entries = map_pair_array value_of_edn entries in
      Ok (Value.Map entries)
  | Edn.Set values ->
      let* values = map_array value_of_edn values in
      Ok (Value.Set values)
  | Edn.Tagged ("uuid", Edn.Any (Edn.String text)) ->
      let* uuid = Uuid.of_string text in
      Ok (Value.Uuid uuid)
  | Edn.Tagged ("uuid", _) -> Error "EDN UUID tag expects a string"
  | Edn.Tagged ("transit/bytes", Edn.Any (Edn.String value)) ->
      Ok (Value.Binary value)
  | Edn.Tagged (tag, value) ->
      let* value = value_of_edn value in
      Ok (Value.Tagged (tag, value))

let rec edn_values values =
  let* values = map_array edn_of_value (Vector.to_array values) in
  Ok (Array.to_list (Vector.to_array values))

and edn_entries entries =
  let* entries =
    Array.fold_left
      (fun result (key, value) ->
        let* mapped = result in
        let* key = edn_of_value key in
        let* value = edn_of_value value in
        Ok (Vector.push_back mapped (key, value)))
      (Ok Vector.empty) (Vector.to_array entries)
  in
  Ok (Array.to_list (Vector.to_array entries))

and edn_of_value = function
  | Value.Nil -> Ok (Edn.any Edn.nil)
  | Bool value -> Ok (Edn.any (Edn.bool value))
  | String value -> Ok (Edn.any (Edn.string value))
  | Char value -> Ok (Edn.any (Edn.char value))
  | Symbol value -> Ok (Edn.any (Edn.symbol value))
  | Keyword value -> Ok (Edn.any (Edn.keyword (Keyword.to_string value)))
  | Int value -> Ok (Edn.any (Edn.int value))
  | Big_int value -> Ok (Edn.any (Edn.bigint value))
  | Float value -> Ok (Edn.any (Edn.float value))
  | Decimal value -> Ok (Edn.any (Edn.decimal value))
  | Ratio value -> Ok (Edn.any (Edn.ratio value))
  | Regex value -> Ok (Edn.any (Edn.regex value))
  | Binary value ->
      Ok (Edn.any (Edn.tagged "transit/bytes" (Edn.any (Edn.string value))))
  | Date _ -> Error "EDN codec does not define a timestamp representation"
  | Uuid value ->
      Ok
        (Edn.any
           (Edn.tagged "uuid" (Edn.any (Edn.string (Uuid.to_string value)))))
  | Uri _ -> Error "EDN codec does not define a URI representation"
  | List values ->
      let* values = edn_values values in
      Ok (Edn.any (Edn.list values))
  | Vector values ->
      let* values = edn_values values in
      Ok (Edn.any (Edn.vector values))
  | Map entries ->
      let* entries = edn_entries entries in
      Ok (Edn.any (Edn.map entries))
  | Set values ->
      let* values = edn_values values in
      Ok (Edn.any (Edn.set values))
  | Tagged (tag, value) ->
      if String.length tag = 0 then Error "EDN tag must not be empty"
      else
        let* value = edn_of_value value in
        Ok (Edn.any (Edn.tagged tag value))

let edn_of_string text =
  let* () = validate_edn_ints text in
  try
    match Array.of_list (Edn.of_edn_string_all text) with
    | [| value |] -> value_of_edn value
    | [||] -> Error "EDN decode error: expected one value"
    | _ -> Error "EDN decode error: expected exactly one value"
  with Edn.Parse_error message -> Error ("EDN decode error: " ^ message)

let edn_to_string value =
  try
    let* value = edn_of_value value in
    Ok (Edn.to_edn_string value)
  with Edn.Parse_error message -> Error ("EDN encode error: " ^ message)

let rec value_of_transit = function
  | Transit.Null -> Ok Value.Nil
  | Bool value -> Ok (Value.Bool value)
  | String value -> Ok (Value.String value)
  | Int value -> Ok (Value.Int (Int64.of_int value))
  | Int64 value -> Ok (Value.Int value)
  | Float value -> Ok (Value.Float value)
  | Binary value -> Ok (Value.Binary value)
  | Keyword value ->
      let* keyword = Keyword.of_string value in
      Ok (Value.Keyword keyword)
  | Symbol value -> Ok (Value.Symbol value)
  | Big_decimal value -> Ok (Value.Decimal value)
  | Big_int value -> Ok (Value.Big_int value)
  | Date value -> Ok (Value.Date value)
  | Uuid value ->
      let* uuid = Uuid.of_string value in
      Ok (Value.Uuid uuid)
  | Uri value -> Ok (Value.Uri value)
  | Array values ->
      let* values = map_list value_of_transit values in
      Ok (Value.Vector values)
  | Map entries ->
      let* entries = map_pair_list value_of_transit entries in
      Ok (Value.Map entries)
  | Set values ->
      let* values = map_list value_of_transit values in
      Ok (Value.Set values)
  | List values ->
      let* values = map_list value_of_transit values in
      Ok (Value.List values)
  | Tagged (tag, value) ->
      let* value = value_of_transit value in
      Ok (Value.Tagged (tag, value))

let rec transit_values values =
  let* values = map_array transit_of_value (Vector.to_array values) in
  Ok (Array.to_list (Vector.to_array values))

and transit_entries entries =
  let* entries =
    Array.fold_left
      (fun result (key, value) ->
        let* mapped = result in
        let* key = transit_of_value key in
        let* value = transit_of_value value in
        Ok (Vector.push_back mapped (key, value)))
      (Ok Vector.empty) (Vector.to_array entries)
  in
  Ok (Array.to_list (Vector.to_array entries))

and transit_of_value = function
  | Value.Nil -> Ok Transit.Null
  | Bool value -> Ok (Transit.Bool value)
  | String value -> Ok (Transit.String value)
  | Char _ -> Error "Transit codec does not support EDN characters"
  | Symbol value -> Ok (Transit.Symbol value)
  | Keyword value -> Ok (Transit.Keyword (Keyword.to_string value))
  | Int value -> Ok (Transit.Int64 value)
  | Big_int value -> Ok (Transit.Big_int value)
  | Float value -> Ok (Transit.Float value)
  | Decimal value -> Ok (Transit.Big_decimal value)
  | Ratio _ -> Error "Transit codec does not support EDN ratios"
  | Regex _ -> Error "Transit codec does not support EDN regex values"
  | Binary value -> Ok (Transit.Binary value)
  | Date value -> Ok (Transit.Date value)
  | Uuid value -> Ok (Transit.Uuid (Uuid.to_string value))
  | Uri value -> Ok (Transit.Uri value)
  | List values ->
      let* values = transit_values values in
      Ok (Transit.List values)
  | Vector values ->
      let* values = transit_values values in
      Ok (Transit.Array values)
  | Map entries ->
      let* entries = transit_entries entries in
      Ok (Transit.Map entries)
  | Set values ->
      let* values = transit_values values in
      Ok (Transit.Set values)
  | Tagged (tag, value) ->
      if String.length tag = 0 then Error "Transit tag must not be empty"
      else
        let* value = transit_of_value value in
        Ok (Transit.Tagged (tag, value))

let validate_transit_ints text =
  let length = String.length text in
  let rec find_closing_quote index =
    if index >= length then None
    else if text.[index] = '"' then Some index
    else find_closing_quote (index + 1)
  in
  let rec loop index =
    if index + 3 >= length then Ok ()
    else if
      text.[index] = '"' && text.[index + 1] = '~' && text.[index + 2] = 'i'
    then
      match find_closing_quote (index + 3) with
      | None -> Error "Transit decode error: unterminated integer token"
      | Some stop ->
          let token = String.sub text (index + 3) (stop - index - 3) in
          if String.length token = 0 then
            Error "Transit decode error: empty integer token"
          else if strict_int64_text token then loop (stop + 1)
          else Error ("Transit decode error: integer is outside int64: " ^ token)
    else loop (index + 1)
  in
  loop 0

let transit_of_string text =
  let* () = validate_transit_ints text in
  try value_of_transit (Transit.of_string text)
  with Transit.Decode_error message ->
    Error ("Transit decode error: " ^ message)

let transit_to_string ?(mode = Normal) value =
  let* value = transit_of_value value in
  let mode =
    match mode with Normal -> Transit.Normal | Verbose -> Transit.Verbose
  in
  Ok (Transit.to_string ~mode value)
