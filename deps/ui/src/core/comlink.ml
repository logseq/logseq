(* UI-side Comlink + Worker externals for the db-worker boundary.
   Wire contract (from frontend/persist_db/browser.cljs):
   - remoteInvoke(name, transitArgs) -> Promise<transitString>
   - remoteInvokeBinary(name, repo, payload?) -> Promise<Uint8Array>
   - Comlink.expose({remoteInvoke}, worker) lets the worker call back.
   - worker.onmessage receives "keepAliveResponse" or a transit
     string [event-kw payload]; RAW/APPLY/RELEASE/HANDLER frames are
     Comlink-internal and ignored. *)

type worker
type proxy

external new_worker : string -> worker = "Worker" [@@mel.new]

(* The db-worker bundle ships as an ES module: mobile Safari workers
   overflow their small call stack compiling a single multi-MB classic
   script, so the worker must be created with {type: "module"} to match
   the chunked module output. *)
external new_module_worker :
  string -> string Js.Dict.t -> worker = "Worker" [@@mel.new]

let module_worker_opts () =
  let opts = Js.Dict.empty () in
  Js.Dict.set opts "type" "module";
  opts

external worker_post_message : worker -> string -> unit = "postMessage"
  [@@mel.send]

external set_onmessage :
  worker -> (Js.Json.t -> unit) -> unit = "onmessage" [@@mel.set]

external set_onerror : worker -> (Js.Json.t -> unit) -> unit = "onerror"
  [@@mel.set]

external set_onmessageerror :
  worker -> (Js.Json.t -> unit) -> unit = "onmessageerror" [@@mel.set]

external worker_terminate : worker -> unit = "terminate" [@@mel.send]
external wrap : worker -> proxy = "wrap" [@@mel.module "comlink"]

external remote_invoke :
  proxy -> string -> string -> string Js.Promise.t = "remoteInvoke"
  [@@mel.send]

external remote_invoke_binary :
  proxy -> string -> string Js.Undefined.t -> Js.Typed_array.Uint8Array.t
    Js.Undefined.t -> Js.Typed_array.Uint8Array.t Js.Nullable.t Js.Promise.t
  = "remoteInvokeBinary" [@@mel.send]

external expose : 'a -> worker -> unit = "expose"
  [@@mel.module "comlink"]

(* MagicPortal — resources/js/magic_portal.js, installed on window. *)
type portal

external new_portal : worker -> portal = "MagicPortal" [@@mel.new]
external portal_get : portal -> string -> 'a Js.Promise.t = "get" [@@mel.send]

external json_data : Js.Json.t -> Js.Json.t = "data" [@@mel.get]
