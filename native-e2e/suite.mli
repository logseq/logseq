type contract = Desktop | Helper
type context
type test = { name : string; covers : string list; contract : contract; run : context -> unit }
val test : ?covers:string list -> ?contract:contract -> string -> (context -> unit) -> test
val context : repo:string -> artifacts:string -> context
val with_app : ?root:string -> ?label:string -> context -> (Client.t -> 'a) -> 'a
val check : context -> string -> bool -> unit
val equal : context -> string -> 'a -> 'a -> unit
val assertions : context -> int
val inputs : context -> int
val cleanup : context -> unit
