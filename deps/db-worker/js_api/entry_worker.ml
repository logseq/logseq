(* JS entry for the db-worker bundle.

   In Node the bundle is a library required by db-worker-node
   (init/invoke/registered/set_post_fn/main exports).

   In a dedicated web worker the bundle IS the worker — replacing the
   cljs db-worker shell: it installs the worker.js globals
   (lightning-fs self.pfs, used by runtime/melange/asset_store.ml),
   registers every endpoint, exposes the Comlink proxy object the UI
   thread calls, and sends the keepAlive ping. *)

let init () = Worker_core.init ()

let invoke name transit_args =
  Worker_core.init ();
  Js.Promise.make (fun ~resolve ~reject ->
      Db_worker_effect.on_any
        (Worker_core.invoke name transit_args)
        (fun result -> resolve result [@u])
        (fun exn -> reject exn [@u]))

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

module U8 = Js.Typed_array.Uint8Array

external new_u8a : int -> U8.t = "Uint8Array" [@@mel.new]
external u8a_get : U8.t -> int -> int = "" [@@mel.get_index]
external u8a_set : U8.t -> int -> int -> unit = "" [@@mel.set_index]
external u8a_length : U8.t -> int = "length" [@@mel.get]
external u8a_buffer : U8.t -> Js.Typed_array.ArrayBuffer.t = "buffer"
  [@@mel.get]

let string_of_u8a a =
  String.init (u8a_length a) (fun i -> Char.chr (u8a_get a i))

let u8a_of_string s =
  let a = new_u8a (String.length s) in
  String.iteri (fun i c -> u8a_set a i (Char.code c)) s;
  a

(* Dedicated-worker globals: importScripts exists in a worker scope
   but not on the window main thread; Comlink.expose installs the
   remote-call endpoint on self; Comlink.transfer marks a value's
   buffer as transferable so export payloads cross without copying. *)
external import_scripts : string -> unit = "importScripts"
  [@@mel.scope "globalThis"]

external comlink_expose : 'a -> unit = "expose" [@@mel.module "comlink"]
external comlink_transfer : 'a -> 'b array -> 'a = "transfer"
  [@@mel.module "comlink"]

type global
external global_this : global = "globalThis"

external global_get : global -> string -> 'a Js.Undefined.t = ""
  [@@mel.get_index]

external global_set : global -> string -> 'a -> unit = ""
  [@@mel.set_index]

let bootstrap_flag = "__logseq_db_worker_bootstrap_loaded__"

(* cljs remoteInvoke — the Comlink-exposed call the UI thread makes
   with (qualified-name, transit-args) -> transit-string promise. *)
let remote_invoke_js =
  fun [@u] name transit_args ->
    Js.Promise.make (fun ~resolve ~reject ->
        Db_worker_effect.on_any
          (Worker_core.remote_invoke name transit_args)
          (fun result -> resolve result [@u])
          (fun exn -> reject exn [@u]))

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
              | Some a -> Some (string_of_u8a a)
              | None -> None))
          (fun result ->
            match result with
            | Wire.Binary s ->
                let a = u8a_of_string s in
                resolve
                  (Js.Nullable.return
                     (comlink_transfer a [| u8a_buffer a |]))
                  [@u]
            | Wire.Nil -> resolve Js.Nullable.null [@u]
            | _ ->
                reject
                  (Failure "remoteInvokeBinary: non-binary result")
                  [@u])
          (fun exn -> reject exn [@u]))

let exposed_object =
  [%obj
    { remoteInvoke = remote_invoke_js
    ; remoteInvokeBinary = remote_invoke_binary_js
    }]

(* cljs db-worker init + ensure-worker-bootstrap!. *)
let start_browser_worker () =
  (match Js.Undefined.toOption (global_get global_this bootstrap_flag) with
   | Some _ -> ()
   | None ->
       global_set global_this bootstrap_flag true;
       import_scripts "worker.js");
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
   cljs db-worker.js, which ran init at load. In a window or Node
   context this is inert. *)
let () =
  if Runtime_env.kind () = Runtime_env.Browser_worker
     && Js.Undefined.toOption (global_get global_this "importScripts")
        <> None
  then start_browser_worker ()
