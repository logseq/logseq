(* Positioned popup overlays — select popups, sub-panes, date pickers.
   A popup is a fixed-position div pushed on the overlay stack, anchored
   to an element's bounding rect (or raw coordinates for context menus). *)

open Editor_dom
open Properties_dom
open Properties_state

(* cljs renders these menus through Radix, which flips/shifts a popup
   that would overflow the viewport. Measure after mounting and nudge the
   fixed position back inside. *)
let clamp_in_view root =
  let l, t, r, b, _w = el_rect root in
  let l' =
    if r > window_inner_width then l -. (r -. window_inner_width) -. 4.0
    else if l < 0.0 then 4.0
    else l
  in
  let t' =
    if b > window_inner_height then t -. (b -. window_inner_height) -. 4.0
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
  let avail = window_inner_height -. y -. 8. in
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

let open_anchored ?(cls = "") anchor content =
  let left, _top, _right, bottom, _w = el_rect anchor in
  open_at ~cls ~x:left ~y:(bottom +. 4.0) content

(* submenu positioning: at the anchor's right edge, top-aligned
   (base-ui dropdown-menu-sub-content placement inline-end) *)
let open_anchored_right ?(cls = "") anchor content =
  let _left, top, right, _bottom, _w = el_rect anchor in
  open_at ~cls ~x:(right -. 4.0) ~y:(top -. 4.0) content
