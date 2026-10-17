(* Static port of the cljs cmdk command set: ids from
   shortcut.handler/editor-global + global-prevent-default +
   global-non-editing-only (modules/shortcut/config.cljs). cljs drops
   :inactive entries when the config is built (build-category-map) —
   on web that removes the electron-only bindings, plugins-file/github
   installers, and dev/* — so this table omits them too, except dev/*
   entries that stay gated on developer-mode at query time like cljs.

   Kept as an embedded JSON literal decoded once at init — same
   cons-skeleton reason as keymap_data. Wire shape:
     [ ["k", id] | ["d", id, "(Dev) label"] ]

   Keymap_data owns default and configured bindings. `display` applies
   shortcut-utils/decorate-binding (macOS/non-macOS branches) + the
   trailing "meta" -> "cmd" rename from binding-for-display. *)

type shortcut = Keymap_data.shortcut =
  | Unbound
  | Disabled
  | Binds of string list

type cmd =
  { id : string (* cljs keyword without the leading ":" *)
  ; label : string (* i18n key "command.<ns>/<name>" or literal (Dev) desc *)
  ; i18n : bool
  ; dev : bool
  ; sc : shortcut
  }

let table_json = {|
[["k","graph/export-as-html"],["k","graph/open"],["k","graph/remove"],["k","graph/add"],["k","graph/db-add"],["k","editor/cycle-todo"],["k","editor/up"],["k","editor/down"],["k","editor/left"],["k","editor/right"],["k","editor/select-up"],["k","editor/select-down"],["k","editor/move-block-up"],["k","editor/move-block-down"],["k","editor/move-blocks"],["k","editor/open-edit"],["k","editor/open-selected-blocks-in-sidebar"],["k","editor/select-block-up"],["k","editor/select-block-down"],["k","editor/select-parent"],["k","editor/delete-selection"],["k","editor/expand-block-children"],["k","editor/collapse-block-children"],["k","editor/toggle-block-children"],["k","editor/indent"],["k","editor/outdent"],["k","editor/copy"],["k","editor/copy-text"],["k","editor/cut"],["k","page/toggle-favorite"],["k","editor/jump"],["k","editor/insert-link"],["k","editor/select-all-blocks"],["k","editor/toggle-number-list"],["k","editor/undo"],["k","editor/redo"],["k","editor/quick-add"],["k","ui/toggle-brackets"],["k","go/search-in-page"],["k","go/search"],["k","go/search-themes"],["k","go/backward"],["k","go/forward"],["k","search/re-index"],["k","sidebar/open-today-page"],["k","sidebar/clear"],["k","publish/open-dialog"],["k","command-palette/toggle"],["k","editor/add-property"],["k","go/home"],["k","go/journals"],["k","go/all-pages"],["k","go/flashcards"],["k","go/all-graphs"],["k","go/keyboard-shortcuts"],["k","go/tomorrow"],["k","go/next-journal"],["k","go/prev-journal"],["k","ui/toggle-document-mode"],["k","ui/highlight-recent-blocks"],["k","ui/toggle-settings"],["k","ui/toggle-right-sidebar"],["k","ui/toggle-left-sidebar"],["k","ui/toggle-help"],["k","ui/toggle-theme"],["k","ui/toggle-contents"],["k","editor/set-tags"],["k","editor/add-property-deadline"],["k","editor/add-property-status"],["k","editor/add-property-priority"],["k","editor/add-property-icon"],["k","editor/add-reaction"],["k","editor/add-comment"],["k","editor/toggle-display-hidden-properties"],["k","ui/toggle-wide-mode"],["k","ui/select-theme-color"],["k","ui/goto-plugins"],["k","editor/toggle-open-blocks"],["k","ui/clear-all-notifications"],["k","sidebar/close-top"],["k","misc/export-block-data"],["k","misc/export-page-data"],["k","misc/export-graph-ontology-data"],["k","misc/import-edn-data"],["k","ui/customize-appearance"],["d","dev/show-block-data","(Dev) Show block data"],["d","dev/show-block-ast","(Dev) Show block AST"],["d","dev/show-page-data","(Dev) Show page data"],["d","dev/validate-db","(Dev) Validate current graph"],["d","dev/recompute-checksum","(Dev) Recompute graph checksum"],["d","dev/export-client-ops-sqlite","(Dev) Export client ops sqlite"],["d","dev/gc-graph","(Dev) Garbage collect graph (remove unused data in SQLite)"],["d","dev/rtc-stop","(Dev) RTC Stop"],["d","dev/rtc-start","(Dev) RTC Start"]]
|}

let jstr j =
  match Js.Json.decodeString j with
  | Some s -> s
  | None -> failwith "commands_data: bad json"

let jarr j =
  match Js.Json.decodeArray j with
  | Some a -> a
  | None -> failwith "commands_data: bad json"

let decode_cmd j =
  match jarr j with
  | [| tag; id |] when jstr tag = "k" ->
      { id = jstr id
      ; label = "command." ^ jstr id
      ; i18n = true
      ; dev = false
      ; sc = Keymap_data.default_shortcut (jstr id)
      }
  | [| tag; id; rest |] -> (
      match jstr tag with
      | "d" ->
          { id = jstr id; label = jstr rest; i18n = false; dev = true; sc = Unbound }
      | _ -> failwith "commands_data: cmd")
  | _ -> failwith "commands_data: cmd"

let table : cmd list =
  Array.to_list
    (Array.map decode_cmd (jarr (Js.Json.parseExn table_json)))

let current_table () =
  List.map (fun command ->
      { command with sc = Keymap_data.effective_shortcut command.id }) table

(* cljs shortcut-utils/decorate-binding (literal replace order matters:
   "shift+/" -> "?" before "shift" -> shift glyph). *)
let decorate_binding s =
  let mac = Ui_services.env_is_mac () in
  s
  |> (fun x -> I18n.replace_all x "mod" (if mac then {js|⌘|js} else "ctrl"))
  |> (fun x -> I18n.replace_all x "meta" (if mac then {js|⌘|js} else {js|⊞ win|js}))
  |> (fun x -> I18n.replace_all x "alt" (if mac then {js|⌥|js} else "alt"))
  |> (fun x -> I18n.replace_all x "shift+/" "?")
  |> (fun x -> I18n.replace_all x "left" {js|←|js})
  |> (fun x -> I18n.replace_all x "right" {js|→|js})
  |> (fun x -> I18n.replace_all x "up" {js|↑|js})
  |> (fun x -> I18n.replace_all x "down" {js|↓|js})
  |> (fun x -> I18n.replace_all x "shift" {js|⇧|js})
  |> (fun x -> I18n.replace_all x "open-square-bracket" "[")
  |> (fun x -> I18n.replace_all x "close-square-bracket" "]")
  |> (fun x -> I18n.replace_all x "equals" "=")
  |> (fun x -> I18n.replace_all x "semicolon" ";")
  |> String.lowercase_ascii

(* cljs binding-for-display: join multiple bindings with " | ";
   false -> :keymap/disabled; the trailing replace shows "cmd" for the
   mac "meta" key — our decorate already emits the ⌘ glyph, so it is a
   no-op here *)
let display = function
  | Unbound -> ""
  | Disabled -> I18n.t "keymap/disabled"
  | Binds bs -> String.concat " | " (List.map decorate_binding bs)

let command_by_id cid =
  List.find_opt (fun c -> c.id = cid) table
