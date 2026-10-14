(* Window-system damage is independent of application-store changes. *)
let requires_repaint : Tsdl.Sdl.Event.window_event_enum -> bool = function
  | `Exposed | `Restored | `Shown -> true
  | _ -> false

(* Document capture owns Escape before an overlay's native dismissal. *)
let dispatch_key ~document ~default =
  let prevented = document () in
  if not prevented then default ();
  prevented
