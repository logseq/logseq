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

let invoke t name args = t.invoke_fn name args
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

(* globals live in an opaque table the Swift host can read for
   debugging; values are not real JS objects natively *)
let set_global (_name : string) (_v : 'a) : unit = ()
