(* Unified time model for the db-worker.

   Two semantic notions, both abstract:

   - [epoch_ms] is a UTC instant, internally int64 milliseconds since
     epoch. It covers every timestamp cljs stores as a plain number
     (block/created-at, block/updated-at, deleted-at, kv timestamps,
     datetime property values, rtc-log created-at) AND true instants
     (file/*-at, transit ~t, db.type/instant, EDN #inst): number-vs-Date
     is a wire/storage encoding decided at the codec layer by schema or
     attr, not by the value representation.

   - [local_date] is a calendar day (year/month/day) observed in a
     timezone. block/journal-day (yyyymmdd) is its storage encoding;
     journal titles and date property values resolve through it. *)

type epoch_ms
type tz
type local_date

(* ---- timezones ---- *)

val local_tz : unit -> tz
(** System local timezone (platform-provided). *)

val utc : tz

val tz_of_offset_minutes : int -> tz
(** Fixed offset east of UTC, e.g. +480 for UTC+8. *)

(* ---- epoch_ms ---- *)

val epoch_ms : int64 -> epoch_ms
val epoch_ms_of_float : float -> epoch_ms
val epoch_ms_to_int64 : epoch_ms -> int64
val epoch_ms_to_float : epoch_ms -> float
val compare_epoch_ms : epoch_ms -> epoch_ms -> int
val equal_epoch_ms : epoch_ms -> epoch_ms -> bool

(* ---- local_date ---- *)

val local_date : year:int -> month:int -> day:int -> tz:tz -> local_date option
(** None on out-of-range fields (month 1-12, day within month). *)

val local_date_year : local_date -> int
val local_date_month : local_date -> int
val local_date_day : local_date -> int
val local_date_tz : local_date -> tz

val compare_local_date : local_date -> local_date -> int
val equal_local_date : local_date -> local_date -> bool
(** Ordering is on the civil fields (year, month, day); equality
    additionally requires the same timezone. *)

(* ---- epoch_ms <-> local_date ---- *)

val local_date_of_epoch_ms : tz -> epoch_ms -> local_date
(** The civil date an instant falls on in [tz] (cljs: Date getters). *)

val epoch_ms_of_local_date : local_date -> epoch_ms
(** Epoch ms of local midnight of the date in its timezone. *)

val epoch_ms_of_local_date_at :
  local_date -> hour:int -> minute:int -> second:int -> ms:int -> epoch_ms
(** Same local date with the given time fields (cljs: Date#setHours);
    out-of-range fields roll over like Date setters. *)

val today : tz -> local_date
val now : unit -> epoch_ms

(* ---- journal-day int (yyyymmdd) ---- *)

val journal_day_of_local_date : local_date -> int
val local_date_of_journal_day : tz -> int -> local_date option

(* ---- ISO-8601 (transit ~t / EDN #inst) ---- *)

val iso_string_of_epoch_ms : epoch_ms -> string
(** UTC ISO-8601, cljs Date#toISOString(). *)

val epoch_ms_of_iso_string : string -> epoch_ms option
(** js/Date.parse-compatible read; timezone suffix honored. *)
