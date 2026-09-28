type lock = unit

let request ~name:_ ?mode:_ ?if_available:_ _f =
  invalid_arg "Navigator_locks: unsupported on native"

type lock_info =
  { name : string
  ; client_id : string
  }

type query_result =
  { held : lock_info list
  ; pending : lock_info list
  }

let query () = invalid_arg "Navigator_locks: unsupported on native"
