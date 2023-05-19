(ns frontend.components.window-controls
  (:require [electron.ipc :as ipc]
            [frontend.components.svg :as svg]
            [frontend.context.i18n :refer [t]]
            [frontend.state :as state]
            [rum.core :as rum]))

(defn minimize
  []
  (ipc/ipc "window-minimize"))

(defn toggle-maximized
  []
  (ipc/ipc "window-toggle-maximized"))

(defn close
  []
  (ipc/ipc "window-close"))

(rum/defc container < rum/reactive
  []
  (let [maximized?  (state/sub :electron/window-maximized?)]
    [:div.window-controls.flex
     [:button.button.icon.minimize
      {:title (t :window/minimize)
       :on-click minimize}
      (svg/window-minimize)]

     [:button.button.icon.maximize-toggle
      {:title (t (if maximized? :window/restore :window/maximize))
       :class (if maximized? "restore" "maximize")
       :on-click toggle-maximized}
      (if maximized?
        (svg/window-restore)
        (svg/window-maximize))]

     [:button.button.icon.close
      {:title (t :window/close)
       :on-click close}
      (svg/window-close)]]))
