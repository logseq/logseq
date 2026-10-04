(* Pointer-driven block-range selection (cljs components/block/selection.cljs).

   A primary pointerdown on a block records the selection anchor; while the
   pointer stays down, rows scrolled into the virtualized window extend the
   selection to the boundary block; pointerup ends the gesture. *)

module S = Editor_state

let down = ref false

let is_down () = !down

let set_anchor uuid =
  (* Signal.update stages the value until flush; a deferred anchor read in
     the IO callback must see it, so take the flushing path *)
  S.set (fun st -> { st with S.anchor = Some uuid })

let pointerdown ev =
  if Web_dom.ev_buttons ev = 1 then
    match Web_dom.closest_sel ".ls-block" (Web_dom.ev_target ev) with
    | Some block_el -> (
        match Web_dom.el_get_attr block_el "blockid" with
        | Some uuid ->
            down := true;
            set_anchor uuid
        | None -> ())
    | None -> ()

let pointerup () = down := false

(* virtual-scroll row appeared/disappeared while the pointer is down:
   extend the range from the anchor to the boundary block (cljs
   highlight-selection-area! driven by virtuoso items-rendered). The
   cljs append path conjoins — scroll-driven extension only ever grows
   the selection, so a late/stale boundary can't regress it *)
let extend_to uuid =
  match S.anchor () with
  | Some anchor ->
      let range = Editor_actions.range_between anchor uuid in
      if range <> [] then
        S.set (fun st ->
            { st with
              S.selected =
                List.fold_left
                  (fun s u -> S.String_set.add u s)
                  st.S.selected range
            ; action_bar = false
            })
  | None -> ()
