(ns frontend.modules.shortcut.handler
  (:require [frontend.components.commit :as commit]
            [frontend.handler.config :as config-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.git :as git-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.search :as search-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.web.nfs :as nfs-handler]
            [frontend.modules.shortcut.mixin :refer :all]
            [frontend.state :as state]
            [frontend.ui.date-picker :as date-picker]))

(def handler
[;; editing only
 (before
  enable-when-block-editing!
  (let [state-fn (state-f :component/box)]
    {:editor/new-block (editor-handler/keydown-new-block-handler state-fn)
     :editor/new-line (editor-handler/keydown-new-line-handler state-fn)
     :editor/up (editor-handler/keydown-up-down-handler :up)
     :editor/down (editor-handler/keydown-up-down-handler :down)
     :editor/left (editor-handler/keydown-arrow-handler :left)
     :editor/right (editor-handler/keydown-arrow-handler :right)
     :editor/delete (editor-handler/keydown-backspace-handler state-fn)
     :editor/indent (editor-handler/keydown-tab-handler state-fn :right)
     :editor/outindent (editor-handler/keydown-tab-handler state-fn :left)
     :editor/zoom-in  editor-handler/zoom-in!
     :editor/zoom-out  editor-handler/zoom-out!
     :editor/cycle-todo editor-handler/cycle-todo!
     :editor/expand-block-children editor-handler/expand!
     :editor/collapse-block-children editor-handler/collapse!
     :editor/follow-link editor-handler/follow-link-under-cursor!
     :editor/open-link-in-sidebar editor-handler/open-link-in-sidebar!
     :editor/bold editor-handler/bold-format!
     :editor/italics editor-handler/italics-format!
     :editor/highlight editor-handler/highlight-format!
     :editor/insert-link editor-handler/html-link-format!
     :editor/select-all-blocks editor-handler/select-all-blocks!
     :editor/move-block-up (editor-handler/move-up-down true)
     :editor/move-block-down (editor-handler/move-up-down false)}))

 ;; global
 (before
  prevent-default-behavior
  {:editor/select-block-up (editor-handler/on-select-block :up)
   :editor/select-block-down (editor-handler/on-select-block :down)

   :editor/save editor-handler/save!

   :ui/toggle-brackets config-handler/toggle-ui-show-brackets!
   :go/search route-handler/go-to-search!
   :go/journals route-handler/go-to-journals!

   :search/re-index search-handler/rebuild-indices!
   :graph/re-index #(repo-handler/re-index! nfs-handler/rebuild-index!)})

 ;; non-editing only
 (before
  enable-when-not-editing-mode!
  {:editor/toggle-document-mode state/toggle-document-mode!
   :editor/toggle-settings ui-handler/toggle-settings-modal!

   :editor/open-block-first (editor-handler/open-block! true)
   :editor/open-block-last (editor-handler/open-block! false)

   :ui/toggle-right-sidebar ui-handler/toggle-right-sidebar!
   :ui/toggle-help ui-handler/toggle-help!
   :ui/toggle-theme state/toggle-theme!
   :ui/toggle-new-block state/toggle-new-block-shortcut!
   :ui/show-contents ui-handler/toggle-contents!
   :ui/toggle-wide-mode ui-handler/toggle-wide-mode!
   :ui/toggle-between-page-and-file route-handler/toggle-between-page-and-file!
   :ui/fold (editor-handler/on-tab :right)
   :ui/un-fold (editor-handler/on-tab :left)

   :git/commit (git-handler/show-commit-modal! commit/add-commit-message)})

 (before
  (enable-when-component! :component/auto-complete)
  (let [state-fn (state-f :component/auto-complete)]
    {:auto-complete/prev (ui-handler/auto-complete-prev state-fn)
     :auto-complete/next (ui-handler/auto-complete-next state-fn)
     :auto-complete/complete (ui-handler/auto-complete-complete state-fn)}))

 (before
  enable-when-selection!
  {:block-selection/copy editor-handler/shortcut-copy-selection
   :block-selection/cut editor-handler/shortcut-cut-selection
   :block-selection/delete editor-handler/shortcut-delete-selection})

 (before
  (enable-when-component! :component/date-picker)
  {:date-picker/complete (date-picker/shortcut-complete (state-f :component/date-picker))
   :date-picker/prev-day date-picker/shortcut-prev-day
   :date-picker/next-day date-picker/shortcut-next-day
   :date-picker/prev-week date-picker/shortcut-prev-week
   :date-picker/next-week date-picker/shortcut-next-week})])
