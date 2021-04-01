(ns frontend.keyboards.config
  (:require [frontend.util :refer [mac?]]))

(def default-shortcuts
  {:date-picker/complete "enter"
   :date-picker/prev-day "left"
   :date-picker/next-day "right"
   :date-picker/prev-week "up"
   :date-picker/next-week "down"

   :auto-complete/prev "up"
   :auto-complete/next "down"
   :auto-complete/complete "enter"

   :block-selection/copy "mod+c"
   :block-selection/cut "mod+x"
   :block-selection/delete ["backspace" "delete"]

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
   :editor/open-block-next "down"
   :editor/open-block-prev "up"
   :editor/select-block-up "shift+up"
   :editor/select-block-down "shift+down"

   :editor/new-block "enter"
   :editor/new-line "shift+enter"
   :editor/up "up"
   :editor/down "down"
   :editor/left "left"
   :editor/right "right"
   :editor/delete "backspace"
   :editor/indent "tab"
   :editor/unindent "shift+tab"

   :ui/toggle-help "shift+/"
   :ui/toggle-theme "t t"
   :ui/toggle-right-sidebar "t r"
   :ui/toggle-new-block "t e"
   :ui/show-contents "t c"
   :ui/toggle-wide-mode "t w"
   :ui/toggle-between-page-and-file "s"
   :ui/fold "tab"
   :ui/un-fold "shift+tab"
   :ui/toggle-brackets "mod+c mod+b"
   :ui/refresh ["f5" "mod+r" "mod+shift+r"]

   :go/search "mod+u"
   :go/journals (if mac? "mod+j" "alt+j")

   :git/commit "g c"

   :search/re-index "mod+c mod+s"
   :graph/re-index "mod+c mod+r"
   })

(def custom-bindings-for-test
  {:editor/new-block "enter"
   :editor/new-line "shift+enter"
   :editor/up ["ctrl+k" ]
   :editor/down ["ctrl+j" ]
   :editor/left ["ctrl+h" ]
   :editor/right ["ctrl+l" ]
   :editor/delete ["ctrl+d" "backspace"]

   :date-picker/complete "enter"
   :date-picker/prev-day ["ctrl+h" "left"]
   :date-picker/next-day ["ctrl+l" "right"]
   :date-picker/prev-week ["ctrl+k" "up"]
   :date-picker/next-week ["ctrl+j" "down"]

   :auto-complete/prev ["ctrl+k" "up"]
   :auto-complete/next ["ctrl+j" "down"]
   :auto-complete/complete ["ctrl+l" "enter"]})
