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
            ))

;; Credits to roamresearch
(defn prevent-default-behavior
  [f]
  (fn [e]
    (f e)
    ;; return false to prevent default browser behavior
    ;; and stop event from bubbling
    false))

(defn enable-when-not-editing-mode!
  [f]
  (fn [e]
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

(def global-bindings
  (merge
   {:editor/clear-selection editor-handler/clear-selection!
    :editor/next (fn [_] (editor-handler/open-block! true))
    :editor/prev (fn [_] (editor-handler/open-block! false))}

   ;; TODO add dev refersh shortcut

   (amend
    enable-when-not-editing-mode!
    {:editor/toggle-document-mode state/toggle-document-mode!
     :editor/toggle-settings ui-handler/toggle-settings-modal!

     :ui/toggle-help ui-handler/toggle-help!
     :ui/toggle-theme state/toggle-theme!
     :ui/toggle-right-sidebar ui-handler/toggle-right-sidebar!
     :ui/toggle-new-block state/toggle-new-block-shortcut!
     :ui/show-contents ui-handler/toggle-contents!
     :ui/toggle-wide-mode ui-handler/toggle-wide-mode!
     :ui/toggle-between-page-and-file route-handler/toggle-between-page-and-file!
     :ui/fold (editor-handler/on-tab :right)
     :ui/un-fold (editor-handler/on-tab :left)

     :git/commit (git-handler/show-commit-modal! commit/add-commit-message)})

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

     :ui/toggle-brackets config-handler/toggle-ui-show-brackets!

     :go/search route-handler/go-to-search!
     :go/journals route-handler/go-to-journals!

     :search/re-index search-handler/rebuild-indices!
     :graph/re-index #(repo-handler/re-index! nfs-handler/rebuild-index!)}
    )))

;; TODO get binding from user config
#_
(def shortcut state/get-shortcut)

;; TODO deal with mac binding in config
#_
(defonce chords
  (-> {;; disable reload on production release
       "f5" only-enable-when-dev!
       "mod+r" only-enable-when-dev!
       "mod+shift+r" only-enable-when-dev!
       ;; non-editing mode
       (or (shortcut :editor/toggle-document-mode) "t d")
       (enable-when-not-editing-mode! state/toggle-document-mode!)
       (or (shortcut :ui/toggle-theme) "t t")
       (enable-when-not-editing-mode! state/toggle-theme!)
       (or (shortcut :ui/toggle-right-sidebar) "t r")
       (enable-when-not-editing-mode! ui-handler/toggle-right-sidebar!)
       (or (shortcut :ui/toggle-new-block) "t e")
       (enable-when-not-editing-mode! state/toggle-new-block-shortcut!)
       (or (shortcut :ui/show-contents) "t c")
       (enable-when-not-editing-mode! ui-handler/toggle-contents!)
       (or (shortcut :editor/toggle-settings) "t s")
       (enable-when-not-editing-mode! ui-handler/toggle-settings-modal!)
       (or (shortcut :ui/toggle-wide-mode) "t w")
       (enable-when-not-editing-mode! ui-handler/toggle-wide-mode!)
       (or (shortcut :ui/toggle-between-page-and-file) "s")
       (enable-when-not-editing-mode! route-handler/toggle-between-page-and-file!)
       (or (shortcut :git/commit) "c")
       (enable-when-not-editing-mode! (git-handler/show-commit-modal! commit/add-commit-message))
       "tab" (-> (editor-handler/on-tab :right)
                 enable-when-not-editing-mode!)
       "shift+tab" (-> (editor-handler/on-tab :left)
                       enable-when-not-editing-mode!)

       (or (shortcut :editor/undo) "mod+z") [history-handler/undo! true]
       (or (shortcut :editor/redo) "mod+y") [history-handler/redo! true]
       (or (shortcut :editor/redo) "mod+shift+z") [history-handler/redo! true]
       (or (shortcut :go/search) "mod+u") [route-handler/go-to-search! true]
       (or (shortcut :go/journals) (if util/mac? "mod+j" "alt+j")) [route-handler/go-to-journals! true]
       (or (shortcut :editor/zoom-in) (if util/mac? "mod+." "alt+right")) [editor-handler/zoom-in! true]
       (or (shortcut :editor/zoom-out) (if util/mac? "mod+," "alt+left")) [editor-handler/zoom-out! true]
       (or (shortcut :editor/cycle-todo) "mod+enter") [editor-handler/cycle-todo! true]
       (or (shortcut :editor/expand-block-children) "mod+down") [editor-handler/expand! true]
       (or (shortcut :editor/collapse-block-children) "mod+up") [editor-handler/collapse! true]
       (or (shortcut :editor/follow-link) "mod+o") [editor-handler/follow-link-under-cursor! true]
       (or (shortcut :editor/open-link-in-sidebar) "mod+shift+o") [editor-handler/open-link-in-sidebar! true]
       (or (shortcut :editor/bold) "mod+b") [editor-handler/bold-format! true]
       (or (shortcut :editor/italics) "mod+i") [editor-handler/italics-format! true]
       (or (shortcut :editor/highlight) "mod+h") [editor-handler/highlight-format! true]
       (or (shortcut :editor/insert-link) "mod+k") [editor-handler/html-link-format! true]
       (or (shortcut :editor/select-all-blocks) "mod+shift+a") [editor-handler/select-all-blocks! true]
       (or (shortcut :editor/move-block-up) (if util/mac? "mod+shift+up" "alt+shift+up")) [(fn [state e] (editor-handler/move-up-down e true)) true]
       (or (shortcut :editor/move-block-down) (if util/mac? "mod+shift+down" "alt+shift+down")) [(fn [state e] (editor-handler/move-up-down e false)) true]
       (or (shortcut :editor/save) "mod+s") [editor-handler/save! true]

       (or (shortcut :editor/next) "down") (fn [state e] (editor-handler/open-block! true))
       (or (shortcut :editor/prev) "up") (fn [state e] (editor-handler/open-block! false))

       (or (shortcut :search/re-index) "mod+c mod+s") [search-handler/rebuild-indices! true]

       (or (shortcut :graph/re-index) "mod+c mod+r") [re-index! true]

       (or (shortcut :ui/toggle-brackets) "mod+c mod+b") [config-handler/toggle-ui-show-brackets! true]}
      (merge
       (when-not util/mac?
         {"mod+," [#(ui-handler/toggle-settings-modal!) true]}))))
