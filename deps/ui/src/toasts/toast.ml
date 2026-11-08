(* Toast helpers: Toast.show pushes a toast straight into the model.
   Document 'ls:toast'/'ls:toast-close' CustomEvents are wired by
   Worker_events.init; don't double-listen here. *)

let dismiss id =
  Runtime.send (Action.Toast_dismiss id);
  Runtime.flush ()

let show ?key ?code ~kind msg =
  Option.iter (fun key -> Runtime.send (Action.Toast_dismiss_key key)) key;
  Runtime.send
    (Action.Toast_push
       { Model.toast_id = 0
       ; toast_text = msg
       ; toast_code = code
       ; toast_kind = kind
       ; toast_key = key
       });
  Runtime.flush ()

let success msg = show ~kind:"success" msg
let error msg = show ~kind:"error" msg
let warning msg = show ~kind:"warning" msg
let code ?(prefix = "") ?(copy_first = false) msg =
  show ~kind:"success"
    ~code:{Model.code_text = msg; code_copy_first = copy_first} (prefix ^ msg)
