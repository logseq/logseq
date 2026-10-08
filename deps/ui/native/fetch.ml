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

(* "http-get" platform requests are answered by a same-named platform
   event carrying {id,status,body} — the host (gpui: curl in a worker
   thread) owns TLS. Resolvers keyed by request id so concurrent
   fetches pair correctly. *)
let http_pending : (int, Response.t -> unit) Hashtbl.t =
  Hashtbl.create 8

let http_seq = ref 0

let note_http_result (j : Js.Json.t) : unit =
  match j with
  | Js.Json.JObject kvs -> (
      let num k =
        match List.assoc_opt k kvs with
        | Some (Js.Json.JNumber n) -> int_of_float n
        | _ -> 0
      in
      let body =
        match List.assoc_opt "body" kvs with
        | Some (Js.Json.JString s) -> s
        | _ -> ""
      in
      match Hashtbl.find_opt http_pending (num "id") with
      | Some res ->
          Hashtbl.remove http_pending (num "id");
          res { Response.status = num "status"; body }
      | None -> ())
  | _ -> ()

let request ~(meth : string) ~(headers : (string * string) array)
    ~(body : string option) (url : string) : Response.t Js.Promise.t =
  Js.Promise.make (fun ~resolve:res ~reject:rej ->
      try
        let m = Str.regexp "^https?://" in
        if not (Str.string_match m url 0) then failwith "bad url";
        ignore meth; ignore headers; ignore body;
        incr http_seq;
        let id = !http_seq in
        Hashtbl.replace http_pending id res;
        Host.http_get id url
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
