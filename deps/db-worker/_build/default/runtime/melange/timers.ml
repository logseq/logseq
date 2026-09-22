type timer =
  | Timeout of Js.Global.timeoutId
  | Interval of Js.Global.intervalId

let set_timeout ms f = Timeout (Js.Global.setTimeout ~f ms)
let set_interval ms f = Interval (Js.Global.setInterval ~f ms)

let clear = function
  | Timeout id -> Js.Global.clearTimeout id
  | Interval id -> Js.Global.clearInterval id
