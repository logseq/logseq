(* 1:1 ports of the Electron cljs unit tests onto the Melange desktop
   modules (deps/db-worker/desktop):

   - electron.core-test           -> Electron_lifecycle
   - electron.db-test             -> Electron_db / Graph_backup
   - electron.db-worker-manager-test -> Electron_db_worker
   - electron.embedding-server-test  -> Electron_embedding_server
   - electron.cli-install-test       -> Electron_cli_install
   - electron.mcp-transport-test     -> Electron_mcp_transport
   - electron.graph-switch-flow-test -> Electron_graph_switch_flow
   - electron.interop-test           -> Electron_interop
   - electron.release-warning-test   -> Electron_release_warning
   - electron.spell-check-test       -> Electron_spell_check
   - electron.utils-test             -> empty namespace, nothing to port
   - logseq.cli.server-test          -> Cli_server
   - logseq.db-worker.graph-backup-test -> Graph_backup
   (logseq.db-worker.server-list-test is already covered by
   test_db_worker_node_melange.ml and is intentionally not re-ported.)

   Stubbing seams, mapped from the cljs redefs:
   - `(set! x/get-db-graphs-dir f)` -> LOGSEQ_GRAPHS_DIR env override
   - `with-redefs sqlite-backup/backup-db-file!` -> the ~sqlite_backup
     parameter of Electron_db.backup_db_with_sqlite_backup
   - `with-redefs lifecycle/*` -> property overrides on the
     @logseq/graph-lifecycle CommonJS exports object
   - `with-redefs daemon/pid-status` -> process.kill override
   - `with-redefs js/setInterval` -> globalThis.setInterval override
   - `cli-transport/invoke` redefs -> real Cli_transport.invoke against a
     local http stub server (the cljs tests stubbed at the transport;
     we exercise one extra real hop)
   - `with-redefs db-worker/manager` -> the explicit `manager` variants
     (start_manager/ensure_stopped/stop_all take the manager record)

   Skipped cljs cases, with reasons:
   - db-worker-manager-test `concurrent-window-release-stops-real-worker-and-reopens`
     (`^:long` in cljs): needs a built static/db-worker-node.js daemon
     bundle, which does not exist in this checkout.
   - cli-install-test :messages / :deferred assertions: the cljs deps
     map carried :show-message-box!/:defer! fns; the OCaml deps record
     has no such fields — the port only ports the error-dialog path.
   - release-warning-test `selected-release-url nil` case: the OCaml
     signature takes `int`, not nil.
   - db-test `backup-file` rebind assertions: Electron_db has no
     backup-file seam — the cljs rebinds were vacuous (always empty). *)

module E = Db_worker_effect

(* ---------- externals ---------- *)

external tmpdir : unit -> string = "tmpdir" [@@mel.module "os"]

external mkdtemp : string -> string = "mkdtempSync" [@@mel.module "fs"]

external exists_sync : string -> bool = "existsSync" [@@mel.module "fs"]

external mkdir_sync_opts : string -> Js.Json.t -> unit = "mkdirSync"
  [@@mel.module "fs"]

external read_file_utf8 : string -> string -> string = "readFileSync"
  [@@mel.module "fs"]

external write_file_utf8 : string -> string -> unit = "writeFileSync"
  [@@mel.module "fs"]

external append_file_utf8 : string -> string -> unit = "appendFileSync"
  [@@mel.module "fs"]

external rm_sync : string -> Js.Json.t -> unit = "rmSync"
  [@@mel.module "fs"]

external process_env : Js.Json.t Js.Dict.t = "env" [@@mel.scope "process"]

external global_scope : Js.Json.t = "globalThis"

external require : string -> Js.Json.t = "require"

external get_index : Js.Json.t -> string -> Js.Json.t Js.Undefined.t = ""
  [@@mel.get_index]

external set_index : Js.Json.t -> string -> 'a -> unit = ""
  [@@mel.set_index]

external json_of_any : 'a -> Js.Json.t = "%identity"
external buffer_to_string : Js.Json.t -> string = "toString" [@@mel.send]
external js_error : string -> Js.Exn.t = "Error" [@@mel.new]
external error_of_any : 'a -> Js.Promise.error = "%identity"
external exn_of_rejection : Js.Promise.error -> exn = "%identity"

(* JS Error objects cast straight into the exn slot: melange exceptions
   are JS values anyway, and Promise.reject/throw accept them verbatim.
   exn_code/exn_message below read the .code/.message properties. *)
external as_exn : 'a -> exn = "%identity"

let js_reject (msg : string) : 'a Js.Promise.t =
  Js.Promise.reject (as_exn (js_error msg))

external promise_finally :
  'a Js.Promise.t -> (unit -> unit [@u]) -> 'a Js.Promise.t = "finally"
  [@@mel.send]

(* fake Electron objects — same %identity casts the production code
   uses for js interop boundaries *)
external as_request : Js.Json.t -> Electron_mcp_transport.request
  = "%identity"

external as_reply : Js.Json.t -> Electron_mcp_transport.reply = "%identity"

external as_transport : Js.Json.t -> Electron_mcp_transport.transport
  = "%identity"

external as_win : Js.Json.t -> Electron_bindings.Browser_window.t
  = "%identity"

external as_app : Js.Json.t -> Electron_bindings.App.t = "%identity"

external as_child_process :
  Js.Json.t -> Electron_embedding_server.Child_process.t = "%identity"

(* ---------- small helpers ---------- *)

let js_obj (kvs : (string * Js.Json.t) list) : Js.Json.t =
  let d = Js.Dict.empty () in
  List.iter (fun (k, v) -> Js.Dict.set d k v) kvs;
  Js.Json.object_ d

let field (j : Js.Json.t) (k : string) : Js.Json.t option =
  match Js.Json.classify j with
  | Js.Json.JSONObject _ -> Js.Undefined.toOption (get_index j k)
  | _ -> None

let json_string (j : Js.Json.t) (k : string) : string option =
  Option.bind (field j k) Js.Json.decodeString

let json_bool (j : Js.Json.t) (k : string) : bool option =
  Option.bind (field j k) Js.Json.decodeBoolean

let json_float (j : Js.Json.t) (k : string) : float option =
  Option.bind (field j k) Js.Json.decodeNumber

let json_int (j : Js.Json.t) (k : string) : int option =
  Option.map int_of_float (json_float j k)

let json_get_in (j : Js.Json.t) (path : string list) : Js.Json.t option =
  List.fold_left
    (fun acc k -> match acc with Some v -> field v k | None -> None)
    (Some j) path

let ( let* ) p f = Js.Promise.then_ f p

let promise_of_task t =
  Js.Promise.make (fun ~resolve ~reject ->
      E.on_any t (fun v -> resolve v [@u]) (fun e -> reject e [@u]))

let deferred () : 'a Js.Promise.t * ('a -> unit) =
  let task, resolver = E.wait () in
  (promise_of_task task, fun v -> E.wakeup resolver v)

let delay (ms : int) : unit Js.Promise.t =
  let task, resolver = E.wait () in
  ignore (Timers.set_timeout ms (fun () -> E.wakeup resolver ()));
  promise_of_task task

let rec wait_until ?(tries = 300) (pred : unit -> bool) : unit Js.Promise.t
    =
  if pred () then Js.Promise.resolve ()
  else if tries <= 0 then
    js_reject "wait-until timed out"
  else delay 10 |> Js.Promise.then_ (fun () -> wait_until ~tries pred)

let mk_tmp_dir (prefix : string) : string =
  mkdtemp (Node.Path.join [| tmpdir (); prefix ^ "-" |])

let str_starts_with (s : string) (prefix : string) : bool =
  String.length s >= String.length prefix
  && String.equal (String.sub s 0 (String.length prefix)) prefix

let mkdirp (dir : string) : unit =
  mkdir_sync_opts dir
    (Js.Json.object_
       (Js.Dict.fromList [ "recursive", Js.Json.boolean true ]))

(* LOGSEQ_GRAPHS_DIR is what Common_graph.get_db_graphs_dir reads; cljs
   tests rebound the var, we override the env var. *)
let with_graphs_dir (graphs_dir : string) (run : unit -> 'a Js.Promise.t)
    : 'a Js.Promise.t =
  let original = Js.Dict.get process_env "LOGSEQ_GRAPHS_DIR" in
  Js.Dict.set process_env "LOGSEQ_GRAPHS_DIR" (Js.Json.string graphs_dir);
  promise_finally (run ())
    (fun [@u] () ->
       match original with
       | Some v -> Js.Dict.set process_env "LOGSEQ_GRAPHS_DIR" v
       | None -> Node.Process.deleteEnvVar "LOGSEQ_GRAPHS_DIR")

let with_graphs_dir_sync (graphs_dir : string) (run : unit -> 'a) : 'a =
  let original = Js.Dict.get process_env "LOGSEQ_GRAPHS_DIR" in
  Js.Dict.set process_env "LOGSEQ_GRAPHS_DIR" (Js.Json.string graphs_dir);
  let restore () =
    match original with
    | Some v -> Js.Dict.set process_env "LOGSEQ_GRAPHS_DIR" v
    | None -> Node.Process.deleteEnvVar "LOGSEQ_GRAPHS_DIR"
  in
  match run () with
  | v ->
      restore ();
      v
  | exception e ->
      restore ();
      raise e

(* ---------- exn inspection ---------- *)

let exn_code (e : exn) : string option =
  match e with
  | Dispatcher.Exn_info (_, kvs) -> (
      match List.assoc_opt (Wire.Keyword "code") kvs with
      | Some (Wire.Keyword c) | Some (Wire.String c) -> Some c
      | _ -> None)
  | Js.Exn.Error err ->
      Option.bind (field (json_of_any err) "code") Js.Json.decodeString
  | e ->
      (* a raw JS Error (or any js object) rejected through the promise
         machinery: read its .code property *)
      Option.bind (field (json_of_any e) "code") Js.Json.decodeString

let exn_message (e : exn) : string =
  match e with
  | Dispatcher.Exn_info (message, _) -> message
  | Js.Exn.Error err -> Option.value (Js.Exn.message err) ~default:""
  | e ->
      Option.value
        (Option.bind (field (json_of_any e) "message") Js.Json.decodeString)
        ~default:(Printexc.to_string e)

let expect_rejection (p : 'a Js.Promise.t) : exn Js.Promise.t =
  Js.Promise.catch
    (fun e -> Js.Promise.resolve (exn_of_rejection e))
    (Js.Promise.then_
       (fun (_ : 'a) -> js_reject "expected a rejection, got resolve")
       p)

(* ---------- lifecycle (@logseq/graph-lifecycle) stubs ---------- *)

let lifecycle_module () : Js.Json.t = require "@logseq/graph-lifecycle"

(* cljs with-redefs on lifecycle fns: the module's CJS exports object is
   mutable, so override the property and restore it in a finally. *)
let with_lifecycle_props (props : (string * Js.Json.t) list)
    (run : unit -> 'a Js.Promise.t) : 'a Js.Promise.t =
  let m = lifecycle_module () in
  let originals = List.map (fun (k, _) -> k, get_index m k) props in
  List.iter (fun (k, v) -> set_index m k v) props;
  promise_finally (run ())
    (fun [@u] () -> List.iter (fun (k, v) -> set_index m k v) originals)

(* a startGraph stub: resolves a lock payload echoing the caller's
   repo/generation/owner plus the fields [payload] adds *)
let lifecycle_start_stub
    ?(captured : Js.Json.t list ref option)
    ?(on_call : unit -> unit = fun () -> ())
    ~(payload : Js.Json.t -> (string * Js.Json.t) list)
    () : Js.Json.t =
  json_of_any (fun [@u] (opts : Js.Json.t) ->
      on_call ();
      (match captured with
      | Some r -> r := opts :: !r
      | None -> ());
      Js.Promise.resolve
        (js_obj
           ([ ( "repo"
              , match field opts "repo" with
                | Some v -> v
                | None -> Js.Json.null )
          ; ("host", Js.Json.string "127.0.0.1")
          ]
          @ payload opts)))

let lifecycle_observe_stub () : Js.Json.t =
  json_of_any (fun [@u] (_storage : Js.Json.t) (_repo : Js.Json.t)
      (_generation : Js.Json.t) (_on_change : Js.Json.t) ->
      json_of_any (fun () -> ()))

let lifecycle_stop_stub (stops : (string * string) list ref) : Js.Json.t =
  json_of_any (fun [@u] (_storage : Js.Json.t) (repo : Js.Json.t)
      (owner : Js.Json.t) ->
      stops :=
        ( Option.value (Js.Json.decodeString repo) ~default:""
        , Option.value (Js.Json.decodeString owner) ~default:"" )
        :: !stops;
      Js.Promise.resolve Js.Json.null)

let lifecycle_snapshot_stub (state : Js.Json.t) : Js.Json.t =
  json_of_any (fun [@u] (_storage : Js.Json.t) (_repo : Js.Json.t) ->
      state)

(* ---------- process.kill / daemon-pid-status override ---------- *)

let raise_esrch () =
  let e = js_error "kill ESRCH" in
  set_index (json_of_any e) "code" (Js.Json.string "ESRCH");
  raise (as_exn e)

(* cljs with-redefs daemon/pid-status: daemon/pid-status is
   Node_process.kill0 = process.kill(pid, 0). [on_kill] throws via
   raise_esrch for dead pids. *)
let with_process_kill (on_kill : int -> unit)
    (run : unit -> 'a Js.Promise.t) : 'a Js.Promise.t =
  match field global_scope "process" with
  | None -> run ()
  | Some proc ->
      let original = get_index proc "kill" in
      set_index proc "kill"
        (fun [@u] (pid : int) (_signal : int) -> on_kill pid; true);
      promise_finally (run ())
        (fun [@u] () -> set_index proc "kill" original)

(* ---------- http stub servers ---------- *)

module Stub_http = struct
  type server
  type req
  type res

  external create_server : (req -> res -> unit [@u]) -> server
    = "createServer" [@@mel.module "http"]

  external listen :
    server -> int -> string -> (unit -> unit [@u]) -> unit = "listen"
    [@@mel.send]

  external address : server -> < port : int > Js.t = "address" [@@mel.send]

  external close : server -> (unit -> unit [@u]) -> unit = "close"
    [@@mel.send]

  external req_method : req -> string = "method" [@@mel.get]
  external req_url : req -> string = "url" [@@mel.get]

  external req_on : req -> string -> ('a -> unit [@u]) -> unit = "on"
    [@@mel.send]

  external res_write_head : res -> int -> Js.Json.t -> unit = "writeHead"
    [@@mel.send]

  external res_end : res -> string -> unit = "end" [@@mel.send]
end

type recorded_request = { meth : string; url : string; body : string }

let json_headers =
  js_obj [ ("Content-Type", Js.Json.string "application/json") ]

(* a generic stub: serves the recorded_request through [handler] which
   returns (status, body). *)
let start_stub_server (handler : recorded_request -> int * string)
    : (Stub_http.server * int) Js.Promise.t =
  Js.Promise.make (fun ~resolve ~reject:_ ->
      let server =
        Stub_http.create_server (fun [@u] req res ->
            let chunks = ref "" in
            Stub_http.req_on req "data" (fun [@u] c ->
                chunks := !chunks ^ buffer_to_string (json_of_any c));
            Stub_http.req_on req "end" (fun [@u] (_ : Js.Json.t) ->
                let status, body =
                  handler
                    { meth = Stub_http.req_method req
                    ; url = Stub_http.req_url req
                    ; body = !chunks
                    }
                in
                Stub_http.res_write_head res status json_headers;
                Stub_http.res_end res body))
      in
      Stub_http.listen server 0 "127.0.0.1" (fun [@u] () ->
          resolve (server, (Stub_http.address server)##port) [@u]))

let close_server (server : Stub_http.server) : unit Js.Promise.t =
  let task, resolver = E.wait () in
  Stub_http.close server (fun [@u] () -> E.wakeup resolver ());
  promise_of_task task

(* serves [payload] on GET /healthz *)
let healthz_handler ~(payload : unit -> Js.Json.t) (r : recorded_request)
    : int * string =
  match r.url with
  | "/healthz" -> (200, Js.Json.stringify (payload ()))
  | _ -> (404, "not-found")

(* worker stub for electron.db-test: GET /healthz -> ready,
   POST /v1/invoke -> records decoded transit args, writes the snapshot
   file the request asked for, answers {:path dst}. *)
let worker_invoke_handler
    (invoke_calls : (string * Wire.t list) list ref)
    ~(snapshot_content : string) (r : recorded_request) : int * string =
  match r.meth, r.url with
  | "GET", "/healthz" ->
      ( 200
      , Js.Json.stringify (js_obj [ ("status", Js.Json.string "ready") ]) )
  | "POST", "/v1/invoke" -> (
      let parsed = Js.Json.parseExn r.body in
      let meth = Option.value (json_string parsed "method") ~default:"" in
      let args =
        match json_string parsed "argsTransit" with
        | Some t -> (
            match Transit_codec.of_string t with
            | Wire.Array xs -> xs
            | _ -> [])
        | None -> []
      in
      invoke_calls := (meth, args) :: !invoke_calls;
      let dst =
        match args with _ :: Wire.String s :: _ -> s | _ -> ""
      in
      if String.equal dst "" then () else write_file_utf8 dst snapshot_content;
      ( 200
      , Js.Json.stringify
          (js_obj
             [ ( "resultTransit"
               , Js.Json.string
                   (Transit_codec.to_string
                      (Wire.Map
                         [ (Wire.Keyword "path", Wire.String dst) ])) )
             ]) ))
  | _ -> (404, "not-found")

let wire_string_args (args : Wire.t list) : string list =
  List.filter_map (fun w -> match w with Wire.String s -> Some s | _ -> None) args

(* ---------- Electron_db_worker helpers ---------- *)

let fake_runtime ?(generation : string option)
    ?(close_observer : (unit -> unit) option)
    ?owned (repo : string) : Electron_db_worker.runtime =
  { repo
  ; root_dir = ""
  ; storage = Js.Json.null
  ; generation
  ; base_url = Some ("http://127.0.0.1/" ^ repo)
  ; auth_token = Js.Json.string ("token-" ^ repo)
  ; close_observer
  ; owned
  }

let repo_key (repo : string) : string = Electron_db_worker.repo_key repo

let repo_entry (state : Electron_db_worker.state) (repo : string)
    : Electron_db_worker.repo_entry option =
  Hashtbl.find_opt state.repos (repo_key repo)

let repo_windows (state : Electron_db_worker.state) (repo : string)
    : int list =
  match repo_entry state repo with
  | Some e -> List.sort compare e.windows
  | None -> []

let window_repo (state : Electron_db_worker.state) (window_id : int)
    : string option =
  Hashtbl.find_opt state.window_repo window_id

let repos_keys (state : Electron_db_worker.state) : string list =
  Hashtbl.fold (fun k _ acc -> k :: acc) state.repos []

let reset_manager_state () =
  Hashtbl.reset Electron_db_worker.manager_state.repos;
  Hashtbl.reset Electron_db_worker.manager_state.window_repo;
  Hashtbl.reset Electron_db_worker.manager_state.epochs

(* ---------- EDN metadata helpers ---------- *)

let read_edn_file (path : string) : Datascript.value =
  Edn_util.read_string (read_file_utf8 path "utf8")

(* cljs write-backup! — db file + optional metadata map *)
let write_backup ~(graphs_dir : string) ~(repo : string)
    ~(backup_name : string) ?(metadata : Datascript.value option) () =
  let db_path =
    Graph_backup.backup_db_path ~graphs_dir ~repo ~backup_name
  in
  let metadata_path =
    Graph_backup.backup_metadata_path ~graphs_dir ~repo ~backup_name
  in
  mkdirp (Node.Path.dirname db_path);
  write_file_utf8 db_path ("sqlite-" ^ backup_name);
  (match metadata with
  | Some m -> write_file_utf8 metadata_path (Edn_util.pr_str m)
  | None -> ());
  db_path

let backup_metadata ~(source : string option) ~(repo : string)
    ~(backup_name : string) ~(created_at_ms : float) ~(db_path : string)
    : Datascript.value =
  Datascript.Map
    [ (Datascript.Keyword "schema-version", Datascript.Int64 1L)
    ; (Datascript.Keyword "name", Datascript.String backup_name)
    ; (Datascript.Keyword "repo", Datascript.String repo)
    ; ( Datascript.Keyword "source"
      , match source with
        | Some s -> Datascript.Keyword s
        | None -> Datascript.Nil )
    ; ( Datascript.Keyword "created-at-ms"
      , Datascript.Int64 (Int64.of_float created_at_ms) )
    ; (Datascript.Keyword "db-path", Datascript.String db_path)
    ]

(* ---------- electron.core-test -> Electron_lifecycle ---------- *)

let () =
  Fest.Promise.test "start-waits-for-asynchronous-teardown" (fun () ->
      let events = ref [] in
      let teardown_done, resolve_teardown = deferred () in
      let lifecycle_op = ref (Js.Promise.resolve ()) in
      ignore
        (Electron_lifecycle.enqueue lifecycle_op (fun () ->
             events := `Teardown :: !events;
             teardown_done));
      ignore
        (Electron_lifecycle.enqueue lifecycle_op (fun () ->
             events := `Setup :: !events;
             Js.Promise.resolve ()));
      let* () = delay 0 in
      Fest.expect |> Fest.deep_equal !events [ `Teardown ];
      resolve_teardown ();
      let* () = delay 0 in
      Fest.expect |> Fest.deep_equal !events [ `Setup; `Teardown ];
      Js.Promise.resolve ())

let () =
  Fest.Promise.test "start-continues-after-teardown-failure" (fun () ->
      let events = ref [] in
      let lifecycle_op = ref (Js.Promise.resolve ()) in
      ignore
        (Electron_lifecycle.enqueue lifecycle_op (fun () ->
             events := `Teardown :: !events;
             js_reject "teardown failed"));
      ignore
        (Electron_lifecycle.enqueue lifecycle_op (fun () ->
             events := `Setup :: !events;
             Js.Promise.resolve ()));
      let* () = delay 0 in
      Fest.expect |> Fest.deep_equal !events [ `Setup; `Teardown ];
      Js.Promise.resolve ())

(* ---------- electron.interop-test -> Electron_interop ---------- *)

let () =
  Fest.test "default-function-or-module-test" (fun () ->
      (* uses native ESM default export when it is callable *)
      let open_fn : Js.Json.t = json_of_any (fun [@u] () -> Js.Json.null) in
      let module_ = js_obj [ ("default", open_fn) ] in
      Fest.expect
      |> Fest.deep_equal
           (Electron_interop.default_function_or_module module_ == open_fn)
           true;
      (* keeps CommonJS function exports callable *)
      Fest.expect
      |> Fest.deep_equal
           (Electron_interop.default_function_or_module open_fn == open_fn)
           true;
      (* falls back to module when default is not callable *)
      let module_2 = js_obj [ ("default", Js.Json.string "not-callable") ] in
      Fest.expect
      |> Fest.deep_equal
           (Electron_interop.default_function_or_module module_2
           == module_2)
           true)

(* ---------- electron.release-warning-test -> Electron_release_warning -- *)

let () =
  Fest.test "x64-on-apple-silicon?-test" (fun () ->
      let info ~platform ~arch ~running_under_arm64_translation =
        { Electron_release_warning.platform
        ; arch
        ; running_under_arm64_translation
        }
      in
      Fest.expect
      |> Fest.deep_equal
           (Electron_release_warning.x64_on_apple_silicon
              (info ~platform:"darwin" ~arch:"x64"
                 ~running_under_arm64_translation:true))
           true;
      Fest.expect
      |> Fest.deep_equal
           (Electron_release_warning.x64_on_apple_silicon
              (info ~platform:"darwin" ~arch:"arm64"
                 ~running_under_arm64_translation:false))
           false;
      Fest.expect
      |> Fest.deep_equal
           (Electron_release_warning.x64_on_apple_silicon
              (info ~platform:"darwin" ~arch:"x64"
                 ~running_under_arm64_translation:false))
           false;
      Fest.expect
      |> Fest.deep_equal
           (Electron_release_warning.x64_on_apple_silicon
              (info ~platform:"win32" ~arch:"x64"
                 ~running_under_arm64_translation:true))
           false)

let () =
  Fest.test "selected-release-url-test" (fun () ->
      Fest.expect
      |> Fest.deep_equal
           (Electron_release_warning.selected_release_url 0)
           (Some Electron_release_warning.stable_release_url);
      Fest.expect
      |> Fest.deep_equal
           (Electron_release_warning.selected_release_url 1)
           (Some Electron_release_warning.nightly_release_url);
      Fest.expect
      |> Fest.deep_equal (Electron_release_warning.selected_release_url 2) None
      (* cljs also asserts (selected-release-url nil) -> nil; the OCaml
         signature takes int, so there is no nil case. *))

(* ---------- electron.spell-check-test -> Electron_spell_check ---------- *)

let () =
  Fest.test "session-spellcheck-enabled?-test" (fun () ->
      Fest.expect
      |> Fest.deep_equal
           (Electron_spell_check.session_spellcheck_enabled Datascript.Nil)
           true;
      Fest.expect
      |> Fest.deep_equal
           (Electron_spell_check.session_spellcheck_enabled
              (Datascript.Bool true))
           true;
      Fest.expect
      |> Fest.deep_equal
           (Electron_spell_check.session_spellcheck_enabled
              (Datascript.Bool false))
           false)

let () =
  Fest.test "startup-spellcheck-states-test" (fun () ->
      Fest.expect
      |> Fest.deep_equal
           (Electron_spell_check.startup_spellcheck_states true true)
           (false, true);
      Fest.expect
      |> Fest.deep_equal
           (Electron_spell_check.startup_spellcheck_states true false)
           (false, false);
      Fest.expect
      |> Fest.deep_equal
           (Electron_spell_check.startup_spellcheck_states false true)
           (true, true);
      Fest.expect
      |> Fest.deep_equal
           (Electron_spell_check.startup_spellcheck_states false false)
           (false, false))

let () =
  Fest.test "apply-window-spellcheck!-test" (fun () ->
      let calls = ref [] in
      let session = Js.Dict.empty () in
      Js.Dict.set session "spellCheckerEnabled" (Js.Json.boolean true);
      Js.Dict.set session "setSpellCheckerEnabled"
        (json_of_any (fun [@u] (enabled : Js.Json.t) ->
             calls := enabled :: !calls;
             Js.Dict.set session "spellCheckerEnabled" enabled));
      let win =
        js_obj
          [ ("webContents", js_obj [ ("session", Js.Json.object_ session) ])
          ]
      in
      ignore
        (Electron_spell_check.apply_window_spellcheck (as_win win) false);
      Fest.expect
      |> Fest.deep_equal (List.map Js.Json.decodeBoolean !calls) [ Some false ];
      Fest.expect
      |> Fest.deep_equal
           (Option.bind
              (Js.Dict.get session "spellCheckerEnabled")
              Js.Json.decodeBoolean)
           (Some false))

(* ---------- electron.graph-switch-flow-test -> Electron_graph_switch_flow *)

let () =
  Fest.test "set-current-graph-switch-does-not-release-runtime" (fun () ->
      Fest.expect
      |> Fest.deep_equal
           (Electron_graph_switch_flow
            .release_runtime_on_set_current_graph
              (js_obj
                 [ ("previous-graph-path", Js.Json.string "graph-a")
                 ; ("next-graph-path", Js.Json.string "graph-b")
                 ]))
           false)

let () =
  Fest.test "set-current-graph-reselect-does-not-release-runtime" (fun () ->
      Fest.expect
      |> Fest.deep_equal
           (Electron_graph_switch_flow
            .release_runtime_on_set_current_graph
              (js_obj
                 [ ("previous-graph-path", Js.Json.string "graph-a")
                 ; ("next-graph-path", Js.Json.string "graph-a")
                 ]))
           false)

(* ---------- electron.mcp-transport-test -> Electron_mcp_transport ------- *)

let cors_headers : (string * Js.Json.t) list =
  [ ("access-control-allow-origin", Js.Json.string "*")
  ; ("access-control-expose-headers", Js.Json.string "mcp-session-id")
  ; ("vary", Js.Json.string "Origin")
  ]

(* fake fastify reply: getHeaders returns the queued headers, .raw records
   every header set on it *)
let fake_reply (headers : (string * Js.Json.t) list)
    : Electron_mcp_transport.reply * Js.Json.t * (string * Js.Json.t) list ref
    =
  let raw_headers = ref [] in
  let raw =
    js_obj
      [ ( "setHeader"
        , json_of_any (fun [@u] (k : string) (v : Js.Json.t) ->
              raw_headers := (k, v) :: !raw_headers) )
      ]
  in
  let reply =
    js_obj
      [ ( "getHeaders"
        , json_of_any (fun [@u] () ->
              js_obj
                (List.rev_map (fun (k, v) -> k, v) (List.rev headers))) )
      ; ("raw", raw)
      ]
  in
  (as_reply reply, raw, raw_headers)

(* records which headers were already on the raw response plus the args *)
let fake_transport (raw_headers : (string * Js.Json.t) list ref)
    : Electron_mcp_transport.transport
      * ((string * Js.Json.t) list * Js.Json.t array) option ref =
  let seen = ref None in
  let transport =
    js_obj
      [ ( "handleRequest"
        , json_of_any
            (fun [@u] (a : Js.Json.t) (b : Js.Json.t)
               (c : Js.Json.t Js.Undefined.t) ->
               let args =
                 match Js.Undefined.toOption c with
                 | Some c -> [| a; b; c |]
                 | None -> [| a; b |]
               in
               seen := Some (!raw_headers, args)) )
      ]
  in
  (as_transport transport, seen)

let headers_equal (a : (string * Js.Json.t) list)
    (b : (string * Js.Json.t) list) : bool =
  List.equal
    (fun (k1, v1) (k2, v2) ->
      String.equal k1 k2
      && Option.equal String.equal (Js.Json.decodeString v1)
           (Js.Json.decodeString v2))
    (List.sort compare a) (List.sort compare b)

let () =
  Fest.test "copy-reply-headers-test" (fun () ->
      (* headers queued on the reply are copied onto the raw response *)
      let reply, _raw, raw_headers = fake_reply cors_headers in
      Electron_mcp_transport.copy_reply_headers
        (as_request (js_obj [])) reply;
      Fest.expect
      |> Fest.deep_equal (headers_equal !raw_headers cors_headers) true;
      (* a reply without queued headers leaves the raw response untouched *)
      let reply, _raw, raw_headers = fake_reply [] in
      Electron_mcp_transport.copy_reply_headers
        (as_request (js_obj [])) reply;
      Fest.expect |> Fest.deep_equal !raw_headers [])

let () =
  Fest.test "handle-request-with-body-test" (fun () ->
      let reply, raw, raw_headers = fake_reply cors_headers in
      let transport, seen = fake_transport raw_headers in
      let raw_req = js_obj [] in
      let fake_req = as_request (js_obj [ ("raw", raw_req) ]) in
      let body =
        js_obj
          [ ("jsonrpc", Js.Json.string "2.0")
          ; ("id", Js.Json.number 2.)
          ; ("method", Js.Json.string "tools/list")
          ]
      in
      Electron_mcp_transport.handle_request_with_body transport fake_req
        reply body;
      match !seen with
      | None -> Fest.expect |> Fest.ok false
      | Some (headers, args) ->
          Fest.expect |> Fest.deep_equal (headers_equal headers cors_headers) true;
          Fest.expect
          |> Fest.deep_equal
               (Array.length args = 3
               && args.(0) == raw_req
               && args.(1) == raw
               && args.(2) == body)
               true)

let () =
  Fest.test "handle-request-without-body-test" (fun () ->
      let reply, raw, raw_headers = fake_reply cors_headers in
      let transport, seen = fake_transport raw_headers in
      let raw_req = js_obj [] in
      let fake_req = as_request (js_obj [ ("raw", raw_req) ]) in
      Electron_mcp_transport.handle_request transport fake_req reply;
      match !seen with
      | None -> Fest.expect |> Fest.ok false
      | Some (headers, args) ->
          Fest.expect |> Fest.deep_equal (headers_equal headers cors_headers) true;
          Fest.expect
          |> Fest.deep_equal
               (Array.length args = 2 && args.(0) == raw_req && args.(1) == raw)
               true)

(* ---------- electron.cli-install-test -> Electron_cli_install ---------- *)

let path_join (parts : string list) : string = String.concat "/" parts

let cli_t (k : string) (args : 'a array) : string =
  match k with
  | "electron/cli-install-failed" ->
      "Failed to install Logseq CLI.\n" ^ Js.String.make args.(0)
  | _ -> ""

type cli_install_result =
  { writes : (string * string) list
  ; chmods : (string * string) list
  ; errors : (string * string) list (* (title, content) *)
  }

let run_install ?(windows = false) ?(packaged = true)
    ?(cli_dir = Some "/home/me/.local/bin")
    ?(cli_dir_fn : (unit -> string option) option)
    ?(exe_path = "/Applications/Logseq.app/Contents/MacOS/Logseq")
    ?(appimage_path : string option) ?(existing_files : string list = [])
    ?(existing_contents : (string * string) list = [])
    ?(write_file : (string -> string -> unit) option) () :
    cli_install_result =
  let writes = ref [] in
  let chmods = ref [] in
  let errors = ref [] in
  let files = ref existing_files in
  let deps : Electron_cli_install.deps =
    { windows
    ; packaged
    ; cli_path = "/app/logseq-cli.js"
    ; cli_dir
    ; cli_dir_fn
    ; exe_path
    ; appimage_path
    ; home_dir = "/home/me"
    ; path_join
    ; exists = (fun p -> List.mem p !files)
    ; read_file =
        (fun p ->
          match List.assoc_opt p existing_contents with
          | Some c -> c
          | None -> raise (Failure ("missing file " ^ p)))
    ; write_file =
        (match write_file with
        | Some f -> f
        | None ->
            (fun path content ->
              writes := (path, content) :: !writes;
              files := path :: !files))
    ; chmod = (fun path mode -> chmods := (path, mode) :: !chmods)
    ; ensure_dir = (fun dir -> files := dir :: !files)
    ; writable_dir = (fun _dir -> true)
    ; show_error_box =
        (fun title content -> errors := (title, content) :: !errors)
    ; t = cli_t
    ; log_info = (fun _ _ -> ())
    ; log_warn = (fun _ _ _ -> ())
    }
  in
  Electron_cli_install.install_cli_launcher deps;
  { writes = List.rev !writes
  ; chmods = List.rev !chmods
  ; errors = List.rev !errors
  }

let () =
  Fest.test "preferred-unix-cli-dir-prefers-local-bin" (fun () ->
      let created = ref [] in
      let deps : Electron_cli_install.deps =
        { windows = false
        ; packaged = false
        ; cli_path = "/app/logseq-cli.js"
        ; cli_dir = None
        ; cli_dir_fn = None
        ; exe_path = "/Applications/Logseq.app/Contents/MacOS/Logseq"
        ; appimage_path = None
        ; home_dir = "/home/me"
        ; path_join
        ; exists = (fun _ -> false)
        ; read_file = (fun _ -> "")
        ; write_file = (fun _ _ -> ())
        ; chmod = (fun _ _ -> ())
        ; ensure_dir = (fun dir -> created := dir :: !created)
        ; writable_dir =
            (fun dir ->
              List.mem dir
                [ "first-writable-path-dir"; "/home/me/.local/bin" ])
        ; show_error_box = (fun _ _ -> ())
        ; t = cli_t
        ; log_info = (fun _ _ -> ())
        ; log_warn = (fun _ _ _ -> ())
        }
      in
      Fest.expect
      |> Fest.deep_equal
           (Electron_cli_install.preferred_unix_cli_dir deps)
           (Some "/home/me/.local/bin");
      Fest.expect |> Fest.deep_equal !created [ "/home/me/.local/bin" ])

let () =
  Fest.test "install-cli-launcher-does-not-show-success-dialog" (fun () ->
      let result =
        run_install ~existing_files:[ "/app/logseq-cli.js" ] ()
      in
      Fest.expect
      |> Fest.deep_equal
           (match result.writes with (p, _) :: _ -> Some p | [] -> None)
           (Some "/home/me/.local/bin/logseq");
      Fest.expect
      |> Fest.deep_equal result.chmods
           [ ("/home/me/.local/bin/logseq", "755") ];
      Fest.expect |> Fest.deep_equal result.errors [])

let () =
  Fest.test "install-cli-launcher-uses-stable-appimage-path" (fun () ->
      let result =
        run_install ~existing_files:[ "/app/logseq-cli.js" ]
          ~exe_path:"/tmp/.mount_LogseqA1B2C3/logseq"
          ~appimage_path:"/home/me/Logseq.AppImage" ()
      in
      let content = match result.writes with (_, c) :: _ -> c | [] -> "" in
      Fest.expect
      |> Fest.deep_equal
           (Common_util.str_includes content "\"/home/me/Logseq.AppImage\"")
           true;
      Fest.expect
      |> Fest.deep_equal
           (Common_util.str_includes content "/tmp/.mount_LogseqA1B2C3/logseq")
           false)

let () =
  Fest.test
    "install-cli-launcher-skips-dialog-when-appimage-mount-path-changes"
    (fun () ->
      let stable_content =
        "#!/usr/bin/env sh\n# " ^ Electron_cli_install.cli_launcher_marker
        ^ "\nset -eu\nELECTRON_RUN_AS_NODE=1 exec \
           \"/home/me/Logseq.AppImage\" \"/app/logseq-cli.js\" \"$@\"\n"
      in
      let result =
        run_install
          ~existing_files:
            [ "/app/logseq-cli.js"; "/home/me/.local/bin/logseq" ]
          ~existing_contents:
            [ ("/home/me/.local/bin/logseq", stable_content) ]
          ~exe_path:"/tmp/.mount_LogseqD4E5F6/logseq"
          ~appimage_path:"/home/me/Logseq.AppImage" ()
      in
      Fest.expect |> Fest.deep_equal result.writes [];
      Fest.expect |> Fest.deep_equal result.chmods [];
      Fest.expect |> Fest.deep_equal result.errors [])

let () =
  Fest.test "install-cli-launcher-keeps-windows-path" (fun () ->
      let windows_dir =
        "C:/Users/me/AppData/Local/Microsoft/WindowsApps"
      in
      let result =
        run_install ~windows:true ~cli_dir:(Some windows_dir)
          ~existing_files:[ "/app/logseq-cli.js" ] ()
      in
      Fest.expect
      |> Fest.deep_equal
           (match result.writes with (p, _) :: _ -> Some p | [] -> None)
           (Some (windows_dir ^ "/logseq.cmd"));
      Fest.expect |> Fest.deep_equal result.chmods [];
      Fest.expect |> Fest.deep_equal result.errors [])

let () =
  Fest.test "install-cli-launcher-shows-error-dialog-on-failure" (fun () ->
      let result =
        run_install ~existing_files:[ "/app/logseq-cli.js" ]
          ~write_file:(fun _ _ -> raise (as_exn (js_error "disk full")))
          ()
      in
      match result.errors with
      | (title, content) :: _ ->
          Fest.expect |> Fest.deep_equal title "Logseq";
          Fest.expect
          |> Fest.deep_equal
               (Common_util.str_includes content
                  "Failed to install Logseq CLI")
               true;
          Fest.expect
          |> Fest.deep_equal (Common_util.str_includes content "disk full") true
      | [] -> Fest.expect |> Fest.ok false)

let () =
  Fest.test
    "install-cli-launcher-shows-error-dialog-when-directory-selection-fails"
    (fun () ->
      let result =
        run_install ~existing_files:[ "/app/logseq-cli.js" ]
          ~cli_dir:None
          ~cli_dir_fn:(fun () : string option ->
            raise (as_exn (js_error "permission denied")))
          ()
      in
      match result.errors with
      | (title, content) :: _ ->
          Fest.expect |> Fest.deep_equal title "Logseq";
          Fest.expect
          |> Fest.deep_equal
               (Common_util.str_includes content "permission denied")
               true
      | [] -> Fest.expect |> Fest.ok false)

let () =
  Fest.test
    "install-cli-launcher-suppresses-missing-script-dialog-in-dev" (fun () ->
      (* dev runs legitimately lack the staged static/logseq-cli.js —
         warn only, no modal on every cold start *)
      let result = run_install ~packaged:false () in
      Fest.expect |> Fest.deep_equal result.errors [];
      Fest.expect |> Fest.deep_equal result.writes [])

let () =
  Fest.test
    "install-cli-launcher-shows-missing-script-dialog-when-packaged"
    (fun () ->
      let result = run_install ~packaged:true () in
      match result.errors with
      | (title, content) :: _ ->
          Fest.expect |> Fest.deep_equal title "Logseq";
          Fest.expect
          |> Fest.deep_equal
               (Common_util.str_includes content "Missing CLI script")
               true
      | [] -> Fest.expect |> Fest.ok false)

let () =
  Fest.test
    "install-cli-launcher-shows-other-errors-in-dev" (fun () ->
      (* only the missing-script case is legitimate in dev — real
         install failures still surface *)
      let result =
        run_install ~packaged:false
          ~existing_files:[ "/app/logseq-cli.js" ]
          ~write_file:(fun _ _ -> raise (as_exn (js_error "disk full")))
          ()
      in
      match result.errors with
      | (_title, content) :: _ ->
          Fest.expect
          |> Fest.deep_equal (Common_util.str_includes content "disk full") true
      | [] -> Fest.expect |> Fest.ok false)

(* ---------- electron.embedding-server-test -> Electron_embedding_server *)

module Embed = Electron_embedding_server

type spawn_record =
  { sp_runtime_dir : string
  ; sp_venv_dir : string
  ; sp_venv_python : string
  ; sp_sidecar_dir : string
  ; sp_script_path : string
  ; sp_host : string
  ; sp_port : int option
  ; sp_model_id : string
  }

type embed_fake =
  { existing : string list ref
  ; ensured_dirs : string list ref
  ; commands : (string * string array * string option) list ref
  ; writes : (string * string) list ref
  ; spawns : spawn_record list ref
  ; events : (string * Js.Json.t) list ref
  ; removed_dirs : string list ref
  ; env : (string * string) list ref
  ; killed : bool ref
  ; opts : Embed.opts
  }

let fake_embed_runtime ?(allocated_port = 54321) ?(find_port = true)
    ?(run_command :
       (existing:string list ref ->
        string ->
        string array ->
        Embed.run_command_opts ->
        unit Js.Promise.t)
         option)
    ?(wait_ready : (string -> unit Js.Promise.t) option)
    ~(existing_paths : string list) () : embed_fake =
  let existing = ref existing_paths in
  let ensured_dirs = ref [] in
  let commands = ref [] in
  let writes = ref [] in
  let spawns = ref [] in
  let events = ref [] in
  let removed_dirs = ref [] in
  let env = ref [] in
  let killed = ref false in
  let proc =
    js_obj
      [ ( "kill"
        , json_of_any (fun [@u] () -> killed := true; true) )
      ; ( "on"
        , json_of_any (fun [@u] (_event : Js.Json.t) (_cb : Js.Json.t) ->
              ()) )
      ]
  in
  let record_command cmd args (ro : Embed.run_command_opts) =
    commands := (cmd, args, ro.cwd) :: !commands
  in
  let run_command_impl cmd args ro =
    record_command cmd args ro;
    match run_command with
    | Some f -> f ~existing cmd args ro
    | None ->
        (* default: make `-m venv .venv` produce the venv python *)
        if
          Array.length args = 3
          && String.equal args.(0) "-m"
          && String.equal args.(1) "venv"
          && String.equal args.(2) ".venv"
        then (
          match ro.cwd with
          | Some cwd ->
              existing :=
                Node.Path.join [| cwd; ".venv"; "bin"; "python" |]
                :: !existing
          | None -> ());
        Js.Promise.resolve ()
  in
  let opts : Embed.opts =
    { Embed.default_opts with
      platform = Some "darwin"
    ; user_data_dir = Some "/users/me/logseq"
    ; packaged = Some false
    ; resources_path = Some "/app/Contents/Resources"
    ; dirname = Some "/repo/static"
    ; python_command = Some "python3"
    ; exists = Some (fun p -> List.mem p !existing)
    ; ensure_dir = Some (fun d -> ensured_dirs := d :: !ensured_dirs)
    ; remove_dir =
        Some
          (fun dir ->
            removed_dirs := dir :: !removed_dirs;
            existing :=
              List.filter
                (fun p -> not (str_starts_with p dir))
                !existing)
    ; delete_env = Some (fun _ -> ())
    ; write_file =
        Some (fun file content -> writes := (file, content) :: !writes)
    ; logger = Some Embed.noop_logger
    ; find_port =
        (if find_port then
           Some (fun _host -> Js.Promise.resolve allocated_port)
         else None)
    ; set_env =
        Some
          (fun k v ->
            events := ("set-env", Js.Json.string v) :: !events;
            env := (k, v) :: !env)
    ; run_command = Some run_command_impl
    ; wait_ready =
        Some
          (Option.value wait_ready ~default:(fun endpoint ->
               events :=
                 ("wait-ready", Js.Json.string endpoint) :: !events;
               Js.Promise.resolve ()))
    ; spawn_server =
        Some
          (fun (cfg : Embed.config) ->
            events :=
              ( "spawn-server"
              , Js.Json.number
                  (float_of_int (Option.value cfg.port ~default:0)) )
              :: !events;
            spawns :=
              { sp_runtime_dir = cfg.runtime_dir
              ; sp_venv_dir = cfg.venv_dir
              ; sp_venv_python = cfg.venv_python
              ; sp_sidecar_dir = cfg.sidecar_dir
              ; sp_script_path = cfg.script_path
              ; sp_host = cfg.host
              ; sp_port = cfg.port
              ; sp_model_id = cfg.model_id
              }
              :: !spawns;
            as_child_process proc)
    }
  in
  { existing
  ; ensured_dirs
  ; commands
  ; writes
  ; spawns
  ; events
  ; removed_dirs
  ; env
  ; killed
  ; opts
  }

let fake_app () : Electron_bindings.App.t = as_app Js.Json.null

let command_triples (f : embed_fake) : (string * string list * string option) list =
  List.rev_map
    (fun (cmd, args, cwd) -> cmd, Array.to_list args, cwd)
    !(f.commands)

let () =
  Fest.Promise.test "start-skips-unsupported-platforms" (fun () ->
      let f =
        fake_embed_runtime ~existing_paths:[] ()
      in
      let opts = { f.opts with Embed.platform = Some "linux" } in
      let* result = Embed.start ~opts (fake_app ()) in
      Fest.expect |> Fest.deep_equal result "skipped";
      Fest.expect |> Fest.deep_equal !(f.commands) [];
      Fest.expect |> Fest.deep_equal !(f.spawns) [];
      Js.Promise.resolve ())

let () =
  Fest.Promise.test "python-command-available-detects-missing-python"
    (fun () ->
      let commands = ref [] in
      let opts =
        { Embed.default_opts with
          run_command =
            Some
              (fun cmd args _ro ->
                commands := (cmd, Array.to_list args) :: !commands;
                js_reject "spawn python3 ENOENT")
        }
      in
      let* available =
        Embed.python_command_available "python3" ~opts ()
      in
      Fest.expect |> Fest.deep_equal available false;
      Fest.expect
      |> Fest.deep_equal
           (List.rev !commands)
           [ ("python3", [ "--version" ]) ];
      Js.Promise.resolve ())

let () =
  Fest.Promise.test
    "start-allocates-port-creates-local-venv-installs-deps-and-spawns-server"
    (fun () ->
      Embed.stop ();
      let runtime_dir = "/users/me/logseq/embedding-server" in
      let venv_dir = "/users/me/logseq/embedding-server/.venv" in
      let venv_python = "/users/me/logseq/embedding-server/.venv/bin/python" in
      let deps_stamp = "/users/me/logseq/embedding-server/deps-v2.ok" in
      let f = fake_embed_runtime ~existing_paths:[] ~allocated_port:56789 () in
      let* result = Embed.start ~opts:f.opts (fake_app ()) in
      Fest.expect |> Fest.deep_equal result "started";
      Fest.expect |> Fest.deep_equal !(f.ensured_dirs) [ runtime_dir ];
      Fest.expect
      |> Fest.deep_equal (command_triples f)
           [ ( "python3"
             , [ "-m"; "venv"; ".venv" ]
             , Some runtime_dir )
           ; ( venv_python
             , [ "-c"; "import sys" ]
             , Some runtime_dir )
           ; ( venv_python
             , [ "-m"
               ; "pip"
               ; "install"
               ; "sentence-transformers"
               ; "httpx[socks]"
               ]
             , Some runtime_dir )
           ];
      Fest.expect
      |> Fest.deep_equal !(f.writes)
           [ (deps_stamp, "sentence-transformers\nhttpx[socks]\n") ];
      Fest.expect
      |> Fest.deep_equal !(f.spawns)
           [ { sp_runtime_dir = runtime_dir
             ; sp_venv_dir = venv_dir
             ; sp_venv_python = venv_python
             ; sp_sidecar_dir = "/repo/sidecar"
             ; sp_script_path = "/repo/sidecar/embedding_server.py"
             ; sp_host = "127.0.0.1"
             ; sp_port = Some 56789
             ; sp_model_id = "all-MiniLM-L6-v2"
             }
           ];
      Fest.expect
      |> Fest.deep_equal !(f.env)
           [ ( "LOGSEQ_EMBEDDINGS_URL"
             , "http://127.0.0.1:56789/v1/embeddings" )
           ];
      Embed.stop ();
      Fest.expect |> Fest.deep_equal !(f.killed) true;
      Js.Promise.resolve ())

let () =
  Fest.Promise.test "start-sets-embedding-env-after-server-is-ready"
    (fun () ->
      Embed.stop ();
      let venv_python =
        "/users/me/logseq/embedding-server/.venv/bin/python"
      in
      let deps_stamp =
        "/users/me/logseq/embedding-server/deps-v2.ok"
      in
      let f =
        fake_embed_runtime
          ~existing_paths:[ venv_python; deps_stamp ]
          ~allocated_port:56789 ()
      in
      let* result = Embed.start ~opts:f.opts (fake_app ()) in
      Fest.expect |> Fest.deep_equal result "started";
      Fest.expect
      |> Fest.deep_equal !(f.events)
           [ ("set-env", Js.Json.string "http://127.0.0.1:56789/v1/embeddings")
           ; ("wait-ready", Js.Json.string "http://127.0.0.1:56789/healthz")
           ; ("spawn-server", Js.Json.number 56789.)
           ];
      Fest.expect
      |> Fest.deep_equal !(f.env)
           [ ( "LOGSEQ_EMBEDDINGS_URL"
             , "http://127.0.0.1:56789/v1/embeddings" )
           ];
      Embed.stop ();
      Js.Promise.resolve ())

let () =
  Fest.Promise.test
    "start-does-not-publish-embedding-env-before-setup-completes" (fun () ->
      Embed.stop ();
      let f =
        fake_embed_runtime ~existing_paths:[] ~allocated_port:56789
          ~run_command:(fun ~existing:_ _cmd _args _ro ->
            js_reject "venv failed")
          ()
      in
      let* error = expect_rejection (Embed.start ~opts:f.opts (fake_app ())) in
      Fest.expect |> Fest.ok (String.length (exn_message error) > 0);
      Fest.expect |> Fest.deep_equal !(f.env) [];
      Fest.expect |> Fest.deep_equal !(f.spawns) [];
      Js.Promise.resolve ())

let () =
  Fest.Promise.test
    "start-upgrades-existing-venv-when-dependency-stamp-is-stale" (fun () ->
      Embed.stop ();
      let runtime_dir = "/users/me/logseq/embedding-server" in
      let venv_python =
        "/users/me/logseq/embedding-server/.venv/bin/python"
      in
      let old_deps_stamp =
        "/users/me/logseq/embedding-server/deps-v1.ok"
      in
      let deps_stamp =
        "/users/me/logseq/embedding-server/deps-v2.ok"
      in
      let f =
        fake_embed_runtime
          ~existing_paths:[ venv_python; old_deps_stamp ]
          ~allocated_port:56789 ()
      in
      let* result = Embed.start ~opts:f.opts (fake_app ()) in
      Fest.expect |> Fest.deep_equal result "started";
      Fest.expect
      |> Fest.deep_equal (command_triples f)
           [ ( venv_python
             , [ "-c"; "import sys" ]
             , Some runtime_dir )
           ; ( venv_python
             , [ "-m"
               ; "pip"
               ; "install"
               ; "sentence-transformers"
               ; "httpx[socks]"
               ]
             , Some runtime_dir )
           ];
      Fest.expect
      |> Fest.deep_equal !(f.writes)
           [ (deps_stamp, "sentence-transformers\nhttpx[socks]\n") ];
      Embed.stop ();
      Js.Promise.resolve ())

let () =
  Fest.Promise.test
    "start-reuses-existing-venv-and-installed-deps-with-allocated-port"
    (fun () ->
      Embed.stop ();
      let runtime_dir = "/users/me/logseq/embedding-server" in
      let venv_python =
        "/users/me/logseq/embedding-server/.venv/bin/python"
      in
      let deps_stamp =
        "/users/me/logseq/embedding-server/deps-v2.ok"
      in
      let f =
        fake_embed_runtime
          ~existing_paths:[ venv_python; deps_stamp ]
          ~allocated_port:45678 ()
      in
      let opts = { f.opts with Embed.packaged = Some true } in
      let* result = Embed.start ~opts (fake_app ()) in
      Fest.expect |> Fest.deep_equal result "started";
      Fest.expect
      |> Fest.deep_equal (command_triples f)
           [ ( venv_python
             , [ "-c"; "import sys" ]
             , Some runtime_dir )
           ];
      Fest.expect
      |> Fest.deep_equal !(f.spawns)
           [ { sp_runtime_dir = runtime_dir
             ; sp_venv_dir = "/users/me/logseq/embedding-server/.venv"
             ; sp_venv_python = venv_python
             ; sp_sidecar_dir = "/app/Contents/Resources/sidecar"
             ; sp_script_path =
                 "/app/Contents/Resources/sidecar/embedding_server.py"
             ; sp_host = "127.0.0.1"
             ; sp_port = Some 45678
             ; sp_model_id = "all-MiniLM-L6-v2"
             }
           ];
      Fest.expect
      |> Fest.deep_equal !(f.env)
           [ ( "LOGSEQ_EMBEDDINGS_URL"
             , "http://127.0.0.1:45678/v1/embeddings" )
           ];
      Embed.stop ();
      Js.Promise.resolve ())

let () =
  Fest.Promise.test
    "start-recreates-existing-venv-when-python-is-not-usable" (fun () ->
      Embed.stop ();
      let runtime_dir = "/users/me/logseq/embedding-server" in
      let venv_dir = "/users/me/logseq/embedding-server/.venv" in
      let venv_python =
        "/users/me/logseq/embedding-server/.venv/bin/python"
      in
      let deps_stamp =
        "/users/me/logseq/embedding-server/deps-v2.ok"
      in
      let validation_attempts = ref 0 in
      let f =
        fake_embed_runtime
          ~existing_paths:[ venv_python; deps_stamp ]
          ~allocated_port:45678
          ~run_command:(fun ~existing cmd args ro ->
            if
              String.equal cmd venv_python
              && Array.to_list args = [ "-c"; "import sys" ]
              && !validation_attempts = 0
            then (
              incr validation_attempts;
              js_reject "stale venv python")
            else (
              (* like the cljs fake: `-m venv .venv` creates the venv *)
              if
                Array.length args = 3
                && String.equal args.(0) "-m"
                && String.equal args.(1) "venv"
              then (
                match ro.cwd with
                | Some cwd ->
                    existing :=
                      Node.Path.join [| cwd; ".venv"; "bin"; "python" |]
                      :: !existing
                | None -> ());
              Js.Promise.resolve ()))
          ()
      in
      let* result = Embed.start ~opts:f.opts (fake_app ()) in
      Fest.expect |> Fest.deep_equal result "started";
      Fest.expect |> Fest.deep_equal !(f.removed_dirs) [ venv_dir ];
      Fest.expect
      |> Fest.deep_equal (command_triples f)
           [ ( venv_python
             , [ "-c"; "import sys" ]
             , Some runtime_dir )
           ; ( "python3"
             , [ "-m"; "venv"; ".venv" ]
             , Some runtime_dir )
           ; ( venv_python
             , [ "-c"; "import sys" ]
             , Some runtime_dir )
           ; ( venv_python
             , [ "-m"
               ; "pip"
               ; "install"
               ; "sentence-transformers"
               ; "httpx[socks]"
               ]
             , Some runtime_dir )
           ];
      Fest.expect
      |> Fest.deep_equal !(f.writes)
           [ (deps_stamp, "sentence-transformers\nhttpx[socks]\n") ];
      Embed.stop ();
      Js.Promise.resolve ())

let () =
  Fest.Promise.test "start-default-port-allocator-uses-node-net" (fun () ->
      Embed.stop ();
      let venv_python =
        "/users/me/logseq/embedding-server/.venv/bin/python"
      in
      let deps_stamp =
        "/users/me/logseq/embedding-server/deps-v2.ok"
      in
      (* cljs (dissoc runtime :find-port!) — drop find_port so the real
         node:net allocator runs *)
      let f =
        fake_embed_runtime ~find_port:false
          ~existing_paths:[ venv_python; deps_stamp ]
          ()
      in
      let* result = Embed.start ~opts:f.opts (fake_app ()) in
      Fest.expect |> Fest.deep_equal result "started";
      (match !(f.spawns) with
      | { sp_port = Some port; _ } :: _ ->
          Fest.expect |> Fest.ok (port >= 1 && port <= 65535);
          Fest.expect
          |> Fest.deep_equal !(f.env)
               [ ( "LOGSEQ_EMBEDDINGS_URL"
                 , "http://127.0.0.1:" ^ string_of_int port
                   ^ "/v1/embeddings" )
               ]
      | _ -> Fest.expect |> Fest.ok false);
      Embed.stop ();
      Js.Promise.resolve ())

(* ---------- electron.db-test -> Electron_db / Graph_backup ---------- *)

let () =
  Fest.test "ensure-graph-dir-uses-encoded-directory-name" (fun () ->
      let graphs_dir = mk_tmp_dir "electron-db-graph-dir" in
      with_graphs_dir_sync graphs_dir (fun () ->
          let graph_dir =
            Electron_db.ensure_graph_dir "logseq_db_foo/bar"
          in
          Fest.expect
          |> Fest.deep_equal graph_dir
               (Node.Path.join [| graphs_dir; "foo~2Fbar" |]);
          Fest.expect |> Fest.deep_equal (exists_sync graph_dir) true))

let () =
  Fest.test "read-db-uses-encoded-directory-name" (fun () ->
      let graphs_dir = mk_tmp_dir "electron-db-save" in
      let db_name = "logseq_db_foo/bar" in
      with_graphs_dir_sync graphs_dir (fun () ->
          let _graph_dir_name, db_path =
            Common_sqlite.get_db_full_path graphs_dir db_name
          in
          mkdirp (Node.Path.dirname db_path);
          write_file_utf8 db_path "db-data";
          Fest.expect
          |> Fest.deep_equal
               (exists_sync
                  (Node.Path.join
                     [| graphs_dir; "foo~2Fbar"; "db.sqlite" |]))
               true;
          match Electron_db.get_db db_name with
          | Some buf ->
              Fest.expect |> Fest.deep_equal (buffer_to_string buf) "db-data"
          | None -> Fest.expect |> Fest.ok false))

let () =
  Fest.Promise.test
    "backup-db-creates-sqlite-copy-from-existing-disk-db" (fun () ->
      let graphs_dir = mk_tmp_dir "electron-db-backup" in
      let db_name = "logseq_db_foo/bar" in
      with_graphs_dir graphs_dir (fun () ->
          let _graph_dir_name, db_path =
            Common_sqlite.get_db_full_path graphs_dir db_name
          in
          mkdirp (Node.Path.dirname db_path);
          let source_db = Sqlite.open_db ~path:db_path in
          Sqlite.exec source_db ~sql:
            "create table kvs (addr text primary key, content text);"
            ~bind:[||];
          Sqlite.exec source_db ~sql:
            "insert into kvs (addr, content) values ('a', 'alpha')"
            ~bind:[||];
          Sqlite.close source_db;
          let* _result =
            Electron_db.backup_db ~db_name ~opts:(js_obj [])
          in
          let backups =
            Graph_backup.list_backups ~graphs_dir ~repo:db_name
          in
          Fest.expect |> Fest.deep_equal (List.length backups) 1;
          (match backups with
          | [ { Graph_backup.name; _ } ] ->
              let backup_path =
                Graph_backup.backup_db_path ~graphs_dir ~repo:db_name
                  ~backup_name:name
              in
              let backup_db = Sqlite.open_db ~path:backup_path in
              let rows =
                Sqlite.query backup_db
                  ~sql:"select addr, content from kvs order by addr"
                  ~bind:[||]
              in
              Sqlite.close backup_db;
              (match rows with
              | [ row ] ->
                  Fest.expect
                  |> Fest.deep_equal
                       (match row.(0) with
                       | Sqlite.Text s -> Some s
                       | _ -> None)
                       (Some "a");
                  Fest.expect
                  |> Fest.deep_equal
                       (match row.(1) with
                       | Sqlite.Text s -> Some s
                       | _ -> None)
                       (Some "alpha")
              | _ -> Fest.expect |> Fest.ok false)
          | _ -> Fest.expect |> Fest.ok false);
          Js.Promise.resolve ()))

let () =
  Fest.Promise.test "backup-db-uses-shared-backup-layout-and-metadata"
    (fun () ->
      let graphs_dir = mk_tmp_dir "electron-db-backup-rules" in
      let db_name = "logseq_db_demo" in
      let _graph_dir_name, db_path =
        Common_sqlite.get_db_full_path graphs_dir db_name
      in
      mkdirp (Node.Path.dirname db_path);
      write_file_utf8 db_path "seed";
      let sqlite_calls = ref [] in
      (* cljs also rebinds backup-file/backup-file and asserts it was
         never called; Electron_db has no such seam — the backup writes
         go through Graph_backup only, so the assertion is vacuous and
         dropped. *)
      with_graphs_dir graphs_dir (fun () ->
          let* _result =
            Electron_db.backup_db_with_sqlite_backup ~db_name
              ~force_backup:false
              ~sqlite_backup:(fun ~src_path ~dst_path ->
                sqlite_calls := (src_path, dst_path) :: !sqlite_calls;
                write_file_utf8 dst_path "copied";
                Js.Promise.resolve ())
              ()
          in
          Fest.expect
          |> Fest.deep_equal (List.length !sqlite_calls) 1;
          Fest.expect
          |> Fest.deep_equal
               (match !sqlite_calls with
               | (src, _) :: _ -> src
               | [] -> "")
               db_path;
          let backups =
            Graph_backup.list_backups ~graphs_dir ~repo:db_name
          in
          Fest.expect |> Fest.deep_equal (List.length backups) 1;
          (match backups with
          | [ { Graph_backup.name; _ } ] ->
              let backup_db_path =
                Graph_backup.backup_db_path ~graphs_dir ~repo:db_name
                  ~backup_name:name
              in
              let metadata =
                read_edn_file
                  (Graph_backup.backup_metadata_path ~graphs_dir
                     ~repo:db_name ~backup_name:name)
              in
              Fest.expect
              |> Fest.deep_equal (read_file_utf8 backup_db_path "utf8") "copied";
              Fest.expect
              |> Fest.deep_equal
                   (Clj_value.map_get_str metadata "repo")
                   (Some db_name);
              Fest.expect
              |> Fest.deep_equal
                   (Clj_value.map_get metadata "source")
                   (Datascript.Keyword "electron-auto");
              Fest.expect
              |> Fest.deep_equal
                   (Clj_value.map_get metadata "name")
                   (Datascript.String name)
          | _ -> Fest.expect |> Fest.ok false);
          Js.Promise.resolve ()))

let () =
  Fest.Promise.test "backup-db-with-sqlite-backup-uses-provided-snapshot-fn"
    (fun () ->
      let graphs_dir = mk_tmp_dir "electron-db-backup-custom-snapshot" in
      let db_name = "logseq_db_demo" in
      let _graph_dir_name, db_path =
        Common_sqlite.get_db_full_path graphs_dir db_name
      in
      mkdirp (Node.Path.dirname db_path);
      write_file_utf8 db_path "seed";
      let custom_calls = ref [] in
      with_graphs_dir graphs_dir (fun () ->
          let* _result =
            Electron_db.backup_db_with_sqlite_backup ~db_name
              ~force_backup:true
              ~sqlite_backup:(fun ~src_path ~dst_path ->
                custom_calls := (src_path, dst_path) :: !custom_calls;
                write_file_utf8 dst_path "worker-copy";
                Js.Promise.resolve ())
              ()
          in
          Fest.expect
          |> Fest.deep_equal
               (List.map fst !custom_calls)
               [ db_path ];
          let backups =
            Graph_backup.list_backups ~graphs_dir ~repo:db_name
          in
          Fest.expect |> Fest.deep_equal (List.length backups) 1;
          (match backups with
          | [ { Graph_backup.name; _ } ] ->
              let backup_db_path =
                Graph_backup.backup_db_path ~graphs_dir ~repo:db_name
                  ~backup_name:name
              in
              let metadata =
                read_edn_file
                  (Graph_backup.backup_metadata_path ~graphs_dir
                     ~repo:db_name ~backup_name:name)
              in
              Fest.expect
              |> Fest.deep_equal (read_file_utf8 backup_db_path "utf8")
                   "worker-copy";
              Fest.expect
              |> Fest.deep_equal
                   (Clj_value.map_get metadata "source")
                   (Datascript.Keyword "electron-manual")
          | _ -> Fest.expect |> Fest.ok false);
          Js.Promise.resolve ()))

(* cljs `with-redefs [db-worker/ensure-runtime! cli-transport/invoke]` —
   here the real Electron_db_worker.ensure_worker + Cli_transport.invoke
   run against a lifecycle-prop stub and a local http stub server, so the
   test exercises one extra real hop. *)
let with_worker_stub ~(graphs_dir : string)
    (invoke_calls : (string * Wire.t list) list ref)
    ?(snapshot_content = "worker-copy")
    ?(extra : Js.Json.t list ref option)
    (run : port:int -> 'a Js.Promise.t) : 'a Js.Promise.t =
  reset_manager_state ();
  Electron_db.reset_auto_backup ();
  let server_p =
    start_stub_server (worker_invoke_handler invoke_calls ~snapshot_content)
  in
  let* server, port = server_p in
  let start_stub =
    lifecycle_start_stub ?captured:extra
      ~payload:(fun opts ->
        [ ("port", Js.Json.number (float_of_int port))
        ; ("revision", Js.Json.string "dev")
        ; ( "generation"
          , match field opts "generation" with
            | Some v -> v
            | None -> Js.Json.null )
        ; ("owner-source", Js.Json.string "electron")
        ])
      ()
  in
  let stops = ref [] in
  with_graphs_dir graphs_dir (fun () ->
      with_lifecycle_props
        [ ("startGraph", start_stub)
        ; ("observe", lifecycle_observe_stub ())
        ; ("snapshot", lifecycle_snapshot_stub Js.Json.null)
        ; ("stopGraph", lifecycle_stop_stub stops)
        ]
        (fun () ->
          promise_finally (run ~port)
            (fun [@u] () ->
               reset_manager_state ();
               Electron_db.reset_auto_backup ();
               Stub_http.close server (fun [@u] () -> ()))))

let () =
  Fest.Promise.test "backup-db-via-worker-uses-shared-layout-and-worker-snapshot"
    (fun () ->
      let graphs_dir = mk_tmp_dir "electron-db-worker-backup" in
      let db_name = "logseq_db_demo" in
      let invoke_calls = ref [] in
      let start_opts = ref [] in
      with_worker_stub ~graphs_dir invoke_calls ~extra:start_opts
        (fun ~port:_ ->
          let* result =
            Electron_db.backup_db_via_worker ~db_name ~window_id:7
              ~opts:(js_obj [ ("force-backup?", Js.Json.boolean true) ])
          in
          let backups =
            Graph_backup.list_backups ~graphs_dir ~repo:db_name
          in
          Fest.expect |> Fest.deep_equal result.created true;
          (match backups with
          | [ { Graph_backup.name; _ } ] -> (
              let final_db_path =
                Graph_backup.backup_db_path ~graphs_dir ~repo:db_name
                  ~backup_name:name
              in
              let metadata =
                read_edn_file
                  (Graph_backup.backup_metadata_path ~graphs_dir
                     ~repo:db_name ~backup_name:name)
              in
              Fest.expect
              |> Fest.deep_equal result.path (Some final_db_path);
              (* one ensure (startGraph) + one invoke, args
                 [db-name snapshot-path] *)
              Fest.expect
              |> Fest.deep_equal
                   (List.map
                      (fun o -> json_string o "repo")
                      (List.rev !start_opts))
                   [ Some db_name ];
              (match !invoke_calls with
              | [ (meth, args) ] -> (
                  Fest.expect
                  |> Fest.deep_equal meth "thread-api/backup-db-sqlite";
                  match wire_string_args args with
                  | [ repo; snapshot_path ] ->
                      Fest.expect |> Fest.deep_equal repo db_name;
                      Fest.expect
                      |> Fest.deep_equal
                           (not (String.equal final_db_path snapshot_path))
                           true;
                      Fest.expect
                      |> Fest.deep_equal
                           (read_file_utf8 final_db_path "utf8")
                           "worker-copy";
                      Fest.expect
                      |> Fest.deep_equal
                           (Clj_value.map_get metadata "source")
                           (Datascript.Keyword "electron-manual")
                  | _ -> Fest.expect |> Fest.ok false)
              | _ -> Fest.expect |> Fest.ok false))
          | _ -> Fest.expect |> Fest.ok false);
          (* window 7 was routed to this repo's key *)
          Fest.expect
          |> Fest.deep_equal
               (window_repo Electron_db_worker.manager_state 7)
               (Some (repo_key db_name));
          Js.Promise.resolve ()))

let () =
  Fest.Promise.test "automatic-worker-backup-throttles-recent-auto-backups"
    (fun () ->
      let graphs_dir = mk_tmp_dir "electron-db-worker-throttle" in
      let db_name = "logseq_db_demo" in
      let invoke_calls = ref [] in
      with_worker_stub ~graphs_dir invoke_calls (fun ~port:_ ->
          let* first =
            Electron_db.backup_db_via_worker ~db_name ~window_id:7
              ~opts:(js_obj [])
          in
          let* second =
            Electron_db.backup_db_via_worker ~db_name ~window_id:7
              ~opts:(js_obj [])
          in
          Fest.expect |> Fest.deep_equal first.created true;
          Fest.expect
          |> Fest.deep_equal second
               { Graph_backup.backup_name = None
               ; path = None
               ; created = false
               ; reason = Some "too-soon"
               };
          Fest.expect
          |> Fest.deep_equal (List.length !invoke_calls) 1;
          Js.Promise.resolve ()))

let () =
  Fest.Promise.test
    "automatic-worker-backup-retains-only-twelve-auto-backups" (fun () ->
      let graphs_dir = mk_tmp_dir "electron-db-worker-retention" in
      let db_name = "logseq_db_demo" in
      let invoke_calls = ref [] in
      for idx = 0 to 11 do
        ignore
          (write_backup ~graphs_dir ~repo:db_name
             ~backup_name:("auto-" ^ string_of_int idx)
             ~metadata:
               (backup_metadata ~source:(Some "electron-auto") ~repo:db_name
                  ~backup_name:("auto-" ^ string_of_int idx)
                  ~created_at_ms:(float_of_int idx)
                  ~db_path:
                    (Graph_backup.backup_db_path ~graphs_dir ~repo:db_name
                       ~backup_name:("auto-" ^ string_of_int idx)))
             ())
      done;
      ignore
        (write_backup ~graphs_dir ~repo:db_name ~backup_name:"manual-old"
           ~metadata:
             (backup_metadata ~source:(Some "electron-manual") ~repo:db_name
                ~backup_name:"manual-old" ~created_at_ms:0.
                ~db_path:
                  (Graph_backup.backup_db_path ~graphs_dir ~repo:db_name
                     ~backup_name:"manual-old"))
           ());
      ignore
        (write_backup ~graphs_dir ~repo:db_name ~backup_name:"cli-old"
           ~metadata:
             (backup_metadata ~source:(Some "cli") ~repo:db_name
                ~backup_name:"cli-old" ~created_at_ms:0.
                ~db_path:
                  (Graph_backup.backup_db_path ~graphs_dir ~repo:db_name
                     ~backup_name:"cli-old"))
           ());
      with_worker_stub ~graphs_dir invoke_calls (fun ~port:_ ->
          let* result =
            Electron_db.backup_db_via_worker ~db_name ~window_id:7
              ~opts:(js_obj [])
          in
          let backup_names =
            List.map
              (fun (e : Graph_backup.list_entry) -> e.name)
              (Graph_backup.list_backups ~graphs_dir ~repo:db_name)
          in
          Fest.expect |> Fest.deep_equal result.created true;
          Fest.expect
          |> Fest.deep_equal (List.mem "auto-0" backup_names) false;
          Fest.expect
          |> Fest.deep_equal (List.mem "manual-old" backup_names) true;
          Fest.expect |> Fest.deep_equal (List.mem "cli-old" backup_names) true;
          Fest.expect |> Fest.deep_equal (List.length backup_names) 14;
          Js.Promise.resolve ()))

let () =
  Fest.Promise.test
    "export-db-via-worker-writes-directly-to-destination-file" (fun () ->
      let graphs_dir = mk_tmp_dir "electron-db-export-direct" in
      let export_dir = mk_tmp_dir "electron-db-export-direct-dst" in
      let db_name = "logseq_db_demo" in
      let dst_path = Node.Path.join [| export_dir; "export.sqlite" |] in
      let invoke_calls = ref [] in
      with_worker_stub ~graphs_dir invoke_calls ~snapshot_content:"sqlite-copy"
        (fun ~port:_ ->
          let* result =
            Electron_db.export_db_via_worker ~db_name ~window_id:7
              ~dst_path
          in
          Fest.expect
          |> Fest.deep_equal (Clj_value.map_get_str result "path")
               (Some dst_path);
          Fest.expect
          |> Fest.deep_equal (read_file_utf8 dst_path "utf8") "sqlite-copy";
          (match !invoke_calls with
          | [ (meth, args) ] ->
              Fest.expect
              |> Fest.deep_equal meth "thread-api/backup-db-sqlite";
              Fest.expect
              |> Fest.deep_equal (wire_string_args args) [ db_name; dst_path ]
          | _ -> Fest.expect |> Fest.ok false);
          Js.Promise.resolve ()))

let () =
  Fest.Promise.test
    "export-db-to-export-dir-via-worker-writes-under-graph-export-dir"
    (fun () ->
      let graphs_dir = mk_tmp_dir "electron-db-export-dir" in
      let db_name = "logseq_db_demo" in
      let invoke_calls = ref [] in
      with_worker_stub ~graphs_dir invoke_calls (fun ~port:_ ->
          let* result =
            Electron_db.export_db_to_export_dir_via_worker ~db_name
              ~window_id:7 ~filename:"../export.sqlite"
          in
          let expected_path =
            Node.Path.join
              [| graphs_dir; "demo"; "export"; "export.sqlite" |]
          in
          Fest.expect
          |> Fest.deep_equal (Clj_value.map_get_str result "path")
               (Some expected_path);
          (match !invoke_calls with
          | [ (meth, args) ] ->
              Fest.expect
              |> Fest.deep_equal meth "thread-api/backup-db-sqlite";
              Fest.expect
              |> Fest.deep_equal (wire_string_args args)
                   [ db_name; expected_path ]
          | _ -> Fest.expect |> Fest.ok false);
          Js.Promise.resolve ()))

let () =
  Fest.Promise.test "auto-backup-tracker-runs-hourly-for-active-repos"
    (fun () ->
      let graphs_dir = mk_tmp_dir "electron-db-auto-backup" in
      let db_name = "logseq_db_demo" in
      let invoke_calls = ref [] in
      let set_interval_calls = ref [] in
      let clear_interval_calls = ref [] in
      let timer_id = js_obj [ ("id", Js.Json.number 1.) ] in
      let original_set = get_index global_scope "setInterval" in
      let original_clear = get_index global_scope "clearInterval" in
      with_worker_stub ~graphs_dir invoke_calls (fun ~port:_ ->
          (* cljs (set! js/setInterval ...) — Timers.set_interval is
             Js.Global.setInterval -> the globalThis property *)
          set_index global_scope "setInterval"
            (fun [@u] (f : unit -> unit) (ms : int) ->
              set_interval_calls := (f, ms) :: !set_interval_calls;
              timer_id);
          set_index global_scope "clearInterval"
            (fun [@u] (id : Js.Json.t) ->
              clear_interval_calls := id :: !clear_interval_calls);
          Electron_db.sync_auto_backup_repo 1 (Some "logseq_db_demo");
          Electron_db.sync_auto_backup_repo 2 (Some "logseq_db_demo");
          (* fire the captured interval callback, then wait for the
             invoke to land *)
          (match !set_interval_calls with
          | (f, _) :: _ -> f ()
          | [] -> Fest.expect |> Fest.ok false);
          let* () = wait_until (fun () -> !invoke_calls <> []) in
          Electron_db.sync_auto_backup_repo 1 None;
          Electron_db.sync_auto_backup_repo 2 None;
          Fest.expect
          |> Fest.deep_equal (List.length !set_interval_calls) 1;
          Fest.expect
          |> Fest.deep_equal
               (List.map (fun id -> id == timer_id) !clear_interval_calls)
               [ true ];
          Fest.expect
          |> Fest.deep_equal
               (List.map snd !set_interval_calls)
               [ 3600000 ];
          (match !invoke_calls with
          | [ (meth, args) ] ->
              Fest.expect
              |> Fest.deep_equal meth "thread-api/backup-db-sqlite";
              Fest.expect
              |> Fest.deep_equal
                   (match args with
                   | Wire.String repo :: _ -> repo
                   | _ -> "")
                   db_name
          | _ -> Fest.expect |> Fest.ok false);
          set_index global_scope "setInterval" original_set;
          set_index global_scope "clearInterval" original_clear;
          Js.Promise.resolve ()))

(* ---------- electron.db-worker-manager-test -> Electron_db_worker ------ *)

module Mgr = Electron_db_worker

let mgr_runtime ?generation ?close_observer ?owned repo =
  fake_runtime ?generation ?close_observer ?owned repo

let () =
  Fest.Promise.test "ensure-started-is-idempotent-for-same-window"
    (fun () ->
      let start_calls = ref [] in
      let mgr =
        Mgr.create_manager
          ~start_daemon:(fun repo _opts ->
            start_calls := repo :: !start_calls;
            Js.Promise.resolve (mgr_runtime repo))
          ~stop_daemon:(fun _ -> Js.Promise.resolve true)
          ()
      in
      let* a = Mgr.start_manager mgr "graph-a" 1 None in
      let* b = Mgr.start_manager mgr "graph-a" 1 None in
      Fest.expect |> Fest.deep_equal (List.length !start_calls) 1;
      Fest.expect |> Fest.deep_equal (a == b) true;
      Js.Promise.resolve ())

let () =
  Fest.Promise.test "ensure-started-reuses-daemon-across-windows" (fun () ->
      let start_calls = ref [] in
      let mgr =
        Mgr.create_manager
          ~start_daemon:(fun repo _opts ->
            start_calls := repo :: !start_calls;
            Js.Promise.resolve (mgr_runtime repo))
          ~stop_daemon:(fun _ -> Js.Promise.resolve true)
          ()
      in
      let* _ = Mgr.start_manager mgr "graph-a" 1 None in
      let* _ = Mgr.start_manager mgr "graph-a" 2 None in
      Fest.expect |> Fest.deep_equal (List.rev !start_calls) [ "graph-a" ];
      Js.Promise.resolve ())

let () =
  Fest.Promise.test "ensure-started-reuses-prefix-equivalent-runtime"
    (fun () ->
      let start_calls = ref [] in
      let stop_calls = ref [] in
      let mgr =
        Mgr.create_manager
          ~start_daemon:(fun repo _opts ->
            start_calls := repo :: !start_calls;
            Js.Promise.resolve (mgr_runtime repo))
          ~stop_daemon:(fun rt ->
            stop_calls := rt.Mgr.repo :: !stop_calls;
            Js.Promise.resolve true)
          ()
      in
      let* first_runtime = Mgr.start_manager mgr "demo" 1 None in
      let* second_runtime =
        Mgr.start_manager mgr "logseq_db_demo" 1 None
      in
      Fest.expect |> Fest.deep_equal (first_runtime == second_runtime) true;
      Fest.expect |> Fest.deep_equal (List.rev !start_calls) [ "demo" ];
      Fest.expect |> Fest.deep_equal !stop_calls [];
      Fest.expect
      |> Fest.deep_equal (window_repo mgr.state 1) (Some "demo");
      Fest.expect |> Fest.deep_equal (repo_windows mgr.state "demo") [ 1 ];
      Js.Promise.resolve ())

let () =
  Fest.Promise.test
    "ensure-started-switches-window-repo-and-stops-previous-daemon"
    (fun () ->
      let start_calls = ref [] in
      let stop_calls = ref [] in
      let mgr =
        Mgr.create_manager
          ~start_daemon:(fun repo _opts ->
            start_calls := repo :: !start_calls;
            Js.Promise.resolve (mgr_runtime repo))
          ~stop_daemon:(fun rt ->
            stop_calls := rt.Mgr.repo :: !stop_calls;
            Js.Promise.resolve true)
          ()
      in
      let* _ = Mgr.start_manager mgr "graph-a" 1 None in
      let* _ = Mgr.start_manager mgr "graph-b" 1 None in
      Fest.expect
      |> Fest.deep_equal (List.rev !start_calls) [ "graph-a"; "graph-b" ];
      Fest.expect |> Fest.deep_equal (List.rev !stop_calls) [ "graph-a" ];
      Js.Promise.resolve ())

let () =
  Fest.Promise.test "ensure-stopped-stops-only-on-last-window" (fun () ->
      let stop_calls = ref [] in
      let mgr =
        Mgr.create_manager
          ~start_daemon:(fun repo _opts ->
            Js.Promise.resolve (mgr_runtime repo))
          ~stop_daemon:(fun rt ->
            stop_calls := rt.Mgr.repo :: !stop_calls;
            Js.Promise.resolve true)
          ()
      in
      let* _ = Mgr.start_manager mgr "graph-a" 1 None in
      let* _ = Mgr.start_manager mgr "graph-a" 2 None in
      let* _ = Mgr.ensure_stopped mgr "graph-a" 1 in
      Fest.expect |> Fest.deep_equal !stop_calls [];
      let* _ = Mgr.ensure_stopped mgr "graph-a" 2 in
      Fest.expect |> Fest.deep_equal (List.rev !stop_calls) [ "graph-a" ];
      Js.Promise.resolve ())

let () =
  Fest.Promise.test
    "release-runtime-detaches-only-requested-window-repo-association"
    (fun () ->
      let stop_calls = ref [] in
      let mgr =
        Mgr.create_manager
          ~start_daemon:(fun repo _opts ->
            Js.Promise.resolve (mgr_runtime repo))
          ~stop_daemon:(fun rt ->
            stop_calls := rt.Mgr.repo :: !stop_calls;
            Js.Promise.resolve true)
          ()
      in
      let* _ = Mgr.start_manager mgr "graph-a" 1 None in
      let* _ = Mgr.start_manager mgr "graph-a" 2 None in
      let* _ = Mgr.release_running "graph-a" 1 ~mgr () in
      Fest.expect |> Fest.deep_equal !stop_calls [];
      Fest.expect |> Fest.deep_equal (window_repo mgr.state 1) None;
      Fest.expect
      |> Fest.deep_equal (window_repo mgr.state 2) (Some "graph-a");
      Fest.expect
      |> Fest.deep_equal (repo_windows mgr.state "graph-a") [ 2 ];
      Js.Promise.resolve ())

let () =
  Fest.Promise.test
    "ensure-stopped-stale-repo-does-not-clear-new-window-mapping" (fun () ->
      let stop_calls = ref [] in
      let mgr =
        Mgr.create_manager
          ~start_daemon:(fun repo _opts ->
            Js.Promise.resolve (mgr_runtime repo))
          ~stop_daemon:(fun rt ->
            stop_calls := rt.Mgr.repo :: !stop_calls;
            Js.Promise.resolve true)
          ()
      in
      let* _ = Mgr.start_manager mgr "graph-a" 1 None in
      let* _ = Mgr.start_manager mgr "graph-a" 2 None in
      let* _ = Mgr.start_manager mgr "graph-b" 1 None in
      (* simulate late/stale release for the previous repo after window-1
         already moved to graph-b *)
      let* _ = Mgr.ensure_stopped mgr "graph-a" 1 in
      Fest.expect
      |> Fest.deep_equal (window_repo mgr.state 1) (Some "graph-b");
      Fest.expect
      |> Fest.deep_equal (repo_windows mgr.state "graph-a") [ 2 ];
      Fest.expect
      |> Fest.deep_equal (repo_windows mgr.state "graph-b") [ 1 ];
      Fest.expect |> Fest.deep_equal !stop_calls [];
      Js.Promise.resolve ())

let () =
  Fest.Promise.test
    "ensure-stopped-stale-intermediate-repo-after-switch-back-keeps-current-repo"
    (fun () ->
      let stop_calls = ref [] in
      let mgr =
        Mgr.create_manager
          ~start_daemon:(fun repo _opts ->
            Js.Promise.resolve (mgr_runtime repo))
          ~stop_daemon:(fun rt ->
            stop_calls := rt.Mgr.repo :: !stop_calls;
            Js.Promise.resolve true)
          ()
      in
      let* _ = Mgr.start_manager mgr "graph-a" 1 None in
      let* _ = Mgr.start_manager mgr "graph-b" 1 None in
      let* _ = Mgr.start_manager mgr "graph-a" 1 None in
      (* stale cleanup for graph-b arrives after the window is already
         back on graph-a *)
      let* _ = Mgr.ensure_stopped mgr "graph-b" 1 in
      Fest.expect
      |> Fest.deep_equal (window_repo mgr.state 1) (Some "graph-a");
      Fest.expect
      |> Fest.deep_equal (repo_windows mgr.state "graph-a") [ 1 ];
      Fest.expect
      |> Fest.deep_equal (repo_entry mgr.state "graph-b") None;
      Fest.expect
      |> Fest.deep_equal (List.rev !stop_calls) [ "graph-a"; "graph-b" ];
      Js.Promise.resolve ())

let () =
  Fest.Promise.test
    "ensure-window-stopped-releases-active-runtime-by-window" (fun () ->
      let stop_calls = ref [] in
      let mgr =
        Mgr.create_manager
          ~start_daemon:(fun repo _opts ->
            Js.Promise.resolve (mgr_runtime repo))
          ~stop_daemon:(fun rt ->
            stop_calls := rt.Mgr.repo :: !stop_calls;
            Js.Promise.resolve true)
          ()
      in
      let* _ = Mgr.start_manager mgr "graph-a" 1 None in
      let* _ = Mgr.start_manager mgr "graph-a" 2 None in
      let* _ = Mgr.ensure_window_stopped mgr 1 in
      Fest.expect |> Fest.deep_equal !stop_calls [];
      let* _ = Mgr.ensure_window_stopped mgr 2 in
      Fest.expect |> Fest.deep_equal (List.rev !stop_calls) [ "graph-a" ];
      Js.Promise.resolve ())

let () =
  Fest.Promise.test "stop-all-stops-every-active-graph" (fun () ->
      let stop_calls = ref [] in
      let mgr =
        Mgr.create_manager
          ~start_daemon:(fun repo _opts ->
            Js.Promise.resolve (mgr_runtime repo))
          ~stop_daemon:(fun rt ->
            stop_calls := rt.Mgr.repo :: !stop_calls;
            Js.Promise.resolve true)
          ()
      in
      let* _ = Mgr.start_manager mgr "graph-a" 1 None in
      let* _ = Mgr.start_manager mgr "graph-b" 2 None in
      let* _ = Mgr.stop_all mgr in
      Fest.expect
      |> Fest.deep_equal
           (List.sort compare !stop_calls)
           [ "graph-a"; "graph-b" ];
      Js.Promise.resolve ())

let () =
  Fest.Promise.test "stop-all-skips-external-runtimes" (fun () ->
      let stop_calls = ref [] in
      let mgr =
        Mgr.create_manager
          ~start_daemon:(fun repo _opts ->
            Js.Promise.resolve
              (mgr_runtime repo
                 ?owned:(Some (not (String.equal repo "graph-b")))))
          ~stop_daemon:(fun rt ->
            stop_calls := rt.Mgr.repo :: !stop_calls;
            Js.Promise.resolve true)
          ()
      in
      let* _ = Mgr.start_manager mgr "graph-a" 1 None in
      let* _ = Mgr.start_manager mgr "graph-b" 2 None in
      let* _ = Mgr.stop_all mgr in
      Fest.expect |> Fest.deep_equal (List.rev !stop_calls) [ "graph-a" ];
      Js.Promise.resolve ())

let () =
  Fest.Promise.test "ensure-started-restarts-unhealthy-cached-runtime"
    (fun () ->
      let start_count = ref 0 in
      let stop_calls = ref [] in
      let mgr =
        Mgr.create_manager
          ~start_daemon:(fun repo _opts ->
            incr start_count;
            Js.Promise.resolve
              { (mgr_runtime repo) with
                Mgr.base_url =
                  Some
                    ("http://127.0.0.1:910"
                    ^ string_of_int !start_count)
              ; auth_token = Js.Json.string ("token-" ^ string_of_int !start_count)
              })
          ~stop_daemon:(fun rt ->
            stop_calls := rt.Mgr.base_url :: !stop_calls;
            Js.Promise.resolve true)
          ~runtime_ready:(fun rt ->
            Js.Promise.resolve
              (not
                 (Option.equal String.equal rt.Mgr.base_url
                    (Some "http://127.0.0.1:9101"))))
          ()
      in
      let* rt1 = Mgr.start_manager mgr "graph-a" 1 None in
      let* rt2 = Mgr.start_manager mgr "graph-a" 1 None in
      Fest.expect
      |> Fest.deep_equal rt1.Mgr.base_url (Some "http://127.0.0.1:9101");
      Fest.expect
      |> Fest.deep_equal rt2.Mgr.base_url (Some "http://127.0.0.1:9102");
      Fest.expect |> Fest.deep_equal !start_count 2;
      Fest.expect
      |> Fest.deep_equal (List.rev !stop_calls)
           [ Some "http://127.0.0.1:9101" ];
      Js.Promise.resolve ())

let () =
  Fest.Promise.test "ensure-window-stopped-does-not-stop-external-runtime"
    (fun () ->
      let stop_calls = ref [] in
      let mgr =
        Mgr.create_manager
          ~start_daemon:(fun repo _opts ->
            Js.Promise.resolve (mgr_runtime repo ?owned:(Some false)))
          ~stop_daemon:(fun rt ->
            stop_calls := rt.Mgr.repo :: !stop_calls;
            Js.Promise.resolve true)
          ()
      in
      let* _ = Mgr.start_manager mgr "graph-a" 1 None in
      let* _ = Mgr.ensure_window_stopped mgr 1 in
      Fest.expect |> Fest.deep_equal !stop_calls [];
      Js.Promise.resolve ())

let () =
  Fest.Promise.test
    "ensure-repo-stopped-detaches-all-windows-and-stops-runtime-once"
    (fun () ->
      let stop_calls = ref [] in
      let mgr =
        Mgr.create_manager
          ~start_daemon:(fun repo _opts ->
            Js.Promise.resolve (mgr_runtime repo))
          ~stop_daemon:(fun rt ->
            stop_calls := rt.Mgr.repo :: !stop_calls;
            Js.Promise.resolve true)
          ()
      in
      let* _ = Mgr.start_manager mgr "graph-a" 1 None in
      let* _ = Mgr.start_manager mgr "graph-a" 2 None in
      let* _ = Mgr.ensure_repo_stopped mgr "graph-a" in
      Fest.expect |> Fest.deep_equal (List.rev !stop_calls) [ "graph-a" ];
      Fest.expect
      |> Fest.deep_equal (repo_entry mgr.state "graph-a") None;
      Fest.expect |> Fest.deep_equal (window_repo mgr.state 1) None;
      Fest.expect |> Fest.deep_equal (window_repo mgr.state 2) None;
      Js.Promise.resolve ())

let () =
  Fest.Promise.test "ensure-repo-stopped-skips-stop-for-external-runtime"
    (fun () ->
      let stop_calls = ref [] in
      let mgr =
        Mgr.create_manager
          ~start_daemon:(fun repo _opts ->
            Js.Promise.resolve (mgr_runtime repo ?owned:(Some false)))
          ~stop_daemon:(fun rt ->
            stop_calls := rt.Mgr.repo :: !stop_calls;
            Js.Promise.resolve true)
          ()
      in
      let* _ = Mgr.start_manager mgr "graph-a" 1 None in
      let* _ = Mgr.ensure_repo_stopped mgr "graph-a" in
      Fest.expect |> Fest.deep_equal !stop_calls [];
      Fest.expect
      |> Fest.deep_equal (repo_entry mgr.state "graph-a") None;
      Fest.expect |> Fest.deep_equal (window_repo mgr.state 1) None;
      Js.Promise.resolve ())

let () =
  Fest.Promise.test
    "managed-daemon-start-uses-cli-shared-server-path-with-electron-owner"
    (fun () ->
      (* cljs captured the cli-server/ensure-server! call directly via
         with-redefs; there is no such seam in OCaml, so we observe the
         equivalent on the Lifecycle.startGraph options (owner,
         generation, repo) and on the produced runtime.
         (`:server-list-file nil` has no OCaml analog — dropped.) *)
      let captured = ref [] in
      let graphs_dir = mk_tmp_dir "managed-daemon-graphs" in
      with_graphs_dir graphs_dir (fun () ->
      with_lifecycle_props
        [ ( "startGraph"
          , lifecycle_start_stub ~captured
              ~payload:(fun _opts ->
                [ ("port", Js.Json.number 9300.)
                ; ("revision", Js.Json.string "dev")
                ; ("generation", Js.Json.string "request-generation")
                ; ("owner-source", Js.Json.string "electron")
                ])
              () )
        ; ("observe", lifecycle_observe_stub ())
        ]
        (fun () ->
          let* runtime_info =
            Mgr.start_managed_daemon "graph-a"
              (js_obj [ ("generation", Js.Json.string "request-generation") ])
          in
          (match !captured with
          | [ opts ] ->
              Fest.expect
              |> Fest.deep_equal (json_string opts "repo") (Some "graph-a");
              Fest.expect
              |> Fest.deep_equal (json_string opts "owner") (Some "electron");
              Fest.expect
              |> Fest.deep_equal (json_string opts "generation")
                   (Some "request-generation")
          | _ -> Fest.expect |> Fest.ok false);
          Fest.expect
          |> Fest.deep_equal runtime_info.Mgr.base_url
               (Some "http://127.0.0.1:9300");
          Fest.expect
          |> Fest.deep_equal runtime_info.Mgr.owned (Some true);
          reset_manager_state ();
          Js.Promise.resolve ())))

let () =
  Fest.Promise.test "failed-repo-stop-retains-manager-record" (fun () ->
      let mgr =
        Mgr.create_manager
          ~start_daemon:(fun repo _opts ->
            Js.Promise.resolve (mgr_runtime repo))
          ~stop_daemon:(fun _ -> Js.Promise.resolve false)
          ()
      in
      let* _ = Mgr.start_manager mgr "demo" 1 None in
      let* error =
        expect_rejection (Mgr.ensure_repo_stopped mgr "demo")
      in
      (* a false stop result must reject *)
      Fest.expect
      |> Fest.deep_equal (exn_code error) (Some "server-stop-failed");
      Fest.expect
      |> Fest.deep_equal (repo_entry mgr.state "demo" <> None) true;
      Js.Promise.resolve ())

let () =
  Fest.Promise.test "deletion-invalidates-pending-window-start" (fun () ->
      let pending, resolve_pending = deferred () in
      let mgr =
        Mgr.create_manager
          ~start_daemon:(fun _repo _opts -> pending)
          ~stop_daemon:(fun _ -> Js.Promise.resolve true)
          ()
      in
      let started = Mgr.start_manager mgr "demo" 1 None in
      Mgr.invalidate_repo mgr.state "demo";
      resolve_pending (mgr_runtime "demo");
      let* error = expect_rejection started in
      (* a deleted session must not attach *)
      Fest.expect
      |> Fest.deep_equal (exn_code error) (Some "graph-not-exists");
      Fest.expect
      |> Fest.deep_equal (repos_keys mgr.state) [];
      Fest.expect
      |> Fest.deep_equal (Hashtbl.length mgr.state.window_repo) 0;
      Js.Promise.resolve ())

let () =
  Fest.Promise.test "cached-runtime-rejects-a-removed-generation" (fun () ->
      (* daemon/ready? is not reached on the generation-mismatch path,
         so only lifecycle/snapshot needs stubbing *)
      with_lifecycle_props
        [ ( "snapshot"
          , lifecycle_snapshot_stub
              (js_obj
                 [ ("generation", Js.Json.string "new")
                 ; ("phase", Js.Json.string "available")
                 ]) )
        ]
        (fun () ->
          let* result =
            Mgr.runtime_ready_default
              { (mgr_runtime "demo") with
                Mgr.root_dir = "/unused"
              ; generation = Some "old"
              ; base_url = Some "http://127.0.0.1:1"
              }
          in
          Fest.expect |> Fest.deep_equal result false;
          Js.Promise.resolve ()))

let () =
  Fest.Promise.test "cached-runtime-rejects-requested-old-generation"
    (fun () ->
      let mgr =
        Mgr.create_manager
          ~start_daemon:(fun repo _opts ->
            Js.Promise.resolve
              (mgr_runtime repo ~generation:"new"))
          ~stop_daemon:(fun _ -> Js.Promise.resolve true)
          ()
      in
      let* _ = Mgr.start_manager mgr "demo" 1 None in
      let* error =
        expect_rejection
          (Mgr.start_manager mgr "demo" 2
             (Some
                (js_obj [ ("generation", Js.Json.string "old") ])))
      in
      (* old generation must be rejected *)
      Fest.expect
      |> Fest.deep_equal (exn_code error) (Some "graph-not-exists");
      Fest.expect |> Fest.deep_equal (window_repo mgr.state 2) None;
      Js.Promise.resolve ())

(* cljs `concurrent-window-release-stops-real-worker-and-reopens`
   (^:long): needs the built static/db-worker-node.js daemon bundle —
   no compiled artifact exists in a source checkout, so it is skipped. *)

let () =
  Fest.Promise.test "concurrent-window-release-stops-last-worker-once"
    (fun () ->
      let stops = ref 0 in
      let mgr =
        Mgr.create_manager
          ~start_daemon:(fun repo _opts ->
            Js.Promise.resolve (mgr_runtime repo))
          ~stop_daemon:(fun _ ->
            incr stops;
            Js.Promise.resolve true)
          ()
      in
      let* _ = Mgr.start_manager mgr "demo" 1 None in
      let* _ = Mgr.start_manager mgr "demo" 2 None in
      let* _ =
        Js.Promise.all
          [| Mgr.ensure_window_stopped mgr 1; Mgr.ensure_window_stopped mgr 2 |]
      in
      Fest.expect |> Fest.deep_equal !stops 1;
      Fest.expect |> Fest.deep_equal (repos_keys mgr.state) [];
      Js.Promise.resolve ())

let () =
  Fest.Promise.test
    "opening-during-last-window-stop-waits-for-a-new-runtime" (fun () ->
      let stopping, resolve_stopping = deferred () in
      let started_stop, resolve_started_stop = deferred () in
      let starts = ref 0 in
      let mgr =
        Mgr.create_manager
          ~start_daemon:(fun repo _opts ->
            incr starts;
            Js.Promise.resolve
              (mgr_runtime repo
                 ~generation:(string_of_int !starts)))
          ~stop_daemon:(fun _ ->
            resolve_started_stop ();
            stopping)
          ()
      in
      let* _ = Mgr.start_manager mgr "demo" 1 None in
      let closing = Mgr.ensure_window_stopped mgr 1 in
      let* () = started_stop in
      let opening = Mgr.start_manager mgr "demo" 2 None in
      resolve_stopping true;
      let* _ = closing in
      let* result = opening in
      Fest.expect |> Fest.deep_equal result.Mgr.generation (Some "2");
      Fest.expect |> Fest.deep_equal (repo_windows mgr.state "demo") [ 2 ];
      Js.Promise.resolve ())

let () =
  Fest.Promise.test "duplicate-window-release-shares-the-last-stop"
    (fun () ->
      let stopping, resolve_stopping = deferred () in
      let stops = ref 0 in
      let mgr =
        Mgr.create_manager
          ~start_daemon:(fun repo _opts ->
            Js.Promise.resolve (mgr_runtime repo))
          ~stop_daemon:(fun _ ->
            incr stops;
            stopping)
          ()
      in
      let* _ = Mgr.start_manager mgr "demo" 1 None in
      let first_close = Mgr.ensure_stopped mgr "demo" 1 in
      let second_close = Mgr.ensure_stopped mgr "demo" 1 in
      resolve_stopping true;
      let* _ = Js.Promise.all [| first_close; second_close |] in
      Fest.expect |> Fest.deep_equal !stops 1;
      Js.Promise.resolve ())

let () =
  Fest.Promise.test "failed-last-window-stop-retains-runtime-for-retry"
    (fun () ->
      let stops = ref 0 in
      let mgr =
        Mgr.create_manager
          ~start_daemon:(fun repo _opts ->
            Js.Promise.resolve (mgr_runtime repo))
          ~stop_daemon:(fun _ ->
            incr stops;
            Js.Promise.resolve (!stops > 1))
          ()
      in
      let* _ = Mgr.start_manager mgr "demo" 1 None in
      let* error =
        expect_rejection (Mgr.ensure_window_stopped mgr 1)
      in
      (* false stop must fail; the runtime is retained for retry *)
      Fest.expect
      |> Fest.deep_equal (exn_code error) (Some "server-stop-failed");
      Fest.expect
      |> Fest.deep_equal
           (match repo_entry mgr.state "demo" with
           | Some { Mgr.runtime = Some _; _ } -> true
           | _ -> false)
           true;
      let* _ = Mgr.ensure_repo_stopped mgr "demo" in
      Fest.expect |> Fest.deep_equal !stops 2;
      Fest.expect |> Fest.deep_equal (repos_keys mgr.state) [];
      Js.Promise.resolve ())

let () =
  Fest.Promise.test
    "concurrent-starts-retain-options-while-switching-graphs" (fun () ->
      let stopping, resolve_stopping = deferred () in
      let entered, resolve_entered = deferred () in
      let starts = ref [] in
      let mgr =
        Mgr.create_manager
          ~start_daemon:(fun repo opts ->
            starts := (repo, opts) :: !starts;
            Js.Promise.resolve
              (mgr_runtime repo
                 ?generation:(json_string opts "generation")))
          ~stop_daemon:(fun _ ->
            resolve_entered ();
            stopping)
          ()
      in
      let* _ =
        Mgr.start_manager mgr "old" 1
          (Some (js_obj [ ("generation", Js.Json.string "old") ]))
      in
      let a =
        Mgr.start_manager mgr "a" 1
          (Some
             (js_obj
                [ ("generation", Js.Json.string "a")
                ; ("root-dir", Js.Json.string "/a")
                ]))
      in
      let* () = entered in
      let b =
        Mgr.start_manager mgr "b" 2
          (Some
             (js_obj
                [ ("generation", Js.Json.string "b")
                ; ("root-dir", Js.Json.string "/b")
                ]))
      in
      resolve_stopping true;
      let* result_a = a in
      let* result_b = b in
      Fest.expect
      |> Fest.deep_equal
           [ result_a.Mgr.generation; result_b.Mgr.generation ]
           [ Some "a"; Some "b" ];
      let seen =
        List.sort compare
          (List.map
             (fun (repo, opts) ->
               repo
               , Option.value (json_string opts "generation") ~default:""
               , Option.value (json_string opts "root-dir") ~default:"" )
             (List.tl (List.rev !starts)))
      in
      Fest.expect
      |> Fest.deep_equal seen [ ("a", "a", "/a"); ("b", "b", "/b") ];
      Js.Promise.resolve ())

let () =
  Fest.Promise.test
    "recovery-and-stop-all-retire-owned-and-external-observers" (fun () ->
      let active = ref [] in
      let serial = ref 0 in
      let mgr =
        Mgr.create_manager
          ~start_daemon:(fun repo _opts ->
            incr serial;
            let id = !serial in
            active := id :: !active;
            Js.Promise.resolve
              (mgr_runtime repo
                 ?owned:(Some (String.equal repo "owned"))
                 ?close_observer:(Some
                   (fun () ->
                        active := List.filter (fun i -> i <> id) !active))))
          ~runtime_ready:(fun _ -> Js.Promise.resolve false)
          ~stop_daemon:(fun _ -> Js.Promise.resolve true)
          ()
      in
      let* _ = Mgr.start_manager mgr "owned" 1 None in
      let* _ = Mgr.start_manager mgr "owned" 1 None in
      let* _ = Mgr.start_manager mgr "owned" 1 None in
      Fest.expect |> Fest.deep_equal !active [ 3 ];
      let* _ = Mgr.start_manager mgr "external" 2 None in
      let* _ = Mgr.start_manager mgr "external" 2 None in
      Fest.expect
      |> Fest.deep_equal (List.sort compare !active) [ 3; 5 ];
      let* _ = Mgr.stop_all mgr in
      Fest.expect |> Fest.deep_equal !active [];
      Js.Promise.resolve ())

let () =
  Fest.Promise.test "failed-recovery-retires-the-old-observer" (fun () ->
      let closed = ref false in
      let starts = ref 0 in
      let mgr =
        Mgr.create_manager
          ~start_daemon:(fun repo _opts ->
            incr starts;
            if !starts = 1 then
              Js.Promise.resolve
                (mgr_runtime repo
                   ?close_observer:(Some (fun () -> closed := true)))
            else
              js_reject "Startup failed")
          ~runtime_ready:(fun _ -> Js.Promise.resolve false)
          ~stop_daemon:(fun _ -> Js.Promise.resolve true)
          ()
      in
      let* _ = Mgr.start_manager mgr "demo" 1 None in
      let* error =
        expect_rejection (Mgr.start_manager mgr "demo" 1 None)
      in
      (* recovery should fail *)
      Fest.expect
      |> Fest.deep_equal (exn_message error) "Startup failed";
      Fest.expect |> Fest.deep_equal !closed true;
      Js.Promise.resolve ())

let () =
  Fest.Promise.test
    "invalidated-recovery-closes-only-its-uninstalled-observer" (fun () ->
      let active = ref [] in
      let pending, resolve_pending = deferred () in
      let entered, resolve_entered = deferred () in
      let starts = ref 0 in
      let make_runtime repo id =
        active := id :: !active;
        { (mgr_runtime repo) with
          Mgr.close_observer =
            Some (fun () -> active := List.filter (fun i -> i <> id) !active)
        ; auth_token = Js.Json.number (float_of_int id)
        }
      in
      (* cljs tracks the runtime's :id; our record has no such field —
         use auth_token to carry it. *)
      let runtime_id (r : Mgr.runtime) : int =
        match Js.Json.decodeNumber r.auth_token with
        | Some f -> int_of_float f
        | None -> -1
      in
      let mgr =
        Mgr.create_manager
          ~start_daemon:(fun repo _opts ->
            incr starts;
            match !starts with
            | 1 -> Js.Promise.resolve (make_runtime repo 1)
            | 2 ->
                resolve_entered ();
                pending
            | _ -> Js.Promise.resolve (make_runtime repo 3))
          ~runtime_ready:(fun _ -> Js.Promise.resolve false)
          ~stop_daemon:(fun _ -> Js.Promise.resolve true)
          ()
      in
      let* _ = Mgr.start_manager mgr "demo" 1 None in
      let recovering =
        expect_rejection (Mgr.start_manager mgr "demo" 1 None)
      in
      let* () = entered in
      Mgr.invalidate_repo mgr.state "demo";
      let* _ = Mgr.start_manager mgr "demo" 2 None in
      resolve_pending (make_runtime "demo" 2);
      let* error = recovering in
      (* invalidated recovery must fail *)
      Fest.expect
      |> Fest.deep_equal (exn_code error) (Some "graph-not-exists");
      Fest.expect |> Fest.deep_equal !active [ 3 ];
      Fest.expect
      |> Fest.deep_equal
           (match repo_entry mgr.state "demo" with
           | Some { Mgr.runtime = Some r; _ } -> runtime_id r
           | _ -> -1)
           3;
      Js.Promise.resolve ())

let () =
  Fest.Promise.test "invalidated-initial-start-retires-its-observer"
    (fun () ->
      let closed = ref false in
      let pending, resolve_pending = deferred () in
      let entered, resolve_entered = deferred () in
      let mgr =
        Mgr.create_manager
          ~start_daemon:(fun _repo _opts ->
            resolve_entered ();
            pending)
          ~stop_daemon:(fun _ -> Js.Promise.resolve true)
          ()
      in
      let starting =
        expect_rejection (Mgr.start_manager mgr "demo" 1 None)
      in
      let* () = entered in
      Mgr.invalidate_repo mgr.state "demo";
      resolve_pending
        (mgr_runtime "demo" ?close_observer:(Some (fun () -> closed := true)));
      let* error = starting in
      (* invalidated start must fail *)
      Fest.expect
      |> Fest.deep_equal (exn_code error) (Some "graph-not-exists");
      Fest.expect |> Fest.deep_equal !closed true;
      Fest.expect |> Fest.deep_equal (repos_keys mgr.state) [];
      Js.Promise.resolve ())

let () =
  Fest.Promise.test
    "stop-all-preserves-failed-runtime-and-closes-successful-observers"
    (fun () ->
      let active = ref [] in
      let mgr =
        Mgr.create_manager
          ~start_daemon:(fun repo _opts ->
            active := repo :: !active;
            Js.Promise.resolve
              (mgr_runtime repo
                 ?close_observer:(Some
                   (fun () ->
                        active :=
                          List.filter
                            (fun r -> not (String.equal r repo))
                            !active))))
          ~stop_daemon:(fun rt ->
            Js.Promise.resolve (String.equal rt.Mgr.repo "ok"))
          ()
      in
      let* _ = Mgr.start_manager mgr "ok" 1 None in
      let* _ = Mgr.start_manager mgr "failed" 2 None in
      let* error = expect_rejection (Mgr.stop_all mgr) in
      (* incomplete stop must fail *)
      Fest.expect
      |> Fest.deep_equal (exn_code error) (Some "server-stop-failed");
      Fest.expect |> Fest.deep_equal !active [ "failed" ];
      Fest.expect
      |> Fest.deep_equal (repos_keys mgr.state) [ "failed" ];
      Js.Promise.resolve ())

(* ---------- logseq.cli.server-test -> Cli_server ---------- *)

let cli_config
    ?(root_dir : string option)
    ?(owner_source : string option)
    ?(expected_revision : string option)
    ?(generation : string option)
    ?(graphs_dir : string option) () : Cli_server.config =
  { root_dir
  ; storage = None
  ; graphs_dir
  ; owner_source = Option.map (fun s -> Wire.Keyword s) owner_source
  ; expected_revision
  ; generation
  ; create_empty_db = false
  ; embedding_endpoint = None
  ; embedding_model_id = None
  ; profile_session = None
  ; base_url = None
  ; owned = None
  }

let () =
  Fest.test "db-worker-runtime-script-path-matches-runtime-selection"
    (fun () ->
      Fest.expect
      |> Fest.deep_equal
           (Cli_server.db_worker_script_path ())
           (Cli_server.db_worker_runtime_script_path ()))

let () =
  Fest.test "db-worker-release-script-path-supports-cli-packaged-layout"
    (fun () ->
      Fest.expect
      |> Fest.deep_equal
           (Cli_server.db_worker_release_script_path_from
              "/tmp/app.asar/js")
           (Node.Path.join [| "/tmp/app.asar/js"; "db-worker-node.js" |]))

let () =
  Fest.test
    "db-worker-release-script-path-supports-electron-packaged-layout"
    (fun () ->
      Fest.expect
      |> Fest.deep_equal
           (Cli_server.db_worker_release_script_path_from "/tmp/app.asar")
           (Node.Path.join
              [| "/tmp/app.asar"; "js"; "db-worker-node.js" |]))

let () =
  Fest.Promise.test "ensure-server-preserves-generation-and-owner"
    (fun () ->
      with_lifecycle_props
        [ ( "startGraph"
          , lifecycle_start_stub
              ~payload:(fun _opts ->
                [ ("port", Js.Json.number 9400.)
                ; ("revision", Js.Json.string "expected")
                ; ("generation", Js.Json.string "instance-1")
                ; ("owner-source", Js.Json.string "cli")
                ])
              () )
        ]
        (fun () ->
          let* result =
            Cli_server.ensure_server
              (cli_config ~root_dir:"/tmp" ~expected_revision:"expected"
                 ~owner_source:"electron" ())
              "demo"
          in
          Fest.expect
          |> Fest.deep_equal (json_string result "generation")
               (Some "instance-1");
          Fest.expect
          |> Fest.deep_equal (json_bool result "owned?") (Some false);
          Fest.expect
          |> Fest.deep_equal (json_string result "base-url")
               (Some "http://127.0.0.1:9400");
          Js.Promise.resolve ()))

let () =
  Fest.Promise.test "revision-mismatch-restarts-across-owner-sources"
    (fun () ->
      let starts = ref 0 in
      let stops = ref [] in
      with_lifecycle_props
        [ ( "startGraph"
          , lifecycle_start_stub
              ~on_call:(fun () -> incr starts)
              ~payload:(fun _opts ->
                [ ("port", Js.Json.number 9400.)
                ; ( "revision"
                  , Js.Json.string (if !starts = 1 then "old" else "expected")
                  )
                ; ("owner-source", Js.Json.string "cli")
                ])
              () )
        ; ("stopGraph", lifecycle_stop_stub stops)
        ]
        (fun () ->
          let* _result =
            Cli_server.ensure_server
              (cli_config ~root_dir:"/tmp" ~owner_source:"electron"
                 ~expected_revision:"expected" ())
              "demo"
          in
          Fest.expect |> Fest.deep_equal !starts 2;
          Fest.expect |> Fest.deep_equal !stops [ ("demo", "cli") ];
          Js.Promise.resolve ()))

let () =
  Fest.Promise.test "stop-failure-is-returned-without-success" (fun () ->
      let stop_stub =
        json_of_any (fun [@u] (_s : Js.Json.t) (_r : Js.Json.t)
            (_o : Js.Json.t) ->
            let e = js_error "Worker remains alive" in
            set_index (json_of_any e) "code"
              (Js.Json.string "server-stop-timeout");
            Js.Promise.reject (as_exn e))
      in
      with_lifecycle_props [ ("stopGraph", stop_stub) ] (fun () ->
          let* result =
            Cli_server.stop_server (cli_config ~root_dir:"/tmp" ()) "demo"
          in
          Fest.expect
          |> Fest.deep_equal (json_bool result "ok?") (Some false);
          Fest.expect
          |> Fest.deep_equal
               (Option.bind
                  (json_get_in result [ "error"; "code" ])
                  Js.Json.decodeString)
               (Some "server-stop-timeout");
          Js.Promise.resolve ()))

let () =
  Fest.Promise.test "list-servers-reads-server-list-and-healthz-details"
    (fun () ->
      let root_dir = mk_tmp_dir "cli-server-list-revision" in
      let server_list_file = Server_list.path root_dir in
      let repo =
        "logseq_db_list_revision_" ^ String.sub (Uuid_gen.uuid ()) 0 8
      in
      let port_ref = ref 0 in
      let payload () =
        js_obj
          [ ("repo", Js.Json.string repo)
          ; ("status", Js.Json.string "ready")
          ; ("host", Js.Json.string "127.0.0.1")
          ; ("port", Js.Json.number (float_of_int !port_ref))
          ; ("pid", Js.Json.number (float_of_int (Node_process.pid ())))
          ; ("owner-source", Js.Json.string "cli")
          ; ("root-dir", Js.Json.string root_dir)
          ; ("revision", Js.Json.string "server-revision")
          ]
      in
      let* server, port = start_stub_server (healthz_handler ~payload) in
      port_ref := port;
      write_file_utf8 server_list_file
        (string_of_int (Node_process.pid ()) ^ " " ^ string_of_int port ^ "\n");
      let* servers =
        Cli_server.list_servers (cli_config ~root_dir () )
      in
      Fest.expect |> Fest.deep_equal (Array.length servers) 1;
      (match servers with
      | [| s |] ->
          Fest.expect |> Fest.deep_equal (json_string s "repo") (Some repo);
          Fest.expect
          |> Fest.deep_equal (json_string s "status") (Some "ready");
          Fest.expect
          |> Fest.deep_equal (json_string s "root-dir") (Some root_dir);
          Fest.expect
          |> Fest.deep_equal (json_string s "revision")
               (Some "server-revision")
      | _ -> Fest.expect |> Fest.ok false);
      let* () = close_server server in
      Js.Promise.resolve ())

let () =
  Fest.Promise.test "list-servers-lazily-cleans-stale-server-list-entries"
    (fun () ->
      let root_dir = mk_tmp_dir "cli-server-list-cleanup" in
      let server_list_file = Server_list.path root_dir in
      write_file_utf8 server_list_file "999999 65535\n";
      let* servers = Cli_server.list_servers (cli_config ~root_dir ()) in
      Fest.expect |> Fest.deep_equal (Array.length servers) 0;
      let contents =
        if exists_sync server_list_file then
          Some (read_file_utf8 server_list_file "utf8")
        else None
      in
      Fest.expect
      |> Fest.deep_equal (match contents with None | Some "" -> true | _ -> false)
           true;
      Js.Promise.resolve ())

let () =
  Fest.Promise.test
    "list-servers-preserves-concurrent-server-list-writes" (fun () ->
      let root_dir = mk_tmp_dir "cli-server-list-race" in
      let server_list_file = Server_list.path root_dir in
      let stale_pid = 999999 in
      let stale_port = 65535 in
      let live_pid = Node_process.pid () in
      let live_port = 65432 in
      let appended = ref false in
      write_file_utf8 server_list_file
        (string_of_int stale_pid ^ " " ^ string_of_int stale_port ^ "\n");
      (* cljs redefs daemon/pid-status so the stale pid's check appends
         a live entry mid-scan; our override is one layer down, on
         process.kill(pid, 0). *)
      with_process_kill
        (fun pid ->
          if pid = stale_pid && not !appended then (
            appended := true;
            append_file_utf8 server_list_file
              (string_of_int live_pid ^ " " ^ string_of_int live_port
              ^ "\n"));
          if pid = live_pid then () else raise_esrch ())
        (fun () ->
          let* servers =
            Cli_server.list_servers (cli_config ~root_dir ())
          in
          Fest.expect |> Fest.deep_equal (Array.length servers) 0;
          Fest.expect |> Fest.deep_equal !appended true;
          let* entries =
            Cli_server.promise_of_task
              (Server_list.read_entries server_list_file)
          in
          Fest.expect
          |> Fest.deep_equal
               (List.map
                  (fun (e : Server_list.entry) -> e.pid, e.port)
                  entries)
               [ (live_pid, live_port) ];
          Js.Promise.resolve ()))

(* the cleanup tests' cljs version rebinds cli-server/list-servers and
   stop-server! — module-internal seams that do not exist in OCaml — so
   we run the real path: server-list entries with fake pids made alive
   via process.kill, one healthz stub per entry, and Lifecycle.stopGraph
   recording (repo, owner). *)
type cleanup_server =
  { repo : string
  ; pid : int
  ; owner : string
  ; revision : string option
  ; server : Stub_http.server
  ; port : int
  }

let start_cleanup_servers ~(root_dir : string)
    (specs : (string * int * string * string option) list)
    : cleanup_server list Js.Promise.t =
  let alive_pids = List.map (fun (_, pid, _, _) -> pid) specs in
  let rec go acc = function
    | [] -> Js.Promise.resolve (List.rev acc)
    | (repo, pid, owner, revision) :: tl ->
        let payload () =
          js_obj
            ([ ("repo", Js.Json.string repo)
             ; ("status", Js.Json.string "ready")
             ; ("host", Js.Json.string "127.0.0.1")
             ; ("pid", Js.Json.number (float_of_int pid))
             ; ("owner-source", Js.Json.string owner)
             ; ("root-dir", Js.Json.string root_dir)
             ]
            @ (match revision with
               | Some r -> [ ("revision", Js.Json.string r) ]
               | None -> []))
        in
        let* server, port = start_stub_server (healthz_handler ~payload) in
        go ({ repo; pid; owner; revision; server; port } :: acc) tl
  in
  ignore alive_pids;
  go [] specs

let () =
  Fest.Promise.test
    "cleanup-revision-mismatched-servers-kills-only-cli-owned-targets"
    (fun () ->
      let root_dir = mk_tmp_dir "cli-cleanup-targets" in
      let server_list_file = Server_list.path root_dir in
      let specs =
        [ ("logseq_db_a", 11, "cli", Some "worker-rev-a")
        ; ("logseq_db_b", 22, "electron", Some "worker-rev-b")
        ; ("logseq_db_c", 33, "cli", Some "cli-rev")
        ; ("logseq_db_nil", 44, "cli", None)
        ]
      in
      let* servers = start_cleanup_servers ~root_dir specs in
      List.iter
        (fun s ->
          append_file_utf8 server_list_file
            (string_of_int s.pid ^ " " ^ string_of_int s.port ^ "\n"))
        servers;
      let alive_pids = List.map (fun (_, pid, _, _) -> pid) specs in
      let stop_calls = ref [] in
      with_process_kill
        (fun pid -> if List.mem pid alive_pids then () else raise_esrch ())
        (fun () ->
          with_lifecycle_props
            [ ("stopGraph", lifecycle_stop_stub stop_calls) ]
            (fun () ->
              let* result =
                Cli_server.cleanup_revision_mismatched_servers
                  (cli_config ~root_dir ())
                  "cli-rev"
              in
              let data =
                Option.value (field result "data") ~default:Js.Json.null
              in
              Fest.expect
              |> Fest.deep_equal (json_bool result "ok?") (Some true);
              Fest.expect
              |> Fest.deep_equal (json_int data "checked") (Some 4);
              Fest.expect
              |> Fest.deep_equal (json_int data "mismatched") (Some 3);
              Fest.expect
              |> Fest.deep_equal (json_int data "eligible") (Some 2);
              Fest.expect
              |> Fest.deep_equal (json_int data "skipped-owner") (Some 1);
              let killed_repos =
                match field data "killed" with
                | Some (killed) -> (
                    match Js.Json.decodeArray killed with
                    | Some arr ->
                        Array.to_list
                          (Array.map
                             (fun t ->
                               Option.value (json_string t "repo")
                                 ~default:"")
                             arr)
                    | None -> [])
                | None -> []
              in
              Fest.expect
              |> Fest.deep_equal (List.sort compare killed_repos)
                   [ "logseq_db_a"; "logseq_db_nil" ];
              let failed =
                match field data "failed" with
                | Some f -> (
                    match Js.Json.decodeArray f with
                    | Some arr -> Array.to_list arr
                    | None -> [])
                | None -> []
              in
              Fest.expect |> Fest.deep_equal failed [];
              Fest.expect
              |> Fest.deep_equal
                   (List.sort compare
                      (List.map fst !stop_calls))
                   [ "logseq_db_a"; "logseq_db_nil" ];
              (* every stop went out as owner "cli" *)
              Fest.expect
              |> Fest.deep_equal
                   (List.for_all
                      (fun (_, owner) -> String.equal owner "cli")
                      !stop_calls)
                   true;
              let* () =
                Js.Promise.all
                  (Array.of_list (List.map (fun s -> close_server s.server) servers))
                |> Js.Promise.then_ (fun _ -> Js.Promise.resolve ())
              in
              Js.Promise.resolve ())))

let () =
  Fest.Promise.test "cleanup-revision-mismatched-servers-reports-failures"
    (fun () ->
      let root_dir = mk_tmp_dir "cli-cleanup-failures" in
      let server_list_file = Server_list.path root_dir in
      let specs =
        [ ("logseq_db_a", 11, "cli", Some "worker-rev-a")
        ; ("logseq_db_b", 22, "cli", Some "worker-rev-b")
        ]
      in
      let* servers = start_cleanup_servers ~root_dir specs in
      List.iter
        (fun s ->
          append_file_utf8 server_list_file
            (string_of_int s.pid ^ " " ^ string_of_int s.port ^ "\n"))
        servers;
      let alive_pids = List.map (fun (_, pid, _, _) -> pid) specs in
      (* cljs stop-server! resolves {:ok? false}; our real stop path
         reaches Lifecycle.stopGraph, which we reject with the same
         error object so the failure lands in :failed. *)
      let stop_stub =
        json_of_any (fun [@u] (_s : Js.Json.t) (repo : Js.Json.t)
            (_o : Js.Json.t) ->
            match Js.Json.decodeString repo with
            | Some "logseq_db_b" ->
                let e = js_error "timed out stopping server" in
                set_index (json_of_any e) "code"
                  (Js.Json.string "server-stop-timeout");
                Js.Promise.reject (as_exn e)
            | _ -> Js.Promise.resolve Js.Json.null)
      in
      with_process_kill
        (fun pid -> if List.mem pid alive_pids then () else raise_esrch ())
        (fun () ->
          with_lifecycle_props [ ("stopGraph", stop_stub) ] (fun () ->
              let* result =
                Cli_server.cleanup_revision_mismatched_servers
                  (cli_config ~root_dir ())
                  "cli-rev"
              in
              let data =
                Option.value (field result "data") ~default:Js.Json.null
              in
              Fest.expect
              |> Fest.deep_equal (json_bool result "ok?") (Some true);
              let repos_of key =
                match field data key with
                | Some arr -> (
                    match Js.Json.decodeArray arr with
                    | Some a ->
                        List.filter_map (fun t -> json_string t "repo")
                          (Array.to_list a)
                    | None -> [])
                | None -> []
              in
              Fest.expect
              |> Fest.deep_equal (repos_of "killed") [ "logseq_db_a" ];
              Fest.expect
              |> Fest.deep_equal (repos_of "failed") [ "logseq_db_b" ];
              Fest.expect
              |> Fest.deep_equal
                   (match field data "failed" with
                   | Some f -> (
                       match Js.Json.decodeArray f with
                       | Some [| first |] ->
                           Option.bind
                             (json_get_in first [ "error"; "code" ])
                             Js.Json.decodeString
                       | _ -> None)
                   | None -> None)
                   (Some "server-stop-timeout");
              let* () =
                Js.Promise.all
                  (Array.of_list (List.map (fun s -> close_server s.server) servers))
                |> Js.Promise.then_ (fun _ -> Js.Promise.resolve ())
              in
              Js.Promise.resolve ())))

let () =
  Fest.test "list-graph-items-ignores-non-graph-directories" (fun () ->
      let root_dir = mk_tmp_dir "cli-list-graphs-ignore" in
      let graphs_dir = Node.Path.join [| root_dir; "graphs" |] in
      List.iter
        (fun dir ->
          mkdirp (Node.Path.join [| graphs_dir; dir |]))
        [ "alpha"
        ; "backup"
        ; "foo~2G"
        ; "Unlinked graphs"
        ; "logseq_local_1"
        ];
      let items =
        Cli_server.list_graph_items (cli_config ~root_dir ())
      in
      let js = Array.map Cli_server.graph_item_to_js items in
      Fest.expect
      |> Fest.deep_equal
           (Array.to_list
              (Array.map
                 (fun i ->
                   Option.value (json_string i "kind") ~default:""
                 , Option.value (json_string i "graph-name") ~default:""
                 , Option.value (json_string i "graph-dir") ~default:"" )
                 js))
           [ ("canonical", "alpha", "alpha") ])

let () =
  Fest.test "list-graph-items-marks-legacy-conflict" (fun () ->
      let root_dir = mk_tmp_dir "cli-list-graphs-legacy" in
      let graphs_dir = Node.Path.join [| root_dir; "graphs" |] in
      List.iter
        (fun dir ->
          mkdirp (Node.Path.join [| graphs_dir; dir |]))
        [ "legacy++name"; "legacy~2Fname"; "bad%ZZname" ];
      let items =
        Cli_server.list_graph_items (cli_config ~root_dir ())
      in
      let js = Array.map Cli_server.graph_item_to_js items in
      let find_kind k =
        match
          List.find_opt
            (fun i -> json_string i "kind" = Some k)
            (Array.to_list js)
        with
        | Some i -> i
        | None -> js_obj []
      in
      let legacy_item = find_kind "legacy" in
      let undecodable_item = find_kind "legacy-undecodable" in
      Fest.expect
      |> Fest.deep_equal
           (json_string legacy_item "legacy-graph-name")
           (Some "legacy/name");
      Fest.expect
      |> Fest.deep_equal
           (json_string legacy_item "target-graph-dir")
           (Some "legacy~2Fname");
      Fest.expect
      |> Fest.deep_equal (json_bool legacy_item "conflict?") (Some true);
      Fest.expect
      |> Fest.deep_equal
           (json_string undecodable_item "legacy-dir")
           (Some "bad%ZZname"))

let () =
  Fest.test
    "list-graph-items-treats-percent-encoded-dir-as-legacy-when-non-canonical"
    (fun () ->
      let root_dir = mk_tmp_dir "cli-list-graphs-percent-legacy" in
      let graphs_dir = Node.Path.join [| root_dir; "graphs" |] in
      List.iter
        (fun dir ->
          mkdirp (Node.Path.join [| graphs_dir; dir |]))
        [ "yy y"; "yy~20y"; "yy%20y" ];
      let items =
        Cli_server.list_graph_items (cli_config ~root_dir ())
      in
      let js = Array.map Cli_server.graph_item_to_js items in
      let canonical_item =
        match
          List.find_opt
            (fun i -> json_string i "kind" = Some "canonical")
            (Array.to_list js)
        with
        | Some i -> i
        | None -> js_obj []
      in
      let legacy_items =
        List.filter
          (fun i -> json_string i "kind" = Some "legacy")
          (Array.to_list js)
      in
      let legacy_dirs =
        List.filter_map (fun i -> json_string i "legacy-dir") legacy_items
      in
      Fest.expect
      |> Fest.deep_equal
           (json_string canonical_item "graph-dir") (Some "yy y");
      Fest.expect
      |> Fest.deep_equal
           (json_string canonical_item "graph-name") (Some "yy y");
      Fest.expect
      |> Fest.deep_equal (List.sort compare legacy_dirs)
           [ "yy%20y"; "yy~20y" ];
      List.iter
        (fun legacy_dir ->
          match
            List.find_opt
              (fun i -> json_string i "legacy-dir" = Some legacy_dir)
              legacy_items
          with
          | Some item ->
              Fest.expect
              |> Fest.deep_equal
                   (json_string item "legacy-graph-name") (Some "yy y");
              Fest.expect
              |> Fest.deep_equal
                   (json_string item "target-graph-dir") (Some "yy y");
              Fest.expect
              |> Fest.deep_equal (json_bool item "conflict?") (Some true)
          | None -> Fest.expect |> Fest.ok false)
        [ "yy~20y"; "yy%20y" ])

(* ---------- logseq.db-worker.graph-backup-test -> Graph_backup -------- *)

let () =
  Fest.test "backup-paths-use-canonical-graph-backup-layout" (fun () ->
      let graphs_dir = "/tmp/logseq-graphs" in
      let repo = "logseq_db_foo/bar" in
      let backup_name = "daily:name/with space" in
      let encoded_graph =
        Option.value
          (Graph_dir.repo_to_encoded_graph_dir_name repo)
          ~default:""
      in
      let encoded_backup =
        Graph_dir.encode_graph_dir_name backup_name
      in
      let backup_root =
        Node.Path.join [| graphs_dir; encoded_graph; "backup" |]
      in
      let backup_dir = Node.Path.join [| backup_root; encoded_backup |] in
      Fest.expect
      |> Fest.deep_equal
           (Graph_backup.backup_root_path ~graphs_dir ~repo)
           backup_root;
      Fest.expect
      |> Fest.deep_equal
           (Graph_backup.backup_dir_name ~backup_name)
           encoded_backup;
      Fest.expect
      |> Fest.deep_equal
           (Graph_backup.backup_dir_path ~graphs_dir ~repo ~backup_name)
           backup_dir;
      Fest.expect
      |> Fest.deep_equal
           (Graph_backup.backup_db_path ~graphs_dir ~repo ~backup_name)
           (Node.Path.join [| backup_dir; "db.sqlite" |]);
      Fest.expect
      |> Fest.deep_equal
           (Graph_backup.backup_metadata_path ~graphs_dir ~repo
              ~backup_name)
           (Node.Path.join [| backup_dir; "metadata.edn" |]))

let () =
  Fest.test "backup-paths-reject-directory-traversal-names" (fun () ->
      let assert_throws_substring f needle =
        match f () with
        | exception e ->
            Fest.expect
            |> Fest.deep_equal
                 (Common_util.str_includes (Printexc.to_string e) needle)
                 true
        | _ -> Fest.expect |> Fest.ok false
      in
      assert_throws_substring
        (fun () ->
          ignore
            (Graph_backup.backup_root_path ~graphs_dir:"/tmp/logseq-graphs"
               ~repo:"logseq_db_.."))
        "invalid graph directory path";
      assert_throws_substring
        (fun () ->
          ignore
            (Graph_backup.backup_dir_path ~graphs_dir:"/tmp/logseq-graphs"
               ~repo:"logseq_db_demo" ~backup_name:".."))
        "invalid backup directory path";
      assert_throws_substring
        (fun () ->
          ignore
            (Graph_backup.backup_dir_path ~graphs_dir:"/tmp/logseq-graphs"
               ~repo:"logseq_db_demo" ~backup_name:"."))
        "invalid backup directory path")

let () =
  Fest.test "build-backup-name-preserves-cli-shape" (fun () ->
      Fest.expect
      |> Fest.deep_equal
           (Graph_backup.build_backup_name ~timestamp:"20260101T000000Z"
              "logseq_db_demo" None)
           "demo-20260101T000000Z";
      Fest.expect
      |> Fest.deep_equal
           (Graph_backup.build_backup_name ~timestamp:"20260101T000000Z"
              "logseq_db_demo" (Some " nightly "))
           "demo-nightly-20260101T000000Z")

let () =
  Fest.test "next-backup-target-appends-numeric-suffix" (fun () ->
      let graphs_dir = mk_tmp_dir "graph-backup-next-target" in
      let repo = "logseq_db_demo" in
      let base_name = "demo-nightly" in
      let existing_dir =
        Graph_backup.backup_dir_path ~graphs_dir ~repo
          ~backup_name:base_name
      in
      mkdirp existing_dir;
      let target =
        Graph_backup.next_backup_target ~graphs_dir ~repo
          ~base_name
      in
      Fest.expect
      |> Fest.deep_equal target.backup_name "demo-nightly-1";
      Fest.expect
      |> Fest.deep_equal target.dir_path
           (Graph_backup.backup_dir_path ~graphs_dir ~repo
              ~backup_name:"demo-nightly-1");
      Fest.expect
      |> Fest.deep_equal target.db_path
           (Graph_backup.backup_db_path ~graphs_dir ~repo
              ~backup_name:"demo-nightly-1"))

let () =
  Fest.test "list-backups-only-returns-directories-with-sqlite-files"
    (fun () ->
      let graphs_dir = mk_tmp_dir "graph-backup-list" in
      let repo = "logseq_db_demo" in
      let valid_name = "demo-nightly" in
      let incomplete_name = "demo-incomplete" in
      let root_path =
        Graph_backup.backup_root_path ~graphs_dir ~repo
      in
      let incomplete_dir =
        Graph_backup.backup_dir_path ~graphs_dir ~repo
          ~backup_name:incomplete_name
      in
      ignore (write_backup ~graphs_dir ~repo ~backup_name:valid_name ());
      mkdirp incomplete_dir;
      write_file_utf8
        (Node.Path.join [| root_path; "not-a-directory" |])
        "ignored";
      Fest.expect
      |> Fest.deep_equal
           (List.map
              (fun (e : Graph_backup.list_entry) -> e.name)
              (Graph_backup.list_backups ~graphs_dir ~repo))
           [ valid_name ])

let () =
  Fest.test "list-backups-includes-source-when-metadata-exists" (fun () ->
      let graphs_dir = mk_tmp_dir "graph-backup-list-source" in
      let repo = "logseq_db_demo" in
      ignore
        (write_backup ~graphs_dir ~repo ~backup_name:"demo-auto"
           ~metadata:
             (backup_metadata ~source:(Some "electron-auto") ~repo
                ~backup_name:"demo-auto" ~created_at_ms:1770000000000.
                ~db_path:
                  (Graph_backup.backup_db_path ~graphs_dir ~repo
                     ~backup_name:"demo-auto"))
           ());
      ignore
        (write_backup ~graphs_dir ~repo ~backup_name:"demo-cli"
           ~metadata:
             (backup_metadata ~source:(Some "cli") ~repo ~backup_name:"demo-cli"
                ~created_at_ms:1770000001000.
                ~db_path:
                  (Graph_backup.backup_db_path ~graphs_dir ~repo
                     ~backup_name:"demo-cli"))
           ());
      ignore
        (write_backup ~graphs_dir ~repo ~backup_name:"demo-legacy" ());
      Fest.expect
      |> Fest.deep_equal
           (List.map
              (fun (e : Graph_backup.list_entry) -> e.name, e.source)
              (Graph_backup.list_backups ~graphs_dir ~repo))
           [ ("demo-auto", Some "electron-auto")
           ; ("demo-cli", Some "cli")
           ; ("demo-legacy", None)
           ])

let () =
  Fest.Promise.test
    "create-backup-snapshots-to-temp-file-before-publishing" (fun () ->
      let graphs_dir = mk_tmp_dir "graph-backup-create" in
      let repo = "logseq_db_demo" in
      let backup_name = "demo-nightly" in
      let snapshot_calls = ref [] in
      let final_db_path =
        Graph_backup.backup_db_path ~graphs_dir ~repo ~backup_name
      in
      let final_visible_during_snapshot = ref false in
      let* result =
        Graph_backup.create_backup
          { Graph_backup.graphs_dir
          ; repo
          ; backup_name
          ; source = "cli"
          ; snapshot =
              (fun tmp_db_path ->
                final_visible_during_snapshot := exists_sync final_db_path;
                snapshot_calls := tmp_db_path :: !snapshot_calls;
                write_file_utf8 tmp_db_path "sqlite-copy";
                Js.Promise.resolve ())
          ; now_ms = Some 1770000000000.
          ; keep_versions = None
          ; throttle_ms = None
          }
      in
      Fest.expect
      |> Fest.deep_equal result
           { Graph_backup.backup_name = Some backup_name
           ; path = Some final_db_path
           ; created = true
           ; reason = None
           };
      Fest.expect |> Fest.deep_equal (List.length !snapshot_calls) 1;
      Fest.expect |> Fest.deep_equal !final_visible_during_snapshot false;
      Fest.expect
      |> Fest.deep_equal
           (List.map Node.Path.dirname !snapshot_calls)
           [ Node.Path.dirname final_db_path ];
      Fest.expect
      |> Fest.deep_equal
           (match !snapshot_calls with
           | [ tmp ] -> not (String.equal tmp final_db_path)
           | _ -> false)
           true;
      Fest.expect
      |> Fest.deep_equal (read_file_utf8 final_db_path "utf8") "sqlite-copy";
      let metadata =
        read_edn_file
          (Graph_backup.backup_metadata_path ~graphs_dir ~repo
             ~backup_name)
      in
      Fest.expect
      |> Fest.deep_equal
           (Clj_value.map_get_int metadata "schema-version") (Some 1);
      Fest.expect
      |> Fest.deep_equal
           (Clj_value.map_get_str metadata "name") (Some backup_name);
      Fest.expect
      |> Fest.deep_equal
           (Clj_value.map_get_str metadata "repo") (Some repo);
      Fest.expect
      |> Fest.deep_equal
           (Clj_value.map_get metadata "source")
           (Datascript.Keyword "cli");
      Fest.expect
      |> Fest.deep_equal
           (Clj_value.map_get metadata "created-at-ms")
           (Datascript.Int64 1770000000000L);
      Fest.expect
      |> Fest.deep_equal
           (Clj_value.map_get_str metadata "db-path")
           (Some final_db_path);
      Js.Promise.resolve ())

let () =
  Fest.Promise.test "failed-snapshot-removes-reserved-backup-directory"
    (fun () ->
      let graphs_dir = mk_tmp_dir "graph-backup-failed-create" in
      let repo = "logseq_db_demo" in
      let backup_name = "demo-failure" in
      let target_dir =
        Graph_backup.backup_dir_path ~graphs_dir ~repo ~backup_name
      in
      let* error =
        expect_rejection
          (Graph_backup.create_backup
             { Graph_backup.graphs_dir
             ; repo
             ; backup_name
             ; source = "cli"
             ; snapshot =
                 (fun tmp_db_path ->
                   write_file_utf8 tmp_db_path "partial";
                   let e = js_error "snapshot failed" in
                   set_index (json_of_any e) "code"
                     (Js.Json.string "snapshot-failed");
                   Js.Promise.reject (as_exn e))
             ; now_ms = None
             ; keep_versions = None
             ; throttle_ms = None
             })
      in
      Fest.expect
      |> Fest.deep_equal (exn_code error) (Some "snapshot-failed");
      Fest.expect |> Fest.deep_equal (exists_sync target_dir) false;
      Fest.expect
      |> Fest.deep_equal
           (Graph_backup.list_backups ~graphs_dir ~repo)
           [];
      Js.Promise.resolve ())

let () =
  Fest.Promise.test "cli-backups-do-not-use-desktop-automatic-throttling"
    (fun () ->
      let graphs_dir = mk_tmp_dir "graph-backup-cli-no-throttle" in
      let repo = "logseq_db_demo" in
      let now_ms = 1770000000000. in
      let snapshot_calls = ref [] in
      ignore
        (write_backup ~graphs_dir ~repo ~backup_name:"demo-auto-recent"
           ~metadata:
             (backup_metadata ~source:(Some "electron-auto") ~repo
                ~backup_name:"demo-auto-recent"
                ~created_at_ms:(now_ms -. 1000.)
                ~db_path:
                  (Graph_backup.backup_db_path ~graphs_dir ~repo
                     ~backup_name:"demo-auto-recent"))
           ());
      let* result =
        Graph_backup.create_backup
          { Graph_backup.graphs_dir
          ; repo
          ; backup_name = "demo-cli"
          ; source = "cli"
          ; snapshot =
              (fun tmp_db_path ->
                snapshot_calls := tmp_db_path :: !snapshot_calls;
                write_file_utf8 tmp_db_path "cli";
                Js.Promise.resolve ())
          ; now_ms = Some now_ms
          ; keep_versions = None
          ; throttle_ms = None
          }
      in
      Fest.expect |> Fest.deep_equal result.created true;
      Fest.expect |> Fest.deep_equal (List.length !snapshot_calls) 1;
      Fest.expect
      |> Fest.deep_equal
           (List.sort compare
              (List.map
                 (fun (e : Graph_backup.list_entry) -> e.name)
                 (Graph_backup.list_backups ~graphs_dir ~repo)))
           [ "demo-auto-recent"; "demo-cli" ];
      Js.Promise.resolve ())

let () =
  Fest.Promise.test
    "desktop-automatic-backup-skips-when-recent-auto-backup-exists"
    (fun () ->
      let graphs_dir = mk_tmp_dir "graph-backup-auto-throttle" in
      let repo = "logseq_db_demo" in
      let now_ms = 1770000000000. in
      let snapshot_calls = ref [] in
      ignore
        (write_backup ~graphs_dir ~repo ~backup_name:"demo-auto-recent"
           ~metadata:
             (backup_metadata ~source:(Some "electron-auto") ~repo
                ~backup_name:"demo-auto-recent"
                ~created_at_ms:(now_ms -. 60000.)
                ~db_path:
                  (Graph_backup.backup_db_path ~graphs_dir ~repo
                     ~backup_name:"demo-auto-recent"))
           ());
      let* result =
        Graph_backup.create_backup
          { Graph_backup.graphs_dir
          ; repo
          ; backup_name = "demo-auto-current"
          ; source = "electron-auto"
          ; snapshot =
              (fun tmp_db_path ->
                snapshot_calls := tmp_db_path :: !snapshot_calls;
                Js.Promise.resolve ())
          ; now_ms = Some now_ms
          ; keep_versions = None
          ; throttle_ms = Some 3600000
          }
      in
      Fest.expect
      |> Fest.deep_equal result
           { Graph_backup.backup_name = None
           ; path = None
           ; created = false
           ; reason = Some "too-soon"
           };
      Fest.expect |> Fest.deep_equal !snapshot_calls [];
      Fest.expect
      |> Fest.deep_equal
           (exists_sync
              (Graph_backup.backup_dir_path ~graphs_dir ~repo
                 ~backup_name:"demo-auto-current"))
           false;
      Js.Promise.resolve ())

let () =
  Fest.test "automatic-retention-only-prunes-explicit-auto-backups"
    (fun () ->
      let graphs_dir = mk_tmp_dir "graph-backup-auto-retention" in
      let repo = "logseq_db_demo" in
      let metadata backup_name source created_at_ms =
        backup_metadata ~source ~repo ~backup_name ~created_at_ms
          ~db_path:
            (Graph_backup.backup_db_path ~graphs_dir ~repo ~backup_name)
      in
      ignore
        (write_backup ~graphs_dir ~repo ~backup_name:"auto-old"
           ~metadata:(metadata "auto-old" (Some "electron-auto") 1000.) ());
      ignore
        (write_backup ~graphs_dir ~repo ~backup_name:"auto-middle"
           ~metadata:(metadata "auto-middle" (Some "electron-auto") 2000.)
           ());
      ignore
        (write_backup ~graphs_dir ~repo ~backup_name:"auto-new"
           ~metadata:(metadata "auto-new" (Some "electron-auto") 3000.)
           ());
      ignore
        (write_backup ~graphs_dir ~repo ~backup_name:"manual-old"
           ~metadata:(metadata "manual-old" (Some "electron-manual") 1.)
           ());
      ignore
        (write_backup ~graphs_dir ~repo ~backup_name:"cli-old"
           ~metadata:(metadata "cli-old" (Some "cli") 1.) ());
      ignore
        (write_backup ~graphs_dir ~repo ~backup_name:"unknown-old" ());
      let removed =
        Graph_backup.prune_backups ~graphs_dir ~repo
          ~source:"electron-auto" ~keep_versions:2
      in
      Fest.expect
      |> Fest.deep_equal
           (List.map (fun (e : Graph_backup.backup_entry) -> e.name) removed)
           [ "auto-old" ];
      Fest.expect
      |> Fest.deep_equal
           (exists_sync
              (Graph_backup.backup_dir_path ~graphs_dir ~repo
                 ~backup_name:"auto-old"))
           false;
      Fest.expect
      |> Fest.deep_equal
           (List.sort compare
              (List.map
                 (fun (e : Graph_backup.list_entry) -> e.name)
                 (Graph_backup.list_backups ~graphs_dir ~repo)))
           [ "auto-middle"; "auto-new"; "cli-old"; "manual-old"
           ; "unknown-old" ])
