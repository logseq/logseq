(* A pull-driven bridge from Httpun/Eio to worker effects. Each read requests
   exactly one chunk; resolving an effect may resume its caller on any thread. *)
type read_request = Read of string option Db_worker_effect.resolver * read_request Eio.Promise.t

let send_stream ~url ~method_ ~headers ~body consume =
  let task, resolver = Db_worker_effect.wait () in
  let run () =
    try
      let exception Finished in
      let result_value = ref None in
      (try Eio_run.run (fun env ->
        Eio.Switch.run (fun sw ->
          let clock = Eio.Stdenv.clock env in
          let host, target, transport = Eio.Time.with_timeout_exn clock 30.
              (fun () -> Net_eio.connect_flow ~env ~sw url) in
          let last_io = ref (Eio.Time.now clock) in
          let flow = { Net_eio.read = (fun chunk ->
              let count = transport.Net_eio.read chunk in
              last_io := Eio.Time.now clock; count)
            ; write = (fun chunks -> transport.write chunks; last_io := Eio.Time.now clock)
            (* Httpun closes its writer after a Connection: close request.
               Keep the socket open until its response finishes: Node HTTP
               servers can close a half-open request before async handlers reply. *)
            ; shutdown = (function `Send -> () | direction -> transport.shutdown direction)
            ; close = transport.close } in
          let completed, complete = Eio.Promise.create () in
          let mutex = Mutex.create () in
          let terminal = ref None in
          let pending = ref None in
          let first_request, first_resolver = Eio.Promise.create () in
          let request_resolver = ref first_resolver in
          let finish result = ignore (Eio.Promise.try_resolve complete result) in
          let fail error =
            Mutex.lock mutex;
            terminal := Some (Error error);
            let waiting = !pending in pending := None;
            Mutex.unlock mutex;
            Option.iter (fun r -> Db_worker_effect.reject r error) waiting;
            finish (Error error) in
          let read () =
            Mutex.lock mutex;
            let result = match !terminal, !pending with
              | Some (Ok ()), _ -> Db_worker_effect.pure None
              | Some (Error error), _ -> Db_worker_effect.error error
              | None, Some _ -> Db_worker_effect.error (Invalid_argument "HTTP stream: concurrent reads")
              | None, None ->
                  let chunk, chunk_resolver = Db_worker_effect.wait () in
                  let next, next_resolver = Eio.Promise.create () in
                  pending := Some chunk_resolver;
                  let current = !request_resolver in
                  request_resolver := next_resolver;
                  Eio.Promise.resolve current (Read (chunk_resolver, next));
                  chunk in
            Mutex.unlock mutex; result in
          let connection = Httpun.Client_connection.create () in
          let response_handler response reader =
            Eio.Fiber.fork ~sw (fun () ->
              let rec supply request =
                let Read (chunk_resolver, next) = Eio.Promise.await request in
                let received, receive = Eio.Promise.create () in
                Httpun.Body.Reader.schedule_read reader
                  ~on_read:(fun chunk ~off ~len ->
                    Eio.Promise.resolve receive (Some (Bigstringaf.substring chunk ~off ~len)))
                  ~on_eof:(fun () -> Eio.Promise.resolve receive None);
                let chunk = Eio.Promise.await received in
                Mutex.lock mutex;
                pending := None;
                if chunk = None then terminal := Some (Ok ());
                Mutex.unlock mutex;
                Db_worker_effect.wakeup chunk_resolver chunk;
                if chunk <> None then supply next in
              supply first_request);
            try
              Db_worker_effect.on_any
                (consume (Httpun.Status.to_code response.Httpun.Response.status)
                   (Httpun.Headers.to_list response.headers) read)
                (fun value -> finish (Ok value)) fail
            with error -> fail error in
          let error_handler = function
            | `Malformed_response message -> fail (Failure ("Http: malformed response: " ^ message))
            | `Invalid_response_body_length _ -> fail (Failure "Http: invalid response body length")
            | `Exn error -> fail error in
          let headers = match body with
            | Some payload when not (List.exists (fun (name, _) ->
                List.mem (String.lowercase_ascii name) ["content-length"; "transfer-encoding"]) headers) ->
                ("content-length", string_of_int (String.length payload)) :: headers
            | _ -> headers in
          let security, _, port, _ = Net_eio.parse_url url in
          let authority =
            if (security = `Plain && port = 80) || (security = `Tls && port = 443) then host
            else host ^ ":" ^ string_of_int port in
          let request = Httpun.Request.create
              ~headers:(Httpun.Headers.of_list (("host", authority) :: ("connection", "close") :: headers))
              (Httpun.Method.of_string method_) target in
          let writer = Httpun.Client_connection.request connection request ~error_handler ~response_handler in
          Option.iter (Httpun.Body.Writer.write_string writer) body;
          Httpun.Body.Writer.close writer;
          Eio.Fiber.fork ~sw (fun () ->
            try Net_eio.pump (module Httpun.Client_connection) connection flow
            with error -> fail error);
          let result = Eio.Fiber.first
              (fun () -> Eio.Promise.await completed)
              (fun () ->
                let rec watch () =
                  Eio.Time.sleep clock 1.;
                  if Eio.Time.now clock -. !last_io > 300. then
                    Error (Failure "Http: request timed out")
                  else watch () in
                watch ()) in
          (* Cancel waiting reader fibers before leaving the connection scope. *)
          result_value := Some result;
          flow.close ();
          raise Finished)) with Finished -> ());
      match Option.get !result_value with
      | Ok value -> Db_worker_effect.wakeup resolver value
      | Error error -> Db_worker_effect.reject resolver error
    with error -> Db_worker_effect.reject resolver error in
  ignore (Thread.create run ());
  task
