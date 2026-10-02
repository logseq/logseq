(* logseq.db-sync.snapshot — framed snapshot chunks: each frame is a
   4-byte big-endian uint32 length followed by that many bytes of
   transit-json payload decoding to a vector of rows.

   The stream buffer is a Buffer.t, not a string: melange String.sub /
   (^) materialize the whole source per call, which made frame slicing
   quadratic on large snapshots; Buffer keeps the byte array directly
   (Buffer.sub copies only the slice). *)

exception Framed_buffer_error of string

let encode_rows (rows : Wire.t) : string =
  Transit_codec.to_string rows

let decode_rows (payload : string) : Wire.t list =
  match Transit_codec.of_string payload with
  | Wire.Array xs | Wire.List xs -> xs
  | Wire.Nil -> []
  | _ -> invalid_arg "snapshot payload is not a row vector"

let uint32_be (b : Buffer.t) (off : int) : int =
  let c i = Char.code (Buffer.nth b (off + i)) in
  (c 0 lsl 24) lor (c 1 lsl 16) lor (c 2 lsl 8) lor c 3

(* Returns (rows decoded so far, unconsumed trailing buffer). *)
let parse_framed_chunk (buffer : Buffer.t option) (chunk : string)
    : Wire.t list * Buffer.t option =
  let data =
    match buffer with
    | Some b -> b
    | None -> Buffer.create 4096
  in
  Buffer.add_string data chunk;
  let total = Buffer.length data in
  let tail_buf offset =
    let b = Buffer.create (total - offset) in
    Buffer.add_string b (Buffer.sub data offset (total - offset));
    b
  in
  let rec loop offset rows =
    if total - offset < 4 then
      (List.rev rows, if offset < total then Some (tail_buf offset) else None)
    else
      let len = uint32_be data offset in
      let next_offset = offset + 4 + len in
      if next_offset <= total then
        let payload = Buffer.sub data (offset + 4) len in
        loop next_offset (List.rev_append (decode_rows payload) rows)
      else
        (List.rev rows, Some (tail_buf offset))
  in
  loop 0 []

let finalize_framed_buffer (buffer : Buffer.t option) : Wire.t list =
  match buffer with
  | None -> []
  | Some b when Buffer.length b = 0 -> []
  | _ ->
      let rows, rest = parse_framed_chunk buffer "" in
      (* cljs requires (seq rows) AND a fully-consumed buffer — an empty
         or partial result is "incomplete framed buffer" *)
      (match rest with
       | None when rows <> [] -> rows
       | _ ->
           raise
             (Dispatcher.Exn_info
                ("incomplete framed buffer", [])))
