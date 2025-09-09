(ns mobile.components.ui-silk
  "Mobile top header and bottom tabs"
  (:require [frontend.handler.editor :as editor-handler]
            [frontend.util :as util]
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
     {:on-pointer-down #(some-> (.-target ^js %)
                                ^js (.closest ".as-item")
                                ^js (.-dataset)
                                ^js (.-tab) (set-tab!))}
     [:span.as-item
      {:class (when (= current-tab "home") "active")
       :data-tab "home"}
      (shui/button {:variant :icon}
                   (shui/tabler-icon "home" {:size 30}))
      ]
     [:span.as-item
      {:class (when (= current-tab "search") "active")
       :data-tab "search"}
      (shui/button {:variant :icon}
                   (shui/tabler-icon "search" {:size 30}))
      ]
     [:span.as-item
      (shui/button
       {:variant :icon
        :on-click (fn [^js e]
                    (util/stop e)
                    (editor-handler/show-quick-add))}
       (shui/tabler-icon "plus" {:size 30}))
      ]
     [:span.as-item
      {:class (when (= current-tab "settings") "active")
       :data-tab "settings"}
      (shui/button {:variant :icon}
                   (shui/tabler-icon "adjustments-horizontal" {:size 30}))
      ]
     [:span.as-item
      {:class (when (= current-tab "debug") "active")
       :data-tab "debug"}
      (shui/button {:variant :icon}
        (shui/tabler-icon "bug" {:size 30}))]
     ]))
