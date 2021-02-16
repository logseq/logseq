(ns frontend.keyboards
  (:require [frontend.handler.editor :as editor-handler]
            [frontend.handler.history :as history-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.search :as search-handler]
            [frontend.handler.config :as config-handler]
            [frontend.state :as state]
            [frontend.search :as search]
            [frontend.util :as util]
            [medley.core :as medley]
            ["mousetrap" :as mousetrap]
            [goog.object :as gobj]))

;; Credits to roamresearch

(defn prevent-default-behavior
  [f]
  (fn [state e]
    (f state e)
    ;; return false to prevent default browser behavior
    ;; and stop event from bubbling
    false))

(defonce chords
  {
   (or (state/get-shortcut :editor/toggle-document-mode) "t d") state/toggle-document-mode!
   (or (state/get-shortcut :ui/toggle-theme) "t t") state/toggle-theme!
   (or (state/get-shortcut :ui/toggle-right-sidebar) "t r") ui-handler/toggle-right-sidebar!
   (or (state/get-shortcut :ui/toggle-new-block) "t e") state/toggle-new-block-shortcut!
   (or (state/get-shortcut :ui/toggle-between-page-and-file) "s") route-handler/toggle-between-page-and-file!
   "tab" (editor-handler/on-tab :right)
   "shift+tab" (editor-handler/on-tab :left)
   (or (state/get-shortcut :editor/undo) "mod+z") [history-handler/undo! true]
   (or (state/get-shortcut :editor/redo) "mod+y") [history-handler/redo! true]
   (or (state/get-shortcut :go/search) "mod+u") [route-handler/go-to-search! true]
   (or (state/get-shortcut :go/journals) "alt+j") [route-handler/go-to-journals! true]
   (or (state/get-shortcut :editor/zoom-in)
       (if util/mac? "alt+." "alt+right")) [editor-handler/zoom-in! true]
   (or (state/get-shortcut :editor/zoom-out)
       (if util/mac? "alt+," "alt+left")) [editor-handler/zoom-out! true]
   (or (state/get-shortcut :editor/cycle-todo)
       "mod+enter") [editor-handler/cycle-todo! true]
   (or (state/get-shortcut :editor/expand-block-children) "mod+down") [editor-handler/expand! true]
   (or (state/get-shortcut :editor/collapse-block-children) "mod+up") [editor-handler/collapse! true]
   (or (state/get-shortcut :editor/follow-link) "mod+o") [editor-handler/follow-link-under-cursor! true]
   (or (state/get-shortcut :editor/open-link-in-sidebar) "mod+shift+o") [editor-handler/open-link-in-sidebar! true]
   (or (state/get-shortcut :editor/bold) "mod+b") [editor-handler/bold-format! true]
   (or (state/get-shortcut :editor/italics) "mod+i") [editor-handler/italics-format! true]
   (or (state/get-shortcut :editor/highlight) "mod+h") [editor-handler/highlight-format! true]
   (or (state/get-shortcut :editor/insert-link) "mod+k") [editor-handler/html-link-format! true]
   (or (state/get-shortcut :editor/select-all-blocks) "mod+shift+a") [editor-handler/select-all-blocks! true]
   (or (state/get-shortcut :editor/move-block-up) "alt+shift+up") [(fn [state e] (editor-handler/move-up-down e true)) true]
   (or (state/get-shortcut :editor/move-block-down) "alt+shift+down") [(fn [state e] (editor-handler/move-up-down e false)) true]
   (or (state/get-shortcut :editor/save) "mod+s") [editor-handler/save! true]

   (or (state/get-shortcut :editor/next) "down") (fn [state e] (editor-handler/open-block! true))
   (or (state/get-shortcut :editor/prev) "up") (fn [state e] (editor-handler/open-block! false))

   (or (state/get-shortcut :search/re-index) "mod+c mod+s") [search-handler/rebuild-indices! true]
   (or (state/get-shortcut :ui/toggle-brackets) "mod+c mod+b") [config-handler/toggle-ui-show-brackets! true]})

(defonce bind! (gobj/get mousetrap "bind"))

(defn bind-shortcuts!
  []
  (doseq [[k f] chords]
    (let [[f prevent?] (if (coll? f)
                         f
                         [f false])
          f (if prevent? (prevent-default-behavior f) f)]
      (bind! k f))))
