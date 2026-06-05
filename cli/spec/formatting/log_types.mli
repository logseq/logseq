type preview = { preview : string; length : int; truncated : bool }
type level = Debug | Info | Warn | Error

type record = {
  time : Ptime.t option;
  level : level;
  logger : string option;
  message : string;
  exception_ : string option;
}

val truncate_preview : ?max_len:int -> Edn_ocaml.any -> preview
val install_stderr_handler : unit -> unit
val set_verbose : bool -> unit
val log : level -> string -> Edn_ocaml.any option -> unit
