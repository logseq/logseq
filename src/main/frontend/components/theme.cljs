(ns frontend.components.theme
  (:require [electron.ipc :as ipc]
            [frontend.components.settings :as settings]
            [frontend.config :as config]
            [frontend.context.i18n :as i18n :refer [t]]
            [frontend.extensions.pdf.core :as pdf]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.plugin-config :as plugin-config-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [io.factorhouse.hsx.core :as hsx]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]))

(hsx/defc scrollbar-measure
  []
  (let [*el (hooks/use-ref nil)]
    (hooks/use-effect!
     (fn []
       (when-let [el (hooks/deref *el)]
         (let [w (- (.-offsetWidth el) (.-clientWidth el))
               c "custom-scrollbar"
               l (.-classList js/document.documentElement)]
           (if (or (not util/mac?) (> w 2))
             (.add l c) (.remove l c)))))
     [])
    [:div.fixed.w-16.h-16.overflow-scroll.opacity-0
     {:ref   *el
      :class "top-1/2 -left-1/2 z-[-999]"}]))

(hsx/defc ^:large-vars/cleanup-todo container
  [{:keys [route theme accent-color editor-font on-click current-repo db-restoring?
           settings-open? sidebar-open? system-theme? sidebar-blocks-len preferred-language]} child]
  (let [mounted-fn (hooks/use-mounted)
        [restored-sidebar? set-restored-sidebar?] (hooks/use-state false)]

    (hooks/use-effect!
     (fn []
       ;; DOM stamp is owned by state/apply-theme-to-dom! — the same
       ;; helper set-theme-mode! calls synchronously before set-state!.
       ;; Calling it here covers the initial mount (where set-theme-mode!
       ;; hasn't run) and is idempotent on every subsequent toggle.
       (state/apply-theme-to-dom! theme)
       (ui/apply-custom-theme-effect! theme)
       (plugin-handler/hook-plugin-app :theme-mode-changed {:mode theme})
       ;; Force a full reactive re-render after the data-theme attribute
       ;; is on <html>. Components that DON'T subscribe to :ui/theme but
       ;; DO render avatar/contrast colors (computed from CSS vars at
       ;; render time) would otherwise keep their stale inline styles
       ;; until something unrelated triggered them to re-render. Theme
       ;; toggle is a rare user action; the one-frame reconciliation
       ;; cost is imperceptible. Same pattern as language change
       ;; (settings.cljs:298).
       (ui-handler/re-render-root!))
     [theme])

    ;; theme color
    (hooks/use-effect!
     #(some-> js/document.documentElement
              (.setAttribute "data-color"
                             (or accent-color "logseq")))
     [accent-color])

    (hooks/use-effect!
     (fn []
       (when-let [{:keys [type global]} editor-font]
         (doto js/document.documentElement
           (.setAttribute "data-font" (or type "default"))
           (.setAttribute "data-font-global" (boolean global)))))
     [editor-font])

    (hooks/use-effect!
     #(let [doc js/document.documentElement
            preferred-language' (i18n/locale-tag preferred-language)]
        (.setAttribute doc "lang" preferred-language')
        (js/LSI18N.setLocale preferred-language'))
     [preferred-language])

    (hooks/use-effect!
     #(ipc/ipc :theme-loaded)
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
          (util/set-title! (t :ui/loading))
          (when db-restored?
            (route-handler/update-page-title! route))))
     [db-restoring? route])

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
          {:label :app-settings
           :align :top
           :content-props {:onOpenAutoFocus #(.preventDefault %)}
           :id :app-settings})
         (shui/dialog-close! :app-settings)))
     [settings-open?])

    [:div#root-container.theme-container
     {:on-click on-click}
     child

     (pdf/default-embed-playground)
     (scrollbar-measure)]))
