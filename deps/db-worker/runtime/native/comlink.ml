let invoke_remote _ _ =
  Db_worker_effect.error (Failure "Comlink.invoke_remote: not implemented on native yet")

let post_message _ = ()
