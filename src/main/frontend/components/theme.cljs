(ns frontend.components.theme
  (:require [frontend.extensions.pdf.core :as pdf]
            [frontend.config :as config]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.plugin-config :as plugin-config-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.state :as state]
            [frontend.components.settings :as settings]
            [frontend.rum :refer [use-mounted]]
            [frontend.storage :as storage]
            [rum.core :as rum]
            [frontend.context.i18n :refer [t]]))

(rum/defc container
  [{:keys [route theme on-click current-repo nfs-granted? db-restoring?
           settings-open? sidebar-open? system-theme? sidebar-blocks-len onboarding-state preferred-language]} child]
  (let [mounted-fn (use-mounted)
        [restored-sidebar? set-restored-sidebar?] (rum/use-state false)]

    (rum/use-effect!
     #(let [doc js/document.documentElement
            cls (.-classList doc)]
        (.setAttribute doc "data-theme" theme)
        (if (= theme "dark") ;; for tailwind dark mode
          (.add cls "dark")
          (.remove cls "dark"))
        (ui/apply-custom-theme-effect! theme)
        (plugin-handler/hook-plugin-app :theme-mode-changed {:mode theme}))
     [theme])

    (rum/use-effect!
     #(let [doc js/document.documentElement]
        (.setAttribute doc "lang" preferred-language)))

    (rum/use-effect!
     #(when (and restored-sidebar?
                 (mounted-fn))
        (plugin-handler/hook-plugin-app :sidebar-visible-changed {:visible sidebar-open?})
        (ui-handler/persist-right-sidebar-state!))
     [sidebar-open? restored-sidebar? sidebar-blocks-len])

    (rum/use-effect!
     #(when config/lsp-enabled?
        (plugin-handler/setup-install-listener!)
        (plugin-config-handler/setup-install-listener!)
        (plugin-handler/load-plugin-preferences)
        (fn []
          (js/window.apis.removeAllListeners (name :lsp-updates))))
     [])

    (rum/use-effect!
     (fn []
       (ui-handler/reset-custom-css!)
       (pdf/reset-current-pdf!)
       (plugin-handler/hook-plugin-app :current-graph-changed {}))
     [current-repo])

    (rum/use-effect!
     #(let [db-restored? (false? db-restoring?)]
        (if db-restoring?
          (util/set-title! (t :loading))
          (when (or nfs-granted? db-restored?)
            (route-handler/update-page-title! route))))
     [nfs-granted? db-restoring? route])

    (rum/use-effect!
     (fn []
       (when-not db-restoring?
         (let [repos (state/get-repos)]
           (if-not (or
                    ;; demo graph only
                    (and (= 1 (count repos)) (:example? (first repos))
                         (not (util/mobile?)))
                    ;; not in publishing mode
                    config/publishing?
                    ;; other graphs exists
                    (seq repos))
             (route-handler/redirect! {:to :repo-add})
             (do
               (ui-handler/restore-right-sidebar-state!)
               (set-restored-sidebar? true))))))
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

    (rum/use-effect!
     #(storage/set :file-sync/onboarding-state onboarding-state)
     [onboarding-state])

    [:div
     {:class    (util/classnames
                 [(str theme "-theme")
                  {:white-theme (= "light" theme)}]) ; The white-theme is for backward compatibility. See: https://github.com/logseq/logseq/pull/4652.
      :on-click on-click}
     child

     (pdf/default-embed-playground)]))
