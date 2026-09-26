(* Unified time model for the db-worker — a platform capability since
   local-timezone civil arithmetic and the wall/monotonic clocks are
   runtime-provided (js/Date on melange, Unix on native).

   - [epoch_ms]: a UTC instant, internally int64 milliseconds since
     epoch. Covers every timestamp cljs stores as a plain number
     (block/created-at, updated-at, deleted-at, kv timestamps, datetime
     property values) AND true instants (file/*-at, transit ~t,
     db.type/instant, EDN #inst): number-vs-Date is a wire/storage
     encoding decided at the codec layer by schema or attr, not by the
     value representation.
   - [monotonic_ms]: a monotonic-clock reading for measuring elapsed
     time; not convertible to a civil value and unaffected by wall-clock
     adjustments (cljs: performance.now / Date.now monotonic source).
   - [local_date]: a calendar day (year/month/day) observed in a
     timezone. block/journal-day (yyyymmdd) is its storage encoding.
   - [localtime]: a civil timestamp's local fields down to the minute
     (cljs: Date getters).
   - [civil]: localtime plus second/ms — the full civil field tuple used
     for cljs-time/goog.date-compatible arithmetic; out-of-range fields
     roll over on conversion like Date setters. *)

type epoch_ms
type monotonic_ms
type tz
type local_date
type localtime
type civil

(* ---- timezones ---- *)

val local_tz : unit -> tz
(** System local timezone. *)

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
val now : unit -> epoch_ms

(* ---- monotonic_ms ---- *)

val monotonic_now : unit -> monotonic_ms
val monotonic_ms_to_float : monotonic_ms -> float
val diff_monotonic_ms : monotonic_ms -> monotonic_ms -> float
(** Elapsed milliseconds from the first reading to the second. *)

val compare_monotonic_ms : monotonic_ms -> monotonic_ms -> int
val equal_monotonic_ms : monotonic_ms -> monotonic_ms -> bool

(* ---- local_date ---- *)

val local_date : year:int -> month:int -> day:int -> tz:tz -> local_date option
(** None on out-of-range fields (month 1-12, day within month). *)

val local_date_fields : local_date -> int * int * int
(** (year, month, day). *)

val local_date_tz : local_date -> tz

val compare_local_date : local_date -> local_date -> int
val equal_local_date : local_date -> local_date -> bool
(** Ordering is on the civil fields (year, month, day); equality
    additionally requires the same timezone. *)

(* ---- localtime ---- *)

val localtime :
  year:int -> month:int -> day:int -> hour:int -> minute:int -> localtime
(** Field tuple matching clock/localtime_ms. *)

val localtime_fields : localtime -> int * int * int * int * int
(** (year, month, day, hour, minute). *)

val compare_localtime : localtime -> localtime -> int
val equal_localtime : localtime -> localtime -> bool

(* ---- civil ---- *)

val civil :
  year:int -> month:int -> day:int -> hour:int -> minute:int ->
  second:int -> ms:int -> civil
(** Fields may be out of range; they roll over on [epoch_ms_of_civil]
    like Date setters (cljs-time/goog.date add semantics). *)

val civil_fields : civil -> int * int * int * int * int * int * int
(** (year, month, day, hour, minute, second, ms). *)

val compare_civil : civil -> civil -> int
val equal_civil : civil -> civil -> bool

(* ---- epoch_ms <-> civil/localtime/local_date ---- *)

val civil_of_epoch_ms : tz -> epoch_ms -> civil
(** Local-timezone civil fields of an instant (cljs: Date getters). *)

val epoch_ms_of_civil : tz -> civil -> epoch_ms
(** Epoch ms of a civil time read in [tz]; out-of-range fields roll
    over (cljs: Date setters). *)

val localtime_of_epoch_ms : tz -> epoch_ms -> localtime
val epoch_ms_of_localtime : tz -> localtime -> epoch_ms

val local_date_of_epoch_ms : tz -> epoch_ms -> local_date
(** The civil date an instant falls on in [tz]. *)

val epoch_ms_of_local_date : local_date -> epoch_ms
(** Epoch ms of local midnight of the date in its timezone. *)

val epoch_ms_of_local_date_at :
  local_date -> hour:int -> minute:int -> second:int -> ms:int -> epoch_ms
(** Same local date with the given time fields (cljs: Date#setHours);
    out-of-range fields roll over. *)

val today : tz -> local_date

(* ---- journal-day int (yyyymmdd) ---- *)

val journal_day_of_local_date : local_date -> int
val local_date_of_journal_day : tz -> int -> local_date option

(* ---- ISO-8601 (transit ~t / EDN #inst) ---- *)

val iso_string_of_epoch_ms : epoch_ms -> string
(** UTC ISO-8601, cljs Date#toISOString(). *)

val epoch_ms_of_iso_string : string -> epoch_ms option
(** js/Date.parse-compatible read; timezone suffix honored. *)
