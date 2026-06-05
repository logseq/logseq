type category =
  | Graph_inspect_and_edit
  | Graph_management
  | Authentication
  | Utilities
  | Hidden

type option_arity = Flag | Required_value of string | Optional_value of string

type option_meta = {
  names : string list;
  arity : option_arity;
  doc : string;
  required : bool;
  repeatable : bool;
  choices : string list;
  default : string option;
}

type command_meta = {
  id : Command_id.t;
  path : string list;
  doc : string;
  long_doc : string option;
  examples : string list;
  options : option_meta list;
  category : category;
  requires_graph : bool;
  requires_auth : bool;
  write_command : bool;
}

type group_meta = {
  name : string;
  doc : string;
  category : category;
  children : string list list;
}

type t = { commands : command_meta list; groups : group_meta list }

val empty : t
val make : command_meta list -> t
val add : command_meta -> t -> t
val merge : t list -> t
val find_by_id : Command_id.t -> t -> command_meta option
val find_by_path : string list -> t -> command_meta option
val examples_for_selector : string list -> t -> string list Error.build_result
val group_paths : t -> string list list
val top_level_paths : t -> string list list
val global_options : option_meta list
val options_for_path : string list -> t -> option_meta list Error.build_result
val render_help : ?group:string list -> t -> string
