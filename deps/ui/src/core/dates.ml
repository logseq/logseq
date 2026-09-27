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

(* journal-day int YYYYMMDD (cljs date-time-util/date->int) *)
let journal_day_of (d : Js.Date.t) =
  int_of_float (Js.Date.getFullYear d) * 10000
  + (int_of_float (Js.Date.getMonth d) + 1) * 100
  + int_of_float (Js.Date.getDate d)

let today () = journal_title_of (date_now ())
let today_journal_day () = journal_day_of (date_now ())
