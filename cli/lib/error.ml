type candidate = { id : Cli_primitive.db_id option; name : string option }

type t = {
  code : Cli_primitive.keyword;
  message : string;
  hint : string option;
  candidates : candidate list;
  context : Melange_edn.any option;
}

type 'a build_result = ('a, t) result

type source =
  | Cli_parse
  | Config
  | Build_action
  | Transport
  | Server
  | Auth
  | Sync
  | Db_worker
  | Filesystem
  | Unknown

let make ?hint ?(candidates = []) ?context code message =
  { code; message; hint; candidates; context }

let code value = Edn_util.keyword_t value
let invalid_options message = make (code "invalid-options") message

let missing_graph () =
  make ~hint:"Use --graph <name>" (code "missing-graph")
    "graph name is required"

let missing_repo message = make (code "missing-repo") message
let missing_target message = make (code "missing-target") message
let unknown_command message = make (code "unknown-command") message

let exception_error ?context exn =
  make ?context (code "exception") (Printexc.to_string exn)

let map f = function Ok x -> Ok (f x) | Error e -> Error e
let bind x f = match x with Ok v -> f v | Error e -> Error e
