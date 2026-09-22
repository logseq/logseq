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
