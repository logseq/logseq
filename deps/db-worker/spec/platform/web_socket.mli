type t

type event =
  | Open
  | Message of string
  | Binary of string
  | Close of int * string
  | Error of string

val connect : url:string -> on_event:(event -> unit) -> t Db_worker_effect.t
val send : t -> string -> unit Db_worker_effect.t
val send_binary : t -> string -> unit Db_worker_effect.t
val close : t -> unit Db_worker_effect.t

(* underlying readyState: 0 connecting, 1 open, 2 closing, 3 closed *)
val ready_state : t -> int
