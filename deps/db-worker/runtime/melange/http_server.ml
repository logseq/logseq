(* Node `http` externals for the db-worker-node daemon. *)

type req
type res
type server = Js.Json.t

external create_server : (req -> res -> unit [@u]) -> server = "createServer"
  [@@mel.module "http"]

let create handler = create_server (fun [@u] req res -> handler req res)

external set_index_int : server -> string -> int -> unit = "" [@@mel.set_index]

let disable_timeouts server =
  set_index_int server "requestTimeout" 0;
  set_index_int server "headersTimeout" 0;
  set_index_int server "timeout" 0

external listen_ : server -> int -> string -> (unit -> unit [@u]) -> unit
  = "listen" [@@mel.send]

external server_on : server -> string -> (Js.Json.t -> unit [@u]) -> unit = "on"
  [@@mel.send]

external exn_message : Js.Json.t -> string option = "message"
  [@@mel.get] [@@mel.return { undefined_to_opt }]

let listen server ~port ~host =
  let task, resolver = Db_worker_effect.wait () in
  let finish result =
    if Db_worker_effect.is_pending task then
      Db_worker_effect.wakeup resolver result
  in
  listen_ server port host (fun [@u] () -> finish (Ok port));
  server_on server "error" (fun [@u] e ->
      let msg = Option.value (exn_message e) ~default:"http server error" in
      finish (Error msg));
  Db_worker_effect.bind task (function
    | Ok port -> Db_worker_effect.pure port
    | Error message -> Db_worker_effect.error (Failure message))

external address : server -> Js.Json.t Js.null = "address" [@@mel.send]
external address_port_ : Js.Json.t -> int = "port" [@@mel.get]

let address_port server =
  Option.map (fun a -> address_port_ a) (Js.nullToOption (address server))

external close_ : server -> (unit -> unit [@u]) -> unit = "close" [@@mel.send]
external close_idle : server -> unit = "closeIdleConnections" [@@mel.send]

(* cljs close-server!: server.close(cb) resolves true, then eagerly
   closeIdleConnections. *)
let close server =
  let task, resolver = Db_worker_effect.wait () in
  close_ server (fun [@u] () ->
      close_idle server;
      Db_worker_effect.wakeup resolver true);
  close_idle server;
  task

external req_method : req -> string = "method" [@@mel.get]
external req_url : req -> string = "url" [@@mel.get]
external req_on : req -> string -> 'a -> unit = "on" [@@mel.send]

let on_close req f = req_on req "close" (fun [@u] () -> f ())

let read_body_chunks req collect =
  let task, resolver = Db_worker_effect.wait () in
  let finish result =
    if Db_worker_effect.is_pending task then
      Db_worker_effect.wakeup resolver result
  in
  req_on req "data" (fun [@u] (chunk : Node.Buffer.t) -> collect := chunk :: !collect);
  req_on req "end" (fun [@u] () -> finish (Ok ()));
  req_on req "error" (fun [@u] (e : Js.Json.t) ->
      finish (Error (Option.value (exn_message e) ~default:"request error")));
  Db_worker_effect.bind task (function
    | Ok () -> Db_worker_effect.pure ()
    | Error message -> Db_worker_effect.error (Failure message))

let read_body req =
  let chunks = ref [] in
  Db_worker_effect.map
    (fun () -> Node.Buffer.toString (Node.Buffer.concat (Array.of_list (List.rev !chunks))))
    (read_body_chunks req chunks)

(* raw bytes of a Buffer — latin1 keeps each byte 1:1; utf8 toString
   would corrupt non-ASCII bytes. *)
let bytes_of_buffer (b : Node.Buffer.t) =
  Node.Buffer.toString ~encoding:`latin1 b

let read_body_buffer req =
  let chunks = ref [] in
  Db_worker_effect.map
    (fun () -> bytes_of_buffer (Node.Buffer.concat (Array.of_list (List.rev !chunks))))
    (read_body_chunks req chunks)

external write_head_ : res -> int -> Js.Json.t -> unit = "writeHead" [@@mel.send]

let write_head res ~status ~headers =
  let dict = Js.Dict.empty () in
  List.iter (fun (k, v) -> Js.Dict.set dict k (Js.Json.string v)) headers;
  write_head_ res status (Js.Json.object_ dict)

external res_write : res -> string -> unit = "write" [@@mel.send]
external res_end_ : res -> unit = "end" [@@mel.send]

let write res s = res_write res s
let res_end res = res_end_ res
