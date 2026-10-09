(* Document-level event handling for the outliner. LUI's dom-event channel
   cannot preventDefault and lacks caret/selection info, so the full key
   contract lives here in capture phase; dispatch is by event target:
   inside .editor-wrapper -> editing mode, else normal (block-select) mode. *)

module S = Editor_state
module A = Editor_actions

(* Ui_services.ev exposes key as an option; the handlers below compare
   against literal keys, so "" is the honest absence value *)
let ev_key ev = Option.value ~default:"" ev.Ui_services.key

let closest sel t =
  match t with Some el -> el.Ui_services.closest sel | None -> None

let is_editable_target t =
  match t with Some el -> el.Ui_services.editable () | None -> false

let ( let* ) p f = Js.Promise.then_ f p

let mods ev = ev.Ui_services.ctrl || ev.Ui_services.meta

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
  ignore
    (Ui_task.bind (Ui_services.clipboard_read_text ()) (fun text ->
     (match A.edit_model uuid with
      | Some m ->
          let lo, hi = A.sel_span_of m in
          A.splice_range uuid lo hi text;
          Outliner_ops.schedule_save uuid (A.live_buffer uuid)
      | None -> ());
     Ui_task.resolve ()))


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

let shortcut_key ev = shortcut_key_str (ev_key ev)

(* gpui folds a held shift into the key name for platform shortcuts —
   cmd+shift+p arrives as {key="P", shift=false} and cmd+shift+/ as
   {key="?", shift=false}. With a modifier held, a shifted glyph
   (uppercase letter or shifted symbol) means the flag was folded away;
   reconstruct it so mod+p and mod+shift+p stay distinct *)
let shift_held ev =
  if ev.Ui_services.shift then true
  else if not (ev.Ui_services.meta || ev.Ui_services.ctrl) then false
  else
    match ev_key ev with
    | k when String.length k = 1 ->
        k <> String.lowercase_ascii k || shortcut_key_str k <> k
    | _ -> false

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
    Ui_services.nav_set_hash (Runtime.nav_hash h);
    (* an identical hash fires no hashchange — still let resolve run so
       the same-route refresh path loads data *)
    Ui_services.dom_dispatch "ls:navigate");
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
  | Some (`Url u) -> Ui_services.env_open_url u
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
  if Edit_model.composing m then m
  else if ac_popup_open () && ac_owned_key key then m
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
    | "Backspace" when not (meta || ctrl || kev.alt) ->
        let paired = delete_pair m in
        if paired != m then paired else defer ()
    | "Tab" | "Escape" | "Backspace" -> defer ()
    | "Delete" ->
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
        (* macOS readline keys — native textarea parity; ctrl+shift
           extends the selection. These shadow the mod-key cases
           below, so they must match first *)
        | "a" when ctrl && not meta && Ui_services.env_is_mac () ->
            Edit_model.move m Edit_model.Home ~extend:shift
        | "e" when ctrl && not meta && Ui_services.env_is_mac () ->
            Edit_model.move m Edit_model.End ~extend:shift
        | "k" when ctrl && not meta && Ui_services.env_is_mac () ->
            kill_line_after m
        | "d" when ctrl && not meta && Ui_services.env_is_mac () ->
            Edit_model.delete_forward m
        | "h" when ctrl && not meta && Ui_services.env_is_mac () ->
            Edit_model.delete_backward m
        | "t" when ctrl && not meta && Ui_services.env_is_mac () ->
            transpose_chars m
        | "b" when ctrl && not meta && Ui_services.env_is_mac () ->
            Edit_model.move m Edit_model.Left ~extend:shift
        | "f" when ctrl && not meta && Ui_services.env_is_mac () ->
            Edit_model.move m Edit_model.Right ~extend:shift
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
  if (not palette_open) && not (ev.Ui_services.composing) then
    match stroke_of ev with
    | None -> ()
    | Some stroke ->
        if not (List.mem stroke owned_strokes) then begin
          let now = Ui_services.time_now () in
          let seq =
            if now -. !chord_ms > chord_window_ms then [] else !chord_seq
          in
          let cand = seq @ [ stroke ] in
          let tbl = Lazy.force chord_table in
          let editing =
            is_editable_target (ev.Ui_services.target)
            || S.editing () <> None
          in
          let dispatch cid =
            if chord_may_run editing cid then begin
              ev.Ui_services.prevent_default ();
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
  let key = ev_key ev in
  let shift = shift_held ev
  and alt = ev.Ui_services.alt
  and meta = ev.Ui_services.meta in
  let selected () = S.selection_active () in
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
      List.iter
        (fun u ->
          Popups_state.emit_cmd "add-comment"
            [ "block", Json.String u ])
        (A.selected_uuids ())
  | "ArrowUp" when alt && not shift ->
      (* editor/select-block-up *)
      ev.Ui_services.prevent_default ();
      A.move_selection_focus true
  | "ArrowDown" when alt && not shift ->
      (* editor/select-block-down *)
      ev.Ui_services.prevent_default ();
      A.move_selection_focus false  | "ArrowUp" when (meta || alt) && shift ->
      ev.Ui_services.prevent_default ();
      A.move_blocks_up_down true
  | "ArrowDown" when (meta || alt) && shift ->
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
      | Some btn ->
          ev.Ui_services.prevent_default ();
          A.append_block ?for_page:(btn.Ui_services.attr "data-parentblockid") ()
      | None -> (
          match S.anchor () with
          | Some u when selected () ->
              ev.Ui_services.prevent_default ();
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
let rec retry_vertical uuid ev armed_caret mine_ms attempts =
  if attempts > 0 then
    ignore
      (Ui_services.timers_timeout
         (fun () ->
           match S.editing () with
           | Some e2
          when e2.S.uuid = uuid
               && !S.last_edit_input_ms <= mine_ms
               && e2.S.model.Edit_model.caret = armed_caret ->
            apply_input uuid ev;
            retry_vertical uuid ev armed_caret !S.last_edit_input_ms
              (attempts - 1)
        | _ -> ())
         16)

(* every Edit_input event for the open block editor lands here: the
   Logseq keymap owns the commands first, Edit_input handles the rest,
   and buffer changes schedule the debounced save plus popup matching *)
and apply_input ?frame uuid ev =
  (* Popup-owned keys must yield before the structure queue. Replaying
     Enter after autocomplete has closed would split the block even
     though that physical key already chose a command. *)
  if (match ev with
      | Edit_input.Key (key, _) -> ac_popup_open () && ac_owned_key key.Edit_model.key
      | _ -> false)
  then ()
  else
  (* Retarget a retired sink before enqueueing a shadow. Otherwise the
     same event could leave two shadows when it re-enters on the live UUID. *)
  let uuid, frame = match S.editing (), ev with
    | Some e, (Edit_input.Insert _ | Edit_input.Composition _
              | Edit_input.Delete _ | Edit_input.Key _) when e.S.uuid <> uuid ->
        e.S.uuid, !S.active_frame
    | _ -> uuid, frame in
  let local = !S.structure_pending && !S.optimistic_split_ready
              && !S.pending_edit_real = 0
              && local_input_during_split uuid ev in
  let context = Runtime.repo (), Runtime.route () in
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
          | Some e -> f e
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
        let replay () =
          if context = (Runtime.repo (), Runtime.route ()) then
            match S.editing () with
            | Some current -> apply_input ?frame:!S.active_frame current.S.uuid ev
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
      (* Visual-line hit testing is needed for line navigation, not for
         every inserted character. On web it reads the already rendered
         surface; the host paints the caret after the content flush. *)
      let m0 =
        match ev with
        | Edit_input.Key ({ Edit_model.key = "ArrowUp" | "ArrowDown" | "Home" | "End"; _ }, _)
          when not (Edit_model.composing e.S.model) ->
            A.refresh_lines e.S.model conduit
        | _ -> e.S.model
      in
      let m' =
        match ev with
        | Edit_input.Key (kev, repeat) ->
            edit_key ~route ~conduit ~repeat uuid kev m0
        | Edit_input.Insert text -> insert_autopair m0 text
        | Edit_input.Delete Edit_input.Del_backward ->
            let paired = delete_pair m0 in
            if paired != m0 then paired else Edit_input.handle ~route ~conduit m0 ev
        | _ -> Edit_input.handle ~route ~conduit m0 ev
      in
      (* A caret-only move can measure the unchanged runs before flushing.
         Publish model and overlay together instead of two DOM batches. *)
      (match frame with
       | Some fr when Ui_services.env_edit_units () = `U16 && m'.source == m0.source
                      && Edit_view.reveal_dirty m0 m' = [] ->
           let measured = Edit_input.measure conduit m' in
           if Option.is_some measured.Edit_input.caret then
             Signal.update fr (fun _ -> measured)
       | _ -> ());
      (* Compare against the session model before line measurement;
         refresh_lines may have derived m0 without publishing it. A structural op that settled mid-dispatch (e.g. merge_next on a
         synchronously-drained native promise) already wrote a newer
         model — republishing m' here would push the stale buffer back
         over the committed merge *)
      A.update_model uuid (fun m_cur -> if m_cur == e.S.model then m' else m_cur);
      (match ev with
       | Edit_input.Key
           ({ Edit_model.key = "ArrowUp" | "ArrowDown"; meta = false
            ; ctrl = false; alt = false; _ }, _)
         when Ui_services.env_edit_units () = `Bytes && m'.Edit_model.caret = m0.Edit_model.caret
              && m'.Edit_model.anchor = m0.Edit_model.anchor
              && not (S.selection_active ()) ->
           retry_vertical uuid ev m0.Edit_model.caret
             !S.last_edit_input_ms 6
       | _ -> ());
      if m'.Edit_model.source <> m0.source then begin
        Outliner_ops.schedule_save uuid m'.Edit_model.source;
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
          let m_now =
            match A.edit_model uuid with Some m -> m | None -> m2
          in
          let measured = Edit_input.measure conduit' m_now in
          if Option.is_some measured.Edit_input.caret then
            Signal.update fr (fun _ -> measured);
          Runtime.flush_now ();
          (* a measure taken mid-layout/remount can come back with no
             caret rect — iOS taps reorder focus/scroll work around the
             event — leaving the caret invisible until the next input.
             keep re-measuring until the overlay paints (same recovery
             apply_focus uses) *)
          let f =
            match !(fr.Signal.pending) with
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
                    | Some e when e.S.uuid = uuid ->
                        if not (A.refresh_overlay uuid) then
                          retry_caret (n - 1)
                    | _ -> ())
                     40)
            in
            retry_caret 12
          end)
      | _ -> ())
  | _ -> ()

(* translate a DOM keydown into the Edit_input event the conduit would
   have emitted for it *)
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
      Some (Edit_input.Insert key)
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

(* -- native block drag (gpui) --
   The web path runs dnd-kit pointer sensors over HTML5 drag (Block_dnd);
   the native surface has no HTML5 drag, so the same drop contract is
   driven by document mousedown/mousemove/click on .bullet-container —
   armed on pointer down, activated past the 4px distance constraint the
   sensors use, committed on the release click. Ui_services.env_native_drag
   gates every hook so the web keeps the sensor path alone. *)

type drag_phase =
  | Drag_armed of string * float * float (* uuid, downX, downY *)
  | Drag_active of string

let drag_phase : drag_phase option ref = ref None
let drag_tgt : (string * string) option ref = ref None (* uuid, move_to *)

let drag_active () =
  match !drag_phase with Some (Drag_active _) -> true | _ -> false

let drag_reset () =
  (if drag_active () && S.ready () then S.set_drag None);
  drag_phase := None;
  drag_tgt := None

let arm_drag (ev : Ui_services.ev) =
  match closest ".bullet-container" ev.Ui_services.target with
  | Some el -> (
      match el.Ui_services.attr "blockid" with
      | Some u ->
          drag_phase :=
            Some (Drag_armed (u, ev.Ui_services.x, ev.Ui_services.y))
      | None -> ())
  | None -> ()

(* mirrors dnd-kit's collision pass: the innermost .ls-block under the
   pointer wins, then the zone math of Block_dnd.update_drop_target.
   el_bounding_rect is the fire-and-poll cache on native — a still-uncached
   rect reads 0×0 and falls back to "sibling" until the measure reply
   lands a frame later *)
let update_drag_target ev src =
  let tgt =
    match closest ".ls-block" (ev.Ui_services.target) with
    | Some el -> (
        match el.Ui_services.attr "blockid" with
        | Some t when t <> src && not (A.is_descendant t src) ->
            let left, top, w, _h = el.Ui_services.rect () in
            let move_to =
              if w <= 0.0 then "sibling"
              else
                let first =
                  match S.find_parent t with
                  | Some (_, idx) -> idx = 0
                  | None -> false
                in
                let near_top =
                  Float.abs (ev.Ui_services.y -. top) <= 16.0
                in
                let x_off = ev.Ui_services.x -. left in
                if first && near_top then "top"
                else if x_off > 50.0 then "nested"
                else "sibling"
            in
            Some (t, move_to)
        | _ -> None)
    | None -> None
  in
  (* over nothing/invalid, keep the last candidate like the web listener *)
  let tgt = match tgt with Some _ -> tgt | None -> !drag_tgt in
  drag_tgt := tgt;
  let next =
    match tgt with
    | Some (t, m) -> Some (src, t, m)
    | None -> Some (src, "", "")
  in
  if next <> S.drag () then S.set_drag next

let on_native_mousemove ev =
  if S.ready () then
    match !drag_phase with
    | Some (Drag_armed (u, x0, y0)) ->
        let dx = Float.abs (ev.Ui_services.x -. x0) in
        let dy = Float.abs (ev.Ui_services.y -. y0) in
        if dx +. dy >= 4.0 then begin
          drag_phase := Some (Drag_active u);
          update_drag_target ev u
        end
    | Some (Drag_active u) -> update_drag_target ev u
    | _ -> ()

(* true when the release click commits an in-flight drag — the click
   itself is swallowed (a drag release is not a bullet click) *)
let drop_active_drag () =
  if drag_active () then begin
    (match !drag_phase, !drag_tgt with
     | Some (Drag_active src), Some (t, m) ->
         A.drop_dragged_block src t m
     | _ -> ());
    drag_reset ();
    true
  end
  else false

let on_keydown ev =
  if Ui_services.env_publishing () then ()
  else begin
  (if Lazy.force perf_keys then
     Printf.eprintf "PERF kdown key=%s editing=%s ac=%b\n%!" (ev_key ev)
       (match S.editing () with Some e -> e.S.uuid | None -> "-")
       (ac_popup_open ()));
  if S.ready () then begin
    (match !drag_phase with
     | Some (Drag_active _)
       when String.lowercase_ascii (ev_key ev) = "escape" ->
         drag_reset ()
     | _ -> ());
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
          | Some _ -> ()
          | None -> (
          match (S.editing (), !S.pending_focus) with
          | Some e, Some (uuid, _, _)
            when e.S.uuid = uuid
                 && not (targets_block_editor uuid target) -> (
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
                  S.pending_focus :=
                    Some (e.S.uuid, A.caret_of e.S.uuid,
                      !S.last_edit_input_ms);
                  ignore (Ui_services.timers_timeout A.apply_focus 0);
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
  if Ui_services.env_publishing () then () else begin
  if S.ready () then A.paste_blocks ev

(* a clipboard event aimed at the open editor's conduit input *)
  end

let editing_clipboard_target uuid target =
  match target with
  | Some el -> (
      match closest ".ed-input" (Some el) with
      | Some inp -> inp.Ui_services.attr "data-block-id" = Some uuid
      | None -> false)
  | None -> false

let on_copy ev =
  if S.ready () then
    match S.editing () with
    | Some e
      when editing_clipboard_target e.S.uuid (ev.Ui_services.target) -> (
        (* cljs copy-current-block-ref: a collapsed selection inside an
           editing block copies [[uuid]]; a non-collapsed selection
           copies the selected buffer text *)
        let lo, hi = A.sel_span e.S.uuid in
        ev.Ui_services.clipboard_set "text/plain"
          (if lo = hi then "[[" ^ e.S.uuid ^ "]]"
           else String.sub e.S.buffer lo (hi - lo));
        ev.Ui_services.prevent_default ())
    | Some _ -> ()
    | None -> A.copy_selection ev

let on_cut ev =
  if Ui_services.env_publishing () then () else begin
  if S.ready () then
    match S.editing () with
    | Some e
      when editing_clipboard_target e.S.uuid (ev.Ui_services.target) -> (
        let lo, hi = A.sel_span e.S.uuid in
        if lo <> hi then (
          ev.Ui_services.clipboard_set "text/plain"
            (String.sub e.S.buffer lo (hi - lo));
          A.splice_range e.S.uuid lo hi "";
          Outliner_ops.schedule_save e.S.uuid
            (A.live_buffer e.S.uuid));
        ev.Ui_services.prevent_default ())
    | Some _ -> ()
    | None -> A.cut_selection ev

  end

let on_click ev =
  if drop_active_drag () then
    (* the release click is the drop — keep it from other document
       listeners (page-ref navigation, outside-edit commit) *)
    ev.Ui_services.stop_immediate ()
  else begin
    drag_reset ();
    (* armed-but-unmoved pointer down = a plain click *)
    (* a block-range drag ends with a click on the anchor row — the
       gesture already produced a selection, the click must not open
       the anchor's editor *)
    if Block_selection.consume_suppress () then ()
    else begin
      let target = ev.Ui_services.target in
      (* the add-button path defers through S.defer_init, so it works
         even on an empty page where no block_row has mounted the
         state yet *)
      match closest ".block-add-button" target with
  | Some btn ->
      A.append_block ?for_page:(btn.Ui_services.attr "data-parentblockid")
        ~scope:(A.scope_of_el btn) ()
  | None ->
      if S.ready () then
        (
        match closest ".block-control" target with
        | Some el -> (
            ev.Ui_services.prevent_default ();
            match uuid_of_prefixed "control-" (el.Ui_services.id ()) with
            | Some u ->
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
                         .block-editor, .prefix-link, [data-pressable]"
                        target
                    with
                    | Some _ -> ()
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
  (* a pointer going down ends any stale drag that missed its release
     click (released outside the document) *)
  drag_reset ();
  if Ui_services.env_native_drag () then arm_drag ev;
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
      (match
         closest
           "button, a, input, audio, video, details, summary, \
            sup.fn, [contenteditable=true], .cloze, \
            .cloze-revealed, .query-table, .image-resize, \
            .view-action-type, .ui-fenced-code-editor"
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
    Ui_services.dom_on_document_event ~capture:true "keydown" on_keydown;
    Ui_services.dom_on_document_event ~capture:true "keydown" on_global_key;
    Ui_services.dom_on_document_event ~capture:true "paste" on_paste;
    Ui_services.dom_on_document_event ~capture:true "copy" on_copy;
    Ui_services.dom_on_document_event ~capture:true "cut" on_cut;
    Ui_services.dom_on_document_event ~capture:true "click" on_click;
    Ui_services.dom_on_document_event ~capture:true "mousedown"
      on_mousedown;
    if Ui_services.env_native_drag () then
      Ui_services.dom_on_document_event ~capture:true "mousemove"
        on_native_mousemove;
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
