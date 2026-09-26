(* Port of electron.db-worker — the per-graph db-worker-node lease
   manager. Daemon spawn/stop go through Cli_server (the ported
   logseq.cli.server orchestrator); lifecycle observation goes through
   @logseq/graph-lifecycle. *)

module Lifecycle = struct
  (* snapshot(storage, repo) -> state.json object or undefined *)
  external snapshot : Cli_server.storage -> string -> Js.Json.t = "snapshot"
    [@@mel.module "@logseq/graph-lifecycle"]

  (* observe(storage, repo, generation, onChange) -> close fn.
     generation nil in cljs is JS null, so the param is Js.Null.t. *)
  external observe :
    Cli_server.storage ->
    string ->
    string Js.Null.t ->
    (Js.Json.t -> unit) ->
    (unit -> unit) = "observe"
    [@@mel.module "@logseq/graph-lifecycle"]

  external stop_outdated_workers :
    Cli_server.storage -> string -> Js.Json.t Js.Promise.t
    = "stopOutdatedWorkers"
    [@@mel.module "@logseq/graph-lifecycle"]
end

external get_index : 'a -> string -> 'b Js.Undefined.t = ""
  [@@mel.get_index]

external promise_error_as_exn : Js.Promise.error -> exn = "%identity"

let exn_info ~(code : string) (message : string)
    (fields : (string * Wire.t) list) : exn =
  Dispatcher.Exn_info
    ( message
    , (Wire.Keyword "code", Wire.Keyword code)
      :: List.map (fun (k, v) -> (Wire.Keyword k, v)) fields )

let field_string (j : Js.Json.t) (k : string) : string option =
  match Js.Json.classify j with
  | Js.Json.JSONObject _ ->
      Option.bind (Js.Undefined.toOption (get_index j k))
        Js.Json.decodeString
  | _ -> None

let field_bool (j : Js.Json.t) (k : string) : bool option =
  match Js.Json.classify j with
  | Js.Json.JSONObject _ ->
      Option.bind (Js.Undefined.toOption (get_index j k))
        Js.Json.decodeBoolean
  | _ -> None

(* ---------- state ---------- *)

(* {:repo, :root-dir, :storage, :generation, :base-url, :auth-token,
    :close-observer!, :owned?} *)
type runtime =
  { repo : string
  ; root_dir : string
  ; storage : Cli_server.storage
  ; generation : string option
  ; base_url : string option
  ; auth_token : Js.Json.t (* always nil for managed runtimes *)
  ; close_observer : (unit -> unit) option
  ; owned : bool option
  }

(* {:runtime :windows :stopping} — cljs entry maps are immutable; here
   the fields are mutable record slots. :windows is a set of window ids. *)
type repo_entry =
  { mutable runtime : runtime option
  ; mutable windows : int list
  ; mutable stopping : bool Js.Promise.t option
  }

(* {:repos :window->repo :epochs} *)
type state =
  { repos : (string, repo_entry) Hashtbl.t
  ; window_repo : (int, string) Hashtbl.t
  ; epochs : (string, int) Hashtbl.t
  }

let init_state () : state =
  { repos = Hashtbl.create 8
  ; window_repo = Hashtbl.create 8
  ; epochs = Hashtbl.create 8
  }

(* repo-key — graph-dir/repo-identity. Encoded keys are never "", so ""
   is the nil-key equivalent: cljs would key the entry under nil and
   aggregate unencodable repos there the same way. *)
let repo_key (repo : string) : string =
  Option.value (Graph_dir.repo_identity repo) ~default:""

let epoch_of (state : state) (key : string) : int =
  Option.value (Hashtbl.find_opt state.epochs key) ~default:0

let add_window (window_id : int) (windows : int list) : int list =
  if List.mem window_id windows then windows else window_id :: windows

(* detach-window — returns the runtime when the last window leaves and
   the repo entry is removed. *)
let detach_window (state : state) (window_id : int) : runtime option =
  match Hashtbl.find_opt state.window_repo window_id with
  | None -> None
  | Some key -> (
      Hashtbl.remove state.window_repo window_id;
      match Hashtbl.find_opt state.repos key with
      | None -> None
      | Some entry ->
          entry.windows <-
            List.filter (fun w -> w <> window_id) entry.windows;
          if entry.windows = [] then (
            Hashtbl.remove state.repos key;
            entry.runtime)
          else None)

(* detach-repo — drops the repo entry plus every window->repo mapping it
   owned; returns its runtime. *)
let detach_repo (state : state) (key : string) : runtime option =
  match Hashtbl.find_opt state.repos key with
  | None -> None
  | Some entry ->
      List.iter (Hashtbl.remove state.window_repo) entry.windows;
      Hashtbl.remove state.repos key;
      entry.runtime

type manager =
  { start_daemon : string -> Js.Json.t -> runtime Js.Promise.t
  ; stop_daemon : runtime -> bool Js.Promise.t
  ; runtime_ready : runtime -> bool Js.Promise.t
  ; state : state
  }

(* create-manager — cljs takes {:start-daemon! :stop-daemon!
   :runtime-ready?} where :runtime-ready? defaults to resolved-true. *)
let create_manager
    ~(start_daemon : string -> Js.Json.t -> runtime Js.Promise.t)
    ~(stop_daemon : runtime -> bool Js.Promise.t)
    ?(runtime_ready : (runtime -> bool Js.Promise.t) option) () : manager =
  { start_daemon
  ; stop_daemon
  ; runtime_ready =
      Option.value runtime_ready ~default:(fun _ -> Js.Promise.resolve true)
  ; state = init_state ()
  }

let owned_runtime (runtime : runtime) : bool =
  not (Option.equal Bool.equal runtime.owned (Some false))

(* p/deferred *)
let deferred () : bool Js.Promise.t * (bool -> unit) =
  let resolve_ref = ref (fun (_ : bool) -> ()) in
  let promise =
    Js.Promise.make (fun ~resolve ~reject:_ ->
        resolve_ref := (fun v -> (resolve v [@u])))
  in
  (promise, fun v -> !resolve_ref v)

(* ensure-window-stopped! — detach the window; when it held the last
   window of an owned runtime, stop the daemon and close the observer,
   leaving a stopping placeholder until the stop settles. *)
let ensure_window_stopped (manager : manager) (window_id : int)
    : bool Js.Promise.t =
  let state = manager.state in
  let key = Hashtbl.find_opt state.window_repo window_id in
  let runtime = detach_window state window_id in
  match runtime, key with
  | Some runtime, Some key ->
      let stopping, resolve_stopping = deferred () in
      (* assign the last-window stop before yielding *)
      Hashtbl.replace state.repos key
        { runtime = Some runtime; windows = []; stopping = Some stopping };
      let finish success =
        match Hashtbl.find_opt state.repos key with
        | Some entry -> (
            match entry.stopping with
            | Some s when s == stopping ->
                if success then Hashtbl.remove state.repos key
                else entry.stopping <- None
            | _ -> ())
        | None -> ()
      in
      let work =
        Js.Promise.then_
          (fun stopped ->
            if not stopped then
              raise
                (exn_info ~code:"server-stop-failed"
                   "Worker stop did not complete" []);
            (match runtime.close_observer with
             | Some close -> close ()
             | None -> ());
            finish true;
            resolve_stopping true;
            Js.Promise.resolve true)
          (if owned_runtime runtime then manager.stop_daemon runtime
           else Js.Promise.resolve true)
      in
      Js.Promise.catch
        (fun error ->
          finish false;
          resolve_stopping false;
          Js.Promise.reject (promise_error_as_exn error))
        work
  | _ -> Js.Promise.resolve false

(* ensure-started! *)
let rec ensure_started (manager : manager) (repo : string)
    (window_id : int) (opts : Js.Json.t option) : runtime Js.Promise.t =
  let state = manager.state in
  let key = repo_key repo in
  let generation = Option.bind opts (fun o -> field_string o "generation") in
  let epoch = epoch_of state key in
  let assert_current () =
    if epoch_of state key <> epoch then
      raise
        (exn_info ~code:"graph-not-exists" "Graph lifecycle changed"
           [ ("repo", Wire.String repo) ])
  in
  let install (runtime : runtime) : runtime =
    try
      assert_current ();
      (match Hashtbl.find_opt state.repos key with
       | Some entry -> (
           match entry.runtime with
           | Some previous when previous != runtime ->
               (match previous.close_observer with
                | Some close -> close ()
                | None -> ())
           | _ -> ())
       | None -> ());
      let windows =
        match Hashtbl.find_opt state.repos key with
        | Some entry -> entry.windows
        | None -> []
      in
      Hashtbl.replace state.repos key
        { runtime = Some runtime
        ; windows = add_window window_id windows
        ; stopping = None
        };
      Hashtbl.replace state.window_repo window_id key;
      runtime
    with e ->
      (match runtime.close_observer with
       | Some close -> close ()
       | None -> ());
      raise e
  in
  let opts_json =
    Option.value opts ~default:(Js.Json.object_ (Js.Dict.empty ()))
  in
  let start_and_install () : runtime Js.Promise.t =
    Js.Promise.then_
      (fun runtime -> Js.Promise.resolve (install runtime))
      (manager.start_daemon repo opts_json)
  in
  let after_migration () : runtime Js.Promise.t =
    match Hashtbl.find_opt state.repos key with
    | Some entry -> (
        match entry.stopping with
        | Some stopping ->
            Js.Promise.then_
              (fun stopped ->
                if not stopped then
                  raise
                    (exn_info ~code:"server-stop-failed"
                       "Worker stop did not complete" []);
                assert_current ();
                ensure_started manager repo window_id opts)
              stopping
        | None -> (
            match entry.runtime with
            | Some runtime ->
                if
                  Option.is_some generation
                  && not
                       (Option.equal String.equal generation
                          runtime.generation)
                then
                  Js.Promise.reject
                    (exn_info ~code:"graph-not-exists"
                       "Graph generation changed"
                       [ ("repo", Wire.String repo) ])
                else
                  Js.Promise.then_
                    (fun ready ->
                      assert_current ();
                      if ready then (
                        entry.windows <- add_window window_id entry.windows;
                        Hashtbl.replace state.window_repo window_id key;
                        Js.Promise.resolve runtime)
                      else (
                        (match runtime.close_observer with
                         | Some close -> close ()
                         | None -> ());
                        Js.Promise.then_
                          (fun (_ : bool) ->
                            assert_current ();
                            start_and_install ())
                          (if owned_runtime runtime then
                             Js.Promise.catch
                               (fun _ -> Js.Promise.resolve true)
                               (manager.stop_daemon runtime)
                           else Js.Promise.resolve true)))
                    (manager.runtime_ready runtime)
            | None -> start_and_install ()))
    | None ->
        assert_current ();
        start_and_install ()
  in
  match Hashtbl.find_opt state.window_repo window_id with
  | Some current_repo when not (String.equal current_repo key) ->
      Js.Promise.then_
        (fun (_ : bool) -> after_migration ())
        (ensure_window_stopped manager window_id)
  | _ -> after_migration ()

(* parse-runtime-lock — {:host :port} from :base-url via js/URL *)
module Url = struct
  type t

  external make : string -> t = "URL" [@@mel.new]
  external hostname : t -> string = "hostname" [@@mel.get]
  external port : t -> string = "port" [@@mel.get]
end

let parse_runtime_lock (runtime : runtime) : (string * int) option =
  match runtime.base_url with
  | Some base_url when String.trim base_url <> "" -> (
      try
        let parsed = Url.make base_url in
        let host = Url.hostname parsed in
        match int_of_string_opt (Url.port parsed) with
        | Some port when host <> "" && port > 0 -> Some (host, port)
        | _ -> None
      with _ -> None)
  | _ -> None

(* runtime-ready-default? — lifecycle snapshot must still match the
   stored generation and be "available"; then the daemon must answer
   /healthz. *)
let runtime_ready_default (runtime : runtime) : bool Js.Promise.t =
  let current = Lifecycle.snapshot runtime.storage runtime.repo in
  if
    Option.equal String.equal
      (field_string current "generation")
      runtime.generation
    && field_string current "phase" = Some "available"
  then
    match parse_runtime_lock runtime with
    | Some (host, port) ->
        Cli_server.promise_of_task (Db_worker_daemon.ready ~host ~port)
    | None -> Js.Promise.resolve false
  else Js.Promise.resolve false

(* ensure-stopped! — only stop when the window currently holds this repo *)
let ensure_stopped (manager : manager) (repo : string) (window_id : int)
    : bool Js.Promise.t =
  let key = repo_key repo in
  match Hashtbl.find_opt manager.state.window_repo window_id with
  | Some current when String.equal current key ->
      ensure_window_stopped manager window_id
  | _ -> Js.Promise.resolve false

(* ensure-repo-stopped! *)
let ensure_repo_stopped (manager : manager) (repo : string)
    : bool Js.Promise.t =
  let state = manager.state in
  let key = repo_key repo in
  let runtime =
    match Hashtbl.find_opt state.repos key with
    | Some entry -> entry.runtime
    | None -> None
  in
  match runtime with
  | None -> Js.Promise.resolve false
  | Some runtime ->
      Js.Promise.then_
        (fun stopped ->
          if not stopped then
            raise
              (exn_info ~code:"server-stop-failed"
                 "Worker stop did not complete"
                 [ ("repo", Wire.String repo) ]);
          (match runtime.close_observer with
           | Some close -> close ()
           | None -> ());
          (match Hashtbl.find_opt state.repos key with
           | Some entry -> (
               match entry.runtime with
               | Some r when r == runtime -> ignore (detach_repo state key)
               | _ -> ())
           | None -> ());
          Js.Promise.resolve true)
        (if owned_runtime runtime then manager.stop_daemon runtime
         else Js.Promise.resolve true)

(* stop-all! — cljs (p/all ...) then true *)
let stop_all (manager : manager) : bool Js.Promise.t =
  let keys =
    Hashtbl.fold (fun key _ acc -> key :: acc) manager.state.repos []
  in
  Js.Promise.then_
    (fun (_ : bool array) -> Js.Promise.resolve true)
    (Js.Promise.all
       (Array.of_list
          (List.map (fun key -> ensure_repo_stopped manager key) keys)))

(* invalidate-repo! *)
let invalidate_repo ?(keep_observer : bool = false) (state : state)
    (repo : string) : unit =
  let key = repo_key repo in
  let runtime =
    match Hashtbl.find_opt state.repos key with
    | Some entry -> entry.runtime
    | None -> None
  in
  (match keep_observer, runtime with
   | false, Some { close_observer = Some close; _ } -> close ()
   | _ -> ());
  ignore (detach_repo state key);
  Hashtbl.replace state.epochs key (epoch_of state key + 1)

(* <prepare-startup! *)
let prepare_startup () : Js.Json.t Js.Promise.t =
  Lifecycle.stop_outdated_workers
    (Cli_server.resolve_storage
       { root_dir = None
       ; storage = None
       ; graphs_dir = None
       ; owner_source = None
       ; expected_revision = None
       ; generation = None
       ; create_empty_db = false
       ; embedding_endpoint = None
       ; embedding_model_id = None
       ; profile_session = None
       ; base_url = None
       ; owned = None
       })
    (Common_version.revision ())

(* start-managed-daemon! — cli-server/ensure-server! with owner
   :electron, then observe the lifecycle generation and return the
   runtime map. [opts] is the caller's config map as a JS object;
   :on-graph-lifecycle! is lifted out as a JS function and invoked with
   (repo, lifecycle-state-json-with-:generation). *)
let manager_state = init_state ()

let start_managed_daemon (repo : string) (opts : Js.Json.t)
    : runtime Js.Promise.t =
  let config =
    { (Cli_server.config_of_js opts) with
      owner_source = Some (Wire.Keyword "electron")
    }
  in
  let notify : (string -> Js.Json.t -> unit) option =
    Js.Undefined.toOption (get_index opts "on-graph-lifecycle!")
  in
  Js.Promise.then_
    (fun config' ->
      let storage = Cli_server.resolve_storage config in
      let root =
        match Js.Undefined.toOption (get_index storage "root") with
        | Some v -> Option.value (Js.Json.decodeString v) ~default:""
        | None -> ""
      in
      let generation = field_string config' "generation" in
      let close_observer =
        Lifecycle.observe storage repo
          (match generation with
           | Some g -> Js.Null.return g
           | None -> Js.Null.empty)
          (fun current ->
            let stored_generation =
              match
                Hashtbl.find_opt manager_state.repos (repo_key repo)
              with
              | Some entry -> (
                  match entry.runtime with
                  | Some r -> r.generation
                  | None -> None)
              | None -> None
            in
            if Option.equal String.equal generation stored_generation then
              invalidate_repo ~keep_observer:true manager_state repo;
            match notify with
            | Some f -> (
                (match Js.Json.classify current with
                 | Js.Json.JSONObject dict ->
                     Js.Dict.set dict "generation"
                       (match generation with
                        | Some g -> Js.Json.string g
                        | None -> Js.Json.null)
                 | _ -> ());
                f repo current)
            | None -> ())
      in
      Js.Promise.resolve
        { repo
        ; root_dir = root
        ; storage
        ; generation
        ; base_url = field_string config' "base-url"
        ; auth_token = Js.Json.null
        ; close_observer = Some close_observer
        ; owned = field_bool config' "owned?"
        })
    (Cli_server.ensure_server config repo)

let stop_managed_daemon (runtime : runtime) : bool Js.Promise.t =
  let config : Cli_server.config =
    { root_dir = Some runtime.root_dir
    ; storage = Some runtime.storage
    ; graphs_dir = None
    ; owner_source = Some (Wire.Keyword "electron")
    ; expected_revision = None
    ; generation = None
    ; create_empty_db = false
    ; embedding_endpoint = None
    ; embedding_model_id = None
    ; profile_session = None
    ; base_url = None
    ; owned = None
    }
  in
  Js.Promise.then_
    (fun result ->
      Js.Promise.resolve
        (Option.value (field_bool result "ok?") ~default:false))
    (Cli_server.stop_server config runtime.repo)

(* defonce manager — built by hand so the observer closures capture the
   exact shared state the manager functions mutate. *)
let manager : manager =
  { start_daemon = start_managed_daemon
  ; stop_daemon = stop_managed_daemon
  ; runtime_ready = runtime_ready_default
  ; state = manager_state
  }

(* ensure-runtime! *)
let ensure_worker (repo : string) (window_id : int)
    ?(opts : Js.Json.t option) () : runtime Js.Promise.t =
  ensure_started manager repo window_id opts

let ensure_runtime = ensure_worker

(* release-window! *)
let release_window (window_id : int) : bool Js.Promise.t =
  ensure_window_stopped manager window_id

(* release-runtime! — [mgr] is the 3-arity form *)
let release_running (repo : string) (window_id : int)
    ?(mgr : manager option) () : bool Js.Promise.t =
  ensure_stopped (Option.value mgr ~default:manager) repo window_id

let release_runtime = release_running

(* stop-all-managed! *)
let stop_all_managers () : bool Js.Promise.t = stop_all manager

let stop_all_managed = stop_all_managers

(* CONTRACTS aliases *)
let start_manager (manager : manager) (repo : string) (window_id : int)
    (opts : Js.Json.t option) : runtime Js.Promise.t =
  ensure_started manager repo window_id opts

let stop_manager (manager : manager) (repo : string) (window_id : int)
    : bool Js.Promise.t =
  ensure_stopped manager repo window_id
