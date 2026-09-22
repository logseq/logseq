(* Worker->main-thread channel. postMessage on self; invoke_remote is
   wired up when the OCaml worker needs to call back into the UI
   thread (sync milestones). *)
external post_message_raw : string -> unit = "postMessage" [@@mel.scope "self"]

let invoke_remote _ _ =
  Db_worker_effect.error (Failure "Comlink.invoke_remote: not implemented yet")

let post_message msg = post_message_raw msg
