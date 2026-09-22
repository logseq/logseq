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
  let d = Js.Date.fromFloat (Int64.to_float ms) in
  { year = int_of_float (Js.Date.getFullYear d)
  ; month = int_of_float (Js.Date.getMonth d) + 1
  ; day = int_of_float (Js.Date.getDate d)
  ; hour = int_of_float (Js.Date.getHours d)
  ; minute = int_of_float (Js.Date.getMinutes d)
  ; second = int_of_float (Js.Date.getSeconds d)
  ; ms = int_of_float (Js.Date.getMilliseconds d)
  }

let to_epoch_ms c =
  let d =
    Js.Date.make ~year:(float_of_int c.year) ~month:(float_of_int (c.month - 1))
      ~date:(float_of_int c.day) ~hours:(float_of_int c.hour)
      ~minutes:(float_of_int c.minute) ~seconds:(float_of_int c.second) ()
  in
  let _ = Js.Date.setMilliseconds ~milliseconds:(float_of_int c.ms) d in
  Int64.of_float (Js.Date.getTime d)
