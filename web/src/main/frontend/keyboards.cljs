(ns frontend.keyboards
  (:require [frontend.handler :as handler]
            [frontend.state :as state]))

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

(defonce keyboards
  {"ctrl+alt+d" state/toggle-document-mode!
   "ctrl+z" handler/undo!
   "ctrl+y" handler/redo!
   "ctrl+alt+r" handler/toggle-right-sidebar!
   "ctrl+u" handler/go-to-search!
   "alt+j" handler/go-to-journals!
   "alt+right" handler/zoom-in!
   "ctrl+o" handler/follow-link-under-cursor!
   "ctrl+shift+o" handler/open-link-in-sidebar!
   "ctrl+b" handler/bold-format!
   "ctrl+i" handler/italics-format!
   "ctrl+k" handler/html-link-format!
   "ctrl+h" handler/highlight-format!})
