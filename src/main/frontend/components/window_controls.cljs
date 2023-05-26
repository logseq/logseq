(ns frontend.components.window-controls
  (:require [electron.ipc :as ipc]
            [frontend.components.svg :as svg]
            [frontend.context.i18n :refer [t]]
            [frontend.state :as state]
            [frontend.ui :as ui]
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

(defn toggle-fullscreen
  []
  (ipc/ipc "window-toggle-fullscreen"))

(rum/defc container < rum/reactive
  []
  (let [maximized?  (state/sub :electron/window-maximized?)
        fullscreen? (state/sub :electron/window-fullscreen?)]
    [:div.window-controls.flex
     (if fullscreen?
       [:button.button.icon.fullscreen-toggle
        {:title (t :window/exit-fullscreen)
         :on-click toggle-fullscreen}
        (ui/icon "arrows-minimize")]
       [:<>
        [:button.button.icon.minimize
         {:title (t :window/minimize)
          :on-click minimize}
         (svg/window-minimize)]

        [:button.button.icon.maximize-toggle
         {:title (if maximized? (t :window/restore) (t :window/maximize))
          :class (if maximized? "restore" "maximize")
          :on-click toggle-maximized}
         (if maximized?
           (svg/window-restore)
           (svg/window-maximize))]

        [:button.button.icon.close
         {:title (t :window/close)
          :on-click close}
         (svg/window-close)]])]))
