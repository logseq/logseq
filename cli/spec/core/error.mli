(** Shared error model. *)

type candidate = { id : Cli_primitive.db_id option; name : string option }

type t = {
  code : Cli_primitive.keyword;
  message : string;
  hint : string option;
  candidates : candidate list;
  context : Edn_ocaml.any option;
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

val make :
  ?hint:string ->
  ?candidates:candidate list ->
  ?context:Edn_ocaml.any ->
  Cli_primitive.keyword ->
  string ->
  t

val invalid_options : string -> t
val missing_graph : unit -> t
val missing_repo : string -> t
val missing_target : string -> t
val unknown_command : string -> t
val exception_error : ?context:Edn_ocaml.any -> exn -> t
val map : ('a -> 'b) -> 'a build_result -> 'b build_result
val bind : 'a build_result -> ('a -> 'b build_result) -> 'b build_result
val pp : Format.formatter -> t -> unit
