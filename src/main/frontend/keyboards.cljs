(ns frontend.keyboards
  (:require [frontend.components.commit :as commit]
            [frontend.config :as config]
            [frontend.handler.config :as config-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.git :as git-handler]
            [frontend.handler.history :as history-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.search :as search-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.ui.date-picker :as date-picker]
            [frontend.handler.web.nfs :as nfs-handler]
            [frontend.state :as state]
            [goog.object :as gobj]))

;; Credits to roamresearch
(defn prevent-default-behavior
  [f]
  (fn [e]
    (f e)
    ;; return false to prevent default browser behavior
    ;; and stop event from bubbling
    false))

(defn- target-is-text?
  [e]
  (let [type (-> e
                 (gobj/get "target")
                 (gobj/get "type"))]
    (contains? #{"text"} type)))

(defn enable-when-not-editing-mode!
  [f]
  (fn [e]
    (js/console.log "enable when not editing")
    (when-not (or (state/editing?)
                  (target-is-text? e))
      (f e))
    true))

(defn only-enable-when-dev!
  [_e]
  (boolean config/dev?))

(defn- amend [f dispatcher]
  (reduce-kv (fn [r k v]
               (assoc r k (f v)))
   {}
   dispatcher))

(def shortcuts
[;; editing state
 (amend
  prevent-default-behavior
  {:editor/new-block editor-handler/keydown-new-block-handler
  :editor/new-line editor-handler/keydown-new-line-handler
  :editor/up (editor-handler/keydown-up-down-handler true)
  :editor/down (editor-handler/keydown-up-down-handler false)
  :editor/left (editor-handler/keydown-arrow-handler :left)
  :editor/right (editor-handler/keydown-arrow-handler :right)
  :editor/delete editor-handler/keydown-backspace-handler
  :editor/indent (editor-handler/keydown-tab-handler :right)
  :editor/unindent (editor-handler/keydown-tab-handler :left)
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
  :editor/move-block-up (partial editor-handler/move-up-down true)
  :editor/move-block-down (partial editor-handler/move-up-down false)})



 ;; global
 (amend
  prevent-default-behavior
  {;; TODO select up/down did not work
   :editor/select-block-up (partial editor-handler/on-select-block :up)
   :editor/select-block-down (partial editor-handler/on-select-block :down)

   :editor/save editor-handler/save!

   :ui/toggle-brackets config-handler/toggle-ui-show-brackets!
   :go/search route-handler/go-to-search!
   :go/journals route-handler/go-to-journals!

   :search/re-index search-handler/rebuild-indices!
   :graph/re-index #(repo-handler/re-index! nfs-handler/rebuild-index!)})

 ;; non-editing
 (amend
  enable-when-not-editing-mode!
  {:editor/toggle-document-mode state/toggle-document-mode!
   :editor/toggle-settings ui-handler/toggle-settings-modal!

   ;;TODO why two open block? what does first? parameter mean?
   :editor/open-block-prev #(editor-handler/open-block! true)
   :editor/open-block-next #(editor-handler/open-block! false)

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

 #_
 {:auto-complete/prev ui-handler/auto-complete-prev
  :auto-complete/next ui-handler/auto-complete-next
  :auto-complete/complete ui-handler/auto-complete-complete}

 {:block-selection/copy editor-handler/shortcut-copy-selection
  :block-selection/cut editor-handler/shortcut-cut-selection
  :block-selection/delete editor-handler/shortcut-delete-selection}

 #_
 (amend
  prevent-default-behavior
  {:date-picker/complete date-picker/shortcut-complete
   :date-picker/prev-day date-picker/shortcut-prev-day
   :date-picker/next-day date-picker/shortcut-next-day
   :date-picker/prev-week date-picker/shortcut-prev-week
   :date-picker/next-week date-picker/shortcut-next-week})
 ])
