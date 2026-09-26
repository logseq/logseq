(* Port of src/main/logseq/cli/server.cljs — db-worker-node lifecycle
   orchestration for the Electron main process. Internal composition is
   Db_worker_effect.t; the public API returns Js.Promise.t (promesa ->
   Js.Promise) so JS callers see the same contract. *)

module E = Db_worker_effect
module Daemon = Db_worker_daemon

(* ---------- JS externals ---------- *)

external __dirname : string = "__dirname"

(* E.t <-> Js.Promise bridges. JS rejection values are kept as the exn
   box so they round-trip back to JS unchanged (graph_lifecycle
   convention); %identity externals are the accepted pattern here. *)
external promise_error_as_exn : Js.Promise.error -> exn = "%identity"
external exn_as_json : exn -> Js.Json.t = "%identity"

let task_of_promise (promise : 'a Js.Promise.t) : 'a E.t =
  let task, resolver = E.wait () in
  let finish result = if E.is_pending task then E.wakeup resolver result in
  let on_ok value =
    finish (Ok value);
    Js.Promise.resolve ()
  in
  let on_error error =
    finish (Error (promise_error_as_exn error));
    Js.Promise.resolve ()
  in
  ignore
    (promise |> Js.Promise.then_ on_ok |> Js.Promise.catch on_error
      : unit Js.Promise.t);
  E.bind task (function
    | Ok value -> E.pure value
    | Error error -> E.error error)

let promise_of_task (task : 'a E.t) : 'a Js.Promise.t =
  Js.Promise.make (fun ~resolve ~reject ->
      E.on_any task (fun v -> (resolve v [@u])) (fun e -> (reject e [@u])))

module Lifecycle = struct
  type storage = Js.Json.t (* opaque {root, graphsDir, lifecycleDir} *)

  external resolve_storage : string -> string -> storage = "resolveStorage"
  [@@mel.module "@logseq/graph-lifecycle"]

  type start_options

  external start_options :
    ?generation:string ->
    storage:storage ->
    repo:string ->
    script:string ->
    ?binary:string ->
    env:string Js.Dict.t ->
    owner:string ->
    createEmpty:bool ->
    extraArgs:string array ->
    unit ->
    start_options = ""
  [@@mel.obj]

  external start : start_options -> Js.Json.t Js.Promise.t = "startGraph"
  [@@mel.module "@logseq/graph-lifecycle"]

  external stop : storage -> string -> string -> Js.Json.t Js.Promise.t
    = "stopGraph"
  [@@mel.module "@logseq/graph-lifecycle"]

  external storage_graphs_dir : storage -> string option = "graphsDir"
  [@@mel.get] [@@mel.return { undefined_to_opt }]
end

module Fs = struct
  type dirent

  external name : dirent -> string = "name" [@@mel.get]
  external is_directory : dirent -> bool = "isDirectory" [@@mel.send]

  type readdir_options

  external readdir_options : withFileTypes:bool -> unit -> readdir_options = ""
  [@@mel.obj]

  external readdir_sync : string -> readdir_options -> dirent array
    = "readdirSync"
  [@@mel.module "fs"]

  external realpath_sync : string -> string = "realpathSync" [@@mel.module "fs"]
end

(* ---------- config ---------- *)

type storage = Lifecycle.storage

type config = {
  root_dir : string option;
  storage : storage option;
  graphs_dir : string option;
  owner_source : Wire.t option;
  expected_revision : string option;
  generation : string option;
  create_empty_db : bool;
  embedding_endpoint : string option;
  embedding_model_id : string option;
  profile_session : Cli_profile.session option;
  base_url : string option;
  owned : bool option;
}

(* ---------- server record ----------
   Mirrors the cljs healthz/startGraph payload map (repo, host, port,
   pid, status, revision, root-dir, owner-source, generation,
   http-status, owned?). [raw] keeps the pass-through keys (ticket,
   storage, ownership-protocol, ...). *)

type server = {
  raw : Js.Json.t;
  repo : string option;
  host : string option;
  port : int option;
  pid : int option;
  status : string option;
  revision : string option;
  root_dir : string option;
  owner_source : string; (* normalized *)
  generation : string option;
  http_status : int option;
  owned : bool option;
}

type stop_error = { code : string option; message : string option }
type stop_result = { ok : bool; repo : string; error : stop_error option }

type cleanup_target = {
  repo : string option;
  pid : int option;
  owner_source : string;
  revision : string option;
}

type cleanup_result = {
  ok : bool;
  cli_revision : string;
  checked : int;
  mismatched : int;
  eligible : int;
  skipped_owner : int;
  skipped_owner_targets : cleanup_target list;
  killed : cleanup_target list;
  failed : (cleanup_target * stop_error option) list;
}

type graph_item =
  | Canonical of { graph_name : string; graph_dir : string }
  | Legacy of {
      legacy_dir : string;
      legacy_graph_name : string;
      target_graph_dir : string option;
      conflict : bool;
    }
  | Legacy_undecodable of { legacy_dir : string; reason : string }

(* ---------- json helpers ---------- *)

external get_field : Js.Json.t -> string -> Js.Json.t Js.Undefined.t = ""
[@@mel.get_index]

(* present and not null *)
let field (j : Js.Json.t) (k : string) : Js.Json.t option =
  match Js.Undefined.toOption (get_field j k) with
  | Some v -> (
      match Js.Json.decodeNull v with Some _ -> None | None -> Some v)
  | None -> None

let field_string j k = Option.bind (field j k) Js.Json.decodeString
let field_bool j k = Option.bind (field j k) Js.Json.decodeBoolean

let field_int j k =
  Option.bind (field j k) (fun v ->
      Option.map int_of_float (Js.Json.decodeNumber v))

let js_obj (kvs : (string * Js.Json.t) list) : Js.Json.t =
  let d = Js.Dict.empty () in
  List.iter (fun (k, v) -> Js.Dict.set d k v) kvs;
  Js.Json.object_ d

let jstr_opt = function Some s -> Js.Json.string s | None -> Js.Json.null

let jint_opt = function
  | Some n -> Js.Json.number (Float.of_int n)
  | None -> Js.Json.null

let wire_opt_of_string = function Some s -> Wire.String s | None -> Wire.Nil

let stop_error_to_js (e : stop_error option) : Js.Json.t =
  match e with
  | None -> Js.Json.null
  | Some { code; message } ->
      js_obj [ ("code", jstr_opt code); ("message", jstr_opt message) ]

let server_to_js (s : server) : Js.Json.t =
  (* clone the raw payload, then apply the cljs assoc/update overrides *)
  let dict =
    match Js.Json.decodeObject s.raw with
    | Some d ->
        let copy = Js.Dict.empty () in
        Js.Dict.entries d |> Array.iter (fun (k, v) -> Js.Dict.set copy k v);
        copy
    | None -> Js.Dict.empty ()
  in
  Js.Dict.set dict "owner-source" (Js.Json.string s.owner_source);
  (match s.http_status with
  | Some status ->
      Js.Dict.set dict "http-status" (Js.Json.number (Float.of_int status))
  | None -> ());
  (match s.owned with
  | Some owned -> Js.Dict.set dict "owned?" (Js.Json.boolean owned)
  | None -> ());
  Js.Json.object_ dict

let cleanup_target_to_js (t : cleanup_target) : Js.Json.t =
  js_obj
    [
      ("repo", jstr_opt t.repo);
      ("pid", jint_opt t.pid);
      ("owner-source", Js.Json.string t.owner_source);
      ("revision", jstr_opt t.revision);
    ]

let cleanup_result_to_js (r : cleanup_result) : Js.Json.t =
  js_obj
    [
      ("ok?", Js.Json.boolean r.ok);
      ( "data",
        js_obj
          [
            ("cli-revision", Js.Json.string r.cli_revision);
            ("checked", Js.Json.number (Float.of_int r.checked));
            ("mismatched", Js.Json.number (Float.of_int r.mismatched));
            ("eligible", Js.Json.number (Float.of_int r.eligible));
            ("skipped-owner", Js.Json.number (Float.of_int r.skipped_owner));
            ( "skipped-owner-targets",
              Js.Json.array
                (Array.of_list
                   (List.map cleanup_target_to_js r.skipped_owner_targets)) );
            ( "killed",
              Js.Json.array
                (Array.of_list (List.map cleanup_target_to_js r.killed)) );
            ( "failed",
              Js.Json.array
                (Array.of_list
                   (List.map
                      (fun (target, error) ->
                        let js = cleanup_target_to_js target in
                        (match Js.Json.decodeObject js with
                        | Some d ->
                            Js.Dict.set d "error" (stop_error_to_js error)
                        | None -> ());
                        js)
                      r.failed)) );
          ] );
    ]

let graph_item_to_js (item : graph_item) : Js.Json.t =
  match item with
  | Canonical { graph_name; graph_dir } ->
      js_obj
        [
          ("kind", Js.Json.string "canonical");
          ("graph-name", Js.Json.string graph_name);
          ("graph-dir", Js.Json.string graph_dir);
        ]
  | Legacy { legacy_dir; legacy_graph_name; target_graph_dir; conflict } ->
      js_obj
        [
          ("kind", Js.Json.string "legacy");
          ("legacy-dir", Js.Json.string legacy_dir);
          ("legacy-graph-name", Js.Json.string legacy_graph_name);
          ("target-graph-dir", jstr_opt target_graph_dir);
          ("conflict?", Js.Json.boolean conflict);
        ]
  | Legacy_undecodable { legacy_dir; reason } ->
      js_obj
        [
          ("kind", Js.Json.string "legacy-undecodable");
          ("legacy-dir", Js.Json.string legacy_dir);
          ("reason", Js.Json.string reason);
        ]

let normalize_owner_source (v : Wire.t) : string =
  Daemon.normalize_owner_source v

(* cljs keyword keys via clj->js keep the hyphenated names *)
let config_to_js (config : config) : Js.Json.t =
  js_obj
    (List.filter_map
       (fun x -> x)
       [
         Option.map (fun v -> ("root-dir", Js.Json.string v)) config.root_dir;
         Option.map (fun v -> ("storage", v)) config.storage;
         Option.map
           (fun v -> ("graphs-dir", Js.Json.string v))
           config.graphs_dir;
         Option.map
           (fun v ->
             ("owner-source", Js.Json.string (normalize_owner_source v)))
           config.owner_source;
         Option.map
           (fun v -> ("expected-revision", Js.Json.string v))
           config.expected_revision;
         Option.map
           (fun v -> ("generation", Js.Json.string v))
           config.generation;
         Some ("create-empty-db?", Js.Json.boolean config.create_empty_db);
         Option.map
           (fun v -> ("embedding-endpoint", Js.Json.string v))
           config.embedding_endpoint;
         Option.map
           (fun v -> ("embedding-model-id", Js.Json.string v))
           config.embedding_model_id;
         Option.map (fun v -> ("base-url", Js.Json.string v)) config.base_url;
         Option.map (fun v -> ("owned?", Js.Json.boolean v)) config.owned;
       ])

(* ---------- path / storage resolution ---------- *)

(* resolve-root-dir *)
let resolve_root_dir (config : config) : string =
  Common_graph.expand_home
    (match config.root_dir with
    | Some dir -> dir
    | None -> Node.Path.dirname (Common_graph.get_db_graphs_dir ()))

(* graphs-dir *)
let graphs_dir (config : config) : string =
  match Option.bind config.storage Lifecycle.storage_graphs_dir with
  | Some dir -> dir
  | None -> (
      match config.graphs_dir with
      | Some dir -> dir
      | None -> (
          match config.root_dir with
          | Some _ -> Root_dir.graphs_dir (resolve_root_dir config)
          | None -> Common_graph.get_db_graphs_dir ()))

(* resolve-storage *)
let resolve_storage (config : config) : storage =
  match config.storage with
  | Some storage -> storage
  | None ->
      Lifecycle.resolve_storage (resolve_root_dir config) (graphs_dir config)

let server_list_path (config : config) : string =
  Server_list.path (resolve_root_dir config)

(* ---------- script / binary paths ---------- *)

let db_worker_dev_script_path () =
  Node.Path.join [| __dirname; "../static/db-worker-node.js" |]

let db_worker_release_script_path_from dirname =
  if String.equal (Node.Path.basename dirname) "js" then
    Node.Path.join [| dirname; "db-worker-node.js" |]
  else Node.Path.join [| dirname; "js"; "db-worker-node.js" |]

let db_worker_release_script_path () =
  db_worker_release_script_path_from __dirname

(* goog.DEBUG -> NODE_ENV <> "production" *)
let db_worker_script_path () =
  if Electron_state.dev then db_worker_dev_script_path ()
  else db_worker_release_script_path ()

(* db-worker-binary-path — public per CONTRACTS.md. *)
let db_worker_binary_path () =
  if Electron_state.dev then
    Node.Path.join
      [| __dirname; "../deps/db-worker/_build/default/bin/main.exe" |]
  else
    Node.Path.join
      [|
        Electron_bindings.process_resources_path; "db-worker-bin"; "main.exe";
      |]

let db_worker_runtime_script_path () = db_worker_script_path ()

let base_url ~(host : string) ~(port : int) : string =
  Printf.sprintf "http://%s:%d" host port

(* ---------- owner / revision ---------- *)

(* requester-owner-source — (or (:owner-source config) :cli) *)
let requester_owner_source (config : config) : string =
  normalize_owner_source
    (Option.value config.owner_source ~default:(Wire.Keyword "cli"))

let expected_revision (config : config) : string =
  Option.value config.expected_revision ~default:(Common_version.revision ())

let revision_match expected server_revision =
  match server_revision with
  | Some revision -> String.equal expected revision
  | None -> false

let revision_mismatch expected server_revision =
  not (revision_match expected server_revision)

(* server-revision-mismatch-error — builds (message, ex-info data). *)
let server_revision_mismatch_error ~(code : string) ~(repo : string)
    ~(expected : string) (server : server) : string * (Wire.t * Wire.t) list =
  let message =
    match code with
    | "server-revision-mismatch-restart-failed" ->
        "db-worker-node revision mismatch and restart failed"
    | "server-revision-mismatch-after-restart" ->
        "db-worker-node revision still does not match after restart; \
         db-worker-node path: " ^ db_worker_script_path ()
    | _ -> "db-worker-node revision does not match requester revision"
  in
  ( message,
    [
      (Wire.Keyword "code", Wire.Keyword code);
      (Wire.Keyword "message", Wire.String message);
      (Wire.Keyword "repo", Wire.String repo);
      (Wire.Keyword "expected-revision", Wire.String expected);
      (Wire.Keyword "actual-revision", wire_opt_of_string server.revision);
      (Wire.Keyword "owner-source", Wire.Keyword server.owner_source);
    ] )

(* owner-manageable? *)
let owner_manageable ~(requester_owner : string) ~(lock_owner : string) : bool =
  String.equal requester_owner lock_owner
  || (String.equal requester_owner "cli" && String.equal lock_owner "unknown")

(* ---------- healthz / server decoding ---------- *)

let decode_owner_source (j : Js.Json.t) : string =
  normalize_owner_source
    (match field j "owner-source" with
    | Some v -> (
        match Js.Json.decodeString v with
        | Some s -> Wire.String s
        | None -> Wire.Nil)
    | None -> Wire.Nil)

let server_of_payload ~(http_status : int option) ~(owned : bool option)
    (json : Js.Json.t) : server =
  {
    raw = json;
    repo = field_string json "repo";
    host = field_string json "host";
    port = field_int json "port";
    pid = field_int json "pid";
    status = field_string json "status";
    revision = field_string json "revision";
    root_dir = field_string json "root-dir";
    owner_source = decode_owner_source json;
    generation = field_string json "generation";
    http_status;
    owned;
  }

(* fetch-healthz — GET /healthz, 1s timeout, payload + :http-status. *)
let fetch_healthz ~(host : string) ~(port : int) : server E.t =
  E.map
    (fun (r : Daemon.http_result) ->
      let json = Js.Json.parseExn r.body in
      server_of_payload ~http_status:(Some r.status) ~owned:None json)
    (Daemon.http_request ~timeout_ms:1000. ~method_:"GET" ~host ~port
       ~path:"/healthz" ())

(* ---------- canonical paths ---------- *)

(* canonical-path — (when (seq path) ...) *)
let canonical_path (path : string option) : string option =
  match path with
  | Some path when not (String.equal path "") ->
      let path = Common_graph.expand_home path in
      Some (try Fs.realpath_sync path with _ -> Root_dir.path_resolve path)
  | _ -> None

let current_root_dir (config : config) : string option =
  canonical_path (Some (resolve_root_dir config))

let same_root_dir (config : config) (server : server) : bool =
  match server.root_dir with
  | Some dir when not (String.equal dir "") -> (
      match (current_root_dir config, canonical_path server.root_dir) with
      | Some current, Some server_dir -> String.equal current server_dir
      | _ -> false)
  | _ -> false

(* ---------- discover-servers ---------- *)

type discover_result = {
  entry : Server_list.entry;
  retain : bool;
  server : server option;
}

let discover_entry (entry : Server_list.entry) : discover_result E.t =
  match Daemon.pid_status entry.pid with
  | Node_process.Not_found -> E.pure { entry; retain = false; server = None }
  | _ ->
      E.catch
        (E.map
           (fun server -> { entry; retain = true; server = Some server })
           (fetch_healthz ~host:"127.0.0.1" ~port:entry.port))
        (fun _ -> E.pure { entry; retain = true; server = None })

let discover_servers_task (config : config) : server list E.t =
  let path = server_list_path config in
  E.bind (Server_list.read_entries path) (fun entries ->
      E.bind
        (E.all (List.map discover_entry entries))
        (fun results ->
          let retained =
            List.filter (fun (r : discover_result) -> r.retain) results
          in
          let stale =
            List.filter_map
              (fun (r : discover_result) ->
                if r.retain then None else Some r.entry)
              results
          in
          E.bind
            (match stale with
            | [] -> E.pure ()
            | _ -> Server_list.remove_entries path stale)
            (fun () ->
              E.pure
                (List.filter_map
                   (fun (r : discover_result) -> r.server)
                   retained))))

(* ---------- ensure / stop ---------- *)

(* ensure-server-started-once! *)
let ensure_server_started_once (config : config) (repo : string) : server E.t =
  let owner = requester_owner_source config in
  (* electron runs the native OCaml daemon binary; cli and Windows keep
     spawning the node db-worker-node.js bundle. *)
  let binary =
    if
      String.equal owner "electron"
      && not (String.equal Electron_bindings.process_platform "win32")
    then Some (db_worker_binary_path ())
    else None
  in
  (* The daemon reports the requester build revision; the JS bundle has
     no compile-time define, so it is passed via env. *)
  let env = Js.Dict.empty () in
  Js.Dict.set env "LOGSEQ_BUILD_REVISION" (Common_version.revision ());
  Js.Dict.set env "LOGSEQ_BUILD_TIME" (Common_version.build_time ());
  let extra_args =
    Array.of_list
      (List.concat
         [
           (match config.embedding_endpoint with
           | Some v -> [ "--embedding-endpoint"; v ]
           | None -> []);
           (match config.embedding_model_id with
           | Some v -> [ "--embedding-model-id"; v ]
           | None -> []);
         ])
  in
  E.map
    (fun json ->
      let owner_source = decode_owner_source json in
      let owned =
        owner_manageable ~requester_owner:owner ~lock_owner:owner_source
      in
      let server =
        server_of_payload ~http_status:None ~owned:(Some owned) json
      in
      { server with owner_source })
    (task_of_promise
       (Lifecycle.start
          (Lifecycle.start_options ?generation:config.generation
             ~storage:(resolve_storage config) ~repo
             ~script:(db_worker_script_path ()) ?binary ~env ~owner
             ~createEmpty:config.create_empty_db ~extraArgs:extra_args ())))

(* stop-server-target! — repo is the requested repo string (cljs keys
   the result off the argument, not the payload). *)
let stop_server_target (config : config) (repo : string)
    ?(target_server : server option) ~(allow_cross_owner : bool) () :
    stop_result E.t =
  let owner_name =
    if allow_cross_owner then
      match target_server with
      | Some server -> server.owner_source
      | None ->
          (* cljs (name (:owner-source nil)) throws — fail fast. *)
          failwith
            "Cli_server.stop_server_target: allow-cross-owner requires \
             target-server"
    else requester_owner_source config
  in
  E.catch
    (E.map
       (fun _ -> { ok = true; repo; error = None })
       (task_of_promise
          (Lifecycle.stop (resolve_storage config) repo owner_name)))
    (fun e ->
      let field_str name =
        try
          Option.bind
            (Js.Undefined.toOption (get_field (exn_as_json e) name))
            Js.Json.decodeString
        with _ -> None
      in
      E.pure
        {
          ok = false;
          repo;
          error =
            Some { code = field_str "code"; message = field_str "message" };
        })

let stop_server_task (config : config) (repo : string) : stop_result E.t =
  stop_server_target config repo ~allow_cross_owner:false ()

let stop_version_mismatched_server (config : config) (repo : string)
    (server : server) : stop_result E.t =
  stop_server_target config repo ?target_server:(Some server)
    ~allow_cross_owner:true ()

(* ensure-server-started! — one restart on revision mismatch, then
   ex-info failures. *)
let ensure_server_started (config : config) (repo : string) : server E.t =
  let expected = expected_revision config in
  E.bind (ensure_server_started_once config repo) (fun server ->
      if not (revision_mismatch expected server.revision) then E.pure server
      else
        let stop_task =
          Cli_profile.time_task config.profile_session
            "server.restart-version-mismatch" (fun () ->
              Electron_logger.info_args
                [|
                  Js.Json.string "cli-server-restart-version-mismatch";
                  js_obj
                    [
                      ("repo", Js.Json.string repo);
                      ("expected-revision", Js.Json.string expected);
                      ("current-revision", jstr_opt server.revision);
                      ("owner-source", Js.Json.string server.owner_source);
                      ("pid", jint_opt server.pid);
                      ("host", jstr_opt server.host);
                      ("port", jint_opt server.port);
                      ("root-dir", jstr_opt server.root_dir);
                      ("status", jstr_opt server.status);
                    ];
                |];
              stop_version_mismatched_server config repo server)
        in
        E.bind stop_task (fun stop_result ->
            if not stop_result.ok then
              let message, data =
                server_revision_mismatch_error
                  ~code:"server-revision-mismatch-restart-failed" ~repo
                  ~expected server
              in
              let data =
                data
                @ [
                    ( Wire.Keyword "stop-error",
                      match stop_result.error with
                      | Some err ->
                          Wire.Map
                            [
                              (Wire.Keyword "code", wire_opt_of_string err.code);
                              ( Wire.Keyword "message",
                                wire_opt_of_string err.message );
                            ]
                      | None -> Wire.Nil );
                  ]
              in
              E.error (Dispatcher.Exn_info (message, data))
            else
              E.bind (ensure_server_started_once config repo) (fun server' ->
                  if not (revision_mismatch expected server'.revision) then
                    E.pure server'
                  else
                    let message, data =
                      server_revision_mismatch_error
                        ~code:"server-revision-mismatch-after-restart" ~repo
                        ~expected server'
                    in
                    let data =
                      data @ [ (Wire.Keyword "after-restart?", Wire.Bool true) ]
                    in
                    E.error (Dispatcher.Exn_info (message, data)))))

(* ensure-server! — resolves the config merged with base-url,
   generation, owner-source and owned? from the lock. *)
let ensure_server_task (config : config) (repo : string) : config E.t =
  E.map
    (fun (lock : server) ->
      let base_url =
        match (lock.host, lock.port) with
        | Some host, Some port -> Some (base_url ~host ~port)
        | _ -> None
      in
      {
        config with
        base_url;
        generation = lock.generation;
        owner_source = Some (Wire.String lock.owner_source);
        owned = lock.owned;
      })
    (ensure_server_started config repo)

(* ---------- list-servers / cleanup ---------- *)

let list_servers_task (config : config) : server list E.t =
  E.map
    (fun servers -> List.filter (same_root_dir config) servers)
    (discover_servers_task config)

let cleanup_target (s : server) : cleanup_target =
  {
    repo = s.repo;
    pid = s.pid;
    owner_source = s.owner_source;
    revision = s.revision;
  }

(* cleanup-revision-mismatched-servers! *)
let cleanup_revision_mismatched_servers_task (config : config)
    (cli_revision : string) : cleanup_result E.t =
  E.bind (list_servers_task config) (fun servers ->
      let mismatched =
        List.filter
          (fun (s : server) ->
            not
              (match s.revision with
              | Some r -> String.equal cli_revision r
              | None -> false))
          servers
      in
      let eligible =
        List.filter
          (fun (s : server) -> String.equal s.owner_source "cli")
          mismatched
      in
      let skipped_owner_targets =
        List.map cleanup_target
          (List.filter
             (fun (s : server) -> not (String.equal s.owner_source "cli"))
             mismatched)
      in
      (* cljs (assoc config :owner-source :cli) *)
      let cli_config =
        { config with owner_source = Some (Wire.Keyword "cli") }
      in
      E.bind
        (E.all
           (List.map
              (fun (server : server) ->
                let target = cleanup_target server in
                let repo = Option.value server.repo ~default:"" in
                E.map
                  (fun (result : stop_result) ->
                    match (result.ok, result.error) with
                    | true, _ -> `Killed target
                    | false, Some { code = Some "server-not-found"; _ } ->
                        `Killed target
                    | false, error -> `Failed (target, error))
                  (stop_server_task cli_config repo))
              eligible))
        (fun results ->
          let killed =
            List.filter_map
              (function `Killed t -> Some t | `Failed _ -> None)
              results
          in
          let failed =
            List.filter_map
              (function `Failed (t, e) -> Some (t, e) | `Killed _ -> None)
              results
          in
          E.pure
            {
              ok = true;
              cli_revision;
              checked = List.length servers;
              mismatched = List.length mismatched;
              eligible = List.length eligible;
              skipped_owner = List.length skipped_owner_targets;
              skipped_owner_targets;
              killed;
              failed;
            }))

(* ---------- list-graph-items ---------- *)

let ignored_graph_dir (graph_name : string) : bool =
  String.equal graph_name Common_config.unlinked_graphs_dir
  || String.equal graph_name "backup"
  || Common_util.str_starts_with graph_name Common_config.file_version_prefix

let legacy_derivation_signal (dir_name : string) : bool =
  Regexp.test Graph_dir.legacy_dir_pattern_re dir_name

let decode_legacy_graph_name (legacy_dir : string) : string option =
  match Graph_dir.decode_legacy_graph_dir_name legacy_dir with
  | Some name when not (ignored_graph_dir name) -> Some name
  | _ -> None

let canonical_dir_name ~(dir_name : string) ~(graph_name : string) : bool =
  match Graph_dir.repo_to_encoded_graph_dir_name graph_name with
  | Some encoded -> String.equal dir_name encoded
  | None -> false

let classify_graph_dir (graphs_root : string) (dir_name : string) :
    graph_item option =
  if ignored_graph_dir dir_name then None
  else
    let decoded_canonical = Graph_dir.decode_canonical_graph_dir_key dir_name in
    let canonical =
      match decoded_canonical with
      | Some decoded when not (ignored_graph_dir decoded) ->
          canonical_dir_name ~dir_name ~graph_name:decoded
      | _ -> false
    in
    let legacy_graph_name =
      match decoded_canonical with
      | Some decoded when not canonical -> Some decoded
      | _ -> decode_legacy_graph_name dir_name
    in
    if canonical then
      match decoded_canonical with
      | Some graph_name -> Some (Canonical { graph_name; graph_dir = dir_name })
      | None -> None
    else
      match legacy_graph_name with
      | Some graph_name ->
          let target_graph_dir =
            Graph_dir.repo_to_encoded_graph_dir_name graph_name
          in
          let conflict =
            match target_graph_dir with
            | Some target when not (String.equal target dir_name) ->
                Node.Fs.existsSync (Node.Path.join [| graphs_root; target |])
            | _ -> false
          in
          Some
            (Legacy
               {
                 legacy_dir = dir_name;
                 legacy_graph_name = graph_name;
                 target_graph_dir;
                 conflict;
               })
      | None ->
          if legacy_derivation_signal dir_name then
            Some
              (Legacy_undecodable
                 { legacy_dir = dir_name; reason = "graph-name-not-derivable" })
          else None

let list_graph_items (config : config) : graph_item array =
  let graphs_root = graphs_dir config in
  if Node.Fs.existsSync graphs_root then
    Fs.readdir_sync graphs_root (Fs.readdir_options ~withFileTypes:true ())
    |> Array.to_list
    |> List.filter (fun d -> Fs.is_directory d)
    |> List.filter_map (fun d -> classify_graph_dir graphs_root (Fs.name d))
    |> Array.of_list
  else [||]

(* ---------- js decoders ---------- *)

(* config_of_js — reads the cljs keyword keys (clj->js style).
   :profile-session holds cljs atoms and cannot be reconstructed from
   JS; it decodes to None. *)
let config_of_js (j : Js.Json.t) : config =
  {
    root_dir = field_string j "root-dir";
    storage =
      (match field j "storage" with
      | Some v when Js.Json.test v Js.Json.Object -> Some v
      | _ -> None);
    graphs_dir = field_string j "graphs-dir";
    owner_source =
      (match field j "owner-source" with
      | Some v -> (
          match Js.Json.decodeString v with
          | Some s -> Some (Wire.String s)
          | None -> Some Wire.Nil)
      | None -> None);
    expected_revision = field_string j "expected-revision";
    generation = field_string j "generation";
    create_empty_db =
      Option.value (field_bool j "create-empty-db?") ~default:false;
    embedding_endpoint = field_string j "embedding-endpoint";
    embedding_model_id = field_string j "embedding-model-id";
    profile_session = None;
    base_url = field_string j "base-url";
    owned = field_bool j "owned?";
  }

(* ---------- public JS-facing API ---------- *)

let ensure_server (config : config) (repo : string) : Js.Json.t Js.Promise.t =
  promise_of_task (E.map config_to_js (ensure_server_task config repo))

let stop_server (config : config) (repo : string) : Js.Json.t Js.Promise.t =
  promise_of_task
    (E.map
       (fun (r : stop_result) ->
         match r.ok with
         | true ->
             js_obj
               [
                 ("ok?", Js.Json.boolean true);
                 ("data", js_obj [ ("repo", Js.Json.string r.repo) ]);
               ]
         | false ->
             js_obj
               [
                 ("ok?", Js.Json.boolean false);
                 ("error", stop_error_to_js r.error);
               ])
       (stop_server_task config repo))

let discover_servers (config : config) : Js.Json.t array Js.Promise.t =
  promise_of_task
    (E.map
       (fun servers -> Array.of_list (List.map server_to_js servers))
       (discover_servers_task config))

let list_servers (config : config) : Js.Json.t array Js.Promise.t =
  promise_of_task
    (E.map
       (fun servers -> Array.of_list (List.map server_to_js servers))
       (list_servers_task config))

let cleanup_revision_mismatched_servers (config : config)
    (cli_revision : string) : Js.Json.t Js.Promise.t =
  promise_of_task
    (E.map cleanup_result_to_js
       (cleanup_revision_mismatched_servers_task config cli_revision))

(* Js.Json.t-in entry points (cljs-map config from JS callers). *)
let ensure_server_js (config_js : Js.Json.t) (repo : string) :
    Js.Json.t Js.Promise.t =
  ensure_server (config_of_js config_js) repo

let stop_server_js (config_js : Js.Json.t) (repo : string) :
    Js.Json.t Js.Promise.t =
  stop_server (config_of_js config_js) repo

let discover_servers_js (config_js : Js.Json.t) : Js.Json.t array Js.Promise.t =
  discover_servers (config_of_js config_js)

let list_servers_js (config_js : Js.Json.t) : Js.Json.t array Js.Promise.t =
  list_servers (config_of_js config_js)

let cleanup_revision_mismatched_servers_js (config_js : Js.Json.t)
    (cli_revision : string) : Js.Json.t Js.Promise.t =
  cleanup_revision_mismatched_servers (config_of_js config_js) cli_revision

let list_graph_items_js (config_js : Js.Json.t) : Js.Json.t array =
  Array.map graph_item_to_js (list_graph_items (config_of_js config_js))
