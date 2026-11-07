type zone = Top | Nested | Sibling
type target = string * zone
type drop = string * string * zone
type 'context t

val empty : 'context t
val arm : context:'context -> source:string -> x:float -> y:float -> 'context t
val source : 'context t -> string option
val preview : 'context t -> (string * target option) option
val move :
  context:'context -> x:float -> y:float -> target:target option ->
  'context t -> 'context t
val release :
  context:'context -> target:target option -> 'context t -> 'context t * drop option
val cancel : 'context t -> 'context t
val consume_click : 'context t -> 'context t * bool
val zone : first:bool -> left:float -> top:float -> x:float -> y:float -> zone
val zone_name : zone -> string
