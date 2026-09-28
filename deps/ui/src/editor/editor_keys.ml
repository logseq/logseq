(* Document-level event handling for the outliner. LUI's dom-event channel
   cannot preventDefault and lacks caret/selection info, so the full key
   contract lives here in capture phase; dispatch is by event target:
   inside .editor-wrapper -> editing mode, else normal (block-select) mode. *)

module S = Editor_state
module D = Editor_dom
module A = Editor_actions

let mods ev = D.ev_ctrl ev || D.ev_meta ev

let uuid_of_prefixed prefix id =
  let n = String.length prefix in
  if String.length id > n && String.sub id 0 n = prefix then
    Some (String.sub id n (String.length id - n))
  else None

let caret_span el =
  (D.el_selection_start el, D.el_selection_end el)

(* -- editor-mode keys -- *)

let on_editor_arrows ev uuid el =
  let key = D.ev_key ev in
  let up = key = "ArrowUp" in
  let shift = D.ev_shift ev and alt = D.ev_alt ev and meta = D.ev_meta ev in
  if (alt || meta) && shift then (
    D.prevent_default ev;
    ignore
      (Outliner_ops.apply_and_refresh
         [ Outliner_ops.move_up_down [ uuid ] up ]))
  else
    let v = D.el_value el in
    let s, e = caret_span el in
    let first_line =
      (match String.index_opt (String.sub v 0 s) '\n' with
      | Some _ -> false
      | None -> true)
    in
    let last_line =
      (match String.index_opt (String.sub v e (String.length v - e)) '\n' with
      | Some _ -> false
      | None -> true)
    in
    if shift then
      (* shift+arrow on a boundary row crosses into block selection; a
         second press can land on the textarea before the DOM flush removes
         it, so extend when editing was already cleared *)
      (if (up && first_line) || ((not up) && last_line) then (
         D.prevent_default ev;
         match S.editing () with
         | Some _ -> A.exit_edit ~select:true
         | None -> A.extend_selection up))
    else if up && first_line then (
      D.prevent_default ev;
      A.arrow_nav uuid true)
    else if (not up) && last_line then (
      D.prevent_default ev;
      A.arrow_nav uuid false)

let on_editor_key ev uuid el =
  let key = D.ev_key ev in
  let shift = D.ev_shift ev in
  if D.ev_composing ev then ()
  else
    match key with
    | "Enter" when not shift ->
        D.prevent_default ev;
        A.split_at_cursor uuid
    | "Tab" ->
        D.prevent_default ev;
        A.indent_or_outdent ~indent:(not shift)
    | "Escape" ->
        D.prevent_default ev;
        A.exit_edit ~select:true
    | "Backspace" ->
        let s, e = caret_span el in
        if s = 0 && e = 0 then (
          D.prevent_default ev;
          A.merge_prev uuid)
    | "Delete" ->
        let s, e = caret_span el in
        if s = e && e = String.length (D.el_value el) then (
          D.prevent_default ev;
          A.merge_next uuid)
    | "ArrowUp" | "ArrowDown" -> on_editor_arrows ev uuid el
    | "z" when mods ev ->
        D.prevent_default ev;
        if shift then A.redo () else A.undo ()
    | "y" when mods ev ->
        D.prevent_default ev;
        A.redo ()
    | "b" when mods ev ->
        D.prevent_default ev;
        A.wrap_selection uuid "**"
    | "i" when mods ev ->
        D.prevent_default ev;
        A.wrap_selection uuid "*"
    | "e" when D.ev_meta ev -> A.quick_add ()
    | "." when mods ev && shift ->
        D.prevent_default ev;
        A.zoom_to uuid
    | _ -> ()

(* -- normal-mode keys (block selection) -- *)

let on_normal_key ev =
  let key = D.ev_key ev in
  let shift = D.ev_shift ev
  and alt = D.ev_alt ev
  and meta = D.ev_meta ev in
  let selected () = S.selection_active () in
  match key with
  | "Backspace" | "Delete" when selected () ->
      D.prevent_default ev;
      A.delete_selection ()
  | "ArrowUp" when (meta || alt) && shift ->
      D.prevent_default ev;
      A.move_blocks_up_down true
  | "ArrowDown" when (meta || alt) && shift ->
      D.prevent_default ev;
      A.move_blocks_up_down false
  | "ArrowUp" when shift ->
      D.prevent_default ev;
      A.extend_selection true
  | "ArrowDown" when shift ->
      D.prevent_default ev;
      A.extend_selection false
  | "ArrowUp" when selected () ->
      D.prevent_default ev;
      A.move_selection_focus true
  | "ArrowDown" when selected () ->
      D.prevent_default ev;
      A.move_selection_focus false
  | "Tab" when selected () ->
      D.prevent_default ev;
      A.indent_or_outdent ~indent:(not shift)
  | "Enter" -> (
      match D.closest_sel ".block-add-button" (D.ev_target ev) with
      | Some btn ->
          D.prevent_default ev;
          A.append_block ?for_page:(D.el_get_attr btn "parentblockid") ()
      | None -> (
          match S.anchor () with
          | Some u when selected () ->
              D.prevent_default ev;
              A.enter_edit u 0
          | _ -> ()))
  | "a" when mods ev ->
      D.prevent_default ev;
      A.select_all ()
  | "z" when mods ev ->
      D.prevent_default ev;
      if shift then A.redo () else A.undo ()
  | "y" when mods ev ->
      D.prevent_default ev;
      A.redo ()
  | "Escape" -> A.clear_selection ()
  | _ -> ()

let on_keydown ev =
  if S.ready () then
    let target = D.ev_target ev in
    match
      (S.editing_uuid (), D.closest_sel ".editor-wrapper" target)
    with
    | Some uuid, Some _ -> (
        match target with
        | Some el when D.el_tag el = "TEXTAREA" ->
            on_editor_key ev uuid el
        | _ -> ())
    | _ ->
        (* an editing textarea that was unmounted by the previous key (e.g.
           Shift+Arrow exiting edit mode) can still receive the follow-up
           keydown before focus moves; route it through the normal handler
           so selection-extension keys aren't swallowed *)
        let stale_block_editor =
          match target with
          | Some el when D.el_tag el = "TEXTAREA" ->
              Option.is_some (D.closest_sel ".ls-block" target)
          | _ -> false
        in
        if stale_block_editor then on_normal_key ev
        else if D.is_editable_target target then ()
        else on_normal_key ev

(* -- input: keep the editing buffer in sync (silently) -- *)

let on_input ev =
  if S.ready () then
    match D.closest_sel ".editor-wrapper textarea" (D.ev_target ev) with
    | Some el -> (
        match uuid_of_prefixed "edit-block-" (D.el_id el) with
        | Some uuid ->
            let v = D.el_value el in
            A.sync_buffer uuid v;
            (* keep textContent in lockstep so innerText/:has-text see the
               buffer (textarea innerText follows textContent, not value) *)
            D.el_set_text_content el v;
            Outliner_ops.schedule_save uuid v
        | None -> ())
    | None -> ()

(* -- clipboard events -- *)

let on_paste ev =
  if S.ready () then A.paste_blocks ev

let on_copy ev =
  if S.ready () && S.editing () = None then A.copy_selection ev

let on_cut ev =
  if S.ready () && S.editing () = None then A.cut_selection ev

(* -- clicks -- *)

let on_click ev =
  let target = D.ev_target ev in
  (* the add-button path defers through S.defer_init, so it works even on
     an empty page where no block_row has mounted the state yet *)
  match D.closest_sel ".block-add-button" target with
  | Some btn -> A.append_block ?for_page:(D.el_get_attr btn "parentblockid") ()
  | None ->
      if S.ready () then
        (
        match D.closest_sel ".block-control" target with
        | Some el -> (
            match uuid_of_prefixed "control-" (D.el_id el) with
            | Some u -> A.toggle_collapse u
            | None -> ())
        | None -> (
            match D.closest_sel ".block-children-left-border" target with
            | Some el -> (
                match D.el_get_attr el "blockid" with
                | Some u -> A.toggle_collapse u
                | None -> ())
            | None -> (
                match D.closest_sel ".bullet-container" target with
                | Some el -> (
                    match uuid_of_prefixed "dot-" (D.el_id el) with
                    | Some u -> A.zoom_to u
                    | None -> ())
                | None -> (
                    match D.closest_sel ".block-content" target with
                    | Some el -> (
                        match D.el_get_attr el "blockid" with
                        | Some u ->
                            A.enter_edit u
                              (String.length (A.model_title u))
                        | None -> ())
                    | None -> ()))))

(* -- ls:editor-insert channel (autocomplete pick: replace the typed
   trigger range with the chosen text) -- *)

let detail_field ev name =
  match D.ev_detail ev with
  | Some j -> (
      match Js.Json.decodeObject j with
      | Some d -> Js.Dict.get d name
      | None -> None)
  | None -> None

let on_editor_insert ev =
  if S.ready () then
    match S.editing () with
    | Some e -> (
        match D.textarea_of e.uuid with
        | Some el -> (
            match
              ( Option.bind (detail_field ev "text") Js.Json.decodeString
              , Option.bind (detail_field ev "from") Js.Json.decodeNumber
              , Option.bind (detail_field ev "to") Js.Json.decodeNumber )
            with
            | Some text, Some from, Some to_ ->
                let v = D.el_value el in
                let n = String.length v in
                let f = Int.max 0 (Int.min (int_of_float from) n) in
                let t = Int.max f (Int.min (int_of_float to_) n) in
                let nv =
                  String.sub v 0 f ^ text ^ String.sub v t (n - t)
                in
                D.el_set_value el nv;
                D.el_set_text_content el nv;
                D.el_set_selection_range el (f + String.length text)
                  (f + String.length text);
                A.sync_buffer e.uuid nv;
                Outliner_ops.schedule_save e.uuid nv
            | _ -> ())
        | None -> ())
    | None -> ()

(* clicking outside the editor commits the buffer; clicks inside the
   autocomplete/context-menu popups keep editing — the apply action
   refocuses the textarea (cljs keeps the block in edit mode) *)
let on_mousedown ev =
  if S.ready () && S.editing () <> None then
    match D.closest_sel ".editor-wrapper" (D.ev_target ev) with
    | Some _ -> ()
    | None -> (
        match D.closest_sel ".cp__overlays" (D.ev_target ev) with
        | Some _ -> ()
        | None -> A.schedule_blur_commit ())

(* -- drag & drop (cljs components/block.cljs on-drag-start/
   block-drag-over/block-drop) -- *)

let dragging_uuid : string option ref = ref None
let drop_target : (string * string) option ref = ref None

let on_dragstart ev =
  match D.closest_sel ".bullet-container" (D.ev_target ev) with
  | Some el -> (
      match D.el_get_attr el "blockid" with
      | Some u -> (
          dragging_uuid := Some u;
          match D.ev_data_transfer ev with
          | Some dt -> D.dt_set_data dt "block-dom-id" u
          | None -> ())
      | None -> ())
  | None -> ()

(* cljs block-drag-over: near the top of the first block -> :top; deep
   indent (x-offset > 50) -> :nested; else :sibling *)
let on_dragover ev =
  if S.ready () then
    match !dragging_uuid with
    | None -> ()
    | Some src -> (
        match D.closest_sel ".ls-block" (D.ev_target ev) with
        | Some el -> (
            match D.el_get_attr el "blockid" with
            | Some tgt when tgt <> src && not (A.is_descendant tgt src) -> (
                D.prevent_default ev;
                let rect = D.el_bounding_rect el in
                let first =
                  match S.find_parent tgt with
                  | Some (_, idx) -> idx = 0
                  | None -> false
                in
                let near_top =
                  Float.abs (D.ev_client_y ev -. D.rect_top rect) <= 16.0
                in
                let x_off = D.ev_page_x ev -. D.rect_left rect in
                let move_to =
                  if first && near_top then "top"
                  else if x_off > 50.0 then "nested"
                  else "sibling"
                in
                drop_target := Some (tgt, move_to))
            | _ -> drop_target := None)
        | None -> ())

let on_drop ev =
  (match (!dragging_uuid, !drop_target) with
   | Some src, Some (tgt, move_to) ->
       D.prevent_default ev;
       A.drop_dragged_block src tgt move_to
   | _ -> ());
  dragging_uuid := None;
  drop_target := None

let on_dragend _ev =
  dragging_uuid := None;
  drop_target := None

let installed = ref false

let install_once () =
  if not !installed then begin
    installed := true;
    D.document_add_listener "keydown" on_keydown true;
    D.document_add_listener "input" on_input true;
    D.document_add_listener "paste" on_paste true;
    D.document_add_listener "copy" on_copy true;
    D.document_add_listener "cut" on_cut true;
    D.document_add_listener "click" on_click true;
    D.document_add_listener "mousedown" on_mousedown true;
    D.document_add_listener "ls:editor-insert" on_editor_insert true;
    D.document_add_listener "dragstart" on_dragstart true;
    D.document_add_listener "dragover" on_dragover true;
    D.document_add_listener "drop" on_drop true;
    D.document_add_listener "dragend" on_dragend true
  end
