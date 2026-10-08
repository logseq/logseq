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

(* cljs block-content mousedown modifiers run block-selection ops
   instead of arming the range drag or starting an edit; returns true
   when a modifier handled the press (the follow-up click must be
   suppressed so the row never opens its editor) *)
let modifier_select ev uuid =
  let shift = Web_dom.ev_shift ev in
  let meta = Web_dom.ev_meta ev || Web_dom.ev_ctrl ev in
  if not (shift || meta) then false
  else begin
    suppress_click := true;
    Web_dom.ev_prevent_default ev;
    if shift && meta then
      (* meta+shift: append the anchor..clicked range *)
      (match S.anchor () with
       | Some anchor ->
           let range = Editor_actions.range_between anchor uuid in
           if range <> [] then
             S.set (fun st ->
                 { st with
                   S.selected =
                     List.fold_left
                       (fun s u -> S.String_set.add u s)
                       st.S.selected range
                 ; action_bar = true
                 })
       | None -> ())
    else if meta then (
      (* meta: toggle the clicked block in the selection *)
      S.set (fun st ->
          let sel =
            if S.String_set.mem uuid st.S.selected then
              S.String_set.remove uuid st.S.selected
            else S.String_set.add uuid st.S.selected
          in
          { st with
            S.selected = sel
          ; anchor = Some uuid
          ; action_bar = true
          }))
    else
      (* shift: range-select anchor..clicked; with no stored anchor the
         press only records one, like a plain click *)
      (match S.anchor () with
       | Some anchor when anchor <> uuid -> (
           let range = Editor_actions.range_between anchor uuid in
           if range <> [] then
             S.set (fun st ->
                 { st with
                   S.selected = S.String_set.of_list range
                 ; action_bar = true
                 })
           (* a stale/off-screen anchor yields no range — fall back to
              recording the clicked block as the new anchor *)
           else set_anchor uuid)
       | _ -> set_anchor uuid);
    true
  end

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
            (* the row's control band (collapse arrow, bullet) runs its
               own shift-click behaviors — the selection modifiers only
               apply to the content area *)
            if
              Web_dom.closest_sel ".block-control-wrap"
                (Web_dom.ev_target ev)
              <> None
              || not (modifier_select ev uuid)
            then (
              down := true;
              dragged := false;
              set_anchor uuid)
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
