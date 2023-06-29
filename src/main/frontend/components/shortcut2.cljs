(ns frontend.components.shortcut2
  (:require [rum.core :as rum]
            [frontend.modules.shortcut.data-helper :as dh]))


(rum/defc shortcut-page-x
  []

  [:div.cp__shortcut-page-x
   [:h1.text-4xl "Keymap"]

   [:ul.list-none.m-0.py-3
    (for [[id binding] (dh/get-bindings)]
      [:li.flex.items-center.justify-between.text-sm
       [:strong (str id)]
       [:code binding]])]])
