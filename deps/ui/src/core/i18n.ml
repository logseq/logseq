(* Single i18n surface: en.edn-keyed lookups (t/tf/t1) plus the named
   English literals the areas used to keep in per-area tables
   (Strings/Views_i18n/Properties_i18n/Ui_strings/Graphs_text — all
   merged here). Values match src/resources/dicts/en.edn so e2e text
   selectors hit; TODO(i18n): swap for real dict loading when it lands. *)

(* substring search helpers (case-sensitive contains, case-insensitive
   contains/index) shared by popups, menus, icon picker, plugin list *)

let contains hay needle =
  let lh = String.length hay and ln = String.length needle in
  let rec go i = i + ln <= lh && (String.sub hay i ln = needle || go (i + 1)) in
  ln = 0 || go 0

let contains_ci hay needle =
  let h = String.lowercase_ascii hay and n = String.lowercase_ascii needle in
  contains h n

let index_ci hay needle =
  let h = String.lowercase_ascii hay and n = String.lowercase_ascii needle in
  let ln = String.length n and lh = String.length h in
  let rec go i =
    if ln = 0 || i + ln > lh then None
    else if String.sub h i ln = n then Some i
    else go (i + 1)
  in
  go 0

(* "{1}" / "{2}" placeholder substitution *)
let replace_all s pat rep =
  let plen = String.length pat in
  let b = Buffer.create (String.length s) in
  let i = ref 0 in
  while !i <= String.length s - plen do
    if String.sub s !i plen = pat then (
      Buffer.add_string b rep;
      i := !i + plen)
    else (
      Buffer.add_char b (String.get s !i);
      incr i)
  done;
  Buffer.add_string b (String.sub s !i (String.length s - !i));
  Buffer.contents b

(* positional substitution on a literal template *)
let sub s args =
  List.fold_left
    (fun (acc, i) a ->
      (replace_all acc ("{" ^ string_of_int i ^ "}") a, i + 1))
    (s, 1) args
  |> fst

let t (key : string) : string =
  match key with
  | "cmdk.create/page" -> "Create page"
  | "cmdk.create/tag" -> "Create tag"
  | "cmdk.info/create-page" -> "Create page called '{1}'"
  | "cmdk.info/create-tag" -> "Create tag called '{1}'"
  | "cmdk.input/default-placeholder" -> "What are you looking for?"
  | "cmdk.input/move-blocks-placeholder" -> "Move blocks to"
  | "cmdk.action/search" -> "Search"
  | "cmdk.groups/nodes" -> "Nodes"
  | "cmdk.groups/commands" -> "Commands"
  | "cmdk.groups/filters" -> "Filters"
  | "cmdk.groups/create" -> "Create"
  | "cmdk.groups/current-page" -> "Current page"
  | "cmdk.groups/recently-updated" -> "Recently updated"
  | "cmdk.groups/files" -> "Files"
  | "cmdk.groups/codes" -> "Code"
  | "cmdk.groups/themes" -> "Themes"
  | "cmdk.filter/current-page" -> "Search only current page"
  | "cmdk.filter/nodes" -> "Search only nodes"
  | "cmdk.filter/codes" -> "Search only codes"
  | "cmdk.filter/commands" -> "Search only commands"
  | "cmdk.filter/files" -> "Search only files"
  | "cmdk.filter/themes" -> "Search only themes"
  | "cmdk.filter/only-label" -> "Search only:"
  | "cmdk.filter/add" -> "Add filter to search"
  | "cmdk.tip/clear-filter" -> "Press {1} to clear search filter"
  | "cmdk.tip/filter-results" -> "Press {1} to filter search results"
  | "cmdk.tip/open-sidebar" -> "Press {1} to open search in the sidebar"
  | "cmdk.action/open" -> "Open"
  | "cmdk.action/open-in-sidebar" -> "Open in sidebar"
  | "cmdk.action/copy-ref" -> "Copy ref"
  | "cmdk.action/create" -> "Create"
  | "cmdk.action/filter" -> "Filter"
  | "cmdk.action/trigger" -> "Trigger"
  | "search/no-result" -> "No matched result"
  | "command.go/journals" -> "Go to journals"
  | "command.go/all-graphs" -> "Go to all graphs"
  | "command.go/all-pages" -> "Go to all pages"
  | "command.graph/db-add" -> "Add a DB graph"
  | "command.editor/move-blocks" -> "Move blocks to"
  | "command.editor/add-reaction" -> "Add reaction"
  | "sidebar.right/open" -> "Open in sidebar"
  | "block.comments/add-comment" -> "Add comment"
  | "block/copy-ref" -> "Copy block ref"
  | "block.macro/embed-deprecated" ->
      "{{embed}} is deprecated. Use '/Node embed' command instead."
  | "export/copy-or-export-as" -> "Copy / Export as.."
  | "editor/cut" -> "Cut"
  | "editor/delete-selection" -> "Delete selected blocks"
  | "context-menu/make-a-flashcard" -> "Make a Flashcard"
  | "context-menu/toggle-number-list" -> "Toggle number list"
  | "context-menu/set-icon" -> "Set icon"
  | "context-menu/developer-tools" -> "Developer tools"
  | "editor/expand-block-children" -> "Expand all"
  | "editor/collapse-block-children" -> "Collapse all"
  | "editor/auto-heading" -> "Auto heading"
  | "editor/remove-heading" -> "Remove heading"
  | "ui/remove-background" -> "Remove background"
  | "ui/copy" -> "Copy"
  | "ui/show-more" -> "Show more"
  | "ui/show-less" -> "Show less"
  | "cmdk.tip/label" -> "Tip:"
  | "editor/cycle-todo" -> "Rotate the TODO state"
  | "editor/search-for-node" -> "Search for a node"
  | "editor/search-for-tag" -> "Search for a tag"
  | "editor/display-tag-inline-hint" ->
      "to display this tag inline instead of at the end of this node."
  | "editor/block-search" -> "Search for a block"
  | "editor/search-template-placeholder" -> "Search for a template"
  | "editor.quick-add/title" -> "Quick add"
  | "editor.quick-add/add-to-today" -> "Add to today"
  | "journal/add-blocks-to-today-success" -> "Blocks added to today!"
  | "editor.slash/group-basic" -> "BASIC"
  | "editor.slash/group-format" -> "FORMAT"
  | "editor.slash/group-heading" -> "Heading"
  | "editor.slash/group-task-status" -> "TASK STATUS"
  | "editor.slash/group-task-date" -> "TASK DATE"
  | "editor.slash/group-priority" -> "PRIORITY"
  | "editor.slash/group-time-and-date" -> "TIME & DATE"
  | "editor.slash/group-list-type" -> "LIST TYPE"
  | "editor.slash/group-advanced" -> "ADVANCED"
  | "ui/link" -> "Link"
  | "editor/new-page" -> "New page"
  | "editor/new-tag" -> "New tag"
  | "editor/heading" -> "Heading {1}"
  | "editor.slash/node-reference" -> "Node reference"
  | "editor.slash/node-embed" -> "Node embed"
  | "editor.slash/image-link" -> "Image link"
  | "editor.slash/underline" -> "Underline"
  | "editor.slash/code-block" -> "Code block"
  | "class.built-in/quote-block" -> "Quote"
  | "editor.slash/math-block" -> "Math block"
  | "editor.slash/normal-text" -> "Normal text"
  | "editor.slash/clear-heading" -> "Clear heading"
  | "property.status/backlog" -> "Backlog"
  | "property.status/todo" -> "Todo"
  | "property.status/doing" -> "Doing"
  | "property.status/in-review" -> "In Review"
  | "property.status/done" -> "Done"
  | "property.status/canceled" -> "Canceled"
  | "property.built-in/deadline" -> "Deadline"
  | "property.built-in/scheduled" -> "Scheduled"
  | "property.built-in/query" -> "Query"
  | "editor.slash/no-priority" -> "No priority"
  | "editor.slash/heading-label" -> "Heading {1}"
  | "editor.slash/priority-label" -> "Priority {1}"
  | "property.priority/low" -> "Low"
  | "property.priority/medium" -> "Medium"
  | "property.priority/high" -> "High"
  | "property.priority/urgent" -> "Urgent"
  | "date.nlp/next-week" -> "Next week"
  | "date.nlp/this-week" -> "This week"
  | "date.nlp/last-week" -> "Last week"
  | "date.nlp/next-month" -> "Next month"
  | "date.nlp/this-month" -> "This month"
  | "date.nlp/last-month" -> "Last month"
  | "date.nlp/next-year" -> "Next year"
  | "date.nlp/tomorrow" -> "Tomorrow"
  | "date.nlp/yesterday" -> "Yesterday"
  | "date.nlp/today" -> "Today"
  | "editor.slash/current-time" -> "Current time"
  | "editor.slash/date-picker" -> "Date picker"
  | "editor.slash/number-list" -> "Number list"
  | "editor.slash/number-children" -> "Number children"
  | "editor.slash/node-reference-desc" ->
      "Create a backlink to a node (a page or a block)"
  | "editor.slash/node-embed-desc" -> "Embed a node here"
  | "editor.slash/link-desc" -> "Create a HTTP link"
  | "editor.slash/image-link-desc" -> "Create a HTTP link to an image"
  | "editor.slash/underline-desc" -> "Create an underline text decoration"
  | "editor.slash/code-block-desc" -> "Insert code block"
  | "editor.slash/quote-desc" -> "Create a quote block"
  | "editor.slash/math-block-desc" -> "Create a LaTeX block"
  | "editor.slash/normal-text-desc" -> "Clear heading and set to normal text"
  | "editor.slash/status-desc" -> "Set status to {1}"
  | "editor.slash/priority-desc" -> "Set priority to {1}"
  | "editor.slash/tomorrow-desc" -> "Insert the date of tomorrow"
  | "editor.slash/yesterday-desc" -> "Insert the date of yesterday"
  | "editor.slash/today-desc" -> "Insert the date of today"
  | "editor.slash/current-time-desc" -> "Insert current time"
  | "editor.slash/date-picker-desc" -> "Pick a date and insert here"
  | "block.comments/add-comment-command-desc" ->
      "Add a comment to this block."
  | "editor.slash/advanced-query-desc" -> "Create an advanced query block"
  | "editor.slash/query-function-desc" -> "Create a query function"
  | "editor.slash/calculator-desc" -> "Insert a calculator"
  | "editor.slash/upload-asset-desc" ->
      "Upload file types like image, PDF, DOCX, etc."
  | "editor.slash/template-desc" -> "Insert a created template here"
  | "editor.slash/advanced-query" -> "Advanced Query"
  | "editor.slash/query-function" -> "Query function"
  | "editor.slash/calculator" -> "Calculator"
  | "editor.slash/upload-asset" -> "Upload an asset"
  | "class.built-in/template" -> "Template"
  | "editor.slash/cloze" -> "Cloze"
  | "editor.slash/embed-html" -> "Embed HTML"
  | "editor.slash/embed-video-url" -> "Embed Video URL"
  | "editor.slash/embed-youtube-timestamp" -> "Embed YouTube timestamp"
  | "editor.slash/embed-twitter-tweet" -> "Embed Twitter tweet"
  | "command.editor/add-property" -> "Add property"
  | "command.editor/add-property-deadline" -> "Add task deadline to selected block"
  | "command.editor/add-property-priority" -> "Add task priority to selected block"
  | "command.editor/add-property-status" -> "Add task status to selected block"
  | "command.editor/add-comment" -> "Add comment"
  | "command.editor/backspace" -> "Backspace / Delete backwards"
  | "command.editor/backward-kill-word" -> "Delete a word backwards"
  | "command.editor/backward-word" -> "Move cursor backward a word"
  | "command.editor/beginning-of-block" -> "Move cursor to the beginning of a block"
  | "command.editor/bold" -> "Bold"
  | "command.editor/clear-block" -> "Delete entire block content"
  | "command.editor/collapse-block-children" -> "Collapse"
  | "command.editor/copy" -> "Copy (copies either selection, or block reference)"
  | "command.editor/copy-embed" -> "Copy a block embed pointing to the current block"
  | "command.editor/copy-text" -> "Copy selections as text"
  | "command.editor/cut" -> "Cut"
  | "command.editor/cycle-todo" -> "Rotate the TODO state"
  | "command.editor/delete" -> "Delete / Delete forwards"
  | "command.editor/delete-selection" -> "Delete selected blocks"
  | "command.editor/down" -> "Move cursor down / Select down"
  | "command.editor/end-of-block" -> "Move cursor to the end of a block"
  | "command.editor/escape-editing" -> "Escape editing"
  | "command.editor/expand-block-children" -> "Expand"
  | "command.editor/follow-link" -> "Follow link under cursor"
  | "command.editor/forward-kill-word" -> "Delete a word forwards"
  | "command.editor/forward-word" -> "Move cursor forward a word"
  | "command.editor/highlight" -> "Highlight"
  | "command.editor/indent" -> "Indent block"
  | "command.editor/insert-link" -> "HTML Link"
  | "command.editor/insert-youtube-timestamp" -> "Insert youtube timestamp"
  | "command.editor/italics" -> "Italics"
  | "command.editor/jump" -> "Jump to a property key or value"
  | "command.editor/kill-line-after" -> "Delete line after cursor position"
  | "command.editor/kill-line-before" -> "Delete line before cursor position"
  | "command.editor/left" -> "Move cursor left / Open selected block at beginning"
  | "command.editor/move-block-down" -> "Move block down"
  | "command.editor/move-block-up" -> "Move block up"
  | "command.editor/new-block" -> "Create new block"
  | "command.editor/new-line" -> "New line in current block"
  | "command.editor/open-edit" -> "Edit selected block"
  | "command.editor/open-link-in-sidebar" -> "Open link in sidebar"
  | "command.editor/open-selected-blocks-in-sidebar" -> "Open selected block(s) in sidebar"
  | "command.editor/outdent" -> "Outdent block"
  | "command.editor/paste-text-in-one-block-at-point" -> "Paste text into one block at point"
  | "command.editor/quick-add" -> "Quick add"
  | "command.editor/redo" -> "Redo"
  | "command.editor/right" -> "Move cursor right / Open selected block at end"
  | "command.editor/select-all-blocks" -> "Select all blocks"
  | "command.editor/select-block-down" -> "Select block below"
  | "command.editor/select-block-up" -> "Select block above"
  | "command.editor/select-down" -> "Select content below"
  | "command.editor/select-parent" -> "Select parent block"
  | "command.editor/select-up" -> "Select content above"
  | "command.editor/set-tags" -> "Set tags for selected block(s)"
  | "command.editor/strike-through" -> "Strikethrough"
  | "command.editor/toggle-block-children" -> "Toggle expand/collapse"
  | "command.editor/toggle-display-hidden-properties" -> "Toggle display hidden properties"
  | "command.editor/toggle-number-list" -> "Toggle number list"
  | "command.editor/toggle-open-blocks" -> "Toggle open blocks (collapse or expand all blocks)"
  | "command.editor/undo" -> "Undo"
  | "command.editor/up" -> "Move cursor up / Select up"
  | "command.editor/zoom-in" -> "Zoom in editing block / Forwards otherwise"
  | "command.editor/zoom-out" -> "Zoom out editing block / Backwards otherwise"
  | "command.command-palette/toggle" -> "Search commands"
  | "command.go/backward" -> "Backwards"
  | "command.go/flashcards" -> "Toggle flashcards"
  | "command.go/forward" -> "Forwards"
  | "command.go/home" -> "Go to home"
  | "command.go/keyboard-shortcuts" -> "Go to keyboard shortcuts"
  | "command.go/next-journal" -> "Go to next journal"
  | "command.go/prev-journal" -> "Go to previous journal"
  | "command.go/search" -> "Search pages and blocks"
  | "command.go/search-in-page" -> "Search blocks in page"
  | "command.go/search-themes" -> "Search themes"
  | "command.go/tomorrow" -> "Go to tomorrow"
  | "command.graph/add" -> "Add a graph"
  | "command.graph/db-save" -> "Save the current db to the disk (~/logseq/graphs/your-current-graph)"
  | "command.graph/export-as-html" -> "Export public graph pages as HTML"
  | "command.graph/open" -> "Select graph to open"
  | "command.graph/remove" -> "Remove a graph"
  | "command.misc/copy" -> "Copy"
  | "command.misc/export-block-data" -> "Export block EDN data"
  | "command.misc/export-graph-ontology-data" -> "Export graph's tags and properties EDN data"
  | "command.misc/export-page-data" -> "Export page EDN data"
  | "command.misc/import-edn-data" -> "Import EDN data"
  | "command.page/toggle-favorite" -> "Add to/remove from favorites"
  | "command.publish/open-dialog" -> "Open publish dialog for current page"
  | "command.search/re-index" -> "Rebuild search index"
  | "command.sidebar/clear" -> "Clear all in the right sidebar"
  | "command.sidebar/close-top" -> "Closes the top item in the right sidebar"
  | "command.sidebar/open-today-page" -> "Open today's page in the right sidebar"
  | "command.ui/clear-all-notifications" -> "Clear all notifications"
  | "command.ui/customize-appearance" -> "Customize appearance"
  | "command.ui/goto-plugins" -> "Go to plugins dashboard"
  | "command.ui/highlight-recent-blocks" -> "Toggle highlight recent blocks"
  | "command.ui/select-theme-color" -> "Select available theme colors"
  | "command.ui/toggle-brackets" -> "Toggle whether to display brackets"
  | "command.ui/toggle-contents" -> "Toggle Contents in sidebar"
  | "command.ui/toggle-document-mode" -> "Toggle document mode"
  | "command.ui/toggle-help" -> "Toggle help"
  | "command.ui/toggle-left-sidebar" -> "Toggle left sidebar"
  | "command.ui/toggle-right-sidebar" -> "Toggle right sidebar"
  | "command.ui/toggle-settings" -> "Toggle settings"
  | "command.ui/toggle-theme" -> "Toggle between dark/light theme"
  | "command.ui/toggle-wide-mode" -> "Toggle wide mode"
  | "keymap/disabled" -> "Disabled"
  | "library/add-existing-pages" -> "Add existing pages to Library"
  | "nav.all-pages/label" -> "Pages"
  | "sidebar.left/recent-pages" -> "Recent"
  | "command.editor/add-property-icon" -> "Add icon"
  | "editor/click-to-edit" -> "Click to edit"
  | "ui/delete" -> "Delete"
  | "ui/empty" -> "Empty"
  | "ui/submit" -> "Submit"
  | "property.built-in/tags" -> "Tags"
  | "property.built-in/priority" -> "Priority"
  | "query.builder/filter" -> "Filter"
  | "query.builder/add-filter-or-operator-placeholder" ->
      "Add filter/operator"
  | "ui/cancel" -> "Cancel"
  | "icon/search-all" -> "Search all"
  | "icon/search-emojis" -> "Search emojis"
  | "icon/search-icons" -> "Search icons"
  | "icon/tab-all" -> "All"
  | "icon/tab-emojis" -> "Emojis"
  | "icon/tab-icons" -> "Icons"
  | "icon/emojis-count" -> "Emojis ({1})"
  | "icon/icons-count" -> "Icons ({1})"
  | "icon/matched-count" -> "Matched ({1})"
  | "ui/frequently-used" -> "Frequently used"
  | "block.comments/on-those-blocks" -> "On those blocks"
  | "block.comments/placeholder" -> "Reply..."
  | "block.comments/label" -> "Comments"
  | "color/yellow" -> "Yellow"
  | "color/red" -> "Red"
  | "color/pink" -> "Pink"
  | "color/green" -> "Green"
  | "color/blue" -> "Blue"
  | "color/purple" -> "Purple"
  | "color/gray" -> "Gray"
  | "view/linked-references" -> "Linked references"
  | "view/unlinked-references" -> "Unlinked references"
  | "view/add-new-view" -> "Add new view"
  | "reference/page-filter" -> "Page filter"
  | "page/open-properties" -> "Open properties"
  | "page/hide-properties" -> "Hide properties"
  | "page/not-found" -> "Page not found"
  | "page/not-found-title" -> "Page Not Found"
  | "page/not-found-desc" -> "Oops! The page you're looking for doesn't exist."
  | "page/go-back-home" -> "Go back home"
  | "class/add-property" -> "Add tag property"
  | "property.built-in/class-properties" -> "Tag Properties"
  | "class/tag-properties-desc" ->
      "Tag properties are inherited by all nodes using the tag. For \
       example, each #Task node inherits 'Status' and 'Priority'."
  | "property/set-property" -> "Set property"
  | "property/add-new" -> "Add property"
  | "property/add-or-change" -> "Add or change property"
  | "property/select-property-placeholder" -> "Select a property"
  | "property/select-type-placeholder" -> "Select a property type"
  | "property/select-choice" -> "Select a choice"
  | "property/set-placeholder" -> "Set {1}"
  | "property/skip-choosing-tag" -> "Skip choosing tag"
  | "property/choose-tag" -> "Choose tag"
  | "property/choose-tags" -> "Choose tags"
  | "property/available-choices" -> "Available choices"
  | "property/add-choice" -> "Add choice"
  | "property/set-default-choice" -> "Set as default choice"
  | "property/hide-for-tag" -> "Hide for #{1}"
  | "property/hide-choice-for-tag" -> "Hide choice for this tag"
  | "property/remove-scope-for-tag" -> "Remove scope for #{1}"
  | "property/use-choice-in-tag" -> "Use choice in #{1}"
  | "property/scope-choice-to-tag" -> "Only for #{1}"
  | "property/delete-from-node" -> "Delete property from node"
  | "property/delete-from-node-confirm" ->
      "Are you sure you want to delete the property \"{1}\" from this node?"
  | "property/delete-from-tag" -> "Delete property from tag"
  | "property/delete-from-tag-confirm" ->
      "Are you sure you want to delete the property \"{1}\" from this tag?"
  | "property/hide-by-default" -> "Hide by default"
  | "property/hide-empty-value" -> "Hide empty value"
  | "property/multiple-values" -> "Multiple values"
  | "property/multiple-values-confirm" ->
      "This action cannot be undone. Do you want to change this property \
       to have multiple values?"
  | "property/show-hidden-choices" -> "Show hidden choices"
  | "property/hide-hidden-choices" -> "Hide hidden choices"
  | "property/ui-position" -> "UI position"
  | "property/ui-position-properties" -> "Block properties"
  | "property/ui-position-block-left" -> "Beginning of the block"
  | "property/ui-position-block-right" -> "End of the block"
  | "property/ui-position-block-below" -> "Below the block"
  | "property/name" -> "Property name"
  | "property/name-placeholder" -> "name"
  | "property/description-placeholder" -> "description"
  | "property/type" -> "Property type"
  | "property/type-text" -> "Text"
  | "property/type-default" -> "Text"
  | "property/type-number" -> "Number"
  | "property/type-date" -> "Date"
  | "property/type-datetime" -> "DateTime"
  | "property/type-checkbox" -> "Checkbox"
  | "property/type-url" -> "URL"
  | "property/type-node" -> "Node"
  | "property/type-asset" -> "Asset"
  | "property/specify-node-tags" -> "Specify node tags"
  | "property/default-value" -> "Default value"
  | "property/set-default-value" -> "Set default value"
  | "property/go-to-this-property" -> "Go to this property"
  | "property/title-placeholder" -> "title"
  | "property/create-error" ->
      "Property failed to create. Please try a different property name."
  | "property/invalid-name-error" ->
      "invalid property name, please rename the property" (* en.edn
         :property.validation/invalid-name carries this sentence *)
  | "property/more-settings" -> "More settings"
  | "property/existing-values" -> "Existing values:"
  | "property/add-choices" -> "Add choices"
  | "property/drag-to-reorder" -> "Drag && Drop to reorder"
  | "property/set-icon" -> "Set Icon"
  | "property/checkbox-state-mapping" -> "Checkbox state mapping"
  | "property/choices-count" -> "{1} choices"
  | "property/change-tooltip" -> "Change {1}"
  | "property/show-hidden-properties" -> "Show hidden properties"
  | "property/collapse-hidden-properties" -> "Collapse hidden properties"
  | "property/configure" -> "Configure property"
  | "property/configure-title" -> "Configure"
  | "ui/confirm" -> "Confirm"
  | "ui/save" -> "Save"
  | "ui/new" -> "New"
  | "ui/true" -> "true"
  | "ui/false" -> "false"
  | "select/new-option" -> "New option:"
  | "search-result-item/new-page" -> "Create page called '{1}'"
  | _ -> key

let tf (key : string) (args : string list) : string = sub (t key) args

let t1 key arg = replace_all (t key) "{1}" arg

let delete_page = "Delete page"
let convert_to_tag = "Convert to Tag"
let convert_tag_to_page = "Convert Tag to Page"
let convert_tag_to_page_desc =
  "Converting a tag to page also removes its tag properties and its tag \
   from all nodes tagged with it. Are you ok with that?"

let confirm = "Confirm"
let cancel = "Cancel"

(* app menu *)
(* assets — en.edn :asset/* *)
let asset_align = "Align"
let asset_align_left = "Align left"
let asset_align_center = "Align center"
let asset_align_right = "Align right"
let asset_copy = "Copy image"
let asset_delete = "Delete image"
let asset_confirm_delete = "Are you sure you want to delete this image?"
let asset_already_exists title uuid =
  "Asset exists already, title: " ^ title ^ ", node reference: [[" ^ uuid
  ^ "]]"
let delete_page_title = "Delete page?"
let delete_page_desc = "Are you sure you want to delete this page?"
let page_not_found = "Page not found: "
let loading = "Loading..."
let go_to_journals = "Go to journals"
let unlinked_references = "Unlinked References"
let filter_placeholder = "Type to search"

(* header dots menu *)
let add_to_favorites = "Add to Favorites"
let unfavorite_page = "Unfavorite page"
let settings = "Settings"
let plugins = "Plugins"
let recycle = "Recycle"
let export_graph = "Export graph"
let export_page = "Export page"
let publish_page = "Publish page"
let appearance = "Appearance"
let help_handbook = "Handbook"
let help_shortcuts = "Keyboard shortcuts"
let help_docs = "Documentation"
let help_bug = "Bug report"
let help_feature = "Feature request"
let help_feedback = "Submit feedback"
let help_discord = "Ask the community"
let help_forum = "Support forum"
let help_release_notes = "Release notes"
let import_ = "Import"
let login = "Login"

(* graph view *)
let graph_settings = "Graph settings"
let graph_settings_saved_per_graph = "Saved per graph"
let graph_canvas_label = "Graph canvas"
let graph_preparing = "Preparing"
let ui_close = "Close"
let recycle_title = "Recycle"

let all = "All"
let new_ = "New"
let new_view = "New view"
let add_new_view = "Add new view"
let live_query n = "Live query (" ^ string_of_int n ^ ")"
let type_to_search = "Type to search"
let no_matched_result = "No matched result"
let name_ = "Name"
let page_name = "Page name"
let backlinks = "Backlinks"
let created_at = "Created At"
let updated_at = "Updated At"
let filter = "Filter"
let rename = "Rename"
let delete = "Delete"
let copied_view_nodes = "Copied view nodes' data!"
let show_built_in_properties = "Show built-in properties"
let is_empty = "Is Empty"
let is_not_empty = "Is Not Empty"
let empty_label = "Empty"
let sort_ascending = "Sort ascending"
let sort_descending = "Sort descending"
let ascending = "Ascending"
let descending = "Descending"
let delete_sort = "Delete sort"
let select_order = "Select order"
let columns_visibility = "Columns visibility"
let group_by = "Group by"
let sort_groups_by = "Sort groups by"
let sort_groups_order = "Sort groups order"
let export_edn = "Export EDN"

(* :export/transparent-background / :export/preview-alt /
   :plugin/readme-empty-warning *)
let export_transparent_bg = "Transparent background"
let export_preview_alt = "export preview"
let plugin_readme_empty = "No README content."
let select_all = "Select all"
let select_row = "Select row"
let select_col = "Select"
let row_number = "Row number"
let new_property = "New property"
let open_ = "Open"
let open_in_sidebar = "Open in sidebar"
let table_view = "Table View"
let list_view = "List View"
let gallery_view = "Gallery View"
let new_node = "New node"
let pages = "Pages"
let no_group_value prop = "No " ^ prop
let selected_count n = "Selected: " ^ string_of_int n
let default_title n =
  string_of_int n ^ if n <= 1 then " Node" else " Nodes"
let page_label = "Page"
let match_all = "Match all filters"
let match_any = "Match any filter"
let set_query = "Set query"
let batch_delete_title =
  "Are you sure you want to delete these pages? Properties and tags will \
   be permanently deleted and pages will be moved to Recycle."
let total n = "Total: " ^ string_of_int n
let yes = "Yes"
let all_done = "All Done!"
let operator_text = function
  | "is" -> "is"
  | "is-not" -> "is not"
  | "text-contains" -> "text contains"
  | "text-not-contains" -> "text not contains"
  | "date-before" -> "date before"
  | "date-after" -> "date after"
  | "before" -> "before"
  | "after" -> "after"
  | "number-gt" -> ">"
  | "number-lt" -> "<"
  | "number-gte" -> ">="
  | "number-lte" -> "<="
  | "between" -> "between"
  | _ -> "is"
let timestamp_options =
  [ ("1 day ago", "1 day ago"); ("3 days ago", "3 days ago")
  ; ("1 week ago", "1 week ago"); ("1 month ago", "1 month ago")
  ; ("3 months ago", "3 months ago"); ("1 year ago", "1 year ago")
  ; ("custom-date", "Custom date") ]
let builder_add_filter_placeholder = "Add filter/operator"
let builder_filter = "Filter"
let builder_all_values = "ALL"
let builder_between_start = "Start date"
let builder_between_end = "End date"
let builder_between_journal a b = "between: " ^ a ^ " ~ " ^ b
let builder_created = "Created"
let builder_updated = "Updated"
let builder_search s = "Search: " ^ s
let builder_show_builtin = "Show built-in properties"
let builder_unwrap = "Unwrap"
let builder_wrap_label = "Wrap this filter with:"
let builder_replace_label = "Replace with:"
let select_prompt = "Select one"
let select_multi_prompt = "Select one or multiple"
let new_option s = "+ New option: " ^ s
let apply = "Apply"
let submit = "Submit"
let loading_ = "Loading"
let true_ = "true"
let false_ = "false"
let group_journal_date = "Journal date"
let group_page_name = "Page name"
let group_page_updated = "Page updated date"
let group_page_created = "Page created date"
let filter_tags = "Tags"
let filter_page_ref = "Page reference"
let filter_property = "Property"
let filter_task = "Task"
let filter_priority = "Priority"
let filter_page = "Page"
let filter_full_text = "Full text search"
let filter_sample = "Sample"
let op_and = "and"
let op_or = "or"
let op_not = "not"

let all_graphs = "All graphs"
let create_new_graph = "Create a new graph"
let local_graphs = "Local graphs:"
let open_in_another_tab = "Open in another tab"
let remote_graphs = "Remote graphs:"
let refresh = "Refresh"
let restore = "Restore"
let graph_name_placeholder = "your graph name"
let last_opened_at ts = sub "Last opened at: {1}" [ ts ]
let already_exists name =
  sub "The graph '{1}' already exists. Please try again with another name."
    [ name ]
let delete_local_graph = "Delete local graph"
let delete_remote_graph = "Delete remote graph"
let delete_local_confirm name =
  sub
    "Are you sure you want to permanently delete the graph \"{1}\" from \
     Logseq?"
    [ name ]
let delete_remote_confirm name =
  sub
    "Are you sure you want to permanently delete the graph \"{1}\" from our \
     server?"
    [ name ]
let delete_warning =
  "\226\154\160\239\184\143 Notice that we can't recover this graph after \
   being deleted. Make sure you have backups before deleting it."
let removed name = sub "Removed graph \"{1}\"" [ name ]
let removed_redirecting name next =
  sub "Removed graph \"{1}\". Redirecting to graph \"{2}\"" [ name; next ]
let name_reserved_warning =
  "Graph name can't contain following reserved characters:"
let creating = "Creating graph"
let use_sync_label = "Use Logseq Sync?"
let encrypt_data_label = "Encrypt graph data"
let import_existing_notes = "Import existing notes"
let import_later = "You can also do this later in the app."
let import_title = "Do you already have notes that you want to import?"
let import_desc =
  "If they are in an EDN or Markdown format Logseq can work with them."
let import_sqlite_desc =
  "Import a SQLite DB Export of your Logseq graph into a new DB graph"
let import_sqlite_zip_title = "SQLite + assets (.zip)"
let import_sqlite_zip_desc =
  "Import a zip containing db.sqlite and an assets folder"
let import_file_graph_title = "File to DB graph"
let import_file_graph_desc =
  "Import a file-based Logseq graph folder into a new DB graph"
let import_debug_transit_title = "Debug Transit"
let import_debug_transit_desc =
  "Import debug transit file into a new DB graph"
let import_db_edn_title = "EDN to DB graph"
let import_db_edn_desc =
  "Import a DB graph's EDN export into a new DB graph"
let import_new_graph_name = "New graph name"
let set_graph_name = "Set graph name"
let import_empty_name = "Empty graph name."
let invalid_name = "Invalid graph name"
let import_name_conflict =
  "Please specify another name as another graph with this name already \
   exists!"
let import_finished label graph =
  sub "{1} import finished! Redirecting to \"{2}\"" [ label; graph ]
let import_failed = "Import failed"
let import_invalid_edn = "Invalid EDN file."
let import_unsupported kind =
  sub "{1} import is not supported yet." [ kind ]
let import_sqlite_title = "SQLite"
let export_title = "Export"
let export_sqlite_db = "Export SQLite DB"
let export_sqlite_zip = "Export both SQLite DB and assets"
let export_edn_file = "Export EDN file"
let export_markdown = "Export as standard Markdown (no block properties)"
let export_debug_transit = "Export debug transit file"
let export_debug_transit_desc =
  "Exports to a .transit file to send to us for debugging. Any sensitive \
   data will be removed in the exported file."
let export_sqlite_desc =
  "Primary way to backup graph's content to a single .sqlite file."
let export_zip_desc =
  "Primary way to backup graph's content and assets to a .zip file."
let export_edn_desc =
  "Exports to a readable and editable .edn file. Don't rely on this as a \
   primary backup."
let export_zip_error = "Export zip failed."
let export_validation_failed = "Graph validation failed"
let login_title = "Sign in"
let login_username = "Username"
let login_password = "Password"
let login_failed = "Sign in failed"
let settings_title = "Settings"
let theme_label = "Theme"
let theme_light = "light"
let theme_dark = "dark"
let theme_system = "system"
let language_label = "Language"
let recycle_retention =
  "Deleted pages and blocks stay here until restored or automatically \
   garbage collected after 30 days."
let recycle_empty = "Recycle is empty."
let recycle_page_deleted ts = sub "Page deleted {1}" [ ts ]
let recycle_block_deleted ts = sub "Block deleted {1}" [ ts ]
let recycle_delete_confirm_page =
  "Permanently delete this page from Recycle? This cannot be undone."
let recycle_delete_confirm_block =
  "Permanently delete this block from Recycle? This cannot be undone."
let restored name = sub "Restored \"{1}\"" [ name ]
let close = "Close"

(* ---- settings page/dialog (components/settings.cljs) ---- *)
let settings_general = "General"
let settings_editor = "Editor"
let settings_keymap = "Keymap"
let settings_advanced = "Advanced"
let settings_features = "Features"
let current_version = "Current version"
let changelog = "What's new?"
let switch_to_theme name = sub "Switch to {1} theme" [ name ]
let editor_font = "Font"
let editor_font_global = "Set as global font family"
let accent_color = "Accent color"
let accent_color_alert =
  "Choosing an accent color may override any theme you have selected."
let accent_color_logseq = "Logseq classic color"
let accent_color_none =
  "Cancel accent color. This is currently in beta stage and mainly used \
   for compatibility with custom themes."
let color_tomato = "Tomato"
let color_red = "Red"
let color_crimson = "Crimson"
let color_pink = "Pink"
let color_plum = "Plum"
let color_purple = "Purple"
let color_violet = "Violet"
let color_indigo = "Indigo"
let color_blue = "Blue"
let color_cyan = "Cyan"
let color_teal = "Teal"
let color_green = "Green"
let color_grass = "Grass"
let color_orange = "Orange"
let config_custom_configuration = "Custom configuration"
let edit_config_edn = "Edit config.edn"
let config_custom_theme = "Custom theme"
let edit_custom_css = "Edit custom.css"
let current_revision_prefix = "Current Revision: "
let revision_title v = sub "Revision: {1}" [ v ]
let custom_date_format = "Preferred date format"
let show_brackets = "Show brackets"
let wide_mode = "Wide mode"
let logical_outdenting = "Logical outdenting"
let show_full_blocks = "Show all lines of a block reference"
let preferred_pasting = "Prefer pasting file"
let auto_expand_refs = "Expand block references automatically when zoom-in"

let outdenting_hint =
  "The left side shows outdenting with the default setting, and the \
   right shows outdenting with logical outdenting enabled → Learn more"

let pasting_hint =
  "When enabled, pasting an image from the internet will download and \
   insert the image. When disabled, it will paste the link to the \
   image."

let auto_expand_hint =
  "This option controls whether to expand the block references \
   automatically when zoom-in."
let shortcut_tooltip = "Enable shortcut tooltip"
let tooltips = "Tooltips"
let all_pages_public = "All pages public when publishing"
let usage_diagnostics = "Send usage data and diagnostics to Logseq"
let usage_diagnostics_desc =
  "Logseq will never collect your local graph database or sell your data."
let developer_mode = "Developer mode"
let developer_mode_desc =
  "Developer mode helps contributors and extension developers test their \
   integrations with Logseq more efficiently."
let sync_server_url = "Sync Server URL"
let publish_server_url = "Publish Server URL"
let sync_url_desc =
  "Set a custom HTTPS sync server URL for self-hosted sync. Your Logseq \
   authentication tokens will be sent to this server, so only use a \
   trusted URL. Leave empty to use the official Logseq Sync."
let publish_url_desc =
  "Set a custom HTTPS publish server URL for self-hosted single-page \
   publishing. Your Logseq authentication tokens will be sent to this \
   server, so only use a trusted URL. Leave empty to use the official \
   Logseq Publish service."
let publish_default = "Logseq Publish"
let reset_default = "Reset to default"
let url_invalid = "URL must start with https:// or http://"
let sync_saved = "Sync server URL saved."
let sync_cleared = "Sync server URL cleared. Using official Logseq Sync."
let publish_saved = "Publish server URL saved."
let publish_cleared =
  "Publish server URL cleared. Using official Logseq Publish."
let home_default_page = "Set the default home page"
let home_updated = "Home default page updated successfully!"
let page_not_found_msg name =
  sub
    "The page \"{1}\" doesn't exist yet. Please create that page first, \
     and then try again."
    [ name ]
let plugins_label = "Plugins"
let flashcards = "Flashcards"
let refresh_required =
  "Please refresh the app for this change to take effect"
let save = "Save"
let keymap_all = "All"
let keymap_custom = "Custom"
let keymap_unset = "Unset"
let keymap_disabled = "Disabled"
let keymap_search_placeholder = "Search shortcuts..."
let keymap_search_by_keys = "Search by keys"
let keymap_toggle_categories = "Toggle categories pane"
let keymap_refresh_all = "Refresh all"
let pin = "Pin"
let unpin = "Unpin"
let cannot_go_to_internal_page = "Cannot go to an internal page."
let e2ee_enter_password_title = "Enter password for remote graphs"
let e2ee_set_password_title = "Set password for remote graphs"
let e2ee_password_ph = "Enter password"
let e2ee_password_again_ph = "Enter password again"
let e2ee_password_not_matched = "Password not matched"
