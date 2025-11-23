(ns mobile.components.favorites
  "Favorites tab content"
  (:require [frontend.components.left-sidebar :as app-left-sidebar]
            [rum.core :as rum]))

(rum/defc favorites
  []
  [:div.px-2
   [:div.left-sidebar-inner
    [:div.sidebar-contents-container.mt-11
     {:class "!gap-4"}
     (app-left-sidebar/sidebar-favorites)
     (app-left-sidebar/sidebar-recent-pages)]]])
