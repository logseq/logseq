(ns frontend.components.theme
  (:require [electron.ipc :as ipc]
            [frontend.extensions.pdf.core :as pdf]
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

(rum/defc scrollbar-measure
  []
  (let [*el (rum/use-ref nil)]
    (rum/use-effect!
      (fn []
        (when-let [el (rum/deref *el)]
          (let [w (- (.-offsetWidth el) (.-clientWidth el))
                c "custom-scrollbar"
                l (.-classList js/document.documentElement)]
            (if (or (not util/mac?) (> w 2))
              (.add l c) (.remove l c)))))
      [])
    [:div.fixed.w-16.h-16.overflow-scroll.opacity-0
     {:ref   *el
      :class "top-1/2 -left-1/2 z-[-999]"}]))

(rum/defc ^:large-vars/cleanup-todo container
  [{:keys [route theme accent-color on-click current-repo nfs-granted? db-restoring?
           settings-open? sidebar-open? system-theme? sidebar-blocks-len onboarding-state preferred-language]} child]
  (let [mounted-fn (use-mounted)
        [restored-sidebar? set-restored-sidebar?] (rum/use-state false)]

    (rum/use-effect!
     #(let [^js doc js/document.documentElement
            ^js cls (.-classList doc)
            ^js cls-body (.-classList js/document.body)]
        (.setAttribute doc "data-theme" theme)
        (if (= theme "dark") ;; for tailwind dark mode
          ; The white-theme is for backward compatibility. See: https://github.com/logseq/logseq/pull/4652.
          (do (.add cls "dark") (doto cls-body (.remove "white-theme" "light-theme") (.add "dark-theme")))
          (do (.remove cls "dark") (doto cls-body (.remove "dark-theme") (.add "white-theme" "light-theme"))))
        (ui/apply-custom-theme-effect! theme)
        (plugin-handler/hook-plugin-app :theme-mode-changed {:mode theme}))
     [theme])

    ;; theme color
    (rum/use-effect!
      #(some-> js/document.documentElement
         (.setAttribute "data-color"
           (or accent-color "logseq")))
      [accent-color])

    (rum/use-effect!
     #(let [doc js/document.documentElement]
        (.setAttribute doc "lang" preferred-language)))

    (rum/use-effect!
     #(js/setTimeout (fn [] (ipc/ipc "theme-loaded")) 100) ; Wait for the theme to be applied
     [])

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
         (fn [] [:div.settings-modal (settings/settings settings-open?)])))
     [settings-open?])

    (rum/use-effect!
     #(storage/set :file-sync/onboarding-state onboarding-state)
     [onboarding-state])

    [:div.theme-container
     {:on-click on-click}
     child

     (pdf/default-embed-playground)
     (scrollbar-measure)]))
