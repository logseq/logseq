type entry = { index : int; order : string option; uuid : string }
type update = { index : int; order : string }

val sort_indices : entry Rrbvec.t -> int Rrbvec.t
val normalize_orders : entry Rrbvec.t -> update Rrbvec.t
