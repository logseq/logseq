(ns frontend.components.window-controls
  (:require [frontend.components.svg :as svg]
            [frontend.context.i18n :refer [t]]
            [frontend.handler.window :as window-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [rum.core :as rum]))

(rum/defc container < rum/reactive
  []
  (let [maximized?  (state/sub :electron/window-maximized?)
        fullscreen? (state/sub :electron/window-fullscreen?)]
    [:div.window-controls.flex
     (if fullscreen?
       [:button.button.icon.fullscreen-toggle
        {:title (t :window/exit-fullscreen)
         :on-click window-handler/toggle-fullscreen!}
        (ui/icon "arrows-minimize")]
       [:<>
        [:button.button.icon.minimize
         {:title (t :window/minimize)
          :on-click window-handler/minimize!}
         (svg/window-minimize)]

        [:button.button.icon.maximize-toggle
         {:title (if maximized? (t :window/restore) (t :window/maximize))
          :class (if maximized? "restore" "maximize")
          :on-click window-handler/toggle-maximized!}
         (if maximized?
           (svg/window-restore)
           (svg/window-maximize))]

        [:button.button.icon.close
         {:title (t :window/close)
          :on-click window-handler/close!}
         (svg/window-close)]])]))
