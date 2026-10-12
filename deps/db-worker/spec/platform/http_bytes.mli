(* Binary-capable HTTP for the db-sync port.
   Http's response drops headers and only supports text bodies; db-sync needs
   raw bytes (snapshot frames, encrypted asset payloads), response headers
   (content-length / content-encoding), and streaming reads for the snapshot
   download. Bodies are raw byte strings — no utf8 re-encoding. *)

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

(* Streaming pull model matching Response.body.getReader().
   The callback receives status, headers and a read function that yields
   the next byte chunk or None at end of stream. *)
val send_stream
  :  request
  -> (int -> (string * string) list -> (unit -> string option Db_worker_effect.t) -> 'a Db_worker_effect.t)
  -> 'a Db_worker_effect.t
