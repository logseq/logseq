(* frontend.worker.db-worker-node-test — translated 1:1 from
   src/test/frontend/worker/db_worker_node_test.cljs (51 deftests).
   Divergences:
   - cljs `parse-args` consumed a process.argv-style js array; the OCaml
     `parse_argv` reads `!Db_worker_node.argv_fn` — tests bind that ref
     to the same argv vectors (node + script path included).
   - cljs rebound `db-core/init-core!`'s returned {:remoteInvoke}; the
     OCaml seam is `Db_worker_node.remote_invoke_fn` (Worker_core.init
     still runs — it only registers dispatchers).
   - cljs rebound `platform-node/node-platform` to an empty object; the
     OCaml platform record is already side-effect-free (drain_writes is
     a no-op), so no rebind is needed.
   - cljs rebound `lifecycle/assertOwnership` on the npm module; the
     OCaml seam is `Db_worker_node.assert_ownership_fn`.
   - cljs rebound js/console + js/process in run-main-with-overrides;
     the OCaml seams are argv_fn/exit_fn/log_fn/error_fn/start_daemon_fn.
   - `desktop-and-cli-share-same-graph-daemon`: `cli-server/ensure-server!`
     is cljs-only — the test reimplements the reuse path (read
     server-list, hit /healthz, invoke on the advertised port).
   - `repo-error` tests pass method names as strings (cljs also
     exercised keyword args, which OCaml does not model).
   - `*sse-clients` entries are {sink_id; write; close} sinks rather
     than raw http response objects (cljs used #js {:write}).
   - cljs bound `style/*color-enabled?*`; the OCaml seam is
     `Cli_style.color_enabled_override`.
   - Wire.Binary is a byte string; cljs js/Uint8Array checks map to
     string length / substring checks. *)

external tmpdir : unit -> string = "tmpdir" [@@mel.module "os"]

external mkdtemp : string -> string = "mkdtempSync" [@@mel.module "fs"]

external exists_sync : string -> bool = "existsSync" [@@mel.module "fs"]

external read_file_sync : string -> string -> string = "readFileSync"
  [@@mel.module "fs"]

external read_file_buf : string -> Node.Buffer.t = "readFileSync"
  [@@mel.module "fs"]

external write_file_sync : string -> string -> unit = "writeFileSync"
  [@@mel.module "fs"]

external mkdir_sync_opts : string -> Js.Json.t -> unit = "mkdirSync"
  [@@mel.module "fs"]

external readdir_sync : string -> string array = "readdirSync"
  [@@mel.module "fs"]

external chmod_sync : string -> int -> unit = "chmodSync" [@@mel.module "fs"]

external resolve_path : string -> string = "resolve" [@@mel.module "path"]

external realpath_sync : string -> string = "realpathSync"
  [@@mel.module "fs"]

external process_stdout_write : string -> unit = "write"
  [@@mel.scope "process.stdout"]

external process_env : Js.Json.t Js.Dict.t = "env" [@@mel.scope "process"]

external buffer_byte_length : Node.Buffer.t -> int = "byteLength" [@@mel.get]

external buffer_subarray : Node.Buffer.t -> int -> int -> Node.Buffer.t
  = "subarray" [@@mel.send]

external rej_code : Js.Promise.error -> string option = "code" [@@mel.get]
  [@@mel.return nullable]

external rej_message : Js.Promise.error -> string option = "message"
  [@@mel.get] [@@mel.return nullable]

external exn_code : Js.Exn.t -> string option = "code" [@@mel.get]
  [@@mel.return nullable]

(* Rejections delivered via promise_of_task carry the OCaml exn box
   itself; JS-side rejections are plain objects that simply fail the
   exn pattern match below. *)
external exn_of_rejection : Js.Promise.error -> exn = "%identity"

(* HTTP response chunks are always Buffers in Node, and the JS event
   wrapper type cannot express that — the same cast node_console uses.
   %identity only reinterprets values that are already Buffers. *)
external as_buffer : Js.Json.t -> Node.Buffer.t = "%identity"

let set_env name value = Js.Dict.set process_env name (Js.Json.string value)

let promise_of_task t =
  Js.Promise.make (fun ~resolve ~reject ->
      Db_worker_effect.on_any t
        (fun v -> resolve v [@u])
        (fun e -> reject e [@u]))

let ( let* ) p f = Js.Promise.then_ f p

let read_file_utf8 path = read_file_sync path "utf8"

let mkdir_recursive dir =
  mkdir_sync_opts dir
    (Js.Json.object_ (Js.Dict.fromList [ "recursive", Js.Json.boolean true ]))

let contains haystack needle =
  match Js.String.indexOf ~search:needle haystack with
  | -1 -> false
  | _ -> true

let err_str e =
  match rej_message e with
  | Some m -> m
  | None -> (match Js.Json.stringifyAny e with
      | Some s -> s
      | None -> "error")

(* cljs str/message on a raised exn or js Error. *)
let exn_message = function
  | Failure m -> m
  | Js.Exn.Error err -> Option.value (Js.Exn.message err) ~default:""
  | e -> Printexc.to_string e

(* ex-data (:code e) — JS errors carry .code, dispatcher errors carry
   {:code} in their info map. A plain JS value that is not an OCaml exn
   falls through the exn pattern match to [""]. *)
let exn_error_code e =
  match e with
  | Js.Exn.Error err -> Option.value (exn_code err) ~default:""
  | Dispatcher.Exn_info (_, kvs) ->
      (match Db_worker_node.kv_get kvs "code" with
       | Some (Wire.Keyword c) -> c
       | _ -> "")
  | _ -> ""

let rejection_code e =
  match rej_code e with
  | Some c -> c
  | None -> exn_error_code (exn_of_rejection e)

let random_suffix () = String.sub (Uuid_gen.uuid ()) 0 8

let now_ms () = Wire.Int64 (Int64.of_float (Clock.now_ms ()))

let json_parse str =
  try Js.Json.parseExn str with _ -> Js.Json.null

let json_field json k =
  match Js.Json.decodeObject json with
  | Some o -> Js.Dict.get o k
  | None -> None

let json_string json k =
  match json_field json k with
  | Some v -> (match Js.Json.decodeString v with Some s -> s | None -> "")
  | None -> ""

let json_bool json k =
  match json_field json k with
  | Some v -> (match Js.Json.decodeBoolean v with Some b -> b | None -> false)
  | None -> false

(* cljs (get-in parsed ks) *)
let json_get_in json ks =
  List.fold_left
    (fun acc k ->
       match acc with
       | Some j -> json_field j k
       | None -> None)
    (Some json) ks

let json_string_in json ks =
  match json_get_in json ks with
  | Some v -> (match Js.Json.decodeString v with Some s -> s | None -> "")
  | None -> ""

(* cljs (pr-str s) on a plain string *)
let pr_str_str s = "\"" ^ s ^ "\""

(* ---- http client (cljs http-request) ---- *)

module Http_client = struct
  type req
  type res

  external request : Js.Json.t -> (res -> unit [@u]) -> req = "request"
    [@@mel.module "http"]

  external res_status : res -> int = "statusCode" [@@mel.get]

  external res_on : res -> string -> (Js.Json.t -> unit [@u]) -> unit = "on"
    [@@mel.send]

  external req_on : req -> string -> (Js.Promise.error -> unit [@u]) -> unit
    = "on" [@@mel.send]

  external req_write : req -> string -> unit = "write" [@@mel.send]

  external req_write_buf : req -> Node.Buffer.t -> unit = "write" [@@mel.send]

  external req_end : req -> unit = "end" [@@mel.send]

  external req_destroy : req -> unit = "destroy" [@@mel.send]
end

let http_request ~host ~port ~meth ~path ?(headers = []) ?body () =
  Js.Promise.make (fun ~resolve ~reject ->
      let opts = Js.Dict.empty () in
      Js.Dict.set opts "hostname" (Js.Json.string host);
      Js.Dict.set opts "port" (Js.Json.number (float_of_int port));
      Js.Dict.set opts "path" (Js.Json.string path);
      Js.Dict.set opts "method" (Js.Json.string meth);
      (match headers with
       | [] -> ()
       | hs ->
           let h = Js.Dict.empty () in
           List.iter (fun (k, v) -> Js.Dict.set h k (Js.Json.string v)) hs;
           Js.Dict.set opts "headers" (Js.Json.object_ h));
      let req =
        Http_client.request (Js.Json.object_ opts) (fun [@u] res ->
            let chunks = ref [] in
            Http_client.res_on res "data"
              (fun [@u] c -> chunks := c :: !chunks);
            Http_client.res_on res "end" (fun [@u] _ ->
                let buf =
                  Node.Buffer.concat
                    (Array.of_list (List.rev_map as_buffer !chunks))
                in
                resolve (Http_client.res_status res, Node.Buffer.toString buf) [@u]))
      in
      Http_client.req_on req "error"
        (fun [@u] e -> reject (exn_of_rejection e) [@u]);
      (match body with
       | Some (`String s) -> Http_client.req_write req s
       | Some (`Buffer b) -> Http_client.req_write_buf req b
       | None -> ());
      Http_client.req_end req)

let http_get host port path = http_request ~host ~port ~meth:"GET" ~path ()

let invoke_raw host port method_str args =
  let payload =
    Js.Json.stringify
      (Js.Json.object_
         (Js.Dict.fromList
            [ "method", Js.Json.string method_str
            ; "argsTransit",
              Js.Json.string (Transit_codec.to_string (Wire.Array args)) ]))
  in
  http_request ~host ~port ~meth:"POST" ~path:"/v1/invoke"
    ~headers:[ "Content-Type", "application/json" ]
    ~body:(`String payload) ()

let invoke host port method_str args =
  let* status, body = invoke_raw host port method_str args in
  Fest.expect |> Fest.equal status 200;
  let parsed = Js.Json.parseExn body in
  Fest.expect |> Fest.equal (json_bool parsed "ok") true;
  Js.Promise.resolve
    (match json_string parsed "resultTransit" with
     | "" -> Wire.Nil
     | s -> Transit_codec.of_string s)

let invoke_import_db_binary_raw host port repo (payload : Node.Buffer.t) =
  http_request ~host ~port ~meth:"POST"
    ~path:("/v1/import-db-binary?repo=" ^ Js.Global.encodeURIComponent repo)
    ~headers:[ "Content-Type", "application/octet-stream" ]
    ~body:(`Buffer payload) ()

(* ---- sse client (cljs open-sse-events) ---- *)

type sse_client =
  { events : (string * Wire.t) list ref
  ; close : unit -> unit
  }

let open_sse_events host port =
  Js.Promise.make (fun ~resolve ~reject ->
      let events = ref [] in
      let buffer = ref "" in
      let req_cell = ref None in
      let opts = Js.Dict.empty () in
      Js.Dict.set opts "hostname" (Js.Json.string host);
      Js.Dict.set opts "port" (Js.Json.number (float_of_int port));
      Js.Dict.set opts "path" (Js.Json.string "/v1/events");
      Js.Dict.set opts "method" (Js.Json.string "GET");
      let req =
        Http_client.request (Js.Json.object_ opts) (fun [@u] res ->
            Http_client.res_on res "data" (fun [@u] chunk ->
                buffer := !buffer ^ Node.Buffer.toString (as_buffer chunk);
                let rec drain () =
                  match Js.String.indexOf ~search:"\n\n" !buffer with
                  | -1 -> ()
                  | idx ->
                      let event_str = String.sub !buffer 0 idx in
                      buffer :=
                        String.sub !buffer (idx + 2)
                          (String.length !buffer - idx - 2);
                      List.iter
                        (fun l ->
                           if String.length l > 6
                              && String.sub l 0 6 = "data: " then
                             let data =
                               String.sub l 6 (String.length l - 6)
                             in
                             let parsed = json_parse data in
                             let payload =
                               match json_field parsed "payload" with
                               | Some v ->
                                   (match Js.Json.decodeString v with
                                    | Some s -> Transit_codec.of_string s
                                    | None -> Wire.Nil)
                               | None -> Wire.Nil
                             in
                             events :=
                               !events
                               @ [ (json_string parsed "type", payload) ])
                        (String.split_on_char '\n' event_str);
                      drain ()
                in
                drain ());
            resolve
              { events
              ; close =
                  (fun () ->
                     match !req_cell with
                     | Some r -> (try Http_client.req_destroy r with _ -> ())
                     | None -> ()) } [@u])
      in
      req_cell := Some req;
      Http_client.req_on req "error"
        (fun [@u] e -> reject (exn_of_rejection e) [@u]);
      Http_client.req_end req)

let delay_ms ms =
  let task, resolver = Db_worker_effect.wait () in
  ignore
    (Timers.set_timeout ms (fun () -> Db_worker_effect.wakeup resolver ()));
  promise_of_task task

let rec wait_for_sse events pred max_tries =
  if pred !events || max_tries <= 0 then Js.Promise.resolve ()
  else
    let* () = delay_ms 50 in
    wait_for_sse events pred (max_tries - 1)

(* ---- paths/helpers ---- *)

let create_tmp_dir prefix = mkdtemp (Filename.concat (tmpdir ()) prefix)

let lock_path root_dir repo =
  let storage =
    Graph_lifecycle.resolve_storage ~root:root_dir
      ~graphs_dir:(Filename.concat root_dir "graphs")
  in
  Graph_lifecycle.ownership_path (Graph_lifecycle.context ~storage ~repo)

let log_path = Db_worker_log.log_path

let start_daemon ~root_dir ~repo ?owner_source ?log_level
    ?(create_empty_db = false) () =
  let graphs_dir = Filename.concat root_dir "graphs" in
  promise_of_task
    (Db_worker_effect.bind (Root_dir.ensure_root_dir root_dir) (fun root ->
         let storage = Graph_lifecycle.resolve_storage ~root ~graphs_dir in
         Db_worker_effect.bind
           (Graph_lifecycle.create_graph ~storage ~repo) (fun () ->
             Db_worker_node.start_daemon
               { Db_worker_node.opt_root_dir = root
               ; opt_graphs_dir = Some graphs_dir
               ; opt_lifecycle_dir = None
               ; opt_repo = repo
               ; opt_admission_ticket = None
               ; opt_graph_generation = None
               ; opt_create_empty_db = create_empty_db
               ; opt_owner_source = Option.value owner_source ~default:""
               ; opt_embedding_endpoint = None
               ; opt_embedding_model_id = None
               ; opt_log_level =
                   Some (Option.value log_level ~default:"error")
               ; opt_on_stopped = (fun _ -> ()) })))

let stop_daemon (d : Db_worker_node.daemon) =
  let* (_ : bool) = promise_of_task (d.Db_worker_node.stop ()) in
  Js.Promise.resolve ()

let stop_daemon_opt daemon =
  match !daemon with
  | Some d -> stop_daemon d
  | None -> Js.Promise.resolve ()

(* cljs normalize-db-worker-state fixture pieces that apply here. *)
let reset_daemon_state () =
  Db_worker_node.ready := false;
  Db_worker_node.sse_clients := [];
  Db_worker_node.stopping := false;
  Db_worker_log.uninstall ()

(* cljs async done + (is false (str "unexpected error" e)) + finally:
   the body runs, errors mark the test failed, cleanup always runs. *)
(* daemons held across two start_daemon! calls (cljs daemon-a/daemon-b
   pattern). *)
let stop_two a b =
  match !a, !b with
  | Some da', Some db' ->
      let* () = stop_daemon da' in
      stop_daemon db'
  | Some da', None -> stop_daemon da'
  | None, Some db' -> stop_daemon db'
  | None, None -> Js.Promise.resolve ()

(* cljs run-main-with-overrides. *)

exception Process_exit of int

let run_main ~argv ~start_daemon ?(on_log = fun _ -> ())
    ?(on_error = fun _ -> ()) () =
  let exit_code = ref None in
  let saved_argv = !Db_worker_node.argv_fn in
  let saved_exit = !Db_worker_node.exit_fn in
  let saved_log = !Db_worker_node.log_fn in
  let saved_error = !Db_worker_node.error_fn in
  let saved_start = !Db_worker_node.start_daemon_fn in
  Fun.protect
    (fun () ->
       Db_worker_node.argv_fn := (fun () -> argv);
       Db_worker_node.exit_fn :=
         (fun code -> exit_code := Some code; raise (Process_exit code));
       Db_worker_node.log_fn := on_log;
       Db_worker_node.error_fn := on_error;
       Db_worker_node.start_daemon_fn := start_daemon;
       (try Db_worker_node.main () with Process_exit _ -> ()))
    ~finally:(fun () ->
       Db_worker_node.argv_fn := saved_argv;
       Db_worker_node.exit_fn := saved_exit;
       Db_worker_node.log_fn := saved_log;
       Db_worker_node.error_fn := saved_error;
       Db_worker_node.start_daemon_fn := saved_start);
  !exit_code

let parse_argv_for argv =
  let saved = !Db_worker_node.argv_fn in
  Fun.protect
    (fun () ->
       Db_worker_node.argv_fn := (fun () -> argv);
       Db_worker_node.parse_argv ())
    ~finally:(fun () -> Db_worker_node.argv_fn := saved)

(* cljs escape-regex / contains-bold? *)
let escape_regex s =
  let special = function
    | '.' | '*' | '+' | '?' | '^' | '$' | '{' | '}' | '(' | ')' | '|'
    | '[' | ']' | '\\' -> true
    | _ -> false
  in
  let b = Buffer.create (String.length s) in
  String.iter
    (fun c ->
       if special c then Buffer.add_char b '\\';
       Buffer.add_char b c)
    s;
  Buffer.contents b

let contains_bold value token =
  let pattern =
    "\\u001b\\[[0-9;]*m" ^ escape_regex token ^ "\\u001b\\[[0-9;]*m"
  in
  Regexp.test (Regexp.compile pattern) value

(* cljs semantic-search-integration-enabled? *)
let semantic_search_enabled () =
  Node.Process.process##platform = "darwin"
  && Js.Dict.get process_env "LOGSEQ_EMBEDDINGS_URL" <> None

(* a wire vector for cljs [:k :v] event labels *)
let label k v = Wire.Array [ Wire.Keyword k; Wire.Keyword v ]

let kw k = Wire.Keyword k
let str s = Wire.String s
let kvs ps = Wire.kw_map ps

let is_map = function Wire.Map _ -> true | _ -> false

let seq_nonempty = function
  | Wire.Array (_ :: _) | Wire.List (_ :: _) | Wire.Set (_ :: _) -> true
  | _ -> false

let seq_empty w = not (seq_nonempty w)

let wire_list w = Wire.as_seq w

let block_uuid_in uuid results =
  List.exists
    (fun m -> Wire.get "block/uuid" m = Some (Wire.Uuid uuid))
    (wire_list results)

let block_uuid_first results =
  match wire_list results with
  | m :: _ -> Wire.get "block/uuid" m
  | [] -> None

let page_entity ~title ~name ~uuid ~now =
  kvs
    [ "block/uuid", Wire.Uuid uuid
    ; "block/title", str title
    ; "block/name", str name
    ; "block/tags", Wire.Set [ kw "logseq.class/Page" ]
    ; "block/created-at", now
    ; "block/updated-at", now ]

let block_entity ~title ~page_uuid ~parent_uuid ~order ~now uuid =
  kvs
    [ "block/uuid", Wire.Uuid uuid
    ; "block/title", str title
    ; "block/page",
      Wire.Array [ kvs [ "block/uuid", Wire.Uuid page_uuid ] ]
    ; "block/parent",
      Wire.Array [ kvs [ "block/uuid", Wire.Uuid parent_uuid ] ]
    ; "block/order", str order
    ; "block/created-at", now
    ; "block/updated-at", now ]

let transact_args repo txs =
  [ str repo; Wire.Array txs; Wire.Map []; Wire.Nil ]

let q_args repo q inputs = [ str repo; Wire.Array (str q :: inputs) ]

let title_query = "[:find ?e :in $ ?title :where [?e :block/title ?title]]"
let uuid_query = "[:find ?e :in $ ?uuid :where [?e :block/uuid ?uuid]]"

let std_argv extra = "node" :: "dist/db-worker-node.js" :: extra

(* remoteInvoke recorder for the stubbed-worker tests. *)
let record_invokes calls method_str args_transit =
  calls := !calls @ [ (method_str, Transit_codec.of_string args_transit) ];
  Db_worker_effect.pure (Transit_codec.to_string Wire.Nil)

(* nil-returning remoteInvoke (cljs p/resolved (ldb/write-transit-str nil)) *)
let nil_invokes _ _ =
  Db_worker_effect.pure (Transit_codec.to_string Wire.Nil)

(* The rebind must outlive the whole async thunk — the daemon's invokes
   fire after thunk () returns a pending promise. *)
let with_remote_invoke f thunk =
  let saved = !Db_worker_node.remote_invoke_fn in
  Db_worker_node.remote_invoke_fn := f;
  let restore () = Db_worker_node.remote_invoke_fn := saved in
  Js.Promise.catch
    (fun e ->
       restore ();
       Js.Promise.reject (exn_of_rejection e))
    (Js.Promise.then_ (fun v -> restore (); Js.Promise.resolve v) (thunk ()))

(* cljs tests stub platform storage :db-exists? — same with-redefs shape
   as with_remote_invoke. *)
let with_db_exists v thunk =
  let saved = !Db_worker_node.db_exists_fn in
  Db_worker_node.db_exists_fn := (fun ~repo:_ -> Db_worker_effect.pure v);
  let restore () = Db_worker_node.db_exists_fn := saved in
  Js.Promise.catch
    (fun e ->
       restore ();
       Js.Promise.reject (exn_of_rejection e))
    (Js.Promise.then_ (fun v -> restore (); Js.Promise.resolve v) (thunk ()))

(* ============================== tests ============================== *)

let () =
  (* ---- db-worker-node-root-dir-permission-error ---- *)
  Fest.Promise.test "db-worker-node-root-dir-permission-error" (fun () ->
      if Node.Process.process##platform = "win32" then Js.Promise.resolve ()
      else begin
        let data_dir = create_tmp_dir "db-worker-readonly" in
        let repo = "logseq_db_perm_" ^ random_suffix () in
        chmod_sync data_dir 365;
        start_daemon ~root_dir:data_dir ~repo ()
        |> Js.Promise.then_ (fun (_ : Db_worker_node.daemon) ->
               Fest.expect |> Fest.ok false;
               Js.Promise.resolve ())
        |> Js.Promise.catch (fun e ->
               let code = rejection_code e in
               Fest.expect |> Fest.equal code "root-dir-permission";
               let path =
                 match exn_of_rejection e with
                 | Dispatcher.Exn_info (_, kvs) ->
                     (match Db_worker_node.kv_get kvs "path" with
                      | Some (Wire.String p) -> p
                      | _ -> "")
                 | _ -> ""
               in
               Fest.expect |> Fest.equal path (resolve_path data_dir);
               Js.Promise.resolve ())
      end);

  (* ---- db-worker-node-creates-log-file ---- *)
  Fest.Promise.test "db-worker-node-creates-log-file" (fun () ->
      let daemon = ref None in
      let data_dir = create_tmp_dir "db-worker-log" in
      let repo = "logseq_db_log_" ^ random_suffix () in
      let log_file = log_path data_dir repo in
      let* d = start_daemon ~root_dir:data_dir ~repo () in
      daemon := Some d;
      let* () = delay_ms 50 in
      Fest.expect |> Fest.equal (exists_sync log_file) true;
      stop_daemon_opt daemon);

  (* ---- db-worker-node-log-file-has-entries ---- *)
  Fest.Promise.test "db-worker-node-log-file-has-entries" (fun () ->
      let daemon = ref None in
      let data_dir = create_tmp_dir "db-worker-log-entries" in
      let repo = "logseq_db_log_entries_" ^ random_suffix () in
      let log_file = log_path data_dir repo in
      let* d = start_daemon ~root_dir:data_dir ~repo () in
      daemon := Some d;
      let* status, _body =
        invoke_raw d.host d.port "thread-api/not-found" [ str repo; Wire.Nil ]
      in
      let* () = delay_ms 50 in
      let contents =
        if exists_sync log_file then read_file_utf8 log_file else ""
      in
      Fest.expect |> Fest.equal status 500;
      Fest.expect |> Fest.equal (exists_sync log_file) true;
      Fest.expect |> Fest.equal (String.length contents > 0) true;
      stop_daemon_opt daemon);

  (* ---- db-worker-node-logs-version-on-startup ---- *)
  Fest.Promise.test "db-worker-node-logs-version-on-startup" (fun () ->
      let daemon = ref None in
      let data_dir = create_tmp_dir "db-worker-log-version" in
      let repo = "logseq_db_log_version_" ^ random_suffix () in
      let log_file = log_path data_dir repo in
      let* d = start_daemon ~root_dir:data_dir ~repo ~log_level:"info" () in
      daemon := Some d;
      let* () = delay_ms 50 in
      let contents = read_file_utf8 log_file in
      Fest.expect |> Fest.equal (contains contents ":db-worker-node-version") true;
      Fest.expect
      |> Fest.equal
           (contains contents
              (":build-time " ^ pr_str_str (Common_version.build_time ())))
           true;
      Fest.expect
      |> Fest.equal
           (contains contents
              (":revision " ^ pr_str_str (Common_version.revision ())))
           true;
      stop_daemon_opt daemon);

  (* ---- db-worker-node-logs-println-output ---- *)
  Fest.Promise.test "db-worker-node-logs-println-output" (fun () ->
      let daemon = ref None in
      let data_dir = create_tmp_dir "db-worker-log-println" in
      let repo = "logseq_db_log_println_" ^ random_suffix () in
      let log_file = log_path data_dir repo in
      let message = "println output " ^ Uuid_gen.uuid () in
      let* d = start_daemon ~root_dir:data_dir ~repo () in
      daemon := Some d;
      Node_console.log message;
      let* () = delay_ms 50 in
      let contents = read_file_utf8 log_file in
      Fest.expect |> Fest.equal (contains contents message) true;
      stop_daemon_opt daemon);

  (* ---- db-worker-node-logs-console-error-output ---- *)
  Fest.Promise.test "db-worker-node-logs-console-error-output" (fun () ->
      let daemon = ref None in
      let data_dir = create_tmp_dir "db-worker-log-console-error" in
      let repo = "logseq_db_log_console_error_" ^ random_suffix () in
      let log_file = log_path data_dir repo in
      let message = "console error output " ^ Uuid_gen.uuid () in
      let* d = start_daemon ~root_dir:data_dir ~repo () in
      daemon := Some d;
      Node_console.error message;
      let* () = delay_ms 50 in
      let contents = read_file_utf8 log_file in
      Fest.expect |> Fest.equal (contains contents message) true;
      stop_daemon_opt daemon);

  (* ---- db-worker-node-logs-console-number-output ---- *)
  Fest.Promise.test "db-worker-node-logs-console-number-output" (fun () ->
      let daemon = ref None in
      let data_dir = create_tmp_dir "db-worker-log-console-number" in
      let repo = "logseq_db_log_console_number_" ^ random_suffix () in
      let log_file = log_path data_dir repo in
      let* d = start_daemon ~root_dir:data_dir ~repo () in
      daemon := Some d;
      Node_console.error "123";
      let* () = delay_ms 50 in
      let contents = read_file_utf8 log_file in
      Fest.expect |> Fest.equal (contains contents "123") true;
      stop_daemon_opt daemon);

  (* ---- db-worker-node-logs-process-stdout-output ---- *)
  Fest.Promise.test "db-worker-node-logs-process-stdout-output" (fun () ->
      let daemon = ref None in
      let data_dir = create_tmp_dir "db-worker-log-stdout" in
      let repo = "logseq_db_log_stdout_" ^ random_suffix () in
      let log_file = log_path data_dir repo in
      let message = "stdout output " ^ Uuid_gen.uuid () in
      let* d = start_daemon ~root_dir:data_dir ~repo () in
      daemon := Some d;
      process_stdout_write (message ^ "\n");
      let* () = delay_ms 50 in
      let contents = read_file_utf8 log_file in
      Fest.expect |> Fest.equal (contains contents message) true;
      stop_daemon_opt daemon);

  (* ---- db-worker-node-log-retention ---- *)
  Fest.Promise.test "db-worker-node-log-retention" (fun () ->
      let data_dir = create_tmp_dir "db-worker-log-retention" in
      let repo = "logseq_db_log_retention_" ^ random_suffix () in
      let repo_dir =
        match Graph_dir.repo_to_encoded_graph_dir_name repo with
        | Some dir -> Filename.concat data_dir dir
        | None -> failwith ("invalid repo " ^ repo)
      in
      let days =
        [ "20240101"; "20240102"; "20240103"; "20240104"; "20240105"
        ; "20240106"; "20240107"; "20240108"; "20240109" ]
      in
      mkdir_recursive repo_dir;
      List.iter
        (fun day ->
           write_file_sync
             (Filename.concat repo_dir ("db-worker-node-" ^ day ^ ".log"))
             "log\n")
        days;
      let* () = promise_of_task (Db_worker_log.enforce_retention repo_dir) in
      let log_re = Regexp.compile "^db-worker-node-[0-9]{8}\\.log$" in
      let remaining =
        readdir_sync repo_dir
        |> Array.to_list
        |> List.filter (Regexp.test log_re)
        |> List.sort compare
      in
      Fest.expect |> Fest.equal (List.length remaining) 7;
      Fest.expect
      |> Fest.equal
           (remaining
            = [ "db-worker-node-20240103.log"; "db-worker-node-20240104.log"
              ; "db-worker-node-20240105.log"; "db-worker-node-20240106.log"
              ; "db-worker-node-20240107.log"; "db-worker-node-20240108.log"
              ; "db-worker-node-20240109.log" ])
           true;
      Js.Promise.resolve ());

  (* ---- parse-args tests ---- *)
  (* the OCaml cli_opts record carries no host/port/auth-token/
     rtc-ws-url/server-list-file fields at all — the cljs nil?
     assertions become unnecessary; the kept keys are checked. *)

  Fest.test "db-worker-node-parse-args-ignores-host-and-port" (fun () ->
      reset_daemon_state ();
      let result =
        parse_argv_for
          (std_argv
             [ "--host"; "0.0.0.0"; "--port"; "1234"; "--repo"
             ; "logseq_db_parse_args"; "--root-dir"; "/tmp/logseq-root" ])
      in
      Fest.expect
      |> Fest.equal
           (result.Db_worker_node.repo = Some "logseq_db_parse_args")
           true;
      Fest.expect
      |> Fest.equal result.Db_worker_node.root_dir
           (Some "/tmp/logseq-root"));

  Fest.test "db-worker-node-parse-args-ignores-auth-token" (fun () ->
      reset_daemon_state ();
      let result =
        parse_argv_for
          (std_argv
             [ "--auth-token"; "secret"; "--root-dir"; "/tmp/logseq-root" ])
      in
      Fest.expect
      |> Fest.equal result.Db_worker_node.root_dir
           (Some "/tmp/logseq-root"));

  Fest.test "db-worker-node-parse-args-ignores-rtc-ws-url" (fun () ->
      reset_daemon_state ();
      let result =
        parse_argv_for
          (std_argv
             [ "--rtc-ws-url"; "ws://example.com"; "--repo"
             ; "logseq_db_parse_args" ])
      in
      Fest.expect
      |> Fest.equal result.Db_worker_node.repo
           (Some "logseq_db_parse_args"));

  Fest.test "db-worker-node-parse-args-recognizes-create-empty-db" (fun () ->
      reset_daemon_state ();
      let result =
        parse_argv_for
          (std_argv
             [ "--repo"; "logseq_db_parse_args"; "--create-empty-db" ])
      in
      Fest.expect
      |> Fest.equal
           (result.Db_worker_node.repo = Some "logseq_db_parse_args")
           true;
      Fest.expect
      |> Fest.equal result.Db_worker_node.create_empty_db true);

  Fest.test "db-worker-node-parse-args-ignores-server-list-file" (fun () ->
      reset_daemon_state ();
      let result =
        parse_argv_for
          (std_argv
             [ "--repo"; "logseq_db_parse_args"; "--root-dir"
             ; "/tmp/logseq-root"; "--server-list-file"
             ; "/tmp/server-list" ])
      in
      Fest.expect
      |> Fest.equal
           (result.Db_worker_node.repo = Some "logseq_db_parse_args")
           true;
      Fest.expect
      |> Fest.equal result.Db_worker_node.root_dir
           (Some "/tmp/logseq-root"));

  Fest.test "db-worker-node-parse-args-recognizes-version" (fun () ->
      reset_daemon_state ();
      let result = parse_argv_for (std_argv [ "--version" ]) in
      Fest.expect |> Fest.equal result.Db_worker_node.version true;
      Fest.expect |> Fest.equal (result.Db_worker_node.repo = None) true);

  (* ---- db-worker-node-main-version-exits-early-without-repo ---- *)
  Fest.test "db-worker-node-main-version-exits-early-without-repo" (fun () ->
      reset_daemon_state ();
      let start_called = ref false in
      let logs = ref [] in
      let exit_code =
        run_main
          ~argv:(std_argv [ "--version" ])
          ~on_log:(fun s -> logs := !logs @ [ s ])
          ~start_daemon:(fun _ ->
            start_called := true;
            Db_worker_effect.error (Failure "should-not-start-daemon"))
          ()
      in
      let output = String.concat "\n" !logs in
      Fest.expect |> Fest.equal (exit_code = Some 0) true;
      Fest.expect |> Fest.equal !start_called false;
      Fest.expect |> Fest.equal (contains output "Revision:") true;
      reset_daemon_state ());

  (* ---- db-worker-node-main-missing-root-dir-prints-error-and-exits-1 ---- *)
  Fest.test "db-worker-node-main-missing-root-dir-prints-error-and-exits-1"
    (fun () ->
       reset_daemon_state ();
       let start_called = ref false in
       let stdout = ref [] in
       let stderr = ref [] in
       let exit_code =
         run_main
           ~argv:(std_argv [ "--repo"; "logseq_db_missing_root" ])
           ~on_log:(fun s -> stdout := !stdout @ [ s ])
           ~on_error:(fun s -> stderr := !stderr @ [ s ])
           ~start_daemon:(fun _ ->
             start_called := true;
             Db_worker_effect.error (Failure "should-not-start-daemon"))
           ()
       in
       Fest.expect |> Fest.equal (exit_code = Some 1) true;
       Fest.expect |> Fest.equal !start_called false;
       Fest.expect |> Fest.equal (!stdout = []) true;
       Fest.expect
       |> Fest.equal
            (List.exists (fun l -> contains l "root-dir is required")
               !stderr)
            true;
       reset_daemon_state ());

  (* ---- db-worker-node-main-missing-repo-prints-error-and-exits-1 ---- *)
  Fest.test "db-worker-node-main-missing-repo-prints-error-and-exits-1"
    (fun () ->
       reset_daemon_state ();
       let start_called = ref false in
       let stdout = ref [] in
       let stderr = ref [] in
       let exit_code =
         run_main
           ~argv:(std_argv [ "--root-dir"; "/tmp/logseq-root" ])
           ~on_log:(fun s -> stdout := !stdout @ [ s ])
           ~on_error:(fun s -> stderr := !stderr @ [ s ])
           ~start_daemon:(fun _ ->
             start_called := true;
             Db_worker_effect.error (Failure "should-not-start-daemon"))
           ()
       in
       Fest.expect |> Fest.equal (exit_code = Some 1) true;
       Fest.expect |> Fest.equal !start_called false;
       Fest.expect |> Fest.equal (!stdout = []) true;
       Fest.expect
       |> Fest.equal
            (List.exists (fun l -> contains l "repo is required") !stderr)
            true;
       reset_daemon_state ());

  (* ---- db-worker-node-owner-source-cli-is-published ---- *)
  Fest.Promise.test "db-worker-node-owner-source-cli-is-published" (fun () ->
      let daemon = ref None in
      let data_dir = create_tmp_dir "db-worker-owner-source-cli" in
      let repo = "logseq_db_owner_cli_" ^ random_suffix () in
      let* d = start_daemon ~root_dir:data_dir ~repo ~owner_source:"cli" () in
      daemon := Some d;
      let* _status, body = http_get d.host d.port "/healthz" in
      let lock_json = Js.Json.parseExn body in
      Fest.expect
      |> Fest.equal (json_string lock_json "owner-source") "cli";
      stop_daemon_opt daemon);

  (* ---- db-worker-node-owner-source-electron-is-published ---- *)
  Fest.Promise.test "db-worker-node-owner-source-electron-is-published"
    (fun () ->
       let daemon = ref None in
       let data_dir = create_tmp_dir "db-worker-owner-source-electron" in
       let repo = "logseq_db_owner_electron_" ^ random_suffix () in
       let* d =
         start_daemon ~root_dir:data_dir ~repo ~owner_source:"electron" ()
       in
       daemon := Some d;
       let* _status, body = http_get d.host d.port "/healthz" in
       let lock_json = Js.Json.parseExn body in
       Fest.expect
       |> Fest.equal (json_string lock_json "owner-source") "electron";
       stop_daemon_opt daemon);

  (* ---- db-worker-node-handle-event-encodes-sse-json-payload ---- *)
  Fest.test "db-worker-node-handle-event-encodes-sse-json-payload" (fun () ->
      reset_daemon_state ();
      let writes = ref [] in
      Db_worker_node.sse_clients :=
        [ { Db_worker_node.sink_id = -1
          ; write = (fun m -> writes := !writes @ [ m ])
          ; close = (fun () -> ()) } ];
      Db_worker_node.handle_event "sync-db-changes"
        (Transit_codec.to_string (kvs [ "repo", str "graph-a" ]));
      Fest.expect |> Fest.equal (List.length !writes) 1;
      let raw = List.hd !writes in
      (* strip "data: " prefix and "\n\n" suffix *)
      let event_json = String.sub raw 6 (String.length raw - 8) in
      let parsed = Js.Json.parseExn event_json in
      Fest.expect
      |> Fest.equal (json_string parsed "type") "sync-db-changes";
      let payload = Transit_codec.of_string (json_string parsed "payload") in
      Fest.expect
      |> Fest.equal (payload = kvs [ "repo", str "graph-a" ]) true;
      reset_daemon_state ());

  (* ---- db-worker-node-handle-event-preserves-namespaced-type ---- *)
  Fest.test "db-worker-node-handle-event-preserves-namespaced-type" (fun () ->
      reset_daemon_state ();
      let writes = ref [] in
      Db_worker_node.sse_clients :=
        [ { Db_worker_node.sink_id = -1
          ; write = (fun m -> writes := !writes @ [ m ])
          ; close = (fun () -> ()) } ];
      Db_worker_node.handle_event "db-worker/ui-request"
        (Transit_codec.to_string (kvs [ "request-id", str "r1" ]));
      Fest.expect |> Fest.equal (List.length !writes) 1;
      let raw = List.hd !writes in
      let event_json = String.sub raw 6 (String.length raw - 8) in
      let parsed = Js.Json.parseExn event_json in
      Fest.expect
      |> Fest.equal (json_string parsed "type") "db-worker/ui-request";
      let payload = Transit_codec.of_string (json_string parsed "payload") in
      Fest.expect
      |> Fest.equal (payload = kvs [ "request-id", str "r1" ]) true;
      reset_daemon_state ());

  (* ---- db-worker-node-help-documents-required-root-dir-and-omits-server-list-file ---- *)
  Fest.test
    "db-worker-node-help-documents-required-root-dir-and-omits-server-list-file"
    (fun () ->
       reset_daemon_state ();
       let lines = ref [] in
       let saved_log = !Db_worker_node.log_fn in
       let saved_color = !Cli_style.color_enabled_override in
       Fun.protect
         (fun () ->
            Cli_style.color_enabled_override := Some true;
            Db_worker_node.log_fn := (fun s -> lines := !lines @ [ s ]);
            Db_worker_node.show_help ())
         ~finally:(fun () ->
            Db_worker_node.log_fn := saved_log;
            Cli_style.color_enabled_override := saved_color);
       let output = String.concat "\n" !lines in
       let plain = Cli_style.strip_ansi output in
       Fest.expect
       |> Fest.equal (contains plain "--auth-token") false;
       Fest.expect
       |> Fest.equal (contains plain "--rtc-ws-url") false;
       Fest.expect
       |> Fest.equal (contains plain "--server-list-file") false;
       Fest.expect
       |> Fest.equal (contains plain "(default ~/logseq)") false;
       Fest.expect
       |> Fest.equal
            (Regexp.test
               (Regexp.compile "\\u001b\\[[0-9;]*moptions\\u001b\\[[0-9;]*m:")
               output)
            true;
       Fest.expect |> Fest.equal (contains_bold output "db-worker-node") true;
       Fest.expect |> Fest.equal (contains_bold output "--root-dir") true;
       Fest.expect |> Fest.equal (contains_bold output "--repo") true;
       Fest.expect |> Fest.equal (contains plain "--root-dir") true;
       Fest.expect |> Fest.equal (contains plain "(required)") true;
       Fest.expect |> Fest.equal (contains plain "--create-empty-db") true;
       Fest.expect |> Fest.equal (contains_bold output "--create-empty-db") true;
       Fest.expect |> Fest.equal (contains_bold output "--rtc-ws-url") false;
       Fest.expect |> Fest.equal (contains_bold output "--log-level") true;
       reset_daemon_state ());

  (* ---- db-worker-node-start-daemon-uses-empty-datoms-when-create-empty-enabled ---- *)
  Fest.Promise.test
    "db-worker-node-start-daemon-uses-empty-datoms-when-create-empty-enabled"
    (fun () ->
       let daemon = ref None in
       let data_dir = create_tmp_dir "db-worker-create-empty-start" in
       let repo = "logseq_db_create_empty_start_" ^ random_suffix () in
       let invoke_calls = ref [] in
       with_remote_invoke (record_invokes invoke_calls) (fun () ->
           with_db_exists false (fun () ->
               let run =
                 let* d =
                   start_daemon ~root_dir:data_dir ~repo ~create_empty_db:true
                     ~log_level:"error" ()
             in
             daemon := Some d;
             Fest.expect
             |> Fest.equal
                  (List.hd !invoke_calls = ("thread-api/init", Wire.Array []))
                  true;
                 Fest.expect
                 |> Fest.equal
                      (List.nth !invoke_calls 1
                       = ( "thread-api/create-or-open-db"
                         , Wire.Array
                             [ str repo
                             ; kvs
                                 [ "datoms", Wire.Array []
                                 ; "sync-download-graph?", Wire.Bool true ] ] ))
                      true;
                 stop_daemon_opt daemon
               in
               run)));

  (* ---- db-worker-node-start-daemon-uses-default-startup-opts-without-create-empty ---- *)
  Fest.Promise.test
    "db-worker-node-start-daemon-uses-default-startup-opts-without-create-empty"
    (fun () ->
       let daemon = ref None in
       let data_dir = create_tmp_dir "db-worker-default-start" in
       let repo = "logseq_db_default_start_" ^ random_suffix () in
       let invoke_calls = ref [] in
       with_remote_invoke (record_invokes invoke_calls) (fun () ->
           with_db_exists true (fun () ->
               let* d =
                 start_daemon ~root_dir:data_dir ~repo ~log_level:"error" ()
               in
               daemon := Some d;
               Fest.expect
               |> Fest.equal
                    (List.hd !invoke_calls = ("thread-api/init", Wire.Array []))
                    true;
               Fest.expect
               |> Fest.equal
                    (List.nth !invoke_calls 1
                     = ( "thread-api/create-or-open-db"
                       , Wire.Array [ str repo; Wire.Map [] ] ))
                    true;
               stop_daemon_opt daemon)));

  (* ---- db-worker-node-start-daemon-defers-open-for-new-graph ---- *)
  Fest.Promise.test "db-worker-node-start-daemon-defers-open-for-new-graph"
    (fun () ->
       let daemon = ref None in
       let data_dir = create_tmp_dir "db-worker-defer-open" in
       let repo = "logseq_db_defer_open_" ^ random_suffix () in
       let invoke_calls = ref [] in
       with_remote_invoke (record_invokes invoke_calls) (fun () ->
           with_db_exists false (fun () ->
               let* d =
                 start_daemon ~root_dir:data_dir ~repo ~log_level:"error" ()
               in
               daemon := Some d;
               Fest.expect
               |> Fest.equal
                    (!invoke_calls = [ ("thread-api/init", Wire.Array []) ])
                    true;
               stop_daemon_opt daemon)));

  (* ---- db-worker-node-stop-closes-bound-repo ---- *)
  Fest.Promise.test "db-worker-node-stop-closes-bound-repo" (fun () ->
      let data_dir = create_tmp_dir "db-worker-stop-close-db" in
      let repo = "logseq_db_stop_close_" ^ random_suffix () in
      let invoke_calls = ref [] in
      with_remote_invoke (record_invokes invoke_calls) (fun () ->
          with_db_exists true (fun () ->
              let* d =
                start_daemon ~root_dir:data_dir ~repo ~log_level:"error" ()
              in
              let* () = stop_daemon d in
          Fest.expect
          |> Fest.equal
               (List.hd !invoke_calls = ("thread-api/init", Wire.Array []))
               true;
          Fest.expect
          |> Fest.equal
               (List.nth !invoke_calls 1
                = ( "thread-api/create-or-open-db"
                  , Wire.Array [ str repo; Wire.Map [] ] ))
               true;
              Fest.expect
              |> Fest.equal
                   (List.nth !invoke_calls (List.length !invoke_calls - 1)
                    = ("thread-api/close-db", Wire.Array [ str repo ]))
                   true;
              Js.Promise.resolve ())));

  (* ---- db-worker-node-stop-retains-publication-until-process-exit ---- *)
  Fest.Promise.test
    "db-worker-node-stop-retains-publication-until-process-exit" (fun () ->
      let data_dir = create_tmp_dir "db-worker-server-list" in
      let repo = "logseq_db_server_list_" ^ random_suffix () in
      let server_list_file = Server_list.path data_dir in
      with_remote_invoke nil_invokes (fun () ->
          with_db_exists true (fun () ->
              let* d =
                start_daemon ~root_dir:data_dir ~repo ~log_level:"error" ()
              in
              let after_start = read_file_utf8 server_list_file in
          Fest.expect
          |> Fest.equal
               (contains after_start
                  (string_of_int (Node_process.pid ())
                   ^ " " ^ string_of_int d.Db_worker_node.port))
               true;
              let* () = stop_daemon d in
              let after_stop =
                if exists_sync server_list_file
                then read_file_utf8 server_list_file
                else ""
              in
              Fest.expect
              |> Fest.equal
                   (contains after_stop
                      (string_of_int (Node_process.pid ())
                       ^ " " ^ string_of_int d.Db_worker_node.port))
                   true;
              Js.Promise.resolve ())));

  (* ---- db-worker-node-repo-error-handles-keyword-methods ---- *)
  Fest.test "db-worker-node-repo-error-handles-keyword-methods" (fun () ->
      reset_daemon_state ();
      let bound_repo = "logseq_db_bound" in
      let repo_error method_str args =
        Db_worker_node.repo_error ~method_str (Wire.Array args) bound_repo
      in
      Fest.expect
      |> Fest.equal
           (repo_error "thread-api/list-db" [] = None)
           true;
      Fest.expect
      |> Fest.equal
           (repo_error "thread-api/get-db-sync-config" [] = None)
           true;
      Fest.expect
      |> Fest.equal
           (repo_error "thread-api/sync-app-state"
                [ kvs [ "auth/id-token", str "token" ] ]
            = None)
           true;
      Fest.expect
      |> Fest.equal
           (repo_error "thread-api/db-sync-list-remote-graphs" [] = None)
           true;
      Fest.expect
      |> Fest.equal
           (repo_error "thread-api/set-context"
                [ kvs [ "repo", str "not-a-repo-arg" ] ]
            = None)
           true;
      Fest.expect
      |> Fest.equal
           (repo_error "thread-api/resolve-ui-request"
                [ str "req-id"; kvs [ "password", str "pw" ] ]
            = None)
           true;
      Fest.expect
      |> Fest.equal
           (repo_error "thread-api/reject-ui-request"
                [ str "req-id"; kvs [ "code", kw "cancelled" ] ]
            = None)
           true;
      Fest.expect
      |> Fest.equal
           (repo_error "thread-api/cancel-ui-requests"
                [ kvs [ "context", kw "logout" ] ]
            = None)
           true;
      (* missing repo -> 400 {:code :missing-repo} *)
      let check_missing res =
        match res with
        | Some (status, error) ->
            Fest.expect |> Fest.equal status 400;
            Fest.expect
            |> Fest.equal
                 (Wire.get "code" error
                  = Some (Wire.Keyword "missing-repo"))
                 true;
            Fest.expect
            |> Fest.equal
                 (Wire.get "message" error
                  = Some (Wire.String "repo is required"))
                 true
        | None -> Fest.expect |> Fest.ok false
      in
      check_missing (repo_error "thread-api/create-or-open-db" []);
      check_missing
        (repo_error "thread-api/create-or-open-db" [ kw "public-key" ]);
      Fest.expect
      |> Fest.equal
           (repo_error "thread-api/create-or-open-db" [ str "bound" ]
            = None)
           true;
      (match repo_error "thread-api/create-or-open-db" [ str "other" ] with
       | Some (status, error) ->
           Fest.expect |> Fest.equal status 409;
           Fest.expect
           |> Fest.equal
                (Wire.get "code" error
                 = Some (Wire.Keyword "repo-mismatch"))
                true;
           Fest.expect
           |> Fest.equal
                (Wire.get "message" error
                 = Some (Wire.String "repo does not match bound repo"))
                true;
           Fest.expect
           |> Fest.equal
                (Wire.get "repo" error = Some (Wire.String "other"))
                true;
           Fest.expect
           |> Fest.equal
                (Wire.get "bound-repo" error
                 = Some (Wire.String bound_repo))
                true
       | None -> Fest.expect |> Fest.ok false);
      reset_daemon_state ());

  (* ---- db-worker-node-set-context-does-not-trigger-repo-mismatch ---- *)
  Fest.Promise.test
    "db-worker-node-set-context-does-not-trigger-repo-mismatch" (fun () ->
      let daemon = ref None in
      let data_dir = create_tmp_dir "db-worker-set-context" in
      let repo = "logseq_db_set_context_" ^ random_suffix () in
      let* d = start_daemon ~root_dir:data_dir ~repo () in
      daemon := Some d;
      let* _ =
        invoke d.host d.port "thread-api/set-db-sync-config"
          [ kvs [ "ws-url", str "wss://example.com/sync/%s" ] ]
      in
      let* _ =
        invoke d.host d.port "thread-api/sync-app-state"
          [ kvs [ "auth/id-token", str "token-value" ] ]
      in
      let* config =
        invoke d.host d.port "thread-api/get-db-sync-config" []
      in
      Fest.expect
      |> Fest.equal
           (Wire.get "ws-url" config
            = Some (Wire.String "wss://example.com/sync/%s"))
           true;
      Fest.expect
      |> Fest.equal (Wire.get "auth-token" config = None) true;
      let* result =
        invoke d.host d.port "thread-api/set-context"
          [ kvs [ "app", str "desktop" ] ]
      in
      Fest.expect |> Fest.equal (result = Wire.Nil) true;
      stop_daemon_opt daemon);

  (* ---- db-worker-node-create-empty-startup-skips-built-in-initial-data ---- *)
  Fest.Promise.test
    "db-worker-node-create-empty-startup-skips-built-in-initial-data"
    (fun () ->
       let daemon = ref None in
       let data_dir = create_tmp_dir "db-worker-empty-initial-data" in
       let repo = "logseq_db_empty_initial_" ^ random_suffix () in
       let* d =
         start_daemon ~root_dir:data_dir ~repo ~create_empty_db:true ()
       in
       daemon := Some d;
       let* result =
         invoke d.host d.port "thread-api/q"
           (q_args repo title_query [ str Ldb.library_page_name ])
       in
       Fest.expect |> Fest.equal (seq_empty result) true;
       stop_daemon_opt daemon);

  (* ---- db-worker-node-sync-status-requires-repo-and-returns-structured-status ---- *)
  Fest.Promise.test
    "db-worker-node-sync-status-requires-repo-and-returns-structured-status"
    (fun () ->
       let daemon = ref None in
       let data_dir = create_tmp_dir "db-worker-sync-status" in
       let repo = "logseq_db_sync_status_" ^ random_suffix () in
       let* d = start_daemon ~root_dir:data_dir ~repo () in
       daemon := Some d;
       let* status, body =
         invoke_raw d.host d.port "thread-api/db-sync-status" []
       in
       let parsed = Js.Json.parseExn body in
       Fest.expect |> Fest.equal status 400;
       Fest.expect |> Fest.equal (json_bool parsed "ok") false;
       Fest.expect
       |> Fest.equal (json_string_in parsed [ "error"; "code" ])
            "missing-repo";
       let* _ =
         invoke d.host d.port "thread-api/create-or-open-db"
           [ str repo; Wire.Map [] ]
       in
       let* status_result =
         invoke d.host d.port "thread-api/db-sync-status" [ str repo ]
       in
       Fest.expect
       |> Fest.equal
            (Wire.get "repo" status_result = Some (Wire.String repo))
            true;
       List.iter
         (fun k ->
            Fest.expect
            |> Fest.equal (Wire.get k status_result <> None) true)
         [ "ws-state"; "pending-local"; "pending-asset"; "pending-server"
         ; "local-tx"; "remote-tx"; "graph-id" ];
       stop_daemon_opt daemon);

  (* ---- db-worker-node-sync-start-and-status-invoke-path ---- *)
  Fest.Promise.test "db-worker-node-sync-start-and-status-invoke-path"
    (fun () ->
       let daemon = ref None in
       let data_dir = create_tmp_dir "db-worker-sync-start" in
       let repo = "logseq_db_sync_start_" ^ random_suffix () in
       let* d = start_daemon ~root_dir:data_dir ~repo () in
       daemon := Some d;
       let* _ =
         invoke d.host d.port "thread-api/create-or-open-db"
           [ str repo; Wire.Map [] ]
       in
       let* _ =
         invoke d.host d.port "thread-api/set-db-sync-config"
           [ kvs
               [ "ws-url", Wire.Nil
               ; "http-base", str "https://example.com" ] ]
       in
       let* start_result =
         invoke d.host d.port "thread-api/db-sync-start" [ str repo ]
       in
       let* status_result =
         invoke d.host d.port "thread-api/db-sync-status" [ str repo ]
       in
       Fest.expect |> Fest.equal (start_result = Wire.Nil) true;
       Fest.expect
       |> Fest.equal
            (Wire.get "repo" status_result = Some (Wire.String repo))
            true;
       Fest.expect
       |> Fest.equal
            (Wire.get "ws-state" status_result
             = Some (Wire.Keyword "inactive"))
            true;
       Fest.expect
       |> Fest.equal (Wire.get "pending-local" status_result <> None) true;
       Fest.expect
       |> Fest.equal (Wire.get "pending-server" status_result <> None) true;
       stop_daemon_opt daemon);

  (* ---- db-worker-node-daemon-smoke-test ---- *)
  Fest.Promise.test "db-worker-node-daemon-smoke-test" (fun () ->
      let daemon = ref None in
      let data_dir = create_tmp_dir "db-worker-daemon" in
      let repo = "logseq_db_smoke_" ^ random_suffix () in
      let server_list_file = Server_list.path data_dir in
      let now = now_ms () in
      let page_uuid = Uuid_gen.uuid () in
      let block_uuid = Uuid_gen.uuid () in
      let* d = start_daemon ~root_dir:data_dir ~repo () in
      daemon := Some d;
      let* health_status, health_body_str = http_get d.host d.port "/healthz" in
      let* readyz_status, _ = http_get d.host d.port "/readyz" in
      let health = Js.Json.parseExn health_body_str in
      let server_list_contents = read_file_utf8 server_list_file in
      Fest.expect |> Fest.equal health_status 200;
      Fest.expect |> Fest.equal readyz_status 404;
      Fest.expect |> Fest.equal (json_string health "repo") repo;
      Fest.expect |> Fest.equal (json_string health "status") "ready";
      Fest.expect |> Fest.equal (json_string health "host") d.host;
      Fest.expect |> Fest.equal (json_get_in health [ "port" ] <> None) true;
      Fest.expect |> Fest.equal (json_get_in health [ "pid" ] <> None) true;
      (* daemon root-dir is canonicalized via fs.realpathSync *)
      Fest.expect
      |> Fest.equal (json_string health "root-dir") (realpath_sync data_dir);
      Fest.expect
      |> Fest.equal (json_get_in health [ "owner-source" ] <> None) true;
      Fest.expect
      |> Fest.equal
           (match json_get_in health [ "ticket" ] with
            | Some v -> Js.Json.decodeString v <> None
            | None -> false)
           true;
      Fest.expect
      |> Fest.equal
           (match json_get_in health [ "generation" ] with
            | Some v -> Js.Json.decodeString v <> None
            | None -> false)
           true;
      Fest.expect
      |> Fest.equal (json_get_in health [ "revision" ] <> None) true;
      Fest.expect
      |> Fest.equal
           (contains server_list_contents
              (string_of_int (Node_process.pid ()) ^ " "))
           true;
      let* _ =
        invoke d.host d.port "thread-api/create-or-open-db"
          [ str repo; Wire.Map [] ]
      in
      let* dbs = invoke d.host d.port "thread-api/list-db" [] in
      Fest.expect
      |> Fest.equal
           (List.exists
              (fun m -> Wire.get "name" m = Some (Wire.String repo))
              (wire_list dbs))
           true;
      Fest.expect
      |> Fest.equal (exists_sync (lock_path data_dir repo)) true;
      Fest.expect
      |> Fest.equal (json_string health "ownership-protocol") "sqlite-v1";
      Fest.expect
      |> Fest.equal (json_get_in health [ "lock-id" ] = None) true;
      let* _ =
        invoke d.host d.port "thread-api/transact"
          (transact_args repo
             [ page_entity ~title:"Smoke Page" ~name:"smoke-page"
                 ~uuid:page_uuid ~now
             ; block_entity ~title:"Smoke Test" ~page_uuid
                 ~parent_uuid:page_uuid ~order:"a0" ~now block_uuid ])
      in
      let* result =
        invoke d.host d.port "thread-api/q"
          (q_args repo uuid_query [ Wire.Uuid block_uuid ])
      in
      Fest.expect |> Fest.equal (seq_nonempty result) true;
      let* () = stop_daemon_opt daemon in
      Fest.expect
      |> Fest.equal (exists_sync (lock_path data_dir repo)) true;
      let contents =
        if exists_sync server_list_file
        then read_file_utf8 server_list_file
        else ""
      in
      Fest.expect
      |> Fest.equal
           (contains contents (string_of_int (Node_process.pid ()) ^ " "))
           true;
      Js.Promise.resolve ());

  (* ---- db-worker-node-vector-search-finds-outline-context-after-rebuild ---- *)
  Fest.Promise.test
    "db-worker-node-vector-search-finds-outline-context-after-rebuild"
    (fun () ->
       if not (semantic_search_enabled ()) then begin
         (* cljs (is true "Skipping ...") *)
         Fest.expect |> Fest.ok true;
         Js.Promise.resolve ()
       end
       else begin
         let daemon = ref None in
         let data_dir = create_tmp_dir "db-worker-vector-search" in
         let repo = "logseq_db_vector_search_" ^ random_suffix () in
         let now = now_ms () in
         let page_uuid = Uuid_gen.uuid () in
         let manu_uuid = Uuid_gen.uuid () in
         let manu_team_uuid = Uuid_gen.uuid () in
         let tony_uuid = Uuid_gen.uuid () in
         let tony_team_uuid = Uuid_gen.uuid () in
         let* d = start_daemon ~root_dir:data_dir ~repo () in
         daemon := Some d;
         let* _ =
           invoke d.host d.port "thread-api/create-or-open-db"
             [ str repo; Wire.Map [] ]
         in
         let* _ =
           invoke d.host d.port "thread-api/transact"
             (transact_args repo
                [ page_entity ~title:"Teams" ~name:"teams" ~uuid:page_uuid
                    ~now
                ; block_entity ~title:"which team is Manu in?" ~page_uuid
                    ~parent_uuid:page_uuid ~order:"a0" ~now manu_uuid
                ; block_entity ~title:"Spurs" ~page_uuid
                    ~parent_uuid:manu_uuid ~order:"a0" ~now manu_team_uuid
                ; block_entity ~title:"Which team is Tony in?" ~page_uuid
                    ~parent_uuid:page_uuid ~order:"b0" ~now tony_uuid
                ; block_entity ~title:"Spurs" ~page_uuid
                    ~parent_uuid:tony_uuid ~order:"c0" ~now tony_team_uuid ])
         in
         let* _ =
           invoke d.host d.port
             "thread-api/search-build-blocks-indice-in-worker"
             [ str repo; Wire.Bool true ]
         in
         let* manu_results =
           invoke d.host d.port "thread-api/search-blocks"
             [ str repo; str "manu spurs"; kvs [ "limit", Wire.Int 10 ] ]
         in
         let* tony_results =
           invoke d.host d.port "thread-api/search-blocks"
             [ str repo; str "tony spurs"; kvs [ "limit", Wire.Int 10 ] ]
         in
         Fest.expect
         |> Fest.equal (block_uuid_in manu_uuid manu_results) true;
         Fest.expect
         |> Fest.equal
              (block_uuid_first manu_results
               = Some (Wire.Uuid manu_uuid))
              true;
         Fest.expect
         |> Fest.equal (block_uuid_in tony_uuid tony_results) true;
         Fest.expect
         |> Fest.equal
              (block_uuid_first tony_results
               = Some (Wire.Uuid tony_uuid))
              true;
         stop_daemon_opt daemon
       end);

  (* ---- db-worker-node-import-edn ---- *)
  Fest.Promise.test "db-worker-node-import-edn" (fun () ->
      let daemon_a = ref None in
      let daemon_b = ref None in
      let data_dir = create_tmp_dir "db-worker-import-edn" in
      let repo_a = "logseq_db_import_edn_a_" ^ random_suffix () in
      let repo_b = "logseq_db_import_edn_b_" ^ random_suffix () in
      let now = now_ms () in
      let page_uuid = Uuid_gen.uuid () in
      (let* d = start_daemon ~root_dir:data_dir ~repo:repo_a () in
       daemon_a := Some d;
       let* _ =
         invoke d.host d.port "thread-api/create-or-open-db"
           [ str repo_a; Wire.Map [] ]
       in
       let* _ =
         invoke d.host d.port "thread-api/transact"
           (transact_args repo_a
              [ page_entity ~title:"Import Page" ~name:"import-page"
                  ~uuid:page_uuid ~now ])
       in
       let* export_edn =
         invoke d.host d.port "thread-api/export-edn"
           [ str repo_a; kvs [ "export-type", kw "graph" ] ]
       in
       Fest.expect |> Fest.equal (is_map export_edn) true;
       let* () = stop_daemon_opt daemon_a in
       let* d = start_daemon ~root_dir:data_dir ~repo:repo_b () in
       daemon_b := Some d;
       let* _ =
         invoke d.host d.port "thread-api/create-or-open-db"
           [ str repo_b; Wire.Map [] ]
       in
       let* _ =
         invoke d.host d.port "thread-api/import-edn"
           [ str repo_b; export_edn ]
       in
       let* result =
         invoke d.host d.port "thread-api/q"
           (q_args repo_b title_query [ str "Import Page" ])
       in
       Fest.expect |> Fest.equal (seq_nonempty result) true;
       stop_two daemon_a daemon_b)
      |> Js.Promise.catch (fun e ->
             Fest.expect |> Fest.equal (err_str e) "<no error>";
             Js.Promise.resolve ()));

  (* ---- db-worker-node-import-file-graph-posts-progress-over-sse ---- *)
  Fest.Promise.test "db-worker-node-import-file-graph-posts-progress-over-sse"
    (fun () ->
       let daemon = ref None in
       let sse = ref None in
       let data_dir = create_tmp_dir "db-worker-import-file-graph" in
       let repo = "logseq_db_import_file_" ^ random_suffix () in
       let config_file =
         kvs [ "path", str "logseq/config.edn"; "file/content", str "{}" ]
       in
       let files =
         Wire.Array
           [ config_file
           ; kvs
               [ "path", str "pages/Home.md"
               ; "file/content", str "- imported from desktop" ] ]
       in
       (let* d = start_daemon ~root_dir:data_dir ~repo () in
        daemon := Some d;
        let* _ =
          invoke d.host d.port "thread-api/create-or-open-db"
            [ str repo; Wire.Map [] ]
        in
        let* sse_client = open_sse_events d.host d.port in
        sse := Some sse_client;
        let* result =
          invoke d.host d.port "thread-api/import-file-graph"
            [ str repo; config_file; files; kvs [ "user-options", Wire.Map [] ] ]
        in
        let* () =
          wait_for_sse sse_client.events
            (fun events ->
               List.exists
                 (fun (type_, payload) ->
                    type_ = "thread-api/set-ui-state"
                    && Wire.nth payload 0
                       = Some (label "graph/importing-state" "label")
                    && Wire.nth payload 1 = Some (kw "import/validating-graph"))
                 events)
            80
        in
        let ui_state =
          List.filter_map
            (fun (type_, payload) ->
               if type_ = "thread-api/set-ui-state" then Some payload
               else None)
            !(sse_client.events)
        in
        let current_pages =
          List.filter_map
            (fun p ->
               if Wire.nth p 0
                  = Some (label "graph/importing-state" "current-page")
               then Wire.nth p 1
               else None)
            ui_state
        in
        let* page_result =
          invoke d.host d.port "thread-api/q"
            (q_args repo title_query [ str "imported from desktop" ])
        in
        Fest.expect |> Fest.equal (is_map result) true;
        Fest.expect
        |> Fest.equal
             (Wire.get "persisted?" result = Some (Wire.Bool true))
             true;
        Fest.expect
        |> Fest.equal
             (match Wire.get "status" result with
              | Some (Wire.Keyword s) ->
                  s = "completed" || s = "completed-with-errors"
              | _ -> false)
             true;
        Fest.expect
        |> Fest.equal
             (match Wire.get "issue-count" result with
              | Some (Wire.Int n) -> n >= 0
              | Some (Wire.Int64 n) -> n >= 0L
              | _ -> false)
             true;
        Fest.expect
        |> Fest.equal
             (List.exists
                (fun v -> v = Wire.String "pages/Home.md")
                current_pages)
             true;
        Fest.expect
        |> Fest.equal
             (List.exists
                (fun p ->
                   Wire.nth p 0 = Some (label "graph/importing-state" "label")
                   && Wire.nth p 1 = Some (kw "import/finishing"))
                ui_state)
             true;
        Fest.expect |> Fest.equal (seq_nonempty page_result) true;
        (match !sse with Some c -> c.close () | None -> ());
        stop_daemon_opt daemon)
       |> Js.Promise.catch (fun e ->
              (match !sse with Some c -> c.close () | None -> ());
              Fest.expect |> Fest.equal (err_str e) "<no error>";
              Js.Promise.resolve ()));

  (* ---- write-electron-lazy-file-graph + electron-lazy-import-files ---- *)
  (* cljs uses common-graph/get-files to enumerate .md/.org files; the
     fixture writes exactly logseq/config.edn and pages/Home.md, so the
     relative/absolute pairs are listed directly. *)

  (* ---- db-worker-node-import-file-graph-electron-lazy-fs-path ---- *)
  Fest.Promise.test
    "db-worker-node-import-file-graph-electron-lazy-fs-path" (fun () ->
      let daemon = ref None in
      let data_dir = create_tmp_dir "db-worker-import-electron-lazy" in
      let graph_dir = create_tmp_dir "electron-lazy-file-graph" in
      let logseq_dir = Filename.concat graph_dir "logseq" in
      let pages_dir = Filename.concat graph_dir "pages" in
      mkdir_recursive logseq_dir;
      mkdir_recursive pages_dir;
      let config_abs = Filename.concat logseq_dir "config.edn" in
      let home_abs = Filename.concat pages_dir "Home.md" in
      write_file_sync config_abs "{}";
      write_file_sync home_abs "- imported via fs-path\n";
      let repo = "logseq_db_import_lazy_" ^ random_suffix () in
      let files =
        Wire.Array
          [ kvs [ "path", str "logseq/config.edn"; "fs-path", str config_abs ]
          ; kvs [ "path", str "pages/Home.md"; "fs-path", str home_abs ] ]
      in
      let config_file =
        kvs [ "path", str "logseq/config.edn"; "fs-path", str config_abs ]
      in
      (let* d = start_daemon ~root_dir:data_dir ~repo () in
       daemon := Some d;
       let* _ =
         invoke d.host d.port "thread-api/create-or-open-db"
           [ str repo; Wire.Map [] ]
       in
       let* result =
         invoke d.host d.port "thread-api/import-file-graph"
           [ str repo; config_file; files; kvs [ "user-options", Wire.Map [] ] ]
       in
       let* page_result =
         invoke d.host d.port "thread-api/q"
           (q_args repo title_query [ str "imported via fs-path" ])
       in
       Fest.expect |> Fest.equal (is_map result) true;
       Fest.expect
       |> Fest.equal
            (Wire.get "persisted?" result = Some (Wire.Bool true))
            true;
       Fest.expect
       |> Fest.equal
            (match Wire.get "status" result with
             | Some (Wire.Keyword s) ->
                 s = "completed" || s = "completed-with-errors"
             | _ -> false)
            true;
       Fest.expect |> Fest.equal (seq_nonempty page_result) true;
       stop_daemon_opt daemon)
      |> Js.Promise.catch (fun e ->
             Fest.expect |> Fest.equal (err_str e) "<no error>";
             stop_daemon_opt daemon));

  (* ---- db-worker-node-import-db-binary ---- *)
  Fest.Promise.test "db-worker-node-import-db-binary" (fun () ->
      let daemon_a = ref None in
      let daemon_b = ref None in
      let data_dir = create_tmp_dir "db-worker-import-sqlite" in
      let repo_a = "logseq_db_import_sqlite_a_" ^ random_suffix () in
      let repo_b = "logseq_db_import_sqlite_b_" ^ random_suffix () in
      let now = now_ms () in
      let page_uuid = Uuid_gen.uuid () in
      (let* d = start_daemon ~root_dir:data_dir ~repo:repo_a () in
       daemon_a := Some d;
       let* _ =
         invoke d.host d.port "thread-api/create-or-open-db"
           [ str repo_a; Wire.Map [] ]
       in
       let* _ =
         invoke d.host d.port "thread-api/transact"
           (transact_args repo_a
              [ page_entity ~title:"SQLite Import Page"
                  ~name:"sqlite-import-page" ~uuid:page_uuid ~now ])
       in
       let* export_binary =
         invoke d.host d.port "thread-api/export-db-binary" [ str repo_a ]
       in
       (match export_binary with
        | Wire.Binary bytes ->
            Fest.expect |> Fest.equal (String.length bytes > 0) true
        | _ -> Fest.expect |> Fest.ok false);
       let* () = stop_daemon_opt daemon_a in
       let* d = start_daemon ~root_dir:data_dir ~repo:repo_b () in
       daemon_b := Some d;
       let* _ =
         invoke d.host d.port "thread-api/import-db-binary"
           [ str repo_b; export_binary ]
       in
       let* _ =
         invoke d.host d.port "thread-api/create-or-open-db"
           [ str repo_b; Wire.Map [] ]
       in
       let* result =
         invoke d.host d.port "thread-api/q"
           (q_args repo_b title_query [ str "SQLite Import Page" ])
       in
       Fest.expect |> Fest.equal (seq_nonempty result) true;
       stop_two daemon_a daemon_b)
      |> Js.Promise.catch (fun e ->
             Fest.expect |> Fest.equal (err_str e) "<no error>";
             stop_two daemon_a daemon_b));

  (* ---- db-worker-node-import-db-binary-accepts-raw-request-body ---- *)
  Fest.Promise.test
    "db-worker-node-import-db-binary-accepts-raw-request-body" (fun () ->
      let daemon_a = ref None in
      let daemon_b = ref None in
      let data_dir = create_tmp_dir "db-worker-import-sqlite-raw" in
      let repo_a = "logseq_db_import_sqlite_raw_a_" ^ random_suffix () in
      let repo_b = "logseq_db_import_sqlite_raw_b_" ^ random_suffix () in
      let now = now_ms () in
      let page_uuid = Uuid_gen.uuid () in
      (let* d = start_daemon ~root_dir:data_dir ~repo:repo_a () in
       daemon_a := Some d;
       let* _ =
         invoke d.host d.port "thread-api/create-or-open-db"
           [ str repo_a; Wire.Map [] ]
       in
       let* _ =
         invoke d.host d.port "thread-api/transact"
           (transact_args repo_a
              [ page_entity ~title:"Raw SQLite Import Page"
                  ~name:"raw-sqlite-import-page" ~uuid:page_uuid ~now ])
       in
       let* export_binary =
         invoke d.host d.port "thread-api/export-db-binary" [ str repo_a ]
       in
       let binary_bytes =
         match export_binary with
         | Wire.Binary bytes ->
             Fest.expect |> Fest.equal (String.length bytes > 0) true;
             bytes
         | _ -> Fest.expect |> Fest.ok false; ""
       in
       let* () = stop_daemon_opt daemon_a in
       let* d = start_daemon ~root_dir:data_dir ~repo:repo_b () in
       daemon_b := Some d;
       let* status, body =
         invoke_import_db_binary_raw d.host d.port repo_b
           (Node.Buffer.fromStringWithEncoding binary_bytes
              ~encoding:`binary)
       in
       let parsed = Js.Json.parseExn body in
       let* _ =
         invoke d.host d.port "thread-api/create-or-open-db"
           [ str repo_b; Wire.Map [] ]
       in
       let* result =
         invoke d.host d.port "thread-api/q"
           (q_args repo_b title_query [ str "Raw SQLite Import Page" ])
       in
       Fest.expect |> Fest.equal status 200;
       Fest.expect |> Fest.equal (json_bool parsed "ok") true;
       Fest.expect |> Fest.equal (seq_nonempty result) true;
       stop_two daemon_a daemon_b)
      |> Js.Promise.catch (fun e ->
             Fest.expect |> Fest.equal (err_str e) "<no error>";
             stop_two daemon_a daemon_b));

  (* ---- db-worker-node-export-client-ops-db-binary ---- *)
  Fest.Promise.test "db-worker-node-export-client-ops-db-binary" (fun () ->
      let daemon = ref None in
      let data_dir = create_tmp_dir "db-worker-export-client-ops" in
      let repo = "logseq_db_export_client_ops_" ^ random_suffix () in
      (let* d = start_daemon ~root_dir:data_dir ~repo () in
       daemon := Some d;
       let* _ =
         invoke d.host d.port "thread-api/create-or-open-db"
           [ str repo; Wire.Map [] ]
       in
       let* export_binary =
         invoke d.host d.port "thread-api/export-client-ops-db-binary"
           [ str repo ]
       in
       (match export_binary with
        | Wire.Binary bytes ->
            Fest.expect |> Fest.equal (String.length bytes > 0) true;
            let decoded =
              Node.Buffer.fromStringWithEncoding bytes ~encoding:`binary
            in
            Fest.expect
            |> Fest.equal
                 (Node.Buffer.toString (buffer_subarray decoded 0 16))
                 "SQLite format 3\000"
        | _ -> Fest.expect |> Fest.ok false);
       stop_daemon_opt daemon)
      |> Js.Promise.catch (fun e ->
             Fest.expect |> Fest.equal (err_str e) "<no error>";
             stop_daemon_opt daemon));

  (* ---- db-worker-node-backup-db-sqlite ---- *)
  Fest.Promise.test "db-worker-node-backup-db-sqlite" (fun () ->
      let daemon_a = ref None in
      let daemon_b = ref None in
      let data_dir = create_tmp_dir "db-worker-backup-sqlite" in
      let repo_a = "logseq_db_backup_sqlite_a_" ^ random_suffix () in
      let repo_b = "logseq_db_backup_sqlite_b_" ^ random_suffix () in
      let backup_path =
        Filename.concat (Filename.concat data_dir "backup") "snapshot.sqlite"
      in
      let now = now_ms () in
      let page_uuid = Uuid_gen.uuid () in
      (let* d = start_daemon ~root_dir:data_dir ~repo:repo_a () in
       daemon_a := Some d;
       let* _ =
         invoke d.host d.port "thread-api/create-or-open-db"
           [ str repo_a; Wire.Map [] ]
       in
       let* _ =
         invoke d.host d.port "thread-api/transact"
           (transact_args repo_a
              [ page_entity ~title:"Backup Source Page"
                  ~name:"backup-source-page" ~uuid:page_uuid ~now ])
       in
       let* backup_result =
         invoke d.host d.port "thread-api/backup-db-sqlite"
           [ str repo_a; str backup_path ]
       in
       Fest.expect
       |> Fest.equal
            (Wire.get "path" backup_result
             = Some (Wire.String backup_path))
            true;
       Fest.expect |> Fest.equal (exists_sync backup_path) true;
       let backup_binary = read_file_buf backup_path in
       Fest.expect
       |> Fest.equal (buffer_byte_length backup_binary > 0) true;
       let backup_bytes =
         Node.Buffer.toString backup_binary ~encoding:`binary
       in
       let* () = stop_daemon_opt daemon_a in
       let* d = start_daemon ~root_dir:data_dir ~repo:repo_b () in
       daemon_b := Some d;
       let* _ =
         invoke d.host d.port "thread-api/import-db-binary"
           [ str repo_b; Wire.Binary backup_bytes ]
       in
       let* _ =
         invoke d.host d.port "thread-api/create-or-open-db"
           [ str repo_b; Wire.Map [] ]
       in
       let* result =
         invoke d.host d.port "thread-api/q"
           (q_args repo_b title_query [ str "Backup Source Page" ])
       in
       Fest.expect |> Fest.equal (seq_nonempty result) true;
       stop_two daemon_a daemon_b)
      |> Js.Promise.catch (fun e ->
             Fest.expect |> Fest.equal (err_str e) "<no error>";
             stop_two daemon_a daemon_b));

  (* ---- db-worker-node-accepts-prefix-equivalent-repo-test ---- *)
  Fest.Promise.test "db-worker-node-accepts-prefix-equivalent-repo-test"
    (fun () ->
       let daemon = ref None in
       let data_dir = create_tmp_dir "db-worker-prefix-equivalent" in
       let bound_repo = "demo" in
       let requested_repo = "logseq_db_demo" in
       let* d =
         start_daemon ~root_dir:data_dir ~repo:bound_repo
           ~create_empty_db:true ()
       in
       daemon := Some d;
       let* status, body =
         invoke_raw d.host d.port "thread-api/create-or-open-db"
           [ str requested_repo; Wire.Map [] ]
       in
       let parsed = Js.Json.parseExn body in
       Fest.expect |> Fest.equal status 200;
       Fest.expect |> Fest.equal (json_bool parsed "ok") true;
       stop_daemon_opt daemon);

  (* ---- db-worker-node-repo-mismatch-test ---- *)
  Fest.Promise.test "db-worker-node-repo-mismatch-test" (fun () ->
      let daemon = ref None in
      let data_dir = create_tmp_dir "db-worker-repo-mismatch" in
      let repo = "logseq_db_mismatch_" ^ random_suffix () in
      let other_repo = repo ^ "_other" in
      let* d = start_daemon ~root_dir:data_dir ~repo () in
      daemon := Some d;
      let* status, body =
        invoke_raw d.host d.port "thread-api/create-or-open-db"
          [ str other_repo; Wire.Map [] ]
      in
      let parsed = Js.Json.parseExn body in
      Fest.expect |> Fest.equal status 409;
      Fest.expect |> Fest.equal (json_bool parsed "ok") false;
      Fest.expect
      |> Fest.equal (json_string_in parsed [ "error"; "code" ])
           "repo-mismatch";
      stop_daemon_opt daemon);

  (* ---- db-worker-node-lock-prevents-multiple-daemons ---- *)
  Fest.Promise.test "db-worker-node-lock-prevents-multiple-daemons" (fun () ->
      let daemon = ref None in
      let data_dir = create_tmp_dir "db-worker-lock" in
      let repo = "logseq_db_lock_" ^ random_suffix () in
      let* d = start_daemon ~root_dir:data_dir ~repo () in
      daemon := Some d;
      let* () =
        start_daemon ~root_dir:data_dir ~repo ()
        |> Js.Promise.then_ (fun (_ : Db_worker_node.daemon) ->
               Fest.expect |> Fest.ok false;
               Js.Promise.resolve ())
        |> Js.Promise.catch (fun e ->
               Fest.expect
               |> Fest.equal (rejection_code e) "repo-locked";
               Js.Promise.resolve ())
      in
      stop_daemon_opt daemon);

  (* ---- db-worker-node-ownership-covers-import-backup-and-reopen ---- *)
  Fest.Promise.test
    "db-worker-node-ownership-covers-import-backup-and-reopen" (fun () ->
      let daemon = ref None in
      let data_dir = create_tmp_dir "db-worker-ownership-import" in
      let repo = "logseq_db_demo" in
      let storage =
        Graph_lifecycle.resolve_storage ~root:data_dir
          ~graphs_dir:(Filename.concat data_dir "graphs")
      in
      let ctx = Graph_lifecycle.context ~storage ~repo in
      let acquire_code () =
        try
          let _h = Graph_lifecycle.acquire_ownership ctx in
          (* cljs returns nil when acquisition succeeds *)
          let h = Graph_lifecycle.acquire_ownership ctx in
          Graph_lifecycle.release h;
          ""
        with e -> exn_error_code e
      in
      let* d = start_daemon ~root_dir:data_dir ~repo () in
      daemon := Some d;
      let* _ =
        invoke d.host d.port "thread-api/create-or-open-db"
          [ str repo; Wire.Map [] ]
      in
      let* binary =
        invoke d.host d.port "thread-api/export-db-binary" [ str repo ]
      in
      let* _ =
        invoke d.host d.port "thread-api/import-db-binary" [ str repo; binary ]
      in
      let* _ =
        invoke d.host d.port "thread-api/backup-db-sqlite"
          [ str repo; str (Filename.concat data_dir "backup.sqlite") ]
      in
      let* _ =
        invoke d.host d.port "thread-api/close-db" [ str repo ]
      in
      Fest.expect |> Fest.equal (acquire_code ()) "repo-locked";
      let* _ =
        invoke d.host d.port "thread-api/create-or-open-db"
          [ str repo; Wire.Map [] ]
      in
      Fest.expect |> Fest.equal (acquire_code ()) "repo-locked";
      Fest.expect |> Fest.equal (exists_sync (lock_path data_dir repo)) true;
      let* () = stop_daemon_opt daemon in
      (* after stop, acquisition succeeds; release the handle *)
      let h = Graph_lifecycle.acquire_ownership ctx in
      Graph_lifecycle.release h;
      Js.Promise.resolve ());

  (* ---- db-worker-node-mutations-require-retained-ownership ---- *)
  Fest.Promise.test "db-worker-node-mutations-require-retained-ownership"
    (fun () ->
       let daemon = ref None in
       let data_dir = create_tmp_dir "db-worker-ownership-guard" in
       let repo = "logseq_db_demo" in
       let saved = !Db_worker_node.assert_ownership_fn in
       let restore () = Db_worker_node.assert_ownership_fn := saved in
       (let* d = start_daemon ~root_dir:data_dir ~repo () in
        daemon := Some d;
        let* _ =
          invoke d.host d.port "thread-api/create-or-open-db"
            [ str repo; Wire.Map [] ]
        in
        let* binary =
          invoke d.host d.port "thread-api/export-db-binary" [ str repo ]
        in
        Db_worker_node.assert_ownership_fn :=
          (fun _ ->
             raise
               (Dispatcher.Exn_info
                  ( "Graph ownership transaction was lost"
                  , [ Wire.Keyword "code", Wire.Keyword "repo-locked" ] )));
        let calls =
          [ "thread-api/import-db-binary", [ str repo; binary ]
          ; "thread-api/backup-db-sqlite",
            [ str repo; str (Filename.concat data_dir "backup.sqlite") ]
          ; "thread-api/apply-outliner-ops",
            [ str repo; Wire.Array []; Wire.Map [] ] ]
        in
        let rec loop = function
          | [] -> Js.Promise.resolve ()
          | (method_str, args) :: rest ->
              let* status, _body = invoke_raw d.host d.port method_str args in
              Fest.expect |> Fest.equal status 409;
              loop rest
        in
        loop calls)
       |> Js.Promise.catch (fun e ->
              Fest.expect |> Fest.equal (err_str e) "<no error>";
              Js.Promise.resolve ())
       |> Js.Promise.then_ (fun () ->
              restore ();
              stop_daemon_opt daemon));

  (* ---- db-worker-node-desktop-and-cli-share-same-graph-daemon ---- *)
  (* cli-server/ensure-server! is cljs-only; the OCaml port exercises the
     same reuse path inline: server-list entry -> /healthz -> invoke on
     that port. *)
  Fest.Promise.test "db-worker-node-desktop-and-cli-share-same-graph-daemon"
    (fun () ->
       let daemon = ref None in
       let data_dir = create_tmp_dir "db-worker-desktop-cli" in
       let server_list_file = Server_list.path data_dir in
       let repo = "logseq_db_desktop_cli_" ^ random_suffix () in
       let now = now_ms () in
       let page_uuid = Uuid_gen.uuid () in
       let* d = start_daemon ~root_dir:data_dir ~repo () in
       daemon := Some d;
       let* _ =
         invoke d.host d.port "thread-api/create-or-open-db"
           [ str repo; Wire.Map [] ]
       in
       let* _ =
         invoke d.host d.port "thread-api/transact"
           (transact_args repo
              [ page_entity ~title:"Desktop+CLI Shared"
                  ~name:"desktop-cli-shared" ~uuid:page_uuid ~now ])
       in
       Fest.expect |> Fest.equal (exists_sync server_list_file) true;
       Fest.expect
       |> Fest.equal
            (contains (read_file_utf8 server_list_file)
               (string_of_int (Node_process.pid ())
                ^ " " ^ string_of_int d.Db_worker_node.port))
            true;
       let* _status, health_body_str = http_get d.host d.port "/healthz" in
       let _health_revision =
         json_string (Js.Json.parseExn health_body_str) "revision"
       in
       (* ensure-server! reuse path: the registered server answers
          /healthz and serves invokes. *)
       let* entries =
         promise_of_task (Server_list.read_entries server_list_file)
       in
       let entry =
         List.find
           (fun (e : Server_list.entry) ->
              e.Server_list.pid = Node_process.pid ()
              && e.Server_list.port = d.Db_worker_node.port)
           entries
       in
       let* _health_status, _ =
         http_get "127.0.0.1" entry.Server_list.port "/healthz"
       in
       let* result =
         invoke "127.0.0.1" entry.Server_list.port "thread-api/q"
           (q_args repo title_query [ str "Desktop+CLI Shared" ])
       in
       Fest.expect |> Fest.equal (seq_nonempty result) true;
       stop_daemon_opt daemon);

  (* ---- db-worker-node-validation-error-returns-400 ---- *)
  Fest.Promise.test "db-worker-node-validation-error-returns-400" (fun () ->
      let daemon = ref None in
      let data_dir = create_tmp_dir "db-worker-validation-error" in
      let repo = "logseq_db_validation_" ^ random_suffix () in
      let* d = start_daemon ~root_dir:data_dir ~repo () in
      daemon := Some d;
      let* _ =
        invoke d.host d.port "thread-api/create-or-open-db"
          [ str repo; Wire.Map [] ]
      in
      let* journal =
        invoke d.host d.port "thread-api/pull"
          [ str repo; Wire.Array [ kw "db/id" ]
          ; Wire.Array [ kw "db/ident"; kw "logseq.class/Journal" ] ]
      in
      let journal_id =
        match Wire.get "db/id" journal with
        | Some (Wire.Int n) -> n
        | Some (Wire.Int64 n) -> Int64.to_int n
        | _ -> Fest.expect |> Fest.ok false; 0
      in
      let now = now_ms () in
      let page_uuid = Uuid_gen.uuid () in
      let block_uuid = Uuid_gen.uuid () in
      let* _ =
        invoke d.host d.port "thread-api/transact"
          (transact_args repo
             [ page_entity ~title:"Validation Target Page"
                 ~name:"validation-target-page" ~uuid:page_uuid ~now
             ; block_entity ~title:"Validation Target Block" ~page_uuid
                 ~parent_uuid:page_uuid ~order:"a0" ~now block_uuid ])
      in
      let* status, body =
        invoke_raw d.host d.port "thread-api/apply-outliner-ops"
          [ str repo
          ; Wire.Array
              [ Wire.Array
                  [ kw "batch-set-property"
                  ; Wire.Array
                      [ Wire.Array [ Wire.Uuid block_uuid ]
                      ; kw "block/tags"
                      ; Wire.Int journal_id
                      ; Wire.Map [] ] ] ]
          ; Wire.Map [] ]
      in
      let parsed = Js.Json.parseExn body in
      Fest.expect |> Fest.equal status 400;
      Fest.expect |> Fest.equal (json_bool parsed "ok") false;
      Fest.expect
      |> Fest.equal
           (contains (json_string_in parsed [ "error"; "message" ])
              "Can't set tag")
           true;
      stop_daemon_opt daemon);

  (* ---- db-worker-node-query-validate-error-returns-400-with-invalid-query-code ---- *)
  Fest.Promise.test
    "db-worker-node-query-validate-error-returns-400-with-invalid-query-code"
    (fun () ->
       let daemon = ref None in
       let data_dir = create_tmp_dir "db-worker-query-validate-error" in
       let repo = "logseq_db_query_validate_" ^ random_suffix () in
       let* d = start_daemon ~root_dir:data_dir ~repo () in
       daemon := Some d;
       let* _ =
         invoke d.host d.port "thread-api/create-or-open-db"
           [ str repo; Wire.Map [] ]
       in
       let* status, body =
         invoke_raw d.host d.port "thread-api/q"
           [ str repo
           ; Wire.Array
               [ str
                   "[:find (pull ?e ...) :where [?e :block/title \"Status\"]]" ] ]
       in
       let parsed = Js.Json.parseExn body in
       Fest.expect |> Fest.equal status 400;
       Fest.expect |> Fest.equal (json_bool parsed "ok") false;
       Fest.expect
       |> Fest.equal (json_string_in parsed [ "error"; "code" ])
            "invalid-query";
       Fest.expect
       |> Fest.equal
            (contains (json_string_in parsed [ "error"; "message" ])
               "Query for unknown vars")
            true;
       stop_daemon_opt daemon);

  (* ---- db-worker-node-opening-graph-does-not-run-maintenance ---- *)
  Fest.Promise.test "db-worker-node-opening-graph-does-not-run-maintenance"
    (fun () ->
       let daemon = ref None in
       let data_dir = create_tmp_dir "db-worker-no-startup-maintenance" in
       let repo = "logseq_db_no_startup_maintenance_" ^ random_suffix () in
       let* d1 = start_daemon ~root_dir:data_dir ~repo () in
       let* _ =
         invoke d1.host d1.port "thread-api/create-or-open-db"
           [ str repo; Wire.Map [] ]
       in
       let* _ =
         invoke d1.host d1.port "thread-api/transact"
           (transact_args repo
              [ kvs
                  [ "db/ident", kw "logseq.kv/graph-last-gc-at"
                  ; "kv/value", Wire.Int 0 ] ])
       in
       let* () = stop_daemon d1 in
       let* d2 = start_daemon ~root_dir:data_dir ~repo () in
       daemon := Some d2;
       let* last_gc_at =
         invoke d2.host d2.port "thread-api/get-key-value"
           [ str repo; kw "logseq.kv/graph-last-gc-at" ]
       in
       Fest.expect
       |> Fest.equal
            (match last_gc_at with
             | Wire.Int 0 -> true
             | Wire.Int64 0L -> true
             | _ -> false)
            true;
       stop_daemon_opt daemon);

  (* ---- close-bound-repo-releases-db-after-sync-stop-fails ---- *)
  Fest.Promise.test "close-bound-repo-releases-db-after-sync-stop-fails"
    (fun () ->
       reset_daemon_state ();
       let calls = ref [] in
       let proxy =
         { Db_worker_node.remote_invoke =
             (fun method_str _args_transit ->
                calls := !calls @ [ method_str ];
                if method_str = "thread-api/db-sync-stop" then
                  Db_worker_effect.error (Failure "sync close failed")
                else
                  Db_worker_effect.pure (Transit_codec.to_string Wire.Nil))
         ; remote_invoke_binary =
             (fun _ _ _ -> Db_worker_effect.pure Wire.Nil) }
       in
       promise_of_task (Db_worker_node.close_bound_repo proxy "demo")
       |> Js.Promise.then_ (fun _ ->
              Fest.expect |> Fest.ok false;
              Js.Promise.resolve ())
       |> Js.Promise.catch (fun e ->
              Fest.expect
              |> Fest.equal (exn_message (exn_of_rejection e))
                   "sync close failed";
              Fest.expect
              |> Fest.equal
                   (!calls
                    = [ "thread-api/db-sync-stop"; "thread-api/close-db" ])
                   true;
              Js.Promise.resolve ())
       |> Js.Promise.then_ (fun () ->
              reset_daemon_state ();
              Js.Promise.resolve ()))
