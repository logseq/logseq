(* db-worker fake for unit tests: installs a Worker_client.t whose
   remoteInvoke resolves synchronously from an OCaml handler, so views that
   only render on worker responses (sidebar favorites/recents, cmdk recents)
   can be exercised without a real worker.

   The %identity casts fabricate the abstract Comlink.worker/proxy handles --
   the values are only ever stored and passed back through JS externals. *)

external proxy_of_json : Js.Json.t -> Comlink.proxy = "%identity"
external worker_of_json : Js.Json.t -> Comlink.worker = "%identity"

type handler = string -> Wire.t list -> Wire.t

external set_field : Js.Json.t -> string -> 'a -> unit = ""
  [@@mel.set_index]

let install (handler : handler) : Worker_client.t =
  let proxy = Js.Json.object_ (Js.Dict.empty ()) in
  set_field proxy "remoteInvoke"
    (fun name transit_args ->
      Js.Promise.resolve
        (Transit.to_string
           (handler name (Worker_client.decode_args transit_args))));
  let worker = Js.Json.object_ (Js.Dict.empty ()) in
  set_field worker "postMessage" (fun _msg -> ());
  set_field worker "terminate" (fun () -> ());
  let dead = Js.Promise.make (fun ~resolve:_ ~reject:_ -> ()) in
  let t =
    { Worker_client.worker = worker_of_json worker
    ; proxy = proxy_of_json proxy
    ; on_message = (fun _ _ -> ())
    ; dead
    }
  in
  Runtime.worker := Some t;
  t

let clear () = Runtime.worker := None

let never _name _args = Wire.Nil
