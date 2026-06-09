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
  raw : Melange_edn.any;
}

type tree = { root : t }

val position_of_string : string -> position option

val make :
  ?uuid:Cli_primitive.uuid -> ?title:string -> ?children:t list -> unit -> t

val of_value : Melange_edn.any -> t
val to_value : t -> Melange_edn.map Melange_edn.t
val flatten : t list -> t list
val label : t -> string option
