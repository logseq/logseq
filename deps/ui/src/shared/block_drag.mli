type zone = Top | Nested | Sibling
type 'block target = 'block * zone
type 'block drop = 'block * 'block * zone
type ('context, 'block) t

val empty : ('context, 'block) t
val arm : context:'context -> source:'block -> x:float -> y:float -> ('context, 'block) t
val source : ('context, 'block) t -> 'block option
val preview : ('context, 'block) t -> ('block * 'block target option) option
val move :
  context:'context -> x:float -> y:float -> target:'block target option ->
  ('context, 'block) t -> ('context, 'block) t
val release :
  context:'context -> target:'block target option ->
  ('context, 'block) t -> ('context, 'block) t * 'block drop option
val cancel : ('context, 'block) t -> ('context, 'block) t
val consume_click : ('context, 'block) t -> ('context, 'block) t * bool
val zone : first:bool -> left:float -> top:float -> x:float -> y:float -> zone
val zone_name : zone -> string
