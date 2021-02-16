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

(defn enable-when-not-editing-mode!
  [f]
  (fn [state e]
    (when-not (state/editing?)
      (f state e))))

(def shortcut state/get-shortcut)

(defonce chords
  {
   ;; non-editing mode
   (or (shortcut :editor/toggle-document-mode) "t d")
   (enable-when-not-editing-mode! state/toggle-document-mode!)
   (or (shortcut :ui/toggle-theme) "t t")
   (enable-when-not-editing-mode! state/toggle-theme!)
   (or (shortcut :ui/toggle-right-sidebar) "t r")
   (enable-when-not-editing-mode! ui-handler/toggle-right-sidebar!)
   (or (shortcut :ui/toggle-new-block) "t e")
   (enable-when-not-editing-mode! state/toggle-new-block-shortcut!)
   (or (shortcut :ui/toggle-between-page-and-file) "s")
   (enable-when-not-editing-mode! route-handler/toggle-between-page-and-file!)

   "tab" (editor-handler/on-tab :right)
   "shift+tab" (editor-handler/on-tab :left)
   (or (shortcut :editor/undo) "mod+z") [history-handler/undo! true]
   (or (shortcut :editor/redo) "mod+y") [history-handler/redo! true]
   (or (shortcut :go/search) "mod+u") [route-handler/go-to-search! true]
   (or (shortcut :go/journals) "alt+j") [route-handler/go-to-journals! true]
   (or (shortcut :editor/zoom-in)
       (if util/mac? "alt+." "alt+right")) [editor-handler/zoom-in! true]
   (or (shortcut :editor/zoom-out)
       (if util/mac? "alt+," "alt+left")) [editor-handler/zoom-out! true]
   (or (shortcut :editor/cycle-todo)
       "mod+enter") [editor-handler/cycle-todo! true]
   (or (shortcut :editor/expand-block-children) "mod+down") [editor-handler/expand! true]
   (or (shortcut :editor/collapse-block-children) "mod+up") [editor-handler/collapse! true]
   (or (shortcut :editor/follow-link) "mod+o") [editor-handler/follow-link-under-cursor! true]
   (or (shortcut :editor/open-link-in-sidebar) "mod+shift+o") [editor-handler/open-link-in-sidebar! true]
   (or (shortcut :editor/bold) "mod+b") [editor-handler/bold-format! true]
   (or (shortcut :editor/italics) "mod+i") [editor-handler/italics-format! true]
   (or (shortcut :editor/highlight) "mod+h") [editor-handler/highlight-format! true]
   (or (shortcut :editor/insert-link) "mod+k") [editor-handler/html-link-format! true]
   (or (shortcut :editor/select-all-blocks) "mod+shift+a") [editor-handler/select-all-blocks! true]
   (or (shortcut :editor/move-block-up) "alt+shift+up") [(fn [state e] (editor-handler/move-up-down e true)) true]
   (or (shortcut :editor/move-block-down) "alt+shift+down") [(fn [state e] (editor-handler/move-up-down e false)) true]
   (or (shortcut :editor/save) "mod+s") [editor-handler/save! true]

   (or (shortcut :editor/next) "down") (fn [state e] (editor-handler/open-block! true))
   (or (shortcut :editor/prev) "up") (fn [state e] (editor-handler/open-block! false))

   (or (shortcut :search/re-index) "mod+c mod+s") [search-handler/rebuild-indices! true]
   (or (shortcut :ui/toggle-brackets) "mod+c mod+b") [config-handler/toggle-ui-show-brackets! true]})

(defonce bind! (gobj/get mousetrap "bind"))

(defn bind-shortcuts!
  []
  (doseq [[k f] chords]
    (let [[f prevent?] (if (coll? f)
                         f
                         [f false])
          f (if prevent? (prevent-default-behavior f) f)]
      (bind! k f))))
