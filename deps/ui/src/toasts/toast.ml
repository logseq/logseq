(* Toast helpers: Toast.show pushes a toast straight into the model.
   Document 'ls:toast'/'ls:toast-close' CustomEvents are wired by
   Worker_events.init; don't double-listen here. *)

let show ?key ~kind msg =
  Runtime.send
    (Action.Toast_push
       { Model.toast_id = 0
       ; toast_text = msg
       ; toast_kind = kind
       ; toast_key = key
       });
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
       Web_dom.clear_timeout t;
       Hashtbl.remove timers id
   | None -> ());
  Runtime.send (Action.Toast_dismiss id);
  Runtime.flush ()

(* called from Toasts_view.toast_item on mount — idempotent per toast id *)
let schedule_dismiss ~ms id =
  if not (Hashtbl.mem timers id) then (
    let timer = Web_dom.set_timeout_id (fun () -> dismiss id) ms in
    Hashtbl.replace timers id timer;
    live_ids := !live_ids @ [ id ])


