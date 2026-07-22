type value = Missing | Bool of bool | Number of float | Text of string
type direction = Asc | Desc
type row = { index : int; keys : value Rrbvec.t }

val sort_indices : row Rrbvec.t -> direction Rrbvec.t -> int Rrbvec.t

val sort_indices_with_missing_last :
  row Rrbvec.t -> direction Rrbvec.t -> bool Rrbvec.t -> int Rrbvec.t
