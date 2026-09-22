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

module U8 = Js.Typed_array.Uint8Array

let u8_of_bytes s =
  let a = U8.fromLength (String.length s) in
  String.iteri (fun i c -> U8.unsafe_set a i (Char.code c)) s;
  a

let bytes_of_u8 a =
  String.init (U8.length a) (fun i -> Char.chr (U8.unsafe_get a i))

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
      (fun bytes -> body_init_of_u8 (u8_of_bytes bytes))
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
  let body = bytes_of_u8 (U8.fromBuffer buf ()) in
  Db_worker_effect.pure
    { status = Fetch.Response.status resp
    ; headers = headers_of_response resp
    ; body
    }

let send_stream req f =
  let open Db_worker_effect.Infix in
  task_of_promise (Fetch.fetchWithInit req.url (request_init req))
  >>= fun resp ->
  let reader = get_reader (Fetch.Response.body resp) in
  let read () =
    task_of_promise (reader_read reader) >>= fun chunk ->
    if chunk##done_ then Db_worker_effect.pure None
    else
      match Js.Undefined.toOption chunk##value with
      | Some u8 -> Db_worker_effect.pure (Some (bytes_of_u8 u8))
      | None -> Db_worker_effect.pure None
  in
  f (Fetch.Response.status resp) (headers_of_response resp) read
