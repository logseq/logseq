type status = Ok | Error

type ok_data =
  | Message of string
  | Items of Edn_ocaml.any list
  | Entity of Edn_ocaml.any
  | Query_result of Edn_ocaml.any
  | Raw of Edn_ocaml.any
  | Empty

type error_data = Error.t

type 'o t = private {
  status : status;
  data : ok_data option;
  error : error_data option;
  command : Command_id.t option;
  context : Edn_ocaml.any option;
  output : 'o Output.t;
  exit_code : int option;
}

val ok :
  ?command:Command_id.t ->
  ?context:Edn_ocaml.any ->
  'o Output.Mode.t ->
  ok_data ->
  'o t

val error :
  ?command:Command_id.t ->
  ?context:Edn_ocaml.any ->
  'o Output.Mode.t ->
  Error.t ->
  'o t

val is_ok : 'a t -> bool
val is_error : 'a t -> bool
val exit_code : 'a t -> int
val data_value : 'a t -> Edn_ocaml.any option
val with_command : Command_id.t -> 'a t -> 'a t
val with_context : Edn_ocaml.any -> 'a t -> 'a t
