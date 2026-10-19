(* Exclusive, scope-owned paste handling before ordinary editor dispatch. *)
let owner : (Ui_services.ev -> unit) option ref = ref None
let active () = Option.is_some !owner

let dispatch event =
  match !owner with
  | None -> false
  | Some handle ->
      event.Ui_services.prevent_default ();
      event.stop_immediate ();
      handle event;
      true

let acquire ~scope handle =
  if active () then invalid_arg "Paste capture already owned";
  owner:=Some handle;
  Signal.on_dispose scope (fun () -> owner:=None)
