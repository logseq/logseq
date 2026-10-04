(* Document-level event handling for the outliner. LUI's dom-event channel
   cannot preventDefault and lacks caret/selection info, so the full key
   contract lives here in capture phase; dispatch is by event target:
   inside .editor-wrapper -> editing mode, else normal (block-select) mode. *)

module S = Editor_state
module D = Editor_dom
module A = Editor_actions

let ( let* ) p f = Js.Promise.then_ f p

let mods ev = D.ev_ctrl ev || D.ev_meta ev

let uuid_of_prefixed prefix id =
  let n = String.length prefix in
  if String.length id > n && String.sub id 0 n = prefix then
    Some (String.sub id n (String.length id - n))
  else None

let caret_span el =
  (D.el_selection_start el, D.el_selection_end el)

(* while #ui__ac (autocomplete popup) is live the popup's own document
   keydown handler owns these keys — the editor listener runs first (it
   installs at module init), so without this guard Enter would split the
   block AND pick the popup item. Only a live ac counts: the popup
   element can still be mounting/unmounting, and an ac whose editor
   textarea was remounted is stale — swallowing Enter then would eat the
   key with no visible item picked *)
let ac_popup_open () = Popups_state.ac_attached ()

let ac_owned_key = function
  | "Enter" | "Tab" | "Escape" | "ArrowUp" | "ArrowDown" -> true
  | _ -> false

(* -- line-editing ops (cljs editor/clear-block, kill-line-before,
   forward-kill-word, forward/backward-word) -- *)

let set_buffer uuid nv caret =
  match D.textarea_of uuid with
  | Some el ->
      D.el_set_value el nv;
      D.el_set_selection_range el caret caret;
      A.sync_buffer uuid nv;
      Outliner_ops.schedule_save uuid nv
  | None -> ()

let is_word_char c =
  (c >= 'a' && c <= 'z')
  || (c >= 'A' && c <= 'Z')
  || (c >= '0' && c <= '9')
  || c = '_' || Char.code c > 127

let forward_word_pos v pos =
  let n = String.length v in
  let i = ref pos in
  while !i < n && not (is_word_char v.[!i]) do
    incr i
  done;
  while !i < n && is_word_char v.[!i] do
    incr i
  done;
  !i

let backward_word_pos v pos =
  let i = ref pos in
  while !i > 0 && not (is_word_char v.[!i - 1]) do
    decr i
  done;
  while !i > 0 && is_word_char v.[!i - 1] do
    decr i
  done;
  !i

(* kill from caret back to the start of the current line *)
let kill_line_before uuid =
  match D.textarea_of uuid with
  | Some el ->
      let v = D.el_value el and s = D.el_selection_start el in
      let ls =
        match String.rindex_opt (String.sub v 0 s) '\n' with
        | Some i -> i + 1
        | None -> 0
      in
      set_buffer uuid
        (String.sub v 0 ls ^ String.sub v s (String.length v - s))
        ls
  | None -> ()

(* delete caret..end-of-word (emacs kill-word semantics) *)
let forward_kill_word uuid =
  match D.textarea_of uuid with
  | Some el ->
      let v = D.el_value el and s = D.el_selection_start el in
      let e = forward_word_pos v s in
      set_buffer uuid
        (String.sub v 0 s ^ String.sub v e (String.length v - e))
        s
  | None -> ()

let move_word uuid forward =
  match D.textarea_of uuid with
  | Some el ->
      let v = D.el_value el and s = D.el_selection_start el in
      let p =
        if forward then forward_word_pos v s else backward_word_pos v s
      in
      D.el_set_selection_range el p p
  | None -> ()

(* cljs editor/follow-link: open the page ref / tag / block ref whose
   markup spans the caret *)
let link_target_at v s =
  let enclosing start tok_end =
    (* last [start] token strictly before caret, first [tok_end] at-or-after
       caret — target text between them *)
    let n = String.length v in
    let st_n = String.length start in
    let rec rfind i =
      if i < 0 then None
      else if i + st_n <= n && String.sub v i st_n = start then Some i
      else rfind (i - 1)
    in
    match rfind (s - st_n) with
    | Some a -> (
        let te_n = String.length tok_end in
        let rec find i =
          if i + te_n > n then None
          else if String.sub v i te_n = tok_end then Some i
          else find (i + 1)
        in
        match find (a + st_n) with
        | Some b when b >= s ->
            Some (String.sub v (a + st_n) (b - a - st_n))
        | _ -> None)
    | None -> None
  in
  match enclosing "[[" "]]" with
  | Some t -> Some t
  | None -> (
      match enclosing "((" "))" with
      | Some u -> Some u
      | None ->
          (* #tag word at caret *)
          let n = String.length v in
          let is_boundary c = not (is_word_char c) && c <> '#' in
          let a = ref s and b = ref s in
          while !a > 0 && not (is_boundary v.[!a - 1]) do
            decr a
          done;
          while !b < n && not (is_boundary v.[!b]) do
            incr b
          done;
          if
            !a < !b && !a > 0 && v.[!a - 1] = '#'
            || (!a < !b && v.[!a] = '#')
          then
            let w = if v.[!a] = '#' then !a + 1 else !a in
            Some (String.sub v w (!b - w))
          else None)

let follow_link uuid sidebar =
  match D.textarea_of uuid with
  | Some el -> (
      match link_target_at (D.el_value el) (D.el_selection_start el) with
      | Some title when String.trim title <> "" ->
          A.exit_edit ~select:false;
          (match sidebar, !Sidebar_state.st_ref with
           | true, Some sst -> Sidebar_state.open_ref sst title
           | _ ->
               Platform.set_location_hash
                 (Runtime.nav_hash ("#/page/" ^ title)))
      | _ -> ())
  | None -> ()

(* paste clipboard text into the editing block at the caret as a single
   block (cljs editor/paste-text-in-one-block-at-point) *)
let paste_text_at_caret uuid =
  ignore
    (let* text = Platform.clipboard_read_text () in
     (match D.textarea_of uuid with
      | Some el ->
          let v = D.el_value el in
          let s = D.el_selection_start el
          and e = D.el_selection_end el in
          let nv =
            String.sub v 0 s ^ text
            ^ String.sub v e (String.length v - e)
          in
          set_buffer uuid nv (s + String.length text)
      | None -> ());
     Js.Promise.resolve ())

(* -- editor-mode keys -- *)

(* cljs shortcut tables key on the unshifted key plus modifier flags; DOM
   `key` already applies Shift ("Z", ">"), so letter/symbol shortcuts must
   be normalized back before matching *)
let shortcut_key ev =
  match String.lowercase_ascii (D.ev_key ev) with
  | ">" -> "." | "<" -> "," | "?" -> "/" | ":" -> ";" | "\"" -> "'"
  | "~" -> "`" | "{" -> "[" | "}" -> "]" | "|" -> "\\" | "_" -> "-"
  | "+" -> "=" | "!" -> "1" | "@" -> "2" | "#" -> "3" | "$" -> "4"
  | "%" -> "5" | "^" -> "6" | "&" -> "7" | "*" -> "8" | "(" -> "9"
  | ")" -> "0" | k -> k

let on_editor_arrows ev uuid el =
  let key = D.ev_key ev in
  let up = key = "ArrowUp" in
  let shift = D.ev_shift ev and alt = D.ev_alt ev and meta = D.ev_meta ev in
  if (alt || meta) && shift then (
    D.prevent_default ev;
    ignore
      (Outliner_ops.apply_and_refresh
         [ Outliner_ops.move_up_down [ uuid ] up ]))
  else if mods ev then (
    (* cljs mod+up / mod+down collapse/expand the block's children *)
    D.prevent_default ev;
    A.collapse_expand ~collapse:up ())
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
    | "Enter" when mods ev && not shift ->
        (* cljs editor/cycle-todo — mod+enter never splits *)
        D.prevent_default ev;
        Editor_commands.cycle_todo uuid
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
    | _ -> (
        match shortcut_key ev with
        | "z" when mods ev ->
            D.prevent_default ev;
            if shift then A.redo () else A.undo ()
        | "y" when mods ev ->
            D.prevent_default ev;
            A.redo ()
        | "a" when mods ev && not shift -> (
            (* cljs editor/select-parent — only when the whole textarea
               is selected does mod+a leave editing for the block *)
            let v = D.el_value el in
            if
              v <> ""
              && D.el_selection_start el = 0
              && D.el_selection_end el = String.length v
            then (
              D.prevent_default ev;
              A.exit_edit ~select:true))
        | "b" when mods ev && not shift ->
            D.prevent_default ev;
            A.wrap_selection uuid "**"
        | "b" when D.ev_ctrl ev && shift ->
            D.prevent_default ev;
            move_word uuid false
        | "i" when mods ev && not shift ->
            D.prevent_default ev;
            A.wrap_selection uuid "*"
        | "s" when mods ev && shift ->
            D.prevent_default ev;
            A.wrap_selection uuid "~~"
        | ";" when mods ev && not shift ->
            D.prevent_default ev;
            A.toggle_children_collapse ()
        | "," when mods ev && not shift ->
            D.prevent_default ev;
            A.zoom_out ()
        | "h" when mods ev && shift ->
            D.prevent_default ev;
            A.wrap_selection uuid "=="
        | "e" when D.ev_meta ev && not shift -> A.quick_add ()
        | "e" when mods ev && shift ->
            (* cljs editor/copy-embed *)
            D.prevent_default ev;
            Platform.copy_to_clipboard ("{{embed ((" ^ uuid ^ "))}}")
        | "." when mods ev && shift ->
            D.prevent_default ev;
            A.zoom_to uuid
        | "l" when D.ev_meta ev && not shift ->
            (* cljs editor/insert-link *)
            D.prevent_default ev;
            Editor_commands.open_link_form false uuid
              (D.el_selection_start el)
        | "l" when D.ev_ctrl ev && not shift ->
            (* cljs editor/clear-block (macOS ctrl+l) *)
            D.prevent_default ev;
            set_buffer uuid "" 0
        | "o" when mods ev ->
            D.prevent_default ev;
            follow_link uuid shift
        | "u" when D.ev_ctrl ev && not shift ->
            D.prevent_default ev;
            kill_line_before uuid
        | "w" when D.ev_ctrl ev && not shift ->
            D.prevent_default ev;
            forward_kill_word uuid
        | "f" when D.ev_ctrl ev && shift ->
            D.prevent_default ev;
            move_word uuid true
        | "c" when mods ev && shift ->
            (* cljs editor/copy-text — the block's text to clipboard *)
            D.prevent_default ev;
            Platform.copy_to_clipboard (D.el_value el)
        | "v" when mods ev && shift ->
            (* cljs editor/paste-text-in-one-block-at-point *)
            D.prevent_default ev;
            paste_text_at_caret uuid
        | _ -> ())

(* -- global shortcut chords (cljs modules/shortcut/config.cljs) --

   The cljs KeyboardShortcutHandler tracks stroke sequences ("g j",
   "mod+c mod+c", ...) over document keydowns; a complete sequence runs
   the bound command id. Commands fall into cljs categories:

   - editor-global / global-prevent-default: fire in editing AND
     non-editing contexts (search, undo, sidebar/clear, ...)
   - global-non-editing-only: fire only when the target is not an
     editable element (the g/t/p/c letter chords live here)

   Binding strings come from the same table the cmdk embeds
   (Commands_data.table), so every cljs binding resolves to the same
   command id and dispatches through Cmdk_state.dispatch_id. *)

let canonical_binding b =
  match List.rev (String.split_on_char '+' b) with
  | key :: ms -> String.concat "+" (List.sort compare ms @ [ key ])
  | [] -> b

(* (binding stroke sequence, command id) — one row per binding *)
let chord_table : (string list * string) list Lazy.t =
  lazy
    (List.concat_map
       (fun (c : Commands_data.cmd) ->
          match c.Commands_data.sc with
          | Commands_data.Binds bs ->
              List.map
                (fun b ->
                   ( List.map canonical_binding (String.split_on_char ' ' b)
                   , c.Commands_data.id ))
                bs
          | _ -> [])
       Commands_data.table)

(* cljs :global-non-editing-only ids — never fire while the target is an
   editable element *)
let non_editing_only =
  [ "go/home"; "go/journals"; "go/all-pages"; "go/flashcards"
  ; "go/all-graphs"; "go/keyboard-shortcuts"; "go/tomorrow"
  ; "go/next-journal"; "go/prev-journal"; "ui/toggle-document-mode"
  ; "ui/highlight-recent-blocks"; "ui/toggle-settings"
  ; "ui/toggle-right-sidebar"; "ui/toggle-left-sidebar"
  ; "ui/toggle-help"; "ui/toggle-theme"; "editor/copy-page-url"
  ; "editor/set-tags"; "editor/add-property-deadline"
  ; "editor/add-property-status"; "editor/add-property-priority"
  ; "editor/add-property-icon"; "editor/add-reaction"
  ; "editor/add-comment"; "editor/toggle-display-hidden-properties"
  ; "ui/toggle-wide-mode"; "ui/select-theme-color"; "ui/goto-plugins"
  ; "editor/toggle-open-blocks"; "ui/clear-all-notifications"
  ; "sidebar/close-top"; "misc/export-block-data"
  ; "misc/export-page-data"; "misc/export-graph-ontology-data"
  ; "misc/import-edn-data"; "ui/customize-appearance" ]

(* single strokes another listener already owns — dispatching them here
   would double-fire (palette open/move shortcuts, selection nav,
   block-edit keys) *)
let owned_strokes =
  [ "mod+k"; "mod+shift+m" (* cmdk_view's own document listener *)
  ; "enter"; "mod+enter"; "backspace"; "delete"; "tab"
  ; "shift+tab"; "up"; "down"; "left"; "right"; "shift+up"
  ; "shift+down"; "mod+shift+up"; "mod+shift+down"; "alt+shift+up"
  ; "alt+shift+down"; "mod+up"; "mod+down"; "mod+;"; "mod+,"; "mod+z"
  ; "mod+shift+z"; "mod+y"; "mod+a"; "mod+shift+a"; "mod+e"
  ; "shift+/"; "ctrl+p"; "ctrl+n"; "escape" ]

let chord_seq : string list ref = ref []
let chord_ms : float ref = ref 0.

(* Closure KeyboardShortcutHandler SEQUENCE_TIMEOUT *)
let chord_window_ms = 1000.

let rec is_prefix xs ys =
  match xs, ys with
  | [], _ -> true
  | x :: xt, y :: yt -> x = y && is_prefix xt yt
  | _ -> false

(* a keydown's canonical stroke token, matching the binding-table format
   ("mod+k", "shift+/", "g", "ctrl+space", ...) *)
let stroke_of ev =
  match D.ev_key ev with
  | "Control" | "Meta" | "Alt" | "Shift" | "CapsLock" | "Dead" -> None
  | _ ->
      let key =
        match shortcut_key ev with
        | "arrowup" -> "up"
        | "arrowdown" -> "down"
        | "arrowleft" -> "left"
        | "arrowright" -> "right"
        | " " -> "space"
        | "[" -> "open-square-bracket"
        | "]" -> "close-square-bracket"
        | k -> k
      in
      let ms =
        (if D.ev_shift ev then [ "shift" ] else [])
        @ (if D.ev_alt ev then [ "alt" ] else [])
        @ (if D.ev_ctrl ev then [ "ctrl" ] else [])
        @ (if D.ev_meta ev then [ "mod" ] else [])
      in
      Some (String.concat "+" (List.sort compare ms @ [ key ]))

(* gate per cljs category: editor/* ids are owned by the per-mode key
   paths (on_editor_key / on_normal_key) — the chord layer only needs
   them when a sequence crosses into chords those paths can't see;
   while editing, non-editor commands still fire (global-prevent-default)
   except the non-editing-only set *)
let chord_may_run editing cid =
  if editing then
    (* editor/* is owned by on_editor_key while editing; the only
       exception is add-property, which cljs keeps live in every mode *)
    cid = "editor/add-property"
    || ((not (List.mem cid non_editing_only))
        && not (String.length cid > 7 && String.sub cid 0 7 = "editor/"))
  else true

let on_global_key ev =
  (* the open cmdk palette owns every key *)
  let palette_open =
    match !Cmdk_state.latest_st with
    | Some st -> (Cmdk_state.get st).Cmdk_state.open_
    | None -> false
  in
  if (not palette_open) && not (D.ev_composing ev) then
    match stroke_of ev with
    | None -> ()
    | Some stroke ->
        if not (List.mem stroke owned_strokes) then begin
          let now = Platform.date_now_ms () in
          let seq =
            if now -. !chord_ms > chord_window_ms then [] else !chord_seq
          in
          let cand = seq @ [ stroke ] in
          let tbl = Lazy.force chord_table in
          let editing =
            D.is_editable_target (D.ev_target ev)
            || S.editing () <> None
          in
          let dispatch cid =
            if chord_may_run editing cid then begin
              D.prevent_default ev;
              Cmdk_state.dispatch_id cid
            end
          in
          match List.find_opt (fun (s, _) -> s = cand) tbl with
          | Some (_, cid) ->
              dispatch cid;
              (* a stroke that is also a chord prefix keeps tracking —
                 cljs "mod+c" fires copy AND stays armed for
                 "mod+c mod+c" / "mod+c mod+s" *)
              if List.exists (fun (s, _) -> is_prefix cand s && s <> cand) tbl
              then begin
                chord_seq := cand;
                chord_ms := now
              end
              else chord_seq := []
          | None ->
              if
                List.exists
                  (fun (s, _) -> is_prefix cand s && s <> cand)
                  tbl
              then begin
                chord_seq := cand;
                chord_ms := now
              end
              else begin
                chord_seq := [];
                (* the dead sequence's last stroke may itself complete or
                   start a binding ("t" then "x" — "x" alone could bind) *)
                match List.find_opt (fun (s, _) -> s = [ stroke ]) tbl with
                | Some (_, cid) -> dispatch cid
                | None ->
                    if
                      List.exists
                        (fun (s, _) -> List.hd s = stroke && List.length s > 1)
                        tbl
                    then begin
                      chord_seq := [ stroke ];
                      chord_ms := now
                    end
              end
        end

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
  | "ArrowUp" when mods ev && not shift ->
      (* cljs mod+up collapses one level / the selection *)
      D.prevent_default ev;
      A.collapse_expand ~collapse:true ()
  | "ArrowDown" when mods ev && not shift ->
      (* cljs mod+down expands one level / the selection *)
      D.prevent_default ev;
      A.collapse_expand ~collapse:false ()
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
  | "Enter" when mods ev ->
      D.prevent_default ev;
      List.iter Editor_commands.cycle_todo (A.selected_uuids ())
  | "Enter" when not shift -> (
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
  | "Escape" ->
      (* cljs: first Escape closes the action-bar popover, the next one
         clears the selection *)
      if S.ready () && (S.value ()).S.action_bar then A.hide_action_bar ()
      else A.clear_selection ()
  | "?" ->
      (* cljs shift+/ (:ui/toggle-help, global-non-editing-only) toggles
         the help menu popup *)
      D.prevent_default ev;
      Runtime.send Action.Help_toggle
  | _ -> (
      match shortcut_key ev with
      | "a" when mods ev && shift ->
          (* cljs mod+shift+a = select-all-blocks *)
          D.prevent_default ev;
          A.select_all ()
      | "a" when mods ev ->
          (* cljs mod+a = select-parent *)
          D.prevent_default ev;
          A.select_parent ()
      | ";" when mods ev && not shift ->
          D.prevent_default ev;
          A.toggle_children_collapse ()
      | "," when mods ev && not shift ->
          (* cljs zoom-out outside edit mode is history.back *)
          D.prevent_default ev;
          Platform.history_back ()
      | "z" when mods ev ->
          D.prevent_default ev;
          if shift then A.redo () else A.undo ()
      | "y" when mods ev ->
          D.prevent_default ev;
          A.redo ()
      | "e" when mods ev ->
          (* cljs mod+e quick-add also fires outside edit mode *)
          D.prevent_default ev;
          A.quick_add ()
      | _ -> ())

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
  let buf = e.S.buffer in
  let len = String.length buf in
  (* pending_focus caret is derived from the live textarea, which can
     outpace e.buffer while a refresh rewrites it — clamp before any
     String.sub *)
  let caret = max 0 (min caret len) in
  let queue f = S.pending_focus_actions := f :: !S.pending_focus_actions in
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
    S.pending_focus := Some (e.S.uuid, caret', !S.last_edit_input_ms)
  in
  let insert s =
    patch
      (String.sub buf 0 caret ^ s ^ String.sub buf caret (len - caret))
      (caret + String.length s)
  in
  (match D.ev_key ev with
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
  | ("ArrowUp" | "ArrowDown") as key when D.ev_shift ev ->
      D.prevent_default ev;
      queue (fun () -> A.shift_arrow_select (key = "ArrowUp"))
  | ("ArrowUp" | "ArrowDown") as key
    when not (mods ev || D.ev_alt ev) ->
      (* mirror on_editor_arrows: a plain arrow only leaves the block when
         the caret sits on a boundary line; mid-buffer arrows just prevent
         the browser default while the textarea is remounting *)
      D.prevent_default ev;
      let up = key = "ArrowUp" in
      let first_line =
        (match String.index_opt (String.sub buf 0 caret) '\n' with
        | Some _ -> false
        | None -> true)
      in
      let last_line =
        (match String.index_opt (String.sub buf caret (len - caret)) '\n' with
        | Some _ -> false
        | None -> true)
      in
      if (up && first_line) || ((not up) && last_line) then
        (* resolve the editing block at replay time: several arrows can
           queue in one remount window and each replayed nav switches
           editing to a new block — a captured uuid would navigate the
           same origin repeatedly and collapse two hops into one *)
        queue (fun () ->
            match S.editing_uuid () with
            | Some u -> A.arrow_nav u up
            | None -> ())
  | key
    when String.length key = 1
         && (not (D.ev_composing ev))
         && not (mods ev || D.ev_alt ev) ->
      D.prevent_default ev;
      insert key
  | _ -> D.prevent_default ev);
  (* run the op this key just queued right away (and any already queued):
     ops read S.editing/model state, not the landed textarea, and
     deferring them to the next focus landing delays their outliner ops
     past same-task readers *)
  A.drain_pending_focus_actions 0

let on_keydown ev =
  if S.ready () then begin
    if Editor_commands.popup_key ev then ()
    else
      let target = D.ev_target ev in
      (* CodeMirror surfaces (fenced-code editor, query source editor)
         own their keys — Esc/arrows/Tab go through the editor's own
         listeners, never the block-editor dispatch *)
      match D.closest_sel ".CodeMirror" target with
      | Some _ -> ()
      | None -> (
          (* property value textareas own their key handling
             (properties_value.ml) — the block-editor dispatch below must
             leave their keys alone *)
          match D.closest_sel ".property-value-container" target with
          | Some _ -> ()
          | None -> (
          match (S.editing (), !S.pending_focus) with
          | Some e, Some (uuid, caret, _)
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
              S.pending_focus :=
                Some (e.S.uuid, caret, !S.last_edit_input_ms);
              D.set_timeout A.apply_focus 0;
              on_pending_focus_key ev e caret
          | _ -> (
          match
            (S.editing_uuid (), D.closest_sel ".editor-wrapper" target)
          with
          | Some uuid, Some _ -> (
              match target with
              | Some el when D.el_tag el = "TEXTAREA" -> (
                  S.note_input ();
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
                    Option.is_some (D.closest_sel ".ls-block" target)
                    && D.closest_sel ".ls-page-title" target = None
                    (* property value editors also mount
                       .editor-wrapper textarea inside .ls-block —
                       they are not stale block editors *)
                    && D.closest_sel ".property-value-container" target
                       = None
                | _ -> false
              in
              if stale_block_editor then on_normal_key ev
              else if D.is_editable_target target then ()
              else on_normal_key ev)))
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
    | Some el
      when D.closest_sel ".property-value-container" (D.ev_target ev)
           <> None ->
        (* property value textareas own their buffer and commit path —
           keep textContent in lockstep for :has-text but never sync the
           block buffer or schedule a block save *)
        D.el_set_text_content el (D.el_value el)
    | Some el -> (
        match uuid_of_prefixed "edit-block-" (D.el_id el) with
        | Some uuid ->
            let v = D.el_value el in
            S.note_input ();
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
    | None -> ()

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
                       handlers; interactive targets inside the view (the
                       .ls-query-setting and add-filter buttons, result
                       links, .query-table cells, the .view-action-type
                       display-type select — a div trigger, not a button)
                       are the view's controls, not an edit request —
                       elsewhere in .block-content the click opens the
                       title editor like cljs *)
                    match
                      D.closest_sel
                        "button, a, input, audio, video, details, summary, \
                         sup.fn, [contenteditable=true], .cloze, \
                         .cloze-revealed, .query-table, .image-resize, \
                         .view-action-type, .ui-fenced-code-editor"
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
      D.closest_sel ".editor-wrapper, .ui-fenced-code-editor"
        (D.ev_target ev)
    with
    | Some _ -> ()
    | None -> (
        match D.ev_target ev with
        | Some el when Popups_state.inside el -> ()
        | _ ->
            if Editor_commands.click_guard (D.ev_target ev) then ()
            else A.schedule_blur_commit ())

(* -- drag & drop (cljs components/block.cljs on-drag-start/
   block-drag-over/block-drop) -- *)

(* block drags run through the dnd-kit DragDropManager (Block_dnd). The
   document listeners below cover what the manager cannot see:

   - a native HTML5 dragstart on a [draggable] bullet would cancel the
     sensor activation and replay the old path, so it is suppressed;
     this listener installs before any pointerdown, meaning it runs
     ahead of the sensor's own document dragstart binding and hides the
     event from it via stopImmediatePropagation
   - OS file drops never produce a dnd-kit operation; keep the cljs
     handle-data-transfer-drop! "Files" branch as a native path *)

let on_dragstart ev =
  match D.closest_sel ".bullet-container" (D.ev_target ev) with
  | Some _ ->
      D.prevent_default ev;
      D.stop_immediate ev
  | None -> ()

let files_of ev =
  match D.ev_data_transfer ev with
  | Some dt -> D.dt_files dt
  | None -> [||]

let on_file_dragover ev =
  if Array.length (files_of ev) > 0 then D.prevent_default ev

let on_file_drop ev =
  let files = files_of ev in
  if Array.length files > 0 then begin
    D.prevent_default ev;
    Asset_dom.upload_files files
  end

let installed = ref false

let install_once () =
  if not !installed then begin
    installed := true;
    D.document_add_listener "keydown" on_keydown true;
    D.document_add_listener "keydown" on_global_key true;
    D.document_add_listener "input" on_input true;
    D.document_add_listener "paste" on_paste true;
    D.document_add_listener "copy" on_copy true;
    D.document_add_listener "cut" on_cut true;
    D.document_add_listener "click" on_click true;
    D.document_add_listener "mousedown" on_mousedown true;
    D.document_add_listener "ls:editor-insert" on_editor_insert true;
    D.document_add_listener "dragstart" on_dragstart true;
    D.document_add_listener "dragover" on_file_dragover true;
    D.document_add_listener "drop" on_file_drop true;
    Block_dnd.install ();
    (* pointer-driven range selection (cljs block/selection.cljs) *)
    D.document_add_listener "pointerdown"
      (fun ev ->
        if
          S.ready ()
          (* capture-phase listener fires before the CM wrapper's
             stopPropagation — fenced-code clicks must not start a
             block range selection (cljs clears selection instead) *)
          && D.closest_sel ".ui-fenced-code-editor" (D.ev_target ev)
             = None
        then Block_selection.pointerdown ev)
      true;
    D.document_add_listener "pointerup"
      (fun _ev -> Block_selection.pointerup ())
      true
  end
