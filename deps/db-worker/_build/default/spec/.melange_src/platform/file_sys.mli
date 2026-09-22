# 1 "spec/platform/file_sys.mli"
val read_text : string -> string Db_worker_effect.t
val read_binary : string -> string Db_worker_effect.t
val write_text : string -> string -> unit Db_worker_effect.t
val write_binary : string -> string -> unit Db_worker_effect.t
val exists : string -> bool Db_worker_effect.t
val mkdir_p : string -> unit Db_worker_effect.t
val readdir : string -> string list Db_worker_effect.t
val remove : string -> unit Db_worker_effect.t
