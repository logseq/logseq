(* Real HTTP contracts against the native worker executable in an admitted
   graph. Each launch uses its own process and isolated storage root. *)

module E = Db_worker_effect

type daemon =
  { root : string
  ; repo : string
  ; pid : int
  ; port : int
  ; mutable stopped : bool
  }

let check = Test_shared.check

let await (task : 'a E.t) : 'a =
  let mu = Mutex.create () in
  let result = ref None in
  E.on_any task
    (fun v -> Mutex.lock mu; result := Some (Ok v); Mutex.unlock mu)
    (fun e -> Mutex.lock mu; result := Some (Error e); Mutex.unlock mu);
  let deadline = Unix.gettimeofday () +. 60. in
  let rec poll () =
    Mutex.lock mu;
    let state = !result in
    Mutex.unlock mu;
    match state with
    | Some (Ok v) -> v
    | Some (Error e) -> raise e
    | None when Unix.gettimeofday () < deadline ->
        Thread.delay 0.01;
        poll ()
    | None -> failwith "native worker task timed out"
  in
  poll ()

let root () =
  let path = Filename.temp_file "db-worker-daemon-" "" in
  Sys.remove path;
  Unix.mkdir path 0o700;
  path

let rec remove_tree path =
  match (Unix.lstat path).Unix.st_kind with
  | Unix.S_DIR ->
      Sys.readdir path
      |> Array.iter (fun entry -> remove_tree (Filename.concat path entry));
      Unix.rmdir path
  | _ -> Sys.remove path

let executable () =
  let cwd = Sys.getcwd () in
  let candidates =
    [ Filename.concat cwd "_build/default/bin/main.exe"
    ; Filename.concat cwd "../../bin/main.exe"
    ; Filename.concat cwd "bin/main.exe" ]
  in
  match Sys.getenv_opt "LOGSEQ_DB_WORKER_BIN" with
  | Some path when Sys.file_exists path -> path
  | Some path -> failwith ("native worker executable missing: " ^ path)
  | None ->
      (match List.find_opt Sys.file_exists candidates with
       | Some path -> path
       | None ->
           failwith "build bin/main.exe before running native daemon tests")

let base_url daemon =
  Printf.sprintf "http://127.0.0.1:%d" daemon.port

let http daemon ~method_ ~path ?(content_type = "application/json") ?body () =
  let headers =
    match body with
    | None -> []
    | Some payload ->
        [ "Content-Type", content_type
        ; "Content-Length", string_of_int (String.length payload) ]
  in
  await
    (Http.send
       { Http.url = base_url daemon ^ path
       ; method_; headers; body })

let json_body (response : Http.response) = Json.parse response.body

let get_string key value =
  match Wire.get key value with
  | Some (Wire.String s) -> s
  | _ -> failwith ("missing JSON string: " ^ key)

let get_error response =
  let body = json_body response in
  check "error ok=false" (Wire.get "ok" body = Some (Wire.Bool false));
  match Wire.get "error" body with
  | Some (Wire.Map _ as error) -> error
  | _ -> failwith "missing structured invocation error"

let invoke_raw daemon method_str args =
  let body =
    Json.stringify
      (Wire.Map
         [ Wire.String "method", Wire.String method_str
         ; Wire.String "argsTransit"
         , Wire.String (Transit_codec.to_string (Wire.Array args)) ])
  in
  http daemon ~method_:"POST" ~path:"/v1/invoke" ~body ()

let invoke daemon method_str args =
  let response = invoke_raw daemon method_str args in
  check (method_str ^ " HTTP 200") (response.status = 200);
  let body = json_body response in
  check (method_str ^ " ok") (Wire.get "ok" body = Some (Wire.Bool true));
  Transit_codec.of_string (get_string "resultTransit" body)

let list_rows = function
  | Wire.Array xs | Wire.List xs | Wire.Set xs -> xs
  | _ -> failwith "expected a collection result"

let query daemon repo query inputs =
  invoke daemon "thread-api/q"
    [ Wire.String repo; Wire.Array (Wire.String query :: inputs) ]

let contains_row rows = list_rows rows <> []

let contains_text text needle =
  let rec go start =
    if start + String.length needle > String.length text then false
    else if String.sub text start (String.length needle) = needle then true
    else go (start + 1)
  in
  go 0

let server_port root pid =
  await (Server_list.read_entries (Server_list.path root))
  |> List.find_map (fun (entry : Server_list.entry) ->
         if entry.pid = pid then Some entry.port else None)

let wait_status daemon =
  let deadline = Unix.gettimeofday () +. 10. in
  let rec loop () =
    match Unix.waitpid [ Unix.WNOHANG ] daemon.pid with
    | 0, _ when Unix.gettimeofday () < deadline ->
        Thread.delay 0.01;
        loop ()
    | 0, _ -> failwith "native worker process did not exit"
    | _, status ->
        daemon.stopped <- true;
        status
  in
  loop ()

let wait_exit daemon =
  check "native daemon exits successfully" (wait_status daemon = Unix.WEXITED 0)

let stop daemon =
  if not daemon.stopped then begin
    let response = http daemon ~method_:"POST" ~path:"/v1/shutdown" () in
    check "shutdown HTTP 200" (response.status = 200);
    wait_exit daemon
  end

let force_stop daemon =
  if not daemon.stopped then begin
    (try Unix.kill daemon.pid Sys.sigterm with Unix.Unix_error _ -> ());
    (try wait_exit daemon
     with _ ->
       (try Unix.kill daemon.pid Sys.sigkill with Unix.Unix_error _ -> ());
       (try ignore (Unix.waitpid [] daemon.pid) with Unix.Unix_error _ -> ());
       daemon.stopped <- true)
  end

let with_processes f =
  let storage_root = root () in
  let children = ref [] in
  let succeeded = ref false in
  Fun.protect
    (fun () ->
       let result = f storage_root children in
       succeeded := true;
       result)
    ~finally:(fun () ->
      List.iter force_stop !children;
      if !succeeded then remove_tree storage_root
      else Printf.eprintf "Native daemon failure artifacts: %s\n%!" storage_root)

let launch root children ~repo args =
  let bin = executable () in
  let prefix = Filename.concat root ("daemon-" ^ Uuid_gen.uuid ()) in
  let stdout_path = prefix ^ ".stdout.log" in
  let stderr_path = prefix ^ ".stderr.log" in
  let output =
    Unix.openfile stdout_path
      [ Unix.O_WRONLY; Unix.O_CREAT; Unix.O_EXCL ] 0o600
  in
  let error =
    try Unix.openfile stderr_path
          [ Unix.O_WRONLY; Unix.O_CREAT; Unix.O_EXCL ] 0o600
    with exn -> Unix.close output; raise exn
  in
  let environment =
    Unix.environment ()
    |> Array.to_list
    |> List.filter (fun variable ->
           not (String.starts_with ~prefix:"HOME=" variable)
           && not (String.starts_with ~prefix:"LOGSEQ_NO_LOGIN_DAEMON=" variable))
    |> fun vars ->
    Array.of_list
      (("HOME=" ^ root) :: "LOGSEQ_NO_LOGIN_DAEMON=1" :: vars)
  in
  let argv = Array.of_list (bin :: args) in
  let pid =
    try Unix.create_process_env bin argv environment Unix.stdin output error
    with e -> Unix.close output; Unix.close error; raise e
  in
  Unix.close output;
  Unix.close error;
  let daemon = { root; repo; pid; port = 0; stopped = false } in
  children := daemon :: !children;
  daemon, stdout_path, stderr_path

let run_command root children args =
  let child, stdout_path, stderr_path = launch root children ~repo:"" args in
  let status = wait_status child in
  let read path =
    let channel = open_in_bin path in
    Fun.protect ~finally:(fun () -> close_in channel)
      (fun () -> In_channel.input_all channel)
  in
  status, read stdout_path, read stderr_path

let start root children ~repo ?(owner = "cli") ?(create_empty = false)
    ?(legacy_flags = []) () =
  let storage =
    Graph_lifecycle.resolve_storage ~root
      ~graphs_dir:(Filename.concat root "graphs")
  in
  await (Graph_lifecycle.create_graph ~storage ~repo);
  let daemon, _, _ =
    launch root children ~repo
      ([ "--root-dir"; root; "--repo"; repo; "--owner-source"; owner
       ; "--log-level"; "error" ]
       @ (if create_empty then [ "--create-empty-db" ] else [])
       @ legacy_flags)
  in
  let pid = daemon.pid in
  let deadline = Unix.gettimeofday () +. 20. in
  let rec wait_port () =
    match server_port root pid with
    | Some port -> { daemon with port }
    | None when Unix.gettimeofday () < deadline ->
        Thread.delay 0.02;
        wait_port ()
    | None -> failwith "native daemon did not publish a server-list entry"
  in
  let running = wait_port () in
  children := running :: List.filter (fun d -> d.pid <> pid) !children;
  let health = http running ~method_:"GET" ~path:"/healthz" () in
  check "admitted worker health" (health.status = 200);
  check "admitted bound repo"
    (get_string "repo" (json_body health) = repo);
  running

let now () = Wire.Int64 (Time.epoch_ms_to_int64 (Time.now ()))
let kw name = Wire.Keyword name
let str value = Wire.String value
let map kvs = Wire.kw_map kvs

let page ~uuid ~title ~time =
  map
    [ "block/uuid", Wire.Uuid uuid
    ; "block/title", str title
    ; "block/name", str (String.lowercase_ascii title)
    ; "block/tags", Wire.Set [ kw "logseq.class/Page" ]
    ; "block/created-at", time
    ; "block/updated-at", time ]

let block ~uuid ~page_uuid ~title ~time =
  map
    [ "block/uuid", Wire.Uuid uuid
    ; "block/title", str title
    ; "block/page", Wire.Array [ map [ "block/uuid", Wire.Uuid page_uuid ] ]
    ; "block/parent", Wire.Array [ map [ "block/uuid", Wire.Uuid page_uuid ] ]
    ; "block/refs", Wire.Set [ map [ "block/uuid", Wire.Uuid page_uuid ] ]
    ; "block/collapsed?", Wire.Bool true
    ; "block/order", str "a0"
    ; "block/created-at", time
    ; "block/updated-at", time ]

let transact daemon repo tx =
  ignore
    (invoke daemon "thread-api/transact"
       [ str repo; Wire.Array tx; Wire.Map []; Wire.Nil ])

let title_query = "[:find ?e :in $ ?title :where [?e :block/title ?title]]"

let test_http_invocation () =
  with_processes (fun root children ->
    let repo = "logseq_db_http_" ^ Uuid_gen.uuid () in
    let daemon = start root children ~repo () in
    let health = json_body (http daemon ~method_:"GET" ~path:"/healthz" ()) in
    check "owner-source" (get_string "owner-source" health = "cli");
    check "ready status" (get_string "status" health = "ready");
    check "health PID" (Wire.get "pid" health = Some (Wire.Int daemon.pid));
    check "readyz not implemented"
      ((http daemon ~method_:"GET" ~path:"/readyz" ()).status = 404);
    let page_uuid = Uuid_gen.uuid () in
    let block_uuid = Uuid_gen.uuid () in
    let time = now () in
    transact daemon repo
      [ page ~uuid:page_uuid ~title:"Transport Page" ~time
      ; block ~uuid:block_uuid ~page_uuid ~title:"Transport Block" ~time ];
    check "typed Transit query result"
      (contains_row (query daemon repo title_query [ str "Transport Block" ]));
    let unexpected =
      invoke_raw daemon "thread-api/not-found" [ str repo; Wire.Nil ]
    in
    check "unknown method HTTP 500" (unexpected.status = 500);
    check "unknown method error code"
      (get_string "code" (get_error unexpected) = "exception");
    let log_path = Db_worker_log.log_path root repo in
    check "unknown method logged"
      (Sys.file_exists log_path && (Unix.stat log_path).Unix.st_size > 0);
    let missing = invoke_raw daemon "thread-api/q" [] in
    check "missing repo HTTP 400" (missing.status = 400);
    check "missing repo code"
      (get_string "code" (get_error missing) = "missing-repo");
    let mismatch =
      invoke_raw daemon "thread-api/create-or-open-db"
        [ str (repo ^ "_other"); Wire.Map [] ]
    in
    check "wrong repo HTTP 409" (mismatch.status = 409);
    check "wrong repo code"
      (get_string "code" (get_error mismatch) = "repo-mismatch");
    let invalid =
      invoke_raw daemon "thread-api/q"
        [ str repo
        ; Wire.Array
            [ str
                "[:find (pull ?e ...) :where [?e :block/title \"Status\"]]" ] ]
    in
    check "invalid query HTTP 400" (invalid.status = 400);
    let error = get_error invalid in
    check "invalid-query code" (get_string "code" error = "invalid-query");
    check "query reports unknown variables"
      (let message = get_string "message" error in
       contains_text message "Query for unknown vars");
    stop daemon)

let read_sse_chunk channel =
  let size_line = String.trim (input_line channel) in
  let size =
    match int_of_string_opt ("0x" ^ size_line) with
    | Some n when n > 0 -> n
    | _ -> failwith ("invalid SSE HTTP chunk: " ^ size_line)
  in
  let data = really_input_string channel size in
  check "SSE chunk trailer" (really_input_string channel 2 = "\r\n");
  data

let open_sse daemon =
  let socket = Unix.socket Unix.PF_INET Unix.SOCK_STREAM 0 in
  (try
     Unix.setsockopt_float socket Unix.SO_RCVTIMEO 10.;
     Unix.connect socket
       (Unix.ADDR_INET (Unix.inet_addr_loopback, daemon.port));
     let request =
       Printf.sprintf
         "GET /v1/events HTTP/1.1\r\nHost: 127.0.0.1:%d\r\nConnection: keep-alive\r\n\r\n"
         daemon.port
     in
     let rec write offset =
       if offset < String.length request then
         let n =
           Unix.write_substring socket request offset
             (String.length request - offset)
         in
         write (offset + n)
     in
     write 0;
     let input = Unix.in_channel_of_descr socket in
     let status = input_line input in
     check "SSE HTTP 200"
       (String.starts_with ~prefix:"HTTP/1.1 200" status);
     let rec headers content_type chunked =
       match String.trim (input_line input) with
       | "" ->
           check "SSE content-type" content_type;
           check "SSE chunked transport" chunked
       | line ->
           let lowercase = String.lowercase_ascii line in
           headers
             (content_type
              || String.starts_with
                   ~prefix:"content-type: text/event-stream" lowercase)
             (chunked
              || String.starts_with
                   ~prefix:"transfer-encoding: chunked" lowercase)
     in
     headers false false;
     socket, input
   with e -> Unix.close socket; raise e)

let sse_event channel =
  let rec receive limit =
    if limit = 0 then failwith "no SSE data frame received"
    else
      match String.split_on_char '\n' (read_sse_chunk channel) with
      | line :: _ when String.starts_with ~prefix:"data: " line ->
          let raw = String.sub line 6 (String.length line - 6) in
          let data = Json.parse raw in
          let event_type = get_string "type" data in
          let encoded = get_string "payload" data in
          event_type, Transit_codec.of_string encoded
      | _ -> receive (limit - 1)
  in
  receive 100

let test_sse_import_and_cleanup () =
  with_processes (fun root children ->
    let repo = "logseq_db_sse_" ^ Uuid_gen.uuid () in
    let daemon = start root children ~repo () in
    let socket, channel = open_sse daemon in
    Fun.protect
      (fun () ->
         let marker_uuid = Uuid_gen.uuid () in
         transact daemon repo
           [ page ~uuid:marker_uuid ~title:"SSE Transaction Marker"
               ~time:(now ()) ];
         let rec read_update remaining =
           if remaining = 0 then failwith "missing ordinary transaction SSE event"
           else
             let kind, payload = sse_event channel in
             if kind = "sync-db-changes" then
               check "ordinary SSE frame retains Transit repo"
                 (match Wire.nth payload 1 with
                  | Some body -> Wire.get "repo" body = Some (str repo)
                  | None -> false)
             else read_update (remaining - 1)
         in
         read_update 20;
         let config_file =
           map
             [ "path", str "logseq/config.edn"
             ; "file/content", str "{}" ]
         in
         let files =
           Wire.Array
             [ config_file
             ; map
                 [ "path", str "pages/Home.md"
                 ; "file/content", str "- imported from desktop" ] ]
         in
         let result =
           invoke daemon "thread-api/import-file-graph"
             [ str repo; config_file; files
             ; map [ "user-options", Wire.Map [] ] ]
         in
         check "import persisted"
           (Wire.get "persisted?" result = Some (Wire.Bool true));
         check "import completed"
           (match Wire.get "status" result with
            | Some (Wire.Keyword "completed")
            | Some (Wire.Keyword "completed-with-errors") -> true
            | _ -> false);
         check "import has a structured issue count"
           (match Wire.get "issue-count" result with
            | Some (Wire.Int n) -> n >= 0
            | Some (Wire.Int64 n) -> n >= 0L
            | _ -> false);
         let current_page = ref false in
         let finishing = ref false in
         let rec read_progress remaining =
           if remaining = 0 then failwith "missing import UI-state SSE event"
           else
             let event_type, payload = sse_event channel in
             if event_type = "thread-api/set-ui-state" then begin
               let key = Wire.nth payload 0 in
               let value = Wire.nth payload 1 in
               if key = Some (Wire.Array
                                [ kw "graph/importing-state"; kw "current-page" ])
                  && value = Some (str "pages/Home.md")
               then current_page := true;
               if key = Some (Wire.Array
                                [ kw "graph/importing-state"; kw "label" ])
                  && value = Some (kw "import/finishing")
               then finishing := true
             end;
             if !current_page && !finishing then ()
             else read_progress (remaining - 1)
         in
         read_progress 80;
         check "import exposes page progress" !current_page;
         check "namespaced SSE event retains finishing state" !finishing;
         check "imported page query"
           (contains_row
              (query daemon repo title_query [ str "imported from desktop" ])))
      ~finally:(fun () ->
        (try Unix.shutdown socket Unix.SHUTDOWN_ALL with Unix.Unix_error _ -> ());
        close_in_noerr channel);
    check "worker remains ready after SSE client closes"
      ((http daemon ~method_:"GET" ~path:"/healthz" ()).status = 200);
    stop daemon)

let sqlite_bytes = function
  | Wire.Binary payload ->
      check "binary contains SQLite header"
        (String.starts_with ~prefix:"SQLite format 3\000" payload);
      payload
  | _ -> failwith "binary endpoint did not return Wire.Binary"

let assert_imported_page daemon repo title =
  check ("query imported " ^ title)
    (contains_row (query daemon repo title_query [ str title ]))

let test_binary_roundtrips () =
  with_processes (fun root children ->
    let source = "logseq_db_binary_a_" ^ Uuid_gen.uuid () in
    let target = "logseq_db_binary_b_" ^ Uuid_gen.uuid () in
    let raw_target = "logseq_db_binary_raw_" ^ Uuid_gen.uuid () in
    let backup_target = "logseq_db_binary_backup_" ^ Uuid_gen.uuid () in
    let daemon_a = start root children ~repo:source () in
    transact daemon_a source
      [ page ~uuid:(Uuid_gen.uuid ()) ~title:"Binary Source Page"
          ~time:(now ()) ];
    let export =
      invoke daemon_a "thread-api/export-db-binary" [ str source ]
    in
    let bytes = sqlite_bytes export in
    ignore
      (invoke daemon_a "thread-api/export-client-ops-db-binary"
         [ str source ] |> sqlite_bytes);
    let backup_dir = Filename.concat root "backup" in
    Unix.mkdir backup_dir 0o700;
    let backup_path = Filename.concat backup_dir "snapshot.sqlite" in
    let backup =
      invoke daemon_a "thread-api/backup-db-sqlite"
        [ str source; str backup_path ]
    in
    check "backup endpoint reports destination"
      (Wire.get "path" backup = Some (str backup_path));
    check "backup generated by production endpoint"
      (Sys.file_exists backup_path
       && (Unix.stat backup_path).Unix.st_size > 16);
    let backup_bytes = In_channel.with_open_bin backup_path In_channel.input_all in
    check "backup contains SQLite header"
      (String.starts_with ~prefix:"SQLite format 3\000" backup_bytes);
    stop daemon_a;
    let daemon_b = start root children ~repo:target ~owner:"" () in
    ignore
      (invoke daemon_b "thread-api/import-db-binary"
         [ str target; export ]);
    ignore
      (invoke daemon_b "thread-api/create-or-open-db"
         [ str target; Wire.Map [] ]);
    assert_imported_page daemon_b target "Binary Source Page";
    stop daemon_b;
    let daemon_c = start root children ~repo:raw_target ~owner:"" () in
    let response =
      http daemon_c ~method_:"POST"
        ~path:("/v1/import-db-binary?repo=" ^ raw_target)
        ~content_type:"application/octet-stream"
        ~body:bytes ()
    in
    check "raw binary import HTTP 200" (response.status = 200);
    check "raw binary import acknowledged"
      (Wire.get "ok" (json_body response) = Some (Wire.Bool true));
    ignore
      (invoke daemon_c "thread-api/create-or-open-db"
         [ str raw_target; Wire.Map [] ]);
    assert_imported_page daemon_c raw_target "Binary Source Page";
    stop daemon_c;
    let daemon_d = start root children ~repo:backup_target ~owner:"" () in
    ignore
      (invoke daemon_d "thread-api/import-db-binary"
         [ str backup_target; Wire.Binary backup_bytes ]);
    ignore
      (invoke daemon_d "thread-api/create-or-open-db"
         [ str backup_target; Wire.Map [] ]);
    assert_imported_page daemon_d backup_target "Binary Source Page";
    stop daemon_d)

let test_different_pid_persistence () =
  with_processes (fun root children ->
    let repo = "logseq_db_reopen_" ^ Uuid_gen.uuid () in
    let page_uuid = Uuid_gen.uuid () in
    let block_uuid = Uuid_gen.uuid () in
    let daemon_a = start root children ~repo () in
    let time = now () in
    transact daemon_a repo
      [ page ~uuid:page_uuid ~title:"Cold Page" ~time
      ; block ~uuid:block_uuid ~page_uuid ~title:"Cold Block" ~time
      ; map
          [ "db/ident", kw "logseq.kv/graph-last-gc-at"
          ; "kv/value", Wire.Int 0 ] ];
    let property_ident = "plugin.property._test_plugin/persistence_priority" in
    let upsert =
      Wire.List
        [ kw "upsert-property"
        ; Wire.List
            [ kw property_ident
            ; map
                [ "logseq.property/type", kw "number"
                ; "db/cardinality", kw "db.cardinality/one" ]
            ; Wire.Map [ str "property-name", kw "priority" ] ] ]
    in
    let set =
      Wire.List
        [ kw "set-block-property"
        ; Wire.List
            [ Wire.Uuid block_uuid; kw property_ident; Wire.Int 7 ] ]
    in
    ignore
      (invoke daemon_a "thread-api/apply-outliner-ops"
         [ str repo; Wire.Array [ upsert; set ]; Wire.Map [] ]);
    stop daemon_a;
    let daemon_b = start root children ~repo () in
    check "cold restart has a different PID" (daemon_a.pid <> daemon_b.pid);
    assert_imported_page daemon_b repo "Cold Page";
    assert_imported_page daemon_b repo "Cold Block";
    check "block belongs to persisted page"
      (contains_row
         (query daemon_b repo
            "[:find ?b :in $ ?u :where [?p :block/uuid ?u] [?b :block/page ?p]]"
            [ Wire.Uuid page_uuid ]));
    check "block retains page reference"
      (contains_row
         (query daemon_b repo
            "[:find ?b :in $ ?u :where [?p :block/uuid ?u] [?b :block/refs ?p]]"
            [ Wire.Uuid page_uuid ]));
    let property_rows =
      query daemon_b repo
        "[:find ?n :in $ ?u :where [?b :block/uuid ?u] [?b :plugin.property._test_plugin/persistence_priority ?p] [?p :logseq.property/value ?n]]"
        [ Wire.Uuid block_uuid ]
    in
    check "numeric property value survives process restart"
      (List.exists
         (function
           | Wire.Array [ Wire.Int 7 ]
           | Wire.Array [ Wire.Int64 7L ] -> true
           | _ -> false)
         (list_rows property_rows));
    let last_gc_at =
      invoke daemon_b "thread-api/get-key-value"
        [ str repo; kw "logseq.kv/graph-last-gc-at" ]
    in
    check "cold open skips maintenance"
      (last_gc_at = Wire.Int 0 || last_gc_at = Wire.Int64 0L);
    stop daemon_b)

let test_cli_process_exits () =
  with_processes (fun root children ->
    let status, stdout, stderr = run_command root children [ "--version" ] in
    check "version exits zero without graph args" (status = Unix.WEXITED 0);
    check "version prints revision" (contains_text stdout "Revision:");
    check "version has no stderr" (stderr = "");
    let status, stdout, stderr = run_command root children [ "--help" ] in
    check "help exits zero without graph args" (status = Unix.WEXITED 0);
    check "help documents required root" (contains_text stdout "--root-dir");
    check "help omits deprecated registry flag"
      (not (contains_text stdout "--server-list-file"));
    check "help has no stderr" (stderr = "");
    List.iter
      (fun (args, message) ->
        let status, stdout, stderr = run_command root children args in
        check "missing argument exits one" (status = Unix.WEXITED 1);
        check "missing argument has no stdout" (stdout = "");
        check "missing argument reports on stderr" (contains_text stderr message))
      [ [ "--repo"; "logseq_db_missing_root" ], "root-dir is required"
      ; [ "--root-dir"; root ], "repo is required" ];
    check "early exits do not initialize graph storage"
      (not (Sys.file_exists (Filename.concat root "graphs")));
    check "early exits do not publish daemon"
      (not (Sys.file_exists (Server_list.path root))))

let test_cli_ignores_legacy_flags () =
  with_processes (fun root children ->
    let repo = "logseq_db_legacy_" ^ Uuid_gen.uuid () in
    let daemon =
      start root children ~repo
        ~legacy_flags:
          [ "--host"; "127.0.0.2"
          ; "--port"; "not-a-port"
          ; "--auth-token"; "unused"
          ; "--rtc-ws-url"; "unused"
          ; "--server-list-file"; Filename.concat root "legacy-list.json" ]
        ()
    in
    let health = json_body (http daemon ~method_:"GET" ~path:"/healthz" ()) in
    check "deprecated arguments keep admitted repo"
      (get_string "repo" health = repo);
    check "deprecated host still binds loopback"
      (get_string "host" health = "127.0.0.1");
    check "deprecated port does not alter listener"
      (Wire.get "port" health = Some (Wire.Int daemon.port));
    check "deprecated registry path is not used"
      (not (Sys.file_exists (Filename.concat root "legacy-list.json")));
    check "deprecated flags keep CLI owner"
      (get_string "owner-source" health = "cli");
    let title = "Legacy Flags Do Not Change Graph" in
    transact daemon repo [ page ~uuid:(Uuid_gen.uuid ()) ~title ~time:(now ()) ];
    check "legacy flags do not intercept typed worker invocation"
      (contains_row (query daemon repo title_query [ str title ]));
    stop daemon)

let test_cross_pid_ownership () =
  with_processes (fun root children ->
    let repo = "logseq_db_ownership_" ^ Uuid_gen.uuid () in
    let owner = start root children ~repo () in
    let assert_contended () =
      let status, _, stderr =
        run_command root children
          [ "--root-dir"; root; "--repo"; repo; "--owner-source"; "cli"
          ; "--log-level"; "error" ]
      in
      check "second native PID cannot acquire live graph" (status = Unix.WEXITED 1);
      check "contender reports repo-locked" (contains_text stderr "repo-locked");
      let health = json_body (http owner ~method_:"GET" ~path:"/healthz" ()) in
      check "original owner remains ready" (get_string "status" health = "ready");
      check "original owner PID retained" (Wire.get "pid" health = Some (Wire.Int owner.pid))
    in
    assert_contended ();
    let title = "Owned Across Import and Reopen" in
    transact owner repo [ page ~uuid:(Uuid_gen.uuid ()) ~title ~time:(now ()) ];
    let binary = invoke owner "thread-api/export-db-binary" [ str repo ] in
    ignore (sqlite_bytes binary);
    ignore (invoke owner "thread-api/import-db-binary" [ str repo; binary ]);
    let backup = Filename.concat root "owned-backup.sqlite" in
    ignore (invoke owner "thread-api/backup-db-sqlite" [ str repo; str backup ]);
    check "owned backup exists" (Sys.file_exists backup);
    ignore (invoke owner "thread-api/close-db" [ str repo ]);
    assert_contended ();
    ignore (invoke owner "thread-api/create-or-open-db" [ str repo; Wire.Map [] ]);
    assert_imported_page owner repo title;
    assert_contended ();
    stop owner;
    let next_owner = start root children ~repo () in
    check "shutdown releases ownership to different PID" (next_owner.pid <> owner.pid);
    assert_imported_page next_owner repo title;
    stop next_owner)

let test_empty_startup_and_repo_identity () =
  with_processes (fun root children ->
    let repo = "demo" in
    let daemon = start root children ~repo ~owner:"electron" ~create_empty:true () in
    let health = json_body (http daemon ~method_:"GET" ~path:"/healthz" ()) in
    check "electron owner published" (get_string "owner-source" health = "electron");
    check "empty startup has no Library"
      (list_rows (query daemon repo title_query [ str Ldb.library_page_name ]) = []);
    let response =
      invoke_raw daemon "thread-api/create-or-open-db"
        [ str "logseq_db_demo"; Wire.Map [] ]
    in
    check "prefix-equivalent repo HTTP 200" (response.status = 200);
    check "prefix-equivalent repo acknowledged"
      (Wire.get "ok" (json_body response) = Some (Wire.Bool true));
    stop daemon)

let test_sync_status_without_ws () =
  with_processes (fun root children ->
    let repo = "logseq_db_sync_status_" ^ Uuid_gen.uuid () in
    let daemon = start root children ~repo () in
    let missing = invoke_raw daemon "thread-api/db-sync-status" [] in
    check "sync status requires repo HTTP 400" (missing.status = 400);
    check "sync status missing-repo code"
      (get_string "code" (get_error missing) = "missing-repo");
    ignore (invoke daemon "thread-api/create-or-open-db" [ str repo; Wire.Map [] ]);
    let status = invoke daemon "thread-api/db-sync-status" [ str repo ] in
    check "sync status repo" (Wire.get "repo" status = Some (str repo));
    List.iter
      (fun key -> check ("sync status has " ^ key) (Wire.get key status <> None))
      [ "ws-state"; "pending-local"; "pending-asset"; "pending-server"
      ; "local-tx"; "remote-tx"; "graph-id" ];
    ignore
      (invoke daemon "thread-api/set-db-sync-config"
         [ map [ "ws-url", Wire.Nil; "http-base", str "https://example.com" ] ]);
    check "no-WS sync start returns nil"
      (invoke daemon "thread-api/db-sync-start" [ str repo ] = Wire.Nil);
    let inactive = invoke daemon "thread-api/db-sync-status" [ str repo ] in
    check "inactive status repo" (Wire.get "repo" inactive = Some (str repo));
    check "no-WS sync status is inactive"
      (Wire.get "ws-state" inactive = Some (kw "inactive"));
    List.iter
      (fun key -> check ("inactive status has " ^ key) (Wire.get key inactive <> None))
      [ "pending-local"; "pending-server" ];
    stop daemon)

let test_outliner_validation_http_status () =
  with_processes (fun root children ->
    let repo = "logseq_db_validation_" ^ Uuid_gen.uuid () in
    let daemon = start root children ~repo () in
    ignore (invoke daemon "thread-api/create-or-open-db" [ str repo; Wire.Map [] ]);
    let journal =
      invoke daemon "thread-api/pull"
        [ str repo; Wire.Array [ kw "db/id" ]
        ; Wire.Array [ kw "db/ident"; kw "logseq.class/Journal" ] ]
    in
    let journal_id =
      match Wire.get "db/id" journal with
      | Some ((Wire.Int _ | Wire.Int64 _) as id) -> id
      | _ -> Alcotest.fail "Journal class has no numeric db/id"
    in
    let page_uuid = Uuid_gen.uuid () in
    let block_uuid = Uuid_gen.uuid () in
    let time = now () in
    transact daemon repo
      [ map
          [ "block/uuid", Wire.Uuid page_uuid
          ; "block/title", str "Validation Target Page"
          ; "block/name", str "validation-target-page"
          ; "block/tags", Wire.Set [ kw "logseq.class/Page" ]
          ; "block/created-at", time; "block/updated-at", time ]
      ; map
          [ "block/uuid", Wire.Uuid block_uuid
          ; "block/title", str "Validation Target Block"
          ; "block/page", Wire.Array [ kw "block/uuid"; Wire.Uuid page_uuid ]
          ; "block/parent", Wire.Array [ kw "block/uuid"; Wire.Uuid page_uuid ]
          ; "block/order", str "a0"
          ; "block/created-at", time; "block/updated-at", time ] ];
    let response =
      invoke_raw daemon "thread-api/apply-outliner-ops"
        [ str repo
        ; Wire.Array
            [ Wire.Array
                [ kw "batch-set-property"
                ; Wire.Array
                    [ Wire.Array [ Wire.Uuid block_uuid ]; kw "block/tags"
                    ; journal_id; Wire.Map [] ] ] ]
        ; Wire.Map [] ]
    in
    check "tag validation error HTTP 400 not 500" (response.status = 400);
    check "tag validation error message"
      (contains_text (get_string "message" (get_error response)) "Can't set tag");
    stop daemon)

let cases =
  [ Alcotest.test_case "native-daemon-http-invoke-transit-and-errors" `Quick
      test_http_invocation
  ; Alcotest.test_case "native-daemon-sse-import-and-cleanup" `Quick
      test_sse_import_and_cleanup
  ; Alcotest.test_case "native-daemon-binary-roundtrips" `Quick
      test_binary_roundtrips
  ; Alcotest.test_case "native-daemon-different-pid-persistence" `Quick
      test_different_pid_persistence
  ; Alcotest.test_case "native-daemon-cli-process-exits" `Quick
      test_cli_process_exits
  ; Alcotest.test_case "native-daemon-ignores-legacy-flags" `Quick
      test_cli_ignores_legacy_flags
  ; Alcotest.test_case "native-daemon-cross-pid-ownership" `Quick
      test_cross_pid_ownership
  ; Alcotest.test_case "native-daemon-empty-startup-and-repo-identity" `Quick
      test_empty_startup_and_repo_identity
  ; Alcotest.test_case "native-daemon-sync-status-without-ws" `Quick
      test_sync_status_without_ws
  ; Alcotest.test_case "native-daemon-outliner-validation-http-status" `Quick
      test_outliner_validation_http_status ]
