val goto_page : Env.t -> string -> unit Js.Promise.t
val get_page_name : Env.t -> string Js.Promise.t
val new_page : Env.t -> string -> 'a Js.Promise.t
val delete_page : Env.t -> string -> unit Js.Promise.t
val rename_page : Env.t -> string -> string -> unit Js.Promise.t
val set_tag_extends :
  Env.t -> ?retry_count:int -> string list -> unit Js.Promise.t
val convert_to_tag :
  ?extends:string list -> Env.t -> string -> unit Js.Promise.t
