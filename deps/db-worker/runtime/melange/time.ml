(* Time spec implementation for JS targets (melange).

   epoch_ms is int64 (epoch ms exceed JS int32; Js.Date works on float).
   tz distinguishes the system local zone — always resolved through
   js/Date so DST transitions stay correct — from fixed offsets, which
   go through UTC getters/setters plus the minute offset. *)

type epoch_ms = int64
type monotonic_ms = float
type tz = Local_tz | Offset_tz of int (* minutes east of UTC *)
type local_date = { ld_year : int; ld_month : int; ld_day : int; ld_tz : tz }
type civil =
  { cv_year : int
  ; cv_month : int
  ; cv_day : int
  ; cv_hour : int
  ; cv_minute : int
  ; cv_second : int
  ; cv_ms : int
  }

(* ---- timezones ---- *)

let local_tz () = Local_tz
let utc = Offset_tz 0
let tz_of_offset_minutes n = Offset_tz n
let equal_tz a b = a = b

(* ---- epoch_ms ---- *)

let epoch_ms (n : int64) = n
let epoch_ms_of_float f = Int64.of_float f
let epoch_ms_to_int64 t = t
let epoch_ms_to_float t = Int64.to_float t
let compare_epoch_ms = Int64.compare
let equal_epoch_ms = Int64.equal
let now () = Int64.of_float (Js.Date.now ())

(* ---- monotonic_ms ---- *)

type perf

external performance_ : perf Js.Undefined.t = "performance"
  [@@mel.scope "globalThis"]

external perf_now_ : perf -> float = "now" [@@mel.send]

(* cljs perf-time-ms — performance.now() when available else Date.now() *)
let monotonic_now () =
  match Js.Undefined.toOption performance_ with
  | Some p -> perf_now_ p
  | None -> Js.Date.now ()

let monotonic_ms_to_float t = t
let diff_monotonic_ms a b = b -. a
let compare_monotonic_ms = Float.compare
let equal_monotonic_ms = Float.equal

(* ---- civil helpers ---- *)

let days_in_month year month =
  match month with
  | 1 | 3 | 5 | 7 | 8 | 10 | 12 -> 31
  | 4 | 6 | 9 | 11 -> 30
  | 2 ->
      if (year mod 4 = 0 && year mod 100 <> 0) || year mod 400 = 0 then 29
      else 28
  | _ -> invalid_arg "month out of range"

let civil_of_date_local d =
  { cv_year = int_of_float (Js.Date.getFullYear d)
  ; cv_month = int_of_float (Js.Date.getMonth d) + 1
  ; cv_day = int_of_float (Js.Date.getDate d)
  ; cv_hour = int_of_float (Js.Date.getHours d)
  ; cv_minute = int_of_float (Js.Date.getMinutes d)
  ; cv_second = int_of_float (Js.Date.getSeconds d)
  ; cv_ms = int_of_float (Js.Date.getMilliseconds d)
  }

let civil_of_date_utc d =
  { cv_year = int_of_float (Js.Date.getUTCFullYear d)
  ; cv_month = int_of_float (Js.Date.getUTCMonth d) + 1
  ; cv_day = int_of_float (Js.Date.getUTCDate d)
  ; cv_hour = int_of_float (Js.Date.getUTCHours d)
  ; cv_minute = int_of_float (Js.Date.getUTCMinutes d)
  ; cv_second = int_of_float (Js.Date.getUTCSeconds d)
  ; cv_ms = int_of_float (Js.Date.getUTCMilliseconds d)
  }

(* ---- civil ---- *)

let civil ~year ~month ~day ~hour ~minute ~second ~ms =
  { cv_year = year; cv_month = month; cv_day = day; cv_hour = hour;
    cv_minute = minute; cv_second = second; cv_ms = ms }

let civil_fields c =
  ( c.cv_year, c.cv_month, c.cv_day, c.cv_hour, c.cv_minute, c.cv_second,
    c.cv_ms )

let civil_field_tuple c = civil_fields c

let compare_civil a b = compare (civil_field_tuple a) (civil_field_tuple b)
let equal_civil a b = a = b

let civil_of_epoch_ms tz ms =
  let d = Js.Date.fromFloat (Int64.to_float ms) in
  match tz with
  | Local_tz -> civil_of_date_local d
  | Offset_tz off ->
      civil_of_date_utc (Js.Date.fromFloat (Int64.to_float ms +. float_of_int (off * 60000)))

let epoch_ms_of_civil tz c =
  match tz with
  | Local_tz ->
      (* js/Date constructor + setMilliseconds roll out-of-range fields
         over (cljs-time/goog.date semantics) *)
      let d =
        Js.Date.make ~year:(float_of_int c.cv_year)
          ~month:(float_of_int (c.cv_month - 1)) ~date:(float_of_int c.cv_day)
          ~hours:(float_of_int c.cv_hour) ~minutes:(float_of_int c.cv_minute)
          ~seconds:(float_of_int c.cv_second) ()
      in
      let _ = Js.Date.setMilliseconds ~milliseconds:(float_of_int c.cv_ms) d in
      Int64.of_float (Js.Date.getTime d)
  | Offset_tz off ->
      (* Date.UTC applies the same field rollover in UTC space *)
      Int64.of_float
        ( Js.Date.utc ~year:(float_of_int c.cv_year)
            ~month:(float_of_int (c.cv_month - 1)) ~date:(float_of_int c.cv_day)
            ~hours:(float_of_int c.cv_hour) ~minutes:(float_of_int c.cv_minute)
            ~seconds:(float_of_int c.cv_second) ()
        +. float_of_int c.cv_ms
        -. float_of_int (off * 60000) )

(* ---- local_date ---- *)

let local_date ~year ~month ~day ~tz =
  if month < 1 || month > 12 then None
  else if day < 1 || day > days_in_month year month then None
  else Some { ld_year = year; ld_month = month; ld_day = day; ld_tz = tz }

let local_date_fields d = (d.ld_year, d.ld_month, d.ld_day)
let local_date_tz d = d.ld_tz

let compare_local_date a b =
  compare (local_date_fields a) (local_date_fields b)

let equal_local_date a b =
  local_date_fields a = local_date_fields b && equal_tz a.ld_tz b.ld_tz

let local_date_of_epoch_ms tz ms =
  let c = civil_of_epoch_ms tz ms in
  { ld_year = c.cv_year; ld_month = c.cv_month; ld_day = c.cv_day; ld_tz = tz }

let epoch_ms_of_local_date d =
  epoch_ms_of_civil d.ld_tz
    { cv_year = d.ld_year; cv_month = d.ld_month; cv_day = d.ld_day;
      cv_hour = 0; cv_minute = 0; cv_second = 0; cv_ms = 0 }

let epoch_ms_of_local_date_at d ~hour ~minute ~second ~ms =
  epoch_ms_of_civil d.ld_tz
    { cv_year = d.ld_year; cv_month = d.ld_month; cv_day = d.ld_day;
      cv_hour = hour; cv_minute = minute; cv_second = second; cv_ms = ms }

let today tz = local_date_of_epoch_ms tz (now ())

(* ---- journal-day int (yyyymmdd) ---- *)

let journal_day_of_local_date d =
  (d.ld_year * 10000) + (d.ld_month * 100) + d.ld_day

let local_date_of_journal_day tz n =
  local_date ~year:(n / 10000) ~month:((n / 100) mod 100) ~day:(n mod 100) ~tz

(* ---- ISO-8601 ---- *)

let iso_string_of_epoch_ms ms =
  Js.Date.toISOString (Js.Date.fromFloat (Int64.to_float ms))

let epoch_ms_of_iso_string s =
  let t = Js.Date.getTime (Js.Date.fromString s) in
  if Float.is_nan t then None else Some (Int64.of_float t)
