(ns frontend.components.settings
  (:require [clojure.string :as string]
            [clojure.walk :as walk]
            [electron.ipc :as ipc]
            [frontend.colors :as colors]
            [frontend.common.missionary :as c.m]
            [frontend.components.assets :as assets]
            [frontend.components.shortcut :as shortcut]
            [frontend.components.svg :as svg]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.dicts :as dicts]
            [frontend.handler.config :as config-handler]
            [frontend.handler.db-based.rtc :as rtc-handler]
            [frontend.handler.db-based.vector-search-flows :as vector-search-flows]
            [frontend.handler.global-config :as global-config-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.property :as property-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.user :as user-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.modules.instrumentation.core :as instrument]
            [frontend.modules.shortcut.data-helper :as shortcut-helper]
            [frontend.persist-db.browser :as db-browser]
            [frontend.spec.storage :as storage-spec]
            [frontend.state :as state]
            [frontend.storage :as storage]
            [frontend.ui :as ui]
            [frontend.util :refer [classnames web-platform?] :as util]
            [frontend.version :as fv]
            [goog.string :as gstring]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [missionary.core :as m]
            [promesa.core :as p]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]))

(defn toggle
  [label-for name state on-toggle & [detail-text]]
  [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-center
   [:label.block.text-sm.font-medium.leading-5.opacity-70
    {:for label-for}
    name]
   [:div.rounded-md.sm:max-w-tss.sm:col-span-2
    [:div.rounded-md {:style {:display "flex" :gap "1rem" :align-items "center"}}
     (ui/toggle state on-toggle true)
     detail-text]]])

(rum/defcs app-updater < rum/reactive
  [state version]
  (let [update-pending? (state/sub :electron/updater-pending?)
        {:keys [type payload]} (state/sub :electron/updater)]
    [:span.cp__settings-app-updater

     [:div.ctls.flex.items-center

      [:div.mt-1.sm:mt-0.sm:col-span-2.flex.gap-4.items-center.flex-wrap
       [:div (cond
               (mobile-util/native-android?)
               (ui/button
                (t :settings-page/check-for-updates)
                :class "text-sm mr-1"
                :href "https://github.com/logseq/logseq/releases")

               (mobile-util/native-ios?)
               (ui/button
                (t :settings-page/check-for-updates)
                :class "text-sm mr-1"
                :href "https://apps.apple.com/app/logseq/id1601013908")

               (util/electron?)
               (ui/button
                (if update-pending? (t :settings-page/checking) (t :settings-page/check-for-updates))
                :class "text-sm mr-1"
                :disabled update-pending?
                :on-click #(js/window.apis.checkForUpdates false))

               :else
               nil)]

       [:div.text-sm.cursor
        {:title (str (t :settings-page/revision) config/revision)
         :on-click (fn []
                     (notification/show! [:div "Current Revision: "
                                          [:a {:target "_blank"
                                               :href (str "https://github.com/logseq/logseq/commit/" config/revision)}
                                           config/revision]]
                                         :info
                                         false))}
        version]

       [:a.text-sm.fade-link.underline.inline
        {:target "_blank"
         :href "https://docs.logseq.com/#/page/changelog"}
        (t :settings-page/changelog)]]]

     (when-not (or update-pending?
                   (string/blank? type))
       [:div.update-state.text-sm
        (case type
          "update-not-available"
          [:p (t :settings-page/app-updated)]

          "update-available"
          (let [{:keys [name url]} payload]
            [:p (str (t :settings-page/update-available))
             [:a.link
              {:on-click
               (fn [e]
                 (js/window.apis.openExternal url)
                 (util/stop e))}
              svg/external-link name " 🎉"]])

          "error"
          [:p (t :settings-page/update-error-1) [:br] (t :settings-page/update-error-2)
           [:a.link
            {:on-click
             (fn [e]
               (js/window.apis.openExternal "https://github.com/logseq/logseq/releases")
               (util/stop e))}
            svg/external-link " release channel"]])])]))

(rum/defc outdenting-hint
  []
  [:div.ui__modal-panel
   {:style {:box-shadow "0 4px 20px 4px rgba(0, 20, 60, .1), 0 4px 80px -8px rgba(0, 20, 60, .2)"}}
   [:div {:style {:margin "12px" :max-width "500px"}}
    [:p.text-sm
     (t :settings-page/preferred-outdenting-tip)
     [:a.text-sm
      {:target "_blank" :href "https://discuss.logseq.com/t/whats-your-preferred-outdent-behavior-the-direct-one-or-the-logical-one/978"}
      (t :settings-page/preferred-outdenting-tip-more)]]
    [:img {:src    "https://discuss.logseq.com/uploads/default/original/1X/e8ea82f63a5e01f6d21b5da827927f538f3277b9.gif"
           :width  500
           :height 500}]]])

(rum/defc auto-expand-hint
  []
  [:div.ui__modal-panel
   {:style {:box-shadow "0 4px 20px 4px rgba(0, 20, 60, .1), 0 4px 80px -8px rgba(0, 20, 60, .2)"}}
   [:div {:style {:margin "12px" :max-width "500px"}}
    [:p.text-sm
     (t :settings-page/auto-expand-block-refs-tip)]
    [:img {:src    "https://user-images.githubusercontent.com/28241963/225818326-118deda9-9d1e-477d-b0ce-771ca0bcd976.gif"
           :width  500
           :height 500}]]])

(defn row-with-button-action
  [{:keys [left-label description action button-label href on-click desc -for stretch]}]
  [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4
   {:class "sm:items-start"}
   ;; left column
   [:div.flex.flex-col
    [:label.block.text-sm.font-medium.leading-5.opacity-70
     {:for -for}
     left-label]
    (when description
      [:div.text-xs.text-gray-10 description])]

   ;; right column
   [:div.mt-1.sm:mt-0.sm:col-span-2.flex.items-center
    {:style {:display "flex" :gap "0.5rem" :align-items "center"}}
    [:div {:style (when stretch {:width "100%"})}
     (if action action (shui/button
                        {:as-child (not (string/blank? href))
                         :size     :sm
                         :on-click on-click}
                        (if (string/blank? href) button-label
                            (shui/link {:href href} button-label))))]
    (when-not (or (util/mobile?)
                  (mobile-util/native-platform?))
      [:div.text-sm.flex desc])]])

(defn edit-config-edn []
  (row-with-button-action
   {:left-label   (t :settings-page/custom-configuration)
    :button-label (t :settings-page/edit-config-edn)
    :href         (rfe/href :file {:path (config/get-repo-config-path)})
    :on-click     ui-handler/toggle-settings-modal!
    :-for         "config_edn"}))

(defn edit-global-config-edn []
  (row-with-button-action
   {:left-label   (t :settings-page/custom-global-configuration)
    :button-label (t :settings-page/edit-global-config-edn)
    :href         (rfe/href :file {:path (global-config-handler/global-config-path)})
    :on-click     ui-handler/toggle-settings-modal!
    :-for         "global_config_edn"}))

(defn edit-custom-css []
  (row-with-button-action
   {:left-label   (t :settings-page/custom-theme)
    :button-label (t :settings-page/edit-custom-css)
    :href         (rfe/href :file {:path (config/get-custom-css-path)})
    :on-click     ui-handler/toggle-settings-modal!
    :-for         "customize_css"}))

(defn edit-export-css []
  (row-with-button-action
   {:left-label   (t :settings-page/export-theme)
    :button-label (t :settings-page/edit-export-css)
    :href         (rfe/href :file {:path (config/get-export-css-path)})
    :on-click     ui-handler/toggle-settings-modal!
    :-for         "export_css"}))

(defn show-brackets-row [t show-brackets?]
  [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-center
   [:label.block.text-sm.font-medium.leading-5.opacity-70
    {:for "show_brackets"}
    (t :settings-page/show-brackets)]
   [:div
    [:div.rounded-md.sm:max-w-xs
     (ui/toggle show-brackets?
                config-handler/toggle-ui-show-brackets!
                true)]]
   (when (not (or (util/mobile?) (mobile-util/native-platform?)))
     [:div {:style {:text-align "right"}}
      (ui/render-keyboard-shortcut (shortcut-helper/gen-shortcut-seq :ui/toggle-brackets))])])

(defn toggle-wide-mode-row [t wide-mode?]
  [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-center
   [:label.block.text-sm.font-medium.leading-5.opacity-70
    {:for "wide_mode"}
    (t :settings-page/wide-mode)]
   [:div
    [:div.rounded-md.sm:max-w-xs
     (ui/toggle wide-mode?
                ui-handler/toggle-wide-mode!
                true)]]
   (when (not (or (util/mobile?) (mobile-util/native-platform?)))
     [:div {:style {:text-align "right"}}
      (ui/render-keyboard-shortcut (shortcut-helper/gen-shortcut-seq :ui/toggle-wide-mode))])])

(defn editor-font-family-row [t {:keys [type global]}]
  [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4
   [:label.block.text-sm.font-medium.leading-5.opacity-70
    {:for "font_family"}
    (t :settings-page/editor-font)]
   [:div.flex.flex-col.col-span-2
    [:div.flex.gap-2
     (for [t [:default :serif :mono]
           :let [t (name t)
                 tt (string/capitalize t)
                 active? (= (or type "default") t)]]
       (shui/button
        {:variant :secondary
         :class (when active? " border-primary border-[2px]")
         :style {:width "4.4rem"}
         :on-click #(state/set-editor-font! {:type t})}
        [:span.flex.flex-col
         {:class (str "ls-font-" t)}
         [:strong "Ag"]
         [:small tt]]))]
    [:div.pt-3
     [:label.w-full.flex.items-center.cursor-pointer
      (shui/checkbox {:checked (boolean global)
                      :on-checked-change #(state/set-editor-font! {:global %})})
      [:span.pl-1.text-sm.opacity-70 "Set as global font family"]]]]])

(rum/defcs switch-spell-check-row < rum/reactive
  [state t]
  (let [enabled? (state/sub [:electron/user-cfgs :spell-check])]
    [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-center
     [:label.block.text-sm.font-medium.leading-5.opacity-70
      (t :settings-page/spell-checker)]
     [:div
      [:div.rounded-md.sm:max-w-xs
       (ui/toggle
        enabled?
        (fn []
          (state/set-state! [:electron/user-cfgs :spell-check] (not enabled?))
          (p/then (ipc/ipc :userAppCfgs :spell-check (not enabled?))
                  #(when (js/confirm (t :relaunch-confirm-to-work))
                     (js/logseq.api.relaunch))))
        true)]]]))

(rum/defc app-auto-update-row < rum/reactive [t]
  (let [enabled? (state/sub [:electron/user-cfgs :auto-update])
        enabled? (if (nil? enabled?) true enabled?)]
    (toggle "usage-diagnostics"
            (t :settings-page/auto-updater)
            enabled?
            #((state/set-state! [:electron/user-cfgs :auto-update] (not enabled?))
              (ipc/ipc :userAppCfgs :auto-update (not enabled?))))))

(defn language-row [t preferred-language]
  (let [on-change (fn [e]
                    (let [lang-code (util/evalue e)]
                      (state/set-preferred-language! lang-code)
                      (ui-handler/re-render-root!)))
        action [:select.form-select.is-small {:value     preferred-language
                                              :on-change on-change}
                (for [language dicts/languages]
                  (let [lang-code (name (:value language))
                        lang-label (:label language)]
                    [:option {:key lang-code :value lang-code} lang-label]))]]
    (row-with-button-action {:left-label (t :language)
                             :-for       "preferred_language"
                             :action     action})))

(rum/defc theme-modes-row < rum/reactive
  [t]
  (let [theme (state/sub :ui/theme)
        dark? (= "dark" theme)
        system-theme? (state/sub :ui/system-theme?)
        switch-theme (if dark? "light" "dark")
        color-accent (state/sub :ui/radix-color)
        pick-theme [:ul.cp__theme-modes-options
                    [:li {:on-click (partial state/use-theme-mode! "light")
                          :class    (classnames [{:active (and (not system-theme?) (not dark?))}])} [:i.mode-light {:class (when color-accent "radix")}] [:strong (t :settings-page/theme-light)]]
                    [:li {:on-click (partial state/use-theme-mode! "dark")
                          :class    (classnames [{:active (and (not system-theme?) dark?)}])} [:i.mode-dark {:class (when color-accent "radix")}] [:strong (t :settings-page/theme-dark)]]
                    [:li {:on-click (partial state/use-theme-mode! "system")
                          :class    (classnames [{:active system-theme?}])} [:i.mode-system {:class (when color-accent "radix")}] [:strong (t :settings-page/theme-system)]]]]
    (row-with-button-action {:left-label (t :right-side-bar/switch-theme (string/capitalize switch-theme))
                             :-for       "toggle_theme"
                             :action     pick-theme
                             :desc       (ui/render-keyboard-shortcut (shortcut-helper/gen-shortcut-seq :ui/toggle-theme))})))

(rum/defc accent-color-row < rum/reactive
  [_in-modal?]
  (let [color-accent (state/sub :ui/radix-color)
        pick-theme [:div.cp__accent-colors-list-wrap
                    {:class (if _in-modal? "as-modal-picker" "")}
                    (for [color (concat [:none :logseq] colors/color-list)
                          :let [active? (= color color-accent)
                                none? (= color :none)]]
                      [:div.flex.items-center
                       (ui/tooltip
                        (shui/button
                         {:class "w-5 h-5 px-1 rounded-full flex justify-center items-center transition ease-in duration-100 hover:cursor-pointer hover:opacity-100"
                          :auto-focus (and _in-modal? active?)
                          :style {:background-color (colors/variable color :09)
                                  :outline-color (colors/variable color (if active? :07 :06))
                                  :outline-width (if active? "4px" "1px")
                                  :outline-style :solid
                                  :opacity (if active? 1 0.5)}
                          :variant :text
                          :on-click (fn [_e] (state/set-color-accent! color))}
                         [:strong
                          {:class (if none? "h-0.5 w-full bg-red-700"
                                      "w-2 h-2 rounded-full transition ease-in duration-100")
                           :style {:background-color (if-not none? (str "var(--rx-" (name color) "-07)") "")
                                   :opacity (if (or none? active?) 1 0)}}])

                        (case color
                          :none [:p {:style {:max-width "300px"}}
                                 "Cancel accent color. This is currently in beta stage and mainly used for compatibility with custom themes."]
                          :logseq "Logseq classical color"
                          (str (name color) " color")))])]]

    [:div
     (row-with-button-action
      {:left-label (t :settings-page/accent-color)
       :-for "toggle_radix_theme"
       :desc (when-not _in-modal?
               [:span.pl-6 (ui/render-keyboard-shortcut
                            (shortcut-helper/gen-shortcut-seq :ui/customize-appearance))])
       :stretch (boolean _in-modal?)
       :action pick-theme})
     [:div.text-sm.opacity-50.mt-1
      (t :settings-page/accent-color-alert)]]))

(rum/defc appearance < rum/reactive
  []
  [:div#appearance_settings.cp__settings-appearance-modal-inner.w-96.p-4.shadow-xl
   (theme-modes-row t)
   (editor-font-family-row t (state/sub :ui/editor-font))
   (toggle-wide-mode-row t (state/sub :ui/wide-mode?))
   (show-brackets-row t (state/show-brackets?))
   (accent-color-row true)])

(defn date-format-row [t preferred-date-format]
  [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-center
   [:label.block.text-sm.font-medium.leading-5.opacity-70
    {:for "custom_date_format"}
    (t :settings-page/custom-date-format)]
   [:div.mt-1.sm:mt-0.sm:col-span-2
    [:div.max-w-lg.rounded-md
     [:select.form-select.is-small
      {:value     preferred-date-format
       :on-change (fn [e]
                    (let [format (util/evalue e)]
                      (when-not (string/blank? format)
                        (p/do!
                         (property-handler/set-block-property! :logseq.class/Journal
                                                               :logseq.property.journal/title-format
                                                               format)
                         (notification/show! "Please refresh the app for this change to take effect"))
                        (shui/dialog-close-all!))))}
      (for [format (sort (date/journal-title-formatters))]
        [:option {:key format} format])]]]])

(defn outdenting-row [t logical-outdenting?]
  (toggle "preferred_outdenting"
          [(t :settings-page/preferred-outdenting)
           (ui/tooltip [:span.flex.px-2 (svg/info)]
                       (outdenting-hint) {:content-props {:side "right"}})]
          logical-outdenting?
          config-handler/toggle-logical-outdenting!))

(defn showing-full-blocks [t show-full-blocks?]
  (toggle "show_full_blocks"
          (t :settings-page/show-full-blocks)
          show-full-blocks?
          config-handler/toggle-show-full-blocks!))

(defn preferred-pasting-file [t preferred-pasting-file?]
  (toggle "preferred_pasting_file"
          [(t :settings-page/preferred-pasting-file)
           (ui/tooltip [:span.flex.px-2 (svg/info)]
                       [:span.block.w-64 (t :settings-page/preferred-pasting-file-hint)])]
          preferred-pasting-file?
          config-handler/toggle-preferred-pasting-file!))

(defn auto-expand-row [t auto-expand-block-refs?]
  (toggle "auto_expand_block_refs"
          [(t :settings-page/auto-expand-block-refs)
           (ui/tooltip [:span.flex.px-2 (svg/info)]
                       (auto-expand-hint))]
          auto-expand-block-refs?
          config-handler/toggle-auto-expand-block-refs!))

(defn tooltip-row [t enable-tooltip?]
  (toggle "enable_tooltip"
          (t :settings-page/enable-tooltip)
          enable-tooltip?
          (fn []
            (config-handler/toggle-ui-enable-tooltip!))))

(defn shortcut-tooltip-row [t enable-shortcut-tooltip?]
  (toggle "enable_tooltip"
          (t :settings-page/enable-shortcut-tooltip)
          enable-shortcut-tooltip?
          (fn []
            (state/toggle-shortcut-tooltip!))))

(defn update-home-page
  [event]
  (let [value (util/evalue event)]
    (cond
      (string/blank? value)
      (let [home (get (state/get-config) :default-home {})
            new-home (dissoc home :page)]
        (p/do!
         (config-handler/set-config! :default-home new-home)
         (config-handler/set-config! :feature/enable-journals? true)
         (notification/show! "Journals enabled" :success)))

      ;; FIXME: home page should be db id instead of page name
      (ldb/get-page (db/get-db) value)
      (let [home (get (state/get-config) :default-home {})
            new-home (assoc home :page value)]
        (config-handler/set-config! :default-home new-home)
        (notification/show! "Home default page updated successfully!" :success))

      :else
      (notification/show! (str "The page \"" value "\" doesn't exist yet. Please create that page first, and then try again.") :warning))))

(defn journal-row [enable-journals?]
  (toggle "enable_journals"
          (t :settings-page/enable-journals)
          enable-journals?
          (fn []
            (let [value (not enable-journals?)]
              (config-handler/set-config! :feature/enable-journals? value)))))

(defn enable-all-pages-public-row [t enable-all-pages-public?]
  (toggle "all pages public"
          (t :settings-page/enable-all-pages-public)
          enable-all-pages-public?
          (fn []
            (let [value (not enable-all-pages-public?)]
              (config-handler/set-config! :publishing/all-pages-public? value)))))

(defn usage-diagnostics-row [t instrument-disabled?]
  (toggle "usage-diagnostics"
          (t :settings-page/disable-sentry)
          (not instrument-disabled?)
          (fn [] (instrument/disable-instrument
                  (not instrument-disabled?)))
          [:span.text-sm.opacity-50 (t :settings-page/disable-sentry-desc)]))

;; (defn clear-cache-row [t]
;;   (row-with-button-action {:left-label   (t :settings-page/clear-cache)
;;                            :button-label (t :settings-page/clear)
;;                            :on-click     #(state/pub-event! [:graph/clear-cache!])
;;                            :-for         "clear_cache"}))

(defn version-row [t version]
  (row-with-button-action {:left-label (t :settings-page/current-version)
                           :action     (app-updater version)
                           :-for       "current-version"}))

(defn developer-mode-row [t developer-mode?]
  (toggle "developer_mode"
          (t :settings-page/developer-mode)
          developer-mode?
          (fn []
            (let [mode (not developer-mode?)]
              (state/set-developer-mode! mode)))
          [:div.text-sm.opacity-50 (t :settings-page/developer-mode-desc)]))

(rum/defc plugin-enabled-switcher
  [t]
  (let [value (state/lsp-enabled?-or-theme)
        [on? set-on?] (rum/use-state value)
        on-toggle #(let [v (not on?)]
                     (set-on? v)
                     (storage/set ::storage-spec/lsp-core-enabled v))]
    [:div.flex.items-center.gap-2
     (ui/toggle on? on-toggle true)

     (when (util/electron?)
       (when (not= (boolean value) on?)
         (ui/button (t :plugin/restart)
                    :on-click #(js/logseq.api.relaunch)
                    :small? true :intent "logseq")))]))

(rum/defc http-server-enabled-switcher
  [t]
  (let [[value _] (rum/use-state (boolean (storage/get ::storage-spec/http-server-enabled)))
        [on? set-on?] (rum/use-state value)
        on-toggle #(let [v (not on?)]
                     (set-on? v)
                     (storage/set ::storage-spec/http-server-enabled v))]
    [:div.flex.items-center.gap-2
     (ui/toggle on? on-toggle true)
     (when (not= (boolean value) on?)
       (ui/button (t :plugin/restart)
                  :on-click #(js/logseq.api.relaunch)
                  :small? true :intent "logseq"))]))

(rum/defc flashcards-enabled-switcher
  [enable-flashcards?]
  (ui/toggle enable-flashcards?
             (fn []
               (let [value (not enable-flashcards?)]
                 (config-handler/set-config! :feature/enable-flashcards? value)))
             true))

(rum/defc user-proxy-settings
  [{:keys [type protocol host port] :as agent-opts}]
  (ui/button [:span.flex.items-center
              [:span.pr-1
               (case type
                 "system" "System Default"
                 "direct" "Direct"
                 (and protocol host port (str protocol "://" host ":" port)))]
              (ui/icon "edit")]
             :class "text-sm"
             :on-click #(state/pub-event! [:go/proxy-settings agent-opts])))

(defn plugin-system-switcher-row []
  (row-with-button-action
   {:left-label (t :settings-page/plugin-system)
    :action (plugin-enabled-switcher t)}))

(defn http-server-switcher-row []
  (row-with-button-action
   {:left-label "HTTP API server"
    :action (http-server-enabled-switcher t)}))

(defn flashcards-switcher-row [enable-flashcards?]
  (row-with-button-action
   {:left-label (t :settings-page/enable-flashcards)
    :action (flashcards-enabled-switcher enable-flashcards?)}))

(defn https-user-agent-row [agent-opts]
  (row-with-button-action
   {:left-label (t :settings-page/network-proxy)
    :action (user-proxy-settings agent-opts)}))

(rum/defcs auto-chmod-row < rum/reactive
  [state t]
  (let [enabled? (if (= nil (state/sub [:electron/user-cfgs :feature/enable-automatic-chmod?]))
                   true
                   (state/sub [:electron/user-cfgs :feature/enable-automatic-chmod?]))]
    (toggle
     "automatic-chmod"
     (t :settings-page/auto-chmod)
     enabled?
     #(do
        (state/set-state! [:electron/user-cfgs :feature/enable-automatic-chmod?] (not enabled?))
        (ipc/ipc :userAppCfgs :feature/enable-automatic-chmod? (not enabled?)))
     [:span.text-sm.opacity-50 (t :settings-page/auto-chmod-desc)])))

(rum/defcs native-titlebar-row < rum/reactive
  [state t]
  (let [enabled? (state/sub [:electron/user-cfgs :window/native-titlebar?])]
    (toggle
     "native-titlebar"
     (t :settings-page/native-titlebar)
     enabled?
     #(when (js/confirm (t :relaunch-confirm-to-work))
        (state/set-state! [:electron/user-cfgs :window/native-titlebar?] (not enabled?))
        (ipc/ipc :userAppCfgs :window/native-titlebar? (not enabled?))
        (js/logseq.api.relaunch))
     [:span.text-sm.opacity-50 (t :settings-page/native-titlebar-desc)])))

(rum/defcs settings-general < rum/reactive
  [_state current-repo]
  (let [preferred-language (state/sub [:preferred-language])
        show-radix-themes? true
        editor-font (state/sub :ui/editor-font)]
    [:div.panel-wrap.is-general
     (version-row t fv/version)
     (language-row t preferred-language)
     (theme-modes-row t)
     (editor-font-family-row t editor-font)
     (when (and (util/electron?) (not util/mac?)) (native-titlebar-row t))
     (when show-radix-themes? (accent-color-row false))
     (when (config/global-config-enabled?) (edit-global-config-edn))
     (when current-repo (edit-config-edn))
     (when current-repo (edit-custom-css))
     (when (and current-repo (util/electron?)) (edit-export-css))]))

(rum/defcs settings-editor < rum/reactive
  [_state]
  (let [preferred-date-format (state/get-date-formatter)
        enable-all-pages-public? (state/all-pages-public?)
        logical-outdenting? (state/logical-outdenting?)
        show-full-blocks? (state/show-full-blocks?)
        preferred-pasting-file? (state/preferred-pasting-file?)
        auto-expand-block-refs? (state/auto-expand-block-refs?)
        enable-tooltip? (state/enable-tooltip?)
        enable-shortcut-tooltip? (state/sub :ui/shortcut-tooltip?)
        show-brackets? (state/show-brackets?)
        wide-mode? (state/sub :ui/wide-mode?)]

    [:div.panel-wrap.is-editor
     (date-format-row t preferred-date-format)
     (show-brackets-row t show-brackets?)
     (toggle-wide-mode-row t wide-mode?)

     (when (util/electron?) (switch-spell-check-row t))
     (outdenting-row t logical-outdenting?)
     (showing-full-blocks t show-full-blocks?)
     (preferred-pasting-file t preferred-pasting-file?)
     (auto-expand-row t auto-expand-block-refs?)
     (when-not (or (util/mobile?) (mobile-util/native-platform?))
       (shortcut-tooltip-row t enable-shortcut-tooltip?))
     (when-not (or (util/mobile?) (mobile-util/native-platform?))
       (tooltip-row t enable-tooltip?))
     (enable-all-pages-public-row t enable-all-pages-public?)]))

(rum/defc settings-advanced < rum/reactive
  []
  (let [instrument-disabled? (state/sub :instrument/disabled?)
        developer-mode? (state/sub [:ui/developer-mode?])
        https-agent-opts (state/sub [:electron/user-cfgs :settings/agent])]
    [:div.panel-wrap.is-advanced
     (when (and (or util/mac? util/win32?) (util/electron?)) (app-auto-update-row t))
     (usage-diagnostics-row t instrument-disabled?)
     (when-not (mobile-util/native-platform?) (developer-mode-row t developer-mode?))
     (when (util/electron?) (https-user-agent-row https-agent-opts))
     (when (util/electron?) (auto-chmod-row t))
     ;; (clear-cache-row t)

     ;; (ui/admonition
     ;;  :warning
     ;;  [:p (t :settings-page/clear-cache-warning)])
     ]))

(rum/defc settings-account-usage-description [pro-account? graph-usage]
  (let [count-usage (count graph-usage)
        count-limit (if pro-account? 10 1)
        count-percent (js/Math.round (/ count-usage count-limit 0.01))
        storage-usage (->> (map :used-gbs graph-usage)
                           (reduce + 0))
        storage-usage-formatted (cond
                                  (zero? storage-usage) "0.0"
                                  (< storage-usage 0.01) "Less than 0.01"
                                  :else (gstring/format "%.2f" storage-usage))
        ;; TODO: check logic on this. What are the rules around storage limits?
        ;; do we, and should we be able to, give individual users more storage?
        ;; should that be on a per graph or per user basis?
        default-storage-limit (if pro-account? 10 0.05)
        storage-limit (->> (range 0 count-limit)
                           (map #(get-in graph-usage [% :limit-gbs] default-storage-limit))
                           (reduce + 0))
        storage-percent (/ storage-usage storage-limit 0.01)
        storage-percent-formatted (gstring/format "%.1f" storage-percent)]
    [:div.text-sm
     (when pro-account?
       [:<>
        (gstring/format "%s of %s synced graphs " count-usage count-limit)
        [:strong.text-white (gstring/format "(%s%%)" count-percent)]
        ", "])
     (gstring/format "%sGB of %sGB total storage " storage-usage-formatted storage-limit)
     [:strong.text-white (gstring/format "(%s%%)" storage-percent-formatted)]]))
     ; storage-usage-formatted "GB of " storage-limit "GB total storage"
     ; [:strong.text-white " (" storage-percent-formatted "%)"]]))

(rum/defc settings-account-usage-graphs [_pro-account? graph-usage]
  (when (< 0 (count graph-usage))
    [:div.grid.gap-3 {:style {:grid-template-columns (str "repeat(" (count graph-usage) ", 1fr)")}}
     (for [{:keys [name used-percent]} graph-usage
           :let [color (if (<= 100 used-percent) "bg-red-500" "bg-blue-500")]]
       [:div.rounded-full.w-full.h-2 {:class "bg-black/50"
                                      :tooltip name}
        [:div.rounded-full.h-2 {:class color
                                :style {:width (str used-percent "%")
                                        :min-width "0.5rem"
                                        :max-width "100%"}}]])]))

(rum/defc ^:large-vars/cleanup-todo settings-account < rum/reactive
  []
  (let [graph-usage []
        logged-in? (user-handler/logged-in?)
        user-info (state/get-user-info)
        paid-user? (#{"active" "on_trial" "cancelled"} (:LemonStatus user-info))
        gift-user? (some #{"pro"} (:UserGroups user-info))
        pro-account? (or paid-user? gift-user?)
        expiration-date (some-> user-info :LemonEndsAt date/parse-iso)
        renewal-date (some-> user-info :LemonRenewsAt date/parse-iso)
        has-subscribed? (some? (:LemonStatus user-info))]
    [:div.panel-wrap.is-features.mb-8
     [:div.mt-1.sm:mt-0.sm:col-span-2
      (cond
        logged-in?
        [:div.grid.grid-cols-3.gap-8.pt-2
         [:div "Current plan"]
         [:div.col-span-2
          [:div {:class "w-full bg-gray-500/10 rounded-lg p-4 flex flex-col gap-4"}
           [:div.flex.gap-4.items-center
            (if pro-account?
              [:div.flex-1 "Pro"]
              [:div.flex-1 "Free"])
            (cond
              has-subscribed?
              (ui/button "Manage plan" {:class "p-1 h-8 justify-center"
                                        :disabled true
                                        :icon "upload"})
                                         ; :on-click user-handler/upgrade})
              (not pro-account?)
              (ui/button "Upgrade plan" {:class "p-1 h-8 justify-center"
                                         :icon "upload"
                                         :on-click user-handler/upgrade})
              :else nil)]
           (settings-account-usage-graphs pro-account? graph-usage)
           (settings-account-usage-description pro-account? graph-usage)]]
         (when has-subscribed?
           [:<>
            [:div "Billing"]
            [:div.col-span-2.flex.flex-col.gap-4
             (cond
              ;; If there is no expiration date, print the renewal date
               (and renewal-date (nil? expiration-date))
               [:div
                [:strong.font-semibold "Next billing date: "
                 (date/get-locale-string renewal-date)]]
              ;; If the expiration date is in the future, word it as such
               (< (js/Date.) expiration-date)
               [:div
                [:strong.font-semibold "Pro plan expires on: "
                 (date/get-locale-string expiration-date)]]
              ;; Otherwise, ind
               :else
               [:div
                [:strong.font-semibold "Pro plan expired on: "
                 (date/get-locale-string expiration-date)]])

             [:div (ui/button "Open invoices" {:class "w-full h-8 p-1 justify-center"
                                               :disabled true
                                               :background "gray"
                                               :icon "receipt"})]]])
         [:div "Profile"]
         [:div.col-span-2.grid.grid-cols-2.gap-4
          [:div.flex.flex-col.gap-2.box-border {:class "basis-1/2"}
           [:label.text-sm.font-semibold "First name"]
           [:input.rounded.border.px-2.py-1.box-border {:class "border-blue-500 bg-black/25 w-full"}]]
          [:div.flex.flex-col.gap-2 {:class "basis-1/2"}
           [:label.text-sm.font-semibold "Last name"]
           [:input.rounded.border.px-2.py-1.box-border {:class "border-blue-500 bg-black/25 w-full"}]]
          [:div.flex-1.flex.flex-col.gap-2.col-span-2
           [:label.text-sm.font-semibold "Username"]
           [:input.rounded.border.px-2.py-1.box-border {:class "border-blue-500 bg-black/25"
                                                        :value (user-handler/email)}]]]
         [:div "Authentication"]
         [:div.col-span-2
          [:div.grid.grid-cols-2.gap-4
           [:div (ui/button (t :logout) {:class "p-1 h-8 justify-center w-full"
                                         :background "gray"
                                         :icon "logout"
                                         :on-click user-handler/logout})]
           [:div (ui/button "Reset password" {:class "p-1 h-8 justify-center w-full"
                                              :disabled true
                                              :background "gray"
                                              :icon "key"
                                              :on-click user-handler/logout})]
           [:div.col-span-2 (ui/button "Delete Account" {:class "p-1 h-8 justify-center w-full"
                                                         :disabled true
                                                         :background "red"})]]]]

        (not logged-in?)
        [:div.grid.grid-cols-3.gap-8.pt-2
         [:div "Authentication"]
         [:div.col-span-2.flex.flex-wrap.gap-4
          [:div.w-full.text-white "With a Logseq account, you can access cloud-based services like Logseq Sync and alpha/beta features."]
          [:div.flex-1 (ui/button "Sign up" {:class "h-8 w-full text-center justify-center"
                                             :on-click (fn []
                                                         (state/close-settings!)
                                                         (state/pub-event! [:user/login]))})]
          [:div.flex-1 (ui/button (t :login) {:icon "login"
                                              :class "h-8 w-full text-center justify-center"
                                              :background "gray"
                                              :on-click (fn []
                                                          (state/close-settings!)
                                                          (state/pub-event! [:user/login]))})]]
         [:div.col-span-3.flex.flex-col.gap-4 {:class "bg-black/20 p-4 rounded-lg"}
          [:div.flex.w-full.items-center
           [:div {:class "w-1/2 text-lg"}
            "Discover the power of "
            [:strong {:class "text-white/80"} "Logseq Sync"]]
           [:div {:class "w-1/2 bg-gradient-to-r from-white/10 to-transparent p-3 rounded-lg flex items-center gap-2 px-5 ml-5"}
            [:div.w-3.h-3.rounded-full.bg-green-500]
            "Synced"]]
          [:div.flex.w-full.gap-4
           [:div {:class "w-1/2 bg-black/50 rounded-lg p-4 pt-10 relative flex flex-col gap-4"}
            [:div.absolute.top-0.left-4.bg-gray-700.uppercase.px-2.py-1.rounded-b-lg.font-bold.text-xs "Free"]
            [:div
             [:strong.text-white.text-xl.font-normal "$0"]]
            [:div.text-white.font-bold {:class "h-[2.5rem] "} "Get started with basic syncing"]
            [:ul.text-xs.list-none.m-0.flex.flex-col.gap-0.5
             [:li "Unlimited unsynced graphs"]
             [:li "1 synced graph (up to 50MB, notes only)"]
             [:li "No asset syncing"]
             [:li "Access to core Logseq features"]]]
           [:div {:class "w-1/2 bg-black/50 rounded-lg p-4 pt-10 relative flex flex-col gap-4"}
            [:div.absolute.top-0.left-4.bg-blue-700.uppercase.px-2.py-1.rounded-b-lg.font-bold.text-xs "Pro"]
            [:div
             [:strong.text-white.text-xl.font-normal "$10"]
             [:span.text-xs.font-base {:class "ml-0.5"} "/ month"]]
            [:div.text-white.font-bold {:class "h-[2.5rem]"} "Unlock advanced syncing and more"]
            [:ul.text-xs.list-none.m-0.flex.flex-col.gap-0.5
             [:li "Unlimited unsynced graphs"]
             [:li "10 synced graphs (up to 5GB each)"]
             [:li "Sync assets up to 100MB per file"]
             [:li "Early access to alpha/beta features"]
             [:li "Upcoming cloud-based features, including Logseq Publish"]]]]]])]]))

(rum/defc settings-features < rum/reactive
  []
  (let [current-repo (state/get-current-repo)
        enable-journals? (state/enable-journals? current-repo)
        enable-flashcards? (state/enable-flashcards? current-repo)
        logged-in? (user-handler/logged-in?)]
    [:div.panel-wrap.is-features.mb-8
     (journal-row enable-journals?)
     (when (not enable-journals?)
       [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-center
        [:label.block.text-sm.font-medium.leading-5.opacity-70
         {:for "default page"}
         (t :settings-page/home-default-page)]
        [:div.mt-1.sm:mt-0.sm:col-span-2
         [:div.max-w-lg.rounded-md.sm:max-w-xs
          [:input#home-default-page.form-input.is-small.transition.duration-150.ease-in-out
           {:default-value (state/sub-default-home-page)
            :on-blur       update-home-page
            :on-key-press  (fn [e]
                             (when (= "Enter" (util/ekey e))
                               (update-home-page e)))}]]]])
     (when (and web-platform? config/feature-plugin-system-on?)
       (plugin-system-switcher-row))
     (when (util/electron?)
       (http-server-switcher-row))
     (flashcards-switcher-row enable-flashcards?)
     (when-not web-platform?
       [:div.mt-1.sm:mt-0.sm:col-span-2
        [:hr]
        (if logged-in?
          [:div
           (user-handler/email)
           [:p (ui/button (t :logout) {:class "p-1"
                                       :icon "logout"
                                       :on-click user-handler/logout})]]
          [:div
           (ui/button (t :login) {:class "p-1"
                                  :icon "login"
                                  :on-click (fn []
                                              (state/close-settings!)
                                              (state/pub-event! [:user/login]))})
           [:p.text-sm.opacity-50 (t :settings-page/login-prompt)]])])]))

(def DEFAULT-ACTIVE-TAB-STATE (if config/ENABLE-SETTINGS-ACCOUNT-TAB [:account :account] [:general :general]))

(rum/defc settings-effect
  < rum/static
  [active]

  (hooks/use-effect!
   (fn []
     (let [active (and (sequential? active) (name (first active)))
           ^js ds (.-dataset js/document.body)]
       (if active
         (set! (.-settingsTab ds) active)
         (js-delete ds "settingsTab"))
       #(js-delete ds "settingsTab")))
   [active])

  [:<>])

(rum/defc settings-rtc-members
  []
  (let [[invite-email set-invite-email!] (hooks/use-state "")
        [loading? set-loading!] (hooks/use-state true)
        current-repo (state/get-current-repo)
        [users-info] (hooks/use-atom (:rtc/users-info @state/state))
        users (get users-info current-repo)
        invite-user! (fn []
                       (let [graph-uuid (ldb/get-graph-rtc-uuid (db/get-db))]
                         (when-not (string/blank? invite-email)
                           (when graph-uuid
                             (rtc-handler/<rtc-invite-email graph-uuid invite-email)))))]
    (hooks/use-effect!
     #(c.m/run-task*
       (m/sp
        (c.m/<? (rtc-handler/<rtc-get-users-info))
        (set-loading! false)))
     [])
    [:div.flex.flex-col.gap-2.mt-4
     {:on-key-press (fn [e]
                      (when (= "Enter" (.-key e))
                        (invite-user!)))}
     [:h2.opacity-50.font-medium "Members:"]
     [:div.users.flex.flex-col.gap-1
      (if loading?
        (for [i (range 2)]
          [:div.flex.flex-row.items-center.gap-2.pr-4 {:key (str "skeleton-" i)}
           (shui/skeleton {:class "h-4 w-32"})
           (shui/skeleton {:class "h-4 w-full"})])
        (for [{user-name :user/name
               user-email :user/email
               graph<->user-user-type :graph<->user/user-type} users]
          [:div.flex.flex-row.items-center.gap-2 {:key (str "user-" user-name)}
           [:div user-name]
           (when user-email [:div.opacity-50.text-sm user-email])
           (when graph<->user-user-type [:div.opacity-50.text-sm (name graph<->user-user-type)])]))]
     [:div.flex.flex-col.gap-4.mt-4
      (shui/input
       {:placeholder   "Email address"
        :on-change     #(set-invite-email!
                         (string/trim (util/evalue %)))})
      (shui/button
       {:on-click invite-user!}
       "Invite")]]))

(rum/defc settings-collaboration
  []
  [:div.panel-wrap.is-collaboration.mb-8
   (settings-rtc-members)])

(rum/defc forgot-password
  [token refresh-token user-uuid]
  (let [[new-password set-new-password!] (hooks/use-state "")
        [force-reset-status set-force-reset-status!] (hooks/use-state nil)
        <force-reset-password-fn
        (fn []
          (-> (p/do!
               (set-force-reset-status! "Force resetting password ...")
               (state/<invoke-db-worker :thread-api/reset-user-rsa-key-pair
                                        token refresh-token user-uuid new-password)
               (set-force-reset-status! "Force reset password successfully!"))
              (p/catch (fn [e]
                         (log/error :forgot-password e)
                         (set-force-reset-status! "Failed to force resetting password.")))))]
    [:div.flex.flex-col.gap-4
     [:p
      "If you forget your password, you can force a reset of your encryption password. However, this will make all currently encrypted graph data stored on the server permanently unreadable. After resetting, you’ll need to re-upload your graphs from the client."]
     [:label.opacity-70 {:for "new-password"} "Set new Password"]
     (shui/toggle-password
      {:id "new-password"
       :value new-password
       :on-change #(set-new-password! (util/evalue %))})
     (when force-reset-status [:p force-reset-status])
     (shui/button
      {:on-click <force-reset-password-fn
       :disabled (string/blank? new-password)}
      "Force reset password")]))

(rum/defc reset-encryption-password
  [current-password new-password {:keys [set-new-password!
                                         set-current-password!
                                         reset-password-status
                                         on-click forgot? set-forgot!
                                         token refresh-token user-uuid]}]
  (let [[reset? set-reset!] (hooks/use-state false)]
    (cond
      forgot?
      (forgot-password token refresh-token user-uuid)
      reset?
      [:div.flex.flex-col.gap-4
       [:label.opacity-70 {:for "current-password"} "Current password"]
       (shui/toggle-password
        {:id "current-password"
         :value current-password
         :on-change #(set-current-password! (util/evalue %))})
       [:label.opacity-70 {:for "new-password"} "Set new Password"]
       (shui/toggle-password
        {:id "new-password"
         :value new-password
         :on-change #(set-new-password! (util/evalue %))})
       (when reset-password-status [:p reset-password-status])
       (shui/button
        {:on-click on-click
         :disabled (string/blank? new-password)}
        "Reset password")
       [:a.opacity-70.hover:opacity-100 {:on-click #(set-forgot! true)}
        "Forgot password?"]]
      :else
      [:a.opacity-70.hover:opacity-100 {:on-click #(set-reset! true)}
       "Reset password"])))

(rum/defc encryption
  []
  (let [user-uuid (user-handler/user-uuid)
        token (state/get-auth-id-token)
        refresh-token (str (state/get-auth-refresh-token))
        [rsa-key-pair set-rsa-key-pair!] (hooks/use-state :not-inited)
        [init-key-err set-init-key-err!] (hooks/use-state nil)
        [get-key-err set-get-key-err!] (hooks/use-state nil)
        [current-password set-current-password!] (hooks/use-state nil)
        [new-password set-new-password!] (hooks/use-state nil)
        [reset-password-status set-reset-password-status!] (hooks/use-state nil)
        [forgot? set-forgot!] (hooks/use-state false)]
    [:div.panel-wrap.is-encryption.mb-8
     (hooks/use-effect!
      (fn []
        (when (and user-uuid token)
          (-> (p/let [r (state/<invoke-db-worker :thread-api/get-user-rsa-key-pair token user-uuid)]
                (set-rsa-key-pair! r))
              (p/catch set-get-key-err!))
          (-> (p/let [{:keys [password]} (state/<invoke-db-worker :thread-api/get-e2ee-password refresh-token)]
                (set-current-password! password))
              (p/catch (fn [_] (set-current-password! ""))))))
      [user-uuid token])
     [:div.flex.flex-col.gap-2.mt-4
      (when (and user-uuid token)
        (cond
          get-key-err
          [:p (str "Fetching user rsa-key-pair err: " get-key-err)]
          (= rsa-key-pair :not-inited)
          [:p "Fetching user rsa-key-pair..."]
          (nil? rsa-key-pair)
          [:div.flex.flex-col.gap-2
           (when init-key-err [:p (str "Init key-pair err:" init-key-err)])
           (shui/button
            {:on-click (fn []
                         (-> (p/do!
                              (state/<invoke-db-worker :thread-api/init-user-rsa-key-pair
                                                       token
                                                       refresh-token
                                                       user-uuid)
                              (p/let [r (state/<invoke-db-worker :thread-api/get-user-rsa-key-pair token user-uuid)]
                                (set-rsa-key-pair! r)))
                             (p/catch set-init-key-err!)))}
            "Init E2EE encrypt-key-pair")]
          rsa-key-pair
          (let [on-submit (fn []
                            (-> (p/do!
                                 (set-reset-password-status! "Updating password ...")
                                 (state/<invoke-db-worker :thread-api/change-e2ee-password
                                                          token refresh-token user-uuid current-password new-password)
                                 (set-reset-password-status! "Password updated successfully!"))
                                (p/catch (fn [e]
                                           (log/error :reset-password-failed e)
                                           (set-reset-password-status! "Failed to update password.")))))]
            [:div.flex.flex-col.gap-4
             ;; [:p "E2EE key-pair already generated!"]
             (when-not forgot?
               [:div.flex.flex-col
                [:p
                 [:span "Please make sure you "]
                 "remember the password you have set, as we are unable to reset or retrieve it in case you forget it, "
                 [:span "and we recommend you "]
                 "keep a secure backup "
                 [:span "of the password."]]

                [:p
                 "If you lose your password, all of your data in the cloud can’t be decrypted. "
                 [:span "You will still be able to access the local version of your graph."]]])
             (reset-encryption-password current-password new-password
                                        {:reset-password-status reset-password-status
                                         :set-new-password! set-new-password!
                                         :set-current-password! set-current-password!
                                         :on-click on-submit
                                         :token token
                                         :forgot? forgot?
                                         :set-forgot! set-forgot!
                                         :refresh-token refresh-token
                                         :user-uuid user-uuid})])))]]))

(rum/defc mcp-server-row
  [t]
  (let [[checked set-checked!] (hooks/use-state false)]

    (hooks/use-effect!
     (fn []
       (let [initial (get-in @state/state [:electron/server :mcp-enabled?])]
         (set-checked! initial)))
     [])

    (let [on-toggle (fn []
                      (let [new-val (not checked)]
                        (set-checked! new-val)
                        ;; Enable HTTP server to simplify starting MCP
                        (when (and new-val (not (storage/get ::storage-spec/http-server-enabled)))
                          (storage/set ::storage-spec/http-server-enabled true))
                        (-> (ipc/ipc :server/set-config {:mcp-enabled? new-val})
                            ;; Don't start server if it's not running
                            (p/then #(when (= "running" (state/sub [:electron/server :status]))
                                       (p/let [_ (p/delay 1000)]
                                         (ipc/ipc :server/do :restart))))
                            (p/catch #(notification/show! (str %) :error)))))]
      (toggle "mcp-server"
              (t :settings-page/enable-mcp-server)
              checked
              on-toggle
              [:span.text-sm.opacity-50
               (t :settings-page/enable-mcp-server-desc)]))))

(rum/defc settings-ai
  []
  (let [[model-info set-model-info] (hooks/use-state nil)
        [load-model-progress set-load-model-progress] (hooks/use-state nil)
        {:keys [status]} load-model-progress
        repo (state/get-current-repo)
        current-model (:graph-text-embedding-model-name model-info)
        [webgpu? set-webgpu?] (hooks/use-state nil)]
    (hooks/use-effect!
     (fn []
       (p/let [webgpu? (db-browser/<check-webgpu-available?)]
         (set-webgpu? webgpu?)))
     [])
    (hooks/use-effect!
     (fn []
       (c.m/run-task
         ::fetch-model-info
         (m/reduce
          (constantly nil)
          (m/ap
            (m/?> vector-search-flows/infer-worker-ready-flow)
            (let [model-info (c.m/<? (state/<invoke-db-worker :thread-api/vec-search-embedding-model-info repo))]
              (set-model-info model-info))))
         :succ (constantly nil)))
     [])
    (hooks/use-effect!
     (fn []
       (c.m/run-task
         ::update-load-model-progress
         (m/reduce
          (fn [_ v] (set-load-model-progress (walk/keywordize-keys v)))
          vector-search-flows/load-model-progress-flow)
         :succ (constantly nil)))
     [])
    [:div.panel-wrap
     (when (util/electron?)
       (mcp-server-row t))
     [:div.flex.flex-col.gap-2.mt-4
      [:div.font-medium.text-muted-foreground.text-sm "Semantic search:"]

      [:div.flex.flex-col.gap-2
       [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
        [:label.block.text-sm.font-medium.leading-8.opacity-70
         {:for "local-embedding-model"}
         "Local embedding model"]
        [:div.rounded-md.sm:max-w-tss.sm:col-span-2
         (if webgpu?
           [:div.flex.flex-col.gap-2
            (shui/select
             (cond->
              {:on-value-change (fn [model-name]
                                  (c.m/run-task
                                    ::load-model
                                    (m/sp
                                      (set-model-info (assoc model-info :graph-text-embedding-model-name model-name))
                                      (c.m/<?
                                       (state/<invoke-db-worker :thread-api/vec-search-load-model repo model-name))
                                      (c.m/<?
                                       (state/<invoke-db-worker :thread-api/vec-search-cancel-indexing repo))
                                      (c.m/<?
                                       (state/<invoke-db-worker :thread-api/vec-search-embedding-graph repo {:reset-embedding? true})))
                                    :succ (constantly nil)))}
               current-model
               (assoc :value current-model))
             (shui/select-trigger
              {:class "h-8"}
              (shui/select-value
               {:placeholder "Select a model"}))

             (shui/select-content
              (shui/select-group
               (for [model-name (:available-model-names model-info)]
                 (shui/select-item {:value model-name} model-name)))))

            (when status
              [:div.text-muted-foreground.text-sm
               (let [{:keys [file progress loaded total]} load-model-progress]
                 (case status
                   ("progress" "download" "initiate")
                   (str "Downloading " file
                        (when progress
                          (util/format " %d/%dm"
                                       (int (/ loaded 1024 1024))
                                       (int (/ total 1024 1024)))))
                   "done"
                   (str "Downloaded " file)
                   "ready"
                   "Model is ready  🚀"
                   nil))])]
           [:div.warning "WebGPU is not supported on this browser, please upgrade it or using another browser."])]]]]]))

(rum/defcs ^:large-vars/cleanup-todo settings
  < (rum/local DEFAULT-ACTIVE-TAB-STATE ::active)
  {:will-mount
   (fn [state]
     (state/load-app-user-cfgs)
     state)
   :did-mount
   (fn [state]
     (let [active-tab (first (:rum/args state))
           *active (::active state)]
       (when (keyword? active-tab)
         (reset! *active [active-tab nil])))
     state)
   :will-unmount
   (fn [state]
     (state/close-settings!)
     state)}
  rum/reactive
  [state _active-tab]
  (let [current-repo (state/sub :git/current-repo)
        _installed-plugins (state/sub :plugin/installed-plugins)
        plugins-of-settings (and config/lsp-enabled? (seq (plugin-handler/get-enabled-plugins-if-setting-schema)))
        *active (::active state)
        logged-in? (user-handler/logged-in?)]

    [:div#settings.cp__settings-main
     (settings-effect @*active)
     [:div.cp__settings-inner
      [:aside.md:w-64 {:style {:min-width "10rem"}}
       [:header.cp__settings-header
        [:h1.cp__settings-modal-title (t :settings)]]
       [:ul.settings-menu
        (for [[label id text icon]
              [(when config/ENABLE-SETTINGS-ACCOUNT-TAB
                 [:account "account" (t :settings-page/tab-account) (ui/icon "user-circle")])
               [:general "general" (t :settings-page/tab-general) (ui/icon "adjustments")]
               [:editor "editor" (t :settings-page/tab-editor) (ui/icon "writing")]
               [:keymap "keymap" (t :settings-page/tab-keymap) (ui/icon "keyboard")]

               [:ai (t :settings-page/tab-ai) (t :settings-page/ai) (ui/icon "wand")]

               [:advanced "advanced" (t :settings-page/tab-advanced) (ui/icon "bulb")]
               [:features "features" (t :settings-page/tab-features) (ui/icon "app-feature")]
               (when logged-in?
                 [:collaboration "collaboration" (t :settings-page/tab-collaboration) (ui/icon "users")])

               (when logged-in?
                 [:encryption "encryption" (t :settings-page/tab-encryption) (ui/icon "lock")])

               (when plugins-of-settings
                 [:plugins-setting "plugins" (t :settings-of-plugins) (ui/icon "puzzle")])]]

          (when label
            [:li.settings-menu-item
             {:key      text
              :data-id  id
              :class    (util/classnames [{:active (= label (first @*active))}])
              :on-click (fn []
                          (if (= label :plugins-setting)
                            (state/pub-event! [:go/plugins-settings (:id (first plugins-of-settings))])
                            (reset! *active [label (first @*active)])))}

             [:a.flex.items-center.settings-menu-link icon [:strong text]]]))]]

      [:article
       [:header.cp__settings-header
        [:h1.cp__settings-category-title (t (keyword (str "settings-page/tab-" (name (first @*active)))))]]

       (case (first @*active)

         :plugins-setting
         (let [label (second @*active)]
           (state/pub-event! [:go/plugins-settings (:id (first plugins-of-settings))])
           (reset! *active [label label])
           nil)

         :account
         (settings-account)

         :general
         (settings-general current-repo)

         :editor
         (settings-editor)

         :keymap
         (shortcut/shortcut-keymap-x)

         :assets
         (assets/settings-content)

         :advanced
         (settings-advanced)

         :features
         (settings-features)

         :collaboration
         (settings-collaboration)

         :encryption
         (encryption)

         :ai
         (settings-ai)

         nil)]]]))
