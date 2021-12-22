(ns frontend.modules.shortcut.config
  (:require [frontend.components.commit :as commit]
            [frontend.extensions.srs.handler :as srs]
            [frontend.extensions.pdf.utils :as pdf-utils]
            [frontend.handler.config :as config-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.history :as history]
            [frontend.handler.page :as page-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.journal :as journal-handler]
            [frontend.handler.search :as search-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.modules.shortcut.before :as m]
            [frontend.state :as state]
            [frontend.util :refer [mac?] :as util]
            [frontend.commands :as commands]
            [medley.core :as medley]))

;; Note – when you change this file, you will need to do a hard reset.
;; The commands are registered when the Clojurescript code runs for the fir
(defonce all-default-keyboard-shortcuts
  {:date-picker/complete         {:desc    "Date picker: Choose selected day"
                                  :binding "enter"
                                  :fn      ui-handler/shortcut-complete}

   :date-picker/prev-day         {:desc    "Date picker: Select previous day"
                                  :binding "left"
                                  :fn      ui-handler/shortcut-prev-day}

   :date-picker/next-day         {:desc    "Date picker: Select next day"
                                  :binding "right"
                                  :fn      ui-handler/shortcut-next-day}

   :date-picker/prev-week        {:desc    "Date picker: Select previous week"
                                  :binding "up"
                                  :fn      ui-handler/shortcut-prev-week}

   :date-picker/next-week        {:desc    "Date picker: Select next week"
                                  :binding "down"
                                  :fn      ui-handler/shortcut-next-week}

   :pdf/previous-page            {:desc    "Previous page of current pdf doc"
                                  :binding "alt+p"
                                  :fn      pdf-utils/prev-page}

   :pdf/next-page                {:desc    "Next page of current pdf doc"
                                  :binding "alt+n"
                                  :fn      pdf-utils/next-page}

   :auto-complete/complete       {:desc    "Auto-complete: Choose selected item"
                                  :binding "enter"
                                  :fn      ui-handler/auto-complete-complete}

   :auto-complete/prev           {:desc    "Auto-complete: Select previous item"
                                  :binding "up"
                                  :fn      ui-handler/auto-complete-prev}

   :auto-complete/next           {:desc    "Auto-complete: Select next item"
                                  :binding "down"
                                  :fn      ui-handler/auto-complete-next}

   :auto-complete/shift-complete {:desc    "Auto-complete: Open selected item in sidebar"
                                  :binding "shift+enter"
                                  :fn      ui-handler/auto-complete-shift-complete}

   :cards/toggle-answers         {:desc    "Cards: show/hide answers/clozes"
                                  :binding "s"
                                  :fn      srs/toggle-answers}

   :cards/next-card              {:desc    "Cards: next card"
                                  :binding "n"
                                  :fn      srs/next-card}

   :cards/forgotten              {:desc    "Cards: forgotten"
                                  :binding "f"
                                  :fn      srs/forgotten}

   :cards/remembered             {:desc    "Cards: remembered"
                                  :binding "r"
                                  :fn      srs/remembered}

   :cards/recall                 {:desc    "Cards: take a while to recall"
                                  :binding "t"
                                  :fn      srs/recall}

   :editor/escape-editing        {:desc    "Escape editing"
                                  :binding false
                                  :fn      (fn [_ _] (editor-handler/escape-editing))}

   :editor/backspace             {:desc    "Backspace / Delete backwards"
                                  :binding "backspace"
                                  :fn      editor-handler/editor-backspace}

   :editor/delete                {:desc    "Delete / Delete forwards"
                                  :binding "delete"
                                  :fn      editor-handler/editor-delete}

   :editor/new-block             {:desc    "Create new block"
                                  :binding "enter"
                                  :fn      editor-handler/keydown-new-block-handler}

   :editor/new-line              {:desc    "New line in current block"
                                  :binding "shift+enter"
                                  :fn      editor-handler/keydown-new-line-handler}

   :editor/follow-link           {:desc    "Follow link under cursor"
                                  :binding "mod+o"
                                  :fn      editor-handler/follow-link-under-cursor!}

   :editor/open-link-in-sidebar  {:desc    "Open link in sidebar"
                                  :binding "mod+shift+o"
                                  :fn      editor-handler/open-link-in-sidebar!}

   :editor/bold                  {:desc    "Bold"
                                  :binding "mod+b"
                                  :fn      editor-handler/bold-format!}

   :editor/italics               {:desc    "Italics"
                                  :binding "mod+i"
                                  :fn      editor-handler/italics-format!}

   :editor/highlight             {:desc    "Highlight"
                                  :binding "mod+shift+h"
                                  :fn      editor-handler/highlight-format!}

   :editor/strike-through        {:desc    "Strikethrough"
                                  :binding "mod+shift+s"
                                  :fn      editor-handler/strike-through-format!}

   :editor/clear-block           {:desc    "Delete entire block content"
                                  :binding (if mac? "ctrl+l" "alt+l")
                                  :fn      editor-handler/clear-block-content!}

   :editor/kill-line-before      {:desc    "Delete line before cursor position"
                                  :binding (if mac? "ctrl+u" "alt+u")
                                  :fn      editor-handler/kill-line-before!}

   :editor/kill-line-after       {:desc    "Delete line after cursor position"
                                  :binding (if mac? false "alt+k")
                                  :fn      editor-handler/kill-line-after!}

   :editor/beginning-of-block    {:desc    "Move cursor to the beginning of a block"
                                  :binding (if mac? false "alt+a")
                                  :fn      editor-handler/beginning-of-block}

   :editor/end-of-block          {:desc    "Move cursor to the end of a block"
                                  :binding (if mac? false "alt+e")
                                  :fn      editor-handler/end-of-block}

   :editor/forward-word          {:desc    "Move cursor forward a word"
                                  :binding (if mac? "ctrl+shift+f" "alt+f")
                                  :fn      editor-handler/cursor-forward-word}

   :editor/backward-word         {:desc    "Move cursor backward a word"
                                  :binding (if mac? "ctrl+shift+b" "alt+b")
                                  :fn      editor-handler/cursor-backward-word}

   :editor/forward-kill-word     {:desc    "Delete a word forwards"
                                  :binding (if mac? "ctrl+w" "alt+d")
                                  :fn      editor-handler/forward-kill-word}

   :editor/backward-kill-word    {:desc    "Delete a word backwards"
                                  :binding (if mac? false "alt+w")
                                  :fn      editor-handler/backward-kill-word}

   :editor/replace-block-reference-at-point {:desc    "Replace block reference with its content at point"
                                             :binding "mod+shift+r"
                                             :fn      editor-handler/replace-block-reference-with-content-at-point}

   :editor/paste-text-in-one-block-at-point {:desc    "Paste text into one block at point"
                                             :binding "mod+shift+v"
                                             :fn      editor-handler/paste-text-in-one-block-at-point}

   :editor/insert-youtube-timestamp         {:desc    "Insert youtube timestamp"
                                             :binding "mod+shift+y"
                                             :fn      commands/insert-youtube-timestamp}

   :editor/cycle-todo              {:desc    "Rotate the TODO state of the current item"
                                    :binding "mod+enter"
                                    :fn      editor-handler/cycle-todo!}

   :editor/up                      {:desc    "Move cursor up / Select up"
                                    :binding "up"
                                    :fn      (editor-handler/shortcut-up-down :up)
                                    :force?  true}

   :editor/down                    {:desc    "Move cursor down / Select down"
                                    :binding "down"
                                    :fn      (editor-handler/shortcut-up-down :down)
                                    :force?  true}

   :editor/left                    {:desc    "Move cursor left / Open selected block at beginning"
                                    :binding "left"
                                    :fn      (editor-handler/shortcut-left-right :left)}

   :editor/right                   {:desc    "Move cursor right / Open selected block at end"
                                    :binding "right"
                                    :fn      (editor-handler/shortcut-left-right :right)}

   :editor/move-block-up           {:desc    "Move block up"
                                    :binding (if mac? "mod+shift+up" "alt+shift+up")
                                    :fn      (editor-handler/move-up-down true)}

   :editor/move-block-down         {:desc    "Move block down"
                                    :binding (if mac? "mod+shift+down" "alt+shift+down")
                                    :fn      (editor-handler/move-up-down false)}

   ;; FIXME: add open edit in non-selection mode
   :editor/open-edit               {:desc    "Edit selected block"
                                    :binding "enter"
                                    :fn      (partial editor-handler/open-selected-block! :right)}

   :editor/select-block-up         {:desc    "Select block above"
                                    :binding "shift+up"
                                    :fn      (editor-handler/on-select-block :up)}

   :editor/select-block-down       {:desc    "Select block below"
                                    :binding "shift+down"
                                    :fn      (editor-handler/on-select-block :down)}

   :editor/delete-selection        {:desc    "Delete selected blocks"
                                    :binding ["backspace" "delete"]
                                    :fn      editor-handler/delete-selection}

   :editor/expand-block-children   {:desc    "Expand"
                                    :binding "mod+down"
                                    :fn      editor-handler/expand!
                                    :force?  true}

   :editor/collapse-block-children {:desc    "Collapse"
                                    :binding "mod+up"
                                    :fn      editor-handler/collapse!
                                    :force?  true}

   :editor/indent                  {:desc    "Indent block"
                                    :binding "tab"
                                    :fn      (editor-handler/keydown-tab-handler :right)}

   :editor/outdent                 {:desc    "Outdent block"
                                    :binding "shift+tab"
                                    :fn      (editor-handler/keydown-tab-handler :left)}

   :editor/copy                    {:desc    "Copy (copies either selection, or block reference)"
                                    :binding "mod+c"
                                    :fn      editor-handler/shortcut-copy}

   :editor/cut                     {:desc    "Cut"
                                    :binding "mod+x"
                                    :fn      editor-handler/shortcut-cut}

   :editor/undo                    {:desc    "Undo"
                                    :binding "mod+z"
                                    :fn      history/undo!}

   :editor/redo                    {:desc    "Redo"
                                    :binding ["shift+mod+z" "mod+y"]
                                    :fn      history/redo!}

   :editor/insert-link             {:desc    "HTML Link"
                                    :binding "mod+l"
                                    :fn      #(editor-handler/html-link-format!)}

   :editor/select-all-blocks       {:desc    "Select all blocks"
                                    :binding "mod+shift+a"
                                    :fn      editor-handler/select-all-blocks!}

   :editor/zoom-in                 {:desc    "Zoom in editing block / Forwards otherwise"
                                    :binding (if mac? "mod+." "alt+right")
                                    :fn      editor-handler/zoom-in!}

   :editor/zoom-out                {:desc    "Zoom out editing block / Backwards otherwise"
                                    :binding (if mac? "mod+," "alt+left")
                                    :fn      editor-handler/zoom-out!}

   :ui/toggle-brackets             {:desc    "Toggle whether to display brackets"
                                    :binding "mod+c mod+b"
                                    :fn      config-handler/toggle-ui-show-brackets!}

   :go/search-in-page              {:desc    "Search in the current page"
                                    :binding "mod+shift+k"
                                    :fn      #(route-handler/go-to-search! :page)}

   :go/search                      {:desc    "Full text search"
                                    :binding "mod+k"
                                    :fn      #(route-handler/go-to-search! :global)}

   :go/journals                    {:desc    "Go to journals"
                                    :binding "g j"
                                    :fn      route-handler/go-to-journals!}

   :go/backward                    {:desc    "Backwards"
                                    :binding "mod+open-square-bracket"
                                    :fn      (fn [_] (js/window.history.back))}

   :go/forward                     {:desc    "Forwards"
                                    :binding "mod+close-square-bracket"
                                    :fn      (fn [_] (js/window.history.forward))}

   :search/re-index                {:desc    "Rebuild search index"
                                    :binding "mod+c mod+s"
                                    :fn      search-handler/rebuild-indices!}

   :sidebar/open-today-page        {:desc    "Open today's page in the right sidebar"
                                    :binding (if mac? "mod+shift+j" "alt+shift+j")
                                    :fn      page-handler/open-today-in-sidebar}

   :sidebar/clear                  {:desc    "Clear all in the right sidebar"
                                    :binding "mod+c mod+c"
                                    :fn      #(do
                                                (state/clear-sidebar-blocks!)
                                                (state/hide-right-sidebar!))}

   :misc/copy                      {:binding "mod+c"
                                    :fn      (fn [] (js/document.execCommand "copy"))}

   :command-palette/toggle         {:desc    "Toggle command palette"
                                    :binding "mod+shift+p"
                                    :fn      (fn [] (state/toggle! :ui/command-palette-open?))
                                    :force?   true}

   :command/run                    (when (util/electron?)
                                     {:desc    "Run git command"
                                      :binding "mod+shift+1"
                                      :fn      #(state/pub-event! [:command/run])})

   :go/home                        {:desc    "Go to home"
                                    :binding "g h"
                                    :fn      route-handler/redirect-to-home!}

   :go/all-pages                   {:desc    "Go to all pages"
                                    :binding "g a"
                                    :fn      route-handler/redirect-to-all-pages!}

   :go/graph-view                  {:desc    "Go to graph view"
                                    :binding "g g"
                                    :fn      route-handler/redirect-to-graph-view!}


   :go/keyboard-shortcuts          {:desc    "Go to keyboard shortcuts"
                                    :binding "g s"
                                    :fn      #(route-handler/redirect! {:to :shortcut-setting})}

   :go/tomorrow                    {:desc    "Go to tomorrow"
                                    :binding "g t"
                                    :fn      journal-handler/go-to-tomorrow!}

   :go/next-journal                {:desc    "Go to next journal"
                                    :binding "g n"
                                    :fn      journal-handler/go-to-next-journal!}

   :go/prev-journal                {:desc    "Go to previous journal"
                                    :binding "g p"
                                    :fn      journal-handler/go-to-prev-journal!}

   :go/flashcards                  {:desc    "Toggle flashcards"
                                    :binding "g f"
                                    :fn      (fn []
                                               (if (state/modal-opened?)
                                                 (state/close-modal!)
                                                 (state/pub-event! [:modal/show-cards])))}

   :ui/toggle-document-mode        {:desc    "Toggle document mode"
                                    :binding "t d"
                                    :fn      state/toggle-document-mode!}

   :ui/toggle-settings              {:desc    "Toggle settings"
                                     :binding (if mac? "t s" ["t s" "mod+,"])
                                     :fn      ui-handler/toggle-settings-modal!}

   :ui/toggle-right-sidebar         {:desc    "Toggle right sidebar"
                                     :binding "t r"
                                     :fn      ui-handler/toggle-right-sidebar!}

   :ui/toggle-left-sidebar          {:desc    "Toggle left sidebar"
                                     :binding "t l"
                                     :fn      state/toggle-left-sidebar!}

   :ui/toggle-help                  {:desc    "Toggle help"
                                     :binding "shift+/"
                                     :fn      ui-handler/toggle-help!}

   :ui/toggle-theme                 {:desc    "Toggle between dark/light theme"
                                     :binding "t t"
                                     :fn      state/toggle-theme!}

   :ui/toggle-contents              {:desc    "Toggle Contents in sidebar"
                                     :binding "mod+shift+c"
                                     :fn      ui-handler/toggle-contents!}
   :ui/open-new-window              (when (util/electron?)
                                      {:desc    "Open another window"
                                       :binding "mod+n"
                                       :fn      ui-handler/open-new-window!})

   :command/toggle-favorite         {:desc    "Add to/remove from favorites"
                                     :binding "mod+shift+f"
                                     :fn      page-handler/toggle-favorite!}

   :editor/open-file-in-default-app (when (util/electron?)
                                      {:desc    "Open file in default app"
                                       :binding false
                                       :fn      page-handler/open-file-in-default-app})

   :editor/open-file-in-directory   (when (util/electron?)
                                      {:desc    "Open file in parent directory"
                                       :binding false
                                       :fn      page-handler/open-file-in-directory})

   :ui/toggle-wide-mode             {:desc    "Toggle wide mode"
                                     :binding "t w"
                                     :fn      ui-handler/toggle-wide-mode!}

   :ui/select-theme-color           {:desc    "Select available theme colors"
                                     :binding "t i"
                                     :fn      plugin-handler/show-themes-modal!}

   :ui/goto-plugins                 {:desc    "Go to plugins dashboard"
                                     :binding "t p"
                                     :fn      plugin-handler/goto-plugins-dashboard!}

   :editor/toggle-open-blocks       {:desc    "Toggle open blocks (collapse or expand all blocks)"
                                     :binding "t o"
                                     :fn      editor-handler/toggle-open!}

   :ui/toggle-cards                 {:desc    "Toggle cards"
                                     :binding "t c"
                                     :fn      ui-handler/toggle-cards!}
  ;; :ui/toggle-between-page-and-file route-handler/toggle-between-page-and-file!

   :git/commit                      {:desc    "Git commit message"
                                     :binding "c"
                                     :fn      commit/show-commit-modal!}})

(defn build-category-map [symbols]
  (reduce into {}
          (map (fn [sym] {sym (get all-default-keyboard-shortcuts sym)}) symbols)))

(defonce config
  (atom
   {:shortcut.handler/date-picker
    (build-category-map [:date-picker/complete
                         :date-picker/prev-day
                         :date-picker/next-day
                         :date-picker/prev-week
                         :date-picker/next-week])

    :shortcut.handler/pdf
    (-> (build-category-map [:pdf/previous-page
                             :pdf/next-page])
        (with-meta {:before m/enable-when-not-editing-mode!}))

    :shortcut.handler/auto-complete
    (build-category-map [:auto-complete/complete
                         :auto-complete/prev
                         :auto-complete/next
                         :auto-complete/shift-complete])

    :shortcut.handler/cards
    (build-category-map [:cards/toggle-answers
                         :cards/next-card
                         :cards/forgotten
                         :cards/remembered
                         :cards/recall])

    :shortcut.handler/block-editing-only
    (->
     (build-category-map [:editor/escape-editing
                          :editor/backspace
                          :editor/delete
                          :editor/new-block
                          :editor/new-line
                          :editor/follow-link
                          :editor/open-link-in-sidebar
                          :editor/bold
                          :editor/italics
                          :editor/highlight
                          :editor/strike-through
                          :editor/clear-block
                          :editor/kill-line-before
                          :editor/kill-line-after
                          :editor/beginning-of-block
                          :editor/end-of-block
                          :editor/forward-word
                          :editor/backward-word
                          :editor/forward-kill-word
                          :editor/backward-kill-word
                          :editor/replace-block-reference-at-point
                          :editor/paste-text-in-one-block-at-point
                          :editor/insert-youtube-timestamp])
     (with-meta {:before m/enable-when-editing-mode!}))

    :shortcut.handler/editor-global
    (->
     (build-category-map [:command-palette/toggle
                          :editor/cycle-todo
                          :editor/up
                          :editor/down
                          :editor/left
                          :editor/right
                          :editor/move-block-up
                          :editor/move-block-down
                          :editor/open-edit
                          :editor/select-block-up
                          :editor/select-block-down
                          :editor/delete-selection
                          :editor/expand-block-children
                          :editor/collapse-block-children
                          :editor/indent
                          :editor/outdent
                          :editor/copy
                          :editor/cut
                          :editor/undo
                          :editor/redo
                          :command/toggle-favorite])
     (with-meta {:before m/enable-when-not-component-editing!}))

    :shortcut.handler/global-prevent-default
    (->
     (build-category-map [:editor/insert-link
                          :editor/select-all-blocks
                          :editor/zoom-in
                          :editor/zoom-out
                          :ui/toggle-brackets
                          :go/search-in-page
                          :go/search
                          :go/backward
                          :go/forward
                          :search/re-index
                          :sidebar/open-today-page
                          :sidebar/clear])
     (with-meta {:before m/prevent-default-behavior}))

    :shortcut.handler/misc
    ;; always overrides the copy due to "mod+c mod+s"
    {:misc/copy              (:misc/copy              all-default-keyboard-shortcuts)
     :command-palette/toggle (:command-palette/toggle all-default-keyboard-shortcuts)}

    :shortcut.handler/global-non-editing-only
    (->
     (build-category-map [:command/run
                          :go/home
                          :go/journals
                          :go/all-pages
                          :go/flashcards
                          :go/graph-view
                          :go/keyboard-shortcuts
                          :go/tomorrow
                          :go/next-journal
                          :go/prev-journal
                          :ui/toggle-document-mode
                          :ui/toggle-settings
                          :ui/toggle-right-sidebar
                          :ui/toggle-left-sidebar
                          :ui/toggle-help
                          :ui/toggle-theme
                          :ui/toggle-contents
                          :ui/open-new-window
                          :editor/open-file-in-default-app
                          :editor/open-file-in-directory
                          :ui/toggle-wide-mode
                          :ui/select-theme-color
                          :ui/goto-plugins
                          :editor/toggle-open-blocks
                          :ui/toggle-cards
                          :git/commit])
     (with-meta {:before m/enable-when-not-editing-mode!}))}))

;; Categories for docs purpose
(def category
  {:shortcut.category/basics
   ^{:doc "Basics"}
   [:editor/new-block
    :editor/new-line
    :editor/indent
    :editor/outdent
    :editor/select-all-blocks
    :go/search
    :go/search-in-page
    :editor/undo
    :editor/redo
    :editor/copy
    :editor/cut]

   :shortcut.category/formatting
   ^{:doc "Formatting"}
   [:editor/bold
    :editor/insert-link
    :editor/italics
    :editor/highlight]

   :shortcut.category/navigating
   ^{:doc "Navigation"}
   [:editor/up
    :editor/down
    :editor/left
    :editor/right
    :editor/zoom-in
    :editor/zoom-out
    :editor/collapse-block-children
    :editor/expand-block-children
    :editor/toggle-open-blocks
    :go/backward
    :go/forward
    :go/home
    :go/journals
    :go/all-pages
    :go/graph-view
    :go/flashcards
    :go/tomorrow
    :go/next-journal
    :go/prev-journal
    :go/keyboard-shortcuts
    :ui/open-new-window]

   :shortcut.category/block-editing
   ^{:doc "Block editing general"}
   [:editor/backspace
    :editor/delete
    :editor/indent
    :editor/outdent
    :editor/new-block
    :editor/new-line
    :editor/zoom-in
    :editor/zoom-out
    :editor/cycle-todo
    :editor/follow-link
    :editor/open-link-in-sidebar
    :editor/move-block-up
    :editor/move-block-down
    :editor/escape-editing]

   :shortcut.category/block-command-editing
   ^{:doc "Block command editing"}
   [:editor/backspace
    :editor/clear-block
    :editor/kill-line-before
    :editor/kill-line-after
    :editor/beginning-of-block
    :editor/end-of-block
    :editor/forward-word
    :editor/backward-word
    :editor/forward-kill-word
    :editor/backward-kill-word
    :editor/replace-block-reference-at-point
    :editor/paste-text-in-one-block-at-point]

   :shortcut.category/block-selection
   ^{:doc "Block selection (press Esc to quit selection)"}
   [:editor/open-edit
    :editor/select-all-blocks
    :editor/select-block-up
    :editor/select-block-down
    :editor/delete-selection]

   :shortcut.category/toggle
   ^{:doc "Toggle"}
   [:ui/toggle-help
    :editor/toggle-open-blocks
    :ui/toggle-wide-mode
    :ui/toggle-cards
    :ui/toggle-document-mode
    :ui/toggle-brackets
    :ui/toggle-theme
    :ui/toggle-left-sidebar
    :ui/toggle-right-sidebar
    :ui/toggle-settings
    :ui/toggle-contents]

   :shortcut.category/others
   ^{:doc "Others"}
   [:pdf/previous-page
    :pdf/next-page
    :command/run
    :command-palette/toggle
    :sidebar/clear
    :sidebar/open-today-page
    :search/re-index
    :editor/insert-youtube-timestamp
    :auto-complete/prev
    :auto-complete/next
    :auto-complete/complete
    :auto-complete/shift-complete
    :date-picker/prev-day
    :date-picker/next-day
    :date-picker/prev-week
    :date-picker/next-week
    :date-picker/complete]})

(defn add-shortcut!
  [handler-id id shortcut-map]
  (swap! config assoc-in [handler-id id] shortcut-map))

(defn remove-shortcut!
  [handler-id id]
  (swap! config medley/dissoc-in [handler-id id]))
