(ns frontend.modules.shortcut.binding
  (:require [frontend.util :refer [mac?]]))

(def default
  {:date-picker/complete "enter"
   :date-picker/prev-day "left"
   :date-picker/next-day "right"
   :date-picker/prev-week "up"
   :date-picker/next-week "down"

   ;; auto complete navigation, works for command prompt, search prompt or any auto complete prompt
   :auto-complete/prev "up"
   :auto-complete/next "down"
   :auto-complete/complete "enter"

   :editor/clear-selection "esc"
   :editor/toggle-document-mode "t d"
   :editor/toggle-settings (if mac? "t s" ["t s" "mod+,"])
   :editor/undo "mod+z"
   :editor/redo ["shift+mod+z" "mod+y"]
   :editor/zoom-in (if mac? "mod+." "alt+right")
   :editor/zoom-out (if mac? "mod+," "alt+left")
   :editor/cycle-todo "mod+enter"
   :editor/expand-block-children "mod+down"
   :editor/collapse-block-children "mod+up"
   :editor/follow-link "mod+o"
   :editor/open-link-in-sidebar "mod+shift+o"
   :editor/bold "mod+b"
   :editor/italics "mod+i"
   :editor/highlight "mod+shift+h"
   :editor/insert-link "mod+shift+i"
   :editor/select-all-blocks "mod+shift+a"
   :editor/move-block-up (if mac? "mod+shift+up"  "alt+shift+up")
   :editor/move-block-down (if mac? "mod+shift+down" "alt+shift+down")
   :editor/save "mod+s"
   :editor/open-block-first "alt+down"
   :editor/open-block-last "alt+up"
   :editor/select-block-up "shift+up"
   :editor/select-block-down "shift+down"

   :editor/new-block "enter"
   :editor/new-line "shift+enter"
   ;; 1. when block selection, select up/down
   ;;    open edit block at leftmost or rightmost
   ;; 2. when in editing, normal cursor arrow key move
   :editor/up "up"
   :editor/down "down"
   :editor/left "left"
   :editor/right "right"
   ;; open selected block and edit
   :editor/open-edit "enter"
   :editor/indent "tab"
   :editor/outindent "shift+tab"

   :editor/copy "mod+c"
   :editor/cut "mod+x"
   :editor/backspace "backspace"
   :editor/delete "delete"
   :editor/delete-selection ["backspace" "delete"]

   ;; clear the block content
   :editor/clear-block "alt+l"
   ;; kill the line before the cursor position
   :editor/kill-line-before "alt+u"
   ;; kill the line after the cursor position
   :editor/kill-line-after "alt+k"
   ;; go to the beginning of the block
   :editor/beginning-of-block "alt+a"
   ;; go to the end of the block
   :editor/end-of-block "alt+e"
   ;; forward one word
   :editor/forward-word "alt+f"
   ;; backward one word
   :editor/backward-word "alt+b"
   ;; kill one word backward
   :editor/backward-kill-word "alt+w"
   ;; kill one word forward
   :editor/forward-kill-word "alt+d"


   :editor/selection-up "up"
   :editor/selection-down "down"

   :ui/toggle-help "shift+/"
   :ui/toggle-theme "t t"
   :ui/toggle-right-sidebar "t r"
   :ui/toggle-new-block "t e"
   :ui/show-contents "t c"
   :ui/toggle-wide-mode "t w"
   ;; :ui/toggle-between-page-and-file "s"
   :ui/fold "tab"
   :ui/un-fold "shift+tab"
   :ui/toggle-brackets "mod+c mod+b"
   :ui/refresh ["f5" "mod+r" "mod+shift+r"]

   :go/search "mod+u"
   :go/journals (if mac? "mod+j" "alt+j")

   :git/commit "g c"

   :search/re-index "mod+c mod+s"
   :graph/re-index "mod+c mod+r"})

;; (def custom
;;   {:editor/new-block "enter"
;;    :editor/new-line "shift+enter"
;;    :editor/up ["ctrl+k" "up"]
;;    :editor/down ["ctrl+j" "down"]
;;    :editor/left ["ctrl+h" "left"]
;;    :editor/right ["ctrl+l" "right"]
;;    :editor/delete ["ctrl+d" "backspace"]

;;    :date-picker/complete ["ctrl+a" "enter"]
;;    :date-picker/prev-day ["ctrl+h" "left"]
;;    :date-picker/next-day ["ctrl+l" "right"]
;;    :date-picker/prev-week ["ctrl+k" "up"]
;;    :date-picker/next-week ["ctrl+j" "down"]

;;    :auto-complete/prev ["ctrl+k" "up"]
;;    :auto-complete/next ["ctrl+j" "down"]
;;    :auto-complete/complete ["ctrl+l" "enter"]})
