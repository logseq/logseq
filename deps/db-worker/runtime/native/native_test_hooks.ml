(* Test-only driver hooks for the native runtime. Not part of the platform
   spec surface — test executables reach it through this module while the
   spec mli keeps implementation details hidden. Shared types live here so
   the impl modules can register themselves without a dependency cycle. *)

type timer_handle = { mutable cancelled : bool }

type http_req =
  { url : string
  ; method_ : string
  ; headers : (string * string) list
  ; body : string option
  }

type http_resp =
  { status : int
  ; headers : (string * string) list
  ; body : string
  }

let install_timers_fn :
    ((int -> (unit -> unit) -> timer_handle) ->
     (int -> (unit -> unit) -> timer_handle) -> unit) ref =
  ref (fun _ _ ->
    failwith "Native_test_hooks.install_timers_fn not installed")

let install_timers ~set_timeout ~set_interval =
  !install_timers_fn set_timeout set_interval

let restore_timers_fn : (unit -> unit) ref =
  ref (fun () -> failwith "Native_test_hooks.restore_timers_fn not installed")

let restore_timers () = !restore_timers_fn ()

let install_http_fn :
    ((http_req -> http_resp Db_worker_effect.t) ->
     (http_req -> string Db_worker_effect.t) -> unit) ref =
  ref (fun _ _ -> failwith "Native_test_hooks.install_http_fn not installed")

let install_http ~send ~send_binary = !install_http_fn send send_binary

let restore_http_fn : (unit -> unit) ref =
  ref (fun () -> failwith "Native_test_hooks.restore_http_fn not installed")

let restore_http () = !restore_http_fn ()

(* Http_bytes keeps its spec interface; it registers into these so the one
   install_http call stubs both Http and Http_bytes. *)
let install_http_bytes_fn :
    ((http_req -> string Db_worker_effect.t) -> unit) ref =
  ref (fun _ -> ())

let restore_http_bytes_fn : (unit -> unit) ref = ref (fun () -> ())
