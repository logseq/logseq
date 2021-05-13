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
         (map (fn [[k {:keys [binding]}]]
                [:tr {:key k}
                 [:td (t (dh/decorate-namespace k))]
                 [:td binding]])
              (dh/binding-by-category name))]]])))

(rum/defc shortcut
  []
  (rum/with-context [[t] i18n/*tongue-context*]
    [:div
     [:h1.title (t :help/shortcut-page-title)]
     [:table
      [:thead
       [:tr
        [:th [:b (t :help/shortcuts-triggers)]]
        [:th (t :help/shortcut)]]]
      [:tbody
       [:tr [:td (t :help/slash-autocomplete)] [:td "/"]]
       [:tr [:td (t :help/block-content-autocomplete)] [:td "<"]]
       [:tr [:td (t :help/reference-autocomplete)] [:td "[[]]"]]
       [:tr [:td (t :help/block-reference)] [:td "(())"]]
       [:tr [:td (t :shortcut.editor/open-link-in-sidebar)] [:td "Shift-Click"]]

       [:tr [:td (t :help/context-menu)] [:td "Right Click"]]]]
     (shortcut-table :shortcut.category/basics)
     (shortcut-table :shortcut.category/navigating)
     (shortcut-table :shortcut.category/block-editing)
     (shortcut-table :shortcut.category/block-command-editing)
     (shortcut-table :shortcut.category/block-selection)
     (shortcut-table :shortcut.category/formatting)
     (shortcut-table :shortcut.category/toggle)
     (shortcut-table :shortcut.category/others)

     ]


    )
  )
