(ns frontend.components.shortcut
  (:require [frontend.context.i18n :as i18n]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.modules.shortcut.data-helper :as dh]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [rum.core :as rum]))
(def *shortcut-config (rum/cursor-in state/state [:config (state/get-current-repo) :shortcuts]))

(rum/defcs customize-shortcut-dialog-inner <
  (rum/local "")
  (shortcut/record!)
  [state _]
  (let [keypress (:rum/local state)]
    [:div.w-full.sm:max-w-lg.sm:w-96
     [:div.sm:flex.sm:items-start
      [:div.mt-3.text-center.sm:mt-0.sm:text-left
       [:h3#modal-headline.text-lg.leading-6.font-medium
        "Press any key and Esc to finish"]
       [:h4.text-lg.leading-6.font-medium
        @keypress]]]]))

(defn customize-shortcut-dialog [k]
  (fn [_]
    (customize-shortcut-dialog-inner k)))

(rum/defc shortcut-col [k binding configurable?]
  (let [conflict?         (dh/potential-confilct? k)
        displayed-binding (dh/binding-for-display k binding)]
    (if configurable?
      [:td.text-right
       (ui/button
        displayed-binding
        :title (if conflict?
                 "Shortcut conflict!"
                 "Click to modify")
        :background (when conflict? "pink")
        :on-click
        #(state/set-modal! (customize-shortcut-dialog k)))
       (ui/button "❌"
                  :title "Reset to default"
                  :class "transform motion-safe:hover:scale-125"
                  :background "none"
                  :on-click
                  (fn [_]
                    (dh/remove-shortcut k)
                    (shortcut/refresh!)))]
      [:td.text-right displayed-binding])))

(rum/defc shortcut-table < rum/reactive
  ([name]
   (shortcut-table name false))
  ([name configurable?]
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
                  (shortcut-col k binding configurable?)])
               (dh/binding-by-category name))]]]))))

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
     (shortcut-table :shortcut.category/basics true)
     (shortcut-table :shortcut.category/navigating true)
     (shortcut-table :shortcut.category/block-editing true)
     (shortcut-table :shortcut.category/block-command-editing true)
     (shortcut-table :shortcut.category/block-selection true)
     (shortcut-table :shortcut.category/formatting true)
     (shortcut-table :shortcut.category/toggle true)
     (shortcut-table :shortcut.category/others true)]))
