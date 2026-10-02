(* logseq.db-sync.snapshot — framed snapshot chunks: each frame is a
   4-byte big-endian uint32 length followed by that many bytes of
   transit-json payload decoding to a vector of rows.

   One persistent Buffer.t plus a consumed offset: frames are decoded
   in place and the consumed prefix is compacted only once it exceeds
   half the buffer, so a large frame split over many small chunks costs
   O(total bytes) amortized instead of re-copying the partial frame on
   every chunk. *)

exception Framed_buffer_error of string

type framed_state =
  { buf : Buffer.t
  ; mutable pos : int
  }

let framed_state () = { buf = Buffer.create 65536; pos = 0 }

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

let compact state =
  let tail =
    Buffer.sub state.buf state.pos (Buffer.length state.buf - state.pos)
  in
  Buffer.clear state.buf;
  Buffer.add_string state.buf tail;
  state.pos <- 0

(* Returns rows decoded so far; an unconsumed partial frame stays in
   the state buffer for the next chunk. *)
let parse_framed_chunk (state : framed_state) (chunk : string) : Wire.t list =
  Buffer.add_string state.buf chunk;
  let total = Buffer.length state.buf in
  let rec loop offset rows =
    if total - offset < 4 then (rows, offset)
    else
      let len = uint32_be state.buf offset in
      let next_offset = offset + 4 + len in
      if next_offset <= total then
        let payload = Buffer.sub state.buf (offset + 4) len in
        loop next_offset (List.rev_append (decode_rows payload) rows)
      else (rows, offset)
  in
  let rows_rev, pos = loop state.pos [] in
  state.pos <- pos;
  if pos > 0 && pos > total / 2 then compact state;
  List.rev rows_rev

let finalize_framed_buffer (state : framed_state) : Wire.t list =
  let rows = parse_framed_chunk state "" in
  (* cljs requires (seq rows) AND a fully-consumed buffer — an empty
     or partial result is "incomplete framed buffer" *)
  match rows <> [] && state.pos = Buffer.length state.buf with
  | true -> rows
  | _ -> raise (Dispatcher.Exn_info ("incomplete framed buffer", []))
