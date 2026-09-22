(* Case-insensitive regex compiled from JS-flavored patterns
   (\uXXXX escapes are supported). replace substitutes the FIRST match
   via a callback, mirroring String.prototype.replace with a function
   replacer. *)
type t

val compile : string -> t
val test : t -> string -> bool

val replace
  :  t
  -> f:(match_:string
        -> groups:string option array
        -> offset:int
        -> input:string
        -> string)
  -> string
  -> string
