(ns mobile.components.favorites
  "Favorites tab content"
  (:require [frontend.components.left-sidebar :as app-left-sidebar]
            [rum.core :as rum]))

(rum/defc favorites
  []
  [:div.left-sidebar-inner
   [:div.sidebar-contents-container
    {:class "!gap-4"}
    (app-left-sidebar/sidebar-favorites)
    (app-left-sidebar/sidebar-recent-pages)]])
