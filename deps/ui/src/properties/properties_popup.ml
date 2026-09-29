(* Positioned popup overlays — select popups, sub-panes, date pickers.
   A popup is a fixed-position div pushed on the overlay stack, anchored
   to an element's bounding rect (or raw coordinates for context menus). *)

open Editor_dom
open Properties_dom
open Properties_state

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
  root

let open_anchored ?(cls = "") anchor content =
  let left, _top, _right, bottom, _w = el_rect anchor in
  open_at ~cls ~x:left ~y:(bottom +. 4.0) content
