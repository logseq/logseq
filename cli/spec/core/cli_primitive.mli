(** Shared primitive aliases used by every layer. *)

type keyword = Melange_edn_melange.(keyword t)
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

type ds_where_clause =
  | V of Melange_edn_melange.vector Melange_edn_melange.t
  | L of Melange_edn_melange.list_ Melange_edn_melange.t

type datascript_query = private {
  find : Melange_edn_melange.any list;
  in_ : Melange_edn_melange.symbol Melange_edn_melange.t list option;
  where : ds_where_clause list;
}

val create_graph : string -> graph

val create_repo : string -> repo
(** repo is a string with prefix "logseq_db_" *)

val string_of_graph : graph -> string
val string_of_repo : repo -> string
val non_empty : string -> string option
val is_uuid_string : string -> bool
val shell_of_string : string -> shell option
val string_of_owner_source : owner_source -> string

val make_datascript_query :
  find:Melange_edn_melange.any list ->
  ?in_:Melange_edn_melange.symbol Melange_edn_melange.t list ->
  where:ds_where_clause list ->
  unit ->
  datascript_query

val datascript_query_to_edn :
  datascript_query -> Melange_edn_melange.vector Melange_edn_melange.t
