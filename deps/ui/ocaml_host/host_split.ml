(* Sidebar split gestures owned by the custom SDL host. Geometry is in
   device pixels; pointer coordinates and emitted fractions are logical. *)
open Lui_scene

type side = Left | Right
type target = { id : int; side : side; bounds : rect; grip : rect }
type capture = { owner : int; offset : float }
type t = { mutable capture : capture option }

let create () = { capture = None }
let active state = state.capture <> None
let release state =
  let captured = active state in
  state.capture <- None;
  captured

let logical rects scale id =
  let r = Lui_window.Rects.get rects id in
  rect (r.x /. scale) (r.y /. scale) (r.w /. scale) (r.h /. scale)

let side_of store id =
  match Lui_store.string_prop store id "accessibility-identifier" with
  | Some "left-sidebar-split" -> Some Left
  | Some "right-sidebar-split" -> Some Right
  | _ -> None

let progress store id =
  match Lui_store.prop store id "value" with
  | Some (Lui_protocol.FloatValue value) -> value
  | Some (Lui_protocol.IntValue value) -> float value
  | _ -> invalid_arg "sidebar split requires its current fraction"

let target store rects ~scale id side =
  if not (Lui_store.mem store id && Lui_window.node_enabled store id) then None
  else
    let value = progress store id in
    if (side = Left && value <= 0.001) || (side = Right && value >= 0.999) then None
    else match Lui_store.child_ids store id with
      | first :: second :: _ ->
        let bounds = logical rects scale id in
        let pane = logical rects scale (if side = Left then first else second) in
        if bounds.w <= 0. || bounds.h <= 0. || pane.w <= 0. then None
        else
          let edge = if side = Left then pane.x +. pane.w -. 1. else pane.x +. 1. in
          Some { id; side; bounds; grip = rect edge bounds.y 3. bounds.h }
      | _ -> None

let popup = function
  | "popover" | "dialog" | "sheet" | "dropdown-menu" | "context-menu"
  | "tooltip" | "toast" | "drawer" -> true
  | _ -> false

let pick store rects ~scale ~hit ~x ~y =
  if scale <= 0. then invalid_arg "sidebar split requires a positive backing scale";
  let rec parent id =
    if not (Lui_store.mem store id) || popup (Lui_store.kind store id) then None
    else
      let candidate = Option.bind (side_of store id) (target store rects ~scale id) in
      match candidate with
      | Some candidate when x >= candidate.grip.x && x < candidate.grip.x +. candidate.grip.w
          && y >= candidate.grip.y && y < candidate.grip.y +. candidate.grip.h -> Some candidate
      | _ -> Option.bind (Lui_store.parent store id) parent
  in
  parent hit

let start state store rects ~scale ~hit ~x ~y =
  if active state then false
  else match pick store rects ~scale ~hit ~x ~y with
    | None -> false
    | Some candidate ->
      (* Master left dragging uses the handle's left edge, while right
         dragging uses the viewport pointer position directly. *)
      let offset = if candidate.side = Left then x -. candidate.grip.x else 0. in
      state.capture <- Some { owner = candidate.id; offset };
      true

let move state store rects ~scale ~x =
  match state.capture with
  | None -> None
  | Some capture ->
    if not (Lui_store.mem store capture.owner) then (
      ignore (release state); None)
    else
      let bounds = logical rects scale capture.owner in
      if bounds.w <= 0. then (ignore (release state); None)
      else Some (Lui_protocol.ValueChanged
          (capture.owner, (x -. capture.offset -. bounds.x) /. bounds.w))
