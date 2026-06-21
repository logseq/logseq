type t = string
type uint8_array
type text_decoder

external char_code_at : string -> int -> int = "charCodeAt" [@@mel.send]
external uint8_array_from : string -> (string -> int) -> uint8_array = "from"
[@@mel.scope "Uint8Array"]

external make_text_decoder : string -> < fatal : bool > Js.t -> text_decoder
  = "TextDecoder"
[@@mel.new]

external decode : text_decoder -> uint8_array -> string = "decode" [@@mel.send]

type string_kind = Ascii | Utf8_bytes | Unicode

let decoder = make_text_decoder "utf-8" [%obj { fatal = true }]

let string_kind value =
  let length = String.length value in
  let rec loop index =
    if index >= length then Ascii
    else
      let code = char_code_at value index in
      if code > 0xff then Unicode
      else if code > 0x7f then Utf8_bytes
      else loop (index + 1)
  in
  loop 0

let of_string value =
  match string_kind value with
  | Ascii | Unicode -> value
  | Utf8_bytes ->
      let payload = uint8_array_from value (fun ch -> char_code_at ch 0) in
      (try decode decoder payload with _ -> value)

let to_string value = value
