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

(* One HTTP/1.1 request per connection, on a dedicated eio loop thread —
   same as the cljs fetch+single-request model this replaces. *)
let fetch (req : request) : response =
  Eio_posix.run (fun env ->
    Eio.Switch.run (fun sw ->
      let host, target, flow = Net_eio.connect_flow ~env ~sw req.url in
      let conn = Httpun.Client_connection.create () in
      let done_p, done_u = Eio.Promise.create () in
      let status = ref 0 in
      let resp_headers = ref [] in
      let body_buf = Buffer.create 4096 in
      let error_ref = ref None in
      let response_handler (resp : Httpun.Response.t) body =
        status := Httpun.Status.to_code resp.Httpun.Response.status;
        resp_headers := Httpun.Headers.to_list resp.Httpun.Response.headers;
        let rec drain () =
          Httpun.Body.Reader.schedule_read
            body
            ~on_read:(fun b ~off ~len ->
              Buffer.add_string body_buf (Bigstringaf.substring b ~off ~len);
              drain ())
            ~on_eof:(fun () -> Eio.Promise.resolve done_u ())
        in
        drain ()
      in
      let error_handler e =
        error_ref := Some (Some e);
        Eio.Promise.resolve done_u ()
      in
      let meth = Httpun.Method.of_string req.method_ in
      let headers =
        Httpun.Headers.of_list (("host", host) :: ("connection", "close") :: req.headers)
      in
      let req' =
        Httpun.Request.create ~headers meth target
      in
      let writer =
        Httpun.Client_connection.request conn req' ~error_handler ~response_handler
      in
      Option.iter (fun b -> Httpun.Body.Writer.write_string writer b) req.body;
      Httpun.Body.Writer.close writer;
      Eio.Fiber.fork ~sw (fun () ->
        try Net_eio.pump (module Httpun.Client_connection) conn flow
        with
        | exn ->
            Httpun.Client_connection.report_exn conn exn);
      Eio.Promise.await done_p;
      flow.close ();
      match !error_ref with
      | Some (Some (`Malformed_response m)) ->
          failwith ("Http: malformed response: " ^ m)
      | Some (Some (`Invalid_response_body_length _)) ->
          failwith "Http: invalid response body length"
      | Some (Some (`Exn e)) -> raise e
      | Some None -> assert false
      | None ->
          { status = !status
          ; headers = !resp_headers
          ; body = Buffer.contents body_buf
          }))

let real_send (req : request) : response Db_worker_effect.t =
  let task, resolver = Db_worker_effect.wait () in
  ignore
    (Thread.create
       (fun () ->
          try Db_worker_effect.wakeup resolver (fetch req)
          with
          | exn -> Db_worker_effect.reject resolver exn)
       ());
  task

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
