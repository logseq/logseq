(ns frontend.components.tabs
  "Tab bar component for page tabs"
  (:require [frontend.handler.tabs :as tabs-handler]
            [frontend.state.tabs :as tabs-state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [rum.core :as rum]))

(rum/defc tab-item
  [tab active?]
  (let [title (or (:title tab) "Untitled")]
    [:div.tab-item
     {:class (when active? "active")
      :on-click (fn [e]
                  (util/stop e)
                  (tabs-handler/switch-tab! (:id tab)))}
     [:div.tab-title
      {:title title}
      (subs title 0 (min 30 (count title)))
      (when (> (count title) 30) "...")]
     [:div.tab-close
      {:on-click (fn [e]
                   (util/stop e)
                   (tabs-handler/close-tab! (:id tab)))}
      (ui/icon "x" {:size 14})]]))

(rum/defc tab-bar < rum/reactive
  []
  (let [tabs (tabs-state/sub-tabs)
        active-tab-id (tabs-state/sub-active-tab-id)]
    [:div.tabs-container
     [:div.tabs-bar
      (for [tab tabs]
        (rum/with-key
          (tab-item tab (= (:id tab) active-tab-id))
          (:id tab)))]]))
