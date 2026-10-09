(* Static port of the cljs cmdk command set: ids from
   shortcut.handler/editor-global + global-prevent-default +
   global-non-editing-only (modules/shortcut/config.cljs). cljs drops
   :inactive entries when the config is built (build-category-map) —
   on web that removes the electron-only bindings, plugins-file/github
   installers, and dev/* — so this table omits them too, except dev/*
   entries that stay gated on developer-mode at query time like cljs.

   Kept as an embedded JSON literal decoded once at init — same
   cons-skeleton reason as keymap_data. Wire shape:
     [ ["k", id, null | "x" | [bindings]] | ["d", id, "(Dev) label"] ]
   macOS bindings only; non-mac branches are dropped (same as the
   reference app, which only needs its own platform's set).

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

let table_json = {|
[["k","graph/export-as-html",null],["k","graph/open",["alt+shift+g"]],["k","graph/remove",null],["k","graph/add",null],["k","graph/db-add","x"],["k","editor/cycle-todo",["mod+enter"]],["k","editor/up",["up","ctrl+p"]],["k","editor/down",["down","ctrl+n"]],["k","editor/left",["left"]],["k","editor/right",["right"]],["k","editor/select-up",["shift+up"]],["k","editor/select-down",["shift+down"]],["k","editor/move-block-up",["mod+shift+up"]],["k","editor/move-block-down",["mod+shift+down"]],["k","editor/move-blocks",["mod+shift+m"]],["k","editor/open-edit",["enter"]],["k","editor/open-selected-blocks-in-sidebar",["shift+enter"]],["k","editor/select-block-up",["alt+up"]],["k","editor/select-block-down",["alt+down"]],["k","editor/select-parent",["mod+a"]],["k","editor/delete-selection",["backspace","delete"]],["k","editor/expand-block-children",["mod+down"]],["k","editor/collapse-block-children",["mod+up"]],["k","editor/toggle-block-children",["mod+;"]],["k","editor/indent",["tab"]],["k","editor/outdent",["shift+tab"]],["k","editor/copy",["mod+c"]],["k","editor/copy-text",["mod+shift+c"]],["k","editor/cut",["mod+x"]],["k","page/toggle-favorite",["mod+shift+f"]],["k","editor/jump",["mod+j"]],["k","editor/insert-link",["mod+l"]],["k","editor/select-all-blocks",["mod+shift+a"]],["k","editor/toggle-number-list",["t n"]],["k","editor/undo",["mod+z"]],["k","editor/redo",["mod+shift+z","mod+y"]],["k","editor/quick-add",["mod+e"]],["k","ui/toggle-brackets",["t b"]],["k","go/search-in-page",["mod+shift+k"]],["k","go/search",["mod+k"]],["k","go/search-themes",["mod+shift+i"]],["k","go/graph-view",["g g"]],["k","go/backward",["mod+open-square-bracket"]],["k","go/forward",["mod+close-square-bracket"]],["k","search/re-index",["mod+c mod+s"]],["k","sidebar/open-today-page",["mod+shift+j"]],["k","sidebar/clear",["mod+c mod+c"]],["k","publish/open-dialog",["mod+m"]],["k","command-palette/toggle",["mod+shift+p"]],["k","editor/add-property",["mod+p"]],["k","go/home",["g h"]],["k","go/journals",["g j"]],["k","go/all-pages",["g a"]],["k","go/flashcards",["g f","t c"]],["k","go/all-graphs",["g shift+g"]],["k","go/keyboard-shortcuts",["g s"]],["k","go/tomorrow",["g t"]],["k","go/next-journal",["g n"]],["k","go/prev-journal",["g p"]],["k","ui/toggle-document-mode",["t d"]],["k","ui/highlight-recent-blocks",["mod+c mod+r"]],["k","ui/toggle-settings",["t s","mod+,"]],["k","ui/toggle-right-sidebar",["t r"]],["k","ui/toggle-left-sidebar",["t l"]],["k","ui/toggle-help",["shift+/"]],["k","ui/toggle-theme",["t t"]],["k","ui/toggle-contents",["alt+shift+c"]],["k","editor/set-tags",["p t"]],["k","editor/add-property-deadline",["p d"]],["k","editor/add-property-status",["p s"]],["k","editor/add-property-priority",["p p"]],["k","editor/add-property-icon",["p i"]],["k","editor/add-reaction",["p r"]],["k","editor/add-comment",["ctrl+space"]],["k","editor/toggle-display-hidden-properties",["p a"]],["k","ui/toggle-wide-mode",["t w"]],["k","ui/select-theme-color",["t i"]],["k","ui/goto-plugins",["t p"]],["k","editor/toggle-open-blocks",["t o"]],["k","ui/clear-all-notifications",null],["k","sidebar/close-top",["c t"]],["k","misc/export-block-data",null],["k","misc/export-page-data",null],["k","misc/export-graph-ontology-data",null],["k","misc/import-edn-data",null],["k","ui/customize-appearance",["c c"]],["d","dev/show-block-data","(Dev) Show block data"],["d","dev/show-block-ast","(Dev) Show block AST"],["d","dev/show-page-data","(Dev) Show page data"],["d","dev/validate-db","(Dev) Validate current graph"],["d","dev/recompute-checksum","(Dev) Recompute graph checksum"],["d","dev/export-client-ops-sqlite","(Dev) Export client ops sqlite"],["d","dev/gc-graph","(Dev) Garbage collect graph (remove unused data in SQLite)"],["d","dev/rtc-stop","(Dev) RTC Stop"],["d","dev/rtc-start","(Dev) RTC Start"]]
|}

let jstr j =
  match Js.Json.decodeString j with
  | Some s -> s
  | None -> failwith "commands_data: bad json"

let jarr j =
  match Js.Json.decodeArray j with
  | Some a -> a
  | None -> failwith "commands_data: bad json"

let decode_sc j =
  match Js.Json.decodeString j with
  | Some "x" -> Disabled
  | Some _ -> failwith "commands_data: sc"
  | None -> (
      match Js.Json.decodeNull j with
      | Some _ -> Unbound
      | None -> Binds (Array.to_list (Array.map jstr (jarr j))))

let decode_cmd j =
  match jarr j with
  | [| tag; id; rest |] -> (
      match jstr tag with
      | "k" ->
          { id = jstr id
          ; label = "command." ^ jstr id
          ; i18n = true
          ; dev = false
          ; sc = decode_sc rest
          }
      | "d" ->
          { id = jstr id; label = jstr rest; i18n = false; dev = true; sc = Unbound }
      | _ -> failwith "commands_data: cmd")
  | _ -> failwith "commands_data: cmd"

let table : cmd list =
  Array.to_list
    (Array.map decode_cmd (jarr (Js.Json.parseExn table_json)))

(* cljs shortcut-utils/decorate-binding (literal replace order matters:
   "shift+/" -> "?" before "shift" -> shift glyph); glyph literals go
   through Ui_services.literal_text *)
let decorate_binding s =
  let mac = Ui_services.env_is_mac () in
  s
  |> (fun x -> I18n.replace_all x "mod" (if mac then Ui_services.literal_text "\xe2\x8c\x98" else "ctrl"))
  |> (fun x -> I18n.replace_all x "meta" (if mac then Ui_services.literal_text "\xe2\x8c\x98" else Ui_services.literal_text "\xe2\x8a\x9e win"))
  |> (fun x -> I18n.replace_all x "alt" (if mac then Ui_services.literal_text "\xe2\x8c\xa5" else "alt"))
  |> (fun x -> I18n.replace_all x "shift+/" "?")
  |> (fun x -> I18n.replace_all x "left" (Ui_services.literal_text "\xe2\x86\x90"))
  |> (fun x -> I18n.replace_all x "right" (Ui_services.literal_text "\xe2\x86\x92"))
  |> (fun x -> I18n.replace_all x "up" (Ui_services.literal_text "\xe2\x86\x91"))
  |> (fun x -> I18n.replace_all x "down" (Ui_services.literal_text "\xe2\x86\x93"))
  |> (fun x -> I18n.replace_all x "shift" (Ui_services.literal_text "\xe2\x87\xa7"))
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
