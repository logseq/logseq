(ns frontend.components.shortcut
  (:require [clojure.string :as str]
            [frontend.context.i18n :as i18n]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.modules.shortcut.data-helper :as dh]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [rum.core :as rum]))

(rum/defcs customize-shortcut-dialog-inner <
  (rum/local "")
  (shortcut/record!)
  [state _ action-name current-binding]
  (let [keypress (:rum/local state)
        keyboard-shortcut (if (= "" @keypress) current-binding @keypress)]
    [:div
     [:div
      [:p.mb-4 "Press any sequence of keys to set the shortcut for the " [:b action-name] " action."]
      [:p.mb-4.mt-4
       (ui/keyboard-shortcut (-> keyboard-shortcut
                                 (str/trim)
                                 (str/split  #" |\+")))]]
     [:div.cancel-save-buttons.text-right.mt-4
      (ui/button "Save" :on-click state/close-modal!)
      [:a.ml-4
       {:on-click (fn []
                    (reset! keypress current-binding)
                    (state/close-modal!))} "Cancel"]]]))

(defn customize-shortcut-dialog [k action-name displayed-binding]
  (fn [_]
    (customize-shortcut-dialog-inner k action-name displayed-binding)))

(rum/defc shortcut-col [k binding configurable? action-name]
  (let [conflict?         (dh/potential-confilct? k)
        displayed-binding (dh/binding-for-display k binding)]
    (if (not configurable?)
      [:td.text-right displayed-binding]
      [:td.text-right
       (ui/button
        displayed-binding
        :class "text-sm p-1"
        :title (if conflict?
                 "Shortcut conflict!"
                 "Click to modify")
        :background (when conflict? "pink")
        :on-click #(state/set-modal! (customize-shortcut-dialog k action-name displayed-binding)))
       [:a.text-sm
        {:style {:margin-left "12px"}
         :on-click (fn [] (dh/remove-shortcut k) (shortcut/refresh!))}
        "Reset"]])))

(rum/defc shortcut-table < rum/reactive
  ([name]
   (shortcut-table name false))
  ([name configurable?]
   (let [shortcut-config (rum/cursor-in
                          state/state
                          [:config (state/get-current-repo) :shortcuts])
         _ (rum/react shortcut-config)]
     (rum/with-context [[t] i18n/*tongue-context*]
       [:div
        [:table
         [:thead
          [:tr
           [:th.text-left [:b (t name)]]
           [:th.text-right]]]
         [:tbody
          (map (fn [[k {:keys [binding]}]]
                 [:tr {:key k}
                  [:td.text-left (t (dh/decorate-namespace k))]
                  (shortcut-col k binding configurable? (t (dh/decorate-namespace k)))])
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
       [:td.text-left (t :command.editor/open-link-in-sidebar)]
       [:td.text-right "shift-click"]]
      [:tr
       [:td.text-left (t :help/context-menu)]
       [:td.text-right "right click"]]]]))

(rum/defc shortcut
  []
  (rum/with-context [[t] i18n/*tongue-context*]
    [:div
     [:h1.title (t :help/shortcut-page-title)]
     (shortcut-table :shortcut.category/basics true)
     (shortcut-table :shortcut.category/navigating true)
     (shortcut-table :shortcut.category/block-editing true)
     (shortcut-table :shortcut.category/block-command-editing true)
     (shortcut-table :shortcut.category/block-selection true)
     (shortcut-table :shortcut.category/formatting true)
     (shortcut-table :shortcut.category/toggle true)
     (shortcut-table :shortcut.category/others true)]))
