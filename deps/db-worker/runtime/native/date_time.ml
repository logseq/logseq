type civil =
  { year : int
  ; month : int
  ; day : int
  ; hour : int
  ; minute : int
  ; second : int
  ; ms : int
  }

let of_epoch_ms ms =
  let tm = Unix.localtime (Int64.to_float ms /. 1000.) in
  { year = tm.Unix.tm_year + 1900
  ; month = tm.Unix.tm_mon + 1
  ; day = tm.Unix.tm_mday
  ; hour = tm.Unix.tm_hour
  ; minute = tm.Unix.tm_min
  ; second = tm.Unix.tm_sec
  ; ms = Int64.(to_int (rem (add (rem ms 1000L) 1000L) 1000L))
  }

let to_epoch_ms c =
  let tm =
    { Unix.tm_sec = c.second
    ; tm_min = c.minute
    ; tm_hour = c.hour
    ; tm_mday = c.day
    ; tm_mon = c.month - 1
    ; tm_year = c.year - 1900
    ; tm_wday = 0
    ; tm_yday = 0
    ; tm_isdst = false
    }
  in
  let secs, _ = Unix.mktime tm in
  Int64.of_float (secs *. 1000. +. float_of_int c.ms)
