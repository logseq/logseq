(* Port of electron.exceptions — forwards uncaught exceptions to the
   focused renderer and the debug log. *)

external process : 'a = "process"
external process_on : 'a -> string -> ('b -> unit [@u]) -> unit = "on"
  [@@mel.send]
external process_off : 'a -> string -> ('b -> unit [@u]) -> unit = "off"
  [@@mel.send]
external get_index : 'a -> string -> 'b Js.Undefined.t = ""
  [@@mel.get_index]

let uncaught_exception_chan = "uncaughtException"

let str_prop (o : 'a) (k : string) : string =
  match Js.Undefined.toOption (get_index o k) with
  | Some v -> Js.String.make v
  | None -> "undefined"

let app_uncaught_handler (e : 'a) : unit =
  let msg = str_prop e "message" in
  let stack = str_prop e "stack" in
  let payload = Js.Dict.empty () in
  Js.Dict.set payload "type" (Js.Json.string "error");
  Js.Dict.set payload "payload"
    (Js.Json.string ("[Main Exception]\n" ^ msg ^ "\n" ^ stack));
  Js.Dict.set payload "i18n-key"
    (Js.Json.string "electron/main-exception");
  Js.Dict.set payload "i18n-args" (Js.Json.stringArray [| msg; stack |]);
  Electron_utils.send_to_renderer "notification" payload;
  Electron_logger.error "uncaughtException %s" (Js.String.make e)

let setup_exception_listeners () : unit =
  process_on process uncaught_exception_chan
    (fun [@u] e -> app_uncaught_handler e)

(* cljs returns an unsubscribe fn *)
let teardown_exception_listeners () : unit =
  process_off process uncaught_exception_chan
    (fun [@u] e -> app_uncaught_handler e)
