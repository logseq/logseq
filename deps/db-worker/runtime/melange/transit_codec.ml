module T = Transit_melange.Transit_core.Json

type uint8_array
type text_decoder

external char_code_at : string -> int -> int = "charCodeAt" [@@mel.send]

external uint8_array_from : string -> (string -> int) -> uint8_array
  = "from" [@@mel.scope "Uint8Array"]

external make_text_decoder : string -> < fatal : bool > Js.t -> text_decoder
  = "TextDecoder" [@@mel.new]

external decode : text_decoder -> uint8_array -> string = "decode" [@@mel.send]

let utf8_decoder = make_text_decoder "utf-8" [%mel.obj { fatal = true }]

(* Binary transit bodies (snapshot frames, remoteInvokeBinary payloads)
   arrive as byte strings: UTF-8 bytes packed one-per-char. Decode them
   to unicode before parsing; strings that are already unicode or ascii
   pass through. *)
let string_of_utf8_bytes (s : string) : string =
  let len = String.length s in
  let rec loop i =
    if i >= len then `Ascii
    else
      let code = char_code_at s i in
      if code > 0xFF then `Unicode else if code > 0x7F then `Bytes else loop (i + 1)
  in
  match loop 0 with
  | `Ascii | `Unicode -> s
  | `Bytes ->
      (try decode utf8_decoder (uint8_array_from s (fun ch -> char_code_at ch 0))
       with _ -> s)

let rec of_transit (v : T.value) : Wire.t =
  match v with
  | T.Null -> Wire.Nil
  | T.Bool b -> Wire.Bool b
  | T.String s -> Wire.String s
  | T.Int n -> Wire.Int n
  | T.Int64 n -> Wire.Int64 n
  | T.Float f -> Wire.Float f
  | T.Binary s -> Wire.Binary s
  | T.Keyword s -> Wire.Keyword s
  | T.Symbol s -> Wire.Symbol s
  | T.Big_decimal s -> Wire.Big_decimal s
  | T.Big_int s -> Wire.Big_int s
  | T.Date ms -> Wire.Date_ms ms
  | T.Uuid s -> Wire.Uuid s
  | T.Uri s -> Wire.Uri s
  | T.Array xs -> Wire.Array (List.map of_transit xs)
  | T.List xs -> Wire.List (List.map of_transit xs)
  | T.Map kvs -> Wire.Map (List.map (fun (k, v) -> (of_transit k, of_transit v)) kvs)
  | T.Set xs -> Wire.Set (List.map of_transit xs)
  | T.Tagged (tag, rep) -> Wire.Tagged (tag, of_transit rep)

let rec to_transit (t : Wire.t) : T.value =
  match t with
  | Wire.Nil -> T.Null
  | Wire.Bool b -> T.Bool b
  | Wire.String s -> T.String s
  | Wire.Int n -> T.Int n
  | Wire.Int64 n -> T.Int64 n
  | Wire.Float f -> T.Float f
  | Wire.Binary s -> T.Binary s
  | Wire.Keyword s -> T.Keyword s
  | Wire.Symbol s -> T.Symbol s
  | Wire.Big_decimal s -> T.Big_decimal s
  | Wire.Big_int s -> T.Big_int s
  | Wire.Date_ms ms -> T.Date ms
  | Wire.Uuid s -> T.Uuid s
  | Wire.Uri s -> T.Uri s
  | Wire.Array xs -> T.Array (List.map to_transit xs)
  | Wire.List xs -> T.List (List.map to_transit xs)
  | Wire.Map kvs -> T.Map (List.map (fun (k, v) -> (to_transit k, to_transit v)) kvs)
  | Wire.Set xs -> T.Set (List.map to_transit xs)
  | Wire.Tagged (tag, rep) -> T.Tagged (tag, to_transit rep)

let of_string s =
  of_transit (Transit_melange.Transit.Json.of_string (string_of_utf8_bytes s))

let to_string ?(mode = Wire.Normal) t =
  let mode = match mode with Wire.Normal -> T.Normal | Wire.Verbose -> T.Verbose in
  Transit_melange.Transit.Json.to_string ~mode (to_transit t)
