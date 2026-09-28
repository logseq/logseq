(* Static port of the cljs cmdk command set: ids from
   shortcut.handler/editor-global + global-prevent-default +
   global-non-editing-only (modules/shortcut/config.cljs). cljs drops
   :inactive entries when the config is built (build-category-map) —
   on web that removes the electron-only bindings, plugins-file/github
   installers, and dev/* — so this table omits them too, except dev/*
   entries that stay gated on developer-mode at query time like cljs.

   `sc` holds the raw cljs :binding values; `display` applies
   shortcut-utils/decorate-binding (macOS/non-macOS branches) + the
   trailing "meta" -> "cmd" rename from binding-for-display. *)

type shortcut =
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

let k id sc = { id; label = "command." ^ id; i18n = true; dev = false; sc }

let d id desc =
  { id; label = desc; i18n = false; dev = true; sc = Unbound }

(* macOS bindings; non-mac branches are dropped (same as the reference
   app, which only needs its own platform's set) *)
let table : cmd list =
  [ (* ---- shortcut.handler/editor-global ---- *)
    k "graph/export-as-html" Unbound
  ; k "graph/open" (Binds [ "alt+shift+g" ])
  ; k "graph/remove" Unbound
  ; k "graph/add" Unbound
  ; k "graph/db-add" Disabled
  ; k "editor/cycle-todo" (Binds [ "mod+enter" ])
  ; k "editor/up" (Binds [ "up"; "ctrl+p" ])
  ; k "editor/down" (Binds [ "down"; "ctrl+n" ])
  ; k "editor/left" (Binds [ "left" ])
  ; k "editor/right" (Binds [ "right" ])
  ; k "editor/select-up" (Binds [ "shift+up" ])
  ; k "editor/select-down" (Binds [ "shift+down" ])
  ; k "editor/move-block-up" (Binds [ "mod+shift+up" ])
  ; k "editor/move-block-down" (Binds [ "mod+shift+down" ])
  ; k "editor/move-blocks" (Binds [ "mod+shift+m" ])
  ; k "editor/open-edit" (Binds [ "enter" ])
  ; k "editor/open-selected-blocks-in-sidebar" (Binds [ "shift+enter" ])
  ; k "editor/select-block-up" (Binds [ "alt+up" ])
  ; k "editor/select-block-down" (Binds [ "alt+down" ])
  ; k "editor/select-parent" (Binds [ "mod+a" ])
  ; k "editor/delete-selection" (Binds [ "backspace"; "delete" ])
  ; k "editor/expand-block-children" (Binds [ "mod+down" ])
  ; k "editor/collapse-block-children" (Binds [ "mod+up" ])
  ; k "editor/toggle-block-children" (Binds [ "mod+;" ])
  ; k "editor/indent" (Binds [ "tab" ])
  ; k "editor/outdent" (Binds [ "shift+tab" ])
  ; k "editor/copy" (Binds [ "mod+c" ])
  ; k "editor/copy-text" (Binds [ "mod+shift+c" ])
  ; k "editor/cut" (Binds [ "mod+x" ])
  ; k "page/toggle-favorite" (Binds [ "mod+shift+f" ])
  ; k "editor/jump" (Binds [ "mod+j" ])
    (* ---- shortcut.handler/global-prevent-default ---- *)
  ; k "editor/insert-link" (Binds [ "mod+l" ])
  ; k "editor/select-all-blocks" (Binds [ "mod+shift+a" ])
  ; k "editor/toggle-number-list" (Binds [ "t n" ])
  ; k "editor/undo" (Binds [ "mod+z" ])
  ; k "editor/redo" (Binds [ "mod+shift+z"; "mod+y" ])
  ; k "editor/quick-add" (Binds [ "mod+e" ])
  ; k "ui/toggle-brackets" (Binds [ "t b" ])
  ; k "go/search-in-page" (Binds [ "mod+shift+k" ])
  ; k "go/search" (Binds [ "mod+k" ])
  ; k "go/search-themes" (Binds [ "mod+shift+i" ])
  ; k "go/backward" (Binds [ "mod+open-square-bracket" ])
  ; k "go/forward" (Binds [ "mod+close-square-bracket" ])
  ; k "search/re-index" (Binds [ "mod+c mod+s" ])
  ; k "sidebar/open-today-page" (Binds [ "mod+shift+j" ])
  ; k "sidebar/clear" (Binds [ "mod+c mod+c" ])
  ; k "publish/open-dialog" (Binds [ "mod+m" ])
  ; k "command-palette/toggle" (Binds [ "mod+shift+p" ])
  ; k "editor/add-property" (Binds [ "mod+p" ])
    (* ---- shortcut.handler/global-non-editing-only ---- *)
  ; k "go/home" (Binds [ "g h" ])
  ; k "go/journals" (Binds [ "g j" ])
  ; k "go/all-pages" (Binds [ "g a" ])
  ; k "go/flashcards" (Binds [ "g f"; "t c" ])

  ; k "go/all-graphs" (Binds [ "g shift+g" ])
  ; k "go/keyboard-shortcuts" (Binds [ "g s" ])
  ; k "go/tomorrow" (Binds [ "g t" ])
  ; k "go/next-journal" (Binds [ "g n" ])
  ; k "go/prev-journal" (Binds [ "g p" ])
  ; k "ui/toggle-document-mode" (Binds [ "t d" ])
  ; k "ui/highlight-recent-blocks" (Binds [ "mod+c mod+r" ])
  ; k "ui/toggle-settings" (Binds [ "t s"; "mod+," ])
  ; k "ui/toggle-right-sidebar" (Binds [ "t r" ])
  ; k "ui/toggle-left-sidebar" (Binds [ "t l" ])
  ; k "ui/toggle-help" (Binds [ "shift+/" ])
  ; k "ui/toggle-theme" (Binds [ "t t" ])
  ; k "ui/toggle-contents" (Binds [ "alt+shift+c" ])
  ; k "editor/set-tags" (Binds [ "p t" ])
  ; k "editor/add-property-deadline" (Binds [ "p d" ])
  ; k "editor/add-property-status" (Binds [ "p s" ])
  ; k "editor/add-property-priority" (Binds [ "p p" ])
  ; k "editor/add-property-icon" (Binds [ "p i" ])
  ; k "editor/add-reaction" (Binds [ "p r" ])
  ; k "editor/add-comment" (Binds [ "ctrl+space" ])
  ; k "editor/toggle-display-hidden-properties" (Binds [ "p a" ])
  ; k "ui/toggle-wide-mode" (Binds [ "t w" ])
  ; k "ui/select-theme-color" (Binds [ "t i" ])
  ; k "ui/goto-plugins" (Binds [ "t p" ])
  ; k "editor/toggle-open-blocks" (Binds [ "t o" ])
  ; k "ui/clear-all-notifications" Unbound
  ; k "sidebar/close-top" (Binds [ "c t" ])
  ; k "misc/export-block-data" Unbound
  ; k "misc/export-page-data" Unbound
  ; k "misc/export-graph-ontology-data" Unbound
  ; k "misc/import-edn-data" Unbound
  ; k "ui/customize-appearance" (Binds [ "c c" ])
    (* ---- dev commands (developer-mode only; literal en labels) ---- *)
  ; d "dev/show-block-data" "(Dev) Show block data"
  ; d "dev/show-block-ast" "(Dev) Show block AST"
  ; d "dev/show-page-data" "(Dev) Show page data"
  ; d "dev/validate-db" "(Dev) Validate current graph"
  ; d "dev/recompute-checksum" "(Dev) Recompute graph checksum"
  ; d "dev/export-client-ops-sqlite" "(Dev) Export client ops sqlite"
  ; d "dev/gc-graph" "(Dev) Garbage collect graph (remove unused data in SQLite)"
  ; d "dev/rtc-stop" "(Dev) RTC Stop"
  ; d "dev/rtc-start" "(Dev) RTC Start"
  ]

(* cljs shortcut-utils/decorate-binding (literal replace order matters:
   "shift+/" -> "?" before "shift" -> shift glyph); glyph literals go
   through Platform.utf8 *)
let decorate_binding s =
  let mac = Platform.is_mac () in
  s
  |> (fun x -> Ui_strings.replace_all x "mod" (if mac then Platform.utf8 "\xe2\x8c\x98" else "ctrl"))
  |> (fun x -> Ui_strings.replace_all x "meta" (if mac then Platform.utf8 "\xe2\x8c\x98" else Platform.utf8 "\xe2\x8a\x9e win"))
  |> (fun x -> Ui_strings.replace_all x "alt" (if mac then Platform.utf8 "\xe2\x8c\xa5" else "alt"))
  |> (fun x -> Ui_strings.replace_all x "shift+/" "?")
  |> (fun x -> Ui_strings.replace_all x "left" (Platform.utf8 "\xe2\x86\x90"))
  |> (fun x -> Ui_strings.replace_all x "right" (Platform.utf8 "\xe2\x86\x92"))
  |> (fun x -> Ui_strings.replace_all x "up" (Platform.utf8 "\xe2\x86\x91"))
  |> (fun x -> Ui_strings.replace_all x "down" (Platform.utf8 "\xe2\x86\x93"))
  |> (fun x -> Ui_strings.replace_all x "shift" (Platform.utf8 "\xe2\x87\xa7"))
  |> (fun x -> Ui_strings.replace_all x "open-square-bracket" "[")
  |> (fun x -> Ui_strings.replace_all x "close-square-bracket" "]")
  |> (fun x -> Ui_strings.replace_all x "equals" "=")
  |> (fun x -> Ui_strings.replace_all x "semicolon" ";")
  |> String.lowercase_ascii

(* cljs binding-for-display: join multiple bindings with " | ";
   false -> :keymap/disabled; the trailing replace shows "cmd" for the
   mac "meta" key — our decorate already emits the ⌘ glyph, so it is a
   no-op here *)
let display = function
  | Unbound -> ""
  | Disabled -> Ui_strings.t "keymap/disabled"
  | Binds bs -> String.concat " | " (List.map decorate_binding bs)

let command_by_id cid =
  List.find_opt (fun c -> c.id = cid) table
