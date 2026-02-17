(ns frontend.components.tabs
  "Tab bar component for page tabs"
  (:require [frontend.handler.tabs :as tabs-handler]
            [frontend.state.tabs :as tabs-state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [rum.core :as rum]
            [goog.object :as gobj]))

(rum/defc tab-item
  [tab active? index drag-state]
  (let [title (or (:title tab) "Untitled")
        dragging? (= (:drag-index @drag-state) index)
        drag-over? (= (:drag-over-index @drag-state) index)]
    [:div.tab-item
     {:class (str (when active? "active ")
                  (when dragging? "dragging ")
                  (when drag-over? "drag-over"))
      :draggable true
      :on-click (fn [e]
                  (util/stop e)
                  (tabs-handler/switch-tab! (:id tab)))
      :on-drag-start (fn [e]
                       (reset! drag-state {:drag-index index :drag-id (:id tab)})
                       (-> e .-dataTransfer (.setData "text/plain" (:id tab)))
                       (-> e .-dataTransfer (gobj/set "effectAllowed" "move")))
      :on-drag-over (fn [e]
                      (.preventDefault e)
                      (swap! drag-state assoc :drag-over-index index)
                      (-> e .-dataTransfer (gobj/set "dropEffect" "move")))
      :on-drag-leave (fn [_e]
                       (when (= (:drag-over-index @drag-state) index)
                         (swap! drag-state dissoc :drag-over-index)))
      :on-drop (fn [e]
                 (.preventDefault e)
                 (let [from-index (:drag-index @drag-state)]
                   (when (and from-index (not= from-index index))
                     (tabs-state/reorder-tabs! from-index index)))
                 (reset! drag-state {}))
      :on-drag-end (fn [_e]
                     (reset! drag-state {}))}
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
        active-tab-id (tabs-state/sub-active-tab-id)
        drag-state (atom {})]
    [:div.tabs-container
     [:div.tabs-bar
      (map-indexed
        (fn [idx tab]
          (rum/with-key
            (tab-item tab (= (:id tab) active-tab-id) idx drag-state)
            (:id tab)))
        tabs)]]))
