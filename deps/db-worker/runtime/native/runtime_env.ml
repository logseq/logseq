type kind =
  | Browser_worker
  | Node
  | Native

let kind () = Native
let env = Sys.getenv_opt
