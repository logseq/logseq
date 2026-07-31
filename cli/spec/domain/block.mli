type position = First_child | Last_child | Sibling

type t = {
  id : Cli_primitive.db_id option;
  uuid : Cli_primitive.uuid option;
  title : string option;
  name : string option;
  order : int option;
  parent : Selector.block option;
  page : Selector.page option;
  tags : Selector.tag Rrbvec.t;
  properties : Property.assignment Rrbvec.t;
  children : t Rrbvec.t;
  raw : Melange_edn_melange.any;
}

type tree = { root : t }

val position_of_string : string -> position option

val make :
  ?uuid:Cli_primitive.uuid -> ?title:string -> ?children:t Rrbvec.t -> unit -> t

val of_value : Melange_edn_melange.any -> t
val to_value : t -> Melange_edn_melange.map Melange_edn_melange.t
val flatten : t Rrbvec.t -> t Rrbvec.t
val label : t -> string option
