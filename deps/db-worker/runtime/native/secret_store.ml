let unavailable () =
  Db_worker_effect.error (Failure "Native secrets require the OS keychain host")

let save ~key:_ _text = unavailable ()
let read ~key:_ = unavailable ()
let delete ~key:_ = unavailable ()
