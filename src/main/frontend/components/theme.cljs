(ns frontend.components.theme
  (:require [electron.ipc :as ipc]
            [frontend.components.settings :as settings]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.extensions.pdf.core :as pdf]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.plugin-config :as plugin-config-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.rum :refer [use-mounted]]
            [frontend.state :as state]
            [frontend.storage :as storage]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]
            [frontend.hooks :as hooks]))

(rum/defc scrollbar-measure
  []
  (let [*el (rum/use-ref nil)]
    (hooks/use-effect!
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

(defonce *once-theme-loaded? (volatile! false))

(rum/defc ^:large-vars/cleanup-todo container < rum/static
  [{:keys [route theme accent-color editor-font on-click current-repo nfs-granted? db-restoring?
           settings-open? sidebar-open? system-theme? sidebar-blocks-len onboarding-state preferred-language]} child]
  (let [mounted-fn (use-mounted)
        [restored-sidebar? set-restored-sidebar?] (rum/use-state false)]

    (hooks/use-effect!
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
    (hooks/use-effect!
     #(some-> js/document.documentElement
              (.setAttribute "data-color"
                             (or accent-color "logseq")))
     [accent-color])

    (hooks/use-effect!
     #(some-> js/document.documentElement
              (.setAttribute "data-font" (or editor-font "default")))
     [editor-font])

    (hooks/use-effect!
     #(let [doc js/document.documentElement]
        (.setAttribute doc "lang" preferred-language)))

    (hooks/use-effect!
     #(js/setTimeout
       (fn [] (when-not @*once-theme-loaded?
                (ipc/ipc :theme-loaded)
                (vreset! *once-theme-loaded? true))) 100) ; Wait for the theme to be applied
     [])

    (hooks/use-effect!
     #(when (and restored-sidebar?
                 (mounted-fn))
        (plugin-handler/hook-plugin-app :sidebar-visible-changed {:visible sidebar-open?})
        (ui-handler/persist-right-sidebar-state!))
     [sidebar-open? restored-sidebar? sidebar-blocks-len])

    (hooks/use-effect!
     #(when config/lsp-enabled?
        (plugin-handler/load-plugin-preferences)
        (comp
         (plugin-handler/setup-install-listener!)
         (plugin-config-handler/setup-install-listener!)))
     [])

    (hooks/use-effect!
     (fn []
       (ui-handler/reset-custom-css!)
       (pdf/reset-current-pdf!)
       (plugin-handler/hook-plugin-app :current-graph-changed {}))
     [current-repo])

    (hooks/use-effect!
     #(let [db-restored? (false? db-restoring?)]
        (if db-restoring?
          (util/set-title! (t :loading))
          (when (or nfs-granted? db-restored?)
            (route-handler/update-page-title! route))))
     [nfs-granted? db-restoring? route])

    (hooks/use-effect!
     (fn []
       (when-not db-restoring?
         (let [repos (state/get-repos)]
           (if-not (or
                    ;; not in publishing mode
                    config/publishing?
                    ;; other graphs exists
                    (seq repos))
             (route-handler/redirect! {:to :graphs})
             (do
               (ui-handler/restore-right-sidebar-state!)
               (set-restored-sidebar? true))))))
     [db-restoring?])

    (hooks/use-effect!
     #(when system-theme?
        (ui/setup-system-theme-effect!))
     [system-theme?])

    (hooks/use-effect!
     (fn []
       (if settings-open?
         (shui/dialog-open!
          (fn [] [:div.settings-modal (settings/settings settings-open?)])
          {:label "app-settings"
           :align :top
           :content-props {:onOpenAutoFocus #(.preventDefault %)}
           :id :app-settings})
         (shui/dialog-close! :app-settings)))
     [settings-open?])

    (hooks/use-effect!
     #(storage/set :file-sync/onboarding-state onboarding-state)
     [onboarding-state])

    [:div#root-container.theme-container
     {:on-click on-click
      :tab-index -1}
     child

     (pdf/default-embed-playground)
     (scrollbar-measure)]))
