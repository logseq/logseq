(ns frontend.components.theme
  (:require [frontend.extensions.pdf.highlights :as pdf]
            [frontend.handler.plugin :refer [lsp-enabled?] :as plugin-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.state :as state]
            [frontend.components.settings :as settings]
            [frontend.rum :refer [use-mounted]]
            [rum.core :as rum]))

(rum/defc container
  [{:keys [t route theme on-click current-repo nfs-granted? db-restoring?
           settings-open? sidebar-open? system-theme? sidebar-blocks-len]} child]
  (let [mounted-fn (use-mounted)
        [restored-sidebar? set-restored-sidebar?] (rum/use-state false)]

    (rum/use-effect!
     #(let [doc js/document.documentElement
            cls (.-classList doc)]
        (.setAttribute doc "data-theme" (if (= theme "white") "light" theme))
        (if (= theme "dark") ;; for tailwind dark mode
          (.add cls "dark")
          (.remove cls "dark"))
        (plugin-handler/hook-plugin-app :theme-mode-changed {:mode (if (= theme "white") "light" theme)} nil))
     [theme])

    (rum/use-effect!
     #(when (and restored-sidebar?
                 (mounted-fn))
        (plugin-handler/hook-plugin-app :sidebar-visible-changed {:visible sidebar-open?})
        (ui-handler/persist-right-sidebar-state!))
     [sidebar-open? restored-sidebar? sidebar-blocks-len])

    (rum/use-effect!
     #(when lsp-enabled?
        (plugin-handler/setup-install-listener! t))
     [t])

    (rum/use-effect!
     (fn []
       (ui-handler/add-style-if-exists!)
       (pdf/reset-current-pdf!)
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
     #(when-not db-restoring?
        (ui-handler/restore-right-sidebar-state!)
        (set-restored-sidebar? true))
     [db-restoring?])

    (rum/use-effect!
     #(when system-theme?
        (ui/setup-system-theme-effect!))
     [system-theme?])

    (rum/use-effect!
      #(state/set-modal!
         (when settings-open?
           (fn [] [:div.settings-modal (settings/settings)])))
      [settings-open?])

    [:div
     {:class    (str theme "-theme")
      :on-click on-click}
     child

     (pdf/playground)]))
