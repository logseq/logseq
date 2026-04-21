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
       (ui/tooltip
        [:button.button.icon.fullscreen-toggle
         {:on-click window-handler/toggle-fullscreen!}
         (ui/icon "arrows-minimize")]
        (t :window/exit-fullscreen))
       [:<>
        (ui/tooltip
         [:button.button.icon.minimize
          {:on-click window-handler/minimize!}
          (svg/window-minimize)]
         (t :window/minimize))

        (ui/tooltip
         [:button.button.icon.maximize-toggle
          {:class (if maximized? "restore" "maximize")
           :on-click window-handler/toggle-maximized!}
          (if maximized?
            (svg/window-restore)
            (svg/window-maximize))]
         (if maximized? (t :window/restore) (t :window/maximize)))

        (ui/tooltip
         [:button.button.icon.close
          {:on-click window-handler/close!}
          (svg/window-close)]
         (t :window/close))])]))
