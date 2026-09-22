let now_ms () = Unix.gettimeofday () *. 1000.
let monotonic_ms () = Unix.gettimeofday () *. 1000.

let today_int () =
  let t = Unix.localtime (Unix.time ()) in
  ((t.Unix.tm_year + 1900) * 10000) + ((t.Unix.tm_mon + 1) * 100) + t.Unix.tm_mday

let localtime_ms ms =
  let t = Unix.localtime (ms /. 1000.) in
  ( t.Unix.tm_year + 1900,
    t.Unix.tm_mon + 1,
    t.Unix.tm_mday,
    t.Unix.tm_hour,
    t.Unix.tm_min )

let iso_string_ms ms =
  let secs = ms /. 1000. in
  let t = Unix.gmtime secs in
  let millis = int_of_float ((secs -. Float.of_int (int_of_float secs)) *. 1000.) in
  Printf.sprintf "%04d-%02d-%02dT%02d:%02d:%02d.%03dZ"
    (t.Unix.tm_year + 1900) (t.Unix.tm_mon + 1) t.Unix.tm_mday
    t.Unix.tm_hour t.Unix.tm_min t.Unix.tm_sec millis
