(ns mobile.components.ui-silk
  (:require [logseq.shui.ui :as shui]
            [mobile.state :as mobile-state]
            [rum.core :as rum]))

(rum/defc app-silk-topbar
  [{:keys [left-render right-render title props]}]
  [:div.app-silk-topbar props
   [:div.as-left (if (fn? left-render)
                   (left-render) left-render)]
   [:strong.title title]
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
        (shui/tabler-icon "home" {:size 23}))
      [:small "Journals"]]
     [:span.as-item
      {:class (when (= current-tab "search") "active")
       :data-tab "search"}
      (shui/button {:variant :icon}
        (shui/tabler-icon "search" {:size 23}))
      [:small "Search"]]
     [:span.as-item
      (shui/button {:variant :icon}
        (shui/tabler-icon "plus" {:size 23}))
      [:small "Quick add"]]
     [:span.as-item
      {:class (when (= current-tab "settings") "active")
       :data-tab "settings"}
      (shui/button {:variant :icon}
        (shui/tabler-icon "settings" {:size 23}))
      [:small "Settings"]]
     [:span.as-item
      {:class (when (= current-tab "demos") "active")
       :data-tab "demos"}
      (shui/button {:variant :icon}
        (shui/tabler-icon "bug" {:size 23}))
      [:small "Demos"]]]))