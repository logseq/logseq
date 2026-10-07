(* Journal titles — cljs date.cljs: today = journal-name =
   "MMM do, yyyy" (e.g. "Sep 27th, 2026"). *)

let month_abbr =
  [| "Jan"; "Feb"; "Mar"; "Apr"; "May"; "Jun"
   ; "Jul"; "Aug"; "Sep"; "Oct"; "Nov"; "Dec" |]

let ordinal_suffix day =
  let d = day mod 100 in
  if d >= 11 && d <= 13 then "th"
  else match day mod 10 with 1 -> "st" | 2 -> "nd" | 3 -> "rd" | _ -> "th"

external date_now : unit -> Js.Date.t = "Date" [@@mel.new]

(* journal title for a JS Date *)
let journal_title_of (d : Js.Date.t) =
  let day = int_of_float (Js.Date.getDate d) in
  let month = int_of_float (Js.Date.getMonth d) in
  Printf.sprintf "%s %d%s, %d" month_abbr.(month) day
    (ordinal_suffix day)
    (int_of_float (Js.Date.getFullYear d))

(* journal title for a calendar day — ymd stays in wall-clock space;
   routing it through a UTC-midnight Date and local getters would
   shift the day in timezones behind UTC *)
let journal_title_ymd ~y ~m ~d =
  Printf.sprintf "%s %d%s, %d" month_abbr.(m - 1) d (ordinal_suffix d) y

(* journal-day int YYYYMMDD (cljs date-time-util/date->int) *)
let journal_day_of (d : Js.Date.t) =
  int_of_float (Js.Date.getFullYear d) * 10000
  + (int_of_float (Js.Date.getMonth d) + 1) * 100
  + int_of_float (Js.Date.getDate d)

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
let short_date_of_ts ts =
  let d = Js.Date.fromFloat ts in
  let month = int_of_float (Js.Date.getMonth d) in
  let month =
    if month >= 0 && month < Array.length month_abbr then
      month_abbr.(month)
    else ""
  in
  let day = int_of_float (Js.Date.getDate d) in
  let year = int_of_float (Js.Date.getFullYear d) in
  Printf.sprintf "%s %d, %d" month day year

(* d + delta days *)
let add_days (d : Js.Date.t) delta =
  Js.Date.fromFloat (Js.Date.getTime d +. float_of_int delta *. 86400000.)
