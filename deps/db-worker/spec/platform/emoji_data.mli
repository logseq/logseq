(* Access to @emoji-mart/data — used by the file-graph importer to convert
   `:icon` property values into db icons.
   Returns (native_emoji, skin option); skin is the 1-based cljs `(inc
   skin-index)` value. *)
val all_emoji_icons : unit -> (string * int option) list
