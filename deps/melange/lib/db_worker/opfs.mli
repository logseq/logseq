val read_text : string -> string Js.Promise.t
val write_text : string -> string -> unit Js.Promise.t
val list_directory_names : unit -> string list Js.Promise.t
val directory_exists : string -> bool Js.Promise.t
