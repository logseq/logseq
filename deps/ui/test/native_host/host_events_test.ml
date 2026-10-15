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
  let pasted = ref [] in
  Host_events.paste_text ~insert:(fun text -> pasted := text :: !pasted) "";
  check "empty native clipboard text does not replace an editor selection" (!pasted = []);
  Host_events.paste_text ~insert:(fun text -> pasted := text :: !pasted) " ";
  check "nonempty native clipboard text preserves whitespace" (!pasted = [ " " ]);
  print_endline "native window damage: OK"

let () =
  let fullscreen ?(mac = false) ?(repeat = false) ?(mods = Tsdl.Sdl.Kmod.none) key =
    Host_events.fullscreen_shortcut ~is_macos:mac ~repeat ~scancode:key ~keymod:mods in
  check "the desktop View-menu F11 shortcut enters fullscreen off macOS"
    (fullscreen Tsdl.Sdl.Scancode.f11);
  check "modified F11 does not activate the bare fullscreen shortcut"
    (not (fullscreen ~mods:Tsdl.Sdl.Kmod.ctrl Tsdl.Sdl.Scancode.f11));
  check "fullscreen does not oscillate on key repeat"
    (not (fullscreen ~repeat:true Tsdl.Sdl.Scancode.f11));
  check "macOS keeps its existing system fullscreen shortcut"
    (not (fullscreen ~mac:true Tsdl.Sdl.Scancode.f11));
  check "other function keys do not toggle fullscreen"
    (not (fullscreen Tsdl.Sdl.Scancode.f10))

let () =
  let open Tsdl.Sdl in
  let normal = Host_events.window_flags ~is_macos:false ~gl:false in
  check "custom desktop captions do not retain a second system titlebar"
    (Window.test normal Window.borderless);
  check "custom desktop windows remain resizable and high-DPI aware"
    (Window.test normal Window.resizable && Window.test normal Window.allow_highdpi);
  check "macOS retains its system window decorations"
    (not (Window.test (Host_events.window_flags ~is_macos:true ~gl:false) Window.borderless));
  check "only the GL backend requests an OpenGL window"
    (not (Window.test normal Window.opengl)
     && Window.test (Host_events.window_flags ~is_macos:false ~gl:true) Window.opengl)

let () =
  let hit ?(maximized = false) ?(fullscreen = false) ?(draggable = false) x y =
    Host_events.window_hit_test ~maximized ~fullscreen ~draggable
      ~width:1280 ~height:900 ~x ~y in
  check "unused header space remains draggable without system decorations"
    (hit ~draggable:true 400 24 = Host_events.Draggable);
  check "caption controls and modal surfaces remain ordinary input"
    (hit 1208 24 = Host_events.Normal);
  check "borderless corners and edges resize in every direction"
    (List.map (fun (x, y) -> hit x y)
       [ 0,0; 600,0; 1279,0; 1279,450; 1279,899; 600,899; 0,899; 0,450 ]
     = Host_events.[ Resize_top_left; Resize_top; Resize_top_right; Resize_right;
         Resize_bottom_right; Resize_bottom; Resize_bottom_left; Resize_left ]);
  check "maximized windows cannot resize from their edges"
    (hit ~maximized:true 0 450 = Host_events.Normal);
  check "fullscreen windows cannot move or resize from the app header"
    (hit ~fullscreen:true ~draggable:true 400 24 = Host_events.Normal)
