(* Shortcut catalog shared by Keymap, command labels and global dispatch.
   Default bindings have one owner; category rows carry display metadata.
   Kept as embedded JSON literals decoded once at init — the OCaml
   list/record literals emitted a cons skeleton ~30x the size of the
   data itself. Wire shape:
     [ ["c", label] | ["s", label, title] ]
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
[["c","Basics"],["s","Search commands",":command-palette/toggle#global-prevent-default"],["s","Copy (copies either selection, or block reference)",":editor/copy#editor-global"],["s","Copy selections as text",":editor/copy-text#editor-global"],["s","Cut",":editor/cut#editor-global"],["s","Indent block",":editor/indent#editor-global"],["s","Create new block",":editor/new-block#block-editing-only"],["s","New line in current block",":editor/new-line#block-editing-only"],["s","Outdent block",":editor/outdent#editor-global"],["s","Quick add",":editor/quick-add#global-prevent-default"],["s","Redo",":editor/redo#global-prevent-default"],["s","Select all blocks",":editor/select-all-blocks#global-prevent-default"],["s","Select parent block",":editor/select-parent#editor-global"],["s","Undo",":editor/undo#global-prevent-default"],["s","Search pages and blocks",":go/search#global-prevent-default"],["s","Search blocks in page",":go/search-in-page#global-prevent-default"],["s","Search themes",":go/search-themes#global-prevent-default"],["c","Navigation"],["s","Collapse",":editor/collapse-block-children#editor-global"],["s","Move cursor down / Select down",":editor/down#editor-global"],["s","Expand",":editor/expand-block-children#editor-global"],["s","Jump to a property key or value",":editor/jump#editor-global"],["s","Move cursor left / Open selected block at beginning",":editor/left#editor-global"],["s","Move cursor right / Open selected block at end",":editor/right#editor-global"],["s","Toggle expand/collapse",":editor/toggle-block-children#editor-global"],["s","Toggle open blocks (collapse or expand all blocks)",":editor/toggle-open-blocks#global-non-editing-only"],["s","Move cursor up / Select up",":editor/up#editor-global"],["s","Go to all graphs",":go/all-graphs#global-non-editing-only"],["s","Go to all pages",":go/all-pages#global-non-editing-only"],["s","Backwards",":go/backward#global-prevent-default"],["s","Toggle flashcards",":go/flashcards#global-non-editing-only"],["s","Forwards",":go/forward#global-prevent-default"],["s","Go to home",":go/home#global-non-editing-only"],["s","Go to journals",":go/journals#global-non-editing-only"],["s","Go to keyboard shortcuts",":go/keyboard-shortcuts#global-non-editing-only"],["s","Go to next journal",":go/next-journal#global-non-editing-only"],["s","Go to previous journal",":go/prev-journal#global-non-editing-only"],["s","Go to tomorrow",":go/tomorrow#global-non-editing-only"],["c","Block editing general"],["s","Backspace / Delete backwards",":editor/backspace#block-editing-only"],["s","Rotate the TODO state",":editor/cycle-todo#editor-global"],["s","Delete / Delete forwards",":editor/delete#block-editing-only"],["s","Escape editing",":editor/escape-editing#block-editing-only"],["s","Follow link under cursor",":editor/follow-link#block-editing-only"],["s","Indent block",":editor/indent#editor-global"],["s","Move block down",":editor/move-block-down#editor-global"],["s","Move block up",":editor/move-block-up#editor-global"],["s","Move blocks to",":editor/move-blocks#editor-global"],["s","Create new block",":editor/new-block#block-editing-only"],["s","New line in current block",":editor/new-line#block-editing-only"],["s","Open link in sidebar",":editor/open-link-in-sidebar#block-editing-only"],["s","Outdent block",":editor/outdent#editor-global"],["s","Zoom in editing block / Forwards otherwise",":editor/zoom-in#block-editing-only"],["s","Zoom out editing block / Backwards otherwise",":editor/zoom-out#block-editing-only"],["c","Block command editing"],["s","Backspace / Delete backwards",":editor/backspace#block-editing-only"],["s","Delete a word backwards",":editor/backward-kill-word#block-editing-only"],["s","Move cursor backward a word",":editor/backward-word#block-editing-only"],["s","Move cursor to the beginning of a block",":editor/beginning-of-block#block-editing-only"],["s","Delete entire block content",":editor/clear-block#block-editing-only"],["s","Copy a block embed pointing to the current block",":editor/copy-embed#block-editing-only"],["s","Move cursor to the end of a block",":editor/end-of-block#block-editing-only"],["s","Delete a word forwards",":editor/forward-kill-word#block-editing-only"],["s","Move cursor forward a word",":editor/forward-word#block-editing-only"],["s","Delete line after cursor position",":editor/kill-line-after#block-editing-only"],["s","Delete line before cursor position",":editor/kill-line-before#block-editing-only"],["s","Paste text into one block at point",":editor/paste-text-in-one-block-at-point#block-editing-only"],["s","Select content below",":editor/select-down#editor-global"],["s","Select content above",":editor/select-up#editor-global"],["c","Block selection (press Esc to quit selection)"],["s","Add comment",":editor/add-comment#global-non-editing-only"],["s","Add property",":editor/add-property#global-prevent-default"],["s","Add task deadline to selected block",":editor/add-property-deadline#global-non-editing-only"],["s","Add icon",":editor/add-property-icon#global-non-editing-only"],["s","Add task priority to selected block",":editor/add-property-priority#global-non-editing-only"],["s","Add task status to selected block",":editor/add-property-status#global-non-editing-only"],["s","Add reaction",":editor/add-reaction#global-non-editing-only"],["s","Delete selected blocks",":editor/delete-selection#editor-global"],["s","Edit selected block",":editor/open-edit#editor-global"],["s","Open selected block(s) in sidebar",":editor/open-selected-blocks-in-sidebar#editor-global"],["s","Select all blocks",":editor/select-all-blocks#global-prevent-default"],["s","Select block below",":editor/select-block-down#editor-global"],["s","Select block above",":editor/select-block-up#editor-global"],["s","Select parent block",":editor/select-parent#editor-global"],["s","Set tags for selected block(s)",":editor/set-tags#global-non-editing-only"],["s","Toggle display hidden properties",":editor/toggle-display-hidden-properties#global-non-editing-only"],["c","Formatting"],["s","Bold",":editor/bold#block-editing-only"],["s","Highlight",":editor/highlight#block-editing-only"],["s","HTML Link",":editor/insert-link#global-prevent-default"],["s","Italics",":editor/italics#block-editing-only"],["s","Strikethrough",":editor/strike-through#block-editing-only"],["c","Toggle"],["s","Toggle number list",":editor/toggle-number-list#global-prevent-default"],["s","Toggle open blocks (collapse or expand all blocks)",":editor/toggle-open-blocks#global-non-editing-only"],["s","Customize appearance",":ui/customize-appearance#global-non-editing-only"],["s","Toggle highlight recent blocks",":ui/highlight-recent-blocks#global-non-editing-only"],["s","Toggle whether to display brackets",":ui/toggle-brackets#global-prevent-default"],["s","Toggle Contents in sidebar",":ui/toggle-contents#global-non-editing-only"],["s","Toggle help",":ui/toggle-help#global-non-editing-only"],["s","Toggle left sidebar",":ui/toggle-left-sidebar#global-non-editing-only"],["s","Toggle right sidebar",":ui/toggle-right-sidebar#global-non-editing-only"],["s","Toggle settings",":ui/toggle-settings#global-non-editing-only"],["s","Toggle between dark/light theme",":ui/toggle-theme#global-non-editing-only"],["s","Toggle wide mode",":ui/toggle-wide-mode#global-non-editing-only"],["c","Plugins"],["c","Others"],["s","Auto-complete: Choose selected item",":auto-complete/complete#auto-complete"],["s","Auto-complete: Cmd + Enter to choose selected item",":auto-complete/meta-complete#auto-complete"],["s","Auto-complete: Select next item",":auto-complete/next#auto-complete"],["s","Auto-complete: Select previous item",":auto-complete/prev#auto-complete"],["s","Auto-complete: Open selected item in sidebar",":auto-complete/shift-complete#auto-complete"],["s","Insert youtube timestamp",":editor/insert-youtube-timestamp#block-editing-only"],["s","Add a graph",":graph/add#editor-global"],["s","Export public graph pages as HTML",":graph/export-as-html#editor-global"],["s","Select graph to open",":graph/open#editor-global"],["s","Remove a graph",":graph/remove#editor-global"],["s","Export block EDN data",":misc/export-block-data#global-non-editing-only"],["s","Export graph's tags and properties EDN data",":misc/export-graph-ontology-data#global-non-editing-only"],["s","Export page EDN data",":misc/export-page-data#global-non-editing-only"],["s","Import EDN data",":misc/import-edn-data#global-non-editing-only"],["s","Add to/remove from favorites",":page/toggle-favorite#editor-global"],["s","PDF: Close current pdf doc",":pdf/close#pdf"],["s","PDF: Search text of current pdf doc",":pdf/find#pdf"],["s","PDF: Next page of current pdf doc",":pdf/next-page#pdf"],["s","PDF: Previous page of current pdf doc",":pdf/previous-page#pdf"],["s","Open publish dialog for current page",":publish/open-dialog#global-prevent-default"],["s","Rebuild search index",":search/re-index#global-prevent-default"],["s","Clear all in the right sidebar",":sidebar/clear#global-prevent-default"],["s","Closes the top item in the right sidebar",":sidebar/close-top#global-non-editing-only"],["s","Open today's page in the right sidebar",":sidebar/open-today-page#global-prevent-default"],["s","Clear all notifications",":ui/clear-all-notifications#global-non-editing-only"]]
|}

let jstr j =
  match Js.Json.decodeString j with
  | Some s -> s
  | None -> failwith "keymap_data: bad json"

let jarr j =
  match Js.Json.decodeArray j with
  | Some a -> a
  | None -> failwith "keymap_data: bad json"

type shortcut = Unbound | Disabled | Binds of string list

module Command_map = Map.Make (String)

let defaults_json = {|
[["command-palette/toggle",["mod+shift+p"]],["editor/copy",["mod+c"]],["editor/copy-text",["mod+shift+c"]],["editor/cut",["mod+x"]],["editor/indent",["tab"]],["editor/new-block",["enter"]],["editor/new-line",["shift+enter"]],["editor/outdent",["shift+tab"]],["editor/quick-add",["mod+e"]],["editor/redo",["mod+shift+z","mod+y"]],["editor/select-all-blocks",["mod+shift+a"]],["editor/select-parent",["mod+a"]],["editor/undo",["mod+z"]],["go/search",["mod+k"]],["go/search-in-page",["mod+shift+k"]],["go/search-themes",["mod+shift+i"]],["editor/collapse-block-children",["mod+up"]],["editor/down",["down","ctrl+n"]],["editor/expand-block-children",["mod+down"]],["editor/jump",["mod+j"]],["editor/left",["left"]],["editor/right",["right"]],["editor/toggle-block-children",["mod+;"]],["editor/toggle-open-blocks",["t o"]],["editor/up",["up","ctrl+p"]],["go/all-graphs",["g shift+g"]],["go/all-pages",["g a"]],["go/backward",["mod+open-square-bracket"]],["go/flashcards",["g f","t c"]],["go/forward",["mod+close-square-bracket"]],["go/home",["g h"]],["go/journals",["g j"]],["go/keyboard-shortcuts",["g s"]],["go/next-journal",["g n"]],["go/prev-journal",["g p"]],["go/tomorrow",["g t"]],["editor/backspace",["backspace"]],["editor/cycle-todo",["mod+enter"]],["editor/delete",["delete"]],["editor/escape-editing",null],["editor/follow-link",["mod+o"]],["editor/move-block-down",["mod+shift+down"]],["editor/move-block-up",["mod+shift+up"]],["editor/move-blocks",["mod+shift+m"]],["editor/open-link-in-sidebar",["mod+shift+o"]],["editor/zoom-in",["mod+.","mod+shift+."]],["editor/zoom-out",["mod+,"]],["editor/backward-kill-word",[]],["editor/backward-word",["ctrl+shift+b"]],["editor/beginning-of-block",[]],["editor/clear-block",["ctrl+l"]],["editor/copy-embed",["mod+shift+e"]],["editor/end-of-block",[]],["editor/forward-kill-word",["ctrl+w"]],["editor/forward-word",["ctrl+shift+f"]],["editor/kill-line-after",[]],["editor/kill-line-before",["ctrl+u"]],["editor/paste-text-in-one-block-at-point",["mod+shift+v"]],["editor/select-down",["shift+down"]],["editor/select-up",["shift+up"]],["editor/add-comment",["ctrl+space"]],["editor/add-property",["mod+p"]],["editor/add-property-deadline",["p d"]],["editor/add-property-icon",["p i"]],["editor/add-property-priority",["p p"]],["editor/add-property-status",["p s"]],["editor/add-reaction",["p r"]],["editor/delete-selection",["backspace","delete"]],["editor/open-edit",["enter"]],["editor/open-selected-blocks-in-sidebar",["shift+enter"]],["editor/select-block-down",["alt+down"]],["editor/select-block-up",["alt+up"]],["editor/set-tags",["p t"]],["editor/toggle-display-hidden-properties",["p a"]],["editor/bold",["mod+b"]],["editor/highlight",["mod+shift+h"]],["editor/insert-link",["mod+l"]],["editor/italics",["mod+i"]],["editor/strike-through",["mod+shift+s"]],["editor/toggle-number-list",["t n"]],["ui/customize-appearance",["c c"]],["ui/highlight-recent-blocks",["mod+c mod+r"]],["ui/toggle-brackets",["t b"]],["ui/toggle-contents",["alt+shift+c"]],["ui/toggle-help",["shift+/"]],["ui/toggle-left-sidebar",["t l"]],["ui/toggle-right-sidebar",["t r"]],["ui/toggle-settings",["t s","mod+,"]],["ui/toggle-theme",["t t"]],["ui/toggle-wide-mode",["t w"]],["auto-complete/complete",["enter"]],["auto-complete/meta-complete",["mod+enter"]],["auto-complete/next",["down","ctrl+n"]],["auto-complete/prev",["up","ctrl+p"]],["auto-complete/shift-complete",["shift+enter"]],["editor/insert-youtube-timestamp",["mod+shift+y"]],["graph/add",null],["graph/export-as-html",null],["graph/open",["alt+shift+g"]],["graph/remove",null],["misc/export-block-data",null],["misc/export-graph-ontology-data",null],["misc/export-page-data",null],["misc/import-edn-data",null],["page/toggle-favorite",["mod+shift+f"]],["pdf/close",["alt+x"]],["pdf/find",["alt+f"]],["pdf/next-page",["alt+n"]],["pdf/previous-page",["alt+p"]],["publish/open-dialog",["mod+m"]],["search/re-index",["mod+c mod+s"]],["sidebar/clear",["mod+c mod+c"]],["sidebar/close-top",["c t"]],["sidebar/open-today-page",["mod+shift+j"]],["ui/clear-all-notifications",null],["graph/db-add",[]],["ui/toggle-document-mode",["t d"]],["ui/select-theme-color",["t i"]],["ui/goto-plugins",["t p"]],["dev/show-block-data",null],["dev/show-block-ast",null],["dev/show-page-data",null],["dev/validate-db",null],["dev/recompute-checksum",null],["dev/export-client-ops-sqlite",null],["dev/gc-graph",null],["dev/rtc-stop",null],["dev/rtc-start",null]]
|}

let default_shortcuts =
  Array.fold_left
    (fun result entry ->
      match jarr entry with
      | [| id; value |] ->
          let binding =
            match Js.Json.decodeNull value with
            | Some _ -> Unbound
            | None ->
                (match Array.to_list (Array.map jstr (jarr value)) with
                 | [] -> Disabled
                 | bindings -> Binds bindings)
          in
          Command_map.add (jstr id) binding result
      | _ -> invalid_arg "Keymap_data: invalid default shortcut")
    Command_map.empty (jarr (Js.Json.parseExn defaults_json))

let default_shortcut id = Command_map.find id default_shortcuts
let user_shortcuts = ref Command_map.empty
let shortcut_revision = ref 0
let revision () = !shortcut_revision

let reload_shortcuts () =
  let config =
    match Ui_services.storage_get "ls-shortcuts" with
    | None -> Wire.Map []
    | Some value -> Edn.parse value
  in
  let string = function
    | Wire.String value when String.trim value <> "" ->
        String.lowercase_ascii (String.trim value)
    | _ -> invalid_arg "Keymap_data: invalid user shortcut stroke"
  in
  let entries = match config with
    | Wire.Map entries -> entries
    | _ -> invalid_arg "Keymap_data: user shortcuts must be a map"
  in
  let configured = List.fold_left (fun result (key, value) ->
      let id = match key with
        | Wire.Keyword id | Wire.String id -> id
        | _ -> invalid_arg "Keymap_data: invalid shortcut command"
      in
      match value with
      | Wire.Nil -> result
      | Wire.Bool false -> Command_map.add id Disabled result
      | Wire.String _ -> Command_map.add id (Binds [string value]) result
      | Wire.Array values | Wire.List values ->
          let binding = match List.map string values with
            | [] -> Disabled | bindings -> Binds bindings
          in
          Command_map.add id binding result
      | _ -> invalid_arg "Keymap_data: invalid user shortcut binding")
      Command_map.empty entries
  in
  if not (Command_map.equal (=) configured !user_shortcuts) then begin
    user_shortcuts := configured;
    incr shortcut_revision
  end

let effective_shortcut id =
  match Command_map.find_opt id !user_shortcuts with
  | Some binding -> binding
  | None -> default_shortcut id

let command_id title =
  let title = String.sub title 1 (String.length title - 1) in
  match String.index_opt title '#' with
  | Some index -> String.sub title 0 index
  | None -> title

let binding_of_data ~mac value =
  let strokes = String.split_on_char ' ' value |> List.filter ((<>) "")
    |> List.map (fun stroke ->
        String.split_on_char '+' stroke
        |> List.map (function "mod" -> if mac then "meta" else "ctrl" | key -> key)
        |> String.concat "+") in
  let data = String.concat " " strokes in
  let combo = String.contains (List.hd strokes) '+' in
  let kind = if combo && List.length strokes > 1 then "chord"
    else if combo then "combo" else "separate" in
  let keys = if kind = "chord" then []
    else List.concat_map (fun stroke ->
        if stroke = "shift+/" then ["?"] else Keymap_record.keycaps stroke) strokes in
  { kind; data; keys }

let row_with_shortcut ~mac row = function
  | Unbound -> { row with unset = true; bindings = [] }
  | Disabled -> { row with unset = false; bindings = [] }
  | Binds bindings ->
      { row with unset = false; bindings = List.map (binding_of_data ~mac) bindings }

let custom row = Command_map.mem (command_id row.title) !user_shortcuts

let decode_item j =
  let a = jarr j in
  match jstr a.(0) with
  | "c" -> Category (jstr a.(1))
  | "s" ->
      let row = { label = jstr a.(1); title = jstr a.(2); unset = false; bindings = [] } in
      Shortcut (row_with_shortcut ~mac:true row (default_shortcut (command_id row.title)))
  | _ -> failwith "keymap_data: item"

let items : item list =
  Array.to_list
    (Array.map decode_item (jarr (Js.Json.parseExn items_json)))

let cached_items = ref None

let current_items () =
  let mac = Ui_services.env_is_mac () in
  match !cached_items with
  | Some (revision, platform_mac, items)
    when revision = !shortcut_revision && platform_mac = mac -> items
  | _ ->
      let resolved = List.map (function
        | Category _ as item -> item
        | Shortcut row -> Shortcut (row_with_shortcut ~mac
            row (effective_shortcut (command_id row.title)))) items in
      cached_items := Some (!shortcut_revision, mac, resolved);
      resolved

type filter = All | Custom | Unset | Disabled

let disabled row =
  not row.unset && row.bindings = []

let accepts filter row =
  match filter with
  | All -> true
  | Custom -> custom row
  | Unset -> row.unset
  | Disabled -> disabled row

module Command_set = Set.Make (String)

let unique_rows items =
  let _, rows =
    List.fold_left
      (fun (seen, rows) -> function
        | Shortcut row when not (Command_set.mem row.title seen) ->
            (Command_set.add row.title seen, row :: rows)
        | _ -> (seen, rows))
      (Command_set.empty, []) items
  in
  List.rev rows

let command_name row =
  let title = String.sub row.title 1 (String.length row.title - 1) in
  let id =
    match String.index_opt title '#' with
    | Some index -> String.sub title 0 index
    | None -> title
  in
  match String.rindex_opt id '/' with
  | Some index -> String.sub id (index + 1) (String.length id - index - 1)
  | None -> id

let query_items ~query ~label =
  let query = String.trim query in
  let flush category rows result =
    let rows = List.rev rows in
    let rows =
      if query = "" then rows
      else
        Fuzzy.fuzzy_search ~limit:max_int
          ~extract:(fun row -> command_name row ^ " " ^ label row)
          rows query
    in
    match (category, rows) with
    | Some category, _ when query = "" || rows <> [] ->
        List.rev_append
          (Category category :: List.map (fun row -> Shortcut row) rows)
          result
    | _ -> result
  in
  let category, rows, result =
    List.fold_left
      (fun (category, rows, result) -> function
        | Category next -> (Some next, [], flush category rows result)
        | Shortcut row -> (category, row :: rows, result))
      (None, [], [])
      (current_items ())
  in
  List.rev (flush category rows result)

let count ?(query = "") ?(label = fun row -> row.label) filter =
  query_items ~query ~label |> unique_rows
  |> List.fold_left
       (fun count row -> if accepts filter row then count + 1 else count)
       0

let matches_keystroke row keystroke =
  let first value =
    List.hd (String.split_on_char ' ' value) |> Keymap_record.canonical
  in
  List.exists (fun binding -> first binding.data = first keystroke) row.bindings

let visible_items ~keystroke ~query ~filter ~label =
  let matched = query_items ~query ~label in
  if filter = All && keystroke = "" then matched
  else
    unique_rows matched
    |> List.filter_map (fun row ->
        if
          accepts filter row
          && (keystroke = "" || matches_keystroke row keystroke)
        then Some (Shortcut row)
        else None)
