type category =
  | Graph_inspect_and_edit
  | Graph_management
  | Authentication
  | Utilities
  | Hidden

type option_arity = Flag | Required_value of string | Optional_value of string

type option_meta = {
  names : string Rrbvec.t;
  arity : option_arity;
  doc : string;
  required : bool;
  repeatable : bool;
  choices : string Rrbvec.t;
  default : string option;
}

type command_meta = {
  id : Command_id.t;
  path : string Rrbvec.t;
  doc : string;
  long_doc : string option;
  examples : string Rrbvec.t;
  options : option_meta Rrbvec.t;
  category : category;
  requires_graph : bool;
  requires_auth : bool;
  write_command : bool;
  (* headers order when print table in human output *)
  human_table_headers_order : string Rrbvec.t;
}

type group_meta = {
  name : string;
  doc : string;
  category : category;
  children : string Rrbvec.t Rrbvec.t;
}

type t = { commands : command_meta Rrbvec.t; groups : group_meta Rrbvec.t }

val empty : t
val make : command_meta Rrbvec.t -> t
val add : command_meta -> t -> t
val find_by_path : string Rrbvec.t -> t -> command_meta option
val global_options : option_meta Rrbvec.t
val render_help : ?group:string Rrbvec.t -> t -> string
