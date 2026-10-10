(* Shared string <-> Uint8Array conversion (latin1-style: one OCaml char per
   byte). Callers that only need conversion should use these helpers instead
   of re-declaring per-file externals. *)

module U8 = Js.Typed_array.Uint8Array

external new_u8a : int -> U8.t = "Uint8Array" [@@mel.new]
external u8a_get : U8.t -> int -> int = "" [@@mel.get_index]
external u8a_set : U8.t -> int -> int -> unit = "" [@@mel.set_index]
external u8a_length : U8.t -> int = "length" [@@mel.get]
external of_buffer : Js.Typed_array.ArrayBuffer.t -> U8.t = "Uint8Array"
  [@@mel.new]
external buffer : U8.t -> Js.Typed_array.ArrayBuffer.t = "buffer" [@@mel.get]

let to_string a = String.init (u8a_length a) (fun i -> Char.chr (u8a_get a i))

let of_string s =
  let a = new_u8a (String.length s) in
  String.iteri (fun i c -> u8a_set a i (Char.code c)) s;
  a
