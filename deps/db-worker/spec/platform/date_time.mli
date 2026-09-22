(* Virtual module: conversions between local-timezone civil times and
   epoch milliseconds. Needed for cljs-time compatible date arithmetic
   (date-at-local-ms, t/today, journal title parsing) which JavaScript
   performs through Date's local-timezone getters/setters. *)

type civil =
  { year : int
  ; month : int  (** 1-12 *)
  ; day : int  (** 1-31 *)
  ; hour : int
  ; minute : int
  ; second : int
  ; ms : int
  }

val of_epoch_ms : int64 -> civil
(** Local-timezone civil fields of an epoch-ms instant
    (cljs: Date getters). *)

val to_epoch_ms : civil -> int64
(** Epoch ms of a local-timezone civil time. Out-of-range fields roll
    over the same way Date setters do (cljs: Date with
    year/month/date/hours/minutes/seconds + setMilliseconds). *)
