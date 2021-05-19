(ns frontend.components.shortcut
  (:require [frontend.context.i18n :as i18n]
            [frontend.modules.shortcut.data-helper :as dh]
            [frontend.state :as state]
            [rum.core :as rum]))
(def *shortcut-config (rum/cursor-in state/state [:config (state/get-current-repo) :shortcuts]))

(rum/defc shortcut-table < rum/reactive
  [name]
  (let [_ (rum/react *shortcut-config)]
    (rum/with-context [[t] i18n/*tongue-context*]
      [:div
       [:table
        [:thead
         [:tr
          [:th.text-left [:b (t name)]]
          [:th.text-right [:b (t :help/shortcut)]]]]
        [:tbody
         (map (fn [[k {:keys [binding]}]]
                [:tr {:key k}
                 [:td.text-left (t (dh/decorate-namespace k))]
                 [:td.text-right (dh/binding-for-display k binding)]])
              (dh/binding-by-category name))]]])))

(rum/defc trigger-table []
  (rum/with-context [[t] i18n/*tongue-context*]
    [:table
     [:thead
      [:tr
       [:th.text-left [:b (t :help/shortcuts-triggers)]]
       [:th.text-right [:b (t :help/shortcut)]]]]
     [:tbody
      [:tr
       [:td.text-left (t :help/slash-autocomplete)]
       [:td.text-right "/"]]
      [:tr
       [:td.text-left (t :help/block-content-autocomplete)]
       [:td.text-right "<"]]
      [:tr
       [:td.text-left (t :help/reference-autocomplete)]
       [:td.text-right "[[]]"]]
      [:tr
       [:td.text-left (t :help/block-reference)]
       [:td.text-right "(())"]]
      [:tr
       [:td.text-left (t :shortcut.editor/open-link-in-sidebar)]
       [:td.text-right "shift-click"]]
      [:tr
       [:td.text-left (t :help/context-menu)]
       [:td.text-right "right click"]]]]))

(rum/defc shortcut
  []
  (rum/with-context [[t] i18n/*tongue-context*]
    [:div
     [:h1.title (t :help/shortcut-page-title)]
     (trigger-table)
     (shortcut-table :shortcut.category/basics)
     (shortcut-table :shortcut.category/navigating)
     (shortcut-table :shortcut.category/block-editing)
     (shortcut-table :shortcut.category/block-command-editing)
     (shortcut-table :shortcut.category/block-selection)
     (shortcut-table :shortcut.category/formatting)
     (shortcut-table :shortcut.category/toggle)
     (shortcut-table :shortcut.category/others)]))
