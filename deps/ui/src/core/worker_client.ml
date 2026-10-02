(* Worker client: spawn js/db-worker.js, install MagicPortal fs globals,
   Comlink surface both directions, and the postMessage dispatch loop.
   Mirrors frontend/persist_db/browser.cljs + frontend/handler/worker.cljs.
   Under Electron there is no JS worker — Daemon_client bridges to the
   native OCaml db-worker over IPC + HTTP/SSE. *)

open Promise_ext
type message_handler = string -> Wire.t -> unit

type t =
  { invoke_fn : string -> Wire.t list -> Wire.t Js.Promise.t
  ; mutable on_message : message_handler
  ; dead : string Js.Promise.t
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
    match Hashtbl.find_opt api_handlers name with
    | Some f -> (
        try
          let args = decode_args transit_args in
          (* handler rejections propagate to the returned promise — the
             worker's remoteInvoke must settle instead of hanging *)
          let* result = f args in
          Js.Promise.resolve (Transit.to_string result)
        with exn -> Js.Promise.reject exn)
    | None -> Js.Promise.reject (Failure ("not found thread-api: " ^ name))

let install_remote_invoke worker =
  (* cljs main-thread thread-api callbacks the worker invoke_remote's;
     progress + ui-state pushes we don't surface yet *)
  register_api "thread-api/search-index-build-progress"
    (fun _ -> Js.Promise.resolve Wire.Nil);
  register_api "thread-api/set-ui-state"
    (fun _ -> Js.Promise.resolve Wire.Nil);
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

(* [emit] indirection lets the app's post-create assignment
   ([t.on_message <- Worker_events.dispatch]) reach frames that arrive
   after [create] returns. *)
type sink = { mutable emit : message_handler }

(* ignore Comlink-internal frames; transit events arrive as strings. *)
let handle_frame (sink : sink) data =
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
        let frame =
          try Some (Transit.of_string transit_text)
          with _ ->
            Platform.console_error
              ("db-worker frame decode failed", transit_text);
            None
        in
        match frame with
        | Some (Wire.Array (Wire.Keyword e :: rest))
        | Some (Wire.List (Wire.Keyword e :: rest)) ->
            let payload =
              match rest with [ p ] -> p | _ -> Wire.Array rest
            in
            sink.emit e payload
        | _ -> ())
    | None -> ()

let onmessage (sink : sink) worker event =
  let data = Comlink.json_data event in
  match json_string data with
  | Some "keepAliveResponse" ->
      Comlink.worker_post_message worker "keepAliveRequest"
  | Some _ -> handle_frame sink data
  | None -> handle_frame sink data

(* invoke qkw (e.g. "thread-api/init") with decoded wire args *)
let invoke t name args = t.invoke_fn name args

let invoke1 t name a = invoke t name [ a ]
let invoke2 t name a b = invoke t name [ a; b ]

let set_worker_fs worker =
  let portal = Comlink.new_portal worker in
  let install name =
    ignore
      (let* v = (Comlink.portal_get portal name) in
      set_global name v;
      Js.Promise.resolve ())
  in
  install "fs";
  install "pfs";
  install "workerThread"

(* wired by the app layer at boot — this module can't reach Toast
   without a cycle through Runtime *)
let notify_worker_failure = ref (fun () -> ())

let create () =
  if Daemon_client.is_electron () then (
    let tr = Daemon_client.create_transport () in
    let t =
      { invoke_fn = (fun name args -> Daemon_client.invoke tr name args)
      ; on_message = (fun _ _ -> ())
      ; dead = tr.Daemon_client.dead
      }
    in
    tr.sink <- (fun kind payload -> t.on_message kind payload);
    t)
  else
    let worker =
      Comlink.new_worker
        "js/db-worker.js?electron=false&capacitor=false&publishing=false"
    in
    set_worker_fs worker;
    let proxy = Comlink.wrap worker in
    let kill = ref (fun (_ : exn) -> ()) in
    let dead : string Js.Promise.t =
      Js.Promise.make (fun ~resolve:_ ~reject ->
          kill := fun e -> reject e [@u])
    in
    let sink = { emit = (fun _ _ -> ()) } in
    let invoke_fn name args =
      let transit_args = Transit.to_string (Wire.Array args) in
      let* result =
        (Js.Promise.race
           [| Comlink.remote_invoke proxy name transit_args; dead |])
      in
      Js.Promise.resolve (Transit.of_string result)
    in
    let t =
      { invoke_fn; on_message = (fun _ _ -> ()); dead }
    in
    (* the worker never answers after it dies — [dead] rejects every
       in-flight call instead of hanging callers *)
    sink.emit <- (fun kind payload -> t.on_message kind payload);
    Comlink.set_onmessage worker (fun event -> onmessage sink worker event);
    Comlink.set_onerror worker (fun err ->
        Platform.console_error ("db-worker error", err);
        !notify_worker_failure ();
        !kill (Failure "db-worker crashed"));
    Comlink.set_onmessageerror worker (fun err ->
        Platform.console_error ("db-worker messageerror", err);
        !notify_worker_failure ());
    install_remote_invoke worker;
    t
