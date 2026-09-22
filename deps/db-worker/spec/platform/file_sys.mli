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

(* appendFileSync utf8. *)
val append_text : string -> string -> unit Db_worker_effect.t

(* openSync 'wx' + write + close — fails EEXIST when the file exists. *)
val write_file_exclusive : string -> string -> unit Db_worker_effect.t

(* renameSync. *)
val rename : string -> string -> unit Db_worker_effect.t

(* statSync().isDirectory(); errors on missing paths like node. *)
val is_directory : string -> bool Db_worker_effect.t

(* statSync().isFile(); errors on missing paths like node. *)
val is_file : string -> bool Db_worker_effect.t

(* copyFileSync — copies a single file; parent dir must exist. *)
val copy_file : string -> string -> unit Db_worker_effect.t

(* symlinkSync — creates [link] pointing to [target]. *)
val symlink : target:string -> link:string -> unit Db_worker_effect.t

(* accessSync R_OK|W_OK. *)
val check_read_write : string -> unit Db_worker_effect.t

(* realpathSync — canonical path with symlinks resolved. *)
val realpath : string -> string Db_worker_effect.t
