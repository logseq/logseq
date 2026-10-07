(* Positioned popup overlays — select popups, sub-panes, date pickers.
   A popup is a fixed-position div pushed on the overlay stack, anchored
   to an element's bounding rect (or raw coordinates for context menus). *)

open Web_dom
open Properties_state

(* cljs renders these menus through Radix, which flips/shifts a popup
   that would overflow the viewport. Measure after mounting and nudge the
   fixed position back inside. *)
let clamp_in_view root =
  let l, t, r, b, _w = bounding_rect_fields root in
  let l' =
    if r > win_inner_width then l -. (r -. win_inner_width) -. 4.0
    else if l < 0.0 then 4.0
    else l
  in
  let t' =
    if b > win_inner_height then t -. (b -. win_inner_height) -. 4.0
    else if t < 0.0 then 4.0
    else t
  in
  if l' <> l || t' <> t then
    set_style root
      (Printf.sprintf "position:fixed;left:%dpx;top:%dpx;z-index:9999"
         (int_of_float l') (int_of_float t'))

(* Wrap content in a positioned overlay under the anchor. `cls` is the
   extra root class the e2e contract requires (e.g. "ui__popover-content",
   "ls-property-dropdown"). Returns the popup element. *)
let open_at ?(cls = "") ~x ~y content =
  (* cap at the space left below the anchor so long menus scroll instead
     of overflowing the viewport (radix's available-height behaviour) *)
  let avail = win_inner_height -. y -. 8. in
  let root =
    mk "div" ~cls
      ~attrs:
        [ ("role", "dialog")
        ; ( "style"
          , Printf.sprintf
              "position:fixed;left:%dpx;top:%dpx;z-index:9999;\
               max-height:%dpx;overflow-y:auto"
              (int_of_float x) (int_of_float y)
              (int_of_float (Float.max avail 120.)) )
        ]
  in
  el_append_child root content;
  push_overlay root ~on_escape:(fun () -> ());
  clamp_in_view root;
  root

(* On backends with async measurement (gpui) the anchor's first rect
   is still pending, so an element-anchored popup mounts at 0,0 on
   first open. Mount at the measured position now, then re-place on
   later ticks once the rect resolves — same retry as views_popup. *)
let reposition_later ~tries root anchor f =
  let rec go tries_left =
    let l, t, r, b, w = bounding_rect_fields anchor in
    let pending = l = 0. && t = 0. && r = 0. && b = 0. && w = 0. in
    if pending && tries_left > 0 then
      set_timeout (fun () -> go (tries_left - 1)) 32
    else
      let x, y = f l t r b w in
      let avail = win_inner_height -. y -. 8. in
      set_style root
        (Printf.sprintf
           "position:fixed;left:%dpx;top:%dpx;z-index:9999;\
            max-height:%dpx;overflow-y:auto"
           (int_of_float x) (int_of_float y)
           (int_of_float (Float.max avail 120.)))
  in
  set_timeout (fun () -> go (tries - 1)) 32

let open_anchored ?(cls = "") anchor content =
  let left, _top, _right, bottom, _w = bounding_rect_fields anchor in
  let root = open_at ~cls ~x:left ~y:(bottom +. 4.0) content in
  reposition_later ~tries:4 root anchor
    (fun l _t _r b _w -> (l, b +. 4.0));
  root

(* submenu positioning: at the anchor's right edge, top-aligned
   (base-ui dropdown-menu-sub-content placement inline-end) *)
let open_anchored_right ?(cls = "") anchor content =
  let _left, top, right, _bottom, _w = bounding_rect_fields anchor in
  let root = open_at ~cls ~x:(right -. 4.0) ~y:(top -. 4.0) content in
  reposition_later ~tries:4 root anchor
    (fun _l t r _b _w -> (r -. 4.0, t -. 4.0));
  root
