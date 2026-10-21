(* gzip compression via CompressionStream/DecompressionStream (db-sync
   snapshot upload/download). Bodies are raw byte strings. *)

val supported : unit -> bool
val gzip_encode : string -> string Db_worker_effect.t
val gzip_decode : string -> string Db_worker_effect.t
