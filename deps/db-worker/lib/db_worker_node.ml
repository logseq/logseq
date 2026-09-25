(* frontend.worker.db-worker-node — Node.js daemon entrypoint for
   db-worker: http server, SSE clients, CORS, admission control via
   graph-lifecycle, server-list registry and graceful stop.

   The cljs proxy {remoteInvoke remoteInvokeBinary} resolves to the
   OCaml worker directly: remoteInvoke = Worker_core.invoke
   (transit in/out), remoteInvokeBinary = Dispatcher.invoke on wire
   args. `thread-api/*` endpoints run in this same process. *)

module E = Db_worker_effect

(* ---- state (cljs defonce atoms) ---- *)

type platform =
  { root_dir : string
  ; storage : Graph_lifecycle.storage
  ; (* cljs platform-node/track-platform-writes drains pending async
       storage writes; OCaml storage writes are synchronous so the
       drain resolves immediately. *)
    drain_writes : unit -> unit E.t
  ; owner_source : string
  ; embedding_endpoint : string option
  ; embedding_model_id : string option
  }

type daemon =
  { host : string
  ; port : int
  ; server : Http_server.server
  ; stop : unit -> bool E.t
  }

(* cljs proxy surface — remoteInvoke + remoteInvokeBinary. *)
type proxy =
  { remote_invoke : string -> string -> string E.t
  ; remote_invoke_binary : string -> string -> string -> Wire.t E.t
  }

let ready : bool ref = ref false

(* *sse-clients — a sink record rather than a bare Http_server.res so
   tests can inject a fake client (cljs rebinds #js {:write ...}; res
   is abstract in the spec). *)
type sse_sink =
  { sink_id : int; write : string -> unit; close : unit -> unit }

let sse_clients : sse_sink list ref = ref []
let next_sse_sink_id = ref 0

let fresh_sse_sink_id () =
  incr next_sse_sink_id;
  !next_sse_sink_id
let server_list_file : string option ref = ref None
let admission : Graph_lifecycle.runtime option ref = ref None
let platform_ref : platform option ref = ref None
let stopping : bool ref = ref false
let requests : unit E.t list ref = ref []

let sse_keepalive_ms = 15000
let invoke_warn_ms = 10000

let server_list_file_path (root_dir : string) : string =
  Server_list.path root_dir

let cors_headers =
  [ "Access-Control-Allow-Origin", "lsp://logseq.com"
  ; "Access-Control-Allow-Methods", "GET,POST,OPTIONS"
  ; "Access-Control-Allow-Headers", "Content-Type,Authorization" ]

let response_headers (headers : (string * string) list) :
    (string * string) list =
  cors_headers @ headers

(* ---- send helpers ---- *)

let send_no_content (res : Http_server.res) : unit =
  Http_server.write_head res ~status:204 ~headers:cors_headers;
  Http_server.res_end res

let send_json (res : Http_server.res) (status : int) (payload : Wire.t) : unit =
  Http_server.write_head res ~status
    ~headers:(response_headers [ "Content-Type", "application/json" ]);
  Http_server.write res (Json.stringify payload);
  Http_server.res_end res

let send_text (res : Http_server.res) (status : int) (text : string) : unit =
  Http_server.write_head res ~status
    ~headers:(response_headers [ "Content-Type", "text/plain" ]);
  Http_server.write res text;
  Http_server.res_end res

let smap (kvs : (string * Wire.t) list) : Wire.t =
  Wire.Map (List.map (fun (k, v) -> Wire.String k, v) kvs)

(* ---- parse-args ---- *)

type cli_opts =
  { root_dir : string option
  ; repo : string option
  ; graphs_dir : string option
  ; lifecycle_dir : string option
  ; owner_source : string option
  ; admission_ticket : string option
  ; graph_generation : string option
  ; log_level : string option
  ; embedding_endpoint : string option
  ; embedding_model_id : string option
  ; create_empty_db : bool
  ; version : bool
  ; help : bool
  }

let empty_cli_opts =
  { root_dir = None
  ; repo = None
  ; graphs_dir = None
  ; lifecycle_dir = None
  ; owner_source = None
  ; admission_ticket = None
  ; graph_generation = None
  ; log_level = None
  ; embedding_endpoint = None
  ; embedding_model_id = None
  ; create_empty_db = false
  ; version = false
  ; help = false
  }

let parse_args (argv : string list) : cli_opts =
  let rec go opts = function
    | [] -> opts
    | "--root-dir" :: v :: rest -> go { opts with root_dir = Some v } rest
    | "--repo" :: v :: rest -> go { opts with repo = Some v } rest
    | "--graphs-dir" :: v :: rest -> go { opts with graphs_dir = Some v } rest
    | "--lifecycle-dir" :: v :: rest ->
        go { opts with lifecycle_dir = Some v } rest
    | "--owner-source" :: v :: rest ->
        go { opts with owner_source = Some v } rest
    | "--admission-ticket" :: v :: rest ->
        go { opts with admission_ticket = Some v } rest
    | "--graph-generation" :: v :: rest ->
        go { opts with graph_generation = Some v } rest
    | "--log-level" :: v :: rest -> go { opts with log_level = Some v } rest
    | "--embedding-endpoint" :: v :: rest ->
        go { opts with embedding_endpoint = Some v } rest
    | "--embedding-model-id" :: v :: rest ->
        go { opts with embedding_model_id = Some v } rest
    | "--create-empty-db" :: rest -> go { opts with create_empty_db = true } rest
    | "--version" :: rest -> go { opts with version = true } rest
    | "--help" :: rest -> go { opts with help = true } rest
    | _ :: rest -> go opts rest
  in
  go empty_cli_opts argv

(* with-redefs seams for the cljs run-main-with-overrides helper —
   tests substitute argv/exit/console and start-daemon!. *)
let argv_fn : (unit -> string list) ref = ref Node_process.argv
let log_fn : (string -> unit) ref = ref Node_console.log
let error_fn : (string -> unit) ref = ref Node_console.error

let parse_argv () : cli_opts =
  match !argv_fn () with
  | _ :: _ :: rest -> parse_args rest
  | _ -> parse_args []

(* ---- event encoding + SSE ---- *)

(* encode-event-type/payload — OCaml callers always pass strings
   already (kind names and transit payloads). *)
let encode_event_type (t : string) : string = t
let encode_event_payload (p : string) : string = p

let handle_event (type_ : string) (payload : string) : unit =
  let event =
    Json.stringify
      (smap
         [ "type", Wire.String (encode_event_type type_)
         ; "payload", Wire.String (encode_event_payload payload) ])
  in
  let message = "data: " ^ event ^ "\n\n" in
  List.iter
    (fun sink ->
       try sink.write message
       with _ ->
         Worker_log.error "sse-write-failed" [ ("source", "handle-event") ])
    !sse_clients

let sse_handler (req : Http_server.req) (res : Http_server.res) : unit =
  Http_server.write_head res ~status:200
    ~headers:
      (response_headers
         [ "Content-Type", "text/event-stream"
         ; "Cache-Control", "no-cache"
         ; "Connection", "keep-alive" ]);
  Http_server.write res "\n";
  let sink =
    { sink_id = fresh_sse_sink_id (); write = Http_server.write res
    ; close = (fun () -> Http_server.res_end res) }
  in
  sse_clients := sink :: !sse_clients;
  let keepalive_id = ref None in
  keepalive_id :=
    Some
      (Timers.set_interval sse_keepalive_ms (fun () ->
           try Http_server.write res ": keepalive\n\n"
           with _ ->
             (match !keepalive_id with
              | Some t -> Timers.clear t
              | None -> ())));
  Http_server.on_close req (fun () ->
      (match !keepalive_id with
       | Some t -> Timers.clear t
       | None -> ());
      sse_clients :=
        List.filter (fun s -> s.sink_id <> sink.sink_id) !sse_clients)

(* ---- invoke plumbing ---- *)

(* <invoke! — remoteInvoke with a 10s warn timer, cleared when the
   invoke settles. [method_label] is the cljs method-kw for logs. *)
let invoke_transit ~(proxy : proxy) ~(method_str : string)
    ~(method_label : string) ~(args_transit : string) : string E.t =
  let started_at = Clock.now_ms () in
  let timeout_id =
    Timers.set_timeout invoke_warn_ms (fun () ->
        Worker_log.warn "db-worker-node-invoke-timeout"
          [ "method", method_label
          ; "elapsed-ms",
            string_of_int (int_of_float (Clock.now_ms () -. started_at)) ])
  in
  (* remoteInvoke may raise synchronously (cljs remote-function rethrow
     semantics) — surface it as a rejected task so the finally cleanup
     still runs and E.catch sees the failure. *)
  let task =
    try proxy.remote_invoke method_str args_transit
    with exn -> E.error exn
  in
  E.finally task (fun () -> Timers.clear timeout_id; E.pure ())

let invoke_args ~(proxy : proxy) ~(method_str : string)
    ~(method_label : string) ~(args : Wire.t list) : string E.t =
  invoke_transit ~proxy ~method_str ~method_label
    ~args_transit:(Transit_codec.to_string (Wire.Array args))

let invoke_binary ~(proxy : proxy) ~(method_str : string)
    ~(method_label : string) ~(repo : string) ~(payload : string) :
    Wire.t E.t =
  let started_at = Clock.now_ms () in
  let timeout_id =
    Timers.set_timeout invoke_warn_ms (fun () ->
        Worker_log.warn "db-worker-node-invoke-timeout"
          [ "method", method_label
          ; "elapsed-ms",
            string_of_int (int_of_float (Clock.now_ms () -. started_at)) ])
  in
  let task =
    try proxy.remote_invoke_binary method_str repo payload
    with exn -> E.error exn
  in
  E.finally task (fun () -> Timers.clear timeout_id; E.pure ())

(* with-redefs seams — cljs tests substitute db-core/init-core!'s
   remoteInvoke and lifecycle/assertOwnership. *)
let remote_invoke_fn : (string -> string -> string E.t) ref =
  ref Worker_core.invoke

let assert_ownership_fn : (Graph_lifecycle.runtime -> unit) ref =
  ref Graph_lifecycle.assert_ownership

(* with-redefs seam for platform storage :db-exists? — tests substitute
   a stub so they don't need a real db.sqlite on disk. *)
let db_exists_fn : (repo:string -> bool E.t) ref = ref Sqlite.db_exists

let init_worker (proxy : proxy) : string E.t =
  invoke_args ~proxy ~method_str:"thread-api/init"
    ~method_label:"thread-api/init" ~args:[]

(* <close-after! — resolve [task], then run [close]; the task's
   result/error wins unless [close] itself fails. *)
let close_after (task : 'a E.t) (close : unit -> 'b E.t) : 'a E.t =
  let settled =
    E.catch task (fun e -> E.bind (close ()) (fun _ -> E.error e))
  in
  E.bind settled (fun r -> E.bind (close ()) (fun _ -> E.pure r))

let close_bound_repo (proxy : proxy) (repo : string) : string E.t =
  close_after
    (close_after
       (invoke_args ~proxy ~method_str:"thread-api/db-sync-stop"
          ~method_label:"thread-api/db-sync-stop" ~args:[])
       (fun () ->
          match !platform_ref with
          | Some p -> p.drain_writes ()
          | None -> E.pure ()))
    (fun () ->
       invoke_args ~proxy ~method_str:"thread-api/close-db"
         ~method_label:"thread-api/close-db" ~args:[ Wire.String repo ])

let non_repo_methods =
  [ "thread-api/init"
  ; "thread-api/set-db-sync-config"
  ; "thread-api/get-db-sync-config"
  ; "thread-api/db-sync-stop"
  ; "thread-api/db-sync-list-remote-graphs"
  ; "thread-api/db-sync-update-presence"
  ; "thread-api/db-sync-ensure-user-rsa-keys"
  ; "thread-api/list-db"
  ; "thread-api/get-version"
  ; "thread-api/set-context"
  ; "thread-api/sync-app-state"
  ; "thread-api/update-thread-atom"
  ; "thread-api/mobile-logs"
  ; "thread-api/get-user-rsa-key-pair"
  ; "thread-api/init-user-rsa-key-pair"
  ; "thread-api/reset-user-rsa-key-pair"
  ; "thread-api/change-e2ee-password"
  ; "thread-api/get-e2ee-password"
  ; "thread-api/save-e2ee-password"
  ; "thread-api/verify-and-save-e2ee-password"
  ; "thread-api/resolve-ui-request"
  ; "thread-api/reject-ui-request"
  ; "thread-api/cancel-ui-requests" ]

let repo_arg (args : Wire.t) : Wire.t =
  match args with
  | Wire.Array (a :: _) -> a
  | Wire.List (a :: _) -> a
  | _ -> Wire.Nil

let missing_repo_error () : int * Wire.t =
  ( 400
  , smap
      [ "code", Wire.Keyword "missing-repo"
      ; "message", Wire.String "repo is required" ] )

(* repo-error — {:status :error} or nil (unit). *)
let repo_error ~(method_str : string) (args : Wire.t)
    (bound_repo : string) : (int * Wire.t) option =
  if List.mem method_str non_repo_methods then None
  else
    match repo_arg args with
    | Wire.String repo when repo <> "" && Unicode.trim repo <> "" ->
        if Graph_dir.same_repo repo bound_repo then None
        else
          Some
            ( 409
            , smap
                [ "code", Wire.Keyword "repo-mismatch"
                ; "message",
                  Wire.String "repo does not match bound repo"
                ; "repo", Wire.String repo
                ; "bound-repo", Wire.String bound_repo ] )
    | _ -> Some (missing_repo_error ())

(* ---- error -> response mapping ---- *)

let kv_get (kvs : (Wire.t * Wire.t) list) (k : string) : Wire.t option =
  List.find_map
    (fun (k', v) -> if k' = Wire.Keyword k then Some v else None)
    kvs

let query_validation_error (kvs : (Wire.t * Wire.t) list) : bool =
  kv_get kvs "error" = Some (Wire.Keyword "parser/query")

let notification_validation_error (kvs : (Wire.t * Wire.t) list) : bool =
  kv_get kvs "type" = Some (Wire.Keyword "notification")

let invoke_error_status (kvs : (Wire.t * Wire.t) list) : int =
  if query_validation_error kvs then 400
  else if notification_validation_error kvs then 400
  else
    match kv_get kvs "code" with
    | Some (Wire.Keyword c)
      when List.mem c [ "missing-repo"; "repo-mismatch"; "repo-locked" ] ->
        409
    | _ ->
        (match kv_get kvs "status" with
         | Some (Wire.Int s) -> s
         | Some (Wire.Int64 s) -> Int64.to_int s
         | Some (Wire.Float s) -> int_of_float s
         | _ -> 500)

let invoke_error_code (kvs : (Wire.t * Wire.t) list) : Wire.t =
  if query_validation_error kvs then Wire.Keyword "invalid-query"
  else
    match kv_get kvs "code" with
    | Some c -> c
    | None ->
        if notification_validation_error kvs then
          Wire.Keyword "validation-error"
        else Wire.Keyword "exception"

let invoke_error_message (error : exn) (kvs : (Wire.t * Wire.t) list) : string =
  let payload_message =
    match kv_get kvs "payload" with
    | Some (Wire.Map p) ->
        (match Wire.get "message" (Wire.Map p) with
         | Some (Wire.String m) -> Some m
         | Some (Wire.Keyword m) -> Some m
         | _ -> None)
    | _ -> None
  in
  match payload_message with
  | Some m -> m
  | None ->
      (match error with
       | Dispatcher.Exn_info (msg, _) -> msg
       | _ -> Printexc.to_string error)

let exn_data (e : exn) : (Wire.t * Wire.t) list =
  match e with
  | Dispatcher.Exn_info (_, kvs) -> kvs
  | Outliner_validate.Notification (Wire.Map kvs) -> kvs
  | _ -> []

let log_invoke_error (res : Http_server.res) (error : exn)
    (method_label : string option) : unit =
  let data = exn_data error in
  let status = invoke_error_status data in
  let code = invoke_error_code data in
  let message = invoke_error_message error data in
  Worker_log.error "db-worker-node-invoke-failed"
    [ "status", string_of_int status
    ; "code",
      (match code with
       | Wire.Keyword c -> c
       | Wire.String c -> c
       | _ -> "exception")
    ; "error", Printexc.to_string error
    ; "message", message
    ; "method", Option.value method_label ~default:"" ];
  send_json res status
    (smap [ "ok", Wire.Bool false
          ; "error", smap [ "code", code; "message", Wire.String message ] ])

(* assert-lock-owner! — lifecycle/assertOwnership on the admission,
   JS errors rethrown as {:code :repo-locked}. *)
let assert_lock_owner () : unit =
  match !admission with
  | Some rt ->
      (try !assert_ownership_fn rt
       with e ->
         raise
           (Dispatcher.Exn_info
              ( Printexc.to_string e
              , [ Wire.Keyword "code", Wire.Keyword "repo-locked"
                ; Wire.Keyword "error",
                  Wire.String (Printexc.to_string e) ] )))
  | None ->
      raise
        (Dispatcher.Exn_info
           ( "assertOwnership on nil admission"
           , [ Wire.Keyword "code", Wire.Keyword "repo-locked" ] ))

(* ---- http handlers ---- *)

let handle_import_db_binary (proxy : proxy) (bound_repo : string)
    (parsed_url : Node_url.t) (req : Http_server.req)
    (res : Http_server.res) : unit E.t =
  let repo =
    match Node_url.search_param parsed_url "repo" with
    | Some r -> r
    | None -> ""
  in
  let method_str = "thread-api/import-db-binary" in
  E.catch
    (E.bind (Http_server.read_body_buffer req) (fun binary ->
         let args_for_validation =
           Wire.Array [ Wire.String repo; Wire.Binary binary ]
         in
         match repo_error ~method_str args_for_validation bound_repo with
         | Some (status, error) ->
             send_json res status (smap [ "ok", Wire.Bool false; "error", error ]);
             E.pure ()
         | None ->
             assert_lock_owner ();
             E.bind
               (invoke_binary ~proxy ~method_str
                  ~method_label:method_str ~repo ~payload:binary)
               (fun result ->
                  send_json res 200
                    (smap
                       [ "ok", Wire.Bool true
                       ; "resultTransit",
                         Wire.String (Transit_codec.to_string result) ]);
                  E.pure ())))
    (fun error -> log_invoke_error res error (Some method_str); E.pure ())

let handle_invoke (proxy : proxy) (bound_repo : string)
    (req : Http_server.req) (res : Http_server.res) : unit E.t =
  E.catch
    (E.bind (Http_server.read_body req) (fun body ->
         let payload = Json.parse body in
         let get k = Wire.get k payload in
         let method_w = get "method" in
         let method_str =
           match method_w with
           | Some (Wire.String s) -> s
           | Some (Wire.Keyword s) -> s
           | _ -> ""
         in
         let args' =
           match get "argsTransit", get "args" with
           | Some (Wire.String t), _ -> `Transit t
           | Some w, _ -> `Wire w
           | None, Some a -> `Wire a
           | None, None -> `Wire Wire.Nil
         in
         E.catch
           (E.bind (E.pure args') (fun args' ->
                let args_transit, args_for_validation =
                  match args' with
                  | `Transit t -> (t, Transit_codec.of_string t)
                  | `Wire w -> (Transit_codec.to_string w, w)
                in
                match repo_error ~method_str args_for_validation bound_repo with
            | Some (status, error) ->
                send_json res status
                  (smap [ "ok", Wire.Bool false; "error", error ]);
                E.pure ()
            | None ->
                if not (List.mem method_str non_repo_methods) then
                  assert_lock_owner ();
                E.bind
                  (invoke_transit ~proxy ~method_str ~method_label:method_str
                     ~args_transit)
                  (fun result ->
                     send_json res 200
                       (smap
                          [ "ok", Wire.Bool true
                          ; "resultTransit", Wire.String result ]);
                     E.pure ())))
           (fun error ->
              log_invoke_error res error (Some method_str);
              E.pure ())))
    (fun error -> log_invoke_error res error None; E.pure ())

let handle_shutdown (stop_fn : unit -> unit) (res : Http_server.res) : unit =
  stopping := true;
  send_json res 200 (smap [ "ok", Wire.Bool true ]);
  ignore
    (Timers.set_timeout 10 (fun () ->
         stop_fn ()))

(* health-payload — cljs port is an atom (IDeref) or a number. *)
let health_payload ~(bound_repo : string) ~(host : string)
    ~(port : int option) ~(owner_source : string) ~(root_dir : string) :
    Wire.t =
  let storage_w =
    match !admission with
    | Some rt ->
        let s = Graph_lifecycle.runtime_storage rt in
        smap
          [ "root", Wire.String s.root
          ; "graphsDir", Wire.String s.graphs_dir
          ; "lifecycleDir", Wire.String s.lifecycle_dir ]
    | None -> Wire.Nil
  in
  smap
    [ "repo", Wire.String bound_repo
    ; "status", Wire.String (if !ready then "ready" else "starting")
    ; "host", Wire.String host
    ; "port",
      (match port with
       | Some p -> Wire.Int p
       | None -> Wire.Nil)
    ; "pid", Wire.Int (Node_process.pid ())
    ; "owner-source",
      Wire.String
        (Db_worker_daemon.normalize_owner_source (Wire.String owner_source))
    ; "ownership-protocol", Wire.String "sqlite-v1"
    ; "ticket",
      (match !admission with
       | Some rt ->
           (match Graph_lifecycle.runtime_ticket rt with
            | Some t -> Wire.String t
            | None -> Wire.Nil)
       | None -> Wire.Nil)
    ; "generation",
      (match !admission with
       | Some rt ->
           (match Graph_lifecycle.runtime_generation rt with
            | Some g -> Wire.String g
            | None -> Wire.Nil)
       | None -> Wire.Nil)
    ; "root-dir", Wire.String root_dir
    ; "storage", storage_w
    ; "revision", Wire.String (Common_version.revision ()) ]

(* handle-request! — the cljs router; [url] is the raw req.url (the
   /v1/shutdown comparison is intentionally against the raw url). *)
let handle_request (proxy : proxy) ~(bound_repo : string)
    ~(stop_fn : unit -> unit) ~(host : string) ~(port : int option)
    ~(owner_source : string) ~(root_dir : string)
    (req : Http_server.req) (res : Http_server.res) : unit E.t =
  let url = Http_server.req_url req in
  let parsed_url = Node_url.parse ~base:"http://127.0.0.1" url in
  let request_path = Node_url.pathname parsed_url in
  let http_method = Http_server.req_method req in
  if http_method = "OPTIONS" then (send_no_content res; E.pure ())
  else if request_path = "/healthz" then begin
    send_json res
      (if !ready then 200 else 503)
      (health_payload ~bound_repo ~host ~port ~owner_source ~root_dir);
    E.pure ()
  end
  else if request_path <> "/v1/shutdown"
          && ( !stopping
               ||
               match !admission with
               | Some rt ->
                   (try Graph_lifecycle.check_admission rt; false
                    with _ -> true)
               | None -> true )
  then begin
    send_json res 410
      (smap
         [ "ok", Wire.Bool false
         ; "error",
           smap
             [ "code", Wire.Keyword "graph-not-exists"
             ; "message", Wire.String "Graph runtime is closed" ] ]);
    E.pure ()
  end
  else if request_path = "/v1/events" then (sse_handler req res; E.pure ())
  else if request_path = "/v1/import-db-binary" then
    if http_method = "POST" then
      handle_import_db_binary proxy bound_repo parsed_url req res
    else (send_text res 405 "method-not-allowed"; E.pure ())
  else if request_path = "/v1/invoke" then
    if http_method = "POST" then handle_invoke proxy bound_repo req res
    else (send_text res 405 "method-not-allowed"; E.pure ())
  else if url = "/v1/shutdown" then
    if http_method = "POST" then (handle_shutdown stop_fn res; E.pure ())
    else (send_text res 405 "method-not-allowed"; E.pure ())
  else (send_text res 404 "not-found"; E.pure ())

(* track_request — cljs *requests set: pending effects drained on
   shutdown via p/all. *)
let track_request (task : unit E.t) : unit =
  let done_t, resolver = E.wait () in
  let w = E.catch done_t (fun _ -> E.pure ()) in
  requests := w :: !requests;
  E.async (fun () ->
      E.finally
        (E.catch task (fun e ->
             Worker_log.error "db-worker-node-request-failed"
               [ ("error", Printexc.to_string e) ];
             E.pure ()))
        (fun () ->
           requests :=
             List.filter (fun x -> not (x == w)) !requests;
           E.wakeup resolver ();
           E.pure ()))

(* make-server — createServer + timeout disables; each request's
   effect joins the in-flight set. *)
type server_ctx =
  { bound_repo : string
  ; host : string
  ; owner_source : string
  ; ctx_root_dir : string
  ; port_cell : int option ref
  ; stop_fn : unit -> unit
  }

let make_server (proxy : proxy) (ctx : server_ctx) : Http_server.server =
  let server =
    Http_server.create (fun req res ->
        track_request
          (handle_request proxy ~bound_repo:ctx.bound_repo
             ~stop_fn:ctx.stop_fn ~host:ctx.host
             ~port:!(ctx.port_cell) ~owner_source:ctx.owner_source
             ~root_dir:ctx.ctx_root_dir req res))
  in
  Http_server.disable_timeouts server;
  server

let show_help () : unit =
  !log_fn
    (Cli_style.bold "db-worker-node" ^ " " ^ Cli_style.bold "options" ^ ":");
  !log_fn ("  " ^ Cli_style.bold "--root-dir" ^ " <path>    (required)");
  !log_fn ("  " ^ Cli_style.bold "--repo" ^ " <name>        (required)");
  !log_fn
    ("  " ^ Cli_style.bold "--create-empty-db"
    ^ "  (start with empty initial datoms)");
  !log_fn ("  " ^ Cli_style.bold "--embedding-endpoint" ^ " <url>");
  !log_fn ("  " ^ Cli_style.bold "--embedding-model-id" ^ " <id>");
  !log_fn
    ("  " ^ Cli_style.bold "--log-level" ^ " <level>  (default info)");
  !log_fn
    ("  " ^ Cli_style.bold "--version" ^ "            (print build metadata and exit)");
  !log_fn
    "  logs: <root-dir>/graphs/<graph-dir>/db-worker-node-YYYYMMDD.log (retains 7)"

let startup_db_opts ~(create_empty_db : bool) : Wire.t =
  if create_empty_db then
    Wire.Map
      [ Wire.Keyword "datoms", Wire.Array []
      ; Wire.Keyword "sync-download-graph?", Wire.Bool true ]
  else Wire.Map []

let close_server (server : Http_server.server) : bool E.t =
  Http_server.close server

let quiesce_runtime () : unit =
  ready := false;
  stopping := true;
  List.iter (fun s -> try s.close () with _ -> ()) !sse_clients;
  sse_clients := []

(* make-stop! — memoized stop: drains in-flight requests, closes the
   bound repo, then the server; records the stop on the admission. *)
let make_stop ~(proxy : proxy) ~(repo : string) ~(server : Http_server.server)
    ~(stopped : bool E.t option ref) ~(on_stopped : exn option -> unit) :
    unit -> bool E.t =
  fun () ->
    match !stopped with
    | Some p -> p
    | None ->
        quiesce_runtime ();
        let result =
          E.finally
            (E.catch
               (E.bind
                  (E.all !requests)
                  (fun _ ->
                     E.bind
                       (close_after
                          (close_bound_repo proxy repo)
                          (fun () -> E.map (fun _ -> ()) (close_server server)))
                       (fun _ ->
                          Db_worker_log.uninstall ();
                          (match !admission with
                           | Some rt -> Graph_lifecycle.release_ownership rt
                           | None -> ());
                          (match !admission with
                           | Some rt -> Graph_lifecycle.record_stop rt None
                           | None -> ());
                          on_stopped None;
                          E.pure true)))
               (fun error ->
                  (match !admission with
                   | Some rt ->
                       Graph_lifecycle.record_stop rt
                         (Some (Printexc.to_string error))
                   | None -> ());
                  Worker_log.error "db-worker-node-close-failed"
                    [ ("error", Printexc.to_string error) ];
                  on_stopped (Some error);
                  E.error error))
            (fun () -> Db_worker_log.uninstall (); E.pure ())
        in
        stopped := Some result;
        result

(* resolve-listening-daemon! — publish the bound port through
   graph-lifecycle (which appends to server-list inside the lease),
   then resolve the daemon record. *)
let resolve_listening_daemon ~(server : Http_server.server) ~(proxy : proxy)
    ~(repo : string) ~(host : string) ~(port_cell : int option ref)
    ~(stop_cell : (unit -> bool E.t) option ref) ~(stopped : bool E.t option ref)
    ~(on_stopped : exn option -> unit) : daemon E.t =
  let actual_port =
    match Http_server.address_port server with
    | Some p -> p
    | None -> invalid_arg "server has no bound port"
  in
  port_cell := Some actual_port;
  let stop =
    make_stop ~proxy ~repo ~server ~stopped ~on_stopped
  in
  (match !admission with
   | Some rt ->
       E.bind
         (Graph_lifecycle.publish rt actual_port (fun () ->
              (match !server_list_file with
               | Some file_path ->
                   E.async (fun () ->
                       Server_list.append_entry file_path
                         ~pid:(Node_process.pid ()) ~port:actual_port)
               | None -> ());
              stop_cell := Some stop;
              ready := true))
         (fun () ->
            E.pure { host; port = actual_port; server; stop })
   | None -> E.error (Failure "resolve-listening-daemon: no admission"))

(* start-http-server! — listen(port 0, host) then publish; failures
   close the server before rejecting. *)
let start_http_server ~(proxy : proxy) ~(repo : string) ~(host : string)
    ~(port : int) ~(owner_source : string) ~(root_dir : string)
    ~(on_stopped : exn option -> unit) : daemon E.t =
  let stop_cell : (unit -> bool E.t) option ref = ref None in
  let stopped : bool E.t option ref = ref None in
  let port_cell : int option ref = ref None in
  let server =
    make_server proxy
      { bound_repo = repo
      ; host
      ; owner_source
      ; ctx_root_dir = root_dir
      ; port_cell
      ; stop_fn =
          (fun () ->
             match !stop_cell with
             | Some stop -> E.async (fun () -> E.map (fun _ -> ()) (stop ()))
             | None -> ()) }
  in
  E.catch
    (E.bind
       (Http_server.listen server ~port ~host)
       (fun _actual_port ->
          E.catch
            (resolve_listening_daemon ~server ~proxy ~repo ~host ~port_cell
               ~stop_cell ~stopped ~on_stopped)
            (fun error ->
               E.async (fun () ->
                   E.catch (E.map (fun _ -> ()) (close_server server))
                     (fun _ -> E.pure ()));
               E.error error)))
    (fun error -> E.error error)

(* set-main-thread-stub! — cljs worker-state/*main-thread rejects
   "main-thread is not available in db-worker-node". In OCaml the
   equivalent channel is Comlink.invoke_remote, which already errors
   with "not implemented yet" on the melange node runtime. *)
let set_main_thread_stub () : unit = ()

(* start-daemon! — root-dir check → resolveStorage → admit → log
   install → platform → init-core → init/create-or-open-db → http. *)
type daemon_opts =
  { opt_root_dir : string
  ; opt_graphs_dir : string option
  ; opt_lifecycle_dir : string option
  ; opt_repo : string
  ; opt_admission_ticket : string option
  ; opt_graph_generation : string option
  ; opt_create_empty_db : bool
  ; opt_owner_source : string
  ; opt_embedding_endpoint : string option
  ; opt_embedding_model_id : string option
  ; opt_log_level : string option
  ; opt_on_stopped : exn option -> unit
  }

let start_daemon (opts : daemon_opts) : daemon E.t =
  let host = "127.0.0.1" in
  let port = 0 in
  let owner_source =
    Db_worker_daemon.normalize_owner_source
      (Wire.String opts.opt_owner_source)
  in
  if opts.opt_root_dir = "" then
    E.error
      (Dispatcher.Exn_info
         ( "root-dir is required"
         , [ Wire.Keyword "code", Wire.Keyword "missing-root-dir" ] ))
  else if opts.opt_repo = "" then
    E.error
      (Dispatcher.Exn_info
         ( "repo is required"
         , [ Wire.Keyword "code", Wire.Keyword "missing-repo" ] ))
  else
    let repo = opts.opt_repo in
    E.bind (Root_dir.ensure_root_dir opts.opt_root_dir) (fun root_dir ->
        let storage =
          Graph_lifecycle.resolve_storage ~root:root_dir
            ~graphs_dir:
              (Option.value opts.opt_graphs_dir
                 ~default:(Root_dir.graphs_dir root_dir))
        in
        (match opts.opt_lifecycle_dir with
         | Some ld when ld <> storage.lifecycle_dir ->
             raise
               (Dispatcher.Exn_info
                  ("Lifecycle directory identity mismatch", []))
         | _ -> ());
        E.bind
          (Graph_lifecycle.admit ~storage ~repo ~owner:owner_source
             ?ticket:opts.opt_admission_ticket
             ?generation:opts.opt_graph_generation ())
          (fun admission_rt ->
             admission := Some admission_rt;
             let root_dir = Graph_lifecycle.runtime_root admission_rt in
             let server_list_file_v = server_list_file_path root_dir in
             Node_process.set_env "LOGSEQ_WORKER_DB_DIR" storage.graphs_dir;
             Node_process.set_env "LOGSEQ_WORKER_KV_DIR" root_dir;
             let proxy_cell : proxy option ref = ref None in
             let setup_and_serve () : daemon E.t =
               E.bind
                 (Db_worker_log.install ~root_dir ~storage:(Some storage)
                    ~repo ~log_level:opts.opt_log_level)
                 (fun _file_path ->
                    Worker_log.info "db-worker-node-version"
                      [ "build-time", Common_version.build_time ()
                      ; "revision", Common_version.revision () ];
                    ready := false;
                    stopping := false;
                    requests := [];
                    platform_ref := None;
                    server_list_file := Some server_list_file_v;
                    set_main_thread_stub ();
                    let platform =
                      { root_dir
                      ; storage
                      ; drain_writes = (fun () -> E.pure ())
                      ; owner_source
                      ; embedding_endpoint = opts.opt_embedding_endpoint
                      ; embedding_model_id = opts.opt_embedding_model_id }
                    in
                    platform_ref := Some platform;
                    Broadcast.set_post_fn (fun ~kind ~payload ->
                        handle_event kind payload);
                    Worker_core.init ();
                    let proxy =
                      { remote_invoke =
                          (fun method_str args_transit ->
                             !remote_invoke_fn method_str args_transit)
                      ; remote_invoke_binary =
                          (fun method_str repo payload ->
                             Dispatcher.invoke method_str
                               [ Wire.String repo; Wire.Binary payload ]) }
                    in
                    proxy_cell := Some proxy;
                    E.bind (init_worker proxy) (fun _ ->
                        E.bind (!db_exists_fn ~repo)
                          (fun db_exists ->
                             (* A not-yet-created graph is initialized by
                                the first create-or-open-db call's opts
                                (e.g. import datoms), so only eagerly open
                                a graph that already exists on disk. *)
                             E.bind
                               (if db_exists || opts.opt_create_empty_db then
                                  invoke_args ~proxy
                                    ~method_str:"thread-api/create-or-open-db"
                                    ~method_label:"thread-api/create-or-open-db"
                                    ~args:
                                      [ Wire.String repo
                                      ; startup_db_opts
                                          ~create_empty_db:
                                            opts.opt_create_empty_db ]
                                else E.pure "")
                               (fun _ ->
                                  start_http_server ~proxy ~repo ~host ~port
                                    ~owner_source ~root_dir
                                    ~on_stopped:opts.opt_on_stopped))))
             in
             let abort_startup (error : exn) : daemon E.t =
               E.bind
                 (match !proxy_cell with
                  | Some p ->
                      E.catch
                        (E.map (fun _ -> ()) (close_bound_repo p repo))
                        (fun _ -> E.pure ())
                  | None -> E.pure ())
                 (fun () ->
                    Db_worker_log.uninstall ();
                    (try Graph_lifecycle.release_ownership admission_rt
                     with _ -> ());
                    (try
                       Graph_lifecycle.abort_admission admission_rt
                         (Some (Printexc.to_string error))
                     with _ -> ());
                    E.error error)
             in
             E.catch (setup_and_serve ()) abort_startup))

(* ---- entrypoint ---- *)

(* run-main-with-overrides seams continued (start_daemon_fn must live
   after [start_daemon]'s definition). *)
let exit_fn : (int -> unit) ref = ref Node_process.exit
let start_daemon_fn : (daemon_opts -> daemon E.t) ref = ref start_daemon

(* main — cljs load-ocaml-db-worker! is unnecessary here: this process
   IS the OCaml worker. *)
let main () : unit =
  let opts = parse_argv () in
  (if opts.help then begin
     show_help ();
     !exit_fn 0
   end);
  if opts.version then begin
    !log_fn (Common_version.format_version ());
    !exit_fn 0
  end;
  let root_dir = Option.value opts.root_dir ~default:"" in
  let repo = Option.value opts.repo ~default:"" in
  if root_dir = "" then begin
    !error_fn "root-dir is required";
    !exit_fn 1
  end;
  if repo = "" then begin
    !error_fn "repo is required";
    !exit_fn 1
  end;
  let on_stopped (error : exn option) : unit =
    Worker_log.info "db-worker-node-stopped" [];
    !exit_fn (match error with Some _ -> 1 | None -> 0)
  in
  E.async (fun () ->
      E.catch
        (E.map
           (fun (daemon : daemon) ->
              Worker_log.info "db-worker-node-ready"
                [ "host", daemon.host
                ; "port", string_of_int daemon.port ];
              Node_process.on_signal "SIGINT" (fun () ->
                  E.async (fun () -> E.map (fun _ -> ()) (daemon.stop ())));
              Node_process.on_signal "SIGTERM" (fun () ->
                  E.async (fun () -> E.map (fun _ -> ()) (daemon.stop ()))))
           (!start_daemon_fn
              { opt_root_dir = root_dir
              ; opt_graphs_dir = opts.graphs_dir
              ; opt_lifecycle_dir = opts.lifecycle_dir
              ; opt_repo = repo
              ; opt_admission_ticket = opts.admission_ticket
              ; opt_graph_generation = opts.graph_generation
              ; opt_create_empty_db = opts.create_empty_db
              ; opt_owner_source = Option.value opts.owner_source ~default:""
              ; opt_embedding_endpoint = opts.embedding_endpoint
              ; opt_embedding_model_id = opts.embedding_model_id
              ; opt_log_level = opts.log_level
              ; opt_on_stopped = on_stopped }))
        (fun error ->
           let code =
             match error with
             | Dispatcher.Exn_info (_, kvs) ->
                 (match kv_get kvs "code" with
                  | Some (Wire.Keyword c) -> c
                  | _ -> "")
             | _ -> ""
           in
           let message =
             match error with
             | Dispatcher.Exn_info (msg, _) -> msg
             | _ -> Printexc.to_string error
           in
           if code = "missing-root-dir" || code = "root-dir-permission" then
             !error_fn message
           else if
             Common_util.str_includes message ".node"
             || Common_util.str_includes message "Cannot find module"
             || Common_util.str_includes message "MODULE_NOT_FOUND"
             || Common_util.str_includes message "bindings file"
           then
             !error_fn
               ("db-worker-node failed to start: bundled runtime files are \
                 missing or incomplete. Rebuild with `pnpm \
                 db-worker-node:release:bundle` and ensure \
                 `dist/db-worker-node.js` exists and assets listed in \
                 `dist/db-worker-node-assets.json` are next to it. Root \
                 error: " ^ message)
           else
             !error_fn
               ("db-worker-node failed to start: " ^ message);
           (match error with
            | Dispatcher.Exn_info _ -> ()
            | _ -> !error_fn (Printexc.get_backtrace ()));
           !exit_fn 1;
           E.pure ()))
