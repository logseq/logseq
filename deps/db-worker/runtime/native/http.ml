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

let real_send (req : request) : response Db_worker_effect.t =
  Http_transport.send_stream ~url:req.url ~method_:req.method_ ~headers:req.headers ~body:req.body
    (fun status headers read ->
      let output = Buffer.create 4096 in
      let task, resolver = Db_worker_effect.wait () in
      let rec step () =
        Db_worker_effect.on_any (read ())
          (function
            | None -> Db_worker_effect.wakeup resolver { status; headers; body = Buffer.contents output }
            | Some chunk -> Buffer.add_string output chunk; step ())
          (Db_worker_effect.reject resolver) in
      step ();
      task)

let real_send_binary (req : request) : string Db_worker_effect.t =
  Db_worker_effect.map (fun (r : response) -> r.body) (real_send req)

(* Test driver: tests rebind these like the cljs js/fetch stubs. *)
let send_impl = ref real_send
let send_binary_impl = ref real_send_binary

let send req = !send_impl req
let send_binary req = !send_binary_impl req

let () =
  Native_test_hooks.install_http_fn := (fun s sb ->
      send_impl := (fun req ->
        Db_worker_effect.bind (s (req_to_hooks req)) (fun r ->
            Db_worker_effect.pure (resp_of_hooks r)));
      send_binary_impl := (fun req -> sb (req_to_hooks req));
      !Native_test_hooks.install_http_bytes_fn sb);
  Native_test_hooks.restore_http_fn := (fun () ->
      send_impl := real_send; send_binary_impl := real_send_binary;
      !Native_test_hooks.restore_http_bytes_fn ())
