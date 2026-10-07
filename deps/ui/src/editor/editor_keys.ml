(* Document-level event handling for the outliner. LUI's dom-event channel
   cannot preventDefault and lacks caret/selection info, so the full key
   contract lives here in capture phase; dispatch is by event target:
   inside .editor-wrapper -> editing mode, else normal (block-select) mode. *)

module S = Editor_state
module D = Web_dom
module A = Editor_actions

let ( let* ) p f = Js.Promise.then_ f p

let mods ev = D.ev_ctrl ev || D.ev_meta ev

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

(* cljs editor/clear-block *)
let clear_block (m : Edit_model.t) =
  Edit_model.splice m 0 (String.length m.Edit_model.source) ""

(* cljs autopair overtype: typing the closer that already sits at the
   caret skips it instead of inserting *)
let overtype (m : Edit_model.t) text =
  if
    (text = "]" || text = ")")
    && m.Edit_model.anchor = None
    && m.Edit_model.caret < String.length m.Edit_model.source
    && Edit_model.decode_cp m.Edit_model.units m.Edit_model.source
         m.Edit_model.caret
       = Char.code text.[0]
  then
    let c = m.Edit_model.caret + 1 in
    Edit_model.select m ~anchor:c ~focus:c
  else m

(* paste clipboard text into the editing block at the caret as a single
   block (cljs editor/paste-text-in-one-block-at-point) *)
let paste_text_at_caret uuid =
  ignore
    (let* text = Platform.clipboard_read_text () in
     (match A.edit_model uuid with
      | Some m ->
          let lo, hi = A.sel_span_of m in
          A.splice_range uuid lo hi text;
          Outliner_ops.schedule_save uuid (A.live_buffer uuid)
      | None -> ());
     Js.Promise.resolve ())


(* -- editor-mode keys -- *)

(* cljs shortcut tables key on the unshifted key plus modifier flags; DOM
   `key` already applies Shift ("Z", ">"), so letter/symbol shortcuts must
   be normalized back before matching *)
let shortcut_key_str key =
  match String.lowercase_ascii key with
  | ">" -> "." | "<" -> "," | "?" -> "/" | ":" -> ";" | "\"" -> "'"
  | "~" -> "`" | "{" -> "[" | "}" -> "]" | "|" -> "\\" | "_" -> "-"
  | "+" -> "=" | "!" -> "1" | "@" -> "2" | "#" -> "3" | "$" -> "4"
  | "%" -> "5" | "^" -> "6" | "&" -> "7" | "*" -> "8" | "(" -> "9"
  | ")" -> "0" | k -> k

let shortcut_key ev = shortcut_key_str (D.ev_key ev)

(* route through the hash so the router runs its full pipeline —
   Navigate_to + load_route + history. A bare Navigate_to commit skips
   the fetch (empty Journals/All-pages) and loses the history entry *)
let encode_uri_component = Platform.encode_uri_component

let nav r =
  let h =
    match r with
    | Model.Home -> "#/"
    | Model.Journals -> "#/all-journals"
    | Model.All_pages -> "#/all-pages"
    | Model.All_graphs -> "#/graphs"
    | Model.Graph_view -> "#/graph"
    | Model.Settings -> "#/settings"
    | Model.Import -> "#/import"
    | Model.Page t -> "#/page/" ^ encode_uri_component t
    | Model.Block_zoom u -> "#/block/" ^ u
    | Model.Library -> "#/page/Library"
    | Model.Not_found _ -> ""
  in
  if h <> "" then (
    Runtime.mark_nav ();
    Platform.set_location_hash (Runtime.nav_hash h);
    (* an identical hash fires no hashchange — still let resolve run so
       the same-route refresh path loads data *)
    Web_dom.dispatch_custom "ls:navigate" Js.Json.null);
  true

(* cljs shortcut dispatch for chords already bound in commands_data
   (⌘⇧F favorite, ⌥⇧C contents, …): run the shared command table entry
   so palette and keymap stay on one code path *)
let run_cid cid =
  match Cmdk_state.shortcut_action cid with
  | Some f -> f ()
  | None -> ()

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
  | Some (`Url u) -> Platform.open_url u
  | None -> ()

let perf_keys =
  lazy
    (match Sys.getenv_opt "LOGSEQ_PERF" with Some _ -> true | None -> false)

(* whole buffer is one selection *)
let whole_selected (m : Edit_model.t) =
  m.Edit_model.source <> ""
  && m.Edit_model.anchor = Some 0
  && m.Edit_model.caret = String.length m.Edit_model.source

(* wrap the model's selection with a markdown marker pair *)
let wrap_model (m : Edit_model.t) marker =
  let s, e = A.sel_span_of m in
  let ml = String.length marker in
  let inner = String.sub m.Edit_model.source s (e - s) in
  Edit_model.select
    (Edit_model.splice m s e (marker ^ inner ^ marker))
    ~anchor:(s + ml) ~focus:(e + ml)

(* up/down inside the editing model: alt/meta+shift moves the block, mod
   collapses, boundary arrows leave the buffer *)
let edit_arrows ~route ~conduit uuid (kev : Edit_model.key_event)
    (m : Edit_model.t) =
  let up = kev.Edit_model.key = "ArrowUp" in
  if (kev.alt || kev.meta) && kev.shift then (
    ignore
      (Outliner_ops.apply_and_refresh
         [ Outliner_ops.move_up_down [ uuid ] up ]);
    m)
  else if kev.meta || kev.ctrl then (
    (* cljs mod+up / mod+down collapse/expand the block's children *)
    A.collapse_expand ~collapse:up ();
    m)
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
  if ac_popup_open () && ac_owned_key key then m
  else
    match key with
    | "Enter" when (meta || ctrl) && not shift ->
        (* cljs editor/cycle-todo — mod+enter never splits *)
        Editor_commands.cycle_todo uuid;
        m
    | "Enter" when shift -> Edit_model.insert_text m "\n"
    | "Enter" ->
        (if Lazy.force perf_keys then
           Printf.eprintf "PERF kdown-split uuid=%s\n%!" uuid);
        defer () (* keymap -> SplitBlock -> route.split_block *)
    | "Tab" | "Escape" | "Backspace" -> defer ()
    | "Delete" ->
        let s, e = A.sel_span_of m in
        if s = e && e = String.length m.Edit_model.source then (
          A.merge_next uuid;
          m)
        else defer ()
    | "ArrowUp" | "ArrowDown" -> edit_arrows ~route ~conduit uuid kev m
    | _ -> (
        (* cljs shortcut tables key on the unshifted key plus modifier
           flags — same normalization the DOM path used *)
        match shortcut_key_str key with
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
            Platform.copy_to_clipboard
              (Printf.sprintf "{{embed ((%s))}}" uuid);
            m
        | "e" when meta ->
            A.quick_add ();
            m
        | "p" when (meta || ctrl) && not shift ->
            (* cljs :editor/add-property mod+p — the new-property dialog
               on the editing block *)
            Popups_state.emit_cmd "add-property"
              [ "block", Js.Json.string uuid ];
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
            Platform.copy_to_clipboard m.Edit_model.source;
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
              D.ev_prevent_default ev;
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
  | "p" when meta && not shift && selected () ->
      (* cljs :editor/add-property mod+p — the new-property dialog on the
         first selected block *)
      D.ev_prevent_default ev;
      (match A.selected_uuids () with
       | u :: _ ->
           Popups_state.emit_cmd "add-property"
             [ "block", Js.Json.string u ]
       | [] -> ())
  | "Backspace" | "Delete" when selected () ->
      D.ev_prevent_default ev;
      A.delete_selection ()
  | " " when D.ev_ctrl ev && selected () ->
      (* cljs ctrl+space = add-comment on the selection *)
      D.ev_prevent_default ev;
      List.iter
        (fun u ->
          Popups_state.emit_cmd "add-comment"
            [ "block", Js.Json.string u ])
        (A.selected_uuids ())
  | "ArrowUp" when alt && not shift ->
      (* editor/select-block-up *)
      D.ev_prevent_default ev;
      A.move_selection_focus true
  | "ArrowDown" when alt && not shift ->
      (* editor/select-block-down *)
      D.ev_prevent_default ev;
      A.move_selection_focus false  | "ArrowUp" when (meta || alt) && shift ->
      D.ev_prevent_default ev;
      A.move_blocks_up_down true
  | "ArrowDown" when (meta || alt) && shift ->
      D.ev_prevent_default ev;
      A.move_blocks_up_down false
  | "ArrowUp" when mods ev && not shift ->
      (* cljs mod+up collapses one level / the selection *)
      D.ev_prevent_default ev;
      A.collapse_expand ~collapse:true ()
  | "ArrowDown" when mods ev && not shift ->
      (* cljs mod+down expands one level / the selection *)
      D.ev_prevent_default ev;
      A.collapse_expand ~collapse:false ()
  | "ArrowUp" when shift ->
      D.ev_prevent_default ev;
      A.extend_selection true
  | "ArrowDown" when shift ->
      D.ev_prevent_default ev;
      A.extend_selection false
  | "ArrowUp" when selected () ->
      D.ev_prevent_default ev;
      A.move_selection_focus true
  | "ArrowDown" when selected () ->
      D.ev_prevent_default ev;
      A.move_selection_focus false
  | "Tab" when selected () ->
      D.ev_prevent_default ev;
      A.indent_or_outdent ~indent:(not shift)
  | "Enter" when mods ev ->
      D.ev_prevent_default ev;
      List.iter Editor_commands.cycle_todo (A.selected_uuids ())
  | "Enter" when shift && selected () ->
      (* cljs shift+enter = open-selected-blocks-in-sidebar *)
      D.ev_prevent_default ev;
      List.iter
        (fun u ->
          Web_dom.dispatch_custom "ls:open-right-sidebar"
            (Js.Json.object_
               (Js.Dict.fromList [ "uuid", Js.Json.string u ])))
        (A.selected_uuids ())
  | "Enter" when not shift -> (
      match D.closest_sel ".block-add-button" (D.ev_target ev) with
      | Some btn ->
          D.ev_prevent_default ev;
          A.append_block ?for_page:(D.el_get_attr btn "data-parentblockid") ()
      | None -> (
          match S.anchor () with
          | Some u when selected () ->
              D.ev_prevent_default ev;
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
      D.ev_prevent_default ev;
      Runtime.send Action.Help_toggle
  | _ -> (
      match shortcut_key ev with
      | "a" when mods ev && shift ->
          (* cljs mod+shift+a = select-all-blocks *)
          D.ev_prevent_default ev;
          A.select_all ()
      | "a" when mods ev ->
          (* cljs mod+a = select-parent *)
          D.ev_prevent_default ev;
          A.select_parent ()
      | ";" when mods ev && not shift ->
          D.ev_prevent_default ev;
          A.toggle_children_collapse ()
      | "," when mods ev && not shift ->
          (* the keymap gives mod+, to ui/toggle-settings outside editing
             (editor/zoom-out's mod+, is block-editing-only) — toggles the
             settings dialog like the cmdk dispatch *)
          D.ev_prevent_default ev;
          if Dialogs_state.is_open "settings" then
            Dialogs_state.close_named "settings"
          else Dialogs_state.open_ "settings"
      | "z" when mods ev ->
          D.ev_prevent_default ev;
          if shift then A.redo () else A.undo ()
      | "y" when mods ev ->
          D.ev_prevent_default ev;
          A.redo ()
      | "e" when mods ev ->
          (* cljs mod+e quick-add also fires outside edit mode *)
          D.ev_prevent_default ev;
          A.quick_add ()
      | "c" when D.ev_meta ev ->
          (* editor/copy and copy-text share the text-copy path *)
          D.ev_prevent_default ev;
          run_cid "editor/copy"
      | "x" when D.ev_meta ev && not shift ->
          D.ev_prevent_default ev;
          run_cid "editor/cut"
      | _ -> ())

(* a key whose target is this block's conduit input — the sink's own
   listener emits the Edit_input event on the same keydown, so the
   document-level dispatch must leave it alone *)
let targets_block_editor uuid target =
  match target with
  | Some el -> (
      match D.closest_sel ".ed-input" (Some el) with
      | Some inp -> D.el_get_attr inp "data-block-id" = Some uuid
      | None -> false)
  | None -> false

(* the conduit input of a different block — a stale sink from the
   previous editing surface can still be mounted while its replacement
   is being built; keystrokes into it would write the wrong block *)
let is_other_block_editor uuid target =
  match target with
  | Some el -> (
      match D.closest_sel ".ed-input" (Some el) with
      | Some inp -> (
          match D.el_get_attr inp "data-block-id" with
          | Some u -> u <> uuid
          | None -> false)
      | None -> false)
  | _ -> false

(* every Edit_input event for the open block editor lands here: the
   Logseq keymap owns the commands first, Edit_input handles the rest,
   and buffer changes schedule the debounced save plus popup matching *)
let apply_input ?frame uuid ev =
  match S.editing () with
  | Some e when e.S.uuid = uuid -> (
      (* Focus/Blur/Menu are lifecycle emits, not input — counting them
         makes last_edit_input_ms jump past every request_focus arm, so
         the stale-caret gate in apply_focus would never let the stored
         (or click-hit-tested) caret land *)
      (match ev with
       | Edit_input.Focus | Edit_input.Blur | Edit_input.Menu _ -> ()
       | _ -> S.note_input ());
      let route = A.route_of uuid in
      let conduit = A.conduit_of uuid in
      let m0 = e.S.model in
      let m' =
        match ev with
        | Edit_input.Key (kev, repeat) ->
            edit_key ~route ~conduit ~repeat uuid kev m0
        | Edit_input.Insert "(" ->
            (* cljs autopair-left-paren?: "(" pairs to "()" only after a
               boundary char (:start, "\n", " ", "]", "(") and never with
               an active selection; when the result is "((" master warns
               to use [[ — block-ref search never opens *)
            let src = m0.Edit_model.source in
            let prev =
              if m0.Edit_model.caret = 0 then ' '
              else
                Char.chr
                  (Edit_model.decode_cp m0.Edit_model.units src
                     (Edit_model.prev_cp m0.Edit_model.units src
                        m0.Edit_model.caret))
            in
            if
              m0.Edit_model.anchor = None
              && (prev = ' ' || prev = '\n' || prev = ']' || prev = '(')
            then (
              if prev = '(' then
                Toast.warning
                  (I18n.t "editor/reference-node-use-page-ref");
              let mo = Edit_model.insert_text m0 "()" in
              let c = m0.Edit_model.caret + 1 in
              Edit_model.select mo ~anchor:c ~focus:c)
            else Edit_input.handle ~route ~conduit m0 ev
        | Edit_input.Insert text ->
            let mo = overtype m0 text in
            if mo != m0 then mo
            else Edit_input.handle ~route ~conduit m0 ev
        | _ -> Edit_input.handle ~route ~conduit m0 ev
      in
      A.update_model uuid (fun _ -> m');
      if m'.Edit_model.source <> m0.source then begin
        Outliner_ops.schedule_save uuid m'.Edit_model.source;
        Popups_state.on_model_input ~deleted:
          (match ev with Edit_input.Delete _ -> true | _ -> false)
          uuid
      end;
      match frame with
      | Some fr -> (
          (* the publish above flushed — the sink just painted the new
             runs, so measured line ranges and caret rects are fresh *)
          let conduit' = A.conduit_of uuid in
          let m2 = A.refresh_lines m' conduit' in
          if m2 != m' then
            (* apply only the measured line ranges onto the CURRENT
               model — the flush above can re-enter (focus landing ->
               set_caret) and publish a newer model; a wholesale
               `fun _ -> m2` would resurrect this event's stale caret *)
            A.update_model uuid (fun m ->
                Edit_model.set_lines m m2.Edit_model.lines);
          let m_now =
            match A.edit_model uuid with Some m -> m | None -> m2
          in
          Signal.update fr (fun _ -> Edit_input.measure conduit' m_now))
      | None -> ())
  | _ -> ()

(* translate a DOM keydown into the Edit_input event the conduit would
   have emitted for it *)
let pending_event ev : Edit_input.event option =
  let kev =
    { Edit_model.key = D.ev_key ev
    ; shift = D.ev_shift ev
    ; alt = D.ev_alt ev
    ; meta = D.ev_meta ev
    ; ctrl = D.ev_ctrl ev
    }
  in
  match kev.key with
  | key
    when String.length key = 1
         && (not (D.ev_composing ev))
         && not (mods ev || D.ev_alt ev) ->
      Some (Edit_input.Insert key)
  | _ -> Some (Edit_input.Key (kev, D.ev_repeat ev))

(* a structure op (split/merge/…) remounts the editing sink only after
   its apply+refresh resolves; keystrokes arriving in that window still
   target the previous block's mounted input (or <body>) even though
   editing state says we're mid-edit. cljs flushes the DOM
   synchronously so it never sees this window — run the key through the
   model directly; the surface repaints when the sink remounts *)
let on_pending_focus_key ev e =
  D.ev_prevent_default ev;
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
  let (u, t, _) = !last_block_mousedown in
  if u <> "" && Platform.date_now_ms () -. t < 5000.0 then Some u
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

let on_keydown ev =
  (if Lazy.force perf_keys then
     Printf.eprintf "PERF kdown key=%s editing=%s ac=%b\n%!" (D.ev_key ev)
       (match S.editing () with Some e -> e.S.uuid | None -> "-")
       (ac_popup_open ()));
  if S.ready () then begin
    if Editor_commands.popup_key ev then
      (if Lazy.force perf_keys then
         Printf.eprintf "PERF kdown-ate popup_key key=%s\n%!" (D.ev_key ev))
    else
      let target = D.ev_target ev in
      (* CodeMirror surfaces (fenced-code editor, query source editor)
         own their keys — Esc/arrows/Tab go through the editor's own
         listeners, never the block-editor dispatch. On the native host
         no inner .CodeMirror div exists, so the emitted .code-editor
         wrap around the mount is the guard ancestor instead. *)
      match D.closest_sel ".CodeMirror, .code-editor" target with
      | Some _ -> ()
      | None -> (
          (* property value textareas own their key handling
             (properties_value.ml) — the block-editor dispatch below must
             leave their keys alone *)
          match D.closest_sel ".property-value-container" target with
          | Some _ -> ()
          | None -> (
          match (S.editing (), !S.pending_focus) with
          | Some e, Some (uuid, _, _)
            when e.S.uuid = uuid
                 && not (targets_block_editor uuid target) -> (
              match (D.ev_key ev, racing_edit_uuid ()) with
              | key, Some u
                when u <> e.S.uuid
                     && (String.length key = 1 || key = "Enter"
                         || key = "Backspace" || key = "Tab")
                     && (not (D.ev_composing ev))
                     && not (mods ev || D.ev_alt ev) ->
                  (* a click on a different block is mid-dispatch: the
                     press belongs to the block being entered, not the
                     one still marked editing *)
                  D.ev_prevent_default ev;
                  queue_racing_key ev u
              | _ -> on_pending_focus_key ev e)
          | Some e, _
            when (not (targets_block_editor e.S.uuid target))
                 && (is_other_block_editor e.S.uuid target
                    || not (D.is_editable_target target)) -> (
              match (D.ev_key ev, racing_edit_uuid ()) with
              | key, Some u
                when u <> e.S.uuid
                     && (String.length key = 1 || key = "Enter"
                         || key = "Backspace" || key = "Tab")
                     && (not (D.ev_composing ev))
                     && not (mods ev || D.ev_alt ev) ->
                  (* a click on a different block is mid-dispatch: the
                     press belongs to the block being entered, not the
                     one still marked editing *)
                  D.ev_prevent_default ev;
                  queue_racing_key ev u
              | _ ->
                  (* pending_focus was consumed on a node the following
                     refresh replaced (or focus otherwise failed to
                     land): editing still says mid-edit but the press
                     arrived at <body>. Re-arm pending focus on the
                     editing block and route the key through the
                     remount-window handler. *)
                  S.pending_focus :=
                    Some (e.S.uuid, A.caret_of e.S.uuid,
                      !S.last_edit_input_ms);
                  D.set_timeout A.apply_focus 0;
                  on_pending_focus_key ev e)
          | _ -> (
          match S.editing_uuid () with
          | Some uuid when targets_block_editor uuid target ->
              (* the sink's own listener emits the conduit event for
                 this key — nothing to do at document level *)
              ()
          | Some uuid when mods ev || D.ev_alt ev -> (
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
                      (D.closest_sel ".ed-input" (Some el))
                    && Option.is_some
                         (D.closest_sel ".ls-block" target)
                    && D.closest_sel ".ls-page-title" target = None
                | _ -> false
              in
              if stale_block_editor then on_normal_key ev
              else if D.is_editable_target target then ()
              else
                (match (D.ev_key ev, racing_edit_uuid ()) with
                | key, Some u
                  when (String.length key = 1 || key = "Enter"
                          || key = "Backspace" || key = "Tab")
                       && (not (D.ev_composing ev))
                       && not (mods ev || D.ev_alt ev) ->
                    D.ev_prevent_default ev;
                    queue_racing_key ev u
                | _ -> on_normal_key ev))))
  end

(* -- clipboard events -- *)

let on_paste ev =
  if S.ready () then A.paste_blocks ev

(* a clipboard event aimed at the open editor's conduit input *)
let editing_clipboard_target uuid target =
  match target with
  | Some el -> (
      match D.closest_sel ".ed-input" (Some el) with
      | Some inp -> D.el_get_attr inp "data-block-id" = Some uuid
      | None -> false)
  | None -> false

let on_copy ev =
  if S.ready () then
    match S.editing () with
    | Some e
      when editing_clipboard_target e.S.uuid (D.ev_target ev) -> (
        (* cljs copy-current-block-ref: a collapsed selection inside an
           editing block copies [[uuid]]; a non-collapsed selection
           copies the selected buffer text *)
        match D.ev_clipboard ev with
        | Some clip ->
            let lo, hi = A.sel_span e.S.uuid in
            D.cd_set_data clip "text/plain"
              (if lo = hi then "[[" ^ e.S.uuid ^ "]]"
               else String.sub e.S.buffer lo (hi - lo));
            D.ev_prevent_default ev
        | None -> ())
    | Some _ -> ()
    | None -> A.copy_selection ev

let on_cut ev =
  if S.ready () then
    match S.editing () with
    | Some e
      when editing_clipboard_target e.S.uuid (D.ev_target ev) -> (
        match D.ev_clipboard ev with
        | Some clip ->
            let lo, hi = A.sel_span e.S.uuid in
            if lo <> hi then (
              D.cd_set_data clip "text/plain"
                (String.sub e.S.buffer lo (hi - lo));
              A.splice_range e.S.uuid lo hi "";
              Outliner_ops.schedule_save e.S.uuid
                (A.live_buffer e.S.uuid));
            D.ev_prevent_default ev
        | None -> ())
    | Some _ -> ()
    | None -> A.cut_selection ev

(* -- clicks -- *)

let on_click ev =
  let target = D.ev_target ev in
  (* the add-button path defers through S.defer_init, so it works even on
     an empty page where no block_row has mounted the state yet *)
  match D.closest_sel ".block-add-button" target with
  | Some btn ->
      A.append_block ?for_page:(D.el_get_attr btn "data-parentblockid")
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
                match D.el_get_attr el "data-blockid" with
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
                        D.ev_prevent_default ev;
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
                         .view-action-type, .ui-fenced-code-editor, \
                         .block-editor, .prefix-link, [data-pressable]"
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
                                | Some u -> Comments_ops.submit u
                                | None -> ())
                            | None -> (
                                match
                                  D.closest_sel ".ls-comment-delete" target
                                with
                                | Some el -> (
                                    match
                                      D.el_get_attr el "data-comment-uuid"
                                    with
                                    | Some u -> Comments_ops.delete u
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
                                              D.el_get_attr el "data-blockid"
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
                                              D.closest_sel
                                                ".block-main-container"
                                                target
                                            with
                                            | None -> ()
                                            | Some _ -> (
                                                match
                                                  D.closest_sel ".ls-block"
                                                    target
                                                with
                                                | None -> ()
                                                | Some el -> (
                                                    match
                                                      D.el_get_attr el
                                                        "data-blockid"
                                                    with
                                                    | Some u ->
                                                        let scope =
                                                          match
                                                            D.closest_sel
                                                              ".cp__right-sidebar"
                                                              target
                                                          with
                                                          | Some _ ->
                                                              "sidebar"
                                                          | None -> "main"
                                                        in
                                                        A.enter_edit ~scope
                                                          u
                                                          (String.length
                                                             (A.model_title
                                                                u))
                                                    | None ->
                                                        ()))))))))))))

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
        match
          ( Option.bind (detail_field ev "text") Js.Json.decodeString
          , Option.bind (detail_field ev "from") Js.Json.decodeNumber
          , Option.bind (detail_field ev "to") Js.Json.decodeNumber )
        with
        | Some text, Some from, Some to_ ->
            let n = String.length e.S.buffer in
            let f = Int.max 0 (Int.min (int_of_float from) n) in
            let t = Int.max f (Int.min (int_of_float to_) n) in
            let back =
              Option.value
                (Option.map int_of_float
                   (Option.bind (detail_field ev "back")
                      Js.Json.decodeNumber))
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
               Option.bind (detail_field ev "exit") Js.Json.decodeBoolean
             with
             | Some true -> A.exit_edit ~select:false
             | _ -> ())
        | _ -> ())
    | None -> ()

(* -- ls:editor-command channel is owned by editor_commands.ml -- *)
(* clicking outside the editor commits the buffer; clicks inside the
   autocomplete/context-menu popups keep editing — the apply action
   refocuses the sink input (cljs keeps the block in edit mode) *)
let on_mousedown ev =
  if S.ready () then begin
    (* record which block's content the pointer went down on — including
       outside any block (clears the record) — and the editing uuid the
       mousedown is about to replace, so wildcard replays never write
       into that dying record. Mirrors the interactive exclusions
       on_click applies before enter_edit. *)
    let stale =
      match S.editing () with Some e -> e.S.uuid | None -> ""
    in
    let now = Platform.date_now_ms () in
    last_block_mousedown :=
      (match
         D.closest_sel
           "button, a, input, audio, video, details, summary, \
            sup.fn, [contenteditable=true], .cloze, \
            .cloze-revealed, .query-table, .image-resize, \
            .view-action-type, .ui-fenced-code-editor"
           (D.ev_target ev)
       with
       | Some _ -> ("", now, stale)
       | None -> (
           match D.closest_sel ".block-content" (D.ev_target ev) with
           | Some el ->
               ( Option.value (D.el_get_attr el "data-blockid") ~default:""
               , now, stale )
           | None -> (
               (* the add-block row appends a block then enters edit —
                  its uuid doesn't exist yet, so record a wildcard that
                  replays into the next edit landing *)
               match D.closest_sel ".block-add-button" (D.ev_target ev)
               with
               | Some _ -> ("*", now, stale)
               | None -> (
                   (* row padding lands inside .ls-block but outside
                      .block-content — the block it belongs to is still
                      the edit the click is about to start *)
                   match D.closest_sel ".ls-block" (D.ev_target ev) with
                   | Some el ->
                       ( Option.value
                           (uuid_of_prefixed "ls-block-" (D.el_id el))
                           ~default:""
                       , now, stale )
                   | None -> ("", now, stale)))));
    (match !last_block_mousedown with
     | u, _, _ when u <> "" && u <> "*" ->
         S.click_point :=
           Some (u, now, D.ev_client_x ev, D.ev_client_y ev)
     | _ -> S.click_point := None);
    if S.editing () <> None then
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

let on_dragstart ev =
  match D.closest_sel ".bullet-container" (D.ev_target ev) with
  | Some _ ->
      D.ev_prevent_default ev;
      D.ev_stop_immediate ev
  | None -> ()

let files_of ev =
  match D.ev_data_transfer ev with
  | Some dt -> D.cd_files dt
  | None -> [||]

let on_file_dragover ev =
  if Array.length (files_of ev) > 0 then D.ev_prevent_default ev

let on_file_drop ev =
  let files = files_of ev in
  if Array.length files > 0 then begin
    D.ev_prevent_default ev;
    Asset_dom.upload_files files
  end

let installed = State_cell.Once.make ()

let install_once () =
  State_cell.Once.run installed (fun () ->
    D.add_document_listener "keydown" on_keydown true;
    D.add_document_listener "keydown" on_global_key true;
    D.add_document_listener "paste" on_paste true;
    D.add_document_listener "copy" on_copy true;
    D.add_document_listener "cut" on_cut true;
    D.add_document_listener "click" on_click true;
    D.add_document_listener "mousedown" on_mousedown true;
    D.add_document_listener "ls:editor-insert" on_editor_insert true;
    D.add_document_listener "dragstart" on_dragstart true;
    D.add_document_listener "dragover" on_file_dragover true;
    D.add_document_listener "drop" on_file_drop true;
    Block_dnd.install ();
    (* pointer-driven range selection (cljs block/selection.cljs) *)
    D.add_document_listener "pointerdown"
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
    D.add_document_listener "pointerup"
      (fun _ev -> Block_selection.pointerup ())
      true)
