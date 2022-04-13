(ns frontend.components.win32-title-bar
  (:require [rum.core :as rum]
            [frontend.components.svg :as svg]
            [frontend.state :as state]))

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
      [:div.minimize
        {:on-click ()}
        (svg/chrome-minimize)]
      [:div.max-restore
        {:on-click ()}
        (if (state/sub :win32-title-bar/window-is-maximized?)
          (svg/chrome-restore)
          (svg/chrome-maximize))]
      [:div.close
        {:on-click ()}
        (svg/chrome-close)]]])

(defn minimize
  []
  ())

(defn max-restore
  []
  ())

(defn close
  []
  ())
