external set_drag_regions : int -> float array -> unit = "logseq_native_drag_regions"
external watch_expose : int -> bool -> unit = "logseq_native_watch_expose"
external performance_time : unit -> float = "logseq_native_performance_time"

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
  set_drag_regions id [||]
