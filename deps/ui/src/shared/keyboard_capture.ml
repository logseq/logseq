(* Exclusive, scope-owned keyboard recording before ordinary UI dispatch. *)
let owner : (Ui_services.ev -> unit) option ref = ref None
let installed = ref false
let active () = Option.is_some !owner

let dispatch ev =
  match !owner with
  | None -> ()
  | Some handler ->
      ev.Ui_services.prevent_default ();
      ev.Ui_services.stop_immediate ();
      handler ev

let acquire ~scope handler =
  if active () then invalid_arg "Keyboard capture already owned";
  owner := Some handler;
  Signal.on_dispose scope (fun () -> owner := None)

let install () =
  if not !installed then begin
    installed := true;
    Ui_services.dom_on_document_event ~capture:true "keydown" dispatch;
    List.iter
      (fun name ->
        Ui_services.dom_on_document_event ~capture:true name (fun ev ->
            if active () then begin
              ev.Ui_services.prevent_default ();
              ev.Ui_services.stop_immediate ()
            end))
      [ "keyup"; "keypress" ]
  end
