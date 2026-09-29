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

(* while #ui__ac (autocomplete popup) is in the DOM the popup's own
   document keydown handler owns these keys — the editor listener runs
   first (it installs at module init), so without this guard Enter would
   split the block AND pick the popup item *)
let ac_popup_open () = D.get_element_by_id "ui__ac" <> None

let ac_owned_key = function
  | "Enter" | "Tab" | "Escape" | "ArrowUp" | "ArrowDown" -> true
  | _ -> false

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
      else if ac_popup_open () && ac_owned_key key then ()
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
    | "]" | ")" -> (
        (* cljs autopair overtype: a closing char that already sits under
           the caret (autopaired ghost) skips it instead of inserting *)
        let v = D.el_value el in
        let s = D.el_selection_start el in
        let c = if key = "]" then ']' else ')' in
        if s < String.length v && String.get v s = c then (
          D.prevent_default ev;
          D.el_set_selection_range el (s + 1) (s + 1)))
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
    | "h" when mods ev && shift ->
        D.prevent_default ev;
        A.wrap_selection uuid "=="
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
  | "e" when meta || mods ev && alt ->
      D.prevent_default ev;
      A.quick_add ()
  | "z" when mods ev ->
      D.prevent_default ev;
      if shift then A.redo () else A.undo ()
  | "y" when mods ev ->
      D.prevent_default ev;
      A.redo ()
  | "Escape" -> A.clear_selection ()
  | _ -> ()

(* while an autocomplete popup is open its own document listener
   (registered after ours) owns Enter/Tab/Escape/arrows — skip *)
let ac_popup_open () =
  match D.get_element_by_id "ui__ac-inner" with
  | Some _ -> true
  | None -> false

(* is [target] the editor surface of block [uuid] — its own textarea or
   the CodeMirror line inside its editor wrapper *)
let targets_block_editor uuid target =
  match target with
  | Some el ->
      D.el_id el = "edit-block-" ^ uuid
      || Option.is_some
           (D.closest_sel ("#editor-edit-block-" ^ uuid) target)
  | None -> false

(* a textarea carrying another block's edit-block-<uuid> id — the
   previous editor can still be mounted while its replacement is being
   built; keystrokes into it would write the wrong block *)
let is_other_block_editor uuid target =
  match target with
  | Some el when D.el_tag el = "TEXTAREA" -> (
      match uuid_of_prefixed "edit-block-" (D.el_id el) with
      | Some u -> u <> uuid
      | None -> false)
  | _ -> false

(* a structure op (split/merge/…) remounts the editing textarea only
   after its apply+refresh resolves; keystrokes arriving in that window
   still target the previous block's mounted textarea (or <body>) even
   though editing state says we're mid-edit. cljs flushes the DOM
   synchronously so it never sees this window — apply text edits to the
   pending buffer at the pending caret and replay structural ops once
   focus lands *)
let on_pending_focus_key ev e caret =
  Platform.console_log
    (Printf.sprintf "[dbg] pending-key key=%s uuid=%s caret=%d"
       (D.ev_key ev) e.S.uuid caret);
  let buf = e.S.buffer in
  let len = String.length buf in
  let queue f =
    S.pending_focus_actions := f :: !S.pending_focus_actions
  in
  let patch buf' caret' =
    S.set_silent (fun st ->
        { st with S.editing = Some { e with S.buffer = buf' } });
    (* the textarea can already be mounted when pending was lost mid-
       remount — mirror the buffer into it so the DOM doesn't diverge *)
    (match D.textarea_of e.S.uuid with
     | Some el ->
         D.el_set_value el buf';
         D.el_set_selection_range el caret' caret'
     | None -> ());
    S.pending_focus := Some (e.S.uuid, caret')
  in
  let insert s =
    patch
      (String.sub buf 0 caret ^ s ^ String.sub buf caret (len - caret))
      (caret + String.length s)
  in
  match D.ev_key ev with
  | "Backspace" ->
      D.prevent_default ev;
      if caret = 0 then queue (fun () -> A.merge_prev e.S.uuid)
      else
        patch
          (String.sub buf 0 (caret - 1)
          ^ String.sub buf caret (len - caret))
          (caret - 1)
  | "Delete" ->
      D.prevent_default ev;
      if caret = len then queue (fun () -> A.merge_next e.S.uuid)
      else
        patch
          (String.sub buf 0 caret
          ^ String.sub buf (caret + 1) (len - caret - 1))
          caret
  | "Enter" ->
      D.prevent_default ev;
      if D.ev_shift ev then insert "\n"
      else queue (fun () -> A.split_at_cursor e.S.uuid)
  | "Tab" ->
      D.prevent_default ev;
      queue (fun () ->
          A.indent_or_outdent ~indent:(not (D.ev_shift ev)))
  | "Escape" ->
      D.prevent_default ev;
      A.exit_edit ~select:true
  | key
    when String.length key = 1
         && (not (D.ev_composing ev))
         && not (mods ev || D.ev_alt ev) ->
      D.prevent_default ev;
      insert key
  | _ -> D.prevent_default ev

let on_keydown ev =
  if S.ready () then begin
    (match (S.editing (), !S.pending_focus) with
     | Some e, pend ->
         Platform.console_log
           (Printf.sprintf "[dbg] kd key=%s tgt=%s edit=%s pend=%s"
              (D.ev_key ev)
              (match D.ev_target ev with
               | Some el -> D.el_tag el ^ "#" ^ D.el_id el
               | None -> "none")
              e.S.uuid
              (match pend with
               | Some (u, c) -> Printf.sprintf "Some(%s,%d)" u c
               | None -> "None"))
     | _ -> ());
    if Editor_commands.popup_key ev then ()
    else
      let target = D.ev_target ev in
      match D.closest_sel "pre.CodeMirror-line" target with
      | Some el -> Editor_commands.code_pre_key el ev
      | None -> (
          match (S.editing (), !S.pending_focus) with
          | Some e, Some (uuid, caret)
            when e.S.uuid = uuid
                 && not (targets_block_editor uuid target) ->
              on_pending_focus_key ev e caret
          | Some e, _
            when (not (targets_block_editor e.S.uuid target))
                 && (is_other_block_editor e.S.uuid target
                    || not (D.is_editable_target target)) ->
              (* pending_focus was consumed on a node the following
                 refresh replaced (or focus otherwise failed to land):
                 editing still says mid-edit but the press arrived at
                 <body>. Re-arm pending focus on the editing block and
                 route the key through the remount-window handler. *)
              let caret =
                match D.textarea_of e.S.uuid with
                | Some el -> D.el_selection_start el
                | None -> String.length e.S.buffer
              in
              Platform.console_log
                (Printf.sprintf "[dbg] rearm uuid=%s caret=%d tgt=%s"
                   e.S.uuid caret
                   (match target with
                    | Some el -> D.el_tag el ^ "#" ^ D.el_id el
                    | None -> "none"));
              S.pending_focus := Some (e.S.uuid, caret);
              D.set_timeout A.apply_focus 0;
              on_pending_focus_key ev e caret
          | _ -> (
          match
            (S.editing_uuid (), D.closest_sel ".editor-wrapper" target)
          with
          | Some uuid, Some _ -> (
              match target with
              | Some el when D.el_tag el = "TEXTAREA" -> (
                  if ac_popup_open () then
                    match D.ev_key ev with
                    | "Enter" | "Tab" | "Escape" | "ArrowUp"
                    | "ArrowDown" -> ()
                    | _ -> on_editor_key ev uuid el
                  else on_editor_key ev uuid el)
              | _ -> ())
          | _ ->
              (* an editing textarea that was unmounted by the previous key
                 (e.g. Shift+Arrow exiting edit mode) can still receive the
                 follow-up keydown before focus moves; route it through the
                 normal handler so selection-extension keys aren't
                 swallowed. Only a block editor textarea (id
                 edit-block-<uuid>) counts — other textareas inside
                 .ls-block (e.g. the comment box) keep their own key
                 handling *)
              let stale_block_editor =
                match target with
                | Some el when D.el_tag el = "TEXTAREA" ->
                    Option.is_some
                      (uuid_of_prefixed "edit-block-" (D.el_id el))
                | _ -> false
              in
              if stale_block_editor then on_normal_key ev
              else if D.is_editable_target target then ()
              else on_normal_key ev))
  end

(* -- input: keep the editing buffer in sync (silently) -- *)

let on_input ev =
  if S.ready () then
    match D.closest_sel ".editor-wrapper textarea" (D.ev_target ev) with
    | Some el
      when D.closest_sel ".ls-page-title" (D.ev_target ev) <> None ->
        (* the page-title textarea is not a block editor — its own dom-event
           keydown/blur handlers commit the rename; still keep textContent
           in lockstep so :has-text sees the typed value *)
        D.el_set_text_content el (D.el_value el)
    | Some el -> (
        match uuid_of_prefixed "edit-block-" (D.el_id el) with
        | Some uuid ->
            let v = D.el_value el in
            A.sync_buffer uuid v;
            (* keep textContent in lockstep so innerText/:has-text see the
               buffer (textarea innerText follows textContent, not value) *)
            D.el_set_text_content el v;
            D.autosize_textarea el;
            Outliner_ops.schedule_save uuid v
        | None ->
            (* non-block editors (e.g. a comment textarea) still need
               textContent synced for :has-text *)
            D.el_set_text_content el (D.el_value el))
    | None -> (
        match D.closest_sel "pre.CodeMirror-line" (D.ev_target ev) with
        | Some el -> Editor_commands.code_pre_input el
        | None -> ())

(* -- clipboard events -- *)

let on_paste ev =
  if S.ready () then A.paste_blocks ev

let on_copy ev =
  if S.ready () then
    match S.editing () with
    | Some e -> (
        (* cljs copy-current-block-ref: a collapsed selection inside an
           editing block copies [[uuid]]; a non-collapsed selection falls
           through to the native text copy *)
        match (D.textarea_of e.uuid, D.ev_clipboard ev) with
        | Some el, Some clip ->
            if D.el_selection_start el = D.el_selection_end el then (
              D.clipboard_set_text clip "text/plain" ("[[" ^ e.uuid ^ "]]");
              D.prevent_default ev)
        | _ -> ())
    | None -> A.copy_selection ev

let on_cut ev =
  if S.ready () && S.editing () = None then A.cut_selection ev

(* -- clicks -- *)

let on_click ev =
  let target = D.ev_target ev in
  (* the add-button path defers through S.defer_init, so it works even on
     an empty page where no block_row has mounted the state yet *)
  match D.closest_sel ".block-add-button" target with
  | Some btn ->
      A.append_block ?for_page:(D.el_get_attr btn "parentblockid")
        ~scope:(A.scope_of_el btn) ()
  | None ->
      if S.ready () then
        (
        match D.closest_sel ".block-control" target with
        | Some el -> (
            match uuid_of_prefixed "control-" (D.el_id el) with
            | Some u ->
                A.toggle_collapse ~scope:(A.scope_of_el el) u
            | None -> ())
        | None -> (
            match D.closest_sel ".block-children-left-border" target with
            | Some el -> (
                match D.el_get_attr el "blockid" with
                | Some u ->
                    A.toggle_collapse ~scope:(A.scope_of_el el) u
                | None -> ())
            | None -> (
                match D.closest_sel ".bullet-container" target with
                | Some el -> (
                    match uuid_of_prefixed "dot-" (D.el_id el) with
                    | Some u ->
                        (* the wrapping a.bullet-link-wrap's default
                           hash navigation would push a second history
                           entry, leaving history.back() stuck on the
                           zoom route *)
                        D.prevent_default ev;
                        A.zoom_to u
                    | None -> ())
                | None -> (
                    (* capture listener fires before the query shell's own
                       handlers; clicks inside .custom-query-results are the
                       view's controls, not an edit request *)
                    match
                      D.closest_sel
                        "button, a, input, audio, video, details, summary, \
                         sup.fn, [contenteditable=true], .cloze, \
                         .cloze-revealed, .query-table, .image-resize, \
                         .custom-query-results, .cp__query-builder"
                        target
                    with
                    | Some _ -> ()
                    | None -> (
                        match D.closest_sel ".ls-comments-label" target with
                        | Some el -> (
                            match D.el_get_attr el "data-area-uuid" with
                            | Some u ->
                                (* edit-comments-area-title! *)
                                A.enter_edit u
                                  (String.length (A.model_title u))
                            | None -> ())
                        | None -> (
                            match D.closest_sel ".ls-comment-submit" target with
                            | Some el -> (
                                match D.el_get_attr el "data-area-uuid" with
                                | Some u -> Comments.submit u
                                | None -> ())
                            | None -> (
                                match
                                  D.closest_sel ".ls-comment-delete" target
                                with
                                | Some el -> (
                                    match
                                      D.el_get_attr el "data-comment-uuid"
                                    with
                                    | Some u -> Comments.delete u
                                    | None -> ())
                                | None -> (
                                    match
                                      D.closest_sel "a.page-ref" target
                                    with
                                    | Some _ ->
                                        (* page-ref navigation happens in the
                                           document-level listener; the editor
                                           only has to not enter edit *)
                                        ()
                                    | None -> (
                                        match
                                          D.closest_sel ".block-content"
                                            target
                                        with
                                        | Some _
                                          when D.closest_sel
                                                 ".ls-page-title" target
                                               <> None ->
                                            (* the page title's own click
                                               handler starts Title_edit *)
                                            ()
                                        | Some el -> (
                                            match
                                              D.el_get_attr el "blockid"
                                            with
                                            | Some u ->
                                                (* scope by container: the
                                                   same block can render in
                                                   main and the sidebar; only
                                                   the tree where the click
                                                   landed mounts the editor *)
                                                let scope =
                                                  match
                                                    D.closest_sel
                                                      ".cp__right-sidebar"
                                                      target
                                                  with
                                                  | Some _ -> "sidebar"
                                                  | None -> "main"
                                                in
                                                A.enter_edit ~scope u
                                                  (String.length
                                                     (A.model_title u))
                                            | None -> ())
                                        | None -> ())))))))))

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
                let back =
                  Option.value
                    (Option.map int_of_float
                       (Option.bind (detail_field ev "back")
                          Js.Json.decodeNumber))
                    ~default:0
                in
                let caret = f + String.length text - back in
                D.el_set_value el nv;
                D.el_set_text_content el nv;
                D.el_set_selection_range el caret caret;
                A.sync_buffer e.uuid nv;
                Outliner_ops.schedule_save e.uuid nv;
                (* cljs node-embed pick: insert then clear-edit! *)
                (match
                   Option.bind (detail_field ev "exit") Js.Json.decodeBoolean
                 with
                 | Some true -> A.exit_edit ~select:false
                 | _ -> ())
            | _ -> ())
        | None -> ())
    | None -> ()

(* -- ls:editor-command channel is owned by editor_commands.ml -- *)
(* clicking outside the editor commits the buffer; clicks inside the
   autocomplete/context-menu popups keep editing — the apply action
   refocuses the textarea (cljs keeps the block in edit mode) *)
let on_mousedown ev =
  if S.ready () && S.editing () <> None then
    match
      D.closest_sel ".editor-wrapper, .extensions__code"
        (D.ev_target ev)
    with
    | Some _ -> ()
    | None -> (
            (* .cp__overlays hosts the cmdk/autocomplete/context-menu popups;
               .ui__popover-content/.ls-context-menu-content cover anchored
               property popups and cmdk/dialog portals mount outside the
               overlays container under body *)
            match
              D.closest_sel
                ".cp__overlays, .cp__cmdk__modal, .ui__popover-content, .ls-context-menu-content, #date-time-picker, .ls-editor-link-form"
                (D.ev_target ev)
            with
        | Some _ -> ()
        | None ->
            if Editor_commands.click_guard (D.ev_target ev) then ()
            else A.schedule_blur_commit ())

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
   | _ ->
       (* cljs container.cljs :upload-files dnd subscription — a file drop
          anywhere on the main container uploads as asset blocks *)
       match D.ev_data_transfer ev with
       | Some dt ->
           let files = D.dt_files dt in
           if Array.length files > 0 then begin
             D.prevent_default ev;
             Asset_dom.upload_files files
           end
       | None -> ());
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
    D.document_add_listener "dragend" on_dragend true;
    (* pointer-driven range selection (cljs block/selection.cljs) *)
    D.document_add_listener "pointerdown"
      (fun ev -> if S.ready () then Block_selection.pointerdown ev)
      true;
    D.document_add_listener "pointerup"
      (fun _ev -> Block_selection.pointerup ())
      true
  end
