let supported () = false

let gzip_encode _ =
  Db_worker_effect.error (Failure "Compression: not implemented on native yet")

let gzip_decode _ =
  Db_worker_effect.error (Failure "Compression: not implemented on native yet")
