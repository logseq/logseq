(* Journal titles — cljs date.cljs: today = journal-name =
   "MMM do, yyyy" (e.g. "Sep 27th, 2026").

   A [t] is an epoch-milliseconds float; everything that needs
   wall-clock fields or the current time goes through
   Ui_services.time, which each platform installs with real host
   semantics (local timezone, JS-style overflow normalization). *)

type t = float

type fields = Ui_services.date_fields = {
  year : int;
  month : int;
  day : int;
  wday : int;
  hours : int;
  minutes : int;
  seconds : int;
  ms : int;
}

let date_now () : t = Ui_services.time_now ()
let of_ms (ms : float) : t = ms
let to_ms (t : t) : float = t
let fields (t : t) : fields = Ui_services.time_local_fields t

let make ?(hours = 0) ?(minutes = 0) ?(seconds = 0) ?(ms = 0) ~year ~month
    ~day () : t =
  Ui_services.time_of_fields
    { year; month; day; wday = 0; hours; minutes; seconds; ms }

(* JS-style date string parse ("2024-01-15", RFC 3339, or the
   "Sep 30, 2026" journal-title shape each platform supports). *)
let parse (s : string) : t option = Ui_services.time_parse s

(* d + delta days, as elapsed time (matches the pre-shared behavior of
   getTime + delta * 86400e3). *)
let add_days (t : t) (delta : int) : t = t +. (float_of_int delta *. 86400000.)

(* Calendar-day shift — JS setDate/getDate+n semantics, so the result
   lands on the target wall-clock day across DST transitions. *)
let shift_day (t : t) (delta : int) : t =
  let f = fields t in
  Ui_services.time_of_fields { f with day = f.day + delta }

let shift_month (t : t) (delta : int) : t =
  let f = fields t in
  Ui_services.time_of_fields { f with month = f.month + delta }

let shift_year (t : t) (delta : int) : t =
  let f = fields t in
  Ui_services.time_of_fields { f with year = f.year + delta }

(* new Date(y, m, 0).getDate() — the last day of month m (1-12). *)
let days_in_month ~y ~m =
  (fields (make ~year:y ~month:(m + 1) ~day:0 ())).day

let month_abbr =
  [| "Jan"; "Feb"; "Mar"; "Apr"; "May"; "Jun"
   ; "Jul"; "Aug"; "Sep"; "Oct"; "Nov"; "Dec" |]

let ordinal_suffix day =
  let d = day mod 100 in
  if d >= 11 && d <= 13 then "th"
  else match day mod 10 with 1 -> "st" | 2 -> "nd" | 3 -> "rd" | _ -> "th"

(* journal title for a date *)
let journal_title_of (t : t) =
  let f = fields t in
  Printf.sprintf "%s %d%s, %d" month_abbr.(f.month - 1) f.day
    (ordinal_suffix f.day) f.year

(* journal title for a calendar day — ymd stays in wall-clock space;
   routing it through a UTC-midnight Date and local getters would
   shift the day in timezones behind UTC *)
let journal_title_ymd ~y ~m ~d =
  Printf.sprintf "%s %d%s, %d" month_abbr.(m - 1) d (ordinal_suffix d) y

(* journal-day int YYYYMMDD (cljs date-time-util/date->int) *)
let journal_day_of (t : t) =
  let f = fields t in
  (f.year * 10000) + (f.month * 100) + f.day

let today () = journal_title_of (date_now ())
let today_journal_day () = journal_day_of (date_now ())

(* "MMM do, yyyy" -> Some (day, month, year); the journal nav target of
   a date that has no page yet is created on the fly like cljs *)
let journal_title_parts (s : string) =
  let len = String.length s in
  match String.index_opt s ',' with
  | Some comma when comma + 2 < len -> (
      match
        int_of_string_opt (String.sub s (comma + 2) (len - comma - 2))
      with
      | Some y -> (
          match String.index_opt s ' ' with
          | Some sp when sp = 3 && comma - sp > 3 -> (
              let mon = String.sub s 0 sp in
              let rest = String.sub s (sp + 1) (comma - sp - 1) in
              let rlen = String.length rest in
              let suf = String.sub rest (rlen - 2) 2 in
              let d = String.sub rest 0 (rlen - 2) in
              match
                ( List.find_index
                    (fun m -> m = mon)
                    (Array.to_list month_abbr)
                , int_of_string_opt d )
              with
              | Some m, Some d
                when (suf = "st" || suf = "nd" || suf = "rd" || suf = "th")
                     && d >= 1 && d <= 31 ->
                  Some (d, m + 1, y)
              | _ -> None)
          | _ -> None)
      | None -> None)
  | _ -> None

let is_journal_title s = journal_title_parts s <> None

(* "Sep 27, 2026" — matches cljs format-time-travel-date's
   toLocaleDateString {month: "short", day: "numeric", year: "numeric"} *)
let short_date_of_ts (t : t) =
  let f = fields t in
  let month =
    if f.month >= 1 && f.month <= Array.length month_abbr then
      month_abbr.(f.month - 1)
    else ""
  in
  Printf.sprintf "%s %d, %d" month f.day f.year
