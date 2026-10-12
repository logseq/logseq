type contract = Desktop | Api | Helper
type context
type test = { name : string; covers : string list; additional : bool; contract : contract; run : context -> unit }
val test : ?covers:string list -> ?additional:bool -> ?contract:contract -> string -> (context -> unit) -> test
val context : repo:string -> artifacts:string -> context
val with_app : ?root:string -> ?label:string -> ?initialize:(Client.t -> unit) -> context -> (Client.t -> 'a) -> 'a
val check : context -> string -> bool -> unit
val equal : context -> string -> 'a -> 'a -> unit
val assertions : context -> int
val inputs : context -> int
val sdk_calls : context -> int
val real_apps : context -> int
val cleanup : context -> unit
