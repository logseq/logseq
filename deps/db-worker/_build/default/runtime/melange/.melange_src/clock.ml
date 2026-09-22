let now_ms () = Js.Date.now ()
let monotonic_ms () = Js.Date.now ()

let today_int () =
  let d = Js.Date.make () in
  let year = int_of_float (Js.Date.getFullYear d) in
  let month = int_of_float (Js.Date.getMonth d) + 1 in
  let day = int_of_float (Js.Date.getDate d) in
  (year * 10000) + (month * 100) + day
