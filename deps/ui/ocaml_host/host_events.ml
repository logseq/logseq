(* Window-system damage is independent of application-store changes. *)
let requires_repaint : Tsdl.Sdl.Event.window_event_enum -> bool = function
  | `Exposed | `Restored | `Shown -> true
  | _ -> false

(* Document capture owns Escape before an overlay's native dismissal. *)
let dispatch_key ~document ~default =
  let prevented = document () in
  if not prevented then default ();
  prevented

(* A missing text format is not an instruction to delete the selection. *)
let paste_text ~insert text =
  if text <> "" then insert text

(* Electron's standard View menu supplies bare F11 off macOS. *)
let fullscreen_shortcut ~is_macos ~repeat ~scancode ~keymod =
  let open Tsdl.Sdl in
  not is_macos && not repeat && scancode = Scancode.f11
  && keymod land Kmod.(ctrl lor alt lor shift lor gui) = 0

(* Non-macOS captions are drawn by the app, not by the window manager. *)
let window_flags ~is_macos ~gl =
  let open Tsdl.Sdl in
  let base = Window.(resizable + allow_highdpi + shown) in
  let base = if is_macos then base else Window.(base + borderless) in
  if gl then Window.(base + opengl) else base

(* Constructor order is shared with the SDL callback in ocaml_host_stubs.c. *)
type window_hit =
  | Normal | Draggable | Resize_top_left | Resize_top | Resize_top_right
  | Resize_right | Resize_bottom_right | Resize_bottom | Resize_bottom_left | Resize_left

let window_hit_test ~maximized ~fullscreen ~draggable ~width ~height ~x ~y =
  if fullscreen then Normal
  else if not maximized && (x < 5 || x >= width - 5 || y < 5 || y >= height - 5) then
    if y < 5 then
      if x < 5 then Resize_top_left else if x >= width - 5 then Resize_top_right else Resize_top
    else if y >= height - 5 then
      if x < 5 then Resize_bottom_left else if x >= width - 5 then Resize_bottom_right else Resize_bottom
    else if x < 5 then Resize_left else Resize_right
  else if draggable then Draggable else Normal

let rec window_draggable ~kind ~identifier ~parent id =
  match kind id with
  | "button" | "link" | "menu-item" | "toggle" | "checkbox"
  | "text-field" | "search-field" | "secure-field" | "textarea"
  | "input" | "extension:logseq-editor" -> false
  | _ ->
    identifier id = Some "head" || match parent id with
      | Some ancestor -> window_draggable ~kind ~identifier ~parent ancestor
      | None -> false
