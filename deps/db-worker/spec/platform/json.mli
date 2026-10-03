(* JSON parse/stringify for auth files, JWT payloads, and db-sync
   request bodies. Objects become [Wire.Map] with [Wire.String] keys
   (keywordizing happens at the call site); arrays become [Wire.Array].

   [stringify] maps [Wire.Keyword] values to their bare name (cljs
   clj->js behavior) and keyword map keys to name-only object keys
   (namespace dropped). Binary/Set values are unsupported and raise. *)

val parse : string -> Wire.t
val stringify : Wire.t -> string
