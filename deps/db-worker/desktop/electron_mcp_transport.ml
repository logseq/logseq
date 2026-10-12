(* Port of electron.mcp-transport — hand a fastify request/response pair
   to an MCP transport. Kept apart from electron_mcp_server so the
   hand-off can be tested without loading the MCP SDK. *)

(* fastify request/reply and the underlying node req/res objects. *)
type request

type reply

(* node http.IncomingMessage / ServerResponse *)
type node_req

type node_res

(* MCP transport instances (StreamableHTTPServerTransport). Abstract
   here; constructed in Electron_mcp_server. *)
type transport

external req_raw : request -> node_req = "raw" [@@mel.get]
external reply_raw : reply -> node_res = "raw" [@@mel.get]
external req_url : request -> string = "url" [@@mel.get]
external req_headers : request -> Js.Json.t = "headers" [@@mel.get]
external req_body : request -> Js.Json.t option = "body"
  [@@mel.get] [@@mel.return { null_undefined_to_opt }]

external reply_get_headers : reply -> Js.Json.t = "getHeaders"
  [@@mel.send]
external reply_code : reply -> int -> reply = "code" [@@mel.send]
external reply_send : reply -> 'a -> unit = "send" [@@mel.send]
external reply_type : reply -> string -> reply = "type" [@@mel.send]

external raw_set_header : node_res -> string -> Js.Json.t -> unit
  = "setHeader" [@@mel.send]

(* copy-reply-headers! — fastify response headers back onto the raw
   node response before the transport takes over. *)
let copy_reply_headers (_req : request) (res : reply) : unit =
  match Js.Json.classify (reply_get_headers res) with
  | Js.Json.JSONObject dict ->
      Array.iter
        (fun (k, v) -> raw_set_header (reply_raw res) k v)
        (Js.Dict.entries dict)
  | _ -> ()

external handle_request_ : transport -> node_req -> node_res -> unit
  = "handleRequest" [@@mel.send]

external handle_request_body :
  transport -> node_req -> node_res -> Js.Json.t -> unit
  = "handleRequest" [@@mel.send]

(* handle-request! — 3-arity passes no body; 4-arity passes the parsed
   body (already a JS object from fastify, so clj->js is a no-op). *)
let handle_request (transport : transport) (req : request)
    (res : reply) : unit =
  copy_reply_headers req res;
  handle_request_ transport (req_raw req) (reply_raw res)

let handle_request_with_body (transport : transport) (req : request)
    (res : reply) (body : Js.Json.t) : unit =
  copy_reply_headers req res;
  handle_request_body transport (req_raw req) (reply_raw res) body
