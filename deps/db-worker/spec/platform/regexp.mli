(* Case-insensitive regex compiled from JS-flavored patterns
   (\uXXXX escapes are supported). replace substitutes the FIRST match
   via a callback, mirroring String.prototype.replace with a function
   replacer; replace_all mirrors the /g variant. *)
type t

type re_match =
  { groups : string option array  (** groups.(0) is the whole match *)
  ; offset : int  (** byte offset of the whole match *)
  ; last : int  (** byte offset just past the whole match *) }

val compile : string -> t

val test : t -> string -> bool

val exec : ?pos:int -> t -> string -> re_match option

val replace
  :  t
  -> f:(match_:string
        -> groups:string option array
        -> offset:int
        -> input:string
        -> string)
  -> string
  -> string

val replace_all
  :  t
  -> f:(match_:string
        -> groups:string option array
        -> offset:int
        -> input:string
        -> string)
  -> string
  -> string
