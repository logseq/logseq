(* Native twin of core/worker_client.ml — daemon path only (no JS
   worker). The Daemon_client bridge carries invokes + pushes; the
   reverse invoke_remote channel is a daemon-side stub today, so only
   the api registry surface is kept. *)

open Promise_ext
type message_handler = string -> Wire.t -> unit

type t =
  { invoke_fn : string -> Wire.t list -> Wire.t Js.Promise.t
  ; mutable on_message : message_handler
  ; dead : string Js.Promise.t
  }

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
let inflight_reads : (string, Wire.t Js.Promise.t) Hashtbl.t =
  Hashtbl.create 16

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
  if not (dedup_method name) then t.invoke_fn name args
  else begin
    let key = name ^ "|" ^ Transit.to_string (Wire.Array args) in
    match Hashtbl.find_opt inflight_reads key with
    | Some p -> p
    | None ->
        let p = t.invoke_fn name args in
        Hashtbl.replace inflight_reads key p;
        let release _ = Hashtbl.remove inflight_reads key in
        ignore
          (Js.Promise.then_
             (fun r -> release (); Js.Promise.resolve r)
             p
          |> Js.Promise.catch (fun e ->
                 release ();
                 Js.Promise.reject e));
        p
  end

let invoke t name args = run_invoke t name args

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
