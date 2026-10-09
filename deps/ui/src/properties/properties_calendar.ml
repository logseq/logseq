(* Month-grid date picker — cljs ui/nlp-calendar contract:
   cells carry role="gridcell" with an inner <button>; the selected day
   (today by default) gets aria-selected="true". Picking a day calls
   [on_pick day] with the journal YYYYMMDD int and closes the popup. *)

open Lui_elements

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
let day_cell ~today ~on_pick day : t =
  box ~style_class:"ui__calendar-cell"
    ~data_attrs:
      [ ("role", "gridcell")
      ; ("aria-selected", if day = today then "true" else "false") ]
    [ button ~style_class:"ui__calendar-day"
        ~text:(string_of_int (day mod 100))
        ~on_press:(fun _ -> on_pick day) [] ]

let grid ~on_pick : t =
  let now = Js.Date.make () in
  let today = Properties_value.today_day () in
  let year = int_of_float (Js.Date.getFullYear now) in
  let month0 = int_of_float (Js.Date.getMonth now) in
  let lead = first_weekday ~year ~month0 in
  let n = days_in_month ~year ~month0 in
  box ~style_class:"ui__calendar" ~data_attrs:[ ("role", "grid") ]
    ((* leading padding keeps the weekday columns aligned *)
     List.init lead (fun i -> box ~key:("pad-" ^ string_of_int i) [])
    @ List.init n (fun i ->
          let day = (year * 10000) + ((month0 + 1) * 100) + i + 1 in
          day_cell ~today ~on_pick day))

(* open the calendar anchored under [anchor]; [on_pick] receives the
   picked journal day (YYYYMMDD) — popup closes after the pick *)
let open_anchored anchor ~on_pick =
  ignore
    (Properties_popup.open_anchored ~cls:"ui__popover-content" anchor
       (grid ~on_pick:(fun day ->
            Properties_state.pop_overlay ();
            on_pick day)))
