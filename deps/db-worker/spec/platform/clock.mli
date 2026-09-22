val now_ms : unit -> float
val monotonic_ms : unit -> float

(* Current local date as a journal-day int (YYYYMMDD), like
   date-time-util/date->int. *)
val today_int : unit -> int

(* Break epoch-ms down in local time: (year, month 1-12, day, hour, minute). *)
val localtime_ms : float -> int * int * int * int * int
