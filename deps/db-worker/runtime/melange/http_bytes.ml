(* Binary HTTP over fetch — request bodies and response bodies are raw byte
   strings shuttled through Uint8Array; response headers are preserved. *)

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


external promise_error_message : Js.Promise.error -> string option = "message"
  [@@mel.get] [@@mel.return { undefined_to_opt }]

let task_of_promise promise =
  let task, resolver = Db_worker_effect.wait () in
  let finish result =
    if Db_worker_effect.is_pending task then Db_worker_effect.wakeup resolver result
  in
  let on_ok value = finish (Ok value); Js.Promise.resolve () in
  let on_error error =
    let message =
      Option.value (promise_error_message error) ~default:"JavaScript promise rejected"
    in
    finish (Error message);
    Js.Promise.resolve ()
  in
  ignore
    (promise |> Js.Promise.then_ on_ok |> Js.Promise.catch on_error
      : unit Js.Promise.t);
  Db_worker_effect.bind task (function
    | Ok value -> Db_worker_effect.pure value
    | Error message -> Db_worker_effect.error (Failure message))

let method_of_string = function
  | "POST" -> Fetch.Post
  | "PUT" -> Fetch.Put
  | "PATCH" -> Fetch.Patch
  | "DELETE" -> Fetch.Delete
  | "HEAD" -> Fetch.Head
  | "OPTIONS" -> Fetch.Options
  | "CONNECT" -> Fetch.Connect
  | "TRACE" -> Fetch.Trace
  | _ -> Fetch.Get

module U8 = Js.Typed_array.Uint8Array

external body_init_of_u8 : U8.t -> Fetch.bodyInit = "%identity"
external resp_array_buffer : Fetch.Response.t -> Js.arrayBuffer Js.Promise.t
  = "arrayBuffer" [@@mel.send]
type js_iter

external headers_entries_iter : Fetch.Headers.t -> js_iter = "entries"
  [@@mel.send]

external array_from : js_iter -> string array array = "from"
  [@@mel.scope "Array"]

let headers_of_response resp : (string * string) list =
  let h = Fetch.Response.headers resp in
  try
    let it = headers_entries_iter h in
    let arr = array_from it in
    Array.fold_left
      (fun acc pair ->
         match Array.length pair with
         | 2 -> (Array.unsafe_get pair 0, Array.unsafe_get pair 1) :: acc
         | _ -> acc)
      [] arr
    |> List.rev
  with _ -> []

type js_reader

external get_reader : Fetch.readableStream -> js_reader = "getReader"
  [@@mel.send]

external reader_read :
  js_reader -> < done_ : bool ; value : U8.t Js.undefined > Js.t Js.Promise.t
  = "read" [@@mel.send]

let request_init (req : request) =
  let body =
    Option.map
      (fun bytes -> body_init_of_u8 (U8a.of_string bytes))
      req.body
  in
  Fetch.RequestInit.make ~method_:(method_of_string req.method_)
    ~headers:(Fetch.HeadersInit.makeWithDict (Js.Dict.fromList req.headers))
    ?body
    ()

let send req =
  let open Db_worker_effect.Infix in
  task_of_promise (Fetch.fetchWithInit req.url (request_init req))
  >>= fun resp ->
  task_of_promise (resp_array_buffer resp) >>= fun buf ->
  let body = U8a.to_string (U8.fromBuffer buf ()) in
  Db_worker_effect.pure
    { status = Fetch.Response.status resp
    ; headers = headers_of_response resp
    ; body
    }

type js_writer
type js_writable
type js_transform

external decompression_stream : string -> js_transform
  = "DecompressionStream" [@@mel.new]

external transform_writable : js_transform -> js_writable
  = "writable" [@@mel.get]

external transform_readable : js_transform -> Fetch.readableStream
  = "readable" [@@mel.get]

external get_writer : js_writable -> js_writer = "getWriter"
  [@@mel.send]

external writer_write : js_writer -> U8.t -> unit Js.Promise.t = "write"
  [@@mel.send]

external writer_close : js_writer -> unit Js.Promise.t = "close" [@@mel.send]

let chunk_done (c : < done_ : bool ; value : U8.t Js.undefined > Js.t) =
  c##done_

let read_u8_chunk reader : U8.t option Db_worker_effect.t =
  let open Db_worker_effect.Infix in
  task_of_promise (reader_read reader) >>= fun chunk ->
  if chunk_done chunk then Db_worker_effect.pure None
  else
    Db_worker_effect.pure (Js.Undefined.toOption chunk##value)

(* Feed a raw reader + already-probed first chunk through a
   DecompressionStream. Writes are issued fire-and-forget (the transform
   queues them FIFO); awaiting each write could deadlock against a
   backpressured transform, so write/close rejections are captured and
   surfaced on the next read — mirroring cljs's
   pipeThrough(DecompressionStream) instead of buffering the whole body. *)
let gunzip_reader src (first : U8.t)
    : unit -> string option Db_worker_effect.t =
  let open Db_worker_effect.Infix in
  let ds = decompression_stream "gzip" in
  let out = get_reader (transform_readable ds) in
  let writer = get_writer (transform_writable ds) in
  let queued : U8.t Queue.t = Queue.create () in
  Queue.add first queued;
  let src_done = ref false in
  let io_error = ref None in
  let record_error e =
    io_error :=
      Some
        (Option.value (promise_error_message e)
           ~default:"decompression stream failed");
    Js.Promise.resolve ()
  in
  fun () ->
    (if !src_done || not (Queue.is_empty queued) then
       Db_worker_effect.pure ()
     else
       read_u8_chunk src >>= fun next ->
       match next with
       | Some u8 ->
           Queue.add u8 queued;
           Db_worker_effect.pure ()
       | None ->
           src_done := true;
           ignore (Js.Promise.catch record_error (writer_close writer));
           Db_worker_effect.pure ())
    >>= fun () ->
    (if Queue.is_empty queued then ()
     else
       ignore
         (Js.Promise.catch record_error
            (writer_write writer (Queue.pop queued))));
    match !io_error with
    | Some message -> Db_worker_effect.error (Failure message)
    | None ->
        read_u8_chunk out >>= fun chunk ->
        (match chunk with
         | Some u8 -> Db_worker_effect.pure (Some (U8a.to_string u8))
         | None -> Db_worker_effect.pure None)

let gzip_magic (u8 : U8.t) =
  U8.length u8 >= 2 && U8.unsafe_get u8 0 = 0x1f
  && U8.unsafe_get u8 1 = 0x8b

let send_stream req f =
  let open Db_worker_effect.Infix in
  task_of_promise (Fetch.fetchWithInit req.url (request_init req))
  >>= fun resp ->
  let headers = headers_of_response resp in
  let status = Fetch.Response.status resp in
  let reader = get_reader (Fetch.Response.body resp) in
  let plain_read first : unit -> string option Db_worker_effect.t =
    let first = ref (Some first) in
    fun () ->
      match !first with
      | Some u8 ->
          first := None;
          Db_worker_effect.pure (Some (U8a.to_string u8))
      | None ->
          read_u8_chunk reader >>= fun chunk ->
          (match chunk with
           | Some u8 -> Db_worker_effect.pure (Some (U8a.to_string u8))
           | None -> Db_worker_effect.pure None)
  in
  (* cljs <stream-snapshot-row-batches! semantics: decode only when the
     response advertises content-encoding: gzip AND the first bytes carry
     the gzip magic — a transport that already decompressed (or an error
     body) passes through untouched. *)
  let gzip_encoded =
    List.exists
      (fun (k, v) ->
         String.lowercase_ascii k = "content-encoding" && v = "gzip")
      headers
  in
  read_u8_chunk reader >>= fun first ->
  match first with
  | Some u8 when gzip_encoded && gzip_magic u8 ->
      f status headers (gunzip_reader reader u8)
  | Some u8 -> f status headers (plain_read u8)
  | None -> f status headers (fun () -> Db_worker_effect.pure None)
