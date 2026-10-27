(* Native twin of core/worker_client.ml — daemon path only (no JS
   worker). The Daemon_client bridge carries invokes + pushes; the
   reverse invoke_remote channel is a daemon-side stub today, so only
   the api registry surface is kept. *)

open Promise_ext
type message_handler = string -> Wire.t -> unit
type scope = Daemon_client.scope = { repo : string; epoch : int }
type outcome = Daemon_client.outcome = Not_sent | Outcome_unknown
type request_failure = Daemon_client.request_failure =
  { scope : scope option
  ; method_name : string
  ; outcome : outcome
  ; cause : exn
  }
exception Request_failed = Daemon_client.Request_failed
type phase = Daemon_client.phase = Disconnected | Recovering | Ready | Failed of exn
type lifecycle = Daemon_client.lifecycle = { scope : scope option; phase : phase }
type invoke = Daemon_client.invoke
type bootstrap = Daemon_client.bootstrap =
  { scope : scope
  ; invoke : invoke
  ; is_current : unit -> bool
  }

type t =
  { invoke_fn : string -> Wire.t list -> Wire.t Js.Promise.t
  ; mutable on_message : message_handler
  ; dead : string Js.Promise.t
  ; daemon : Daemon_client.transport option
  ; inflight_reads : (string, Wire.t Js.Promise.t) Hashtbl.t
  }

let supports_recovery t = Option.is_some t.daemon
let daemon_exn t =
  match t.daemon with
  | Some daemon -> daemon
  | None -> invalid_arg "Daemon recovery is unavailable for this worker"

let configure_recovery t ~on_state ~on_request_failure ~rehydrate =
  Daemon_client.configure_recovery (daemon_exn t) ~on_state ~on_request_failure ~rehydrate

let lifecycle t = Daemon_client.lifecycle (daemon_exn t)
let connect t ~repo = Daemon_client.connect (daemon_exn t) ~repo
let reconnect_existing t ~repo = Daemon_client.reconnect_existing (daemon_exn t) ~repo
let disconnect t = Option.iter Daemon_client.disconnect t.daemon

(* renderer-side api registry the worker calls back through
   Comlink.expose ({remoteInvoke}) — kept for when the daemon grows a
   reverse channel *)
let api_handlers : (string, Wire.t list -> Wire.t Js.Promise.t) Hashtbl.t =
  Hashtbl.create 32

let register_api name f = Hashtbl.replace api_handlers name f

let decode_args transit_args =
  match Transit.of_string transit_args with
  | Wire.Array xs | Wire.List xs -> xs
  | w -> [ w ]

let remote_invoke name transit_args =
  match Hashtbl.find_opt api_handlers name with
  | Some f -> (
      try
        let args = decode_args transit_args in
        let* result = f args in
        Js.Promise.resolve (Transit.to_string result)
      with exn -> Js.Promise.reject exn)
  | None -> Js.Promise.reject (Failure ("not found thread-api: " ^ name))

let install_stub_handlers () =
  register_api "thread-api/search-index-build-progress"
    (fun _ -> Js.Promise.resolve Wire.Nil);
  register_api "thread-api/set-ui-state" (fun _ ->
      Js.Promise.resolve Wire.Nil)

(* In-flight dedup for idempotent read invokes: the daemon serializes
   every invoke on a global mutex (cljs single-thread semantics), so
   duplicate boot calls — sync-app-state x3, pull x2, get-block-refs x4,
   display/bidirectional/get-blocks x2 — each queue behind one another.
   Same (method, args) while in-flight shares one promise; writes
   (apply-outliner-ops, transact) are never merged. *)
(* Callers pass names with a "thread-api/" routing prefix; classify on
   the method part. *)
let method_name (name : string) : string =
  let prefix = "thread-api/" in
  let pl = String.length prefix in
  if String.length name > pl && String.sub name 0 pl = prefix
  then String.sub name pl (String.length name - pl)
  else name

let dedup_method (name : string) : bool =
  let name = method_name name in
  (String.length name >= 4 && String.sub name 0 4 = "get-")
  || name = "pull" || name = "sync-app-state"
  || name = "search-build-blocks-indice-in-worker"
  || name = "list-db" || name = "list-graphs"

let run_invoke t name args =
  if not (supports_recovery t) || not (dedup_method name) then t.invoke_fn name args
  else begin
    let daemon = daemon_exn t in
    let key =
      string_of_int daemon.epoch ^ "|" ^ daemon.repo ^ "|" ^ name ^ "|"
      ^ Transit.to_string (Wire.Array args)
    in
    match Hashtbl.find_opt t.inflight_reads key with
    | Some p -> p
    | None ->
        let p = t.invoke_fn name args in
        Hashtbl.replace t.inflight_reads key p;
        let release _ = Hashtbl.remove t.inflight_reads key in
        ignore
          (Js.Promise.then_
             (fun r -> release (); Js.Promise.resolve r)
             p
          |> Js.Promise.catch (fun e ->
                 release ();
                 Js.Promise.reject e));
        p
  end

let pending_calls : (int, Wire.t Js.Promise.t) Hashtbl.t = Hashtbl.create 16
let next_call = ref 0

let invoke t name args =
  let id = !next_call in
  incr next_call;
  let p = run_invoke t name args in
  Hashtbl.add pending_calls id p;
  ignore
    (Js.Promise.then_
       (fun _ -> Hashtbl.remove pending_calls id; Js.Promise.resolve ()) p
     |> Js.Promise.catch (fun _ ->
          Hashtbl.remove pending_calls id;
          Js.Promise.resolve ()));
  p

let rec await_idle () =
  let pending = Hashtbl.fold (fun _ p ps -> p :: ps) pending_calls [] in
  match pending with
  | [] -> Js.Promise.resolve ()
  | _ ->
      let* _ = Js.Promise.all (Array.of_list pending) in
      await_idle ()

let invoke1 t name a = invoke t name [ a ]
let invoke2 t name a b = invoke t name [ a; b ]

(* wired by the app layer at boot *)
let notify_worker_failure = ref (fun () -> ())

let create () =
  install_stub_handlers ();
  let tr = Daemon_client.create_transport () in
  let t =
    { invoke_fn = (fun name args -> Daemon_client.invoke tr name args)
    ; on_message = (fun _ _ -> ())
    ; dead = tr.Daemon_client.dead
    ; daemon = Some tr
    ; inflight_reads = Hashtbl.create 16
    }
  in
  tr.Daemon_client.sink <-
    (fun kind payload -> t.on_message kind payload);
  t

let json_field (name : string) (data : Js.Json.t) : Js.Json.t option =
  match data with
  | Js.Json.JObject kvs -> List.assoc_opt name kvs
  | _ -> None

let json_string (data : Js.Json.t) : string option =
  Js.Json.decodeString data

(* globals live in an opaque table the native host can read for
   debugging; values are not real JS objects natively *)
let set_global (_name : string) (_v : 'a) : unit = ()
