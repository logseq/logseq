(ns frontend.modules.shortcut.data
  (:require [frontend.components.commit :as commit]
            [frontend.handler.config :as config-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.git :as git-handler]
            [frontend.handler.history :as history]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.search :as search-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.web.nfs :as nfs-handler]
            [frontend.state :as state]
            [frontend.modules.shortcut.before :as m]
            [frontend.util :refer [mac?]]))

(def data
  {:shortcut.handler/date-picker
   {:date-picker/complete
    {:binding "enter"
     :fn      ui-handler/shortcut-complete}
    :date-picker/prev-day
    {:binding "left"
     :fn      ui-handler/shortcut-prev-day}
    :date-picker/next-day
    {:binding "right"
     :fn      ui-handler/shortcut-next-day}
    :date-picker/prev-week
    {:binding "up"
     :fn      ui-handler/shortcut-prev-week}
    :date-picker/next-week
    {:binding "down"
     :fn      ui-handler/shortcut-next-week}}

   :shortcut.handler/auto-complete
   {:auto-complete/prev
    {:binding "up"
     :fn      ui-handler/auto-complete-prev}
    :auto-complete/next
    {:binding "down"
     :fn      ui-handler/auto-complete-next}
    :auto-complete/complete
    {:binding "enter"
     :fn      ui-handler/auto-complete-complete}}

   :shortcut.handler/block-editing-only
   ^{:before m/enable-when-editing-mode!}
   {:editor/backspace
    {:binding "backspace"
     :fn      editor-handler/editor-backspace}
    :editor/delete
    {:binding "delete"
     :fn      editor-handler/editor-delete}
    :editor/indent
    {:binding "tab"
     :i18n    :help/indent-block-tab
     :tags    #{:shortcut.tag/basics}
     :fn      (editor-handler/keydown-tab-handler :right)}
    :editor/outindent
    {:binding "shift+tab"
     :i18n    :help/unindent-block
     :tags    #{:shortcut.tag/basics}
     :fn      (editor-handler/keydown-tab-handler :left)}
    :editor/new-block
    {:binding "enter"
     :fn      editor-handler/keydown-new-block-handler}
    :editor/new-line
    {:binding "shift+enter"
     :fn      editor-handler/keydown-new-line-handler}
    :editor/zoom-in
    {:binding (if mac? "mod+." "alt+right")
     :fn      editor-handler/zoom-in!}
    :editor/zoom-out
    {:binding (if mac? "mod+," "alt+left")
     :fn      editor-handler/zoom-out!}
    :editor/cycle-todo
    {:binding "mod+enter"
     :fn      editor-handler/cycle-todo!}
    :editor/expand-block-children
    {:binding "mod+down"
     :fn      editor-handler/expand!}
    :editor/collapse-block-children
    {:binding "mod+up"
     :fn      editor-handler/collapse!}
    :editor/follow-link
    {:binding "mod+o"
     :fn      editor-handler/follow-link-under-cursor!}
    :editor/open-link-in-sidebar
    {:binding "mod+shift+o"
     :fn      editor-handler/open-link-in-sidebar!}
    :editor/bold
    {:binding "mod+b"
     :i18n    :bold
     :tags    #{:shortcut.tag/formatting}
     :fn      editor-handler/bold-format!}
    :editor/italics
    {:binding "mod+i"
     :i18n    :italics
     :tags    #{:shortcut.tag/formatting}
     :fn      editor-handler/italics-format!}
    :editor/highlight
    {:binding "mod+shift+h"
     :i18n    :highlight
     :tags    #{:shortcut.tag/formatting}
     :fn      editor-handler/highlight-format!}
    :editor/insert-link
    {:binding "mod+shift+k"
     :tags    #{:shortcut.tag/formatting}
     :i18n    :html-link
     :fn      editor-handler/html-link-format!}
    :editor/select-all-blocks
    {:binding "mod+shift+a"
     :fn      editor-handler/select-all-blocks!}
    :editor/move-block-up
    {:binding (if mac? "mod+shift+up"  "alt+shift+up")
     :fn      (editor-handler/move-up-down true)}
    :editor/move-block-down
    {:binding (if mac? "mod+shift+down" "alt+shift+down")
     :fn      (editor-handler/move-up-down false)}
    :editor/clear-block
    {:binding (if mac? "ctrl+l" "alt+l")
     :fn      editor-handler/clear-block-content!}
    :editor/kill-line-before
    {:binding (if mac? "ctrl+u" "alt+u")
     :fn      editor-handler/kill-line-before!}
    :editor/kill-line-after
    {:binding (if mac? false "alt+k")
     :fn      editor-handler/kill-line-after!}
    :editor/beginning-of-block
    {:binding (if mac? false "alt+a")
     :fn      editor-handler/beginning-of-block}
    :editor/end-of-block
    {:binding (if mac? false "alt+e")
     :fn      editor-handler/end-of-block}
    :editor/forward-word
    {:binding (if mac? "ctrl+shift+f" "alt+f")
     :fn      editor-handler/cursor-forward-word}
    :editor/backward-word
    {:binding (if mac? "ctrl+shift+b" "alt+b")
     :fn      editor-handler/cursor-backward-word}
    :editor/backward-kill-word
    {:binding (if mac? "ctrl+w" "alt+w")
     :fn      editor-handler/backward-kill-word}
    :editor/forward-kill-word
    {:binding (if mac? false "alt+d")
     :fn      editor-handler/forward-kill-word}}

   :shortcut.handler/editor-global
   {:editor/up
    {:binding "up"
     :fn      (editor-handler/shortcut-up-down :up)}
    :editor/down
    {:binding "down"
     :fn      (editor-handler/shortcut-up-down :down)}
    :editor/left
    {:binding "left"
     :fn      (editor-handler/shortcut-left-right :left)}
    :editor/right
    {:binding "right"
     :fn      (editor-handler/shortcut-left-right :right)}
    ;; TODO open block!
    :editor/open-edit
    {:binding "enter"
     :fn      (partial editor-handler/open-selected-block! :right)}
    :editor/select-block-up
    {:binding "shift+up"
     :fn      (editor-handler/on-select-block :up)}
    :editor/select-block-down
    {:binding "shift+down"
     :fn      (editor-handler/on-select-block :down)}
    :editor/copy
    {:binding "mod+c"
     :fn      editor-handler/shortcut-copy}
    :editor/cut
    {:binding "mod+x"
     :fn      editor-handler/shortcut-cut}
    :editor/delete-selection
    {:binding ["backspace" "delete"]
     :fn      editor-handler/delete-selection}
    :editor/undo
    {:binding "mod+z"
     :fn      history/undo!}
    :editor/redo
    {:binding ["shift+mod+z" "mod+y"]
     :fn      history/redo!}
    :editor/save
    {:binding "mod+s"
     :fn      editor-handler/save!}}

   :shortcut.handler/global-prevent-default
   ^{:before m/prevent-default-behavior}
   {:ui/toggle-brackets
    {:binding "mod+c mod+b"
     :fn      config-handler/toggle-ui-show-brackets!}
    :go/search
    {:binding "mod+u"
     :fn      route-handler/go-to-search!}
    :go/journals
    {:binding (if mac? "mod+j" "alt+j")
     :fn      route-handler/go-to-journals!}
    :search/re-index
    {:binding "mod+c mod+s"
     :fn      search-handler/rebuild-indices!}
    :graph/re-index
    {:binding "mod+c mod+r"
     :fn      #(repo-handler/re-index! nfs-handler/rebuild-index!)}}


   :shortcut.handler/global-non-editing-only
   ^{:before m/enable-when-not-editing-mode!}
   {:editor/toggle-document-mode
    {:binding "t d"
     :fn      state/toggle-document-mode!}
    :editor/toggle-settings
    {:binding (if mac? "t s" ["t s" "mod+,"])
     :fn      ui-handler/toggle-settings-modal!}
    :ui/toggle-right-sidebar
    {:binding "t r"
     :fn      ui-handler/toggle-right-sidebar!}
    :ui/toggle-help
    {:binding "shift+/"
     :fn      ui-handler/toggle-help!}
    :ui/toggle-theme
    {:binding "t t"
     :fn      state/toggle-theme!}
    :ui/toggle-new-block
    {:binding "t e"
     :fn      state/toggle-new-block-shortcut!}
    :ui/show-contents
    {:binding "t c"
     :fn      ui-handler/toggle-contents!}
    :ui/toggle-wide-mode
    {:binding "t w"
     :fn      ui-handler/toggle-wide-mode!}
    ;; :ui/toggle-between-page-and-file route-handler/toggle-between-page-and-file!
    :ui/fold
    {:binding "tab"
     :fn      (editor-handler/on-tab :right)}
    :ui/un-fold
    {:binding "shift+tab"
     :fn      (editor-handler/on-tab :left)}
    :git/commit
    {:binding "g c"
     :fn      (git-handler/show-commit-modal! commit/add-commit-message)}}})
