(ns mobile.components.ui-silk
  "Mobile top header and bottom tabs"
  (:require [frontend.handler.editor :as editor-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [mobile.state :as mobile-state]
            [rum.core :as rum]))

(rum/defc app-silk-topbar
  [{:keys [left-render right-render title props center-title?]}]
  [:div.app-silk-topbar
   (cond-> props
     (boolean center-title?)
     (assoc :data-center-title true))
   [:div.as-left
    (if (fn? left-render)
      (left-render) left-render)
    (when (not center-title?) [:span.title title])]
   (when center-title? [:span.title title])
   [:div.as-right (if (fn? right-render)
                    (right-render) right-render)]])

(rum/defc app-silk-tabs []
  (let [[current-tab set-tab!] (mobile-state/use-tab)]
    [:div.app-silk-tabs
     {:on-pointer-down (fn [^js e]
                         (some-> (.-target e)
                                 ^js (.closest ".as-item")
                                 ^js (.-dataset)
                                 ^js (.-tab) (set-tab!)))}
     [:span.as-item
      {:class (when (= current-tab "home") "active")
       :data-tab "home"}
      (shui/button {:variant :icon
                    :on-pointer-down (fn [] (util/scroll-to-top false))}
                   (shui/tabler-icon "home" {:size 24}))
      [:small "Journals"]]
     [:span.as-item
      {:class (when (= current-tab "search") "active")
       :data-tab "search"}
      (shui/button {:variant :icon}
                   (shui/tabler-icon "search" {:size 24}))
      [:small "Search"]]
     [:span.as-item
      (shui/button
       (merge
        {:variant :icon}
        (hooks/use-long-press
         {:on-click (fn [^js e]
                      (util/stop e)
                      (editor-handler/show-quick-add))
          :on-long-press (fn [_e]
                           (state/pub-event! [:mobile/start-audio-record]))
          :delay 500}))
       (shui/tabler-icon "plus" {:size 24}))
      [:small "Quick add"]]
     [:span.as-item
      {:class (when (= current-tab "settings") "active")
       :data-tab "settings"}
      (shui/button {:variant :icon}
                   (shui/tabler-icon "settings" {:size 24}))
      [:small "Settings"]]]))
