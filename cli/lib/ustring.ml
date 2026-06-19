type t = string
type uint8_array
type text_decoder

external char_code_at : string -> int -> int = "charCodeAt" [@@mel.send]
external make_uint8_array : int -> uint8_array = "Uint8Array" [@@mel.new]
external make_text_decoder : string -> text_decoder = "TextDecoder" [@@mel.new]
external decode : text_decoder -> uint8_array -> string = "decode" [@@mel.send]
external set_uint8 : uint8_array -> int -> int -> unit = "" [@@mel.set_index]

type string_kind = Ascii | Utf8_bytes | Unicode

let decoder = make_text_decoder "utf-8"

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
      let length = String.length value in
      let payload = make_uint8_array length in
      for index = 0 to length - 1 do
        set_uint8 payload index (char_code_at value index)
      done;
      decode decoder payload

let to_string value = value
