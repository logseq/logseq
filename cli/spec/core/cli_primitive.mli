(** Shared primitive aliases used by every layer. *)

type keyword = Melange_edn.(keyword t)
type graph = private string
type repo = private string
type db_id = int64
type uuid = string
type path = string
type url = string
type email = string
type shell = Bash | Zsh
type port = int
type pid = int
type owner_source = Cli | Electron | Unknown | Other of string

val create_graph : string -> graph

val create_repo : string -> repo
(** repo is a string with prefix "logseq_db_" *)

val string_of_graph : graph -> string
val string_of_repo : repo -> string
val trim : string -> string
val non_empty : string -> string option
val normalize_keyword : keyword -> keyword
val keyword_name : keyword -> string
val keyword_namespace : keyword -> string option
val is_uuid_string : string -> bool
val uuid_of_string : string -> uuid option
val string_of_shell : shell -> string
val shell_of_string : string -> shell option
val owner_source_of_string : string option -> owner_source
val string_of_owner_source : owner_source -> string
