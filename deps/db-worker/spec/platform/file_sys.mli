val read_text : string -> string Db_worker_effect.t
val read_binary : string -> string Db_worker_effect.t
val write_text : string -> string -> unit Db_worker_effect.t
val write_binary : string -> string -> unit Db_worker_effect.t
val exists : string -> bool Db_worker_effect.t
val mkdir_p : string -> unit Db_worker_effect.t
val readdir : string -> string list Db_worker_effect.t
val remove : string -> unit Db_worker_effect.t

(* write-then-rename, matching cljs storage/write-text-atomic!. *)
val write_text_atomic : string -> string -> unit Db_worker_effect.t

type file_stat = { mtime_ms : float option; birthtime_ms : float option }

(* node fs.statSync; None when unavailable (browser) or on error. *)
val stat : string -> file_stat option Db_worker_effect.t
