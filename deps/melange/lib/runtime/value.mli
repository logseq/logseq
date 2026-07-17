type t =
  | Nil
  | Bool of bool
  | String of string
  | Char of Uchar.t
  | Symbol of string
  | Keyword of Keyword.t
  | Int of int64
  | Big_int of string
  | Float of float
  | Decimal of string
  | Ratio of string
  | Regex of string
  | Binary of string
  | Date of int64
  | Uuid of Uuid.t
  | Uri of string
  | List of t Persistent_vector.t
  | Vector of t Persistent_vector.t
  | Map of (t * t) Persistent_vector.t
  | Set of t Persistent_vector.t
  | Tagged of string * t

val equal : t -> t -> bool
