(* gzip via CompressionStream / DecompressionStream.
   Implemented as Blob -> stream -> pipeThrough -> Response.arrayBuffer so it
   works on both browser workers and modern Node. *)

module U8 = Js.Typed_array.Uint8Array

let u8_of_bytes s =
  let a = U8.fromLength (String.length s) in
  String.iteri (fun i c -> U8.unsafe_set a i (Char.code c)) s;
  a

let bytes_of_u8 a =
  String.init (U8.length a) (fun i -> Char.chr (U8.unsafe_get a i))

type js_stream
type js_blob
type js_response

external compression_stream : string -> js_stream = "CompressionStream"
  [@@mel.new]

external decompression_stream : string -> js_stream = "DecompressionStream"
  [@@mel.new]

external cs_ctor : Js.Json.t = "CompressionStream" [@@mel.scope "globalThis"]

external blob_of_u8s : U8.t array -> js_blob = "Blob" [@@mel.new]
external blob_stream : js_blob -> js_stream = "stream" [@@mel.send]
external pipe_through : js_stream -> js_stream -> js_stream = "pipeThrough"
  [@@mel.send]

external response_of_stream : js_stream -> js_response = "Response"
  [@@mel.new]

external resp_array_buffer : js_response -> Js.arrayBuffer Js.Promise.t
  = "arrayBuffer" [@@mel.send]

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

let supported () = Js.typeof cs_ctor = "function"

let run ctor bytes =
  let u8 = u8_of_bytes bytes in
  let blob = blob_of_u8s [| u8 |] in
  let out = pipe_through (blob_stream blob) (ctor "gzip") in
  task_of_promise
    (Js.Promise.then_
       (fun buf -> Js.Promise.resolve (bytes_of_u8 (U8.fromBuffer buf ())))
       (resp_array_buffer (response_of_stream out)))

let gzip_encode bytes = run compression_stream bytes
let gzip_decode bytes = run decompression_stream bytes
