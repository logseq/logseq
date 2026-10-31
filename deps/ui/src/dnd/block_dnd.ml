(* Block drag & drop via @dnd-kit/dom — replaces the native HTML5
   dragstart/dragover/drop/dragend path (cljs block.cljs on-drag-start /
   block-drag-over / block-drop).

   A MutationObserver keeps one dnd-kit Draggable per mounted
   .bullet-container[data-blockid] (drag source) and one Droppable per
   .ls-block[data-blockid]. Drop-target resolution mirrors the native
   closest('.ls-block'): nested blocks outrank their ancestors via
   collisionPriority = nesting depth, so the innermost block under the
   pointer always wins the collision sort. *)

module K = Dnd_kit
module S = Editor_state
module A = Editor_actions

type element = Web_dom.el

(* ---------- registration ---------- *)

let draggables : Web_dom.js_map = Web_dom.new_js_map ()
let droppables : Web_dom.js_map = Web_dom.new_js_map ()
let uid = ref 0

let next_id prefix =
  incr uid;
  prefix ^ string_of_int !uid

(* number of ancestor .ls-block elements — nested blocks get a higher
   collision priority so the innermost candidate wins, mirroring
   el.closest('.ls-block') on the native path *)
let rec block_depth acc el =
  match Web_dom.el_parent el with
  | Some p -> block_depth (acc + if Web_dom.el_matches p ".ls-block" then 1 else 0) p
  | None -> acc

let register_source m el =
  if not (Web_dom.js_map_has draggables el) then
    match Web_dom.el_get_attr el "data-blockid" with
    | Some u ->
        let d =
          K.new_draggable
            (K.draggable_opts ~id:(next_id "src") ~element:el
               ~data:(K.uuid_data ~uuid:u ()) ())
            m
        in
        Web_dom.js_map_set draggables el d
    | None -> ()

let register_target m el =
  if not (Web_dom.js_map_has droppables el) then
    match Web_dom.el_get_attr el "data-blockid" with
    | Some u ->
        let dp =
          K.new_droppable
            (K.droppable_opts ~id:(next_id "tgt") ~element:el
               ~data:(K.uuid_data ~uuid:u ())
               ~collisionPriority:(block_depth 0 el)
               ())
            m
        in
        Web_dom.js_map_set droppables el dp
    | None -> ()

let sweep map destroy =
  Web_dom.js_map_each map (fun entity el ->
      if not (Web_dom.el_is_connected el) then begin
        destroy entity;
        Web_dom.js_map_del map el
      end)

let scan m =
  Array.iter (register_source m)
    (Web_dom.query_selector_all_arr ".bullet-container[data-blockid]");
  Array.iter (register_target m) (Web_dom.query_selector_all_arr ".ls-block[data-blockid]");
  sweep draggables K.destroy_draggable;
  sweep droppables K.destroy_droppable

(* ---------- drop indicator ---------- *)
(* cljs dnd-separator: absolute line inside the drag-to block, left 20
   (48 when :nested), full width, 3px bottom border. Ours is a fixed
   overlay positioned from the target row's rect; "top" draws above the
   row, sibling/nested below it (nested shifts right 48px like cljs). *)

let indicator : element option ref = ref None

let indicator_el () =
  match !indicator with
  | Some el -> el
  | None ->
      let el = Web_dom.create_element "div" in
      Web_dom.el_set_class el "dnd-separator ls-dnd-drop-indicator";
      Web_dom.el_append_child Web_dom.document_body el;
      indicator := Some el;
      el

let show_indicator tgt_el move_to =
  let el = indicator_el () in
  let row =
    match Web_dom.el_query tgt_el ".block-main-container" with
    | Some r -> r
    | None -> tgt_el
  in
  let r = Web_dom.el_bounding_rect row in
  let off = if move_to = "nested" then 48.0 else 20.0 in
  let y =
    if move_to = "top" then Web_dom.rect_top r
    else Web_dom.rect_bottom r -. 3.0
  in
  Web_dom.el_style_set_property el "left"
    (Printf.sprintf "%gpx" (Web_dom.rect_left r +. off));
  Web_dom.el_style_set_property el "top" (Printf.sprintf "%gpx" y);
  Web_dom.el_style_set_property el "width"
    (Printf.sprintf "%gpx" (Float.max 0.0 (Web_dom.rect_width r -. off)));
  Web_dom.el_style_set_property el "display" "block"

let hide_indicator () =
  match !indicator with
  | Some el -> Web_dom.el_style_set_property el "display" "none"
  | None -> ()

(* ---------- drag lifecycle ---------- *)

let dragging_uuid : string option ref = ref None
let drop_target : (string * string) option ref = ref None

let clear_drop_target () =
  drop_target := None;
  hide_indicator ()

let on_drag_start ev _m =
  dragging_uuid := None;
  (match K.op_source (K.ev_operation ev) with
   | Some d -> dragging_uuid := Some (K.entity_uuid (K.entity_data d))
   | None -> ());
  clear_drop_target ()

(* pointer coordinates for a monitor event: the native pointer event
   when present (dragstart/dragmove/dragend), else the operation
   position (dragover fires on target change and carries none). The
   target rectangles and operation positions are both client-relative. *)
let coords_of ev op =
  match K.ev_native ev with
  | Some nev -> (K.client_x nev, K.client_y nev)
  | None -> (
      match K.pos_current (K.op_position op) with
      | Some pt -> (K.pt_x pt, K.pt_y pt)
      | None -> (0.0, 0.0))

(* cljs block-drag-over: near the top of the first block -> :top; deep
   indent (x-offset > 50) -> :nested; else :sibling *)
let update_drop_target src tgt_el client_x client_y =
  match Web_dom.el_get_attr tgt_el "data-blockid" with
  | Some tgt when tgt <> src && not (A.is_descendant tgt src) ->
      let rect = Web_dom.el_bounding_rect tgt_el in
      let first =
        match S.find_parent tgt with
        | Some (_, idx) -> idx = 0
        | None -> false
      in
      let near_top = Float.abs (client_y -. Web_dom.rect_top rect) <= 16.0 in
      let x_off = client_x -. Web_dom.rect_left rect in
      let move_to =
        if first && near_top then "top"
        else if x_off > 50.0 then "nested"
        else "sibling"
      in
      drop_target := Some (tgt, move_to);
      show_indicator tgt_el move_to
  | _ ->
      clear_drop_target ()

(* dragmove (per pointer move) and dragover (per target change) share
   this: over a valid block -> Some(tgt, move_to); over an invalid one
   -> None. Leaving all targets must cancel the candidate, not move a
   block to a position that is no longer under the pointer. *)
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
                let client_x, client_y = coords_of ev op in
                update_drop_target src el client_x client_y
            | None -> clear_drop_target ())
        | None -> clear_drop_target ())
  else clear_drop_target ()

let on_drag_end ev _m =
  (if S.ready () && not (K.ev_canceled ev) then begin
     update_from_event ev;
     match (!dragging_uuid, !drop_target) with
     | Some src, Some (tgt, move_to) ->
         A.drop_dragged_block src tgt move_to
     | _ -> ()
   end);
  dragging_uuid := None;
  clear_drop_target ()

(* ---------- install ---------- *)

let installed = State_cell.Once.make ()

let install () =
  State_cell.Once.run installed (fun () ->
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
    let obs = Web_dom.new_observer (fun () -> scan m) in
    Web_dom.obs_observe obs Web_dom.document_element (Web_dom.mo_opts ~childList:true ~subtree:true))
