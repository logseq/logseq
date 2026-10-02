(* db-worker fake for unit tests: installs a Worker_client.t whose
   invoke resolves synchronously from an OCaml handler, so views that
   only render on worker responses (sidebar favorites/recents, cmdk recents)
   can be exercised without a real worker. *)

type handler = string -> Wire.t list -> Wire.t

let install (handler : handler) : Worker_client.t =
  let invoke_fn name args =
    Js.Promise.resolve (handler name args)
  in
  let dead = Js.Promise.make (fun ~resolve:_ ~reject:_ -> ()) in
  let t =
    { Worker_client.invoke_fn
    ; on_message = (fun _ _ -> ())
    ; dead
    }
  in
  Runtime.worker := Some t;
  t

let clear () = Runtime.worker := None

let never _name _args = Wire.Nil
