(* logseq.db-sync.snapshot — framed snapshot chunks: each frame is a
   4-byte big-endian uint32 length followed by that many bytes of
   transit-json payload decoding to a vector of rows. *)

exception Framed_buffer_error of string

let encode_rows (rows : Wire.t) : string =
  Transit_codec.to_string rows

let decode_rows (payload : string) : Wire.t list =
  match Transit_codec.of_string payload with
  | Wire.Array xs | Wire.List xs -> xs
  | Wire.Nil -> []
  | _ -> invalid_arg "snapshot payload is not a row vector"

let concat_bytes (a : string option) (b : string) : string =
  match a with
  | None -> b
  | Some a -> a ^ b

let uint32_be (s : string) (off : int) : int =
  let b i = Char.code s.[off + i] in
  (b 0 lsl 24) lor (b 1 lsl 16) lor (b 2 lsl 8) lor b 3

(* Returns (rows decoded so far, unconsumed trailing buffer). *)
let parse_framed_chunk (buffer : string option) (chunk : string)
    : Wire.t list * string option =
  let data = concat_bytes buffer chunk in
  let total = String.length data in
  let rec loop offset rows =
    if total - offset < 4 then
      ( rows
      , if offset < total then
          Some (String.sub data offset (total - offset))
        else None )
    else
      let len = uint32_be data offset in
      let next_offset = offset + 4 + len in
      if next_offset <= total then
        let payload = String.sub data (offset + 4) len in
        loop next_offset (rows @ decode_rows payload)
      else
        (rows, Some (String.sub data offset (total - offset)))
  in
  loop 0 []

let finalize_framed_buffer (buffer : string option) : Wire.t list =
  match buffer with
  | None -> []
  | Some b when String.length b = 0 -> []
  | _ ->
      let rows, rest = parse_framed_chunk buffer "" in
      (match rest with
       | None -> rows
       | Some _ ->
           raise
             (Dispatcher.Exn_info
                ("incomplete framed buffer", [])))
