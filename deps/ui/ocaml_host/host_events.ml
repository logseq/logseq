(* Window-system damage is independent of application-store changes. *)
let requires_repaint : Tsdl.Sdl.Event.window_event_enum -> bool = function
  | `Exposed | `Restored | `Shown -> true
  | _ -> false
