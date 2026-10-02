(* Block drag & drop via @dnd-kit/dom — replaces the native HTML5
   dragstart/dragover/drop/dragend path (cljs block.cljs on-drag-start /
   block-drag-over / block-drop).

   A MutationObserver keeps one dnd-kit Draggable per mounted
   .bullet-container[blockid] (drag source) and one Droppable per
   .ls-block[blockid]. Drop-target resolution mirrors the native
   closest('.ls-block'): nested blocks outrank their ancestors via
   collisionPriority = nesting depth, so the innermost block under the
   pointer always wins the collision sort. *)

module K = Dnd_kit
module S = Editor_state
module A = Editor_actions

type element = Js.Json.t

(* ---------- DOM externals ---------- *)

external qsa : string -> Js.Json.t = "querySelectorAll"
  [@@mel.scope "document"]

external to_array : Js.Json.t -> element array = "from"
  [@@mel.scope "Array"]

external document_el : element = "documentElement" [@@mel.scope "document"]

external el_attr : element -> string -> string option = "getAttribute"
  [@@mel.send] [@@mel.return nullable]

external el_parent : element -> element option = "parentElement"
  [@@mel.get] [@@mel.return nullable]

external el_matches : element -> string -> bool = "matches" [@@mel.send]
external el_connected : element -> bool = "isConnected" [@@mel.get]
external el_rect : element -> Js.Json.t = "getBoundingClientRect"
  [@@mel.send]
external rect_top : Js.Json.t -> float = "top" [@@mel.get]
external rect_left : Js.Json.t -> float = "left" [@@mel.get]
external scroll_x : float = "scrollX" [@@mel.scope "window"]

type js_map

external new_map : unit -> js_map = "Map" [@@mel.new]
external map_has : js_map -> element -> bool = "has" [@@mel.send]
external map_set : js_map -> element -> 'a -> unit = "set" [@@mel.send]
external map_del : js_map -> element -> unit = "delete" [@@mel.send]

external map_each : js_map -> ('a -> element -> unit) -> unit = "forEach"
  [@@mel.send]

type mutation_observer
type observe_opts

external new_observer : (unit -> unit) -> mutation_observer
  = "MutationObserver" [@@mel.new]

external observe_opts :
  childList:bool -> subtree:bool -> observe_opts = "" [@@mel.obj]

external observe :
  mutation_observer -> element -> observe_opts -> unit = "observe"
  [@@mel.send]

(* ---------- registration ---------- *)

let draggables : js_map = new_map ()
let droppables : js_map = new_map ()
let uid = ref 0

let next_id prefix =
  incr uid;
  prefix ^ string_of_int !uid

(* number of ancestor .ls-block elements — nested blocks get a higher
   collision priority so the innermost candidate wins, mirroring
   el.closest('.ls-block') on the native path *)
let rec block_depth acc el =
  match el_parent el with
  | Some p -> block_depth (acc + if el_matches p ".ls-block" then 1 else 0) p
  | None -> acc

let register_source m el =
  if not (map_has draggables el) then
    match el_attr el "blockid" with
    | Some u ->
        let d =
          K.new_draggable
            (K.draggable_opts ~id:(next_id "src") ~element:el
               ~data:(K.uuid_data ~uuid:u ()) ())
            m
        in
        map_set draggables el d
    | None -> ()

let register_target m el =
  if not (map_has droppables el) then
    match el_attr el "blockid" with
    | Some u ->
        let dp =
          K.new_droppable
            (K.droppable_opts ~id:(next_id "tgt") ~element:el
               ~data:(K.uuid_data ~uuid:u ())
               ~collisionPriority:(block_depth 0 el)
               ())
            m
        in
        map_set droppables el dp
    | None -> ()

let sweep map destroy =
  map_each map (fun entity el ->
      if not (el_connected el) then begin
        destroy entity;
        map_del map el
      end)

let scan m =
  Array.iter (register_source m)
    (to_array (qsa ".bullet-container[blockid]"));
  Array.iter (register_target m) (to_array (qsa ".ls-block[blockid]"));
  sweep draggables K.destroy_draggable;
  sweep droppables K.destroy_droppable

(* ---------- drag lifecycle ---------- *)

let dragging_uuid : string option ref = ref None
let drop_target : (string * string) option ref = ref None

let on_drag_start ev _m =
  (match K.op_source (K.ev_operation ev) with
   | Some d -> dragging_uuid := Some (K.entity_uuid (K.entity_data d))
   | None -> ());
  drop_target := None

(* pointer coordinates for a monitor event: the native pointer event
   when present (dragstart/dragmove/dragend), else the operation
   position (dragover fires on target change and carries none). The
   operation position is client-relative, so pageX falls back to
   clientX + scrollX — the same value native pageX reports. *)
let coords_of ev op =
  match K.ev_native ev with
  | Some nev -> (K.page_x nev, K.client_y nev)
  | None -> (
      match K.pos_current (K.op_position op) with
      | Some pt -> (K.pt_x pt +. scroll_x, K.pt_y pt)
      | None -> (0.0, 0.0))

(* cljs block-drag-over: near the top of the first block -> :top; deep
   indent (x-offset > 50) -> :nested; else :sibling *)
let update_drop_target src tgt_el page_x client_y =
  match el_attr tgt_el "blockid" with
  | Some tgt when tgt <> src && not (A.is_descendant tgt src) ->
      let rect = el_rect tgt_el in
      let first =
        match S.find_parent tgt with
        | Some (_, idx) -> idx = 0
        | None -> false
      in
      let near_top = Float.abs (client_y -. rect_top rect) <= 16.0 in
      let x_off = page_x -. rect_left rect in
      let move_to =
        if first && near_top then "top"
        else if x_off > 50.0 then "nested"
        else "sibling"
      in
      drop_target := Some (tgt, move_to)
  | _ -> drop_target := None

(* dragmove (per pointer move) and dragover (per target change) share
   this: over a valid block -> Some(tgt, move_to); over an invalid one
   -> None; over nothing -> keep the last candidate, matching the
   native listener's `| None -> ()` so a drop outside any block still
   applies the last hovered position *)
let update_from_event ev =
  if S.ready () then
    match !dragging_uuid with
    | None -> ()
    | Some src -> (
        let op = K.ev_operation ev in
        match K.op_target op with
        | Some dp -> (
            match K.droppable_element dp with
            | Some el ->
                let page_x, client_y = coords_of ev op in
                update_drop_target src el page_x client_y
            | None -> drop_target := None)
        | None -> ())

let on_drag_end ev _m =
  (if not (K.ev_canceled ev) then
     match (!dragging_uuid, !drop_target) with
     | Some src, Some (tgt, move_to) ->
         A.drop_dragged_block src tgt move_to
     | _ -> ());
  dragging_uuid := None;
  drop_target := None

(* ---------- install ---------- *)

let installed = ref false

let install () =
  if not !installed then begin
    installed := true;
    let sensors =
      [| K.sensor_configure K.pointer_sensor
           (K.sensor_opts
              (* the bullet sits inside an interactive a.bullet-link-wrap,
                 which the default preventActivation would reject; and a
                 distance-only constraint keeps plain clicks (no pointer
                 move) from activating a drag, like the native path *)
              ~preventActivation:(fun _ev _src -> false)
              ~activationConstraints:(fun _ev _src ->
                [| K.new_distance (K.distance_opts ~value:4.0 ()) |])
              ());
         K.keyboard_sensor |]
    in
    let m = K.make_manager (K.manager_opts ~sensors ()) in
    let mon = K.monitor m in
    K.on mon "dragstart" on_drag_start ();
    K.on mon "dragmove" (fun ev _ -> update_from_event ev) ();
    K.on mon "dragover" (fun ev _ -> update_from_event ev) ();
    K.on mon "dragend" on_drag_end ();
    scan m;
    let obs = new_observer (fun () -> scan m) in
    observe obs document_el (observe_opts ~childList:true ~subtree:true)
  end
