type position = First_child | Last_child | Sibling

type t = {
  id : Cli_primitive.db_id option;
  uuid : Cli_primitive.uuid option;
  title : string option;
  name : string option;
  order : int option;
  parent : Selector.block option;
  page : Selector.page option;
  tags : Selector.tag list;
  properties : Property.assignment list;
  children : t list;
  raw : Edn_ocaml.any;
}

type tree = { root : t }

val position_of_string : string -> position option
val string_of_position : position -> string

val make :
  ?uuid:Cli_primitive.uuid -> ?title:string -> ?children:t list -> unit -> t

val of_value : Edn_ocaml.any -> t
val to_value : t -> Edn_ocaml.map Edn_ocaml.t
val flatten : t list -> t list
val collect_uuids : t list -> Cli_primitive.uuid list
val label : t -> string option
