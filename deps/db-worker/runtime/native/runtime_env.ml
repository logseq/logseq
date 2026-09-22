type kind =
  | Browser_worker
  | Node
  | Native

let kind () = Native
let env = Sys.getenv_opt

let home_dir () =
  match env "HOME" with
  | Some dir -> dir
  | None -> (Unix.getpwuid (Unix.getuid ())).Unix.pw_dir

(* The native worker is the CLI daemon's worker: default :cli, the
   electron owner passes LOGSEQ_OWNER_SOURCE=electron. *)
let owner_source () =
  match env "LOGSEQ_OWNER_SOURCE" with
  | Some s -> s
  | None -> "cli"

let electron_owner () = String.equal (owner_source ()) "electron"

let publishing () = false
