type event =
  | Open
  | Message of string
  | Binary of string
  | Close of int * string
  | Error of string

type cmd =
  [ `Text of string
  | `Binary of string
  | `Close ]

type t =
  { mutable state : int (* readyState: 0 connecting, 1 open, 2 closing, 3 closed *)
  ; mutable wsd : Httpun_ws.Wsd.t option
  ; cmds : cmd Queue.t
  ; cmds_mutex : Mutex.t
  ; wake : Unix.file_descr (* self-pipe writer; any thread may poke it *)
  ; mutable wake_open : bool
  }

(* The wake-fd check and write stay under cmds_mutex together with
   [finish]'s close, so a wake byte can never land on a reused fd. *)
let enqueue t cmd =
  if t.state < 3 then begin
    Mutex.lock t.cmds_mutex;
    (if t.wake_open then (
       Queue.push cmd t.cmds;
       (try ignore (Unix.write_substring t.wake "x" 0 1) with _ -> ())));
    Mutex.unlock t.cmds_mutex
  end

let take_cmds t =
  Mutex.lock t.cmds_mutex;
  let xs = List.rev (Queue.fold (fun acc x -> x :: acc) [] t.cmds) in
  Queue.clear t.cmds;
  Mutex.unlock t.cmds_mutex;
  xs

(* Teardown: mark closed and close the self-pipe writer (under
   cmds_mutex, matching [enqueue]) so [command_loop]'s read gets EOF and
   the eio loop (and its thread) can exit. *)
let finish t =
  Mutex.lock t.cmds_mutex;
  t.state <- 3;
  if t.wake_open then begin
    t.wake_open <- false;
    (try Unix.close t.wake with _ -> ())
  end;
  Mutex.unlock t.cmds_mutex

(* [send_bytes] copies into the connection's Faraday and mutates the bytes
   for client masking — must only run on the eio domain. *)
let send_cmd wsd = function
  | `Text s ->
      Httpun_ws.Wsd.send_bytes wsd ~kind:`Text ~off:0 ~len:(String.length s)
        (Bytes.of_string s)
  | `Binary s ->
      Httpun_ws.Wsd.send_bytes wsd ~kind:`Binary ~off:0 ~len:(String.length s)
        (Bytes.of_string s)
  | `Close -> Httpun_ws.Wsd.close wsd

(* Runs inside the eio domain: waits for a poke on the pipe, then applies
   queued commands on the eio-owned [Wsd.t]. Exits on pipe EOF (writer
   closed by [finish]) or any IO error. *)
let rec command_loop t (src : _ Eio.Flow.source) =
  let buf = Cstruct.create 64 in
  match
    (try Some (Eio.Flow.single_read src buf) with _ -> None)
  with
  | None -> ()
  | Some _n ->
      let cmds = take_cmds t in
      (match t.wsd with
       | Some wsd ->
           List.iter
             (fun cmd -> try send_cmd wsd cmd with _ -> ())
             cmds
       | None -> ());
      (match List.exists (fun c -> c = `Close) cmds with
       | true -> ()
       | false -> command_loop t src)

(* A server that accepts TCP but never completes the WS handshake would
   otherwise leave [connect] pending forever — bound the whole setup
   (DNS/TCP/TLS/handshake) so sync can schedule a reconnect. *)
let connect_timeout_s = 30.

let connect ~url ~on_event =
  let task, resolver = Db_worker_effect.wait () in
  let pipe_r, pipe_w = Unix.pipe ~cloexec:true () in
  let ws =
    { state = 0
    ; wsd = None
    ; cmds = Queue.create ()
    ; cmds_mutex = Mutex.create ()
    ; wake = pipe_w
    ; wake_open = true
    }
  in
  let resolved = ref false in
  let fail msg =
    ws.state <- 3;
    if !resolved
    then on_event (Error msg)
    else (
      resolved := true;
      Db_worker_effect.reject resolver (Failure msg))
  in
  let close_sent = ref false in
  let emit_close code =
    if not !close_sent then begin
      close_sent := true;
      on_event (Close (code, ""))
    end
  in
  let setup_failure = ref None in
  let run () =
    try
      Eio_posix.run (fun env ->
        Eio.Switch.run (fun sw ->
          let clock = Eio.Stdenv.clock env in
          Eio.Fiber.fork ~sw (fun () ->
            Eio.Time.sleep clock connect_timeout_s;
            if not !resolved then begin
              setup_failure := Some "websocket: connect timed out";
              Eio.Switch.fail sw (Failure "websocket: connect timed out")
            end);
          let host, target, flow = Net_eio.connect_flow ~env ~sw url in
          Lazy.force Net_eio.rng_init;
          let nonce = Mirage_crypto_rng.generate 16 in
          let sha1 s = Digestif.SHA1.(to_raw_string (digest_string s)) in
          let headers = Httpun.Headers.of_list [ "host", host ] in
          let error_handler = function
            | `Handshake_failure (resp, _body) ->
                fail
                  (Printf.sprintf
                     "websocket handshake rejected: %s"
                     (Httpun.Status.to_string resp.Httpun.Response.status))
            | `Malformed_response m -> fail ("websocket: " ^ m)
            | `Invalid_response_body_length _ ->
                fail "websocket: invalid handshake body length"
            | `Exn e -> fail (Printexc.to_string e)
          in
          let frag = Buffer.create 256 in
          let frag_kind = ref `Text in
          let websocket_handler wsd =
            ws.wsd <- Some wsd;
            ws.state <- 1;
            resolved := true;
            Db_worker_effect.wakeup resolver ws;
            on_event Open;
            let flush_msg () =
              let s = Buffer.contents frag in
              Buffer.clear frag;
              (match !frag_kind with
               | `Text -> on_event (Message s)
               | `Binary -> on_event (Binary s))
            in
            { Httpun_ws.Websocket_connection.frame =
                (fun ~opcode ~is_fin ~len:_ payload ->
                   match opcode with
                   | `Text | `Binary | `Continuation ->
                       (match opcode with
                        | `Text -> frag_kind := `Text
                        | `Binary -> frag_kind := `Binary
                        | `Continuation
                        | `Connection_close | `Ping | `Pong | `Other _ -> ());
                       let rec read_payload () =
                         Httpun_ws.Payload.schedule_read
                           payload
                           ~on_eof:(fun () -> if is_fin then flush_msg ())
                           ~on_read:(fun b ~off ~len ->
                             Buffer.add_string frag (Bigstringaf.substring b ~off ~len);
                             read_payload ())
                       in
                       read_payload ()
                   | `Connection_close | `Ping | `Pong | `Other _ ->
                       Httpun_ws.Payload.schedule_read payload
                         ~on_eof:(fun () -> ())
                         ~on_read:(fun _ ~off:_ ~len:_ -> ()))
            ; eof =
                (fun ?error:_ () ->
                   finish ws;
                   emit_close 1000)
            }
          in
          let conn =
            Httpun_ws.Client_connection.connect
              ~nonce ~headers ~sha1 ~error_handler ~websocket_handler target
          in
          let cmd_src =
            (Eio_unix.Net.import_socket_stream ~sw ~close_unix:false pipe_r
             :> _ Eio.Flow.source)
          in
          Eio.Fiber.fork ~sw (fun () -> command_loop ws cmd_src);
          (try Net_eio.pump (module Httpun_ws.Client_connection) conn flow
           with _ -> ());
          (* conn ended: unblock the command fiber and release fds *)
          finish ws;
          flow.close ();
          (try Unix.close pipe_r with _ -> ());
          (* Any teardown after the handshake must surface a Close:
             callers reconnect on it, and an abrupt drop emits no Close
             frame from the wire. *)
          if !resolved then emit_close 1006))
    with
    | exn ->
        finish ws;
        (try Unix.close pipe_r with _ -> ());
        (match !setup_failure with
         | Some msg when not !resolved ->
             resolved := true;
             Db_worker_effect.reject resolver (Failure msg)
         | _ ->
             if !resolved then begin
               on_event (Error (Printexc.to_string exn));
               emit_close 1006
             end else (
               resolved := true;
               Db_worker_effect.reject resolver exn))
  in
  ignore (Thread.create (fun () -> run ()) ());
  task

let send t data =
  enqueue t (`Text data);
  Db_worker_effect.pure ()

let send_binary t data =
  enqueue t (`Binary data);
  Db_worker_effect.pure ()

let close t =
  if t.state < 2 then t.state <- 2;
  enqueue t `Close;
  Db_worker_effect.pure ()

let ready_state t = t.state
