type direction = Left | Right
type child = { id : int; order : string; excluded : bool }
type node = { id : int; order : string; children : int Rrbvec.t }

val sort_ids : child Rrbvec.t -> int Rrbvec.t

val neighbor_id :
  direction:direction -> current_order:string -> child Rrbvec.t -> int option

val preorder_ids : root_id:int -> node Rrbvec.t -> int Rrbvec.t
