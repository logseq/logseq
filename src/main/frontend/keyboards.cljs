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

;; TODO: make the shortcuts configurable
(defonce chords
  {
   "t d" state/toggle-document-mode!
   "t t" state/toggle-theme!
   "t r" ui-handler/toggle-right-sidebar!
   "t e" state/toggle-new-block-shortcut!
   "s" route-handler/toggle-between-page-and-file!
   "tab" (editor-handler/on-tab :right)
   "shift+tab" (editor-handler/on-tab :left)
   "mod+z" [history-handler/undo! true]
   "mod+y" [history-handler/redo! true]
   "mod+u" [route-handler/go-to-search! true]
   "alt+j" [route-handler/go-to-journals! true]
   (or (state/get-shortcut :editor/zoom-in)
       (if util/mac? "alt+." "alt+right")) [editor-handler/zoom-in! true]
   (or (state/get-shortcut :editor/zoom-out)
       (if util/mac? "alt+," "alt+left")) [editor-handler/zoom-out! true]
   "mod+enter" [editor-handler/cycle-todo! true]
   "mod+down" [editor-handler/expand! true]
   "mod+up" [editor-handler/collapse! true]
   "mod+shift+o" [editor-handler/open-link-in-sidebar! true]
   "mod+b" [editor-handler/bold-format! true]
   "mod+i" [editor-handler/italics-format! true]
   "mod+k" [editor-handler/html-link-format! true]
   "mod+h" [editor-handler/highlight-format! true]
   "mod+shift+a" [editor-handler/select-all-blocks! true]
   "alt+shift+up" [(fn [state e] (editor-handler/move-up-down e true)) true]
   "alt+shift+down" [(fn [state e] (editor-handler/move-up-down e false)) true]
   "mod+s" [editor-handler/save! true]
   "mod+c mod+s" [search-handler/rebuild-indices! true]
   "mod+c mod+b" [config-handler/toggle-ui-show-brackets! true]
   "ctrl+o" [editor-handler/follow-link-under-cursor! true]})

(defonce bind! (gobj/get mousetrap "bind"))

(defn bind-shortcuts!
  []
  (doseq [[k f] chords]
    (let [[f prevent?] (if (coll? f)
                         f
                         [f false])
          f (if prevent? (prevent-default-behavior f) f)]
      (bind! k f))))
