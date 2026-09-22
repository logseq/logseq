(* POSIX equivalents of the node process surface. *)

let argv () = Array.to_list Sys.argv
let pid = Unix.getpid
let exit = Stdlib.exit
let cwd = Unix.getcwd
let home_dir () = Sys.getenv "HOME"
let set_env = Unix.putenv

type pid_status =
  | Alive
  | Not_found
  | No_permission
  | Error

let kill0 pid =
  try Unix.kill pid 0; Alive
  with
  | Unix.Unix_error (Unix.ESRCH, _, _) -> Not_found
  | Unix.Unix_error (Unix.EPERM, _, _) -> No_permission
  | _ -> Error

let on_signal _name _f =
  invalid_arg "Node_process.on_signal: unsupported on native"

let sleep_sync_ms ms =
  ignore (Unix.select [] [] [] (Float.of_int ms /. 1000.))

let spawn_stdout cmd args =
  let ic = Unix.open_process_args_in cmd (Array.of_list args) in
  let out = In_channel.input_all ic in
  match Unix.close_process_in ic with
  | Unix.WEXITED status -> Some (status, out)
  | Unix.WSIGNALED _ | Unix.WSTOPPED _ -> None

let stdout_is_tty () = Unix.isatty Unix.stdout
