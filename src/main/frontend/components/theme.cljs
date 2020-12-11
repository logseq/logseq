(ns frontend.components.theme
  (:require [rum.core :as rum]))

(rum/defc container
  [{:keys [theme on-click] :as props} child]
  (rum/use-effect! #(-> js/document.documentElement
                        (.setAttribute "data-theme" (if (= theme "white") "light" theme)))
                   [theme])
  [:div
   {:class (str theme "-theme")
    :on-click on-click}
   child])
