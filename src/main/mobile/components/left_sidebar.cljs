(ns mobile.components.left-sidebar
  "Mobile left sidebar"
  (:require [frontend.components.left-sidebar :as app-left-sidebar]
            [rum.core :as rum]))

(rum/defc left-sidebar
  []
  [:div.px-2
   [:div.left-sidebar-inner
    [:div.sidebar-contents-container.mt-11
     {:class "!gap-4"}
     (app-left-sidebar/sidebar-favorites)
     (app-left-sidebar/sidebar-recent-pages)]]])
