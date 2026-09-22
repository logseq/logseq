type timer

val set_timeout : int -> (unit -> unit) -> timer
val set_interval : int -> (unit -> unit) -> timer
val clear : timer -> unit
