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
  let root =
    mk "div" ~cls
      ~attrs:
        [ ( "style"
          , Printf.sprintf "position:fixed;left:%dpx;top:%dpx;z-index:9999"
              (int_of_float x) (int_of_float y) )
        ]
  in
  el_append_child root content;
  push_overlay root ~on_escape:(fun () -> ());
  root

let open_anchored ?(cls = "") anchor content =
  let left, _top, _right, bottom, _w = el_rect anchor in
  open_at ~cls ~x:left ~y:(bottom +. 4.0) content
