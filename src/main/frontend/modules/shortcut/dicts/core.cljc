(ns ^:bb-compatible frontend.modules.shortcut.dicts.core
  "Provides dictionary entries for shortcuts"
  (:require [frontend.modules.shortcut.dicts.zh-cn :as zh-CN]
            [frontend.modules.shortcut.dicts.zh-hant :as zh-Hant]
            [frontend.modules.shortcut.dicts.de :as de]
            [frontend.modules.shortcut.dicts.nl :as nl]
            [frontend.modules.shortcut.dicts.fr :as fr]
            [frontend.modules.shortcut.dicts.af :as af]
            [frontend.modules.shortcut.dicts.es :as es]
            [frontend.modules.shortcut.dicts.ru :as ru]
            [frontend.modules.shortcut.dicts.nb-no :as nb-NO]
            [frontend.modules.shortcut.dicts.pt-pt :as pt-PT]
            [frontend.modules.shortcut.dicts.pt-br :as pt-BR]
            [frontend.modules.shortcut.dicts.ja :as ja]
            [frontend.modules.shortcut.dicts.it :as it]
            [frontend.modules.shortcut.dicts.tr :as tr]
            [frontend.modules.shortcut.dicts.ko :as ko]
            [frontend.modules.shortcut.dicts.pl :as pl]
            [frontend.modules.shortcut.dicts.sk :as sk]
            [frontend.modules.shortcut.dicts.uk :as uk]))

(defn- decorate-namespace [k]
  (let [n (name k)
        ns (namespace k)]
    (keyword (str "command." ns) n)))

(def ^:large-vars/data-var all-default-keyboard-shortcuts
  {:date-picker/complete         "Date picker: Choose selected day"
   :date-picker/prev-day         "Date picker: Select previous day"
   :date-picker/next-day         "Date picker: Select next day"
   :date-picker/prev-week        "Date picker: Select previous week"
   :date-picker/next-week        "Date picker: Select next week"
   :pdf/previous-page            "Pdf: Previous page of current pdf doc"
   :pdf/next-page                "Pdf: Next page of current pdf doc"
   :pdf/close                    "Pdf: Close current pdf doc"
   :pdf/find                     "Pdf: Search text of current pdf doc"
   :auto-complete/complete       "Auto-complete: Choose selected item"
   :auto-complete/prev           "Auto-complete: Select previous item"
   :auto-complete/next           "Auto-complete: Select next item"
   :auto-complete/shift-complete "Auto-complete: Open selected item in sidebar"
   :auto-complete/open-link      "Auto-complete: Open selected item in browser"
   :cards/toggle-answers         "Cards: show/hide answers/clozes"
   :cards/next-card              "Cards: next card"
   :cards/forgotten              "Cards: forgotten"
   :cards/remembered             "Cards: remembered"
   :cards/recall                 "Cards: take a while to recall"
   :editor/escape-editing        "Escape editing"
   :editor/backspace             "Backspace / Delete backwards"
   :editor/delete                "Delete / Delete forwards"
   :editor/new-block             "Create new block"
   :editor/new-line              "New line in current block"
   :editor/new-whiteboard        "New whiteboard"
   :editor/follow-link           "Follow link under cursor"
   :editor/open-link-in-sidebar  "Open link in sidebar"
   :editor/bold                  "Bold"
   :editor/italics               "Italics"
   :editor/highlight             "Highlight"
   :editor/strike-through        "Strikethrough"
   :editor/clear-block           "Delete entire block content"
   :editor/kill-line-before      "Delete line before cursor position"
   :editor/copy-embed            "Copy a block embed pointing to the current block"
   :editor/kill-line-after       "Delete line after cursor position"
   :editor/beginning-of-block    "Move cursor to the beginning of a block"
   :editor/end-of-block          "Move cursor to the end of a block"
   :editor/forward-word          "Move cursor forward a word"
   :editor/backward-word         "Move cursor backward a word"
   :editor/forward-kill-word     "Delete a word forwards"
   :editor/backward-kill-word    "Delete a word backwards"
   :editor/replace-block-reference-at-point "Replace block reference with its content at point"
   :editor/paste-text-in-one-block-at-point "Paste text into one block at point"
   :editor/insert-youtube-timestamp         "Insert youtube timestamp"
   :editor/cycle-todo              "Rotate the TODO state of the current item"
   :editor/up                      "Move cursor up / Select up"
   :editor/down                    "Move cursor down / Select down"
   :editor/left                    "Move cursor left / Open selected block at beginning"
   :editor/right                   "Move cursor right / Open selected block at end"
   :editor/select-up               "Select content above"
   :editor/select-down             "Select content below"
   :editor/move-block-up           "Move block up"
   :editor/move-block-down         "Move block down"
   :editor/open-edit               "Edit selected block"
   :editor/select-block-up         "Select block above"
   :editor/select-block-down       "Select block below"
   :editor/delete-selection        "Delete selected blocks"
   :editor/expand-block-children   "Expand"
   :editor/collapse-block-children "Collapse"
   :editor/indent                  "Indent block"
   :editor/outdent                 "Outdent block"
   :editor/copy                    "Copy (copies either selection, or block reference)"
   :editor/copy-text               "Copy selections as text"
   :editor/cut                     "Cut"
   :editor/undo                    "Undo"
   :editor/redo                    "Redo"
   :editor/insert-link             "HTML Link"
   :editor/select-all-blocks       "Select all blocks"
   :editor/select-parent           "Select parent block"
   :editor/zoom-in                 "Zoom in editing block / Forwards otherwise"
   :editor/zoom-out                "Zoom out editing block / Backwards otherwise"
   :editor/toggle-undo-redo-mode   "Toggle undo redo mode (global or page only)"
   :editor/toggle-number-list      "Toggle number list"
   :whiteboard/select              "Select tool"
   :whiteboard/pan                 "Pan tool"
   :whiteboard/portal              "Portal tool"
   :whiteboard/pencil              "Pencil tool"
   :whiteboard/highlighter         "Highlighter tool"
   :whiteboard/eraser              "Eraser tool"
   :whiteboard/connector           "Connector tool"
   :whiteboard/text                "Text tool"
   :whiteboard/rectangle           "Rectangle tool"
   :whiteboard/ellipse             "Ellipse tool"
   :whiteboard/reset-zoom          "Reset zoom"
   :whiteboard/zoom-to-fit         "Zoom to drawing"
   :whiteboard/zoom-to-selection   "Zoom to fit selection"
   :whiteboard/zoom-out            "Zoom out"
   :whiteboard/zoom-in             "Zoom in"
   :whiteboard/send-backward       "Move backward"
   :whiteboard/send-to-back        "Move to back"
   :whiteboard/bring-forward       "Move forward"
   :whiteboard/bring-to-front      "Move to front"
   :whiteboard/lock                "Lock selection"
   :whiteboard/unlock              "Unlock selection"
   :whiteboard/group               "Group selection"
   :whiteboard/ungroup             "Ungroup selection"
   :whiteboard/toggle-grid         "Toggle the canvas grid"
   :ui/toggle-brackets             "Toggle whether to display brackets"
   :go/search-in-page              "Search blocks in the current page"
   :go/electron-find-in-page       "Find text in page"
   :go/electron-jump-to-the-next   "Jump to the next match to your Find bar search"
   :go/electron-jump-to-the-previous "Jump to the previous match to your Find bar search"
   :go/search                      "Search pages and blocks"
   :go/journals                    "Go to journals"
   :go/backward                    "Backwards"
   :go/forward                     "Forwards"
   :search/re-index                "Rebuild search index"
   :sidebar/open-today-page        "Open today's page in the right sidebar"
   :sidebar/close-top              "Closes the top item in the right sidebar"
   :sidebar/clear                  "Clear all in the right sidebar"
   :misc/copy                      "mod+c"
   :command-palette/toggle         "Toggle command palette"
   :graph/export-as-html           "Export public graph pages as html"
   :graph/open                     "Select graph to open"
   :graph/remove                   "Remove a graph"
   :graph/add                      "Add a graph"
   :graph/save                     "Save current graph to disk"
   :graph/re-index                 "Re-index current graph"
   :command/run                    "Run git command"
   :go/home                        "Go to home"
   :go/all-graphs                  "Go to all graphs"
   :go/whiteboards                 "Go to whiteboards"
   :go/all-pages                   "Go to all pages"
   :go/graph-view                  "Go to graph view"
   :go/keyboard-shortcuts          "Go to keyboard shortcuts"
   :go/tomorrow                    "Go to tomorrow"
   :go/next-journal                "Go to next journal"
   :go/prev-journal                "Go to previous journal"
   :go/flashcards                  "Toggle flashcards"
   :ui/toggle-document-mode        "Toggle document mode"
   :ui/toggle-settings             "Toggle settings"
   :ui/toggle-right-sidebar        "Toggle right sidebar"
   :ui/toggle-left-sidebar         "Toggle left sidebar"
   :ui/toggle-help                 "Toggle help"
   :ui/toggle-theme                "Toggle between dark/light theme"
   :ui/toggle-contents             "Toggle Contents in sidebar"
   ;;  :ui/open-new-window             "Open another window"
   :command/toggle-favorite        "Add to/remove from favorites"
   :editor/open-file-in-default-app "Open file in default app"
   :editor/open-file-in-directory   "Open file in parent directory"
   :editor/copy-current-file        "Copy current file"
   :editor/copy-page-url           "Copy page url"
   :ui/toggle-wide-mode             "Toggle wide mode"
   :ui/select-theme-color           "Select available theme colors"
   :ui/goto-plugins                 "Go to plugins dashboard"
   :ui/install-plugins-from-file    "Install plugins from plugins.edn"
   :editor/toggle-open-blocks       "Toggle open blocks (collapse or expand all blocks)"
   :ui/toggle-cards                 "Toggle cards"
   :ui/clear-all-notifications      "Clear all notifications"
   :git/commit                      "Create git commit with message"
   :dev/show-block-data             "(Dev) Show block data"
   :dev/show-block-ast              "(Dev) Show block AST"
   :dev/show-page-data              "(Dev) Show page data"
   :dev/show-page-ast               "(Dev) Show page AST"})

(def category
  {:shortcut.category/basics "Basics"
   :shortcut.category/formatting "Formatting"
   :shortcut.category/navigating "Navigation"
   :shortcut.category/block-editing "Block editing general"
   :shortcut.category/block-command-editing "Block command editing"
   :shortcut.category/block-selection "Block selection (press Esc to quit selection)"
   :shortcut.category/toggle "Toggle"
   :shortcut.category/whiteboard "Whiteboard"
   :shortcut.category/others "Others"})

(def ^:large-vars/data-var dicts
  {:en (merge
         ;; Dynamically add this ns since command descriptions have to
         ;; stay in sync with shortcut.config command ids which do not
         ;; have a namespace
        (update-keys all-default-keyboard-shortcuts decorate-namespace)
        category)
   :zh-CN   zh-CN/dict
   :zh-Hant zh-Hant/dict
   :de      de/dict
   :nl      nl/dict
   :fr      fr/dict
   :af      af/dict
   :es      es/dict
   :ru      ru/dict
   :nb-NO   nb-NO/dict
   :pt-PT   pt-PT/dict
   :pt-BR   pt-BR/dict
   :ja      ja/dict
   :it      it/dict
   :tr      tr/dict
   :ko      ko/dict
   :pl      pl/dict
   :sk      sk/dict
   :uk      uk/dict})
