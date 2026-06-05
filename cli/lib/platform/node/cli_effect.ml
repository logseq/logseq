type 'a t = 'a Lwt.t

let pure = Lwt.return
let error = Lwt.fail
let map = Lwt.map
let map_s = Lwt_list.map_s
let bind = Lwt.bind
let ( >>= ) = bind
let both = Lwt.both
let all = Lwt.all
let catch value handler = Lwt.catch (fun () -> value) handler
let finally value f = Lwt.finalize (fun () -> value) f
let of_lwt value = value
let to_lwt value = value
let sleep span = Js_of_ocaml_lwt.Lwt_js.sleep (Ptime.Span.to_float_s span)
