(* Node http server — node-only per the port rules. *)
type server = unit
type req = unit
type res = unit

let create _ = invalid_arg "Http_server: unsupported on native"
let disable_timeouts _ = invalid_arg "Http_server: unsupported on native"
let listen _ ~port:_ ~host:_ = invalid_arg "Http_server: unsupported on native"
let address_port _ = invalid_arg "Http_server: unsupported on native"
let close _ = invalid_arg "Http_server: unsupported on native"
let req_method _ = invalid_arg "Http_server: unsupported on native"
let req_url _ = invalid_arg "Http_server: unsupported on native"
let on_close _ _ = invalid_arg "Http_server: unsupported on native"
let read_body _ = invalid_arg "Http_server: unsupported on native"
let read_body_buffer _ = invalid_arg "Http_server: unsupported on native"
let write_head _ ~status:_ ~headers:_ = invalid_arg "Http_server: unsupported on native"
let write _ _ = invalid_arg "Http_server: unsupported on native"
let res_end _ = invalid_arg "Http_server: unsupported on native"
