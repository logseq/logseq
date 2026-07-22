type t

val of_ymd : year:int -> month:int -> day:int -> (t, string) result
val of_journal_day : int -> (t, string) result
val of_iso_date : string -> (t, string) result
val to_journal_day : t -> int
val to_iso_date : t -> string
val year : t -> int
val month : t -> int
val day : t -> int
val equal : t -> t -> bool
