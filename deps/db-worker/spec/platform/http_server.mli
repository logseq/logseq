(* Node `http` server surface for the db-worker-node daemon port
   (frontend.worker.db-worker-node). Node-only: the native
   implementation raises [Invalid_argument]. *)

type server
type req
type res

val create : (req -> res -> unit) -> server

(* requestTimeout/headersTimeout/timeout <- 0 like cljs make-server. *)
val disable_timeouts : server -> unit

(* server.listen(port, host, cb) + server.on("error", reject);
   resolves to the bound port once listening (0 -> ephemeral). *)
val listen : server -> port:int -> host:string -> int Db_worker_effect.t

(* .address() port; [None] when not bound/closed. *)
val address_port : server -> int option

(* server.close(cb) + closeIdleConnections; resolves true on success. *)
val close : server -> bool Db_worker_effect.t

(* IncomingMessage *)
val req_method : req -> string
val req_url : req -> string
val on_close : req -> (unit -> unit) -> unit

(* Collects "data" chunks until "end"; rejects on request "error".
   utf8 text for read_body; read_body_buffer preserves raw bytes
   (Buffer.concat -> byte string). *)
val read_body : req -> string Db_worker_effect.t
val read_body_buffer : req -> string Db_worker_effect.t

(* ServerResponse *)
val write_head : res -> status:int -> headers:(string * string) list -> unit
val write : res -> string -> unit
val res_end : res -> unit
