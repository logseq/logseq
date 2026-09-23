let now_ms () = Js.Date.now ()

type perf

external performance_ : perf Js.Undefined.t = "performance"
  [@@mel.scope "globalThis"]

external perf_now_ : perf -> float = "now" [@@mel.send]

(* cljs perf-time-ms — performance.now() when available else Date.now() *)
let monotonic_ms () =
  match Js.Undefined.toOption performance_ with
  | Some p -> perf_now_ p
  | None -> Js.Date.now ()

let today_int () =
  let d = Js.Date.make () in
  let year = int_of_float (Js.Date.getFullYear d) in
  let month = int_of_float (Js.Date.getMonth d) + 1 in
  let day = int_of_float (Js.Date.getDate d) in
  (year * 10000) + (month * 100) + day

let localtime_ms ms =
  let d = Js.Date.fromFloat ms in
  ( int_of_float (Js.Date.getFullYear d),
    int_of_float (Js.Date.getMonth d) + 1,
    int_of_float (Js.Date.getDate d),
    int_of_float (Js.Date.getHours d),
    int_of_float (Js.Date.getMinutes d) )

let iso_string_ms ms =
  Js.Date.toISOString (Js.Date.fromFloat ms)
