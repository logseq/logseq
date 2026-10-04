(* Electron renderer transport: the native OCaml db-worker daemon
   replaces the browser's JS worker. Graph lifecycle rides the
   electron-main IPC bridge (window.apis.doAction carries a transit
   frame on the 'main' channel); thread-api calls POST to
   {base-url}/v1/invoke and daemon pushes arrive on the SSE
   /v1/events stream. *)

open Promise_ext

(* ---------- js surface ---------- *)

external window_ : Js.Json.t = "window" [@@mel.scope "globalThis"]
external getf : Js.Json.t -> string -> Js.Json.t = "" [@@mel.get_index]
external reflect_apply :
  Js.Json.t -> Js.Json.t -> Js.Json.t array -> Js.Json.t = "apply"
  [@@mel.scope "Reflect"]

external reflect_apply_promise :
  Js.Json.t -> Js.Json.t -> Js.Json.t array -> 'a Js.Promise.t = "apply"
  [@@mel.scope "Reflect"]

let meth o m args : Js.Json.t = reflect_apply (getf o m) o args
let meth_promise o m args = reflect_apply_promise (getf o m) o args
external json_parse : string -> Js.Json.t = "parse" [@@mel.scope "JSON"]

external json_stringify : Js.Json.t -> string = "stringify"
  [@@mel.scope "JSON"]

external fetch_ : string -> Js.Json.t -> Js.Json.t Js.Promise.t =
  "fetch" [@@mel.scope "window"]

external resp_json : Js.Json.t -> Js.Json.t Js.Promise.t = "json"
  [@@mel.send]

type event_source

external new_event_source : string -> event_source = "EventSource"
  [@@mel.new]

external es_set_onmessage :
  event_source -> (Js.Json.t -> unit) -> unit = "onmessage"
  [@@mel.set]

external es_close : event_source -> unit = "close" [@@mel.send]
external event_data : Js.Json.t -> string = "data" [@@mel.get]

let json_field (name : string) (j : Js.Json.t) : Js.Json.t option =
  match Js.Json.classify j with
  | Js.Json.JSONObject obj -> Js.Dict.get obj name
  | _ -> None

let jobj (kvs : (string * Js.Json.t) list) : Js.Json.t =
  let d = Js.Dict.empty () in
  List.iter (fun (k, v) -> Js.Dict.set d k v) kvs;
  Js.Json.object_ d

(* The preload bridge is the only window.apis that carries doAction —
   the web build's plugin-host shim is a bare event emitter. Guarded for
   the node test runner where window itself is absent. *)
let is_electron () : bool =
  match Js.typeof window_ with
  | "object" -> (
      match Js.typeof (getf window_ "apis") with
      | "object" ->
          Js.typeof (getf (getf window_ "apis") "doAction") = "function"
      | _ -> false)
  | _ -> false

(* ---------- ipc ---------- *)

(* apis.doAction(arg) -> ipcRenderer.invoke('main', arg). The handler
   decodes a transit string frame and answers a transit string. *)
let ipc (args : Wire.t list) : Wire.t Js.Promise.t =
  let apis = getf window_ "apis" in
  let* result =
    meth_promise apis "doAction"
      [| Js.Json.string (Transit.to_string (Wire.Array args)) |]
  in
  Js.Promise.resolve
    (match Js.Json.decodeString result with
     | Some s -> Transit.of_string s
     | None -> Wire.Nil)

(* ---------- transport ---------- *)

type transport =
  { mutable base_url : string
  ; mutable repo : string
  ; mutable es : event_source option
  ; mutable sink : string -> Wire.t -> unit
  ; pending : (string * Wire.t list) Queue.t
  ; dead : string Js.Promise.t
  }

let post_invoke (base_url : string) (name : string) (args : Wire.t list)
    : Wire.t Js.Promise.t =
  let* resp =
    fetch_ (base_url ^ "/v1/invoke")
      (jobj
         [ "method", Js.Json.string "POST"
         ; "headers", jobj [ "Content-Type", Js.Json.string "application/json" ]
         ; ( "body"
           , Js.Json.string
               (json_stringify
                  (jobj
                     [ "method", Js.Json.string name
                     ; ( "argsTransit"
                       , Js.Json.string (Transit.to_string (Wire.Array args)) )
                     ])) )
         ])
  in
  let* j = resp_json resp in
  (match json_field "ok" j with
   | Some ok when Js.Json.decodeBoolean ok = Some true -> ()
   | _ ->
       let message =
         match json_field "error" j with
         | Some e -> (
             match json_field "message" e with
             | Some m -> Option.value (Js.Json.decodeString m) ~default:""
             | None -> "")
         | None -> ""
       in
       failwith ("db-worker daemon " ^ name ^ ": " ^ message));
  match json_field "resultTransit" j with
  | Some rt -> (
      match Js.Json.decodeString rt with
      | Some s -> Js.Promise.resolve (Transit.of_string s)
      | None -> Js.Promise.resolve Wire.Nil)
  | None -> Js.Promise.resolve Wire.Nil

(* SSE frames are {"type": "<kind>", "payload": "<transit>"} — payload
   carries the same [<kw> ...] transit frame the JS worker posts via
   postMessage, so decode it the way Worker_client.handle_frame does. *)
let sse_onmessage (t : transport) (ev : Js.Json.t) : unit =
  try
    let j = json_parse (event_data ev) in
    match
      Option.bind (json_field "payload" j) Js.Json.decodeString
    with
    | Some s -> (
        match (try Some (Transit.of_string s) with _ -> None) with
        | Some (Wire.Array (Wire.Keyword kind :: rest))
        | Some (Wire.List (Wire.Keyword kind :: rest)) ->
            let payload =
              match rest with
              | [ p ] -> p
              | _ -> Wire.Array rest
            in
            t.sink kind payload
        | _ -> ())
    | None -> ()
  with _ -> ()

let attach (t : transport) (repo : string) (base_url : string) : unit =
  (match t.es with
   | Some es -> es_close es
   | None -> ());
  let es = new_event_source (base_url ^ "/v1/events") in
  es_set_onmessage es (sse_onmessage t);
  t.es <- Some es;
  t.base_url <- base_url;
  t.repo <- repo

(* getGraphs returns bare repo names; thread-api/list-db callers expect
   [{:name repo}] *)
let list_graphs () : Wire.t Js.Promise.t =
  let* graphs = ipc [ Wire.String "getGraphs" ] in
  let names =
    match graphs with
    | Wire.Array xs | Wire.List xs -> xs
    | _ -> []
  in
  Js.Promise.resolve
    (Wire.Array
       (List.map (fun w -> Wire.Map [ (Wire.kw "name", w) ]) names))

(* invokes issued before the first graph daemon attaches (set-context,
   sync config, app state) are global state — replay them in order on
   the first runtime. *)
let flush_pending (t : transport) : unit Js.Promise.t =
  let rec loop () =
    if Queue.is_empty t.pending then Js.Promise.resolve ()
    else
      let name, args = Queue.take t.pending in
      let* _ = post_invoke t.base_url name args in
      loop ()
  in
  loop ()

let invoke (t : transport) (name : string) (args : Wire.t list) :
    Wire.t Js.Promise.t =
  match name with
  | "thread-api/init" ->
      (* a managed daemon inits itself on spawn *)
      Js.Promise.resolve Wire.Nil
  | "thread-api/list-db" -> list_graphs ()
  | "thread-api/create-or-open-db" -> (
      match args with
      | Wire.String repo :: _ ->
          let* rt =
            ipc
              [ Wire.String "db-worker-runtime"
              ; Wire.String repo
              ; Wire.Map [] ]
          in
          (match Wire.map_get_string rt "base-url" with
           | Some base when base <> "" ->
               if base <> t.base_url then (
                 (if t.repo <> "" && t.repo <> repo then
                    ignore (ipc [ Wire.String "releaseDbWorkerRuntime"
                                ; Wire.String t.repo ]));
                 attach t repo base)
           | _ ->
               raise
                 (Failure
                    ("db-worker-runtime returned no base-url for " ^ repo)));
          let* _ = flush_pending t in
          post_invoke t.base_url name args
      | _ -> Js.Promise.reject (Failure "create-or-open-db: bad args"))
  | _ ->
      if t.base_url = "" then (
        Queue.add (name, args) t.pending;
        Js.Promise.resolve Wire.Nil)
      else post_invoke t.base_url name args

let create_transport () : transport =
  let kill = ref (fun (_ : exn) -> ()) in
  let dead : string Js.Promise.t =
    Js.Promise.make (fun ~resolve:_ ~reject ->
        kill := fun e -> reject e [@u])
  in
  { base_url = ""
  ; repo = ""
  ; es = None
  ; sink = (fun _ _ -> ())
  ; pending = Queue.create ()
  ; dead
  }
