val now_ms : unit -> float
val monotonic_ms : unit -> float

(* Current local date as a journal-day int (YYYYMMDD), like
   date-time-util/date->int. *)
val today_int : unit -> int
