# 1 "spec/platform/http.mli"
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

val send : request -> response Db_worker_effect.t
val send_binary : request -> string Db_worker_effect.t
