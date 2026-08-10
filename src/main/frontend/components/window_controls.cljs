(ns frontend.components.window-controls
  (:require [frontend.components.svg :as svg]
            [frontend.context.i18n :refer [t]]
            [frontend.handler.window :as window-handler]
            [frontend.rfx :as rfx]
            [frontend.ui :as ui]
            [io.factorhouse.hsx.core :as hsx]))

(hsx/defc container
  []
  (let [maximized?  (rfx/use-sub [:electron/window-maximized?])
        fullscreen? (rfx/use-sub [:electron/window-fullscreen?])]
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
