open Lui_protocol

let check message condition = if not condition then failwith message
external blend_titlebar : unit -> unit = "logseq_native_titlebar_blend"
external input_chain : int -> bool = "logseq_native_input_chain"

external sidebar_vibrancy : float -> float -> float -> float -> bool -> unit = "logseq_native_sidebar_vibrancy"
external sidebar_hit : int -> bool = "logseq_native_sidebar_hit"

let () =
  let store = Lui_store.create () in
  List.iter (Lui_store.apply_op store)
    [CreateNode (1, Row); SetProp (1, DataAttrs, StringValue {|{"data-window-titlebar":"true"}|});
     CreateNode (2, Button); InsertChild (1,2,0)];
  let rect_of = function
    | 1 -> Lui_scene.rect 0. 0. 800. 96.
    | _ -> Lui_scene.rect 16. 16. 64. 64. in
  let regions = Native_window.drag_regions ~store ~rect_of ~scale:2. ~blocked:[] in
  let draggable x y =
    let rec find i =
      if i = Array.length regions then false
      else if x >= regions.(i+1) && y >= regions.(i+2)
        && x < regions.(i+1) +. regions.(i+3)
        && y < regions.(i+2) +. regions.(i+4) then regions.(i)=1.
      else find (i+5) in find 0 in
  check "Header button became a window drag area" (not (draggable 20. 20.));
  check "Header blank space cannot drag the window" (draggable 200. 20.);
  check "Document content became a window drag area" (not (draggable 200. 100.));
  let sdl_ok = function Ok x -> x | Error (`Msg message) -> failwith message in
  sdl_ok (Tsdl.Sdl.init Tsdl.Sdl.Init.video);
  let window = sdl_ok (Tsdl.Sdl.create_window "Native window regression"
      ~w:400 ~h:300 Tsdl.Sdl.Window.hidden) in
  if Host_platform.is_macos then begin
    check "SDL listener is missing before titlebar customization"
      (input_chain (Tsdl.Sdl.get_window_id window));
    blend_titlebar ();
    check "Titlebar customization detached SDL's mouse event responder"
      (input_chain (Tsdl.Sdl.get_window_id window));
    sidebar_vibrancy 0. 0. 100. 300. true;
    check "Decorative sidebar material intercepts mouse gestures"
      (not (sidebar_hit (Tsdl.Sdl.get_window_id window)))
  end;
  Tsdl.Sdl.start_text_input ();
  let input = Native_window.text_input () in
  Native_window.hold_pointer input true;
  Native_window.request_text_input input false;
  check "Focus loss changes the AppKit responder between mouse down and up"
    (Tsdl.Sdl.is_text_input_active ());
  Native_window.hold_pointer input false;
  check "Text input remains active after the pointer gesture finishes"
    (not (Tsdl.Sdl.is_text_input_active ()));
  Native_window.hold_pointer input true;
  Native_window.request_text_input input true;
  Native_window.request_text_input input false;
  Native_window.hold_pointer input false;
  check "A cancelled focus transition starts stale text input"
    (not (Tsdl.Sdl.is_text_input_active ()));
  let repaints = ref 0 in
  Native_window.install window (fun () -> incr repaints);
  let event = Tsdl.Sdl.Event.create () in
  Tsdl.Sdl.Event.set event Tsdl.Sdl.Event.typ Tsdl.Sdl.Event.window_event;
  Tsdl.Sdl.Event.set event Tsdl.Sdl.Event.window_window_id (Tsdl.Sdl.get_window_id window);
  Tsdl.Sdl.Event.set event Tsdl.Sdl.Event.window_event_id Tsdl.Sdl.Event.window_event_exposed;
  ignore (sdl_ok (Tsdl.Sdl.push_event event));
  check "Live resize waits for the blocked polling loop before painting" (!repaints=1);
  Native_window.dispose window;
  ignore (sdl_ok (Tsdl.Sdl.push_event event));
  check "Disposed window retained its live resize callback" (!repaints=1);
  Tsdl.Sdl.destroy_window window;
  Tsdl.Sdl.quit ();
  print_endline "native window drag and live resize: OK"
