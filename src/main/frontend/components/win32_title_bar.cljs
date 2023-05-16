(ns frontend.components.win32-title-bar
  (:require [electron.ipc :as ipc]
            [frontend.components.svg :as svg]
            [frontend.state :as state]
            [goog.string :as gstring]
            [rum.core :as rum]))

(defn minimize
  []
  (ipc/ipc "window-minimize"))

(defn max-restore
  []
  (ipc/ipc "window-maximize-restore"))

(defn close
  []
  (ipc/ipc "window-close"))

(rum/defc container < rum/reactive
  []
  (let [maximized?  (state/sub :win32-title-bar/window-is-maximized?)]
    [:div.cp__win32-title-bar#win32-title-bar
     {}
     [:div.left-side
      {}
      [:div.logo
       {}
       (svg/logo)]]
     [:div.middle
      {}
      [:span#win32-title-bar-page-title
       {}
       (.-title js/document)]
      [:span#win32-title-bar-logseq-text
       {}
       (gstring/unescapeEntities "&nbsp;") "-" (gstring/unescapeEntities "&nbsp;") "Logseq"]]
     [:div.right-side
      {}
      [:div.minimize
       {:on-click minimize}
       (svg/chrome-minimize)]
      [:div.max-restore
       {:on-click max-restore}
       (if maximized?
         (svg/chrome-restore)
         (svg/chrome-maximize))]
      [:div.close
       {:on-click close}
       (svg/chrome-close)]]]))
