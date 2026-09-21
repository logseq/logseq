type error = EAGAIN | EWOULDBLOCK | ETIMEDOUT | ESRCH | EPERM
type access_permission = R_OK | W_OK
type open_flag = O_RDWR
type file_descr = int
type stats = { st_size : int; st_mtime : float }
type process_result = { status : int; stdout : string; stderr : string }
type mkdir_result = Created | Already_exists

exception Cli_unix_error of error * string * string

val mkdir : string -> int -> unit
val rmdir : string -> unit
val mkdir_exclusive : string -> int -> mkdir_result
val file_exists : string -> bool
val is_directory : string -> bool
val readdir : string -> string array
val mkdir_p : string -> unit
val write_text_file : string -> string -> unit
val read_text_file : string -> string
val read_stdin_all : unit -> string
val write_binary_file : string -> string -> unit
val read_binary_file : string -> string
val copy_file : string -> string -> unit
val remove_tree : string -> unit
val rename : string -> string -> unit
val getpid : unit -> int
val process_running : int -> bool
val chmod : string -> int -> unit
val access : string -> access_permission Rrbvec.t -> unit
val stat : string -> stats
val environment : unit -> string array
val gethostname : unit -> string
val openfile : string -> open_flag Rrbvec.t -> int -> file_descr
val close : file_descr -> unit

val create_process_env :
  string ->
  string array ->
  string array ->
  file_descr ->
  file_descr ->
  file_descr ->
  int

val run_process_capture :
  string -> string Rrbvec.t -> string array -> process_result

val start_process_capture_session_line :
  string -> string Rrbvec.t -> string array -> process_result

val kill : int -> int -> unit
val open_url : string -> bool
val write_stdout : string -> unit

type lifecycle_error = { code : string; message : string }

val start_graph_runtime :
  root_dir:string ->
  repo:string ->
  script:string ->
  owner_source:string ->
  create_empty_db:bool ->
  generation:string option ->
  (string, lifecycle_error) result Cli_effect.t

val stop_graph_runtime :
  root_dir:string ->
  repo:string ->
  owner_source:string ->
  (unit, lifecycle_error) result Cli_effect.t

val delete_graph :
  root_dir:string ->
  repo:string ->
  on_removed:(unit -> (unit, lifecycle_error) result Cli_effect.t) ->
  (bool, lifecycle_error) result Cli_effect.t

val create_graph :
  root_dir:string ->
  repo:string ->
  (string, lifecycle_error) result Cli_effect.t
