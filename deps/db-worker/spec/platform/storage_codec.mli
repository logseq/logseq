(* Transit encode/decode of datascript storage payloads, byte-compatible
   with the CLJS worker (datascript.storage.impl.transit / cljs-bean
   handlers). Backs the kvs table format. *)
val encode : Datascript.storage_payload -> string
val decode : string -> Datascript.storage_payload

(* JSON int array used by the kvs `addresses` column (child node
   addresses for branch payloads). Storage addresses are numeric
   strings. *)
val encode_addresses : string list -> string
val decode_addresses : string -> string list
