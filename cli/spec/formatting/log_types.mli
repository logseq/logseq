type preview = { preview : string; length : int; truncated : bool }
type level = Debug | Info | Warn | Error

type record = {
  time : Time.date option;
  level : level;
  logger : string option;
  message : string;
  exception_ : string option;
}

val truncate_preview : ?max_len:int -> Melange_edn.any -> preview
val install_stderr_handler : unit -> unit
