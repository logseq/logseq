(ns frontend.components.theme
  (:require [rum.core :as rum]
            [frontend.util :as util]
            [frontend.ui :as ui]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.components.svg :as svg]))

(rum/defc container
  [{:keys [route theme on-click current-repo nfs-granted? db-restoring? sidebar-open? system-theme?] :as props} child]
  (rum/use-effect!
   #(let [doc js/document.documentElement
          cls (.-classList doc)]
      (.setAttribute doc "data-theme" (if (= theme "white") "light" theme))
      (if (= theme "dark")                                 ;; for tailwind dark mode
        (.add cls "dark")
        (.remove cls "dark"))
      (plugin-handler/hook-plugin-app :theme-mode-changed {:mode (if (= theme "white") "light" theme)} nil))
   [theme])

  (rum/use-effect!
   #(plugin-handler/hook-plugin-app :sidebar-visible-changed {:visible sidebar-open?})
   [sidebar-open?])

  (rum/use-effect!
    (fn []
      (ui-handler/add-style-if-exists!)
      (plugin-handler/hook-plugin-app :current-graph-changed {}))
    [current-repo])

  (rum/use-effect!
   #(let [db-restored? (false? db-restoring?)]
      (if db-restoring?
        (util/set-title! "Loading")
        (when (or nfs-granted? db-restored?)
          (route-handler/update-page-title! route))))
   [nfs-granted? db-restoring? route])

  (rum/use-effect!
   #(when system-theme?
      (ui/setup-system-theme-effect!))
   [system-theme?])

  [:div
   {:class    (str theme "-theme")
    :on-click on-click}
   child])
