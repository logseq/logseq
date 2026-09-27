(* Toast helpers: Toast.show pushes a toast straight into the model;
   init wires the document 'ls:toast' CustomEvent so any code (including
   the plugin SDK bridge) can raise one without an Action dep.
   detail contract: { msg : string, cls : string }; 'ls:toast-close'
   { key } dismisses the most recent toast. *)

let show ~kind msg =
  Runtime.send
    (Action.Toast_push
       { Model.toast_id = 0; toast_text = msg; toast_kind = kind });
  Runtime.flush ()

let success msg = show ~kind:"success" msg
let error msg = show ~kind:"error" msg
let warning msg = show ~kind:"warning" msg

(* live toast ids in mount order, tracked for auto-dismiss + ls:toast-close *)
let live_ids : int list ref = ref []
let timers : (int, int) Hashtbl.t = Hashtbl.create 8

let dismiss id =
  live_ids := List.filter (fun i -> i <> id) !live_ids;
  (match Hashtbl.find_opt timers id with
   | Some t ->
       Browser_ui.clear_timeout t;
       Hashtbl.remove timers id
   | None -> ());
  Runtime.send (Action.Toast_dismiss id);
  Runtime.flush ()

(* called from Toasts_view.toast_item on mount — idempotent per toast id *)
let schedule_dismiss ~ms id =
  if not (Hashtbl.mem timers id) then (
    let timer = Browser_ui.set_timeout (fun () -> dismiss id) ms in
    Hashtbl.replace timers id timer;
    live_ids := !live_ids @ [ id ])

let detail_field ev key =
  Js.Json.decodeString
    (Platform.json_prop (Platform.json_prop ev "detail") key)
  |> Option.value ~default:""

let init () =
  Platform.on_document_event "ls:toast" (fun ev ->
      let msg = detail_field ev "msg" in
      let cls =
        match detail_field ev "cls" with "" -> "info" | c -> c
      in
      if msg <> "" then show ~kind:cls msg);
  Platform.on_document_event "ls:toast-close" (fun _ ->
      match List.rev !live_ids with
      | id :: _ -> dismiss id
      | [] -> ())
