(ns frontend.components.shortcut
  (:require [rum.core :as rum]
            [frontend.context.i18n :as i18n]
            [frontend.util :as util]
            [frontend.state :as state]
            [frontend.modules.shortcut.data-helper :as dh]
            [frontend.modules.shortcut.config :as config]))
(def *shortcut-config (rum/cursor-in state/state [:config (state/get-current-repo) :shortcuts]))

(rum/defc shortcut-table < rum/reactive
  [name]
  (let [_ (rum/react *shortcut-config)]
    (rum/with-context [[t] i18n/*tongue-context*]
      [:div
       [:table
        [:thead
         [:tr
          [:th [:b (t name)]]
          [:th (t :help/shortcut)]]]
        [:tbody
         (map (fn [[k {:keys [i18n binding]}]]
                [:tr {:key k}
                 [:td (t i18n)]
                 [:td binding]])
              (dh/binding-by-category name))]]])))

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
     (shortcut-table :shortcut.category/basics)
     (shortcut-table :shortcut.category/navigating)
     (shortcut-table :shortcut.category/block-editing)
     (shortcut-table :shortcut.category/block-command-editing)
     (shortcut-table :shortcut.category/block-selection)
     #_
     [:table
      [:thead
       [:tr
        [:th [:b "Basics"]]
        [:th (t :help/shortcut)]]]
      [:tbody
       [:tr [:td (t :shortcut.editor/indent)] [:td "Tab"]]
       [:tr [:td (t :shortcut.editor/outdent)] [:td "Shift-Tab"]]
       [:tr [:td (t :shortcut.editor/move-block-up)] [:td (util/->platform-shortcut "Alt-Shift-Up")]]
       [:tr [:td (t :shortcut.editor/move-block-down)] [:td (util/->platform-shortcut "Alt-Shift-Down")]]
       [:tr [:td (t :help/create-new-block)] [:td "Enter"]]
       [:tr [:td (t :shortcut.editor/new-line)] [:td "Shift-Enter"]]
       [:tr [:td (t :undo)] [:td (util/->platform-shortcut "Ctrl-z")]]
       [:tr [:td (t :redo)] [:td (util/->platform-shortcut "Ctrl-y")]]
       [:tr [:td (t :help/zoom-in)] [:td (util/->platform-shortcut (if util/mac? "Cmd-." "Alt-Right"))]]
       [:tr [:td (t :shortcut.editor/zoom-out)] [:td (util/->platform-shortcut (if util/mac? "Cmd-," "Alt-left"))]]
       [:tr [:td (t :shortcut.editor/follow-link)] [:td (util/->platform-shortcut "Ctrl-o")]]
       [:tr [:td (t :shortcut.editor/open-link-in-sidebar)] [:td (util/->platform-shortcut "Ctrl-shift-o")]]
       [:tr [:td (t :shortcut.editor/expand-block-children)] [:td (util/->platform-shortcut "Ctrl-Down")]]
       [:tr [:td (t :collapse)] [:td (util/->platform-shortcut "Ctrl-Up")]]
       [:tr [:td (t :shortcut.editor/select-block-up)] [:td "Shift-Up"]]
       [:tr [:td (t :shortcut.editor/select-block-down)] [:td "Shift-Down"]]
       [:tr [:td (t :shortcut.editor/select-all-blocks)] [:td (util/->platform-shortcut "Ctrl-Shift-a")]]]]
     [:table
      [:thead
       [:tr
        [:th [:b (t :general)]]
        [:th (t :help/shortcut)]]]
      [:tbody
       [:tr [:td (t :help/toggle)] [:td "?"]]
       [:tr [:td (t :shortcut.git/commit)] [:td "c"]]
       [:tr [:td (t :shortcut.go/search)] [:td (util/->platform-shortcut "Ctrl-u")]]
       [:tr [:td (t :shortcut.go/search-in-page)] [:td (util/->platform-shortcut "Ctrl-Shift-u")]]
       [:tr [:td (t :help/fold-unfold)] [:td "Tab"]]
       [:tr [:td (t :shortcut.ui/toggle-contents)] [:td "t c"]]
       [:tr [:td (t :shortcut.ui/toggle-document-mode)] [:td "t d"]]
       [:tr [:td (t :shortcut.ui/toggle-theme)] [:td "t t"]]
       [:tr [:td (t :shortcut.ui/toggle-right-sidebar)] [:td "t r"]]
       [:tr [:td (t :shortcut.ui/toggle-settings)] [:td "t s"]]
       [:tr [:td (t :shortcut.ui/toggle-new-block)] [:td "t e"]]
       [:tr [:td (t :shortcut.go/journals)] [:td (if util/mac? "Cmd-j" "Alt-j")]]]]
     (shortcut-table :shortcut.category/formatting)
     (shortcut-table :shortcut.category/toggle)
     (shortcut-table :shortcut.category/others)

     ]


    )
  )


;; TODO
;; [:tr [:td (t :shortcut.editor/open-link-in-sidebar)] [:td "Shift-Click"]]
;; [:tr [:td (t :help/context-menu)] [:td "Right Click"]]
