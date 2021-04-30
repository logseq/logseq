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
            [frontend.modules.shortcut.mixin :refer [before] :as m]
            [frontend.state :as state]
            [frontend.handler.history :as history]))

(def editing
  {:editor/delete editor-handler/editor-delete})

(def editing-only-prevent-default
  {
   ;; FIXME: tab not working anymore in the scheduled dialog
   :editor/indent (editor-handler/keydown-tab-handler :right)
   :editor/outindent (editor-handler/keydown-tab-handler :left)
   :editor/new-block editor-handler/keydown-new-block-handler
   :editor/new-line editor-handler/keydown-new-line-handler
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
   :editor/move-block-down (editor-handler/move-up-down false)})

(def handler
  [;; global editor shortcut
   {:editor/up (editor-handler/shortcut-up-down :up)
    :editor/down (editor-handler/shortcut-up-down :down)
    :editor/left (editor-handler/shortcut-left-right :left)
    :editor/right (editor-handler/shortcut-left-right :right)
    :editor/open-edit (partial editor-handler/open-selected-block! :right)
    :editor/select-block-up (editor-handler/on-select-block :up)
    :editor/select-block-down (editor-handler/on-select-block :down)
    :editor/copy editor-handler/shortcut-copy
    :editor/cut editor-handler/shortcut-cut
    :editor/delete-selection editor-handler/delete-selection
    :editor/save editor-handler/save!
    :editor/undo history/undo!
    :editor/redo history/redo!}

   ;; global
   {:ui/toggle-brackets config-handler/toggle-ui-show-brackets!
    :go/search route-handler/go-to-search!
    :go/journals route-handler/go-to-journals!

    :search/re-index search-handler/rebuild-indices!
    :graph/re-index #(repo-handler/re-index! nfs-handler/rebuild-index!)}

   ;; non-editing only
   (before
    m/enable-when-not-editing-mode!
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
     ;; :ui/toggle-between-page-and-file route-handler/toggle-between-page-and-file!
     :ui/fold (editor-handler/on-tab :right)
     :ui/un-fold (editor-handler/on-tab :left)

     :git/commit (git-handler/show-commit-modal! commit/add-commit-message)})])
