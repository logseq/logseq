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

;; KeyCodes.QUESTION_MARK

;; Credits to roamresearch

;; Triggers
;; Slash Autocomplete /
;; Block Insert Autocomplete <
;; Page reference Autocomplete [[]]
;; Block Reference Autocomplete (())

;; Key Commands (working with lists)
;; Indent Block Tab
;; Unindent Block Shift-Tab
;; Create New Block Enter
;; New Line in Block Shift-Enter
;; Undo Ctrl-z
;; Redo Ctrl-y
;; Zoom In Alt-Right
;; Zoom out Alt-left
;; Follow link under cursor Ctrl-o
;; Open link in Sidebar Ctrl-shift-o
;; Select Block Above Shift-Up
;; Select Block Below Shift-Down
;; Insert New Block Above Ctrl-Shift-Up
;; Insert New Block Below Ctrl-Shift-Enter
;; Select All Blocks Ctrl-Shift-a

;; General
;; Full Text Search
;; Open Link in Sidebar
;; Context Menu
;; Jump to Journals

;; Formatting
;; Bold Ctrl-b
;; Italics Ctrl-i
;; Html Link Ctrl-k
;; Highlight Ctrl-h

;; Markdown
;; Block

(def keyboards
  (->>
   {"tab" (editor-handler/on-tab :right)
    "shift+tab" (editor-handler/on-tab :left)
    "ctrl+z" history-handler/undo!
    "ctrl+y" history-handler/redo!
    "ctrl+u" route-handler/go-to-search!
    "alt+j" route-handler/go-to-journals!
    (or (state/get-shortcut :editor/zoom-in)
        (if util/mac? "alt+." "alt+right")) editor-handler/zoom-in!
    (or (state/get-shortcut :editor/zoom-out)
        (if util/mac? "alt+," "alt+left")) editor-handler/zoom-out!
    "ctrl+enter" editor-handler/cycle-todo!
    "ctrl+down" editor-handler/expand!
    "ctrl+up" editor-handler/collapse!
    "ctrl+o" editor-handler/follow-link-under-cursor!
    "ctrl+shift+o" editor-handler/open-link-in-sidebar!
    "ctrl+b" editor-handler/bold-format!
    "ctrl+i" editor-handler/italics-format!
    "ctrl+k" editor-handler/html-link-format!
    "ctrl+h" editor-handler/highlight-format!
    "ctrl+shift+a" editor-handler/select-all-blocks!
    "alt+shift+up" (fn [state e] (editor-handler/move-up-down e true))
    "alt+shift+down" (fn [state e] (editor-handler/move-up-down e false))
    "shift+ctrl+up" editor-handler/insert-new-block-above!
    "shift+ctrl+enter" editor-handler/insert-new-block-below!
    }
   (medley/map-keys util/->system-modifier)))

(defn chord-aux
  [f]
  (fn [_state _e]
    (f)
    ;; return false to prevent default browser behavior
    ;; and stop event from bubbling
    false))

(defonce chords
  {;; Toggle
   "t d" state/toggle-document-mode!
   "t t" state/toggle-theme!
   "t r" ui-handler/toggle-right-sidebar!
   "t e" state/toggle-new-block-shortcut!
   "s" route-handler/toggle-between-page-and-file!
   "mod+s" (chord-aux editor-handler/save!)
   "mod+c mod+s" (chord-aux search-handler/rebuild-indices!)
   "mod+c mod+b" (chord-aux config-handler/toggle-ui-show-brackets!)})

(defonce bind! (gobj/get mousetrap "bind"))

(defn bind-shortcuts!
  []
  (doseq [[k f] chords]
    (bind! k f)))
