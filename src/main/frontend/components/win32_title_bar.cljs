(ns frontend.components.win32-title-bar
  (:require [rum.core :as rum]
            [frontend.components.svg :as svg]))

(rum/defc container
  []
  [:div.cp__win32-title-bar#win32-title-bar
    {}
    [:div.left-side
      {}
      [:div.logo
        {}
        (svg/logo)]
      [:div.title
        {}
        "Logseq"]]
    [:div.right-side
      {}
      [:div.minimize]
      [:div.max-restore]
      [:div.close]]])
