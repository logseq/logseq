let check name condition = if not condition then failwith name

let () =
  check "uncovering the native window requests a repaint"
    (Host_events.requires_repaint `Exposed);
  check "restoring the native window requests a repaint"
    (Host_events.requires_repaint `Restored);
  check "showing the native window requests a repaint"
    (Host_events.requires_repaint `Shown);
  check "focus alone does not invalidate the painted scene"
    (not (Host_events.requires_repaint `Focus_gained));
  check "hiding the native window does not repaint it"
    (not (Host_events.requires_repaint `Hidden));
  print_endline "native window damage: OK"
