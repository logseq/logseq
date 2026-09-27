(* Worker client: spawn js/db-worker.js, install MagicPortal fs globals,
   Comlink surface both directions, and the postMessage dispatch loop.
   Mirrors frontend/persist_db/browser.cljs + frontend/handler/worker.cljs. *)

type message_handler = string -> Wire.t -> unit

type t =
  { worker : Comlink.worker
  ; proxy : Comlink.proxy
  ; mutable on_message : message_handler
  }

type global

external global_this : global = "globalThis"

external global_set : global -> string -> 'a -> unit = "" [@@mel.set_index]

let set_global name value = global_set global_this name value

(* renderer-side api registry the worker calls back through
   Comlink.expose ({remoteInvoke}). *)
let api_handlers : (string, Wire.t list -> Wire.t Js.Promise.t) Hashtbl.t =
  Hashtbl.create 32

let register_api name f = Hashtbl.replace api_handlers name f

let decode_args transit_args =
  match Transit.of_string transit_args with
  | Wire.Array xs | Wire.List xs -> xs
  | w -> [ w ]

let remote_invoke_js =
  fun [@u] name transit_args ->
    Js.Promise.make (fun ~resolve ~reject ->
        match Hashtbl.find_opt api_handlers name with
        | Some f -> (
            let args = decode_args transit_args in
            try
              ignore
                (Js.Promise.then_
                   (fun result ->
                     resolve (Transit.to_string result) [@u];
                     Js.Promise.resolve ())
                   (f args))
            with exn -> reject exn [@u])
        | None ->
            reject
              (Failure ("not found thread-api: " ^ name))
              [@u])

let install_remote_invoke worker =
  let exposed = Js.Dict.empty () in
  Js.Dict.set exposed "remoteInvoke" remote_invoke_js;
  Comlink.expose exposed worker

let json_string data =
  match Js.Json.classify data with
  | Js.Json.JSONString s -> Some s
  | _ -> None

let json_field name data =
  match Js.Json.classify data with
  | Js.Json.JSONObject obj -> Js.Dict.get obj name
  | _ -> None

(* ignore Comlink-internal frames; transit events arrive as strings. *)
let handle_frame t data =
  let frame_type =
    match json_field "type" data with
    | Some v -> Option.value (json_string v) ~default:""
    | None -> ""
  in
  if frame_type = "RAW" || frame_type = "APPLY" || frame_type = "RELEASE"
     || frame_type = "HANDLER"
  then ()
  else
    match json_string data with
    | Some transit_text -> (
        match Transit.of_string transit_text with
        | Wire.Array (Wire.Keyword e :: rest)
        | Wire.List (Wire.Keyword e :: rest) ->
            let payload =
              match rest with [ p ] -> p | _ -> Wire.Array rest
            in
            t.on_message e payload
        | _ -> ())
    | None -> ()

let onmessage t event =
  let data = Comlink.json_data event in
  match json_string data with
  | Some "keepAliveResponse" ->
      Comlink.worker_post_message t.worker "keepAliveRequest"
  | Some _ -> handle_frame t data
  | None -> handle_frame t data

(* invoke qkw (e.g. "thread-api/init") with decoded wire args *)
let invoke t name args =
  let transit_args = Transit.to_string (Wire.Array args) in
  Js.Promise.then_
    (fun result -> Js.Promise.resolve (Transit.of_string result))
    (Comlink.remote_invoke t.proxy name transit_args)

let invoke1 t name a = invoke t name [ a ]
let invoke2 t name a b = invoke t name [ a; b ]

let set_worker_fs worker =
  let portal = Comlink.new_portal worker in
  let install name =
    ignore
      (Js.Promise.then_
         (fun v ->
           set_global name v;
           Js.Promise.resolve ())
         (Comlink.portal_get portal name))
  in
  install "fs";
  install "pfs";
  install "workerThread"

let create () =
  let worker =
    Comlink.new_worker
      "js/db-worker.js?electron=false&capacitor=false&publishing=false"
  in
  set_worker_fs worker;
  let proxy = Comlink.wrap worker in
  let t = { worker; proxy; on_message = (fun _ _ -> ()) } in
  Comlink.set_onmessage worker (fun event -> onmessage t event);
  Comlink.set_onerror worker (fun _ -> ());
  Comlink.set_onmessageerror worker (fun _ -> ());
  install_remote_invoke worker;
  t
