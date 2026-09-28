(* Shortcut keymap data: categories, rows and bindings as rendered by
   components/shortcut.cljs on a fresh graph (default bindings, macOS).
   Non-ASCII label/key text is stored as UTF-8 byte escapes; render
   through Platform.utf8 like other i18n literals. *)

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

let items =
  [ Category "Basics"
  ; Shortcut
      { label = "Search commands"
      ; title = ":command-palette/toggle#global-prevent-default"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+shift+p"; keys = [ "\xe2\x8c\x98"; "\xe2\x87\xa7"; "P" ] } ]
      }
  ; Shortcut
      { label = "Copy (copies either selection, or block reference)"
      ; title = ":editor/copy#editor-global"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+c"; keys = [ "\xe2\x8c\x98"; "C" ] } ]
      }
  ; Shortcut
      { label = "Copy selections as text"
      ; title = ":editor/copy-text#editor-global"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+shift+c"; keys = [ "\xe2\x8c\x98"; "\xe2\x87\xa7"; "C" ] } ]
      }
  ; Shortcut
      { label = "Cut"
      ; title = ":editor/cut#editor-global"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+x"; keys = [ "\xe2\x8c\x98"; "X" ] } ]
      }
  ; Shortcut
      { label = "Indent block"
      ; title = ":editor/indent#editor-global"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "tab"; keys = [ "Tab" ] } ]
      }
  ; Shortcut
      { label = "Create new block"
      ; title = ":editor/new-block#block-editing-only"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "enter"; keys = [ "\xe2\x8f\x8e" ] } ]
      }
  ; Shortcut
      { label = "New line in current block"
      ; title = ":editor/new-line#block-editing-only"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "shift+enter"; keys = [ "\xe2\x87\xa7"; "\xe2\x8f\x8e" ] } ]
      }
  ; Shortcut
      { label = "Outdent block"
      ; title = ":editor/outdent#editor-global"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "shift+tab"; keys = [ "\xe2\x87\xa7"; "Tab" ] } ]
      }
  ; Shortcut
      { label = "Quick add"
      ; title = ":editor/quick-add#global-prevent-default"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+e"; keys = [ "\xe2\x8c\x98"; "E" ] } ]
      }
  ; Shortcut
      { label = "Redo"
      ; title = ":editor/redo#global-prevent-default"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+shift+z"; keys = [ "\xe2\x8c\x98"; "\xe2\x87\xa7"; "Z" ] }; { kind = "combo"; data = "meta+y"; keys = [ "\xe2\x8c\x98"; "Y" ] } ]
      }
  ; Shortcut
      { label = "Select all blocks"
      ; title = ":editor/select-all-blocks#global-prevent-default"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+shift+a"; keys = [ "\xe2\x8c\x98"; "\xe2\x87\xa7"; "A" ] } ]
      }
  ; Shortcut
      { label = "Select parent block"
      ; title = ":editor/select-parent#editor-global"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+a"; keys = [ "\xe2\x8c\x98"; "A" ] } ]
      }
  ; Shortcut
      { label = "Undo"
      ; title = ":editor/undo#global-prevent-default"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+z"; keys = [ "\xe2\x8c\x98"; "Z" ] } ]
      }
  ; Shortcut
      { label = "Search pages and blocks"
      ; title = ":go/search#global-prevent-default"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+k"; keys = [ "\xe2\x8c\x98"; "K" ] } ]
      }
  ; Shortcut
      { label = "Search blocks in page"
      ; title = ":go/search-in-page#global-prevent-default"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+shift+k"; keys = [ "\xe2\x8c\x98"; "\xe2\x87\xa7"; "K" ] } ]
      }
  ; Shortcut
      { label = "Search themes"
      ; title = ":go/search-themes#global-prevent-default"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+shift+i"; keys = [ "\xe2\x8c\x98"; "\xe2\x87\xa7"; "I" ] } ]
      }
  ; Category "Navigation"
  ; Shortcut
      { label = "Collapse"
      ; title = ":editor/collapse-block-children#editor-global"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+up"; keys = [ "\xe2\x8c\x98"; "\xe2\x86\x91" ] } ]
      }
  ; Shortcut
      { label = "Move cursor down / Select down"
      ; title = ":editor/down#editor-global"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "down"; keys = [ "\xe2\x86\x93" ] }; { kind = "combo"; data = "ctrl+n"; keys = [ "Ctrl"; "N" ] } ]
      }
  ; Shortcut
      { label = "Expand"
      ; title = ":editor/expand-block-children#editor-global"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+down"; keys = [ "\xe2\x8c\x98"; "\xe2\x86\x93" ] } ]
      }
  ; Shortcut
      { label = "Jump to a property key or value"
      ; title = ":editor/jump#editor-global"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+j"; keys = [ "\xe2\x8c\x98"; "J" ] } ]
      }
  ; Shortcut
      { label = "Move cursor left / Open selected block at beginning"
      ; title = ":editor/left#editor-global"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "left"; keys = [ "\xe2\x86\x90" ] } ]
      }
  ; Shortcut
      { label = "Move cursor right / Open selected block at end"
      ; title = ":editor/right#editor-global"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "right"; keys = [ "\xe2\x86\x92" ] } ]
      }
  ; Shortcut
      { label = "Toggle expand/collapse"
      ; title = ":editor/toggle-block-children#editor-global"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+;"; keys = [ "\xe2\x8c\x98"; ";" ] } ]
      }
  ; Shortcut
      { label = "Toggle open blocks (collapse or expand all blocks)"
      ; title = ":editor/toggle-open-blocks#global-non-editing-only"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "t o"; keys = [ "T"; "O" ] } ]
      }
  ; Shortcut
      { label = "Move cursor up / Select up"
      ; title = ":editor/up#editor-global"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "up"; keys = [ "\xe2\x86\x91" ] }; { kind = "combo"; data = "ctrl+p"; keys = [ "Ctrl"; "P" ] } ]
      }
  ; Shortcut
      { label = "Go to all graphs"
      ; title = ":go/all-graphs#global-non-editing-only"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "g shift+g"; keys = [ "G"; "\xe2\x87\xa7"; "G" ] } ]
      }
  ; Shortcut
      { label = "Go to all pages"
      ; title = ":go/all-pages#global-non-editing-only"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "g a"; keys = [ "G"; "A" ] } ]
      }
  ; Shortcut
      { label = "Backwards"
      ; title = ":go/backward#global-prevent-default"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+open-square-bracket"; keys = [ "\xe2\x8c\x98"; "[" ] } ]
      }
  ; Shortcut
      { label = "Toggle flashcards"
      ; title = ":go/flashcards#global-non-editing-only"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "g f"; keys = [ "G"; "F" ] }; { kind = "separate"; data = "t c"; keys = [ "T"; "C" ] } ]
      }
  ; Shortcut
      { label = "Forwards"
      ; title = ":go/forward#global-prevent-default"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+close-square-bracket"; keys = [ "\xe2\x8c\x98"; "]" ] } ]
      }
  ; Shortcut
      { label = "Go to home"
      ; title = ":go/home#global-non-editing-only"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "g h"; keys = [ "G"; "H" ] } ]
      }
  ; Shortcut
      { label = "Go to journals"
      ; title = ":go/journals#global-non-editing-only"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "g j"; keys = [ "G"; "J" ] } ]
      }
  ; Shortcut
      { label = "Go to keyboard shortcuts"
      ; title = ":go/keyboard-shortcuts#global-non-editing-only"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "g s"; keys = [ "G"; "S" ] } ]
      }
  ; Shortcut
      { label = "Go to next journal"
      ; title = ":go/next-journal#global-non-editing-only"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "g n"; keys = [ "G"; "N" ] } ]
      }
  ; Shortcut
      { label = "Go to previous journal"
      ; title = ":go/prev-journal#global-non-editing-only"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "g p"; keys = [ "G"; "P" ] } ]
      }
  ; Shortcut
      { label = "Go to tomorrow"
      ; title = ":go/tomorrow#global-non-editing-only"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "g t"; keys = [ "G"; "T" ] } ]
      }
  ; Category "Block editing general"
  ; Shortcut
      { label = "Backspace / Delete backwards"
      ; title = ":editor/backspace#block-editing-only"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "backspace"; keys = [ "\xe2\x8c\xab" ] } ]
      }
  ; Shortcut
      { label = "Rotate the TODO state"
      ; title = ":editor/cycle-todo#editor-global"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+enter"; keys = [ "\xe2\x8c\x98"; "\xe2\x8f\x8e" ] } ]
      }
  ; Shortcut
      { label = "Delete / Delete forwards"
      ; title = ":editor/delete#block-editing-only"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "delete"; keys = [ "Delete" ] } ]
      }
  ; Shortcut
      { label = "Escape editing"
      ; title = ":editor/escape-editing#block-editing-only"
      ; unset = true
      ; bindings = [  ]
      }
  ; Shortcut
      { label = "Follow link under cursor"
      ; title = ":editor/follow-link#block-editing-only"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+o"; keys = [ "\xe2\x8c\x98"; "O" ] } ]
      }
  ; Shortcut
      { label = "Indent block"
      ; title = ":editor/indent#editor-global"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "tab"; keys = [ "Tab" ] } ]
      }
  ; Shortcut
      { label = "Move block down"
      ; title = ":editor/move-block-down#editor-global"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+shift+down"; keys = [ "\xe2\x8c\x98"; "\xe2\x87\xa7"; "\xe2\x86\x93" ] } ]
      }
  ; Shortcut
      { label = "Move block up"
      ; title = ":editor/move-block-up#editor-global"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+shift+up"; keys = [ "\xe2\x8c\x98"; "\xe2\x87\xa7"; "\xe2\x86\x91" ] } ]
      }
  ; Shortcut
      { label = "Move blocks to"
      ; title = ":editor/move-blocks#editor-global"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+shift+m"; keys = [ "\xe2\x8c\x98"; "\xe2\x87\xa7"; "M" ] } ]
      }
  ; Shortcut
      { label = "Create new block"
      ; title = ":editor/new-block#block-editing-only"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "enter"; keys = [ "\xe2\x8f\x8e" ] } ]
      }
  ; Shortcut
      { label = "New line in current block"
      ; title = ":editor/new-line#block-editing-only"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "shift+enter"; keys = [ "\xe2\x87\xa7"; "\xe2\x8f\x8e" ] } ]
      }
  ; Shortcut
      { label = "Open link in sidebar"
      ; title = ":editor/open-link-in-sidebar#block-editing-only"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+shift+o"; keys = [ "\xe2\x8c\x98"; "\xe2\x87\xa7"; "O" ] } ]
      }
  ; Shortcut
      { label = "Outdent block"
      ; title = ":editor/outdent#editor-global"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "shift+tab"; keys = [ "\xe2\x87\xa7"; "Tab" ] } ]
      }
  ; Shortcut
      { label = "Zoom in editing block / Forwards otherwise"
      ; title = ":editor/zoom-in#block-editing-only"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+."; keys = [ "\xe2\x8c\x98"; "." ] }; { kind = "combo"; data = "meta+shift+."; keys = [ "\xe2\x8c\x98"; "\xe2\x87\xa7"; "." ] } ]
      }
  ; Shortcut
      { label = "Zoom out editing block / Backwards otherwise"
      ; title = ":editor/zoom-out#block-editing-only"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+,"; keys = [ "\xe2\x8c\x98"; "," ] } ]
      }
  ; Category "Block command editing"
  ; Shortcut
      { label = "Backspace / Delete backwards"
      ; title = ":editor/backspace#block-editing-only"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "backspace"; keys = [ "\xe2\x8c\xab" ] } ]
      }
  ; Shortcut
      { label = "Delete a word backwards"
      ; title = ":editor/backward-kill-word#block-editing-only"
      ; unset = false
      ; bindings = [  ]
      }
  ; Shortcut
      { label = "Move cursor backward a word"
      ; title = ":editor/backward-word#block-editing-only"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "ctrl+shift+b"; keys = [ "Ctrl"; "\xe2\x87\xa7"; "B" ] } ]
      }
  ; Shortcut
      { label = "Move cursor to the beginning of a block"
      ; title = ":editor/beginning-of-block#block-editing-only"
      ; unset = false
      ; bindings = [  ]
      }
  ; Shortcut
      { label = "Delete entire block content"
      ; title = ":editor/clear-block#block-editing-only"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "ctrl+l"; keys = [ "Ctrl"; "L" ] } ]
      }
  ; Shortcut
      { label = "Copy a block embed pointing to the current block"
      ; title = ":editor/copy-embed#block-editing-only"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+shift+e"; keys = [ "\xe2\x8c\x98"; "\xe2\x87\xa7"; "E" ] } ]
      }
  ; Shortcut
      { label = "Move cursor to the end of a block"
      ; title = ":editor/end-of-block#block-editing-only"
      ; unset = false
      ; bindings = [  ]
      }
  ; Shortcut
      { label = "Delete a word forwards"
      ; title = ":editor/forward-kill-word#block-editing-only"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "ctrl+w"; keys = [ "Ctrl"; "W" ] } ]
      }
  ; Shortcut
      { label = "Move cursor forward a word"
      ; title = ":editor/forward-word#block-editing-only"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "ctrl+shift+f"; keys = [ "Ctrl"; "\xe2\x87\xa7"; "F" ] } ]
      }
  ; Shortcut
      { label = "Delete line after cursor position"
      ; title = ":editor/kill-line-after#block-editing-only"
      ; unset = false
      ; bindings = [  ]
      }
  ; Shortcut
      { label = "Delete line before cursor position"
      ; title = ":editor/kill-line-before#block-editing-only"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "ctrl+u"; keys = [ "Ctrl"; "U" ] } ]
      }
  ; Shortcut
      { label = "Paste text into one block at point"
      ; title = ":editor/paste-text-in-one-block-at-point#block-editing-only"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+shift+v"; keys = [ "\xe2\x8c\x98"; "\xe2\x87\xa7"; "V" ] } ]
      }
  ; Shortcut
      { label = "Select content below"
      ; title = ":editor/select-down#editor-global"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "shift+down"; keys = [ "\xe2\x87\xa7"; "\xe2\x86\x93" ] } ]
      }
  ; Shortcut
      { label = "Select content above"
      ; title = ":editor/select-up#editor-global"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "shift+up"; keys = [ "\xe2\x87\xa7"; "\xe2\x86\x91" ] } ]
      }
  ; Category "Block selection (press Esc to quit selection)"
  ; Shortcut
      { label = "Add comment"
      ; title = ":editor/add-comment#global-non-editing-only"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "ctrl+space"; keys = [ "Ctrl"; "Space" ] } ]
      }
  ; Shortcut
      { label = "Add property"
      ; title = ":editor/add-property#global-prevent-default"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+p"; keys = [ "\xe2\x8c\x98"; "P" ] } ]
      }
  ; Shortcut
      { label = "Add task deadline to selected block"
      ; title = ":editor/add-property-deadline#global-non-editing-only"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "p d"; keys = [ "P"; "D" ] } ]
      }
  ; Shortcut
      { label = "Add icon"
      ; title = ":editor/add-property-icon#global-non-editing-only"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "p i"; keys = [ "P"; "I" ] } ]
      }
  ; Shortcut
      { label = "Add task priority to selected block"
      ; title = ":editor/add-property-priority#global-non-editing-only"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "p p"; keys = [ "P"; "P" ] } ]
      }
  ; Shortcut
      { label = "Add task status to selected block"
      ; title = ":editor/add-property-status#global-non-editing-only"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "p s"; keys = [ "P"; "S" ] } ]
      }
  ; Shortcut
      { label = "Add reaction"
      ; title = ":editor/add-reaction#global-non-editing-only"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "p r"; keys = [ "P"; "R" ] } ]
      }
  ; Shortcut
      { label = "Delete selected blocks"
      ; title = ":editor/delete-selection#editor-global"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "backspace"; keys = [ "\xe2\x8c\xab" ] }; { kind = "separate"; data = "delete"; keys = [ "Delete" ] } ]
      }
  ; Shortcut
      { label = "Edit selected block"
      ; title = ":editor/open-edit#editor-global"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "enter"; keys = [ "\xe2\x8f\x8e" ] } ]
      }
  ; Shortcut
      { label = "Open selected block(s) in sidebar"
      ; title = ":editor/open-selected-blocks-in-sidebar#editor-global"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "shift+enter"; keys = [ "\xe2\x87\xa7"; "\xe2\x8f\x8e" ] } ]
      }
  ; Shortcut
      { label = "Select all blocks"
      ; title = ":editor/select-all-blocks#global-prevent-default"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+shift+a"; keys = [ "\xe2\x8c\x98"; "\xe2\x87\xa7"; "A" ] } ]
      }
  ; Shortcut
      { label = "Select block below"
      ; title = ":editor/select-block-down#editor-global"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "alt+down"; keys = [ "\xe2\x8c\xa5"; "\xe2\x86\x93" ] } ]
      }
  ; Shortcut
      { label = "Select block above"
      ; title = ":editor/select-block-up#editor-global"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "alt+up"; keys = [ "\xe2\x8c\xa5"; "\xe2\x86\x91" ] } ]
      }
  ; Shortcut
      { label = "Select parent block"
      ; title = ":editor/select-parent#editor-global"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+a"; keys = [ "\xe2\x8c\x98"; "A" ] } ]
      }
  ; Shortcut
      { label = "Set tags for selected block(s)"
      ; title = ":editor/set-tags#global-non-editing-only"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "p t"; keys = [ "P"; "T" ] } ]
      }
  ; Shortcut
      { label = "Toggle display hidden properties"
      ; title = ":editor/toggle-display-hidden-properties#global-non-editing-only"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "p a"; keys = [ "P"; "A" ] } ]
      }
  ; Category "Formatting"
  ; Shortcut
      { label = "Bold"
      ; title = ":editor/bold#block-editing-only"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+b"; keys = [ "\xe2\x8c\x98"; "B" ] } ]
      }
  ; Shortcut
      { label = "Highlight"
      ; title = ":editor/highlight#block-editing-only"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+shift+h"; keys = [ "\xe2\x8c\x98"; "\xe2\x87\xa7"; "H" ] } ]
      }
  ; Shortcut
      { label = "HTML Link"
      ; title = ":editor/insert-link#global-prevent-default"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+l"; keys = [ "\xe2\x8c\x98"; "L" ] } ]
      }
  ; Shortcut
      { label = "Italics"
      ; title = ":editor/italics#block-editing-only"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+i"; keys = [ "\xe2\x8c\x98"; "I" ] } ]
      }
  ; Shortcut
      { label = "Strikethrough"
      ; title = ":editor/strike-through#block-editing-only"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+shift+s"; keys = [ "\xe2\x8c\x98"; "\xe2\x87\xa7"; "S" ] } ]
      }
  ; Category "Toggle"
  ; Shortcut
      { label = "Toggle number list"
      ; title = ":editor/toggle-number-list#global-prevent-default"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "t n"; keys = [ "T"; "N" ] } ]
      }
  ; Shortcut
      { label = "Toggle open blocks (collapse or expand all blocks)"
      ; title = ":editor/toggle-open-blocks#global-non-editing-only"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "t o"; keys = [ "T"; "O" ] } ]
      }
  ; Shortcut
      { label = "Customize appearance"
      ; title = ":ui/customize-appearance#global-non-editing-only"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "c c"; keys = [ "C"; "C" ] } ]
      }
  ; Shortcut
      { label = "Toggle highlight recent blocks"
      ; title = ":ui/highlight-recent-blocks#global-non-editing-only"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = ""; keys = [ "\xe2\x8c\x98"; "C" ] }; { kind = "combo"; data = ""; keys = [ "\xe2\x8c\x98"; "R" ] } ]
      }
  ; Shortcut
      { label = "Toggle whether to display brackets"
      ; title = ":ui/toggle-brackets#global-prevent-default"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "t b"; keys = [ "T"; "B" ] } ]
      }
  ; Shortcut
      { label = "Toggle Contents in sidebar"
      ; title = ":ui/toggle-contents#global-non-editing-only"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "alt+shift+c"; keys = [ "\xe2\x8c\xa5"; "\xe2\x87\xa7"; "C" ] } ]
      }
  ; Shortcut
      { label = "Toggle help"
      ; title = ":ui/toggle-help#global-non-editing-only"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "shift+/"; keys = [ "?" ] } ]
      }
  ; Shortcut
      { label = "Toggle left sidebar"
      ; title = ":ui/toggle-left-sidebar#global-non-editing-only"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "t l"; keys = [ "T"; "L" ] } ]
      }
  ; Shortcut
      { label = "Toggle right sidebar"
      ; title = ":ui/toggle-right-sidebar#global-non-editing-only"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "t r"; keys = [ "T"; "R" ] } ]
      }
  ; Shortcut
      { label = "Toggle settings"
      ; title = ":ui/toggle-settings#global-non-editing-only"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "t s"; keys = [ "T"; "S" ] }; { kind = "combo"; data = "meta+,"; keys = [ "\xe2\x8c\x98"; "," ] } ]
      }
  ; Shortcut
      { label = "Toggle between dark/light theme"
      ; title = ":ui/toggle-theme#global-non-editing-only"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "t t"; keys = [ "T"; "T" ] } ]
      }
  ; Shortcut
      { label = "Toggle wide mode"
      ; title = ":ui/toggle-wide-mode#global-non-editing-only"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "t w"; keys = [ "T"; "W" ] } ]
      }
  ; Category "Plugins"
  ; Category "Others"
  ; Shortcut
      { label = "Auto-complete: Choose selected item"
      ; title = ":auto-complete/complete#auto-complete"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "enter"; keys = [ "\xe2\x8f\x8e" ] } ]
      }
  ; Shortcut
      { label = "Auto-complete: Cmd + Enter to choose selected item"
      ; title = ":auto-complete/meta-complete#auto-complete"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+enter"; keys = [ "\xe2\x8c\x98"; "\xe2\x8f\x8e" ] } ]
      }
  ; Shortcut
      { label = "Auto-complete: Select next item"
      ; title = ":auto-complete/next#auto-complete"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "down"; keys = [ "\xe2\x86\x93" ] }; { kind = "combo"; data = "ctrl+n"; keys = [ "Ctrl"; "N" ] } ]
      }
  ; Shortcut
      { label = "Auto-complete: Select previous item"
      ; title = ":auto-complete/prev#auto-complete"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "up"; keys = [ "\xe2\x86\x91" ] }; { kind = "combo"; data = "ctrl+p"; keys = [ "Ctrl"; "P" ] } ]
      }
  ; Shortcut
      { label = "Auto-complete: Open selected item in sidebar"
      ; title = ":auto-complete/shift-complete#auto-complete"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "shift+enter"; keys = [ "\xe2\x87\xa7"; "\xe2\x8f\x8e" ] } ]
      }
  ; Shortcut
      { label = "Insert youtube timestamp"
      ; title = ":editor/insert-youtube-timestamp#block-editing-only"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+shift+y"; keys = [ "\xe2\x8c\x98"; "\xe2\x87\xa7"; "Y" ] } ]
      }
  ; Shortcut
      { label = "Add a graph"
      ; title = ":graph/add#editor-global"
      ; unset = true
      ; bindings = [  ]
      }
  ; Shortcut
      { label = "Export public graph pages as HTML"
      ; title = ":graph/export-as-html#editor-global"
      ; unset = true
      ; bindings = [  ]
      }
  ; Shortcut
      { label = "Select graph to open"
      ; title = ":graph/open#editor-global"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "alt+shift+g"; keys = [ "\xe2\x8c\xa5"; "\xe2\x87\xa7"; "G" ] } ]
      }
  ; Shortcut
      { label = "Remove a graph"
      ; title = ":graph/remove#editor-global"
      ; unset = true
      ; bindings = [  ]
      }
  ; Shortcut
      { label = "Export block EDN data"
      ; title = ":misc/export-block-data#global-non-editing-only"
      ; unset = true
      ; bindings = [  ]
      }
  ; Shortcut
      { label = "Export graph's tags and properties EDN data"
      ; title = ":misc/export-graph-ontology-data#global-non-editing-only"
      ; unset = true
      ; bindings = [  ]
      }
  ; Shortcut
      { label = "Export page EDN data"
      ; title = ":misc/export-page-data#global-non-editing-only"
      ; unset = true
      ; bindings = [  ]
      }
  ; Shortcut
      { label = "Import EDN data"
      ; title = ":misc/import-edn-data#global-non-editing-only"
      ; unset = true
      ; bindings = [  ]
      }
  ; Shortcut
      { label = "Add to/remove from favorites"
      ; title = ":page/toggle-favorite#editor-global"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+shift+f"; keys = [ "\xe2\x8c\x98"; "\xe2\x87\xa7"; "F" ] } ]
      }
  ; Shortcut
      { label = "PDF: Close current pdf doc"
      ; title = ":pdf/close#pdf"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "alt+x"; keys = [ "\xe2\x8c\xa5"; "X" ] } ]
      }
  ; Shortcut
      { label = "PDF: Search text of current pdf doc"
      ; title = ":pdf/find#pdf"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "alt+f"; keys = [ "\xe2\x8c\xa5"; "F" ] } ]
      }
  ; Shortcut
      { label = "PDF: Next page of current pdf doc"
      ; title = ":pdf/next-page#pdf"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "alt+n"; keys = [ "\xe2\x8c\xa5"; "N" ] } ]
      }
  ; Shortcut
      { label = "PDF: Previous page of current pdf doc"
      ; title = ":pdf/previous-page#pdf"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "alt+p"; keys = [ "\xe2\x8c\xa5"; "P" ] } ]
      }
  ; Shortcut
      { label = "Open publish dialog for current page"
      ; title = ":publish/open-dialog#global-prevent-default"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+m"; keys = [ "\xe2\x8c\x98"; "M" ] } ]
      }
  ; Shortcut
      { label = "Rebuild search index"
      ; title = ":search/re-index#global-prevent-default"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = ""; keys = [ "\xe2\x8c\x98"; "C" ] }; { kind = "combo"; data = ""; keys = [ "\xe2\x8c\x98"; "S" ] } ]
      }
  ; Shortcut
      { label = "Clear all in the right sidebar"
      ; title = ":sidebar/clear#global-prevent-default"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = ""; keys = [ "\xe2\x8c\x98"; "C" ] }; { kind = "combo"; data = ""; keys = [ "\xe2\x8c\x98"; "C" ] } ]
      }
  ; Shortcut
      { label = "Closes the top item in the right sidebar"
      ; title = ":sidebar/close-top#global-non-editing-only"
      ; unset = false
      ; bindings = [ { kind = "separate"; data = "c t"; keys = [ "C"; "T" ] } ]
      }
  ; Shortcut
      { label = "Open today's page in the right sidebar"
      ; title = ":sidebar/open-today-page#global-prevent-default"
      ; unset = false
      ; bindings = [ { kind = "combo"; data = "meta+shift+j"; keys = [ "\xe2\x8c\x98"; "\xe2\x87\xa7"; "J" ] } ]
      }
  ; Shortcut
      { label = "Clear all notifications"
      ; title = ":ui/clear-all-notifications#global-non-editing-only"
      ; unset = true
      ; bindings = [  ]
      }
  ]
