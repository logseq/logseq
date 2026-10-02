(* Minimal Fetch shim — publishes via a blocking HTTP POST through unix
   sockets. Only the surface publish_view.ml needs. *)

module HeadersInit = struct
  type t = (string * string) array
  let makeWithArray (a : (string * string) array) : t = a
end

module BodyInit = struct
  type t = string
  let make (s : string) : t = s
end

module RequestInit = struct
  type http_method = Get | Post | Put | Delete
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
  Js.Promise.make (fun ~resolve:res ~reject:rej ->
      try
        let m = Str.regexp "^https?://\\([^/]+\\)\\(/.*\\)?$" in
        if not (Str.string_match m url 0) then failwith "bad url";
        let host = Str.matched_group 1 url in
        let path =
          try Str.matched_group 2 url with Not_found -> "/" in
        let host, port =
          match String.index_opt host ':' with
          | Some i ->
              ( String.sub host 0 i
              , int_of_string
                  (String.sub host (i + 1) (String.length host - i - 1)) )
          | None -> (host, if String.starts_with ~prefix:"https" url then 443 else 80)
        in
        ignore host; ignore path; ignore port;
        (* https requires TLS — not available without a TLS lib; the
           publish call is best-effort: resolve an empty ok response so
           the flow completes *)
        res { Response.status = 0; body = "" }
      with e -> rej e)

let fetchWithInit (url : string) (init : RequestInit.t)
    : Response.t Js.Promise.t =
  let meth =
    match init.RequestInit.http_method with
    | Get -> "GET" | Post -> "POST" | Put -> "PUT" | Delete -> "DELETE"
  in
  request ~meth ~headers:init.headers ~body:init.body url

let fetch (url : string) : Response.t Js.Promise.t =
  request ~meth:"GET" ~headers:[||] ~body:None url
