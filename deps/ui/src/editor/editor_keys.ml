(* Document-level event handling for the outliner. LUI's dom-event channel
   cannot preventDefault and lacks caret/selection info, so the full key
   contract lives here in capture phase; dispatch is by event target:
   inside .editor-wrapper -> editing mode, else normal (block-select) mode.
   Non-editor controls retain their own activation and navigation keys. *)

module S = Editor_state
module A = Editor_actions

(* Ui_services.ev exposes key as an option; the handlers below compare
   against literal keys, so "" is the honest absence value *)
let ev_key ev = Option.value ~default:"" ev.Ui_services.key

let closest sel t =
  match t with Some el -> el.Ui_services.closest sel | None -> None

let is_editable_target t =
  match t with Some el -> el.Ui_services.editable () | None -> false

let readonly_block_target target =
  match closest ".ls-block" target with
  | Some row -> row.Ui_services.attr "data-editable" = Some "false"
  | None -> false

let ( let* ) p f = Js.Promise.then_ f p

let mods ev = ev.Ui_services.ctrl || ev.Ui_services.meta

let non_editor_control_target target =
  closest ".ed-input, .CodeMirror, .code-editor" target = None
  && (is_editable_target target
      || closest
           "button, a[href], input, textarea, select, \
            [role='button'], [role='link'], [role='checkbox'], [role='radio'], \
            [role='switch'], [role='tab'], [role='slider'], [role='spinbutton'], \
            [role='combobox'], [role='textbox'], [role='listbox'], [role='option'], \
            [role='menuitem'], [role='menuitemcheckbox'], [role='menuitemradio']"
           target <> None)

let control_owned_key ev =
  not (mods ev || ev.Ui_services.alt)
  && non_editor_control_target ev.Ui_services.target
  && (match ev_key ev with
      | "Enter" | " " | "Tab" | "Escape" | "Backspace" | "Delete"
      | "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown"
      | "Home" | "End" | "PageUp" | "PageDown" -> true
      | _ -> false)

let input_composing ev =
  ev.Ui_services.composing
  || (match S.editing () with
      | Some e -> Edit_model.composing e.S.model
      | None -> false)
  || Code_mirror.composition_active ev

let uuid_of_prefixed prefix id =
  let n = String.length prefix in
  if String.length id > n && String.sub id 0 n = prefix then
    Some (String.sub id n (String.length id - n))
  else None

(* while #ui__ac (autocomplete popup) is live the popup's own document
   keydown handler owns these keys — the editor listener runs first (it
   installs at module init), so without this guard Enter would split the
   block AND pick the popup item. Only a live ac counts: the popup
   element can still be mounting/unmounting, and an ac whose editor
   surface was remounted is stale — swallowing Enter then would eat the
   key with no visible item picked *)
let ac_popup_open () = Popups_state.ac_attached ()

(* keys the open autocomplete consumes — master's auto-complete map
   (enter/up/ctrl+p/down/ctrl+n/shift+enter/mod+enter/escape). Tab is
   deliberately absent: master leaves it bound to :editor/indent while
   the popup is open *)
let ac_owned_key = function
  | "Enter" | "Escape" | "ArrowUp" | "ArrowDown" -> true
  | _ -> false

(* -- line-editing ops (cljs editor/clear-block, kill-line-before,
   forward/backward-word) — pure Edit_model transforms returned to
   the keymap; buffer publishing happens in apply_input -- *)

let is_word_char c =
  (c >= 'a' && c <= 'z')
  || (c >= 'A' && c <= 'Z')
  || (c >= '0' && c <= '9')
  || c = '_' || Char.code c > 127

(* kill from caret back to the start of the visual line *)
let kill_line_before (m : Edit_model.t) =
  let lo, _ = Edit_model.line_bounds m in
  Edit_model.splice m lo m.Edit_model.caret ""

(* kill from caret to the end of the visual line (readline ctrl+k);
   at the line end the kill swallows the line break itself *)
let kill_line_after (m : Edit_model.t) =
  if Edit_model.has_selection m then Edit_model.delete_forward m
  else
    let _, hi = Edit_model.line_bounds m in
    if m.Edit_model.caret < hi then
      Edit_model.splice m m.Edit_model.caret hi ""
    else Edit_model.delete_forward m

(* readline ctrl+t: swap the unit before the caret with the unit
   after; at end of buffer swap the last two *)
let transpose_chars (m : Edit_model.t) =
  if Edit_model.has_selection m then m
  else
    let src = m.Edit_model.source in
    let n = String.length src in
    if n < 2 then m
    else
      let caret = m.Edit_model.caret in
      if caret >= n then
        let p1 = Edit_model.prev_off m.units src n in
        let p0 = Edit_model.prev_off m.units src p1 in
        if p0 = p1 then m
        else
          Edit_model.splice m p0 n
            (String.sub src p1 (n - p1) ^ String.sub src p0 (p1 - p0))
      else if caret > 0 then
        let a = Edit_model.prev_off m.units src caret in
        let b = Edit_model.next_off m.units src caret in
        if b <= caret then m
        else
          Edit_model.splice m a b
            (String.sub src caret (b - caret)
             ^ String.sub src a (caret - a))
      else
        (* buffer start: readline transposes the first pair *)
        let b = Edit_model.next_off m.units src 0 in
        let c = Edit_model.next_off m.units src b in
        if c <= b then m
        else
          Edit_model.splice m 0 c
            (String.sub src b (c - b) ^ String.sub src 0 b)

(* cljs editor/clear-block *)
let clear_block (m : Edit_model.t) =
  Edit_model.splice m 0 (String.length m.Edit_model.source) ""

(* cljs autopair overtype: typing the closer that already sits at the
   caret skips it instead of inserting *)
let autopairs =
  [ "[", "]"; "{", "}"; "(", ")"; "`", "`"; "~", "~"
  ; "*", "*"; "_", "_"; "$", "$"; "^", "^"; "=", "="
  ; "/", "/"; "+", "+" ]

let overtype (m : Edit_model.t) text =
  let pos, _ = A.sel_span_of m in
  if
    text <> "`" && List.exists (fun (_, closer) -> closer = text) autopairs
    && pos < String.length m.Edit_model.source
    && Edit_model.decode_cp m.Edit_model.units m.Edit_model.source
         pos
       = Char.code text.[0]
  then
    let c = pos + 1 in
    Edit_model.select m ~anchor:c ~focus:c
  else m

let delete_pair (m : Edit_model.t) =
  let pos = m.Edit_model.caret and src = m.Edit_model.source in
  if Edit_model.has_selection m || pos = 0 || pos = String.length src then m
  else
    let previous = Edit_model.prev_cp m.units src pos in
    let opener = String.sub src previous (pos - previous) in
    match List.assoc_opt opener ((":", ":") :: autopairs) with
    | Some closer when opener <> "/" && Str_util.starts_at src pos closer ->
        Edit_model.splice m previous (pos + String.length closer) ""
    | _ -> m

(* Follow master's keydown ordering: dollar pairs before overtype;
   formatting markers pair only around nonblank selected text. *)
let insert_autopair (m : Edit_model.t) text =
  let lo, hi = A.sel_span_of m in
  let selected = String.sub m.source lo (hi - lo) in
  let selected_nonblank = String.trim selected <> "" in
  let pair closer =
    let selected = if selected_nonblank then selected else "" in
    let stop = if selected_nonblank then hi else lo in
    let updated = Edit_model.splice m lo stop (text ^ selected ^ closer) in
    Edit_model.select updated ~anchor:(lo + String.length text)
      ~focus:(lo + String.length text + String.length selected)
  in
  if text = "$" && not selected_nonblank then pair "$"
  else
    let skipped = overtype m text in
    if skipped != m then skipped
    else if List.mem text [ "*"; "^"; "_"; "="; "+"; "/" ] && not selected_nonblank
         || Popups_state.ac_open () then Edit_model.insert_text m text
    else
      match List.assoc_opt text autopairs with
      | None -> Edit_model.insert_text m text
      | Some closer ->
          let pos = lo in
          let prev = if pos = 0 then ' ' else m.source.[pos - 1] in
          if text = "(" && not selected_nonblank
             && not (List.mem prev [ ' '; '\n'; ']'; '(' ])
          then Edit_model.insert_text m text
          else if text = "`" && pos < String.length m.source
                  && m.source.[pos] = '`' && prev <> '`' then
            Edit_model.select m ~anchor:(pos + 1) ~focus:(pos + 1)
          else begin
            if text = "(" && prev = '(' && not selected_nonblank then
              Toast.warning (I18n.t "editor/reference-node-use-page-ref");
            pair closer
          end

(* paste clipboard text into the editing block at the caret as a single
   block (cljs editor/paste-text-in-one-block-at-point) *)
let paste_text_at_caret uuid =
  ignore (A.paste_clipboard_text uuid)


(* -- editor-mode keys -- *)

(* Shared key naming keeps recording and command dispatch consistent. *)
let shortcut_key_str = Shortcut_key.normalize
let shortcut_key = Shortcut_key.of_event
let shift_held = Shortcut_key.shift_held

(* route through the hash so the router runs its full pipeline —
   Navigate_to + load_route + history. A bare Navigate_to commit skips
   the fetch (empty Journals/All-pages) and loses the history entry *)
let encode_uri_component = (fun s -> Ui_services.uri_encode_component s)

let nav r =
  let h =
    match r with
    | Model.Home -> "#/"
    | Model.Journals -> "#/all-journals"
    | Model.All_pages -> "#/all-pages"
    | Model.All_graphs -> "#/graphs"
    | Model.Settings -> "#/settings"
    | Model.Import -> "#/import"
    | Model.Bug_report -> "#/bug-report"
    | Model.Bug_report_clipboard -> "#/bug-report-tool/clipboard-data-inspector"
    | Model.Page t -> "#/page/" ^ encode_uri_component t
    | Model.Block_zoom u -> "#/page/" ^ u
    | Model.File p -> "#/file/" ^ encode_uri_component p
    | Model.Library -> "#/page/Library"
    | Model.Not_found _ -> ""
  in
  if h <> "" then (
    Runtime.mark_nav ();
    Ui_services.nav_set_hash (Runtime.nav_hash h);
    (* an identical hash fires no hashchange — still let resolve run so
       the same-route refresh path loads data *)
    Ui_services.dom_dispatch "ls:navigate");
  true

(* cljs shortcut dispatch for chords already bound in commands_data
   (⌘⇧F favorite, ⌥⇧C contents, …): run the shared command table entry
   so palette and keymap stay on one code path *)
let run_cid = Cmdk_state.dispatch_id

(* editor/follow-link: the link construct around the caret — [[title]],
   ((uuid)), [text](url) or a bare http(s):// token *)
let link_at_caret buf pos =
  let n = String.length buf in
  let index_from pat from =
    let pl = String.length pat in
    let rec go i =
      if i + pl > n then -1
      else if String.sub buf i pl = pat then i
      else go (i + 1)
    in
    if from > n then -1 else go (max from 0)
  in
  let rindex pat from =
    let pl = String.length pat in
    let rec go i =
      if i < 0 then -1
      else if String.sub buf i pl = pat then i
      else go (i - 1)
    in
    go (min from (n - pl))
  in
  (* inner text of the nearest open..close pair bracketing the caret *)
  let between openp closep =
    match rindex openp pos with
    | o when o < 0 -> None
    | o -> (
        let c = index_from closep (o + String.length openp) in
        if c >= 0 && pos <= c + String.length closep then
          Some
            (String.trim
               (String.sub buf (o + String.length openp)
                  (c - o - String.length openp)))
        else None)
  in
  match between "[[" "]]" with
  | Some t when t <> "" -> Some (`Page t)
  | _ -> (
      match between "((" "))" with
      | Some u when u <> "" -> Some (`Uuid u)
      | _ -> (
          let md =
            match rindex "[" pos with
            | o when o < 0 -> None
            | o -> (
                let p_open = index_from "](" o in
                if p_open >= 0 && pos <= index_from ")" p_open + 1 then
                  let c = index_from ")" (p_open + 2) in
                  if c >= 0 then
                    Some (String.sub buf (p_open + 2) (c - p_open - 2))
                  else None
                else None)
          in
          match md with
          | Some u when u <> "" -> Some (`Url u)
          | _ -> (
              let is_break c = c = ' ' || c = '\n' || c = '\t' in
              let l = ref pos and r = ref pos in
              while !l > 0 && not (is_break buf.[!l - 1]) do
                decr l
              done;
              while !r < n && not (is_break buf.[!r]) do
                incr r
              done;
              let tok = String.sub buf !l (!r - !l) in
              if
                String.length tok > 8
                && (String.sub tok 0 7 = "http://"
                   || String.sub tok 0 8 = "https://")
              then Some (`Url tok)
              else None)))

let follow_link (m : Edit_model.t) ~sidebar =
  match link_at_caret m.Edit_model.source m.Edit_model.caret with
  | Some (`Page t) ->
      if not sidebar then ignore (nav (Model.Page t))
      (* sidebar open needs the page uuid; the page-by-title worker
         lookup isn't there yet — plain open only *)
  | Some (`Uuid u) ->
      if sidebar then (
        match !Sidebar_state.st_ref with
        | Some sst -> Sidebar_state.open_uuid sst u
        | None -> ())
      else ignore (nav (Model.Block_zoom u))
  | Some (`Url u) -> Ui_services.env_open_url u
  | None -> ()

let perf_keys =
  lazy
    (match Sys.getenv_opt "LOGSEQ_PERF" with Some _ -> true | None -> false)

(* whole buffer is one selection *)
let whole_selected (m : Edit_model.t) =
  let lo, hi = A.sel_span_of m in
  lo = 0 && hi = String.length m.Edit_model.source

(* Match master's normal-text formatting; retain whitespace-only behavior. *)
let wrap_model (m : Edit_model.t) marker =
  let s, e = A.sel_span_of m in
  let ml = String.length marker in
  let selected = String.sub m.Edit_model.source s (e - s) in
  let blank = s <> e && String.trim selected = "" in
  let lo, hi =
    if blank then s, e
    else
      let rec left i =
        if i < e && m.source.[i] = ' ' then left (i + 1) else i in
      let rec right i =
        if i > s && m.source.[i - 1] = ' ' then right (i - 1) else i in
      left s, right e
  in
  let inner = if blank then selected else String.trim selected in
  if not blank && Str_util.starts_at m.source (lo - ml) marker
     && Str_util.starts_at m.source hi marker then
    Edit_model.select (Edit_model.splice m (lo - ml) (hi + ml) inner)
      ~anchor:(lo - ml) ~focus:(hi - ml)
  else
    let updated = Edit_model.splice m lo hi (marker ^ inner ^ marker) in
    let caret = hi + ml in
    Edit_model.select updated
      ~anchor:(if blank then lo + ml else caret) ~focus:caret

(* up/down inside the editing model: alt/meta+shift moves the block, mod
   collapses, boundary arrows leave the buffer *)
let move_block_chord ~shift ~alt ~meta ~ctrl =
  shift && not ctrl
  && if Ui_services.env_is_mac () then meta && not alt else alt && not meta

let edit_arrows ~route ~conduit uuid (kev : Edit_model.key_event)
    (m : Edit_model.t) =
  let up = kev.Edit_model.key = "ArrowUp" in
  if move_block_chord ~shift:kev.shift ~alt:kev.alt ~meta:kev.meta ~ctrl:kev.ctrl then (
    A.move_blocks_up_down ~uuid up;
    m)
  else if kev.meta || kev.ctrl then (
    (* cljs mod+up / mod+down collapse/expand the block's children *)
    A.collapse_expand ~collapse:up ();
    m)
  else if kev.alt && not kev.shift then (
    A.shift_arrow_select up;
    m)
  else if not (kev.shift || kev.alt) && Edit_model.has_selection m then
    let lo, hi = A.sel_span_of m in
    let caret = if up then lo else hi in
    Edit_model.select m ~anchor:caret ~focus:caret
  else
    let first = Edit_model.first_line m in
    let last = Edit_model.last_line m in
    if kev.shift then
      (* shift+arrow on a boundary row crosses into block selection *)
      if (up && first) || ((not up) && last) then (
        (match S.editing () with
         | Some _ -> A.shift_arrow_select up
         | None -> A.extend_selection up);
        m)
      else Edit_input.handle ~route ~conduit m (Edit_input.Key (kev, false))
    else if up && first then (
      A.arrow_nav uuid true;
      m)
    else if (not up) && last then (
      A.arrow_nav uuid false;
      m)
    else Edit_input.handle ~route ~conduit m (Edit_input.Key (kev, false))

(* the Logseq layer of the editing keymap. Returns the model the key
   produces: buffer ops build it with pure Edit_model transforms, ops
   outside the buffer run their side effect and return [m]; keys the
   layer doesn't own fall through to Edit_input.handle *)
let edit_key ~route ~conduit ~repeat uuid (kev : Edit_model.key_event)
    (m : Edit_model.t) =
  let key = kev.Edit_model.key in
  let shift = kev.shift and meta = kev.meta and ctrl = kev.ctrl in
  let defer () =
    Edit_input.handle ~route ~conduit m (Edit_input.Key (kev, repeat))
  in
  if Edit_model.composing m then m
  else if ac_popup_open () && ac_owned_key key then m
  else if key = "Backspace" && meta && not (ctrl || kev.alt)
          && Ui_services.env_is_mac () then
    let intent = if Edit_model.has_selection m then Edit_input.Del_selection
      else Edit_input.Del_line_backward in
    Edit_input.handle ~route ~conduit m (Edit_input.Delete intent)
  else if ctrl && not (meta || kev.alt) && not (Ui_services.env_is_mac ())
          && (key = "Backspace" || key = "Delete") then
    let intent = if key = "Backspace" then Edit_input.Del_word_backward
      else Edit_input.Del_word_forward in
    Edit_input.handle ~route ~conduit m (Edit_input.Delete intent)
  else if (match S.editing () with Some e -> e.S.uuid = uuid && S.is_draft e | None -> false) then
    (match key with
     | "Enter" when shift -> Edit_model.insert_text m "\n"
     | "Enter" -> A.submit_draft uuid; m
     | "Escape" -> route.Edit_input.cancel (); m
     | "Backspace" when not (meta || ctrl || kev.alt) ->
         let paired = delete_pair m in if paired != m then paired else defer ()
     | _ -> match shortcut_key_str key with
       | "b" when (meta || ctrl) && not shift -> wrap_model m "**"
       | "i" when (meta || ctrl) && not shift -> wrap_model m "*"
       | "s" when (meta || ctrl) && shift -> wrap_model m "~~"
       | "h" when (meta || ctrl) && shift -> wrap_model m "=="
       | "v" when (meta || ctrl) && shift -> paste_text_at_caret uuid; m
       | "z" | "y" when meta || ctrl -> m
       | _ -> defer ())
  else
    match key with
    | "Enter" when (meta || ctrl) && not shift ->
        (* cljs editor/cycle-todo — mod+enter never splits *)
        Editor_commands.cycle_todo uuid;
        m
    | "Enter" when shift ->
        if Settings_state.doc_mode_newline () then
          Edit_input.handle ~route ~conduit m (Edit_input.Key ({kev with shift = false}, repeat))
        else Edit_model.insert_text m "\n"
    | "Enter" when Settings_state.doc_mode_newline () -> Edit_model.insert_text m "\n"
    | "Enter" ->
        (if Lazy.force perf_keys then
           Printf.eprintf "PERF kdown-split uuid=%s\n%!" uuid);
        defer () (* keymap -> SplitBlock -> route.split_block *)
    | "Backspace" when not (meta || ctrl || kev.alt) ->
        let paired = delete_pair m in
        if paired != m then paired else defer ()
    | "Tab" | "Escape" | "Backspace" -> defer ()
    | "Delete" when not (shift || meta || ctrl || kev.alt) ->
        let s, e = A.sel_span_of m in
        if s = e && e = String.length m.Edit_model.source then (
          A.merge_next uuid;
          m)
        else defer ()
    | "ArrowUp" | "ArrowDown" -> edit_arrows ~route ~conduit uuid kev m
    | "ArrowLeft" | "ArrowRight"
      when (not shift) && (not meta) && (not ctrl) && (not kev.alt) ->
        let s, e = A.sel_span_of m in
        let len = String.length m.Edit_model.source in
        if kev.key = "ArrowLeft" && s = 0 && e = 0 then (
          A.arrow_edge uuid true;
          m)
        else if kev.key = "ArrowRight" && s = len && e = len then (
          A.arrow_edge uuid false;
          m)
        else defer ()
    | _ -> (
        (* cljs shortcut tables key on the unshifted key plus modifier
           flags — same normalization the DOM path used *)
        match shortcut_key_str key with
        (* macOS readline edit commands precede the generic mod bindings.
           Movement aliases are normalized before visual-line measurement. *)
        | "k" when ctrl && not meta && Ui_services.env_is_mac () ->
            kill_line_after m
        | "d" when ctrl && not meta && Ui_services.env_is_mac () ->
            Edit_model.delete_forward m
        | "h" when ctrl && not meta && Ui_services.env_is_mac () ->
            Edit_model.delete_backward m
        | "t" when ctrl && not meta && Ui_services.env_is_mac () ->
            transpose_chars m
        (* ctrl edit keys — before the mod cases: mods ⊃ ctrl *)
        | "l" when ctrl && not meta -> clear_block m
        | "u" when ctrl && not meta -> kill_line_before m
        | "w" when ctrl && not meta -> Edit_model.delete_word_backward m
        | "b" when ctrl && shift ->
            Edit_model.move m Edit_model.Word_left ~extend:false
        | "f" when ctrl && shift ->
            Edit_model.move m Edit_model.Word_right ~extend:false
        | "n" when ctrl && not meta ->
            A.arrow_nav uuid false;
            m
        | "p" when ctrl && not meta ->
            A.arrow_nav uuid true;
            m
        | "z" when meta || ctrl ->
            (if shift then A.redo () else A.undo ());
            m
        | "y" when meta || ctrl ->
            A.redo ();
            m
        | "a" when (meta || ctrl) && not shift ->
            (* cljs editor/select-parent — only when the whole buffer is
               selected does mod+a leave editing for the block *)
            if whole_selected m then (
              A.exit_edit ~select:true;
              m)
            else defer () (* keymap mod+a -> Select_all *)
        | "b" when (meta || ctrl) && not shift -> wrap_model m "**"
        | "i" when (meta || ctrl) && not shift -> wrap_model m "*"
        | "s" when (meta || ctrl) && shift -> wrap_model m "~~"
        | "h" when (meta || ctrl) && shift -> wrap_model m "=="
        | ";" when (meta || ctrl) && not shift ->
            A.toggle_children_collapse ();
            m
        | "," when (meta || ctrl) && not shift ->
            A.zoom_out ();
            m
        | "e" when meta && shift ->
            (* editor/copy-embed *)
            Ui_services.clipboard_copy
              (Printf.sprintf "{{embed ((%s))}}" uuid);
            m
        | "e" when meta ->
            A.quick_add ();
            m
        | "p" when (meta || ctrl) && not shift ->
            (* cljs :editor/add-property mod+p — the new-property dialog
               on the editing block *)
            Popups_state.emit_cmd "add-property"
              [ "block", Json.String uuid ];
            m
        | "." when meta ->
            (* editor/zoom-in: meta+. and meta+shift+. both zoom *)
            A.zoom_to uuid;
            m
        | "a" when meta && shift ->
            A.select_all ();
            m
        | "a" when meta ->
            A.select_parent ();
            m
        | "o" when meta || ctrl ->
            follow_link m ~sidebar:shift;
            m
        | "l" when meta && not shift ->
            (* cljs editor/insert-link *)
            Editor_commands.open_link_form false uuid m.Edit_model.caret;
            m
        | "c" when (meta || ctrl) && shift ->
            (* cljs editor/copy-text — the block's text to clipboard *)
            Ui_services.clipboard_copy m.Edit_model.source;
            m
        | "v" when (meta || ctrl) && shift ->
            (* cljs editor/paste-text-in-one-block-at-point *)
            paste_text_at_caret uuid;
            m
        | _ -> defer ())

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

(* cljs/mousetrap "mod" is Cmd on macOS and Ctrl elsewhere: off macOS
   a held Ctrl and a binding's "ctrl" both fold onto "mod", so
   mod+shift+p (command palette), mod+shift+k, ... fire on Linux and
   Windows *)
let fold_ctrl_to_mod ms =
  if Ui_services.env_is_mac () then ms
  else List.sort_uniq compare (List.map (function "ctrl" -> "mod" | m -> m) ms)

let canonical_binding b =
  match List.rev (String.split_on_char '+' b) with
  | key :: ms ->
      String.concat "+" (List.sort compare (fold_ctrl_to_mod ms) @ [ key ])
  | [] -> b

(* (binding stroke sequence, command id) — one row per binding *)
let chord_table () =
    Keymap_data.current_items () |> Keymap_data.unique_rows
    |> List.concat_map
       (fun (row : Keymap_data.row) ->
          let cid = Keymap_data.command_id row.title in
          match Keymap_data.handler row, Keymap_data.effective_shortcut cid with
          | ("auto-complete" | "pdf"), _ -> []
          | _, Commands_data.Binds bs ->
              List.map
                (fun b ->
                   ( List.map canonical_binding (String.split_on_char ' ' b)
                   , cid ))
                bs
          | _ -> [])

let cached_chords = ref (-1, [])

let current_chords () =
  let revision, table = !cached_chords in
  if revision = Keymap_data.revision () then (table, false)
  else begin
    let table = chord_table () in
    cached_chords := (Keymap_data.revision (), table);
    (table, true)
  end

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
  match ev_key ev with
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
        (if shift_held ev then [ "shift" ] else [])
        @ (if ev.Ui_services.alt then [ "alt" ] else [])
        @ (if ev.Ui_services.ctrl then [ "ctrl" ] else [])
        @ (if ev.Ui_services.meta then [ "mod" ] else [])
      in
      Some (String.concat "+" (List.sort compare (fold_ctrl_to_mod ms) @ [ key ]))

(* gate per cljs category: editor/* ids are owned by the per-mode key
   paths (on_editor_key / on_normal_key) — the chord layer only needs
   them when a sequence crosses into chords those paths can't see;
   while editing, non-editor commands still fire (global-prevent-default)
   except the non-editing-only set *)
let chord_may_run ~target ~control editing cid =
  if editing && (cid = "editor/copy" || cid = "editor/cut") then false
  else if cid = "editor/select-parent" then
    not control
    && (match S.editing () with
    | Some e ->
        not (S.is_draft e)
        && not (is_editable_target target && closest ".editor-wrapper" target = None)
    | None -> not editing)
  else
  match Keymap_data.command_handler cid with
  | Some "block-editing-only" -> not control && Option.is_some (S.editing ())
  | Some "global-non-editing-only" -> not editing
  | Some "editor-global" ->
      (not control || not (String.starts_with ~prefix:"editor/" cid))
      && (not editing || Option.is_some (S.editing ()))
  | Some handler -> Keymap_data.global_handler handler
  | None -> false

let palette_open () =
  match !Cmdk_state.latest_st with
  | Some st -> (Cmdk_state.get st).Cmdk_state.open_
  | None -> false

let on_global_key ev =
  if ev.Ui_services.default_prevented || input_composing ev
     || closest ".pswp" ev.Ui_services.target <> None
     || control_owned_key ev
  then chord_seq := []
  (* the open cmdk palette owns every key *)
  else if not (ac_popup_open ()) then
    match stroke_of ev with
    | None -> ()
    | Some stroke ->
        begin
          let tbl, changed = current_chords () in
          if changed then chord_seq := [];
          let now = Ui_services.time_now () in
          let seq =
            if now -. !chord_ms > chord_window_ms then [] else !chord_seq
          in
          let cand = seq @ [ stroke ] in
          let editing =
            is_editable_target (ev.Ui_services.target)
            || S.editing () <> None
          in
          let control = non_editor_control_target ev.Ui_services.target in
          let tbl = List.filter (fun (_, cid) -> chord_may_run ~target:ev.Ui_services.target ~control editing cid) tbl in
          let tbl = if palette_open () then
              List.filter (fun (_, cid) -> cid = "go/search" || cid = "command-palette/toggle") tbl
            else tbl in
          let dispatch cid =
            let yield_to_editor =
              match cid, S.editing () with
              | "editor/select-parent", Some e -> not (whole_selected e.S.model)
              | _ -> false
            in
            if not yield_to_editor
               && chord_may_run ~target:ev.Ui_services.target ~control editing cid then begin
              ev.Ui_services.prevent_default ();
              ev.Ui_services.stop_immediate ();
              if cid = "go/search" && palette_open () then
                Option.iter Cmdk_state.close !Cmdk_state.latest_st
              else if cid = "editor/select-parent" then
                (match S.editing () with
                 | Some _ -> A.exit_edit ~select:true
                 | None -> A.select_parent ())
              else Cmdk_state.dispatch_id cid
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

let blocked_default ~control ev =
  if control || input_composing ev || ac_popup_open () then false
  else match stroke_of ev with
  | None -> false
  | Some stroke ->
      let editing = is_editable_target ev.Ui_services.target || Option.is_some (S.editing ()) in
      Keymap_data.current_items () |> Keymap_data.unique_rows
      |> List.exists (fun row ->
          let cid = Keymap_data.command_id row.Keymap_data.title in
          let contains = function
            | Commands_data.Binds bindings ->
                List.exists (fun binding ->
                    List.map canonical_binding (String.split_on_char ' ' binding) = [stroke]) bindings
            | _ -> false
          in
          chord_may_run ~target:ev.Ui_services.target ~control editing cid
          && contains (Keymap_data.default_shortcut cid)
          && not (contains (Keymap_data.effective_shortcut cid)))

let on_normal_key ev =
  let key = ev_key ev in
  let shift = shift_held ev
  and alt = ev.Ui_services.alt
  and meta = ev.Ui_services.meta in
  let selected () = S.selection_active () in
  let move = move_block_chord ~shift ~alt ~meta ~ctrl:ev.Ui_services.ctrl in
  match key with
  | "p" when meta && not shift && selected () ->
      (* cljs :editor/add-property mod+p — the new-property dialog on the
         first selected block *)
      ev.Ui_services.prevent_default ();
      (match A.selected_uuids () with
       | u :: _ ->
           Popups_state.emit_cmd "add-property"
             [ "block", Json.String u ]
       | [] -> ())
  | "Backspace" | "Delete" when selected () ->
      ev.Ui_services.prevent_default ();
      A.delete_selection ()
  | " " when ev.Ui_services.ctrl && selected () ->
      (* cljs ctrl+space = add-comment on the selection *)
      ev.Ui_services.prevent_default ();
      Popups_state.emit_cmd "add-comment" []
  | "ArrowUp" when alt && not shift ->
      (* editor/select-block-up *)
      ev.Ui_services.prevent_default ();
      A.extend_selection true
  | "ArrowDown" when alt && not shift ->
      (* editor/select-block-down *)
      ev.Ui_services.prevent_default ();
      A.extend_selection false
  | "ArrowUp" when move ->
      ev.Ui_services.prevent_default ();
      A.move_blocks_up_down true
  | "ArrowDown" when move ->
      ev.Ui_services.prevent_default ();
      A.move_blocks_up_down false
  | "ArrowUp" when mods ev && not shift ->
      (* cljs mod+up collapses one level / the selection *)
      ev.Ui_services.prevent_default ();
      A.collapse_expand ~collapse:true ()
  | "ArrowDown" when mods ev && not shift ->
      (* cljs mod+down expands one level / the selection *)
      ev.Ui_services.prevent_default ();
      A.collapse_expand ~collapse:false ()
  | "ArrowUp" when shift ->
      ev.Ui_services.prevent_default ();
      A.extend_selection true
  | "ArrowDown" when shift ->
      ev.Ui_services.prevent_default ();
      A.extend_selection false
  | "ArrowUp" when selected () ->
      ev.Ui_services.prevent_default ();
      A.move_selection_focus true
  | "ArrowDown" when selected () ->
      ev.Ui_services.prevent_default ();
      A.move_selection_focus false
  | "Tab" when selected () ->
      ev.Ui_services.prevent_default ();
      A.indent_or_outdent ~indent:(not shift)
  | "Enter" when mods ev ->
      ev.Ui_services.prevent_default ();
      List.iter Editor_commands.cycle_todo (A.selected_uuids ())
  | "Enter" when shift && selected () ->
      (* cljs shift+enter = open-selected-blocks-in-sidebar *)
      ev.Ui_services.prevent_default ();
      List.iter
        (fun u ->
          Ui_services.dom_dispatch_json "ls:open-right-sidebar"
            (Json.Object [ "uuid", Json.String u ]))
        (A.selected_uuids ())
  | "Enter" when not shift -> (
      match closest ".block-add-button" (ev.Ui_services.target) with
      | Some _ -> ()
      | None -> (
          if selected () then (
              ev.Ui_services.prevent_default ();
              A.open_selected_block ~at_end:true ())))
  | "Escape" ->
      (* cljs: first Escape closes the action-bar popover, the next one
         clears the selection *)
      if S.ready () && (S.value ()).S.action_bar then A.hide_action_bar ()
      else A.clear_selection ()
  | "?" ->
      (* cljs shift+/ (:ui/toggle-help, global-non-editing-only) toggles
         the help menu popup *)
      ev.Ui_services.prevent_default ();
      Runtime.send Action.Help_toggle
  | _ -> (
      match shortcut_key ev with
      | "a" when mods ev && shift ->
          (* cljs mod+shift+a = select-all-blocks *)
          ev.Ui_services.prevent_default ();
          A.select_all ()
      | "a" when mods ev ->
          (* cljs mod+a = select-parent *)
          ev.Ui_services.prevent_default ();
          A.select_parent ()
      | ";" when mods ev && not shift ->
          ev.Ui_services.prevent_default ();
          A.toggle_children_collapse ()
      | "," when mods ev && not shift ->
          (* the keymap gives mod+, to ui/toggle-settings outside editing
             (editor/zoom-out's mod+, is block-editing-only) — toggles the
             settings dialog like the cmdk dispatch *)
          ev.Ui_services.prevent_default ();
          if Dialogs_state.is_open "settings" then
            Dialogs_state.close_named "settings"
          else Dialogs_state.open_ "settings"
      | "z" when mods ev ->
          ev.Ui_services.prevent_default ();
          if shift then A.redo () else A.undo ()
      | "y" when mods ev ->
          ev.Ui_services.prevent_default ();
          A.redo ()
      | "e" when mods ev ->
          (* cljs mod+e quick-add also fires outside edit mode *)
          ev.Ui_services.prevent_default ();
          A.quick_add ()
      | "c" when ev.Ui_services.meta ->
          (* editor/copy and copy-text share the text-copy path *)
          ev.Ui_services.prevent_default ();
          run_cid "editor/copy"
      | "x" when ev.Ui_services.meta && not shift ->
          ev.Ui_services.prevent_default ();
          run_cid "editor/cut"
      | _ -> ())

(* a key whose target is this block's conduit input — the sink's own
   listener emits the Edit_input event on the same keydown, so the
   document-level dispatch must leave it alone *)
let targets_block_editor uuid target =
  match target with
  | Some el -> (
      match closest ".ed-input" (Some el) with
      | Some inp -> inp.Ui_services.attr "data-block-id" = Some uuid
      | None -> false)
  | None -> false

(* the conduit input of a different block — a stale sink from the
   previous editing surface can still be mounted while its replacement
   is being built; keystrokes into it would write the wrong block *)
let is_other_block_editor uuid target =
  match target with
  | Some el -> (
      match closest ".ed-input" (Some el) with
      | Some inp -> (
          match inp.Ui_services.attr "data-block-id" with
          | Some u -> u <> uuid
          | None -> false)
      | None -> false)
  | _ -> false

(* Only operations on the already mounted buffer may bypass an optimistic
   split commit. Cross-block navigation, history and other structure edits
   retain their ordered replay path. *)
let local_input_during_split uuid ev =
  match S.editing () with
  | Some e when e.S.uuid = uuid ->
      let m = e.S.model in
      let lo, hi = A.sel_span_of m in
      let len = String.length m.Edit_model.source in
      (match ev with
       | Edit_input.Insert _ | Edit_input.Delete _ | Edit_input.Composition _
       | Edit_input.Pointer _ | Edit_input.Dblclick _ -> true
       | Edit_input.Key (k, _) ->
           (match k.Edit_model.key with
            | "Enter" -> not (k.meta || k.ctrl) && not (ac_popup_open ())
                         && (k.shift || A.can_split_optimistically uuid)
            | "Home" | "End" -> true
            | "Backspace" -> lo > 0 || hi > lo
            | "Delete" -> hi < len || hi > lo
            | "ArrowLeft" -> lo > 0 || hi > lo || k.shift || k.meta || k.ctrl || k.alt
            | "ArrowRight" -> hi < len || hi > lo || k.shift || k.meta || k.ctrl || k.alt
            | "a" when k.meta || k.ctrl -> not (whole_selected m)
            | "b" | "i" when (k.meta || k.ctrl) && not k.shift -> true
            | key -> String.length key = 1 && not (k.meta || k.ctrl || k.alt))
       | Edit_input.Focus | Edit_input.Blur | Edit_input.Menu _ -> false)
  | _ -> false

(* native conduits answer caret-rect/offset-at asynchronously — a
   vertical arrow on a cold cache fires the request and no-ops, so one
   keypress moves nothing (web conduit replies synchronously). Re-fire
   the same event until the caret moves, bounded: a hop needs at most
   two reply round-trips (caret_rect, then offset_at). Aborts on a newer
   input, a caret change, block switch, or exhaustion — mine_ms tracks
   this retry chain's own note_input stamps so a real keystroke wins *)
let rec retry_vertical uuid scope epoch ev armed_caret mine_ms attempts =
  if attempts > 0 then
    ignore
      (Ui_services.timers_timeout
         (fun () ->
           match S.editing () with
           | Some e2
          when e2.S.uuid = uuid
               && e2.S.scope = scope && e2.S.epoch == epoch
               && !S.last_edit_input_ms <= mine_ms
               && e2.S.model.Edit_model.caret = armed_caret ->
            apply_input uuid ev;
            retry_vertical uuid scope epoch ev armed_caret !S.last_edit_input_ms
              (attempts - 1)
        | _ -> ())
         16)

(* every Edit_input event for the open block editor lands here: the
   Logseq keymap owns the commands first, Edit_input handles the rest,
   and buffer changes schedule the debounced save plus popup matching *)
and apply_input ?frame uuid ev =
  let ev =
    match ev with
    | Edit_input.Key (({ Edit_model.key = "ArrowLeft" | "ArrowRight"
                       ; ctrl = true; meta = false; alt = false; _ } as key), repeat)
      when not (Ui_services.env_is_mac ()) ->
        Edit_input.Key ({key with ctrl = false; alt = true}, repeat)
    | Edit_input.Key (key, repeat)
      when key.Edit_model.ctrl && not (key.meta || key.alt)
           && Ui_services.env_is_mac () ->
        let navigation = match String.lowercase_ascii key.key with
          | "a" -> Some "Home" | "e" -> Some "End"
          | "b" when not key.shift -> Some "ArrowLeft"
          | "f" when not key.shift -> Some "ArrowRight"
          | "p" -> Some "ArrowUp" | "n" -> Some "ArrowDown"
          | _ -> None in
        (match navigation with
         | Some navigation -> Edit_input.Key ({key with key = navigation; ctrl = false}, repeat)
         | None -> ev)
    | _ -> ev
  in
  (* Popup-owned keys must yield before the structure queue. Replaying
     Enter after autocomplete has closed would split the block even
     though that physical key already chose a command. *)
  if (match ev with
      | Edit_input.Key (key, _) -> ac_popup_open () && ac_owned_key key.Edit_model.key
      | _ -> false)
  then ()
  else
  if (match S.editing () with
      | Some e when S.is_draft e -> e.S.uuid <> uuid
          || (match e.S.owner with S.Explicit_draft owner -> not owner#current | _ -> false)
      | _ -> false) then ()
  else
  (* Retarget a retired sink before enqueueing a shadow. Otherwise the
     same event could leave two shadows when it re-enters on the live UUID. *)
  let uuid, frame = match S.editing (), ev with
    | Some e, (Edit_input.Insert _ | Edit_input.Composition _
              | Edit_input.Delete _ | Edit_input.Key _) when e.S.uuid <> uuid ->
        e.S.uuid, !S.active_frame
    | _ -> uuid, frame in
  match ev, S.editing () with
  | Edit_input.Key ({ Edit_model.key = "Escape"; _ }, _), Some editing
    when not (S.is_draft editing)
         && A.initial_click_pending uuid && !S.pending_focus_actions = [] ->
      A.flush_edit ();
      if not editing.S.submit_on_enter then A.select_single_in ~scope:editing.S.scope uuid;
      S.notify_edit_exit uuid
  | _ ->
  let real_input = match ev with
    | Edit_input.Insert _ | Edit_input.Composition _ | Edit_input.Delete _
    | Edit_input.Key _ -> true
    | _ -> false
  in
  if real_input
     && (A.initial_click_pending uuid
         || (!S.pending_focus_actions <> [] && not !A.drain_gate)) then begin
    let context = Runtime.repo (), Runtime.route () in
    let before = S.editing () in
    S.pending_focus_actions :=
      (fun () ->
        match S.editing () with
        | Some current when context = (Runtime.repo (), Runtime.route ())
                            && S.replay_current before (Some current) ->
            apply_input ?frame:!S.active_frame current.S.uuid ev
        | _ -> Ui_services.log_error "queued editor input cancelled after its editing context ended")
      :: !S.pending_focus_actions;
    Runtime.flush ()
  end else begin
  (* Blur remains immediate; cancel composition again after older queued
     composition updates, which have not reached the model yet. *)
  (match ev, frame, !S.active_frame with
   | Edit_input.Blur, Some current, Some active when current == active -> A.note_focus_blur uuid
   | Edit_input.Blur, None, _ -> A.note_focus_blur uuid
   | _ -> ());
  (match ev with
   | Edit_input.Blur when A.initial_click_pending uuid && !S.pending_focus_actions <> [] ->
       let before = S.editing () in
       S.pending_focus_actions :=
         (fun () -> match S.editing () with
          | Some current when S.replay_current before (Some current) ->
              A.update_model current.S.uuid Edit_model.composition_cancel
          | Some _ -> ()
          | None -> ())
         :: !S.pending_focus_actions
   | _ -> ());
  let caret_frame = match frame with Some _ -> frame | None -> !S.active_frame in
  Option.iter
    (fun frame -> Edit_view.notify_caret_input uuid (Signal.value frame) ev)
    caret_frame;
  let local = !S.structure_pending && !S.optimistic_split_ready
              && !S.pending_edit_real = 0
              && local_input_during_split uuid ev in
  let context = Runtime.repo (), Runtime.route () in
  let before = S.editing () in
  let enqueue ~real f =
    let queued_at = Ui_services.time_now () in
    let kind = match ev with
      | Edit_input.Key (key, _) -> "key-" ^ key.Edit_model.key
      | Edit_input.Insert _ -> "insert"
      | Edit_input.Pointer _ -> "pointer"
      | Edit_input.Dblclick _ -> "double-click"
      | Edit_input.Delete _ -> "delete"
      | Edit_input.Composition _ -> "composition"
      | Edit_input.Menu _ -> "menu"
      | Edit_input.Focus -> "focus"
      | Edit_input.Blur -> "blur" in
    if real then
      Ui_services.perf_mark (Printf.sprintf "editor:queued kind=%s block=%s depth=%d"
        kind uuid (!S.pending_edit_real + 1));
    S.enqueue_edit_action ~real (fun () ->
        if real then
          Ui_services.perf_mark (Printf.sprintf "editor:replay kind=%s block=%s wait=%.1fms"
            kind uuid (Ui_services.time_now () -. queued_at));
        if context = (Runtime.repo (), Runtime.route ()) then
          match S.editing () with
          | Some e when S.replay_current before (Some e) -> f e
          | Some _ -> ()
          | None -> ())
  in
  (* Optimistic splits own their recovery log. Other in-flight edits
     retain the epoch shadow, which replays only onto a restored session. *)
  let must_wait ev =
    if local then false else
    match ev with
    | Edit_input.Focus | Edit_input.Blur -> false
    | (Edit_input.Insert _ | Edit_input.Composition _
      | Edit_input.Pointer _ | Edit_input.Dblclick _) as ev' -> (
        match S.editing () with
        | Some e when !S.pending_edit_real = 0 ->
            let epoch = e.S.epoch in
            enqueue ~real:false (fun e2 ->
                if not (e2.S.epoch == epoch) then
                  apply_input ?frame:!S.active_frame e2.S.uuid ev');
            false
        | _ -> true)
    | _ -> true
  in
  if !S.structure_pending && must_wait ev
  then enqueue ~real:true (fun e -> apply_input ?frame:!S.active_frame e.S.uuid ev)
  else match S.editing () with
  | Some e when e.S.uuid = uuid -> (
      if local then (
        incr S.optimistic_input_seq;
        let context = Runtime.repo (), Runtime.route () in
        let before = S.editing () in
        let replay () =
          if context = (Runtime.repo (), Runtime.route ()) then
            match S.editing () with
            | Some current when S.replay_current before (Some current) ->
                apply_input ?frame:!S.active_frame current.S.uuid ev
            | Some _ -> ()
            | None -> () in
        S.optimistic_input_replay := (!S.optimistic_input_seq, replay) :: !S.optimistic_input_replay);
      (* Focus/Blur/Menu are lifecycle emits, not input — counting them
         makes last_edit_input_ms jump past every request_focus arm, so
         the stale-caret gate in apply_focus would never let the stored
         (or click-hit-tested) caret land *)
      (match ev with
       | Edit_input.Focus | Edit_input.Blur | Edit_input.Menu _ -> ()
       | _ -> S.note_input ());
      let route = A.route_of uuid in
      let conduit = A.conduit_of uuid in
      (* Visual-line hit testing is needed for line navigation/deletion, not for
         every inserted character. On web it reads the already rendered
         surface; the host paints the caret after the content flush. *)
      let m0 =
        match ev with
        | Edit_input.Key ({ Edit_model.key = "ArrowUp" | "ArrowDown" | "Home" | "End"; _ }, _)
          when not (Edit_model.composing e.S.model) ->
            A.refresh_lines e.S.model conduit
        | Edit_input.Key ({ Edit_model.key = "Backspace"; meta = true; _ }, _)
          when Ui_services.env_is_mac () && not (Edit_model.composing e.S.model) ->
            A.refresh_lines e.S.model conduit
        | _ -> e.S.model
      in
      let m' =
        match ev with
        | Edit_input.Key (kev, repeat) ->
            edit_key ~route ~conduit ~repeat uuid kev m0
        | Edit_input.Insert text -> insert_autopair m0 text
        | Edit_input.Blur when S.is_draft e && Edit_model.composing m0 -> m0
        | Edit_input.Delete Edit_input.Del_backward ->
            let paired = delete_pair m0 in
            if paired != m0 then paired else Edit_input.handle ~route ~conduit m0 ev
        | _ -> Edit_input.handle ~route ~conduit m0 ev
      in
      (* A caret-only move can measure the unchanged runs before flushing.
         Publish model and overlay together instead of two DOM batches. *)
      (match frame with
       | Some fr when Ui_services.env_edit_units () = `U16 && m'.source == m0.source
                      && Edit_view.reveal_dirty m0 m' = []
                      && (match S.editing () with
                          | Some current -> current.S.epoch == e.S.epoch && current.S.scope = e.S.scope
                          | None -> false) ->
           if A.refresh_overlay ~frame:fr ~model:m' ~flush:false uuid then
             S.premeasured_model := Some m'
       | _ -> ());
      (* Compare against the session model before line measurement;
         refresh_lines may have derived m0 without publishing it. A structural op that settled mid-dispatch (e.g. merge_next on a
         synchronously-drained native promise) already wrote a newer
         model — republishing m' here would push the stale buffer back
         over the committed merge *)
      A.update_model uuid (fun m_cur -> if m_cur == e.S.model then m' else m_cur);
      (match ev with
       | Edit_input.Blur when S.is_draft e ->
           A.schedule_blur_commit ~keep:(fun () ->
             let target = Ui_services.dom_active_element () in
             A.draft_contains_target target
             || Option.fold ~none:false ~some:Popups_state.inside target) ()
       | _ -> ());
      (match ev with
       | Edit_input.Key
           ({ Edit_model.key = "ArrowUp" | "ArrowDown"; meta = false
            ; ctrl = false; alt = false; _ }, _)
         when Ui_services.env_edit_units () = `Bytes && m'.Edit_model.caret = m0.Edit_model.caret
              && m'.Edit_model.anchor = m0.Edit_model.anchor
              && not (S.selection_active ()) ->
           retry_vertical uuid e.S.scope e.S.epoch ev m0.Edit_model.caret
             !S.last_edit_input_ms 6
       | _ -> ());
      if m'.Edit_model.source <> m0.source then begin
        if not (S.is_draft e) then Outliner_ops.schedule_save uuid m'.Edit_model.source;
        Popups_state.on_model_input ~deleted:
          (match ev with Edit_input.Delete _ | Edit_input.Key ({key = "Backspace"; _}, _) -> true | _ -> false)
          uuid
      end;
      match frame with
      | Some fr when Ui_services.env_edit_units () = `Bytes -> (
          (* State publication schedules a flush. Apply the content and
             run spans before reading geometry, then paint the overlay
             in this same input task. *)
          Runtime.flush_now ();
          let conduit' = A.conduit_of uuid in
          let m2 = A.refresh_lines m' conduit' in
          if m2 != m' then
            (* apply only the measured line ranges onto the CURRENT
               model — the flush above can re-enter (focus landing ->
               set_caret) and publish a newer model; a wholesale
               `fun _ -> m2` would resurrect this event's stale caret *)
            A.update_model uuid (fun m ->
                Edit_model.set_lines m m2.Edit_model.lines);
          ignore (A.refresh_overlay ~frame:fr ~flush:false uuid);
          Runtime.flush_now ();
          (* a measure taken mid-layout/remount can come back with no
             caret rect — iOS taps reorder focus/scroll work around the
             event — leaving the caret invisible until the next input.
             keep re-measuring until the overlay paints (same recovery
             apply_focus uses) *)
          let f =
            match (Signal.state_pending fr) with
            | Some v -> v
            | None -> Signal.get_state fr
          in
          if Option.is_none f.Edit_input.caret then begin
            let rec retry_caret n =
              if n > 0 then
                ignore
                  (Ui_services.timers_timeout
                     (fun () ->
                       match S.editing () with
                    | Some current when current.S.uuid = uuid
                                        && current.S.scope = e.S.scope
                                        && current.S.epoch == e.S.epoch ->
                        if not (A.refresh_overlay uuid) then
                          retry_caret (n - 1)
                    | _ -> ())
                     40)
            in
            retry_caret 12
          end)
      | _ -> ())
  | _ -> ()
  end

let () = S.surface_input := fun frame uuid input -> apply_input ~frame uuid input

(* translate a DOM keydown into the Edit_input event the conduit would
   have emitted for it *)
let dispatch_command cid =
  let update f = match S.editing () with
    | Some editing ->
        let before = editing.S.model in
        A.update_model editing.S.uuid f;
        (match S.editing () with
         | Some current when current.S.uuid = editing.S.uuid
              && current.S.model.Edit_model.source <> before.Edit_model.source ->
             Outliner_ops.schedule_save current.S.uuid current.S.model.Edit_model.source;
             Popups_state.on_model_input ~deleted:false current.S.uuid
         | _ -> ())
    | None -> ()
  in
  let input key = Option.iter (fun editing ->
      apply_input ?frame:!S.active_frame editing.S.uuid
        (Edit_input.Key (Edit_model.key_ev key, false))) (S.editing ())
  in
  match S.editing (), cid with
  | _, "editor/copy-page-url" ->
      Page_ops.copy_url (Option.bind !Runtime.current_page (fun page -> page.Model.page_uuid))
  | editing, "editor/jump" ->
      let selected = A.selected_uuids () in
      let target = match selected with
        | uuid :: _ -> Some uuid
        | [] -> Option.map (fun editing -> editing.S.uuid) editing in
      let expand = match editing with
        | Some editing -> Some (editing.S.uuid, editing.S.scope)
        | None -> Option.map (fun uuid -> uuid, "main") target in
      let start () =
        let positions = Hashtbl.create 64 in
        List.iteri (fun index block -> Option.iter
            (fun uuid -> Hashtbl.replace positions uuid index) block.Model.block_uuid)
          (S.flat_visible ());
        Jump_state.start ~uuid:target
          ~rank:(fun uuid -> Option.value (Hashtbl.find_opt positions uuid) ~default:max_int)
          ~clear_selection:(fun () -> A.clear_selection ()) () in
      (match expand with
       | Some (uuid, scope) when Option.fold ~none:false
           ~some:(S.effective_collapsed ~scope) (S.find_in (S.blocks_in_scope scope) uuid) ->
           A.set_collapsed ~scope uuid false;
           Ui_services.timers_later ~ms:100 start
       | _ -> start ())
  | editing, ("editor/select-up" | "editor/select-down") ->
      let up = cid = "editor/select-up" in
      (match editing with
       | Some editing ->
           apply_input ?frame:!S.active_frame editing.S.uuid
             (Edit_input.Key
                (Edit_model.key_ev ~shift:true
                   (if up then "ArrowUp" else "ArrowDown"), false))
       | None -> A.extend_selection up)
  | _, ("editor/select-block-up" | "editor/select-block-down") ->
      A.shift_arrow_select (cid = "editor/select-block-up")
  | Some editing, ("editor/up" | "editor/down" | "editor/left" | "editor/right") ->
      let key = match cid with
        | "editor/up" -> "ArrowUp" | "editor/down" -> "ArrowDown"
        | "editor/left" -> "ArrowLeft" | _ -> "ArrowRight"
      in
      apply_input ?frame:!S.active_frame editing.S.uuid
        (Edit_input.Key (Edit_model.key_ev key, false))
  | Some editing, "editor/insert-link" ->
      Editor_commands.open_link_form false editing.S.uuid editing.S.model.Edit_model.caret
  | Some editing, ("editor/follow-link" | "editor/open-link-in-sidebar") ->
      follow_link editing.S.model ~sidebar:(cid = "editor/open-link-in-sidebar")
  | Some editing, "editor/zoom-in" -> A.zoom_to editing.S.uuid
  | _, "editor/zoom-out" -> A.zoom_out ()
  | Some editing, "editor/copy-embed" ->
      Ui_services.clipboard_copy (Printf.sprintf "{{embed ((%s))}}" editing.S.uuid)
  | Some editing, "editor/paste-text-in-one-block-at-point" -> paste_text_at_caret editing.S.uuid
  | _, "editor/new-block" -> input "Enter"
  | _, "editor/backspace" -> input "Backspace"
  | _, "editor/delete" -> input "Delete"
  | Some _, "editor/escape-editing" -> A.exit_edit ~select:true
  | _, "editor/new-line" ->
      Option.iter (fun editing ->
          apply_input ?frame:!S.active_frame editing.S.uuid
            (Edit_input.Key ({(Edit_model.key_ev "Enter") with shift = true}, false))) (S.editing ())
  | _, "editor/bold" -> update (fun model -> wrap_model model "**")
  | _, "editor/italics" -> update (fun model -> wrap_model model "*")
  | _, "editor/strike-through" -> update (fun model -> wrap_model model "~~")
  | _, "editor/highlight" -> update (fun model -> wrap_model model "==")
  | _, "editor/clear-block" -> update clear_block
  | _, "editor/kill-line-before" -> update kill_line_before
  | _, "editor/kill-line-after" -> update kill_line_after
  | _, "editor/backward-kill-word" -> update Edit_model.delete_word_backward
  | _, "editor/forward-kill-word" -> update Edit_model.delete_word_forward
  | _, "editor/backward-word" ->
      update (fun model -> Edit_model.move model Edit_model.Word_left ~extend:false)
  | _, "editor/forward-word" ->
      update (fun model -> Edit_model.move model Edit_model.Word_right ~extend:false)
  | _, "editor/beginning-of-block" ->
      update (fun model -> Edit_model.move model Edit_model.Doc_start ~extend:false)
  | _, "editor/end-of-block" ->
      update (fun model -> Edit_model.move model Edit_model.Doc_end ~extend:false)
  | None, ("editor/up" | "editor/down") ->
      A.move_selection_focus (cid = "editor/up")
  | None, ("editor/left" | "editor/right") ->
      A.open_selected_block ~at_end:(cid = "editor/right") ()
  | _ -> ()

let pending_event ev : Edit_input.event option =
  let kev =
    { Edit_model.key = ev_key ev
    ; shift = shift_held ev
    ; alt = ev.Ui_services.alt
    ; meta = ev.Ui_services.meta
    ; ctrl = ev.Ui_services.ctrl
    }
  in
  match kev.key with
  | key
    when String.length key = 1
         && (not (ev.Ui_services.composing))
         && not (mods ev || ev.Ui_services.alt) ->
      (* `key` is a DOM-style name — on native hosts it's the physical
         (unshifted) key, while key_char carries the real glyph; without
         it a Shift-typed char lands lowercase during the remount gap *)
      Some (Edit_input.Insert
              (Option.value ev.Ui_services.key_char ~default:key))
  | _ -> Some (Edit_input.Key (kev, ev.Ui_services.repeat))

(* a structure op (split/merge/…) remounts the editing sink only after
   its apply+refresh resolves; keystrokes arriving in that window still
   target the previous block's mounted input (or <body>) even though
   editing state says we're mid-edit. cljs flushes the DOM
   synchronously so it never sees this window — run the key through the
   model directly; the surface repaints when the sink remounts *)
let on_pending_focus_key ev e =
  ev.Ui_services.prevent_default ();
  ev.Ui_services.stop_propagation ();
  (match pending_event ev with
   | Some ev' -> apply_input e.S.uuid ev'
   | None -> ());
  (* run ops this key queued right away — same-task readers (a second
     nav, the racing replay) must see their effect *)
  A.drain_pending_focus_actions ()

(* .block-content blockid under the latest primary mousedown + when it
   landed + the editing uuid that mousedown replaced. The click that
   runs enter_edit dispatches asynchronously, so a key typed in that gap
   falls to on_normal_key and dies — on the web the click handler
   enters edit synchronously first. Keys that outrun the pending edit
   replay into the landed block instead. *)
let last_block_mousedown : (string * float * string) ref = ref ("", 0.0, "")

let racing_edit_uuid () =
  let (u, t, stale) = !last_block_mousedown in
  (* the gap stays open only until the mousedown's own enter_edit
     resolves: while the replaced record (or no record) is still the
     editing one, keys belong to the incoming block. Once editing
     lands on a third uuid — e.g. Enter split the clicked block — the
     mousedown's intent is spent and queueing for it drops keys. *)
  let e = S.editing_uuid () in
  let gap_open =
    (stale <> "" && e = Some stale)
    || (stale = "" && e = None)
    || e = Some u
  in
  if u <> "" && gap_open && Ui_services.time_now () -. t < 5000.0
  then Some u
  else None

(* replay [ev] through the remount-window handler once the mousedown's
   own enter_edit lands. A specific-uuid replay waits for that uuid;
   the add-button wildcard ("*") waits for an edit on ANY block other
   than the one the mousedown blurred — replaying into the dying record
   would write keystrokes over a block the user never opened. A record
   that never seeded its buffer (title_for_edit still pending) shows
   base=buffer="" while the model holds a title — replaying into it
   would commit the bare key over the block's real text, so drop the
   key instead. The queued action re-queues itself while the click is
   still racing so an unrelated drain can't drop it; a click that
   never enters edit lets the window expire and the key is dropped
   like a normal-mode shortcut miss. *)
let queue_racing_key ev uuid =
  ev.Ui_services.stop_propagation ();
  let (_, _, stale) = !last_block_mousedown in
  let replay e =
    if
      e.S.base = "" && e.S.buffer = ""
      && String.trim (A.display_title e.S.uuid) <> ""
    then () (* unseeded record — dropping beats corrupting the title *)
    else on_pending_focus_key ev e
  in
  let rec action () =
    match S.editing () with
    | Some e when e.S.uuid = uuid -> replay e
    | Some e when uuid = "*" && e.S.uuid <> stale -> replay e
    | _ ->
        if Option.is_some (racing_edit_uuid ()) then
          S.pending_focus_actions := action :: !S.pending_focus_actions
  in
  S.pending_focus_actions := action :: !S.pending_focus_actions

(* Native gestures use the host's hit-tested document targets, not DOM
   sensors. Web keeps Block_dnd's dnd-kit owner. A release commits once;
   its follow-up click is consumed without replaying the bullet action. *)
module Drag = Block_drag

let drag_state = ref Drag.empty
let drag_scope = ref "main"

let drag_context () = Runtime.repo (), Runtime.route ()

let publish_drag () =
  if S.ready () then begin
    let next = Option.map (fun (source, target) ->
      match target with
      | Some (target, zone) -> source, target, Drag.zone_name zone
      | None -> source, "", "") (Drag.preview !drag_state) in
    if next <> S.drag () then S.set_drag next
  end

let drag_cancel () =
  drag_state := Drag.cancel !drag_state;
  publish_drag ()

let drag_reset () =
  drag_state := Drag.empty;
  publish_drag ()

let arm_drag (ev : Ui_services.ev) =
  match closest ".bullet-container" ev.Ui_services.target with
  | Some el -> (
      match el.Ui_services.attr "data-blockid" with
      | Some u when S.find u <> None ->
          drag_scope := A.scope_of_el el;
          drag_state := Drag.arm ~context:(drag_context ()) ~source:u
            ~x:ev.Ui_services.x ~y:ev.Ui_services.y
      | _ -> ())
  | None -> ()

let native_drag_target ev src =
  if readonly_block_target ev.Ui_services.target then None
  else
    match closest ".ls-block" (ev.Ui_services.target) with
    | Some el -> (
        match el.Ui_services.attr "data-blockid" with
        | Some t when A.can_drop_dragged_block src t ->
            let left, top, width, height = el.Ui_services.rect () in
            if el.Ui_services.rect_pending () || width <= 0. || height <= 0.
            then None
            else
              let first =
                match S.find_parent t with
                | Some (_, idx) -> idx = 0
                | None -> false
              in
              Some (t, Drag.zone ~first ~left ~top
                ~x:ev.Ui_services.x ~y:ev.Ui_services.y)
        | _ -> None)
    | None -> None

let native_drag_ready () =
  S.ready () && not (Ui_services.env_publishing ())
  && Option.fold ~none:false ~some:(fun uuid -> S.find uuid <> None)
       (Drag.source !drag_state)

let on_native_pointermove ev =
  if not (native_drag_ready ()) || ev.Ui_services.buttons land 1 = 0 then
    drag_cancel ()
  else
    match Drag.source !drag_state with
    | None -> ()
    | Some source ->
        let was_active = Drag.preview !drag_state <> None in
        drag_state := Drag.move ~context:(drag_context ())
          ~x:ev.Ui_services.x ~y:ev.Ui_services.y
          ~target:(native_drag_target ev source) !drag_state;
        if not was_active && Drag.preview !drag_state <> None then
          A.begin_block_drag ~scope:!drag_scope source;
        publish_drag ()

let on_native_pointerup ev =
  if ev.Ui_services.button = 0 then
    if not (native_drag_ready ()) then drag_cancel ()
    else
      match Drag.source !drag_state with
      | None -> ()
      | Some source ->
          let next, drop = Drag.release ~context:(drag_context ())
            ~target:(native_drag_target ev source) !drag_state in
          drag_state := next;
          publish_drag ();
          Option.iter (fun (source, target, zone) ->
            A.drop_dragged_block source target (Drag.zone_name zone)) drop

let consume_drag_click () =
  let next, suppress = Drag.consume_click !drag_state in
  drag_state := next;
  publish_drag ();
  suppress

let on_keydown ev =
  if Ui_services.env_native_drag () && ev_key ev = "Escape" then drag_cancel ();
  let control = non_editor_control_target ev.Ui_services.target in
  if blocked_default ~control ev then begin
    ev.Ui_services.prevent_default ();
    ev.Ui_services.stop_immediate ()
  end else
  let palette_shortcut =
    mods ev && not ev.Ui_services.alt
    && (match String.lowercase_ascii (ev_key ev) with
        | "k" -> not ev.Ui_services.shift
        | "m" -> ev.Ui_services.shift
        | _ -> false)
  in
  if input_composing ev || Ui_services.env_publishing () || palette_open ()
     || palette_shortcut
     || closest ".pswp" ev.Ui_services.target <> None
     || closest ".ls-comment-box, .ls-comment-reply-placeholder" ev.Ui_services.target <> None
     || (match ev.Ui_services.target with
         | Some target -> Popups_state.inside target
         | None -> false)
  then ()
  else begin
  (if Lazy.force perf_keys then
     Printf.eprintf "PERF kdown key=%s editing=%s ac=%b\n%!" (ev_key ev)
       (match S.editing () with Some e -> e.S.uuid | None -> "-")
       (ac_popup_open ()));
  if S.ready () then begin
    (* During a focus handoff, the pending-editor route would stop
       propagation before autocomplete's document listener sees Enter. *)
    if ac_popup_open () && ac_owned_key (ev_key ev) then ()
    else if Editor_commands.popup_key ~key:(ev_key ev)
         ~inside:(fun () ->
           closest "#date-time-picker" ev.Ui_services.target <> None)
         ~prevent_default:ev.Ui_services.prevent_default
    then
      (if Lazy.force perf_keys then
         Printf.eprintf "PERF kdown-ate popup_key key=%s\n%!" (ev_key ev))
    else if control then ()
    else
      let target = ev.Ui_services.target in
      (* CodeMirror surfaces (fenced-code editor, query source editor)
         own their keys — Esc/arrows/Tab go through the editor's own
         listeners, never the block-editor dispatch. On the native host
         no inner .CodeMirror div exists, so the emitted .code-editor
         wrap around the mount is the guard ancestor instead. *)
      match closest ".CodeMirror, .code-editor" target with
      | Some _ -> ()
      | None -> (
          (* property value textareas own their key handling
             (properties_value.ml) — the block-editor dispatch below must
             leave their keys alone *)
          match closest ".property-value-container" target with
          | Some _ when closest ".ed-input" target = None -> ()
          | _ -> (
          match (S.editing (), !S.pending_focus) with
          | Some e, Some request
            when e.S.uuid = request.S.focus_uuid
                 && not (targets_block_editor request.S.focus_uuid target) -> (
              match (ev_key ev, racing_edit_uuid ()) with
              | key, Some u
                when u <> e.S.uuid
                     && (String.length key = 1 || key = "Enter"
                         || key = "Backspace" || key = "Tab")
                     && (not (ev.Ui_services.composing))
                     && not (mods ev || ev.Ui_services.alt) ->
                  (* a click on a different block is mid-dispatch: the
                     press belongs to the block being entered, not the
                     one still marked editing *)
                  ev.Ui_services.prevent_default ();
                  queue_racing_key ev u
              | _ -> on_pending_focus_key ev e)
          | Some e, _
            when (not (targets_block_editor e.S.uuid target))
                 && (is_other_block_editor e.S.uuid target
                    || not (is_editable_target target)) -> (
              match (ev_key ev, racing_edit_uuid ()) with
              | key, Some u
                when u <> e.S.uuid
                     && (String.length key = 1 || key = "Enter"
                         || key = "Backspace" || key = "Tab")
                     && (not (ev.Ui_services.composing))
                     && not (mods ev || ev.Ui_services.alt) ->
                  (* a click on a different block is mid-dispatch: the
                     press belongs to the block being entered, not the
                     one still marked editing *)
                  ev.Ui_services.prevent_default ();
                  queue_racing_key ev u
              | _ ->
                  (* pending_focus was consumed on a node the following
                     refresh replaced (or focus otherwise failed to
                     land): editing still says mid-edit but the press
                     arrived at <body>. Re-arm pending focus on the
                     editing block and route the key through the
                     remount-window handler. *)
                  A.request_focus e.S.uuid (A.caret_of e.S.uuid);
                  on_pending_focus_key ev e)
          | _ -> (
          match S.editing_uuid () with
          | Some uuid when targets_block_editor uuid target ->
              (* the sink's own listener emits the conduit event for
                 this key — nothing to do at document level *)
              ()
          | Some uuid when mods ev || ev.Ui_services.alt -> (
              (* the window-level keyMonitor forwards editing-mode chords
                 with no target (AppKit never maps mod+. etc. to a
                 doCommandBy selector, so the sink's own emit path never
                 sees them). While a block is being edited they still
                 belong to the editor — run the editing keymap on the
                 model. Modifier chords only: an unbound plain key whose
                 target is not this block's conduit belongs to the global
                 keymap, not the editing buffer — otherwise every browse
                 keystroke ("g h", "t l", ...) writes into whatever block
                 still has editing state. *)
              match pending_event ev with
              | Some ev' -> apply_input uuid ev'
              | None -> ())
          | Some _ -> ()
          | None ->
              (* a stale conduit input that was unmounted by the previous
                 key (e.g. Shift+Arrow exiting edit mode) can still
                 receive the follow-up keydown before focus moves; route
                 it through the normal handler so selection-extension
                 keys aren't swallowed *)
              let stale_block_editor =
                match target with
                | Some el ->
                    Option.is_some
                      (closest ".ed-input" (Some el))
                    && Option.is_some
                         (closest ".ls-block" target)
                    && closest ".ls-page-title" target = None
                | _ -> false
              in
              if stale_block_editor then on_normal_key ev
              else if is_editable_target target then ()
              else
                (match (ev_key ev, racing_edit_uuid ()) with
                | key, Some u
                  when (String.length key = 1 || key = "Enter"
                          || key = "Backspace" || key = "Tab")
                       && (not (ev.Ui_services.composing))
                       && not (mods ev || ev.Ui_services.alt) ->
                    ev.Ui_services.prevent_default ();
                    queue_racing_key ev u
                | _ -> on_normal_key ev))))
  end

(* -- clipboard events -- *)

  end

let on_paste ev =
  if Paste_capture.dispatch ev then () else
  if Ui_services.env_publishing () then () else begin
  if S.ready () then
    let editor_target =
      match S.editing (), closest ".ed-input" ev.Ui_services.target with
      | Some e, Some input -> input.Ui_services.attr "data-block-id" = Some e.S.uuid
      | _ -> false
    in
    if editor_target && ev.Ui_services.has_files then begin
      ev.Ui_services.prevent_default ();
      ev.Ui_services.stop_immediate ();
      A.upload_file_snapshots ev.Ui_services.files
    end else if editor_target || not (is_editable_target ev.Ui_services.target) then
      let clipboard = !(S.clipboard), !(S.clipboard_text) in
      if !S.structure_pending then (
        let text = ev.Ui_services.clipboard_get "text/plain"
        and html = ev.Ui_services.clipboard_get "text/html" in
        ev.Ui_services.prevent_default ();
        ev.Ui_services.stop_immediate ();
        let saved = { ev with Ui_services.clipboard_get =
            (function "text/plain" -> text | "text/html" -> html | _ -> "") } in
        let context = Runtime.repo (), Runtime.route () in
        let before = S.editing () in
        S.enqueue_edit_action ~real:true (fun () ->
            if context = (Runtime.repo (), Runtime.route ())
               && S.replay_current before (S.editing ()) then
              A.paste_blocks ~clipboard saved))
      else A.paste_blocks ~clipboard ev

(* a clipboard event aimed at the open editor's conduit input *)
  end

let editing_clipboard_target uuid target =
  match target with
  | Some el -> (
      match closest ".ed-input" (Some el) with
      | Some inp -> inp.Ui_services.attr "data-block-id" = Some uuid
      | None -> false)
  | None -> false

(* copy/cut whose real DOM Range sits on the rendered .ed-r runs — the
   event targets the selection's container inside .block-editor rather
   than the conduit input; only one editing surface exists at a time *)
let editing_block_target target =
  match target with
  | Some el -> Option.is_some (closest ".block-editor" (Some el))
  | None -> false

let on_copy ev =
  if S.ready () then
    match S.editing () with
    | Some e
      when editing_clipboard_target e.S.uuid (ev.Ui_services.target)
           || editing_block_target (ev.Ui_services.target) -> (
        (* cljs copy-current-block-ref: a collapsed selection inside an
           editing block copies [[uuid]]; a non-collapsed selection
           copies the selected buffer text — the source slice, not the
           browser's DOM serialization (which would leak .ed-pad ZWSPs
           and pill display labels) *)
        let lo, hi = A.sel_span e.S.uuid in
        ev.Ui_services.clipboard_set "text/plain"
          (if lo = hi then "[[" ^ e.S.uuid ^ "]]"
           else String.sub e.S.buffer lo (hi - lo));
        ev.Ui_services.prevent_default ())
    | Some _ -> ()
    | None -> if not (is_editable_target ev.Ui_services.target) then A.copy_selection ev

let on_cut ev =
  if Ui_services.env_publishing () then () else begin
  if S.ready () then
    match S.editing () with
    | Some e
      when editing_clipboard_target e.S.uuid (ev.Ui_services.target)
           || editing_block_target (ev.Ui_services.target) -> (
        let lo, hi = A.sel_span e.S.uuid in
        ev.Ui_services.prevent_default ();
        if lo <> hi then (
          ignore (A.cut_editing_text e.S.uuid)))
    | Some _ -> ()
    | None -> if not (is_editable_target ev.Ui_services.target) then A.cut_selection ev

  end

let on_click ev =
  if consume_drag_click () then begin
    ev.Ui_services.prevent_default ();
    ev.Ui_services.stop_immediate ()
  end
  else begin
    drag_reset ();
    (* armed-but-unmoved pointer down = a plain click *)
    (* a block-range drag ends with a click on the anchor row — the
       gesture already produced a selection, the click must not open
       the anchor's editor *)
    if Block_selection.consume_suppress () then ev.Ui_services.stop_immediate ()
    else begin
      let target = ev.Ui_services.target in
      match closest ".block-add-button" target with
  | Some _ -> ()
  | None ->
      if S.ready () then
        (
        match closest ".block-control" target with
        | Some el -> (
            ev.Ui_services.prevent_default ();
            match uuid_of_prefixed "control-" (el.Ui_services.id ()) with
            | Some u ->
                A.exit_edit ~select:false;
                A.toggle_collapse ~scope:(A.scope_of_el el) u
            | None -> ())
        | None -> (
            match closest ".block-children-left-border" target with
            | Some el -> (
                match el.Ui_services.attr "data-blockid" with
                | Some u ->
                    A.toggle_collapse ~scope:(A.scope_of_el el) u
                | None -> ())
            | None -> (
                match closest ".bullet-container" target with
                | Some el -> (
                    match uuid_of_prefixed "dot-" (el.Ui_services.id ()) with
                    | Some u ->
                        (* the wrapping a.bullet-link-wrap's default
                           hash navigation would push a second history
                           entry, leaving history.back() stuck on the
                           zoom route *)
                        ev.Ui_services.prevent_default ();
                        if ev.Ui_services.shift then
                          (* cljs bullet-on-click shiftKey: opens the
                             block in the right sidebar *)
                          Ui_services.dom_dispatch_json "ls:open-right-sidebar"
                            (Json.Object [ "uuid", Json.String u ])
                        else A.zoom_to u
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
                      closest
                        "button, a, input, audio, video, details, summary, \
                         sup.fn, [contenteditable=true], .cloze, \
                         .cloze-revealed, .query-table, .image-resize, \
                         .view-action-type, .ui-fenced-code-editor, \
                         .block-editor, .prefix-link, .asset-container, \
                         .ls-comment-row, [data-pressable]"
                        target
                    with
                    | Some _ -> ()
                    | None when readonly_block_target target -> ()
                    | None -> (
                        match closest ".ls-comments-label" target with
                        | Some el -> (
                            match el.Ui_services.attr "data-area-uuid" with
                            | Some u ->
                                (* edit-comments-area-title! *)
                                A.enter_edit u
                                  (String.length (A.model_title u))
                            | None -> ())
                        | None -> (
                            match closest ".ls-comment-submit" target with
                            | Some el -> (
                                match el.Ui_services.attr "data-area-uuid" with
                                | Some u -> Comments_ops.submit u
                                | None -> ())
                            | None -> (
                                match
                                  closest ".ls-comment-delete" target
                                with
                                | Some el -> (
                                    match
                                      el.Ui_services.attr "data-comment-uuid"
                                    with
                                    | Some u -> Comments_ops.delete u
                                    | None -> ())
                                | None -> (
                                    match
                                      closest "a.page-ref" target
                                    with
                                    | Some _ ->
                                        (* page-ref navigation happens in the
                                           document-level listener; the editor
                                           only has to not enter edit *)
                                        ()
                                    | None -> (
                                        match
                                          closest ".block-content"
                                            target
                                        with
                                        | Some _
                                          when closest
                                                 ".ls-page-title" target
                                               <> None ->
                                            (* the page title's own click
                                               handler starts Title_edit *)
                                            ()
                                        | Some el -> (
                                            match
                                              el.Ui_services.attr "data-blockid"
                                            with
                                            | Some u ->
                                                (* scope by container: the
                                                   same block can render in
                                                   main and the sidebar; only
                                                   the tree where the click
                                                   landed mounts the editor *)
                                                let scope = A.scope_of_el el in
                                                A.enter_edit ~scope u
                                                  (String.length
                                                     (A.model_title u))
                                            | None -> ())
                                        | None -> (
                                            (* web parity: .block-content
                                               carries style width:100% so
                                               it spans the row's content
                                               band — native hosts keep the
                                               div's intrinsic width and
                                               clicks in the row's trailing
                                               space miss it. The same band
                                               on every host is
                                               .block-main-container (the
                                               controls/bullets inside it are
                                               matched above), so fall back
                                               to the enclosing .ls-block's
                                               blockid *)
                                            match
                                              closest
                                                ".block-main-container"
                                                target
                                            with
                                            | None -> ()
                                            | Some _ -> (
                                                match
                                                  closest ".ls-block"
                                                    target
                                                with
                                                | None -> ()
                                                | Some el -> (
                                                    match
                                                      el.Ui_services.attr
                                                        "data-blockid"
                                                    with
                                                    | Some u ->
                                                        let scope = A.scope_of_el el in
                                                        A.enter_edit ~scope
                                                          u
                                                          (String.length
                                                             (A.model_title
                                                                u))
                                                    | None ->
                                                        ()))))))))))))
    end
  end

(* -- ls:editor-insert channel (autocomplete pick: replace the typed
   trigger range with the chosen text) -- *)

let detail_num ev name =
  Option.bind (ev.Ui_services.detail name) float_of_string_opt

let on_editor_insert ev =
  if S.ready () then
    match S.editing () with
    | Some e -> (
        match
          ( ev.Ui_services.detail "text"
          , detail_num ev "from"
          , detail_num ev "to" )
        with
        | Some text, Some from, Some to_ ->
            let n = String.length e.S.buffer in
            let f = Int.max 0 (Int.min (int_of_float from) n) in
            let t = Int.max f (Int.min (int_of_float to_) n) in
            let back =
              Option.value
                (Option.map int_of_float (detail_num ev "back"))
                ~default:0
            in
            let caret = f + String.length text - back in
            A.update_model e.S.uuid (fun m ->
                Edit_model.select
                  (Edit_model.splice m f t text)
                  ~anchor:caret ~focus:caret);
            Outliner_ops.schedule_save e.S.uuid
              (A.live_buffer e.S.uuid);
            (* cljs node-embed pick: insert then clear-edit! *)
            (match
               ev.Ui_services.detail "exit"
             with
             | Some "true" -> A.exit_edit ~select:false
             | _ -> ())
        | _ -> ())
    | None -> ()

(* -- ls:editor-command channel is owned by editor_commands.ml -- *)
(* clicking outside the editor commits the buffer; clicks inside the
   autocomplete/context-menu popups keep editing — the apply action
   refocuses the sink input (cljs keeps the block in edit mode) *)
let on_mousedown (ev : Ui_services.ev) =
  if Ui_services.env_publishing () then () else begin
  (* A new press also clears an unconsumed click from a canceled drag. *)
  drag_reset ();
  let readonly = readonly_block_target ev.Ui_services.target in
  if Ui_services.env_native_drag () && S.ready () && not readonly
     && ev.Ui_services.button = 0 && ev.Ui_services.buttons land 1 <> 0
  then arm_drag ev;
  if S.ready () then begin
    (* record which block's content the pointer went down on — including
       outside any block (clears the record) — and the editing uuid the
       mousedown is about to replace, so wildcard replays never write
       into that dying record. Mirrors the interactive exclusions
       on_click applies before enter_edit. *)
    let stale =
      match S.editing () with Some e -> e.S.uuid | None -> ""
    in
    let now = Ui_services.time_now () in
    last_block_mousedown :=
      (if readonly then ("", now, stale) else match
         closest
           "button, a, input, audio, video, details, summary, \
            sup.fn, [contenteditable=true], .cloze, \
            .cloze-revealed, .query-table, .image-resize, \
            .view-action-type, .ui-fenced-code-editor, \
            .asset-container, .ls-comment-row"
           ev.Ui_services.target
       with
       | Some _ -> ("", now, stale)
       | None -> (
           match closest ".block-content" ev.Ui_services.target with
           | Some el ->
               ( Option.value (el.Ui_services.attr "data-blockid")
                   ~default:""
               , now, stale )
           | None -> (
               (* the add-block row appends a block then enters edit —
                  its uuid doesn't exist yet, so record a wildcard that
                  replays into the next edit landing *)
               match
                   closest ".block-add-button" ev.Ui_services.target
               with
               | Some _ -> ("*", now, stale)
               | None -> (
                   (* row padding lands inside .ls-block but outside
                      .block-content — the block it belongs to is still
                      the edit the click is about to start *)
                   match closest ".ls-block" ev.Ui_services.target with
                   | Some el ->
                       ( Option.value
                           (uuid_of_prefixed "ls-block-"
                              (el.Ui_services.id ()))
                           ~default:""
                       , now, stale )
                   | None -> ("", now, stale)))));
    (match !last_block_mousedown with
     | u, _, stale when u <> "" && u <> "*"
                        && (u <> stale || closest ".editor-wrapper" ev.Ui_services.target = None) ->
         S.click_point :=
           Some (u, now, ev.Ui_services.x, ev.Ui_services.y)
     | _ -> S.click_point := None);
    if S.editing () <> None then
    match
      closest ".editor-wrapper, .ui-fenced-code-editor"
        ev.Ui_services.target
    with
    | Some _ -> ()
    | None -> (
        match ev.Ui_services.target with
        | Some el when Popups_state.inside el -> ()
        | _ ->
            if Editor_commands.click_guard () then ()
            else if not (A.draft_contains_target ev.Ui_services.target) then
              A.schedule_blur_commit ())
  end

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

  end

let on_dragstart ev =
  if Ui_services.env_publishing () then () else begin
  match closest ".bullet-container" (ev.Ui_services.target) with
  | Some _ ->
      ev.Ui_services.prevent_default ();
      ev.Ui_services.stop_immediate ()
  | None -> ()

  end

let on_file_dragover (ev : Ui_services.ev) =
  if ev.Ui_services.has_files then ev.Ui_services.prevent_default ()

let installed = State_cell.Once.make ()

let install_once () =
  State_cell.Once.run installed (fun () ->
    Ui_services.dom_on_document_event ~capture:true "keydown" on_global_key;
    Ui_services.dom_on_document_event ~capture:true "keydown" on_keydown;
    Ui_services.dom_on_document_event ~capture:true "paste" on_paste;
    Ui_services.dom_on_document_event ~capture:true "copy" on_copy;
    Ui_services.dom_on_document_event ~capture:true "cut" on_cut;
    Ui_services.dom_on_document_event ~capture:true "click" on_click;
    Ui_services.dom_on_document_event ~capture:true "mousedown"
      on_mousedown;
    if Ui_services.env_native_drag () then begin
      Ui_services.dom_on_document_event ~capture:true "pointermove"
        on_native_pointermove;
      Ui_services.dom_on_document_event ~capture:true "pointerup"
        on_native_pointerup;
      Ui_services.dom_on_document_event ~capture:true "pointercancel"
        (fun _ -> drag_cancel ());
      Ui_services.dom_on_document_event ~capture:true "blur"
        (fun _ -> drag_cancel ());
      Ui_services.dom_on_window_event "blur" (fun _ -> drag_cancel ())
    end;
    Ui_services.dom_on_document_event ~capture:true "ls:editor-insert"
      on_editor_insert;
    Ui_services.dom_on_document_event ~capture:true "dragstart" on_dragstart;
    Ui_services.dom_on_document_event ~capture:true "dragover"
      on_file_dragover;
    (* the file-drop listener is web-only (native drops arrive through
       platform_event "file-drop") — js_app installs it *)
    Block_dnd.install ();
    (* pointer-driven range selection (cljs block/selection.cljs) *)
    Ui_services.dom_on_document_event ~capture:true "pointerdown"
      (fun ev ->
        if
          not (Ui_services.env_publishing ()) && S.ready ()
          (* capture-phase listener fires before the CM wrapper's
             stopPropagation — fenced-code clicks must not start a
             block range selection (cljs clears selection instead) *)
          && closest ".ui-fenced-code-editor" (ev.Ui_services.target)
             = None
        then Block_selection.pointerdown ev);
    Ui_services.dom_on_document_event ~capture:true "pointermove"
      (fun ev -> if not (Ui_services.env_publishing ()) && S.ready () then Block_selection.pointermove ev);
    Ui_services.dom_on_document_event ~capture:true "pointerup"
      (fun _ev -> Block_selection.pointerup ()))
