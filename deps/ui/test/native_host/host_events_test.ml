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
  let calls = ref [] in
  let dispatch consumed =
    Host_events.dispatch_key
      ~document:(fun () -> calls := !calls @ [ "document" ]; consumed)
      ~default:(fun () -> calls := !calls @ [ "default" ]) in
  check "consumed Escape does not dismiss a host overlay" (dispatch true);
  check "document capture runs once before the consumed default" (!calls = [ "document" ]);
  calls := [];
  check "unconsumed Escape keeps the normal host default" (not (dispatch false));
  check "unconsumed host defaults run after document listeners"
    (!calls = [ "document"; "default" ]);
  print_endline "native window damage: OK"
