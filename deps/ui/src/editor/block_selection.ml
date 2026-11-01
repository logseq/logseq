(* Pointer-driven block-range selection (cljs components/block/selection.cljs).

   A primary pointerdown on a block records the selection anchor; while the
   pointer stays down, moving across rows replaces the selected range with
   anchor..hovered, and rows scrolled into the virtualized window extend the
   selection to the boundary block; pointerup ends the gesture. A gesture
   that selected more than the anchor suppresses the follow-up click so the
   release doesn't open the origin block's editor. *)

module S = Editor_state

let closest sel t =
  match t with Some el -> el.Ui_services.closest sel | None -> None

let down = ref false
let gesture_context = ref None

(* the press moved beyond its anchor block — the click the browser still
   dispatches on release must not start an edit *)
let dragged = ref false
let suppress_click = ref false

let reset_gesture () =
  down := false;
  dragged := false;
  gesture_context := None

let is_down () =
  if
    !down
    && !gesture_context
       <> Some
            ( Runtime.repo (),
              Runtime.route (),
              S.selection_scope (),
              S.anchor () )
  then reset_gesture ();
  !down

let listeners_installed = State_cell.Once.make ()

let install_listeners () =
  State_cell.Once.run listeners_installed (fun () ->
      let cancel _ =
        reset_gesture ();
        suppress_click := false
      in
      Ui_services.dom_on_document_event ~capture:true "pointercancel" cancel;
      Ui_services.dom_on_window_event "blur" cancel)

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
  let shift = ev.Ui_services.shift in
  let meta = ev.Ui_services.meta || ev.Ui_services.ctrl in
  if not (shift || meta) then false
  else (
    suppress_click := true;
    ev.Ui_services.prevent_default ();
    (if shift && meta then
       (* meta+shift: append the anchor..clicked range *)
       match S.anchor () with
       | Some anchor ->
           let range = Editor_actions.range_between anchor uuid in
           if range <> [] then
             S.set (fun st ->
                 {
                   st with
                   S.selected =
                     List.fold_left
                       (fun s u -> S.String_set.add u s)
                       st.S.selected range;
                   action_bar = true;
                 })
       | None -> ()
     else if meta then
       (* meta: toggle the clicked block in the selection *)
       S.set (fun st ->
           let sel =
             if S.String_set.mem uuid st.S.selected then
               S.String_set.remove uuid st.S.selected
             else S.String_set.add uuid st.S.selected
           in
           {
             st with
             S.selected = sel;
             anchor = (if S.String_set.is_empty sel then None else Some uuid);
             action_bar = not (S.String_set.is_empty sel);
           })
     else
       (* shift: range-select anchor..clicked; with no stored anchor the
         press only records one, like a plain click *)
       match S.anchor () with
       | Some anchor when anchor <> uuid ->
           let range = Editor_actions.range_between anchor uuid in
           if range <> [] then
             S.set (fun st ->
                 {
                   st with
                   S.selected = S.String_set.of_list range;
                   action_bar = true;
                 })
           (* a stale/off-screen anchor yields no range — fall back to
              recording the clicked block as the new anchor *)
             else set_anchor uuid
       | _ -> set_anchor uuid);
    true)

let pointerdown ev =
  install_listeners ();
  reset_gesture ();
  suppress_click := false;
  if
    ev.Ui_services.buttons = 1
    (* a press inside the editing surface is a text-selection gesture,
       not a block-range one *)
    && closest
         ".block-editor,.block-control-wrap,.ui-fenced-code-editor,button,input,textarea,select,a,[contenteditable],[data-keep-selection]"
         ev.Ui_services.target
       = None
  then
    match closest ".ls-block" ev.Ui_services.target with
    | Some block_el -> (
        match block_el.Ui_services.attr "data-blockid" with
        | Some uuid ->
            let scope = Editor_actions.scope_of_el block_el in
            S.set (fun st ->
                if st.S.selection_scope = scope then st
                else
                  {
                    st with
                    S.selection_scope = scope;
                    selected = S.String_set.empty;
                    anchor = None;
                    action_bar = false;
                  });
            (* the row's control band (collapse arrow, bullet) runs its
               own shift-click behaviors — the selection modifiers only
               apply to the content area *)
            if not (modifier_select ev uuid) then (
              down := true;
              set_anchor uuid;
              gesture_context :=
                Some (Runtime.repo (), Runtime.route (), scope, Some uuid))
        | None -> ())
    | None -> ()

let pointermove ev =
  if ev.Ui_services.buttons land 1 = 0 then reset_gesture ()
  else if is_down () then
    match S.anchor () with
    | Some anchor -> (
        match closest ".ls-block" ev.Ui_services.target with
        | Some block_el
          when Editor_actions.scope_of_el block_el = S.selection_scope () -> (
            match block_el.Ui_services.attr "data-blockid" with
            | Some uuid when uuid <> anchor || !dragged ->
                let range = Editor_actions.range_between anchor uuid in
                if range <> [] then (
                  if List.length range > 1 then dragged := true;
                  S.set (fun st ->
                      {
                        st with
                        S.selected = S.String_set.of_list range;
                        action_bar = false;
                      }))
            | _ -> ())
        | _ -> ())
    | None -> ()

let pointerup () =
  if is_down () && !dragged then (
    suppress_click := true;
    (* cljs raises the multi-select action bar on pointerup *)
    match S.selected () |> S.String_set.elements with
    | _ :: _ -> Editor_actions.show_action_bar ()
    | [] -> ());
  reset_gesture ()

(* virtual-scroll row appeared/disappeared while the pointer is down:
   extend the range from the anchor to the boundary block (cljs
   highlight-selection-area! driven by virtuoso items-rendered). The
   cljs append path conjoins — scroll-driven extension only ever grows
   the selection, so a late/stale boundary can't regress it *)
let extend_to uuid =
  match if is_down () then S.anchor () else None with
  | Some anchor ->
      let range = Editor_actions.range_between anchor uuid in
      if range <> [] then (
        if List.length range > 1 then dragged := true;
        S.set (fun st ->
            {
              st with
              S.selected =
                List.fold_left
                  (fun s u -> S.String_set.add u s)
                  st.S.selected range;
              action_bar = false;
            }))
  | None -> ()
