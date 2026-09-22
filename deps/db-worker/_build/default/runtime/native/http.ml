type request =
  { url : string
  ; method_ : string
  ; headers : (string * string) list
  ; body : string option
  }

type response =
  { status : int
  ; headers : (string * string) list
  ; body : string
  }

let send _ = Db_worker_effect.error (Failure "Http: not implemented on native yet")
let send_binary _ = Db_worker_effect.error (Failure "Http: not implemented on native yet")
