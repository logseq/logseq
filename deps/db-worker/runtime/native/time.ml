(* Time spec implementation for the native target.

   epoch_ms is int64. tz distinguishes the system local zone — resolved
   through Unix.localtime/mktime so DST transitions stay correct — from
   fixed offsets, which use pure civil<->days arithmetic plus the minute
   offset (no tz database needed). *)

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
let now () = Int64.of_float (Unix.gettimeofday () *. 1000.)

(* ---- monotonic_ms ---- *)

let monotonic_now () = Unix.gettimeofday () *. 1000.
let diff_monotonic_ms a b = b -. a
let compare_monotonic_ms = Float.compare

(* ---- int64 floor division + civil<->days (Howard Hinnant) ---- *)

let floor_div64 a b =
  let q = Int64.div a b and r = Int64.rem a b in
  if r <> 0L && ((r < 0L) <> (b < 0L)) then Int64.pred q else q

let floor_mod64 a b =
  let r = Int64.rem a b in
  if r <> 0L && ((r < 0L) <> (b < 0L)) then Int64.add r b else r

let floor_div_i a b =
  let q = a / b and r = a mod b in
  if r <> 0 && ((r < 0) <> (b < 0)) then q - 1 else q

let floor_mod_i a b =
  let r = a mod b in
  if r <> 0 && ((r < 0) <> (b < 0)) then r + b else r

(* days since 1970-01-01 UTC *)
let days_from_civil y mo d =
  let y' = if mo <= 2 then y - 1 else y in
  let era = floor_div_i (if y' >= 0 then y' else y' - 399) 400 in
  let yoe = y' - (era * 400) in
  let doy = (((153 * (if mo > 2 then mo - 3 else mo + 9)) + 2) / 5) + d - 1 in
  let doe = (yoe * 365) + (yoe / 4) - (yoe / 100) + doy in
  (era * 146097) + doe - 719468

(* inverse: (year, month, day) of days since epoch *)
let civil_from_days (z : int) =
  let z = z + 719468 in
  let era = floor_div_i (if z >= 0 then z else z - 146096) 146097 in
  let doe = z - (era * 146097) in
  let yoe = (doe - (doe / 1460) + (doe / 36524) - (doe / 146096)) / 365 in
  let y = yoe + (era * 400) in
  let doy = doe - ((365 * yoe) + (yoe / 4) - (yoe / 100)) in
  let mp = ((5 * doy) + 2) / 153 in
  let d = doy - (((153 * mp) + 2) / 5) + 1 in
  let m = if mp < 10 then mp + 3 else mp - 9 in
  ((if m <= 2 then y + 1 else y), m, d)

let days_in_month year month =
  match month with
  | 1 | 3 | 5 | 7 | 8 | 10 | 12 -> 31
  | 4 | 6 | 9 | 11 -> 30
  | 2 ->
      if (year mod 4 = 0 && year mod 100 <> 0) || year mod 400 = 0 then 29
      else 28
  | _ -> invalid_arg "month out of range"

(* civil fields of an epoch-ms instant read at a fixed minute offset
   (pure arithmetic — no tz table) *)
let civil_at_offset off_min (ms : int64) : civil =
  let shifted = Int64.add ms (Int64.of_int (off_min * 60000)) in
  let secs = floor_div64 shifted 1000L in
  let ms_part = Int64.to_int (floor_mod64 shifted 1000L) in
  let days = floor_div64 secs 86400L in
  let day_secs = Int64.to_int (floor_mod64 secs 86400L) in
  let y, mo, d = civil_from_days (Int64.to_int days) in
  { cv_year = y
  ; cv_month = mo
  ; cv_day = d
  ; cv_hour = day_secs / 3600
  ; cv_minute = (day_secs mod 3600) / 60
  ; cv_second = day_secs mod 60
  ; cv_ms = ms_part
  }

(* epoch ms of a civil time at a fixed minute offset. Field rollover
   follows js/Date semantics: month spills into year, day spills into
   adjacent months, smaller fields just add. *)
let epoch_ms_at_offset off_min c : int64 =
  let total_months = (c.cv_year * 12) + (c.cv_month - 1) in
  let y' = floor_div_i total_months 12 in
  let m' = floor_mod_i total_months 12 + 1 in
  let days = days_from_civil y' m' 1 + (c.cv_day - 1) in
  Int64.sub
    (Int64.add
       (Int64.mul
          (Int64.of_int
             ((days * 86400) + (c.cv_hour * 3600) + (c.cv_minute * 60)
              + c.cv_second))
          1000L)
       (Int64.of_int c.cv_ms))
    (Int64.of_int (off_min * 60000))

let civil_of_unix_tm tm ms_part =
  { cv_year = tm.Unix.tm_year + 1900
  ; cv_month = tm.Unix.tm_mon + 1
  ; cv_day = tm.Unix.tm_mday
  ; cv_hour = tm.Unix.tm_hour
  ; cv_minute = tm.Unix.tm_min
  ; cv_second = tm.Unix.tm_sec
  ; cv_ms = ms_part
  }

(* ---- civil ---- *)

let civil ~year ~month ~day ~hour ~minute ~second ~ms =
  { cv_year = year; cv_month = month; cv_day = day; cv_hour = hour;
    cv_minute = minute; cv_second = second; cv_ms = ms }

let civil_fields c =
  ( c.cv_year, c.cv_month, c.cv_day, c.cv_hour, c.cv_minute, c.cv_second,
    c.cv_ms )

let compare_civil a b = compare (civil_fields a) (civil_fields b)

let civil_of_epoch_ms tz ms =
  match tz with
  | Local_tz ->
      let tm = Unix.localtime (Int64.to_float ms /. 1000.) in
      civil_of_unix_tm
        tm
        (Int64.(to_int (rem (add (rem ms 1000L) 1000L) 1000L)))
  | Offset_tz off -> civil_at_offset off ms

let epoch_ms_of_civil tz c =
  match tz with
  | Local_tz ->
      (* mktime normalizes out-of-range fields like js/Date setters *)
      let tm =
        { Unix.tm_sec = c.cv_second
        ; tm_min = c.cv_minute
        ; tm_hour = c.cv_hour
        ; tm_mday = c.cv_day
        ; tm_mon = c.cv_month - 1
        ; tm_year = c.cv_year - 1900
        ; tm_wday = 0
        ; tm_yday = 0
        ; tm_isdst = false
        }
      in
      let secs, _ = Unix.mktime tm in
      Int64.of_float (secs *. 1000. +. float_of_int c.cv_ms)
  | Offset_tz off -> epoch_ms_at_offset off c

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

(* ---- journal-day int (yyyymmdd) ---- *)

let journal_day_of_local_date d =
  (d.ld_year * 10000) + (d.ld_month * 100) + d.ld_day

let local_date_of_journal_day tz n =
  local_date ~year:(n / 10000) ~month:((n / 100) mod 100) ~day:(n mod 100) ~tz

(* ---- ISO-8601 ---- *)

let iso_string_of_epoch_ms ms =
  let c = civil_at_offset 0 ms in
  Printf.sprintf "%04d-%02d-%02dT%02d:%02d:%02d.%03dZ" c.cv_year
    c.cv_month c.cv_day c.cv_hour c.cv_minute c.cv_second c.cv_ms

(* ISO 8601 "YYYY-MM-DD[T ]HH:MM[:SS[.fff]][Z|±HH:MM|±HHMM]" — covers the
   ~t/#inst forms; native does not emulate the rest of js/Date.parse. *)
let epoch_ms_of_iso_string s : epoch_ms option =
  let n = String.length s in
  let digit i = i < n && s.[i] >= '0' && s.[i] <= '9' in
  let uint i len =
    if i + len <= n && String.for_all (fun c -> c >= '0' && c <= '9')
         (String.sub s i len)
    then Some (int_of_string (String.sub s i len))
    else None
  in
  let skip_digits i =
    let rec go j = if j < n && digit j then go (j + 1) else j in
    go i
  in
  match (uint 0 4, n > 4 && s.[4] = '-', n > 7 && s.[7] = '-') with
  | Some year, true, true -> (
      match (uint 5 2, uint 8 2) with
      | Some month, Some day ->
          let i = 10 in
          (* optional time part after 'T' or space *)
          let time, i =
            if i < n && (s.[i] = 'T' || s.[i] = ' ') then
              let i = i + 1 in
              match (uint i 2, i + 2 < n && s.[i + 2] = ':', uint (i + 3) 2) with
              | Some hour, true, Some minute ->
                  let i = i + 5 in
                  let second, i =
                    if i < n && s.[i] = ':' then
                      match uint (i + 1) 2 with
                      | Some sec -> (sec, i + 3)
                      | None -> (0, i)
                    else (0, i)
                  in
                  let ms_part, i =
                    if i < n && s.[i] = '.' then
                      let stop = min (skip_digits (i + 1)) (i + 4) in
                      if stop > i + 1 then
                        ( int_of_string
                            (String.sub s (i + 1) (stop - i - 1)
                             ^ String.make (3 - (stop - i - 1)) '0')
                        , stop )
                      else (0, i)
                    else (0, i)
                  in
                  (Some (hour, minute, second, ms_part), i)
              | _ -> (None, i)
            else (None, i)
          in
          (* optional tz suffix: 'Z' or ±HH[:MM|MM] *)
          let offset_min, ok =
            let rec scan i =
              if i >= n then (0, true)
              else
                match s.[i] with
                | 'Z' | 'z' -> (0, true)
                | '+' | '-' ->
                    let sign = if s.[i] = '-' then -1 else 1 in
                    let j = skip_digits (i + 1) in
                    let raw =
                      try int_of_string (String.sub s (i + 1) (j - i - 1))
                      with _ -> 0
                    in
                    if j < n && s.[j] = ':' then
                      let j2 = skip_digits (j + 1) in
                      let mm =
                        try int_of_string (String.sub s (j + 1) (j2 - j - 1))
                        with _ -> 0
                      in
                      (sign * ((raw * 60) + mm), true)
                    else if j - i - 1 >= 4 then
                      (sign * (((raw / 100) * 60) + (raw mod 100)), true)
                    else (sign * raw * 60, true)
                | _ -> scan (i + 1)
            in
            scan i
          in
          let hour, minute, second, ms_part =
            match time with
            | Some (h, mi, sec, ms') -> (h, mi, sec, ms')
            | None -> (0, 0, 0, 0)
          in
          if ok && month >= 1 && month <= 12 && day >= 1
             && day <= days_in_month year month && hour <= 23
             && minute <= 59 && second <= 59
          then
            Some
              (epoch_ms_at_offset offset_min
                 { cv_year = year; cv_month = month; cv_day = day;
                   cv_hour = hour; cv_minute = minute; cv_second = second;
                   cv_ms = ms_part })
          else None
      | _ -> None)
  | _ -> None
