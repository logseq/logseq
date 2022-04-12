(ns frontend.components.win32-title-bar
  (:require [rum.core :as rum]
            [frontend.components.svg :as svg]))

(rum/defc container
  []
  [:div.cp__win32-title-bar#win32-title-bar
    {}
    [:div.logo
      {}
      (svg/logo)]])
