(* Month-grid date picker — cljs ui/nlp-calendar contract:
   cells carry role="gridcell" with an inner <button>; the selected day
   (today by default) gets aria-selected="true". Picking a day calls
   [on_pick day] with the journal YYYYMMDD int and closes the popup. *)

open Editor_dom
open Properties_dom

let days_in_month ~year ~month0 =
  (* day 0 of next month = last day of this month *)
  let d =
    Js.Date.fromFloat
      (Js.Date.utc ~year:(float year) ~month:(float (month0 + 1))
         ~date:0. ())
  in
  int_of_float (Js.Date.getUTCDate d)

let first_weekday ~year ~month0 =
  let d =
    Js.Date.fromFloat
      (Js.Date.utc ~year:(float year) ~month:(float month0) ~date:1. ())
  in
  int_of_float (Js.Date.getUTCDay d)

(* one gridcell per day; cells live flat inside role=grid *)
let day_cell ~today ~on_pick day =
  let cell =
    mk ~cls:"ui__calendar-cell" "div"
      ~attrs:
        [ ("role", "gridcell")
        ; ("aria-selected", if day = today then "true" else "false")
        ]
  in
  let btn = mk ~cls:"ui__calendar-day" "button" ~attrs:[ ("type", "button") ] in
  el_set_text btn (string_of_int (day mod 100));
  el_listen btn "click" (fun _ev -> on_pick day) false;
  el_append_child cell btn;
  cell

let grid ~on_pick =
  let now = Js.Date.make () in
  let today = Properties_value.today_day () in
  let year = int_of_float (Js.Date.getFullYear now) in
  let month0 = int_of_float (Js.Date.getMonth now) in
  let wrap = mk ~cls:"ui__calendar" "div" in
  el_set_attr wrap "role" "grid";
  let lead = first_weekday ~year ~month0 in
  for _ = 1 to lead do
    (* leading padding keeps the weekday columns aligned *)
    el_append_child wrap (mk ~cls:"ui__calendar-pad" "div" ~attrs:[])
  done;
  let n = days_in_month ~year ~month0 in
  for i = 1 to n do
    let day = (year * 10000) + ((month0 + 1) * 100) + i in
    el_append_child wrap (day_cell ~today ~on_pick day)
  done;
  wrap

(* open the calendar anchored under [anchor]; [on_pick] receives the
   picked journal day (YYYYMMDD) — popup closes after the pick *)
let open_anchored anchor ~on_pick =
  ignore
    (Properties_popup.open_anchored ~cls:"ui__popover-content" anchor
       (grid ~on_pick:(fun day ->
            Properties_state.pop_overlay ();
            on_pick day)))
