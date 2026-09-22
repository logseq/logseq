(* Worker->main-thread channel. postMessage on self; invoke_remote
   mirrors cljs worker-state/<invoke-main-thread: (Comlink/wrap js/self)
   then (.remoteInvoke proxy method-str transit-args) -> promise of a
   transit string. *)
external post_message_raw : string -> unit = "postMessage" [@@mel.scope "self"]

type remote
external self_obj : remote = "self"
external wrap : remote -> remote = "wrap" [@@mel.module "comlink"]
external remote_invoke : remote -> string -> string -> string Js.Promise.t
  = "remoteInvoke" [@@mel.send]
external promise_error_message : Js.Promise.error -> string option = "message"

let main_thread = lazy (wrap self_obj)

let task_of_promise promise =
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

let invoke_remote name transit_args =
  task_of_promise (remote_invoke (Lazy.force main_thread) name transit_args)

let post_message msg = post_message_raw msg
