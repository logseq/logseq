(* WebSocket externals — sync (RTC) port will flesh out reconnection
   and buffering; this is the raw platform surface. *)
type t

type event =
  | Open
  | Message of string
  | Binary of string
  | Close of int * string
  | Error of string

external make_ws : string -> t = "WebSocket" [@@mel.new]

external add_listener : t -> string -> (Js.Json.t -> unit) -> unit = "addEventListener"
  [@@mel.send]

external send_ws : t -> string -> unit = "send" [@@mel.send]
external send_binary_ws : t -> string -> unit = "send" [@@mel.send]
external close_ws : t -> unit = "close" [@@mel.send]
external json_data : Js.Json.t -> Js.Json.t = "data" [@@mel.get]
external json_code : Js.Json.t -> int = "code" [@@mel.get]
external json_reason : Js.Json.t -> string = "reason" [@@mel.get]

let connect ~url ~on_event =
  let ws = make_ws url in
  add_listener ws "open" (fun _ -> on_event Open);
  add_listener ws "message" (fun ev ->
      on_event (Message (Js.Json.decodeString (json_data ev) |> Option.value ~default:"")));
  add_listener ws "close" (fun ev -> on_event (Close (json_code ev, json_reason ev)));
  add_listener ws "error" (fun _ -> on_event (Error "websocket error"));
  Db_worker_effect.pure ws

let send t data =
  send_ws t data;
  Db_worker_effect.pure ()

let send_binary t data =
  send_binary_ws t data;
  Db_worker_effect.pure ()

let close t =
  close_ws t;
  Db_worker_effect.pure ()
