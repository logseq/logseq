(ns frontend.components.shortcut
  (:require [rum.core :as rum]
            [frontend.context.i18n :as i18n]
            [frontend.util :as util]
            [frontend.modules.shortcut.data-helper :as dh]))

(rum/defc shortcut-table
  [tag]
  (rum/with-context [[t] i18n/*tongue-context*]
    [:table
     [:thead
      [:tr
       [:th [:b (t tag)]]
       [:th (t :help/shortcut)]]]
     [:tbody
      (map (fn [[k {:keys [i18n binding]}]]
             [:tr {:key k}
              [:td (t i18n)]
              [:td binding]])
           (dh/binding-by-tag tag))]]))

(rum/defc shortcut
  []
  (rum/with-context [[t] i18n/*tongue-context*]
    [:div
     [:h1.title (t :shortcut/page-title)]
       [:table
        [:thead
         [:tr
          [:th [:b (t :help/shortcuts-triggers)]]
          [:th (t :help/shortcut)]]]
        [:tbody
         [:tr [:td (t :help/slash-autocomplete)] [:td "/"]]
         [:tr [:td (t :help/block-content-autocomplete)] [:td "<"]]
         [:tr [:td (t :help/reference-autocomplete)] [:td "[[]]"]]
         [:tr [:td (t :help/block-reference)] [:td "(())"]]]]
     (shortcut-table :shortcut.tag/basics)

     #_
     [:table
      [:thead
       [:tr
        [:th [:b "Basics"]]
        [:th (t :help/shortcut)]]]
      [:tbody
       [:tr [:td (t :shortcut.editor/indent)] [:td "Tab"]]
       [:tr [:td (t :help/unindent-block)] [:td "Shift-Tab"]]
       [:tr [:td (t :help/move-block-up)] [:td (util/->platform-shortcut "Alt-Shift-Up")]]
       [:tr [:td (t :help/move-block-down)] [:td (util/->platform-shortcut "Alt-Shift-Down")]]
       [:tr [:td (t :help/create-new-block)] [:td "Enter"]]
       [:tr [:td (t :help/new-line-in-block)] [:td "Shift-Enter"]]
       [:tr [:td (t :undo)] [:td (util/->platform-shortcut "Ctrl-z")]]
       [:tr [:td (t :redo)] [:td (util/->platform-shortcut "Ctrl-y")]]
       [:tr [:td (t :help/zoom-in)] [:td (util/->platform-shortcut (if util/mac? "Cmd-." "Alt-Right"))]]
       [:tr [:td (t :help/zoom-out)] [:td (util/->platform-shortcut (if util/mac? "Cmd-," "Alt-left"))]]
       [:tr [:td (t :help/follow-link-under-cursor)] [:td (util/->platform-shortcut "Ctrl-o")]]
       [:tr [:td (t :help/open-link-in-sidebar)] [:td (util/->platform-shortcut "Ctrl-shift-o")]]
       [:tr [:td (t :expand)] [:td (util/->platform-shortcut "Ctrl-Down")]]
       [:tr [:td (t :collapse)] [:td (util/->platform-shortcut "Ctrl-Up")]]
       [:tr [:td (t :select-block-above)] [:td "Shift-Up"]]
       [:tr [:td (t :select-block-below)] [:td "Shift-Down"]]
       [:tr [:td (t :select-all-blocks)] [:td (util/->platform-shortcut "Ctrl-Shift-a")]]]]
       [:table
        [:thead
         [:tr
          [:th [:b (t :general)]]
          [:th (t :help/shortcut)]]]
        [:tbody
         [:tr [:td (t :help/toggle)] [:td "?"]]
         [:tr [:td (t :help/git-commit-message)] [:td "c"]]
         [:tr [:td (t :help/full-text-search)] [:td (util/->platform-shortcut "Ctrl-u")]]
         [:tr [:td (t :help/page-search)] [:td (util/->platform-shortcut "Ctrl-Shift-u")]]
         [:tr [:td (t :help/open-link-in-sidebar)] [:td "Shift-Click"]]
         [:tr [:td (t :help/context-menu)] [:td "Right Click"]]
         [:tr [:td (t :help/fold-unfold)] [:td "Tab"]]
         [:tr [:td (t :help/toggle-contents)] [:td "t c"]]
         [:tr [:td (t :help/toggle-doc-mode)] [:td "t d"]]
         [:tr [:td (t :help/toggle-theme)] [:td "t t"]]
         [:tr [:td (t :help/toggle-right-sidebar)] [:td "t r"]]
         [:tr [:td (t :help/toggle-settings)] [:td "t s"]]
         [:tr [:td (t :help/toggle-insert-new-block)] [:td "t e"]]
         [:tr [:td (t :help/jump-to-journals)] [:td (if util/mac? "Cmd-j" "Alt-j")]]]]
       (shortcut-table :shortcut.tag/formatting)

     ]


    )
  )
