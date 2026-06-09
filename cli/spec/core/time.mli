type span = float
type date = Js.Date.t

val now : unit -> date
val epoch : date
val max_time : date
val time_of_epoch_ms : int64 -> date
val time_to_epoch_ms : date -> int64
val time_to_epoch_seconds : date -> int64
val time_to_epoch_seconds_float : date -> float
val compare_time : date -> date -> int
val span_of_ms : int64 -> span
val span_to_ms : span -> int64
val zero_span : span
val compare_span : span -> span -> int
val add_span_value : span -> span -> span
val add_span : date -> span -> date option
val local_date : date -> int * int * int
val utc_date_time : date -> int * int * int * int * int * int
val non_negative_diff : start_time:date -> end_time:date -> span
val avg_span : span -> int -> span
val rfc3339_millis : date -> string
val parse_rfc3339 : string -> date option
val parse_date_as_utc : string -> date option
val parse_time : string -> date option
