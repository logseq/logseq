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

(* Local date/time input has identical validation and timezone semantics on every host. *)
let parse_local_datetime s =
  let length=String.length s in
  let number start count =
    let rec digits index = index=start+count
      || (s.[index]>='0' && s.[index]<='9' && digits (index+1)) in
    if start+count<=length && digits start then
      int_of_string_opt (String.sub s start count) else None
  in
  let date_shape=length>=10 && s.[4]='-' && s.[7]='-' in
  let time_shape=length=10 || ((length=16 || length=19 || length=23)
    && (s.[10]='T' || s.[10]=' ') && s.[13]=':'
    && (length=16 || s.[16]=':') && (length<>23 || s.[19]='.')) in
  if not (date_shape && time_shape) then None
  else
    let hours=if length=10 then Some 0 else number 11 2
    and minutes=if length=10 then Some 0 else number 14 2
    and seconds=if length<19 then Some 0 else number 17 2
    and ms=if length=23 then number 20 3 else Some 0 in
    match number 0 4,number 5 2,number 8 2,hours,minutes,seconds,ms with
    | Some year,Some month,Some day,Some hours,Some minutes,Some seconds,Some ms
      when month>=1 && month<=12 && day>=1 && day<=days_in_month ~y:year ~m:month
        && hours>=0 && hours<24 && minutes>=0 && minutes<60 && seconds>=0 && seconds<60 ->
          Some (make ~year ~month ~day ~hours ~minutes ~seconds ~ms ())
    | _ -> None

(* Zoned dates and journal titles use host parsing; unzoned datetime input is shared. *)
let parse s =
  let length=String.length s in
  if List.mem length [16;19;23] && s.[4]='-' && s.[7]='-'
     && (s.[10]='T' || s.[10]=' ') then parse_local_datetime s
  else Ui_services.time_parse s

let weekday_offset ~week_starts_on weekday =
  if week_starts_on<0 || week_starts_on>6 || weekday<0 || weekday>6 then
    invalid_arg "Calendar weekdays must be between zero and six";
  (weekday-week_starts_on+7) mod 7

let calendar_navigate ~week_starts_on ~year ~month ~day ~key ~shift =
  let date = make ~year ~month ~day () in
  let month_step delta =
    let target = fields (make ~year ~month:(month + delta) ~day:1 ()) in
    make ~year:target.year ~month:target.month
      ~day:(min day (days_in_month ~y:target.year ~m:target.month)) ()
  in
  let target = match key with
    | "ArrowLeft" -> shift_day date (-1)
    | "ArrowRight" -> shift_day date 1
    | "ArrowUp" -> shift_day date (-7)
    | "ArrowDown" -> shift_day date 7
    | "Home" -> shift_day date (-(weekday_offset ~week_starts_on (fields date).wday))
    | "End" -> shift_day date (6 - weekday_offset ~week_starts_on (fields date).wday)
    | "PageUp" -> month_step (if shift then -12 else -1)
    | "PageDown" -> month_step (if shift then 12 else 1)
    | _ -> invalid_arg "Unsupported calendar navigation key"
  in
  let f = fields target in
  f.year, f.month, f.day

let month_keys =
  [| "format.month/january"; "format.month/february"; "format.month/march";
     "format.month/april"; "format.month/may"; "format.month/june";
     "format.month/july"; "format.month/august"; "format.month/september";
     "format.month/october"; "format.month/november"; "format.month/december" |]

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
