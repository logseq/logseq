type status = Ok | Error

type ok_data =
  | Message of string
  | Items of Melange_edn.any list
  | Entity of Melange_edn.any
  | Query_result of Melange_edn.any
  | Raw of Melange_edn.any
  | Empty

type error_data = Error.t

type t = private {
  status : status;
  data : ok_data option;
  error : error_data option;
  command : Command_id.t option;
  context : Melange_edn.any option;
  output : 'o. 'o Output.Mode.t -> 'o Output.t;
  exit_code : int option;
}

val ok :
  ?command:Command_id.t ->
  ?context:Melange_edn.any ->
  'o Output.Mode.t ->
  ok_data ->
  t

val error :
  ?command:Command_id.t ->
  ?context:Melange_edn.any ->
  'o Output.Mode.t ->
  Error.t ->
  t

val is_error : t -> bool
val exit_code : t -> int
val data_value : t -> Melange_edn.any option
val with_command : Command_id.t -> t -> t
