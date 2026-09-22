let now_ms () = Unix.gettimeofday () *. 1000.
let monotonic_ms () = Unix.gettimeofday () *. 1000.

let today_int () =
  let t = Unix.localtime (Unix.time ()) in
  ((t.Unix.tm_year + 1900) * 10000) + ((t.Unix.tm_mon + 1) * 100) + t.Unix.tm_mday
