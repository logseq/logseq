(* fetch via melange-fetch; Js.Promise lifted into Db_worker_effect
   following cli_platform.HTTP.promise_to_effect. *)

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

let send req =
  let open Db_worker_effect.Infix in
  let init =
    Fetch.RequestInit.make ~method_:(method_of_string req.method_)
      ~headers:(Fetch.HeadersInit.makeWithDict (Js.Dict.fromList req.headers))
      ?body:(Option.map Fetch.BodyInit.make req.body)
      ()
  in
  task_of_promise (Fetch.fetchWithInit req.url init) >>= fun resp ->
  task_of_promise (Fetch.Response.text resp) >>= fun body ->
  Db_worker_effect.pure
    { status = Fetch.Response.status resp; headers = []; body }

let send_binary req =
  let open Db_worker_effect.Infix in
  send req >>= fun r -> Db_worker_effect.pure r.body
