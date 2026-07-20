type number_operator = Gt | Gte | Lt | Lte

val text_contains : string Rrbvec.t -> string -> bool
val text_not_contains : string Rrbvec.t -> string -> bool
val number_match : number_operator -> float Rrbvec.t -> float -> bool
val between : float Rrbvec.t -> start:float option -> end_:float option -> bool
val boolean_match : negated:bool -> value:bool -> expected:bool -> bool
val empty_match : negated:bool -> empty:bool -> bool
val membership_match : negated:bool -> match_empty:bool -> hit:bool -> bool

val timestamp_match :
  before:bool -> value:float option -> target:float option -> bool

val combine : or_:bool -> bool Rrbvec.t -> bool
