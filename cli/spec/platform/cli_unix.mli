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
val access : string -> access_permission list -> unit
val stat : string -> stats
val environment : unit -> string array
val gethostname : unit -> string
val openfile : string -> open_flag list -> int -> file_descr
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
  string -> string list -> string array -> process_result

val start_process_capture_session_line :
  string -> string list -> string array -> process_result

val kill : int -> int -> unit
val open_url : string -> bool
val write_stdout : string -> unit
