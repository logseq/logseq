(* Shortcut keymap data: categories, rows and bindings as rendered by
   components/shortcut.cljs on a fresh graph (default bindings, macOS).
   Kept as an embedded JSON literal decoded once at init — the OCaml
   list/record literals emitted a cons skeleton ~30x the size of the
   data itself. Wire shape:
     [ ["c", label] | ["s", label, title, unset, [[kind, data, [keys..]]..]] ]
   Non-ASCII label/key text is raw UTF-8; render through Ui_services.literal_text
   like other i18n literals. *)

type binding =
  { kind : string  (* "combo" | "separate" *)
  ; data : string  (* normalized data-shortcut-binding value *)
  ; keys : string list
  }

type row =
  { label : string
  ; title : string (* "<:id>#<handler>" label-wrap title attr *)
  ; unset : bool   (* binding nil -> "Unset" status label *)
  ; bindings : binding list
  }

type item =
  | Category of string
  | Shortcut of row

let items_json = {|
[["c","Basics"],["s","Search commands",":command-palette/toggle#global-prevent-default",false,[["combo","meta+shift+p",["⌘","⇧","P"]]]],["s","Copy (copies either selection, or block reference)",":editor/copy#editor-global",false,[["combo","meta+c",["⌘","C"]]]],["s","Copy selections as text",":editor/copy-text#editor-global",false,[["combo","meta+shift+c",["⌘","⇧","C"]]]],["s","Cut",":editor/cut#editor-global",false,[["combo","meta+x",["⌘","X"]]]],["s","Indent block",":editor/indent#editor-global",false,[["separate","tab",["Tab"]]]],["s","Create new block",":editor/new-block#block-editing-only",false,[["separate","enter",["⏎"]]]],["s","New line in current block",":editor/new-line#block-editing-only",false,[["combo","shift+enter",["⇧","⏎"]]]],["s","Outdent block",":editor/outdent#editor-global",false,[["combo","shift+tab",["⇧","Tab"]]]],["s","Quick add",":editor/quick-add#global-prevent-default",false,[["combo","meta+e",["⌘","E"]]]],["s","Redo",":editor/redo#global-prevent-default",false,[["combo","meta+shift+z",["⌘","⇧","Z"]],["combo","meta+y",["⌘","Y"]]]],["s","Select all blocks",":editor/select-all-blocks#global-prevent-default",false,[["combo","meta+shift+a",["⌘","⇧","A"]]]],["s","Select parent block",":editor/select-parent#editor-global",false,[["combo","meta+a",["⌘","A"]]]],["s","Undo",":editor/undo#global-prevent-default",false,[["combo","meta+z",["⌘","Z"]]]],["s","Search pages and blocks",":go/search#global-prevent-default",false,[["combo","meta+k",["⌘","K"]]]],["s","Search blocks in page",":go/search-in-page#global-prevent-default",false,[["combo","meta+shift+k",["⌘","⇧","K"]]]],["s","Search themes",":go/search-themes#global-prevent-default",false,[["combo","meta+shift+i",["⌘","⇧","I"]]]],["c","Navigation"],["s","Collapse",":editor/collapse-block-children#editor-global",false,[["combo","meta+up",["⌘","↑"]]]],["s","Move cursor down / Select down",":editor/down#editor-global",false,[["separate","down",["↓"]],["combo","ctrl+n",["Ctrl","N"]]]],["s","Expand",":editor/expand-block-children#editor-global",false,[["combo","meta+down",["⌘","↓"]]]],["s","Jump to a property key or value",":editor/jump#editor-global",false,[["combo","meta+j",["⌘","J"]]]],["s","Move cursor left / Open selected block at beginning",":editor/left#editor-global",false,[["separate","left",["←"]]]],["s","Move cursor right / Open selected block at end",":editor/right#editor-global",false,[["separate","right",["→"]]]],["s","Toggle expand/collapse",":editor/toggle-block-children#editor-global",false,[["combo","meta+;",["⌘",";"]]]],["s","Toggle open blocks (collapse or expand all blocks)",":editor/toggle-open-blocks#global-non-editing-only",false,[["separate","t o",["T","O"]]]],["s","Move cursor up / Select up",":editor/up#editor-global",false,[["separate","up",["↑"]],["combo","ctrl+p",["Ctrl","P"]]]],["s","Go to all graphs",":go/all-graphs#global-non-editing-only",false,[["separate","g shift+g",["G","⇧","G"]]]],["s","Go to all pages",":go/all-pages#global-non-editing-only",false,[["separate","g a",["G","A"]]]],["s","Backwards",":go/backward#global-prevent-default",false,[["combo","meta+open-square-bracket",["⌘","["]]]],["s","Toggle flashcards",":go/flashcards#global-non-editing-only",false,[["separate","g f",["G","F"]],["separate","t c",["T","C"]]]],["s","Forwards",":go/forward#global-prevent-default",false,[["combo","meta+close-square-bracket",["⌘","]"]]]],["s","Go to graph view",":go/graph-view#global-non-editing-only",false,[["separate","g g",["G","G"]]]],["s","Go to home",":go/home#global-non-editing-only",false,[["separate","g h",["G","H"]]]],["s","Go to journals",":go/journals#global-non-editing-only",false,[["separate","g j",["G","J"]]]],["s","Go to keyboard shortcuts",":go/keyboard-shortcuts#global-non-editing-only",false,[["separate","g s",["G","S"]]]],["s","Go to next journal",":go/next-journal#global-non-editing-only",false,[["separate","g n",["G","N"]]]],["s","Go to previous journal",":go/prev-journal#global-non-editing-only",false,[["separate","g p",["G","P"]]]],["s","Go to tomorrow",":go/tomorrow#global-non-editing-only",false,[["separate","g t",["G","T"]]]],["c","Block editing general"],["s","Backspace / Delete backwards",":editor/backspace#block-editing-only",false,[["separate","backspace",["⌫"]]]],["s","Rotate the TODO state",":editor/cycle-todo#editor-global",false,[["combo","meta+enter",["⌘","⏎"]]]],["s","Delete / Delete forwards",":editor/delete#block-editing-only",false,[["separate","delete",["Delete"]]]],["s","Escape editing",":editor/escape-editing#block-editing-only",true,[]],["s","Follow link under cursor",":editor/follow-link#block-editing-only",false,[["combo","meta+o",["⌘","O"]]]],["s","Indent block",":editor/indent#editor-global",false,[["separate","tab",["Tab"]]]],["s","Move block down",":editor/move-block-down#editor-global",false,[["combo","meta+shift+down",["⌘","⇧","↓"]]]],["s","Move block up",":editor/move-block-up#editor-global",false,[["combo","meta+shift+up",["⌘","⇧","↑"]]]],["s","Move blocks to",":editor/move-blocks#editor-global",false,[["combo","meta+shift+m",["⌘","⇧","M"]]]],["s","Create new block",":editor/new-block#block-editing-only",false,[["separate","enter",["⏎"]]]],["s","New line in current block",":editor/new-line#block-editing-only",false,[["combo","shift+enter",["⇧","⏎"]]]],["s","Open link in sidebar",":editor/open-link-in-sidebar#block-editing-only",false,[["combo","meta+shift+o",["⌘","⇧","O"]]]],["s","Outdent block",":editor/outdent#editor-global",false,[["combo","shift+tab",["⇧","Tab"]]]],["s","Zoom in editing block / Forwards otherwise",":editor/zoom-in#block-editing-only",false,[["combo","meta+.",["⌘","."]],["combo","meta+shift+.",["⌘","⇧","."]]]],["s","Zoom out editing block / Backwards otherwise",":editor/zoom-out#block-editing-only",false,[["combo","meta+,",["⌘",","]]]],["c","Block command editing"],["s","Backspace / Delete backwards",":editor/backspace#block-editing-only",false,[["separate","backspace",["⌫"]]]],["s","Delete a word backwards",":editor/backward-kill-word#block-editing-only",false,[]],["s","Move cursor backward a word",":editor/backward-word#block-editing-only",false,[["combo","ctrl+shift+b",["Ctrl","⇧","B"]]]],["s","Move cursor to the beginning of a block",":editor/beginning-of-block#block-editing-only",false,[]],["s","Delete entire block content",":editor/clear-block#block-editing-only",false,[["combo","ctrl+l",["Ctrl","L"]]]],["s","Copy a block embed pointing to the current block",":editor/copy-embed#block-editing-only",false,[["combo","meta+shift+e",["⌘","⇧","E"]]]],["s","Move cursor to the end of a block",":editor/end-of-block#block-editing-only",false,[]],["s","Delete a word forwards",":editor/forward-kill-word#block-editing-only",false,[["combo","ctrl+w",["Ctrl","W"]]]],["s","Move cursor forward a word",":editor/forward-word#block-editing-only",false,[["combo","ctrl+shift+f",["Ctrl","⇧","F"]]]],["s","Delete line after cursor position",":editor/kill-line-after#block-editing-only",false,[]],["s","Delete line before cursor position",":editor/kill-line-before#block-editing-only",false,[["combo","ctrl+u",["Ctrl","U"]]]],["s","Paste text into one block at point",":editor/paste-text-in-one-block-at-point#block-editing-only",false,[["combo","meta+shift+v",["⌘","⇧","V"]]]],["s","Select content below",":editor/select-down#editor-global",false,[["combo","shift+down",["⇧","↓"]]]],["s","Select content above",":editor/select-up#editor-global",false,[["combo","shift+up",["⇧","↑"]]]],["c","Block selection (press Esc to quit selection)"],["s","Add comment",":editor/add-comment#global-non-editing-only",false,[["combo","ctrl+space",["Ctrl","Space"]]]],["s","Add property",":editor/add-property#global-prevent-default",false,[["combo","meta+p",["⌘","P"]]]],["s","Add task deadline to selected block",":editor/add-property-deadline#global-non-editing-only",false,[["separate","p d",["P","D"]]]],["s","Add icon",":editor/add-property-icon#global-non-editing-only",false,[["separate","p i",["P","I"]]]],["s","Add task priority to selected block",":editor/add-property-priority#global-non-editing-only",false,[["separate","p p",["P","P"]]]],["s","Add task status to selected block",":editor/add-property-status#global-non-editing-only",false,[["separate","p s",["P","S"]]]],["s","Add reaction",":editor/add-reaction#global-non-editing-only",false,[["separate","p r",["P","R"]]]],["s","Delete selected blocks",":editor/delete-selection#editor-global",false,[["separate","backspace",["⌫"]],["separate","delete",["Delete"]]]],["s","Edit selected block",":editor/open-edit#editor-global",false,[["separate","enter",["⏎"]]]],["s","Open selected block(s) in sidebar",":editor/open-selected-blocks-in-sidebar#editor-global",false,[["combo","shift+enter",["⇧","⏎"]]]],["s","Select all blocks",":editor/select-all-blocks#global-prevent-default",false,[["combo","meta+shift+a",["⌘","⇧","A"]]]],["s","Select block below",":editor/select-block-down#editor-global",false,[["combo","alt+down",["⌥","↓"]]]],["s","Select block above",":editor/select-block-up#editor-global",false,[["combo","alt+up",["⌥","↑"]]]],["s","Select parent block",":editor/select-parent#editor-global",false,[["combo","meta+a",["⌘","A"]]]],["s","Set tags for selected block(s)",":editor/set-tags#global-non-editing-only",false,[["separate","p t",["P","T"]]]],["s","Toggle display hidden properties",":editor/toggle-display-hidden-properties#global-non-editing-only",false,[["separate","p a",["P","A"]]]],["c","Formatting"],["s","Bold",":editor/bold#block-editing-only",false,[["combo","meta+b",["⌘","B"]]]],["s","Highlight",":editor/highlight#block-editing-only",false,[["combo","meta+shift+h",["⌘","⇧","H"]]]],["s","HTML Link",":editor/insert-link#global-prevent-default",false,[["combo","meta+l",["⌘","L"]]]],["s","Italics",":editor/italics#block-editing-only",false,[["combo","meta+i",["⌘","I"]]]],["s","Strikethrough",":editor/strike-through#block-editing-only",false,[["combo","meta+shift+s",["⌘","⇧","S"]]]],["c","Toggle"],["s","Toggle number list",":editor/toggle-number-list#global-prevent-default",false,[["separate","t n",["T","N"]]]],["s","Toggle open blocks (collapse or expand all blocks)",":editor/toggle-open-blocks#global-non-editing-only",false,[["separate","t o",["T","O"]]]],["s","Customize appearance",":ui/customize-appearance#global-non-editing-only",false,[["separate","c c",["C","C"]]]],["s","Toggle highlight recent blocks",":ui/highlight-recent-blocks#global-non-editing-only",false,[["combo","",["⌘","C"]],["combo","",["⌘","R"]]]],["s","Toggle whether to display brackets",":ui/toggle-brackets#global-prevent-default",false,[["separate","t b",["T","B"]]]],["s","Toggle Contents in sidebar",":ui/toggle-contents#global-non-editing-only",false,[["combo","alt+shift+c",["⌥","⇧","C"]]]],["s","Toggle help",":ui/toggle-help#global-non-editing-only",false,[["separate","shift+/",["?"]]]],["s","Toggle left sidebar",":ui/toggle-left-sidebar#global-non-editing-only",false,[["separate","t l",["T","L"]]]],["s","Toggle right sidebar",":ui/toggle-right-sidebar#global-non-editing-only",false,[["separate","t r",["T","R"]]]],["s","Toggle settings",":ui/toggle-settings#global-non-editing-only",false,[["separate","t s",["T","S"]],["combo","meta+,",["⌘",","]]]],["s","Toggle between dark/light theme",":ui/toggle-theme#global-non-editing-only",false,[["separate","t t",["T","T"]]]],["s","Toggle wide mode",":ui/toggle-wide-mode#global-non-editing-only",false,[["separate","t w",["T","W"]]]],["c","Plugins"],["c","Others"],["s","Auto-complete: Choose selected item",":auto-complete/complete#auto-complete",false,[["separate","enter",["⏎"]]]],["s","Auto-complete: Cmd + Enter to choose selected item",":auto-complete/meta-complete#auto-complete",false,[["combo","meta+enter",["⌘","⏎"]]]],["s","Auto-complete: Select next item",":auto-complete/next#auto-complete",false,[["separate","down",["↓"]],["combo","ctrl+n",["Ctrl","N"]]]],["s","Auto-complete: Select previous item",":auto-complete/prev#auto-complete",false,[["separate","up",["↑"]],["combo","ctrl+p",["Ctrl","P"]]]],["s","Auto-complete: Open selected item in sidebar",":auto-complete/shift-complete#auto-complete",false,[["combo","shift+enter",["⇧","⏎"]]]],["s","Insert youtube timestamp",":editor/insert-youtube-timestamp#block-editing-only",false,[["combo","meta+shift+y",["⌘","⇧","Y"]]]],["s","Add a graph",":graph/add#editor-global",true,[]],["s","Export public graph pages as HTML",":graph/export-as-html#editor-global",true,[]],["s","Select graph to open",":graph/open#editor-global",false,[["combo","alt+shift+g",["⌥","⇧","G"]]]],["s","Remove a graph",":graph/remove#editor-global",true,[]],["s","Export block EDN data",":misc/export-block-data#global-non-editing-only",true,[]],["s","Export graph's tags and properties EDN data",":misc/export-graph-ontology-data#global-non-editing-only",true,[]],["s","Export page EDN data",":misc/export-page-data#global-non-editing-only",true,[]],["s","Import EDN data",":misc/import-edn-data#global-non-editing-only",true,[]],["s","Add to/remove from favorites",":page/toggle-favorite#editor-global",false,[["combo","meta+shift+f",["⌘","⇧","F"]]]],["s","PDF: Close current pdf doc",":pdf/close#pdf",false,[["combo","alt+x",["⌥","X"]]]],["s","PDF: Search text of current pdf doc",":pdf/find#pdf",false,[["combo","alt+f",["⌥","F"]]]],["s","PDF: Next page of current pdf doc",":pdf/next-page#pdf",false,[["combo","alt+n",["⌥","N"]]]],["s","PDF: Previous page of current pdf doc",":pdf/previous-page#pdf",false,[["combo","alt+p",["⌥","P"]]]],["s","Open publish dialog for current page",":publish/open-dialog#global-prevent-default",false,[["combo","meta+m",["⌘","M"]]]],["s","Rebuild search index",":search/re-index#global-prevent-default",false,[["combo","",["⌘","C"]],["combo","",["⌘","S"]]]],["s","Clear all in the right sidebar",":sidebar/clear#global-prevent-default",false,[["combo","",["⌘","C"]],["combo","",["⌘","C"]]]],["s","Closes the top item in the right sidebar",":sidebar/close-top#global-non-editing-only",false,[["separate","c t",["C","T"]]]],["s","Open today's page in the right sidebar",":sidebar/open-today-page#global-prevent-default",false,[["combo","meta+shift+j",["⌘","⇧","J"]]]],["s","Clear all notifications",":ui/clear-all-notifications#global-non-editing-only",true,[]]]
|}

let jstr j =
  match Js.Json.decodeString j with
  | Some s -> s
  | None -> failwith "keymap_data: bad json"

let jarr j =
  match Js.Json.decodeArray j with
  | Some a -> a
  | None -> failwith "keymap_data: bad json"

let decode_binding j =
  match jarr j with
  | [| kind; data; keys |] ->
      { kind = jstr kind
      ; data = jstr data
      ; keys = Array.to_list (Array.map jstr (jarr keys))
      }
  | _ -> failwith "keymap_data: binding"

let decode_item j =
  let a = jarr j in
  match jstr a.(0) with
  | "c" -> Category (jstr a.(1))
  | "s" ->
      Shortcut
        { label = jstr a.(1)
        ; title = jstr a.(2)
        ; unset =
            (match Js.Json.decodeBoolean a.(3) with
             | Some b -> b
             | None -> failwith "keymap_data: unset")
        ; bindings = Array.to_list (Array.map decode_binding (jarr a.(4)))
        }
  | _ -> failwith "keymap_data: item"

let items : item list =
  Array.to_list
    (Array.map decode_item (jarr (Js.Json.parseExn items_json)))


type filter = All | Custom | Unset | Disabled

let disabled row =
  not row.unset && row.bindings = []

let accepts filter row =
  match filter with
  | All -> true
  | Custom -> false
  | Unset -> row.unset
  | Disabled -> disabled row

module Command_set = Set.Make (String)

let count filter =
  List.fold_left (fun commands -> function
      | Shortcut row when accepts filter row -> Command_set.add row.title commands
      | _ -> commands) Command_set.empty items
  |> Command_set.cardinal

let visible_items ~query ~filter ~label =
  let needle = String.lowercase_ascii (String.trim query) in
  let matches row =
    accepts filter row
    && (needle = "" || Str_util.contains
          (String.lowercase_ascii (label row)) needle)
  in
  let flush category rows result =
    match category, rows with
    | Some category, _ :: _ -> List.rev_append (Category category :: List.rev rows) result
    | _ -> result
  in
  let category, rows, result =
    List.fold_left (fun (category, rows, result) -> function
        | Category next -> Some next, [], flush category rows result
        | Shortcut row when matches row -> category, Shortcut row :: rows, result
        | _ -> category, rows, result) (None, [], []) items
  in
  List.rev (flush category rows result)
