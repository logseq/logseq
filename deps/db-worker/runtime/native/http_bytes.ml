type request =
  { url : string
  ; method_ : string
  ; headers : (string * string) list
  ; body : string option
  }

type response =
  { status : int
  ; headers : (string * string) list
  ; body : string
  }

let req_to_hooks (r : request) : Native_test_hooks.http_req =
  { Native_test_hooks.url = r.url; method_ = r.method_
  ; headers = r.headers; body = r.body }

let resp_of_hooks (r : Native_test_hooks.http_resp) : response =
  { status = r.status; headers = r.headers; body = r.body }

let real_send (_ : request) : response Db_worker_effect.t =
  Db_worker_effect.error (Failure "Http_bytes: not implemented on native yet")

(* Test driver: tests rebind this like the cljs js/fetch stub. *)
let send_impl = ref real_send

let send req = !send_impl req

let send_stream _ _ =
  Db_worker_effect.error (Failure "Http_bytes: not implemented on native yet")

let () =
  Native_test_hooks.install_http_bytes_fn := (fun sb ->
      send_impl := (fun req ->
        Db_worker_effect.bind (sb (req_to_hooks req)) (fun body ->
            Db_worker_effect.pure { status = 200; headers = []; body })));
  Native_test_hooks.restore_http_bytes_fn := (fun () ->
      send_impl := real_send)
