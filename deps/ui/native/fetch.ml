(* Native HTTP uses the framework's libcurl client off the UI thread.
   Promise completion returns through the owning application's mailbox. *)

module HeadersInit = struct
  type t = (string * string) array
  let makeWithArray (a : (string * string) array) : t = a
end

module BodyInit = struct
  type t = string
  let make (s : string) : t = s
end

type http_method = Get | Post | Put | Delete

module RequestInit = struct
  type t =
    { http_method : http_method
    ; headers : HeadersInit.t
    ; body : BodyInit.t option }
  let make ?(method_ = Get) ?(headers = [||]) ?body () : t =
    { http_method = method_; headers; body }
end

module Response = struct
  type t = { status : int; body : string }
  let ok (r : t) = r.status >= 200 && r.status < 300
  let text (r : t) : string Js.Promise.t = Js.Promise.resolve r.body
  let json (r : t) : Js.Json.t Js.Promise.t =
    try Js.Promise.resolve (Js.Json.parseExn r.body)
    with e -> Js.Promise.reject e
end

let request ~(meth : string) ~(headers : (string * string) array)
    ~(body : string option) (url : string) : Response.t Js.Promise.t =
  let promise,resolve,reject=Js.Promise.pending () in
  let request={ (Lui_plugin_fetch.request url) with
    meth;headers=Array.to_list headers;body=Option.value ~default:"" body } in
  ignore (Thread.create (fun () ->
    let result=try Lui_plugin_fetch.perform request
      with error -> Error (Printexc.to_string error) in
    Host.enqueue (fun () -> match result with
      | Ok response -> resolve {Response.status=response.status;body=response.body}
      | Error message -> reject (Failure message))) ());
  promise

let fetchWithInit (url : string) (init : RequestInit.t)
    : Response.t Js.Promise.t =
  let meth =
    match init.RequestInit.http_method with
    | Get -> "GET" | Post -> "POST" | Put -> "PUT" | Delete -> "DELETE"
  in
  request ~meth ~headers:init.headers ~body:init.body url

let fetch (url : string) : Response.t Js.Promise.t =
  request ~meth:"GET" ~headers:[||] ~body:None url
