(* Pointer-driven block-range selection (cljs components/block/selection.cljs).

   A primary pointerdown on a block records the selection anchor; while the
   pointer stays down, moving across rows replaces the selected range with
   anchor..hovered, and rows scrolled into the virtualized window extend the
   selection to the boundary block; pointerup ends the gesture. A gesture
   that selected more than the anchor suppresses the follow-up click so the
   release doesn't open the origin block's editor. *)

module S = Editor_state

let down = ref false

let is_down () = !down

(* the press moved beyond its anchor block — the click the browser still
   dispatches on release must not start an edit *)
let dragged = ref false

let suppress_click = ref false

let consume_suppress () =
  let v = !suppress_click in
  suppress_click := false;
  v

let set_anchor uuid =
  (* Signal.update stages the value until flush; a deferred anchor read in
     the IO callback must see it, so take the flushing path *)
  S.set (fun st -> { st with S.anchor = Some uuid })

let pointerdown ev =
  if
    Web_dom.ev_buttons ev = 1
    (* a press inside the editing surface is a text-selection gesture,
       not a block-range one *)
    && Web_dom.closest_sel ".block-editor" (Web_dom.ev_target ev) = None
  then
    match Web_dom.closest_sel ".ls-block" (Web_dom.ev_target ev) with
    | Some block_el -> (
        match Web_dom.el_get_attr block_el "data-blockid" with
        | Some uuid ->
            down := true;
            dragged := false;
            set_anchor uuid
        | None -> ())
    | None -> ()

let pointermove ev =
  if !down && Web_dom.ev_buttons ev land 1 = 1 then
    match S.anchor () with
    | Some anchor -> (
        match
          Web_dom.closest_sel ".ls-block" (Web_dom.ev_target ev)
        with
        | Some block_el -> (
            match Web_dom.el_get_attr block_el "blockid" with
            | Some uuid when uuid <> anchor || !dragged ->
                let range = Editor_actions.range_between anchor uuid in
                if range <> [] then (
                  if List.length range > 1 then dragged := true;
                  S.set (fun st ->
                      { st with
                        S.selected = S.String_set.of_list range
                      ; action_bar = false
                      }))
            | _ -> ())
        | None -> ())
    | None -> ()

let pointerup () =
  if !dragged then (
    suppress_click := true;
    (* cljs raises the multi-select action bar on pointerup *)
    match S.selected () |> S.String_set.elements with
    | _ :: _ -> Editor_actions.show_action_bar ()
    | [] -> ());
  down := false;
  dragged := false

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
