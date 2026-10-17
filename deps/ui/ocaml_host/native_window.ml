external set_drag_regions : int -> float array -> unit = "logseq_native_drag_regions"
external watch_expose : int -> bool -> unit = "logseq_native_watch_expose"
external performance_time : unit -> float = "logseq_native_performance_time"
external reduced_motion : unit -> bool = "logseq_native_reduced_motion"
external presentable : int -> bool = "logseq_native_window_presentable"
external memory_usage : unit -> int * int * int = "logseq_native_memory_usage"
external software_begin : int -> int * int * int -> unit = "logseq_native_software_begin"
external software_tile : int -> int * int * int * bytes -> unit = "logseq_native_software_tile"
external software_present : int -> unit = "logseq_native_software_present"
external software_owned_bytes : int -> int = "logseq_native_software_owned_bytes"
external software_read : int -> bytes = "logseq_native_software_read"
external software_hit : int -> bool = "logseq_native_software_hit"
external software_dispose : int -> unit = "logseq_native_software_dispose"

type text_input = { mutable held : bool; mutable wanted : bool; mutable active : bool }
let text_input () =
  let active = Tsdl.Sdl.is_text_input_active () in
  {held=false; wanted=active; active}
let sync_text_input input =
  if not input.held && input.active <> input.wanted then begin
    if input.wanted then Tsdl.Sdl.start_text_input () else Tsdl.Sdl.stop_text_input ();
    input.active <- input.wanted
  end
let request_text_input input enabled = input.wanted <- enabled; sync_text_input input
let hold_pointer input held = input.held <- held; sync_text_input input

let drag_regions ~store ~rect_of ~scale ~blocked =
  let headers = ref [] and controls = ref blocked in
  List.iter (fun id ->
    let rect = rect_of id in
    if rect.Lui_scene.w > 0. && rect.h > 0. then begin
      if Host_interaction.has_attribute
           (Option.value (Lui_store.string_prop store id "data-attrs") ~default:"")
           "data-window-titlebar" then headers := rect :: !headers;
      if Lui_store.kind store id = "button"
         || Lui_store.bool_prop store id "press-enabled" then
        controls := rect :: !controls
    end) (Lui_store.preorder store);
  let encode draggable (rect : Lui_scene.rect) =
    [draggable; rect.x /. scale; rect.y /. scale; rect.w /. scale; rect.h /. scale]
  in
  Array.of_list (List.concat_map (encode 0.) !controls
    @ List.concat_map (encode 1.) !headers)

let install window repaint =
  Callback.register "logseq_native_expose" repaint;
  watch_expose (Tsdl.Sdl.get_window_id window) true

let dispose window =
  let id = Tsdl.Sdl.get_window_id window in
  watch_expose id false;
  software_dispose id;
  set_drag_regions id [||]


module Sdl = Tsdl.Sdl
module Input = Lui_window.Input

let mods_of_keymod km =
  Input.
    { ctrl = km land Sdl.Kmod.ctrl <> 0;
      shift = km land Sdl.Kmod.shift <> 0;
      alt = km land Sdl.Kmod.alt <> 0;
      meta = km land Sdl.Kmod.gui <> 0 }

type input_state = { mutable keymod : int }
let input_state ~keymod = {keymod}
let current_modifiers state = mods_of_keymod state.keymod

(* SDL pumping updates its global modifiers before queued events are
   consumed. Follow each dequeued key's own snapshot so rapid releases
   cannot change an earlier click, wheel event or text commit. *)
let input_of_event state e =
  let open Input in
  let kind = Sdl.Event.enum (Sdl.Event.get e Sdl.Event.typ) in
  (match kind with
   | `Key_down | `Key_up ->
       state.keymod <- Sdl.Event.get e Sdl.Event.keyboard_keymod
   | `Window_event ->
       (match Sdl.Event.window_event_enum
          (Sdl.Event.get e Sdl.Event.window_event_id) with
        | `Focus_lost -> state.keymod <- 0
        | `Focus_gained -> state.keymod <- Sdl.get_mod_state ()
        | _ -> ())
   | _ -> ());
  match kind with
  | `Window_event -> (
      match
        Sdl.Event.window_event_enum
          (Sdl.Event.get e Sdl.Event.window_event_id)
      with
      | `Resized | `Size_changed ->
        Some
          (Resize
             ( Int32.to_int (Sdl.Event.get e Sdl.Event.window_data1)
             , Int32.to_int (Sdl.Event.get e Sdl.Event.window_data2) ))
      | `Close -> Some Quit_input
      | _ -> None)
  | `Key_down ->
    Some
      (Key_down
         ( Input.key_of_sdl_scancode
             (Sdl.Event.get e Sdl.Event.keyboard_scancode)
         , mods_of_keymod (Sdl.Event.get e Sdl.Event.keyboard_keymod)
         , Sdl.Event.get e Sdl.Event.keyboard_repeat <> 0 ))
  | `Text_input ->
    (* SDL on X11 still commits TEXTINPUT for Ctrl/Super chords whose
       keysym is not a letter (Ctrl+, Ctrl+. Ctrl+/ ...), so a shortcut
       also typed its punctuation into the focused editor. Browsers never
       insert text for a Ctrl/Meta chord; drop it here. Ctrl+Alt stays
       (Windows AltGr layouts report it). *)
    let m = current_modifiers state in
    if (m.Input.ctrl && not m.Input.alt) || m.Input.meta then None
    else Some (Text_input (Sdl.Event.get e Sdl.Event.text_input_text))
  | `Text_editing ->
    Some
      (Text_editing
         ( Sdl.Event.get e Sdl.Event.text_editing_text
         , Sdl.Event.get e Sdl.Event.text_editing_start
         , Sdl.Event.get e Sdl.Event.text_editing_length ))
  | `Mouse_motion ->
    Some
      (Move
         ( float (Sdl.Event.get e Sdl.Event.mouse_motion_x)
         , float (Sdl.Event.get e Sdl.Event.mouse_motion_y) ))
  | `Mouse_button_down ->
    Some
      (Button_down
         ( float (Sdl.Event.get e Sdl.Event.mouse_button_x)
         , float (Sdl.Event.get e Sdl.Event.mouse_button_y)
         , Input.button_of_sdl
             (Sdl.Event.get e Sdl.Event.mouse_button_button)
         , Sdl.Event.get e Sdl.Event.mouse_button_clicks
         , current_modifiers state ))
  | `Mouse_button_up ->
    Some
      (Button_up
         ( float (Sdl.Event.get e Sdl.Event.mouse_button_x)
         , float (Sdl.Event.get e Sdl.Event.mouse_button_y)
         , Input.button_of_sdl
             (Sdl.Event.get e Sdl.Event.mouse_button_button)
         , current_modifiers state ))
  | `Mouse_wheel ->
    Some
      (Wheel_mods
         ( float (Sdl.Event.get e Sdl.Event.mouse_wheel_x)
         , float (Sdl.Event.get e Sdl.Event.mouse_wheel_y)
         , current_modifiers state ))
  | `Drop_file ->
    let s = Sdl.Event.drop_file_file e in
    Sdl.Event.drop_file_free e;
    (match s with Some f -> Some (Drop_file f) | None -> None)
  | `Drop_text ->
    let s = Sdl.Event.drop_file_file e in
    Sdl.Event.drop_file_free e;
    (match s with Some t -> Some (Drop_text t) | None -> None)
  | `Drop_begin | `Drop_complete -> None
  | `Quit -> Some Quit_input
  | _ -> None
