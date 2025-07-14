(ns mobile.components.ui-silk
  (:require [logseq.shui.ui :as shui]
            [rum.core :as rum]))

(rum/defc app-silk-topbar
  [{:keys [left-render right-render title]}]
  [:div.app-silk-topbar
   [:div.as-left (if (fn? left-render)
                   (left-render) left-render)]
   [:strong.title title]
   [:div.as-right (if (fn? right-render)
                    (right-render) right-render)]])

(rum/defc app-silk-tabs []
  [:div.app-silk-tabs
   [:span.as-item.active
    (shui/button {:variant :icon}
      (shui/tabler-icon "home" {:size 23}))
    [:small "Journals"]]
   [:span.as-item
    (shui/button {:variant :icon}
      (shui/tabler-icon "search" {:size 23}))
    [:small "Search"]]
   [:span.as-item
    (shui/button {:variant :icon}
      (shui/tabler-icon "plus" {:size 23}))
    [:small "Quick add"]]
   [:span.as-item
    (shui/button {:variant :icon}
      (shui/tabler-icon "settings" {:size 23}))
    [:small "Settings"]]
   [:span.as-item
    (shui/button {:variant :icon}
      (shui/tabler-icon "bug" {:size 23}))
    [:small "Demos"]]])