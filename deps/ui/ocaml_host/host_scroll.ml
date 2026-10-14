(* Scroll offsets start at the viewport origin, not the first descendant.
   Hidden/unlaid nodes have empty rects; they must not introduce an origin.
   Preserve trailing padding when content grows beyond the inner viewport. *)
let content_bounds ~viewport ~padding_x ~padding_y ~rect_of ~children nodes =
  let rec walk ~direct bounds nodes = List.fold_left (fun (right, bottom) node ->
      let rect : Lui_scene.rect = rect_of node in
      let bounds =
        if Lui_scene.rect_empty rect then (right, bottom)
        else
          (Float.max right (rect.x +. rect.w +. (if direct then padding_x else 0.)),
           Float.max bottom (rect.y +. rect.h +. (if direct then padding_y else 0.))) in
      walk ~direct:false bounds (children node)) bounds nodes in
  (* Padding surrounds in-flow children. Visible descendant overflow can
     extend beyond them, but must not add the container padding again. *)
  let right, bottom = walk ~direct:true
    (viewport.Lui_scene.x +. viewport.w, viewport.y +. viewport.h) nodes in
  (viewport.x, viewport.y, right, bottom)

(* Layout metrics are published after painting. A shrinking range can
   clamp the offset then; keep that change alive for the following frame. *)
let finish_frame ui ~painted_scroll_epoch =
  Lui_window.Ui.frame_done ui;
  Lui_window.Ui.scroll_epoch ui <> painted_scroll_epoch
