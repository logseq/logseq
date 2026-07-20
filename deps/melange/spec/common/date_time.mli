val now_ms : unit -> float
val relative_timestamp_ms : now_ms:float -> string -> float option
val journal_day_of_ms : float -> int
val local_date_ms_of_journal_day : int -> float
val journal_day_to_utc_ms : int -> float
val default_journal_title_formatter : string
val built_in_journal_title_formatters : string Rrbvec.t
val slash_journal_title_formatters : string Rrbvec.t
val journal_title_formatters : string option -> string option Rrbvec.t
val safe_journal_title_formatters : string option -> string Rrbvec.t

val parse_journal_title_day :
  title:string -> formatters:string option Rrbvec.t -> int option

val format_journal_day : journal_day:int -> formatter:string -> string

val format_date_time :
  year:int ->
  month:int ->
  day:int ->
  hour:int ->
  minute:int ->
  second:int ->
  formatter:string ->
  string
