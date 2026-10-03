type t = unit

type event =
  | Open
  | Message of string
  | Binary of string
  | Close of int * string
  | Error of string

let connect ~url:_ ~on_event:_ =
  Db_worker_effect.error (Failure "Web_socket: not implemented on native yet")

let send _ _ = Db_worker_effect.error (Failure "Web_socket: not implemented on native yet")
let send_binary _ _ = Db_worker_effect.error (Failure "Web_socket: not implemented on native yet")
let close _ = Db_worker_effect.error (Failure "Web_socket: not implemented on native yet")

let ready_state _ = invalid_arg "Web_socket: not implemented on native yet"
