(* Toast helpers: Toast.show pushes a toast straight into the model.
   Document 'ls:toast'/'ls:toast-close' CustomEvents are wired by
   Worker_events.init; don't double-listen here. *)

let dismiss id =
  Runtime.send (Action.Toast_dismiss id);
  Runtime.flush ()

let show ?key ?duration ~kind msg =
  (* the pushed toast takes the model's toast_next as its id — read it
     before dispatch so the dismiss timer below names the right id *)
  let id = (Runtime.model ()).Model.toast_next in
  Runtime.send
    (Action.Toast_push
       { Model.toast_id = 0
       ; toast_text = msg
       ; toast_kind = kind
       ; toast_key = key
       });
  Runtime.flush ();
  (* the web toaster runs the duration countdown; the native retained
     host does not — the model owns it here *)
  let duration =
    Option.value duration
      ~default:(if kind = "error" then 0 else if key = None then 1500 else 2000)
  in
  if duration > 0 then
    ignore
      (Ui_services.timers_timeout (fun () -> dismiss id) duration)

let success msg = show ~kind:"success" msg
let error msg = show ~kind:"error" msg
let warning msg = show ~kind:"warning" msg

let dismiss_key key =
  Runtime.send (Action.Toast_dismiss_key key)
