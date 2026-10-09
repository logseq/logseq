(* JS entry for the db-worker bundle.

   In Node the bundle is a library required by db-worker-node
   (init/invoke/registered/set_post_fn/main exports).

   In a dedicated web worker the bundle IS the worker — replacing the
   cljs db-worker shell: it installs the worker.js globals
   (lightning-fs self.pfs, used by runtime/melange/asset_store.ml),
   registers every endpoint, exposes the Comlink proxy object the UI
   thread calls, and sends the keepAlive ping. *)

let init () = Worker_core.init ()

let registered name = Dispatcher.registered name

(* Node daemon entry (cljs db_worker_node/main): takes over argv
   parsing, graph-lifecycle admission, the http+SSE surface and
   graceful shutdown. Only called when the bundle is run as the
   db-worker-node process replacement. *)
let main () = Db_worker_node.main ()

(* node embedder hook: the cljs db-worker-node wrapper registers its
   /v1/events event-fn here (cljs platform :broadcast :post-message!) so
   Broadcast.to_clients reaches SSE clients. *)
let set_post_fn f = Broadcast.set_post_fn f

(* ==== standalone browser worker ==== *)

(* Comlink.expose installs the remote-call endpoint on self;
   Comlink.transfer marks a value's buffer as transferable so export
   payloads cross without copying. *)
external comlink_expose : 'a -> unit = "expose" [@@mel.module "comlink"]
external comlink_transfer : 'a -> 'b array -> 'a = "transfer"
  [@@mel.module "comlink"]

type global
external global_this : global = "globalThis"

external global_get : global -> string -> 'a Js.Undefined.t = ""
  [@@mel.get_index]

external global_set : global -> string -> 'a -> unit = ""
  [@@mel.set_index]

external prop : 'a -> string -> 'b Js.Undefined.t = "" [@@mel.get_index]
external call1 : 'a -> 'b -> 'c -> 'd Js.Undefined.t = "call" [@@mel.send]

let get_path root keys =
  List.fold_left
    (fun acc key ->
       match Js.Undefined.toOption acc with
       | Some v -> prop v key
       | None -> acc)
    (Js.Undefined.return root) keys

(* cljs `read-transit-str` reachable when a cljs runtime shares the
   process (node daemon, browser worker); decodes the tagged error transit
   into a real ExceptionInfo so `ex-data` works on the rejection. *)
let decode_error_exn (transit : string) : exn Js.Undefined.t =
  match
    Js.Undefined.toOption
      (get_path global_this
         [ "logseq"; "db"; "sqlite"; "util"; "read_transit_str" ])
  with
  | Some read -> call1 read Js.Undefined.empty transit
  | None -> Js.Undefined.empty

let rejection_of_exn name exn =
  let transit =
    try Some (Transit_codec.to_string (Dispatcher.encode_error name exn))
    with _ -> None
  in
  match transit with
  | Some t -> (
      match Js.Undefined.toOption (decode_error_exn t) with
      | Some decoded -> decoded
      | None -> exn)
  | None -> exn

let invoke name transit_args =
  Worker_core.init ();
  Js.Promise.make (fun ~resolve ~reject ->
      Db_worker_effect.on_any
        (Worker_core.invoke name transit_args)
        (fun result -> resolve result [@u])
        (fun exn -> reject (rejection_of_exn name exn) [@u]))

let bootstrap_flag = "__logseq_db_worker_bootstrap_loaded__"

(* cljs remoteInvoke — the Comlink-exposed call the UI thread makes
   with (qualified-name, transit-args) -> transit-string promise. *)
let remote_invoke_js =
  fun [@u] name transit_args ->
    Js.Promise.make (fun ~resolve ~reject ->
        Db_worker_effect.on_any
          (Worker_core.remote_invoke name transit_args)
          (fun result -> resolve result [@u])
          (fun exn -> reject (rejection_of_exn name exn) [@u]))

(* cljs remoteInvokeBinary — bypasses the service; payload arrives as
   Uint8Array (or undefined for export calls), result is a
   Uint8Array transferred back (or null when the handler returns
   nil). *)
let remote_invoke_binary_js =
  fun [@u] name repo payload ->
    Js.Promise.make (fun ~resolve ~reject ->
        Db_worker_effect.on_any
          (Worker_core.remote_invoke_binary name repo
             (match Js.Undefined.toOption payload with
              | Some a -> Some (U8a.to_string a)
              | None -> None))
          (fun result ->
            match result with
            | Wire.Binary s ->
                let a = U8a.of_string s in
                resolve
                  (Js.Nullable.return
                     (comlink_transfer a [| U8a.buffer a |]))
                  [@u]
            | Wire.Nil -> resolve Js.Nullable.null [@u]
            | _ ->
                reject
                  (rejection_of_exn name
                     (Failure "remoteInvokeBinary: non-binary result"))
                  [@u])
          (fun exn -> reject (rejection_of_exn name exn) [@u]))

let exposed_object =
  [%obj
    { remoteInvoke = remote_invoke_js
    ; remoteInvokeBinary = remote_invoke_binary_js
    }]

(* cljs db-worker init + ensure-worker-bootstrap!. The lightning-fs
   bootstrap importScripts("worker.js") performed in the classic-worker
   build is replaced by the ES-module entry (entry_browser.mjs), which
   imports those globals directly — module workers have no
   importScripts. *)
let start_browser_worker () =
  (match Js.Undefined.toOption (global_get global_this bootstrap_flag) with
   | Some _ -> ()
   | None -> global_set global_this bootstrap_flag true);
  Worker_core.init ();
  Db_worker_effect.async (fun () -> Idb.init ());
  comlink_expose exposed_object;
  let _timer =
    Timers.set_interval 25_000 (fun () ->
        Comlink.post_message "keepAliveResponse")
  in
  ()

(* Module-init side effect: inside a dedicated worker scope the
   bundle installs the worker surface immediately — matching the
   cljs db-worker.js, which ran init at load. The module-worker build
   has no importScripts global, so detection is just the absence of
   Node's process global (Runtime_env.kind); a window context never
   loads this bundle. *)
let () =
  if Runtime_env.kind () = Runtime_env.Browser_worker
  then start_browser_worker ()
