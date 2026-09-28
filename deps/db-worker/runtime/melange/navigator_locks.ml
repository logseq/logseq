(* navigator.locks — shared-service master election. *)

type lock = Js.Json.t

external locks_obj : Js.Json.t Js.Undefined.t = "locks"
  [@@mel.scope "navigator"]

let locks () =
  match Js.Undefined.toOption locks_obj with
  | Some l -> l
  | None -> invalid_arg "navigator.locks unavailable"

external request_ :
  Js.Json.t -> string -> Js.Json.t ->
  (Js.Json.t -> 'a Js.Promise.t [@u]) -> 'a Js.Promise.t = "request" [@@mel.send]

external query_ : Js.Json.t -> Js.Json.t Js.Promise.t = "query" [@@mel.send]

external promise_error_message : Js.Promise.error -> string option = "message"
  [@@mel.get] [@@mel.return { undefined_to_opt }]

let await_promise promise =
  let task, resolver = Db_worker_effect.wait () in
  let finish result =
    if Db_worker_effect.is_pending task then Db_worker_effect.wakeup resolver result
  in
  let on_ok value = finish (Ok value); Js.Promise.resolve () in
  let on_error error =
    let message =
      Option.value (promise_error_message error) ~default:"JavaScript promise rejected"
    in
    finish (Error message);
    Js.Promise.resolve ()
  in
  ignore
    (promise |> Js.Promise.then_ on_ok |> Js.Promise.catch on_error
      : unit Js.Promise.t);
  Db_worker_effect.bind task (function
    | Ok value -> Db_worker_effect.pure value
    | Error message -> Db_worker_effect.error (Failure message))

(* Bridge a Db_worker_effect into the Js.Promise the locks callback
   must return. *)
let promise_of_effect eff =
  Js.Promise.make (fun ~resolve ~reject ->
      Db_worker_effect.on_any eff
        (fun v -> resolve v [@u])
        (fun e -> reject e [@u]))

let request ~name ?mode ?if_available f =
  let opts = Js.Dict.empty () in
  (match mode with
   | Some m -> Js.Dict.set opts "mode" (Js.Json.string m)
   | None -> ());
  (match if_available with
   | Some b -> Js.Dict.set opts "ifAvailable" (Js.Json.boolean b)
   | None -> ());
  await_promise
    (request_ (locks ()) name (Js.Json.object_ opts)
       (fun [@u] lock ->
          let lock_opt =
            match Js.Json.classify lock with
            | Js.Json.JSONNull -> None
            | _ -> Some lock
          in
          promise_of_effect (f lock_opt)))

type lock_info =
  { name : string
  ; client_id : string
  }

type query_result =
  { held : lock_info list
  ; pending : lock_info list
  }

external get_str : Js.Json.t -> string -> string = "" [@@mel.get_index]
external get_list : Js.Json.t -> string -> Js.Json.t array = "" [@@mel.get_index]

let lock_info_of j = { name = get_str j "name"; client_id = get_str j "clientId" }

let query () =
  Db_worker_effect.map
    (fun result ->
       { held = List.map lock_info_of (Array.to_list (get_list result "held"))
       ; pending = List.map lock_info_of (Array.to_list (get_list result "pending"))
       })
    (await_promise (query_ (locks ())))
