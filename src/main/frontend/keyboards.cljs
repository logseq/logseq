(ns frontend.keyboards
  (:require [frontend.handler.editor :as editor-handler]
            [frontend.handler.history :as history-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.search :as search-handler]
            [frontend.handler.config :as config-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.git :as git-handler]
            [frontend.handler.web.nfs :as nfs-handler]
            [frontend.components.commit :as commit]
            [frontend.state :as state]
            [frontend.config :as config]
            [clojure.string :as s]))

;; Credits to roamresearch
(defn prevent-default-behavior
  [f]
  (fn [e]
    (js/console.log "enable prevent default")
    (f e)
    ;; return false to prevent default browser behavior
    ;; and stop event from bubbling
    false))

(defn enable-when-not-editing-mode!
  [f]
  (fn [e]
    (js/console.log "enable when not editing")
    (when-not (state/editing?)
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

(defn debug
  [f]
  (def f f)
  (let [n (as-> (.-name f) $
            (demunge $)
            (s/split $ #"/")
            ((juxt butlast last) $)
            (update $ 0 #(s/join "." %))
            (s/join "/" $))]
    (fn [e]
      (js/console.log "going to trigger " n (.-identifier e))
      (f e))))

(def global-bindings
  (amend
   debug
   (merge
    {:editor/clear-selection editor-handler/clear-selection!
     :ui/refresh only-enable-when-dev!}
    (amend
     prevent-default-behavior
     {:editor/undo history-handler/undo!
      :editor/redo history-handler/redo!
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
      :editor/move-block-down (partial editor-handler/move-up-down false)
      :editor/save editor-handler/save!
      :editor/select-block-up (partial editor-handler/on-select-block true)
      :editor/select-block-down (partial editor-handler/on-select-block false)

      :ui/toggle-brackets config-handler/toggle-ui-show-brackets!


      :go/search route-handler/go-to-search!
      :go/journals route-handler/go-to-journals!

      :search/re-index search-handler/rebuild-indices!
      :graph/re-index #(repo-handler/re-index! nfs-handler/rebuild-index!)})

    (amend
     enable-when-not-editing-mode!
     {:editor/toggle-document-mode state/toggle-document-mode!
      :editor/toggle-settings ui-handler/toggle-settings-modal!
      :editor/next #(editor-handler/open-block! true)
      :editor/prev #(editor-handler/open-block! false)

      :ui/toggle-help ui-handler/toggle-help!
      :ui/toggle-theme state/toggle-theme!
      :ui/toggle-right-sidebar ui-handler/toggle-right-sidebar!
      :ui/toggle-new-block state/toggle-new-block-shortcut!
      :ui/show-contents ui-handler/toggle-contents!
      :ui/toggle-wide-mode ui-handler/toggle-wide-mode!
      :ui/toggle-between-page-and-file route-handler/toggle-between-page-and-file!
      :ui/fold (editor-handler/on-tab :right)
      :ui/un-fold (editor-handler/on-tab :left)

      :git/commit (git-handler/show-commit-modal! commit/add-commit-message)}))))
