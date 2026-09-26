(* Port of src/electron/electron/embedding_server.cljs — manages the
   Python embedding sidecar: runtime dir + venv setup, dependency
   install, spawn, readiness polling, and endpoint env publishing.
   All hooks are injectable through [opts] for tests (the cljs version
   took a plain map). *)

open Electron_bindings

module Fs_extra = struct
  external existsSync : string -> bool = "existsSync"
    [@@mel.module "fs-extra"]
  external ensureDirSync : string -> unit = "ensureDirSync"
    [@@mel.module "fs-extra"]
  external removeSync : string -> unit = "removeSync"
    [@@mel.module "fs-extra"]
  external writeFileSync : string -> string -> (_[@mel.as "utf8"])
    -> unit = "writeFileSync"
    [@@mel.module "fs-extra"]
end

type stream

external stream_on : stream -> string -> ('a -> unit [@u]) -> unit
  = "on"
[@@mel.send]

module Child_process = struct
  type t

  type spawn_options

  external spawn_options : ?cwd:string -> stdio:string -> unit
    -> spawn_options = ""
  [@@mel.obj]

  external spawn : string -> string array -> spawn_options -> t = "spawn"
    [@@mel.module "child_process"]

  external stdout : t -> stream Js.Nullable.t = "stdout" [@@mel.get]
  external stderr : t -> stream Js.Nullable.t = "stderr" [@@mel.get]

  external on : t -> string -> ('a -> unit [@u]) -> unit = "on"
    [@@mel.send]
  external on2 : t -> string -> (Js.Json.t -> Js.Json.t -> unit [@u])
    -> unit = "on"
    [@@mel.send]

  external on_fn : t -> 'a = "on" [@@mel.get]
  external kill_fn : t -> 'a = "kill" [@@mel.get]
  external kill : t -> unit = "kill" [@@mel.send]
end

module Net = struct
  type server
  type address = < port : int > Js.t

  external create_server : unit -> server = "createServer"
    [@@mel.module "node:net"]
  external once : server -> string -> ('a -> unit [@u]) -> unit = "once"
    [@@mel.send]
  external listen : server -> int -> string -> (unit -> unit [@u])
    -> unit = "listen"
    [@@mel.send]
  external address : server -> address = "address" [@@mel.send]
  external close : server -> (Js.Json.t Js.Undefined.t -> unit [@u])
    -> unit = "close"
    [@@mel.send]
end

type fetch_response = < ok : bool ; status : int > Js.t

external fetch_ : string -> fetch_response Js.Promise.t = "fetch"
  [@@mel.module]

external __dirname : string = "__dirname"

external promise_finally :
  (unit -> unit [@u]) -> ('a Js.Promise.t[@mel.this]) -> 'a Js.Promise.t
  = "finally"
[@@mel.send]

external promise_error_as_exn : Js.Promise.error -> exn = "%identity"
external as_json : 'a -> Js.Json.t = "%identity"
external js_to_exn : 'a -> exn = "%identity"

let error_exn (msg : string) : exn =
  try Js.Exn.raiseError msg with e -> e

(* cljs `(pr-str args)` of a string vector: ["-m" "venv"] *)
let pr_args args =
  "["
  ^ String.concat " "
      (List.map (fun a -> "\"" ^ a ^ "\"") (Array.to_list args))
  ^ "]"

let default_host = "127.0.0.1"
let default_model_id = "all-MiniLM-L6-v2"
let embedding_url_env = "LOGSEQ_EMBEDDINGS_URL"
let runtime_dir_name = "embedding-server"
let venv_name = ".venv"
let dependencies = [| "sentence-transformers"; "httpx[socks]" |]
let deps_stamp_name = "deps-v2.ok"
let log_file_name = "embedding-server.log"
let ready_timeout_ms = 120000.
let ready_poll_ms = 100

let server_process : Child_process.t option ref = ref None
let startup_promise : string Js.Promise.t option ref = ref None
let endpoint_promise : string Js.Nullable.t Js.Promise.t option ref =
  ref None
let endpoint : string option ref = ref None
let endpoint_ready = ref false
let endpoint_env_published = ref false

(* electron-log's variadic fns (cljs (js/require "electron-log")) *)
type logger = {
  debug : Js.Json.t array -> unit;
  info : Js.Json.t array -> unit;
  warn : Js.Json.t array -> unit;
  error : Js.Json.t array -> unit;
}

let default_logger () = {
  debug = Electron_logger.log_debug;
  info = Electron_logger.log_info;
  warn = Electron_logger.log_warn;
  error = Electron_logger.log_error;
}

let noop_logger = {
  debug = (fun _ -> ());
  info = (fun _ -> ());
  warn = (fun _ -> ());
  error = (fun _ -> ());
}

let js_obj (kvs : (string * Js.Json.t) list) : Js.Json.t =
  let d = Js.Dict.empty () in
  List.iter (fun (k, v) -> Js.Dict.set d k v) kvs;
  Js.Json.object_ d

let macos platform = String.equal "darwin" platform

let sidecar_dir ~packaged ~resources_path ~dirname =
  if packaged then Node.Path.join [| resources_path; "sidecar" |]
  else Node.Path.join [| dirname; ".."; "sidecar" |]

type run_command_opts = {
  cwd : string option;
  logger : logger;
}

type config = {
  platform : string;
  runtime_dir : string;
  venv_dir : string;
  venv_python : string;
  venv_python_candidates : string array;
  deps_stamp : string;
  log_file : string;
  sidecar_dir : string;
  script_path : string;
  python_command : string;
  host : string;
  port : int option;
  model_id : string;
  exists : string -> bool;
  ensure_dir : string -> unit;
  remove_dir : string -> unit;
  delete_env : string -> unit;
  write_file : string -> string -> unit;
  logger : logger option;
  find_port : string -> int Js.Promise.t;
  set_env : string -> string -> unit;
  run_command :
    string -> string array -> run_command_opts -> unit Js.Promise.t;
  wait_ready : string -> unit Js.Promise.t;
  spawn_server : config -> Child_process.t;
}

type opts = {
  platform : string option;
  user_data_dir : string option;
  packaged : bool option;
  resources_path : string option;
  dirname : string option;
  python_command : string option;
  host : string option;
  port : int option;
  model_id : string option;
  exists : (string -> bool) option;
  ensure_dir : (string -> unit) option;
  remove_dir : (string -> unit) option;
  delete_env : (string -> unit) option;
  write_file : (string -> string -> unit) option;
  logger : logger option;
  find_port : (string -> int Js.Promise.t) option;
  set_env : (string -> string -> unit) option;
  run_command :
    (string -> string array -> run_command_opts -> unit Js.Promise.t)
      option;
  wait_ready : (string -> unit Js.Promise.t) option;
  spawn_server : (config -> Child_process.t) option;
}

let default_opts = {
  platform = None;
  user_data_dir = None;
  packaged = None;
  resources_path = None;
  dirname = None;
  python_command = None;
  host = None;
  port = None;
  model_id = None;
  exists = None;
  ensure_dir = None;
  remove_dir = None;
  delete_env = None;
  write_file = None;
  logger = None;
  find_port = None;
  set_env = None;
  run_command = None;
  wait_ready = None;
  spawn_server = None;
}

let is_fn v = String.equal (Js.typeof v) "function"

(* cljs (log-stream! stream log-fn label) *)
let log_stream stream_opt log_fn label =
  match Js.Nullable.toOption stream_opt with
  | Some stream ->
      stream_on stream "data" (fun [@u] data ->
          log_fn [| label; Js.Json.string (Node.Buffer.toString data) |])
  | None -> ()

let run_command cmd args { cwd; logger } : unit Js.Promise.t =
  Js.Promise.make (fun ~resolve ~reject ->
      let proc =
        Child_process.spawn cmd args
          (Child_process.spawn_options ?cwd ~stdio:"pipe" ())
      in
      log_stream (Child_process.stdout proc) logger.debug
        (Js.Json.string ":embedding-server/setup");
      log_stream (Child_process.stderr proc) logger.warn
        (Js.Json.string ":embedding-server/setup");
      Child_process.on proc "error" (fun [@u] e -> reject (js_to_exn e) [@u]);
      Child_process.on proc "close" (fun [@u] code ->
          if code = 0 then
            let done_ = () in
            resolve done_ [@u]
          else
            reject
              (error_exn
                 (Printf.sprintf
                    "Embedding server setup command failed: %s %s exited with %d"
                    cmd (pr_args args) code))
              [@u]))

let python_command_available cmd ?(opts = default_opts) () =
  let run_command_fn =
    Option.value opts.run_command ~default:run_command
  in
  let logger = Option.value opts.logger ~default:noop_logger in
  run_command_fn cmd [| "--version" |] { cwd = None; logger }
  |> Js.Promise.then_ (fun () -> Js.Promise.resolve true)
  |> Js.Promise.catch (fun _ -> Js.Promise.resolve false)

let find_port (host : string) : int Js.Promise.t =
  Js.Promise.make (fun ~resolve ~reject ->
      let server = Net.create_server () in
      Net.once server "error" (fun [@u] e -> reject (js_to_exn e) [@u]);
      Net.listen server 0 host (fun [@u] () ->
          let port = (Net.address server)##port in
          Net.close server (fun [@u] error ->
              match Js.Undefined.toOption error with
              | Some e -> reject (js_to_exn e) [@u]
              | None -> resolve port [@u])))

let embedding_endpoint host port =
  Printf.sprintf "http://%s:%d/v1/embeddings" host port

let embedding_health_endpoint host port =
  Printf.sprintf "http://%s:%d/healthz" host port

let publish_endpoint (cfg : config) =
  let port = Option.value cfg.port ~default:0 in
  let endpoint_url = embedding_endpoint cfg.host port in
  endpoint := Some endpoint_url;
  endpoint_ready := true;
  endpoint_env_published := true;
  cfg.set_env embedding_url_env endpoint_url;
  endpoint_url

let reserve_endpoint (cfg : config) =
  let port = Option.value cfg.port ~default:0 in
  let endpoint_url = embedding_endpoint cfg.host port in
  endpoint := Some endpoint_url;
  endpoint_ready := false;
  endpoint_url

let clear_endpoint (delete_env : string -> unit) =
  if !endpoint_env_published then delete_env embedding_url_env;
  endpoint_promise := None;
  endpoint := None;
  endpoint_ready := false;
  endpoint_env_published := false

let allocate_port (cfg : config) : config Js.Promise.t =
  (match cfg.port with
   | Some p -> Js.Promise.resolve p
   | None -> cfg.find_port cfg.host)
  |> Js.Promise.then_ (fun port ->
         Js.Promise.resolve { cfg with port = Some port })

let delay ms =
  Js.Promise.make (fun ~resolve ~reject:_ ->
      ignore
        (Js.Global.setTimeout
           ~f:(fun () ->
             let elapsed = () in
             resolve elapsed [@u])
           ms))

let wait_ready (endpoint_url : string) : unit Js.Promise.t =
  let deadline = Js.Date.now () +. ready_timeout_ms in
  let rec poll () : unit Js.Promise.t =
    fetch_ endpoint_url
    |> Js.Promise.then_ (fun resp ->
           if not resp##ok then
             Js.Exn.raiseError
               (Printf.sprintf
                  "Embedding server health check failed: %d"
                  resp##status);
           Js.Promise.resolve ())
    |> Js.Promise.catch (fun error ->
           if Js.Date.now () < deadline then
             delay ready_poll_ms |> Js.Promise.then_ poll
           else Js.Promise.reject (promise_error_as_exn error))
  in
  poll ()

(* cljs attach-exit-handler! *)
let attach_exit_handler (proc : Child_process.t) (cfg : config) =
  if is_fn (Child_process.on_fn proc) then
    Child_process.on2 proc "exit" (fun [@u] code signal ->
        (match !server_process with
         | Some p when p == proc ->
             server_process := None;
             clear_endpoint cfg.delete_env
         | _ -> ());
        let logger = Option.value cfg.logger ~default:noop_logger in
        logger.info
          [| Js.Json.string ":embedding-server/exited"
           ; js_obj [ ("code", code); ("signal", signal) ] |])

let spawn_server (cfg : config) : Child_process.t =
  let port = Option.value cfg.port ~default:0 in
  let logger = Option.value cfg.logger ~default:noop_logger in
  let proc =
    Child_process.spawn cfg.venv_python
      [| cfg.script_path; "--host"; cfg.host; "--port"
       ; string_of_int port; "--model"; cfg.model_id; "--log-file"
       ; cfg.log_file |]
      (Child_process.spawn_options ~cwd:cfg.sidecar_dir ~stdio:"pipe"
         ())
  in
  log_stream (Child_process.stdout proc) logger.info
    (Js.Json.string ":embedding-server");
  log_stream (Child_process.stderr proc) logger.warn
    (Js.Json.string ":embedding-server");
  Child_process.on proc "error" (fun [@u] error ->
      logger.error
        [| Js.Json.string ":embedding-server/start-failed"
         ; as_json error |]);
  proc

let existing_venv_python_candidates (cfg : config) =
  Array.to_list cfg.venv_python_candidates
  |> List.filter cfg.exists

let validate_venv_python (cfg : config) (venv_python : string) =
  let logger = Option.value cfg.logger ~default:noop_logger in
  cfg.run_command venv_python [| "-c"; "import sys" |]
    { cwd = Some cfg.runtime_dir; logger }
  |> Js.Promise.then_ (fun () -> Js.Promise.resolve (Some venv_python))
  |> Js.Promise.catch (fun _ -> Js.Promise.resolve None)

let usable_venv_python (cfg : config) :
    string option Js.Promise.t =
  let rec try_ candidates =
    match candidates with
    | [] -> Js.Promise.resolve None
    | candidate :: rest ->
        validate_venv_python cfg candidate
        |> Js.Promise.then_ (fun usable ->
               match usable with
               | Some _ -> Js.Promise.resolve usable
               | None -> try_ rest)
  in
  try_ (existing_venv_python_candidates cfg)

let install_runtime (cfg : config) : config Js.Promise.t =
  let logger = Option.value cfg.logger ~default:noop_logger in
  cfg.ensure_dir cfg.runtime_dir;
  usable_venv_python cfg
  |> Js.Promise.then_ (fun venv_python ->
         let needs_venv = Option.is_none venv_python in
         let needs_deps =
           needs_venv || not (cfg.exists cfg.deps_stamp)
         in
         if needs_venv then cfg.remove_dir cfg.venv_dir;
         (if needs_venv then
            cfg.run_command cfg.python_command
              [| "-m"; "venv"; venv_name |]
              { cwd = Some cfg.runtime_dir; logger }
          else Js.Promise.resolve ())
         |> Js.Promise.then_ (fun () ->
                (if needs_venv then usable_venv_python cfg
                 else Js.Promise.resolve venv_python)
                |> Js.Promise.then_ (fun venv_python ->
                       let venv_python =
                         match venv_python with
                         | Some v -> v
                         | None ->
                             Js.Exn.raiseError
                               "Embedding server virtualenv Python is missing"
                       in
                       (if needs_deps then
                          cfg.run_command venv_python
                            (Array.concat
                               [ [| "-m"; "pip"; "install" |]
                               ; dependencies ])
                            { cwd = Some cfg.runtime_dir; logger }
                        else Js.Promise.resolve ())
                       |> Js.Promise.then_ (fun () ->
                              if needs_deps then
                                cfg.write_file cfg.deps_stamp
                                  (String.concat "\n"
                                     (Array.to_list dependencies)
                                   ^ "\n");
                              Js.Promise.resolve
                                { cfg with venv_python }))))

let config (app : App.t) (opts : opts) : config =
  let platform =
    Option.value opts.platform ~default:Node.Process.process##platform
  in
  let user_data_dir =
    match opts.user_data_dir with
    | Some d -> d
    | None -> App.get_path app "userData"
  in
  let packaged =
    match opts.packaged with
    | Some p -> p
    | None -> App.is_packaged app
  in
  let runtime_dir = Node.Path.join [| user_data_dir; runtime_dir_name |] in
  let venv_dir = Node.Path.join [| runtime_dir; venv_name |] in
  let venv_python = Node.Path.join [| venv_dir; "bin"; "python" |] in
  let venv_python_candidates =
    [| venv_python; Node.Path.join [| venv_dir; "bin"; "python3" |] |]
  in
  let resources_path =
    Option.value opts.resources_path ~default:process_resources_path
  in
  let dirname = Option.value opts.dirname ~default:__dirname in
  let sidecar_root =
    sidecar_dir ~packaged ~resources_path ~dirname
  in
  let script_path =
    Node.Path.join [| sidecar_root; "embedding_server.py" |]
  in
  let env name = Js.Dict.get Node.Process.process##env name in
  {
    platform;
    runtime_dir;
    venv_dir;
    venv_python;
    venv_python_candidates;
    deps_stamp = Node.Path.join [| runtime_dir; deps_stamp_name |];
    log_file = Node.Path.join [| runtime_dir; log_file_name |];
    sidecar_dir = sidecar_root;
    script_path;
    python_command =
      (match opts.python_command with
       | Some c -> c
       | None ->
           (match env "LOGSEQ_EMBEDDINGS_PYTHON" with
            | Some c -> c
            | None -> "python3"));
    host = Option.value opts.host ~default:default_host;
    port = opts.port;
    model_id =
      (match opts.model_id with
       | Some m -> m
       | None ->
           (match env "LOGSEQ_EMBEDDING_MODEL" with
            | Some m -> m
            | None -> default_model_id));
    exists = Option.value opts.exists ~default:Fs_extra.existsSync;
    ensure_dir =
      Option.value opts.ensure_dir ~default:Fs_extra.ensureDirSync;
    remove_dir =
      Option.value opts.remove_dir ~default:Fs_extra.removeSync;
    delete_env =
      Option.value opts.delete_env ~default:Node.Process.deleteEnvVar;
    write_file =
      Option.value opts.write_file ~default:Fs_extra.writeFileSync;
    logger = opts.logger;
    find_port = Option.value opts.find_port ~default:find_port;
    set_env = Option.value opts.set_env ~default:Node.Process.putEnvVar;
    run_command =
      Option.value opts.run_command ~default:run_command;
    wait_ready = Option.value opts.wait_ready ~default:wait_ready;
    spawn_server =
      Option.value opts.spawn_server ~default:spawn_server;
  }

let stop () =
  startup_promise := None;
  clear_endpoint Node.Process.deleteEnvVar;
  match !server_process with
  | Some proc ->
      server_process := None;
      if is_fn (Child_process.kill_fn proc) then
        Child_process.kill proc
  | None -> ()

(* Resolves "skipped" | "already-started" | "started" — the cljs version
   resolved keywords; string is the internal-contract equivalent. *)
let start ?(opts = default_opts) (app : App.t) : string Js.Promise.t =
  let cfg = config app opts in
  if not (macos cfg.platform) then Js.Promise.resolve "skipped"
  else
    match !startup_promise with
    | Some p -> p
    | None ->
        (match !server_process with
         | Some _proc ->
             (match !endpoint with
              | Some endpoint_url ->
                  cfg.set_env embedding_url_env endpoint_url;
                  Js.Promise.resolve "already-started"
              | None ->
                  Js.Promise.reject
                    (error_exn "Embedding server endpoint is missing"))
         | None ->
             let cfg =
               { cfg with
                 logger =
                   Some
                     (Option.value cfg.logger
                        ~default:(default_logger ())) }
             in
             (* endpoint-resolve is per-start (a local atom in cljs) *)
             let resolve_ref = ref None in
             let ep =
               Js.Promise.make (fun ~resolve ~reject:_ ->
                   resolve_ref := Some resolve)
             in
             endpoint_promise := Some ep;
             let startup =
               allocate_port cfg
               |> Js.Promise.then_ (fun (cfg : config) ->
                      let endpoint_url = reserve_endpoint cfg in
                      (match !resolve_ref with
                       | Some r -> r (Js.Nullable.return endpoint_url) [@u]
                       | None -> ());
                      install_runtime cfg)
               |> Js.Promise.then_ (fun (cfg : config) ->
                      let proc = cfg.spawn_server cfg in
                      server_process := Some proc;
                      attach_exit_handler proc cfg;
                      let port = Option.value cfg.port ~default:0 in
                      cfg.wait_ready
                        (embedding_health_endpoint cfg.host port)
                      |> Js.Promise.then_ (fun () ->
                             ignore (publish_endpoint cfg);
                             Js.Promise.resolve "started"))
               |> Js.Promise.catch (fun error ->
                      (match !resolve_ref with
                       | Some r -> r Js.Nullable.null [@u]
                       | None -> ());
                      stop ();
                      let logger =
                        Option.value cfg.logger ~default:noop_logger
                      in
                      logger.error
                        [| Js.Json.string ":embedding-server/setup-failed"
                         ; as_json error |];
                      Js.Promise.reject (promise_error_as_exn error))
               |> promise_finally (fun [@u] () ->
                      startup_promise := None)
             in
             startup_promise := Some startup;
             startup)

(* Resolves the endpoint string or null (cljs resolved nil). *)
let ensure_endpoint ?(opts = default_opts) (app : App.t)
    : string Js.Nullable.t Js.Promise.t =
  let cfg = config app opts in
  if not (macos cfg.platform) then Js.Promise.resolve Js.Nullable.null
  else
    match !endpoint with
    | Some ep ->
        if !endpoint_ready then cfg.set_env embedding_url_env ep;
        Js.Promise.resolve (Js.Nullable.return ep)
    | None ->
        (match !endpoint_promise with
         | Some p -> p
         | None ->
             ignore
               (Js.Promise.catch
                  (fun _error -> Js.Promise.resolve "ignored")
                  (start ~opts app)
                : string Js.Promise.t);
             Option.value !endpoint_promise
               ~default:(Js.Promise.resolve Js.Nullable.null))

let setup (app : App.t) : unit -> unit =
  let logger = default_logger () in
  ignore
    (start app
     |> Js.Promise.catch (fun error ->
            logger.error
              [| Js.Json.string ":embedding-server/setup-failed"
               ; as_json error |];
            Js.Promise.resolve "ignored")
      : string Js.Promise.t);
  stop
