type kind =
  | Browser_worker
  | Node
  | Native

let kind () = Native
let env = Sys.getenv_opt

(* native has no browser owner-source *)
let electron_owner () = false
