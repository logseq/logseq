(ns mobile.components.ui-silk
  (:require [rum.core :as rum]))

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
   "app tabs"])