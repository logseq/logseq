(* Real owned-worker update protocol in a new, contained fixture process. The
   Python driver supplies only private storage and an explicit native worker. *)
let check label condition = if not condition then failwith label
let seconds () = Int64.to_float (Mtime_clock.elapsed_ns ()) *. 1e-9
let await promise =
  let deadline = seconds () +. 45. in
  let rec wait () =
    Host.drain ();
    match promise.Js.Promise.state with
    | Js.Promise.Resolved value -> value
    | Js.Promise.Rejected error -> raise error
    | Js.Promise.Pending ->
        if seconds () >= deadline then failwith "Owned-worker fixture operation timed out";
        Thread.delay 0.005;
        wait () in
  wait ()
let background action =
  let promise, resolve, reject = Js.Promise.pending () in
  ignore (Thread.create (fun () ->
    try let value = action () in Host.enqueue (fun () -> resolve value)
    with error -> Host.enqueue (fun () -> reject error)) ());
  promise
let event name fields =
  Yojson.Safe.to_string (`Assoc (("event", `String name)::fields)) |> print_endline;
  flush stdout
let gate expected = check ("Expected private fixture gate: " ^ expected) (read_line ()=expected)
let within root path =
  let root = Unix.realpath root and path = Unix.realpath path in
  path<>root && String.starts_with ~prefix:(root ^ Filename.dir_sep) path
let fetch origin =
  let deadline = seconds () +. 15. in
  let rec ready () =
    match Daemon_client.http_get ~port:origin.Daemon_client.port ~path:"/healthz" with
    | Some (200, body) -> body
    | Some (status, _) when status<>503 -> failwith "Actual worker health refused its startup"
    | Some _ | None ->
        if seconds () >= deadline then failwith "Actual worker never became ready";
        Thread.delay 0.01; ready () in
  ready ()
let attach repo = await (background (fun () ->
  ignore (Daemon_client.ensure_attached repo);
  let storage = Daemon_client.attachment_key repo in
  let origin =
    Mutex.lock Daemon_client.attach_mu;
    Fun.protect ~finally:(fun () -> Mutex.unlock Daemon_client.attach_mu) (fun () ->
      match Hashtbl.find_opt Daemon_client.update_workers storage with
      | Some (Some origin) -> origin
      | _ -> failwith "Fixture must own the actual newly spawned worker") in
  Daemon_client.inspect_update_worker ~key:storage ~origin (fetch origin)))
let post (worker : Daemon_client.update_worker) name arguments =
  await (background (fun () ->
    Daemon_client.http_post_with_timeout ~timeout:(Some 10.) ~host:"127.0.0.1"
      ~port:worker.Daemon_client.origin.port ~path:"/v1/invoke"
      ~body:(Yojson.Safe.to_string (`Assoc ["method", `String name;
        "argsTransit", `String (Transit.to_string (Wire.Array arguments))]))))
let invoke worker name arguments =
  let status, body = post worker name arguments in
  let fields = match Yojson.Safe.from_string body with `Assoc fields -> fields
    | _ -> failwith "Actual worker invoke returned invalid JSON" in
  check ("Actual worker invoke failed: " ^ name ^ " " ^ body)
    (status=200 && List.assoc_opt "ok" fields=Some (`Bool true));
  match List.assoc_opt "resultTransit" fields with
  | Some (`String value) -> Transit.of_string value
  | _ -> failwith "Actual worker omitted its invoke result"
let metadata (worker : Daemon_client.update_worker) =
  let _, graphs, lifecycle, repo = worker.Daemon_client.storage in
  let encoded = Daemon_client.encode_graph repo in
  let graph = Unix.realpath (Filename.concat graphs encoded) in
  let ticket = match worker.ticket with Some ticket -> ticket
    | None -> failwith "Actual worker has no graph admission ticket" in
  [ "pid", `Int worker.origin.pid; "port", `Int worker.origin.port;
    "instance", `String worker.origin.instance; "graph", `String graph;
    "runtime", `String (Filename.concat (Filename.concat lifecycle encoded)
      ("runtime-" ^ ticket ^ ".json")) ]
let start_stream (worker : Daemon_client.update_worker) =
  let ready, resolve, reject = Js.Promise.pending () in
  let done_ = Atomic.make false in
  ignore (Thread.create (fun () ->
    let fd = Unix.socket ~cloexec:true Unix.PF_INET Unix.SOCK_STREAM 0 in
    let input = Unix.in_channel_of_descr fd in
    Fun.protect ~finally:(fun () -> close_in_noerr input; Atomic.set done_ true) (fun () ->
      try
        Unix.connect fd (Unix.ADDR_INET (Unix.inet_addr_loopback, worker.origin.port));
        let request = Printf.sprintf
          "GET /v1/events HTTP/1.1\r\nHost: 127.0.0.1:%d\r\nConnection: close\r\n%s\r\n"
          worker.origin.port Daemon_client.app_session_header in
        let rec write offset = if offset<String.length request then
          match Unix.write_substring fd request offset (String.length request-offset) with
          | 0 -> failwith "Actual SSE socket closed during setup"
          | count -> write (offset+count)
          | exception Unix.Unix_error (Unix.EINTR, _, _) -> write offset in
        write 0;
        let status = input_line input in
        check "Actual worker accepts an owned SSE connection"
          (match String.split_on_char ' ' status with _::"200"::_ -> true | _ -> false);
        let rec headers stream =
          match String.trim (input_line input) |> String.lowercase_ascii with
          | "" -> stream
          | header -> headers (stream || header="content-type: text/event-stream") in
        check "SSE liveness probe receives a real event stream" (headers false);
        Host.enqueue resolve;
        (try while true do ignore (input_char input) done with End_of_file -> ())
      with error -> Host.enqueue (fun () -> reject error))) ());
  await ready;
  check "SSE connection remains open beyond its finite setup" (not (Atomic.get done_));
  done_
let assert_stream_closed done_ =
  let deadline = seconds () +. 3. in
  while not (Atomic.get done_) do
    if seconds () >= deadline then failwith "Actual worker left its SSE connection alive after stop";
    Thread.delay 0.005
  done
let stop request_id (worker : Daemon_client.update_worker) =
  let update = await (Daemon_client.Worker_update.create ~request_id worker) in
  await (Daemon_client.Worker_update.seal update);
  await (Daemon_client.Worker_update.stop update);
  check "Only independently proven clean child exit completes stop"
    (Daemon_client.Worker_update.phase update=Daemon_client.Worker_exited);
  check "Stopped worker no longer serves health"
    (Daemon_client.http_get ~port:worker.origin.port ~path:"/healthz"=None);
  update
let run () =
  gate "start";
  let private_root = Sys.getenv "LOGSEQ_TEST_PRIVATE_ROOT" in
  List.iter (fun name -> check ("Fixture storage must remain private: " ^ name)
    (within private_root (Sys.getenv name)))
    ["HOME";"LOGSEQ_ROOT_DIR";"LOGSEQ_GRAPHS_DIR";"LOGSEQ_UI_STATE_DIR"];
  check "Fixture cannot install a login-resident daemon" (Sys.getenv "LOGSEQ_NO_LOGIN_DAEMON"="1");
  check "Contained fixture begins without any inherited worker ownership"
    (Hashtbl.length Daemon_client.spawned_children=0);
  let repo = "logseq_db_owned_update_fixture" in
  let first = attach repo in
  check "Actual child uses the explicitly selected native worker"
    (first.origin.executable=Unix.realpath (Sys.getenv "LOGSEQ_DB_WORKER_BIN"));
  ignore (invoke first "thread-api/create-or-open-db" [Wire.String repo; Wire.Map []]);
  let uuid = Host.random_uuid () and title = "Owned worker durable update fixture" in
  let now = Wire.Int64 (Int64.of_float (Unix.gettimeofday () *. 1000.)) in
  let page = Wire.Map [Wire.Keyword "block/uuid", Wire.Uuid uuid;
    Wire.Keyword "block/title", Wire.String title;
    Wire.Keyword "block/name", Wire.String "owned-worker-durable-update-fixture";
    Wire.Keyword "block/tags", Wire.Set [Wire.Keyword "logseq.class/Page"];
    Wire.Keyword "block/created-at", now; Wire.Keyword "block/updated-at", now] in
  ignore (invoke first "thread-api/transact" [Wire.String repo; Wire.Array [page]; Wire.Map []; Wire.Nil]);
  let query worker = invoke worker "thread-api/q" [Wire.String repo; Wire.Array [
    Wire.String "[:find ?title . :in $ ?uuid :where [?e :block/uuid ?uuid] [?e :block/title ?title]]";
    Wire.Uuid uuid]] in
  check "Real finite graph mutation is readable before sealing" (query first=Wire.String title);
  let stream = start_stream first in
  event "opened" (metadata first);
  gate "continue";
  let cancelled = await (Daemon_client.Worker_update.create ~request_id:"1" first) in
  await (Daemon_client.Worker_update.seal cancelled);
  let status, body = post first "thread-api/list-db" [] in
  check "Actual sealed worker rejects later normal work" (status=409);
  check "Actual admission refusal carries the specific wire code"
    (match Yojson.Safe.from_string body with
     | `Assoc fields -> (match List.assoc_opt "error" fields with
         | Some (`Assoc error) -> List.assoc_opt "code" error=Some (`String "worker-update-sealed")
         | _ -> false)
     | _ -> false);
  await (Daemon_client.Worker_update.abort cancelled);
  check "Abort is acknowledged before reopening the fixture"
    (Daemon_client.Worker_update.phase cancelled=Daemon_client.Worker_released);
  ignore (invoke first "thread-api/list-db" []);
  check "The real graph remains readable after abort" (query first=Wire.String title);
  event "aborted" (metadata first);
  gate "continue";
  check "SSE liveness remains active immediately before stop" (not (Atomic.get stream));
  let stopped = stop "2" first in
  assert_stream_closed stream;
  event "stopped" (metadata first);
  gate "continue";
  let old_base = Hashtbl.find Daemon_client.attached first.storage in
  Hashtbl.replace Daemon_client.attached first.storage "http://127.0.0.1:1";
  (try
     await (Daemon_client.Worker_update.restore_exited stopped);
     failwith "Restoration must not overwrite a newer attachment"
   with Failure message -> check "a changed attachment refuses before restarting a child"
     (message="Worker restoration would replace a different attachment"));
  check "refused restoration leaves the conflicting endpoint intact"
    (Hashtbl.find Daemon_client.attached first.storage="http://127.0.0.1:1"
     && Hashtbl.length Daemon_client.spawned_children=1);
  Hashtbl.replace Daemon_client.attached first.storage old_base;
  await (Daemon_client.Worker_update.restore_exited stopped);
  let reopened = attach repo in
  await (Daemon_client.Worker_update.restore_exited stopped);
  check "repeating restoration verifies the exact replacement without another child"
    (Hashtbl.length Daemon_client.spawned_children=2);
  let replacement_child = Hashtbl.find Daemon_client.spawned_children reopened.origin.instance in
  let previous_child = Hashtbl.find Daemon_client.spawned_children first.origin.instance in
  Hashtbl.replace Daemon_client.spawned_children reopened.origin.instance
    {replacement_child with process=previous_child.process};
  (try
     await (Daemon_client.Worker_update.restore_exited stopped);
     failwith "Restoration must retain its exact replacement child token"
   with Failure message -> check "a replacement-token conflict refuses without process adoption"
     (message="Restored worker lost its exact captured child"));
  Hashtbl.replace Daemon_client.spawned_children reopened.origin.instance replacement_child;
  await (Daemon_client.Worker_update.restore_exited stopped);
  check "restoration retries preserve the owned replacement endpoint and child count"
    (Hashtbl.find Daemon_client.attached first.storage=
       Printf.sprintf "http://127.0.0.1:%d" reopened.origin.port
     && Hashtbl.length Daemon_client.spawned_children=2);
  let snapshot = await (Daemon_client.capture_update_workers ()) in
  check "captured update workers expose the ready replacement origin"
    (List.exists (fun (worker : Daemon_client.update_worker) -> worker.origin=reopened.origin) snapshot);
  check "Durability probe starts a new actual child instance"
    (reopened.origin.instance<>first.origin.instance);
  check "The finite graph mutation survives stop and a fresh worker process"
    (query reopened=Wire.String title);
  event "reopened" (metadata reopened);
  gate "continue";
  ignore (stop "3" reopened);
  check "Only the two deliberately spawned worker instances exist in this fixture"
    (Hashtbl.length Daemon_client.spawned_children=2);
  event "closed" (metadata reopened);
  gate "exit"
let () =
  try run ()
  with error ->
    event "error" ["error", `String (Printexc.to_string error)];
    (* Keep the owning group leader alive until the driver controls its exact
       new process group/Job. No test cleanup looks up a user daemon PID. *)
    (try ignore (read_line ()) with End_of_file -> ());
    exit 1
