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
  else if shift then ()
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
    if up && first_line then (
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
  | "ArrowUp" when shift ->
      D.prevent_default ev;
      A.extend_selection true
  | "ArrowDown" when shift ->
      D.prevent_default ev;
      A.extend_selection false
  | "ArrowUp" when (meta || alt) && shift ->
      D.prevent_default ev;
      A.move_blocks_up_down true
  | "ArrowDown" when (meta || alt) && shift ->
      D.prevent_default ev;
      A.move_blocks_up_down false
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
      | Some _ ->
          D.prevent_default ev;
          A.append_block ()
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
        if D.is_editable_target target then ()
        else on_normal_key ev

(* -- input: keep the editing buffer in sync (silently) -- *)

let on_input ev =
  if S.ready () then
    match D.closest_sel ".editor-wrapper textarea" (D.ev_target ev) with
    | Some el -> (
        match uuid_of_prefixed "edit-block-" (D.el_id el) with
        | Some uuid ->
            A.sync_buffer uuid (D.el_value el);
            (* keep textContent in lockstep so innerText/:has-text see the
               buffer (textarea innerText follows textContent, not value) *)
            D.el_set_text_content el (D.el_value el)
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
  | Some _ -> A.append_block ()
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

(* clicking outside the editor commits the buffer *)
let on_mousedown ev =
  if S.ready () && S.editing () <> None then
    match D.closest_sel ".editor-wrapper" (D.ev_target ev) with
    | Some _ -> ()
    | None -> A.blur_commit ()

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
    D.document_add_listener "mousedown" on_mousedown true
  end
