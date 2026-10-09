(* Positioned popup overlays — select popups, sub-panes, date pickers.
   A popup is a point-positioned popover pushed on the view-overlay
   stack, placed at the anchor element's rect (or raw coordinates for
   context menus). The popover kind portals to body level, clamps to
   the viewport and handles outside-press/Escape dismissal, so the
   openers below only measure anchors and mount views. *)

open Lui_elements
module S = Properties_state

(* one view-overlay entry per mounted popup — the key is the removal
   handle callers get back (the imperative version returned its root
   el for the same purpose) *)
let key_seq = ref 0

let next_key () =
  incr key_seq;
  "popup-" ^ string_of_int !key_seq

(* Wrap content in a positioned popover under the point (x, y). `cls`
   is the extra root class the e2e contract requires (e.g.
   "ui__popover-content", "ls-property-dropdown"). Returns the
   view-overlay key. *)
let open_at_key ~key ?(cls = "") ~x ~y (content : t) =
  (* cap at the space left below the anchor so long menus scroll instead
     of overflowing the viewport (radix's available-height behaviour) *)
  let avail = Ui_services.dom_viewport_height () -. y -. 8. in
  let view =
    popover ~key ~at:(x, y) ~style_class:cls
      ~available_height:(Float.max avail 120.)
      ~data_attrs:[ ("role", "dialog") ]
      ~on_dismiss:(fun _ -> S.remove_view_overlay key)
      [ content ]
  in
  if not (S.push_view_overlay_ctxfree ~key ~view ~on_escape:(fun () -> ()))
  then
    Ui_services.log_error
      "properties_popup: .cp__overlays host not mounted yet"

let open_at ?(cls = "") ~x ~y content =
  let key = next_key () in
  open_at_key ~key ~cls ~x ~y content;
  key

(* On backends with async measurement (gpui) the anchor's first rect
   is still pending, so an element-anchored popup would mount at 0,0
   on first open. Retry a few ticks until the rect resolves — same
   pattern as Properties_dialog.open_for_anchor_el. *)
let measure_anchor (anchor : Ui_services.el) f =
  let rec go tries_left =
    let x, y, w, h = anchor.Ui_services.rect () in
    if x = 0. && y = 0. && w = 0. && h = 0. && tries_left > 0 then
      ignore
        (Ui_services.timers_timeout (fun () -> go (tries_left - 1)) 32)
    else f x y w h
  in
  go 4

let open_anchored ?(cls = "") anchor content =
  let key = next_key () in
  measure_anchor anchor (fun x y _w h ->
      open_at_key ~key ~cls ~x ~y:(y +. h +. 4.0) content);
  key

(* submenu positioning: at the anchor's right edge, top-aligned
   (base-ui dropdown-menu-sub-content placement inline-end) *)
let open_anchored_right ?(cls = "") anchor content =
  let key = next_key () in
  measure_anchor anchor (fun x y w _h ->
      open_at_key ~key ~cls ~x:(x +. w -. 4.0) ~y:(y -. 4.0) content);
  key
