(ns frontend.components.settings
  (:require [clojure.string :as string]
            [frontend.components.svg :as svg]
            [frontend.components.plugins :as plugins]
            [frontend.components.assets :as assets]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.storage :as storage]
            [frontend.spec.storage :as storage-spec]
            [frontend.date :as date]
            [frontend.dicts :as dicts]
            [frontend.handler :as handler]
            [frontend.handler.config :as config-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.user :as user-handler]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.file-sync :as file-sync-handler]
            [frontend.handler.global-config :as global-config-handler]
            [frontend.modules.instrumentation.core :as instrument]
            [frontend.modules.shortcut.data-helper :as shortcut-helper]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [electron.ipc :as ipc]
            [promesa.core :as p]
            [frontend.util :refer [classnames web-platform?] :as util]
            [frontend.version :refer [version]]
            [goog.object :as gobj]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]
            [frontend.mobile.util :as mobile-util]
            [frontend.db :as db]
            [frontend.components.conversion :as conversion-component]))

(defn toggle
  [label-for name state on-toggle & [detail-text]]
  [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
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

      [:div.mt-1.sm:mt-0.sm:col-span-2
       {:style {:display "flex" :gap "0.5rem" :align-items "center"}}
       [:div (cond
               (mobile-util/native-android?)
               (ui/button
                "Check for updates"
                :class "text-sm p-1 mr-1"
                :href "https://github.com/logseq/logseq/releases" )

               (mobile-util/native-ios?)
               (ui/button
                "Check for updates"
                :class "text-sm p-1 mr-1"
                :href "https://apps.apple.com/app/logseq/id1601013908" )

               (util/electron?)
               (ui/button
                (if update-pending? "Checking ..." "Check for updates")
                :class "text-sm p-1 mr-1"
                :disabled update-pending?
                :on-click #(js/window.apis.checkForUpdates false))

               :else
               nil)]

       [:div.text-sm.cursor
        {:title (str "Revision: " config/revision)
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
        "What's new?"]]]

     (when-not (or update-pending?
                   (string/blank? type))
       [:div.update-state.text-sm
        (case type
          "update-not-available"
          [:p "Your app is up-to-date 🎉"]

          "update-available"
          (let [{:keys [name url]} payload]
            [:p (str "Found new release ")
             [:a.link
              {:on-click
               (fn [e]
                 (js/window.apis.openExternal url)
                 (util/stop e))}
              svg/external-link name " 🎉"]])

          "error"
          [:p "⚠️ Oops, Something Went Wrong!" [:br] " Please check out the "
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
     "The left side shows outdenting with the default setting, and the right shows outdenting with logical outdenting enabled. "
     [:a.text-sm
      {:target "_blank" :href "https://discuss.logseq.com/t/whats-your-preferred-outdent-behavior-the-direct-one-or-the-logical-one/978"}
      "→ Learn more"]]
    [:img {:src    "https://discuss.logseq.com/uploads/default/original/1X/e8ea82f63a5e01f6d21b5da827927f538f3277b9.gif"
           :width  500
           :height 500}]]])

(rum/defc auto-expand-hint
  []
  [:div.ui__modal-panel
   {:style {:box-shadow "0 4px 20px 4px rgba(0, 20, 60, .1), 0 4px 80px -8px rgba(0, 20, 60, .2)"}}
   [:div {:style {:margin "12px" :max-width "500px"}}
    [:p.text-sm
     "This option controls whether to expand the block references automatically when zoom-in."]
    [:img {:src    "https://user-images.githubusercontent.com/28241963/225818326-118deda9-9d1e-477d-b0ce-771ca0bcd976.gif"
           :width  500
           :height 500}]]])

(defn row-with-button-action
  [{:keys [left-label action button-label href on-click desc -for]}]
  [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start

   ;; left column
   [:label.block.text-sm.font-medium.leading-5.opacity-70
    {:for -for}
    left-label]

   ;; right column
   [:div.mt-1.sm:mt-0.sm:col-span-2
    {:style {:display "flex" :gap "0.5rem" :align-items "center"}}
    [:div (if action action (ui/button
                              button-label
                              :class    "text-sm p-1"
                              :href     href
                              :on-click on-click))]
    (when-not (or (util/mobile?)
                  (mobile-util/native-platform?))
      [:div.text-sm desc])]])

(defn edit-config-edn []
  (row-with-button-action
    {:left-label   (t :settings-page/custom-configuration)
     :button-label (t :settings-page/edit-config-edn)
     :href         (rfe/href :file {:path (config/get-repo-config-path)})
     :on-click     #(js/setTimeout (fn [] (ui-handler/toggle-settings-modal!)))
     :-for         "config_edn"}))

(defn edit-global-config-edn []
  (row-with-button-action
    {:left-label   (t :settings-page/custom-global-configuration)
     :button-label (t :settings-page/edit-global-config-edn)
     :href         (rfe/href :file {:path (global-config-handler/global-config-path)})
     :on-click     #(js/setTimeout (fn [] (ui-handler/toggle-settings-modal!)))
     :-for         "global_config_edn"}))

(defn edit-custom-css []
  (row-with-button-action
    {:left-label   (t :settings-page/custom-theme)
     :button-label (t :settings-page/edit-custom-css)
     :href         (rfe/href :file {:path (config/get-custom-css-path)})
     :on-click     #(js/setTimeout (fn [] (ui-handler/toggle-settings-modal!)))
     :-for         "customize_css"}))

(defn edit-export-css []
  (row-with-button-action
   {:left-label   (t :settings-page/export-theme)
    :button-label (t :settings-page/edit-export-css)
    :href         (rfe/href :file {:path (config/get-export-css-path)})
    :on-click     #(js/setTimeout (fn [] (ui-handler/toggle-settings-modal!)))
    :-for         "customize_css"}))

(defn show-brackets-row [t show-brackets?]
  [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
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

(rum/defcs switch-spell-check-row < rum/reactive
  [state t]
  (let [enabled? (state/sub [:electron/user-cfgs :spell-check])]
    [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
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

(rum/defcs switch-git-auto-commit-row < rum/reactive
  [state t]
  (let [enabled? (state/get-git-auto-commit-enabled?)]
    [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
     [:label.block.text-sm.font-medium.leading-5.opacity-70
      (t :settings-page/git-switcher-label)]
     [:div
      [:div.rounded-md.sm:max-w-xs
       (ui/toggle
         enabled?
         (fn []
           (state/set-state! [:electron/user-cfgs :git/disable-auto-commit?] enabled?)
           (ipc/ipc :userAppCfgs :git/disable-auto-commit? enabled?))
         true)]]]))

(rum/defcs git-auto-commit-seconds < rum/reactive
  [state t]
  (let [secs (or (state/sub [:electron/user-cfgs :git/auto-commit-seconds]) 60)]
    [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
     [:label.block.text-sm.font-medium.leading-5.opacity-70
      (t :settings-page/git-commit-delay)]
     [:div.mt-1.sm:mt-0.sm:col-span-2
      [:div.max-w-lg.rounded-md.sm:max-w-xs
       [:input#home-default-page.form-input.is-small.transition.duration-150.ease-in-out
        {:default-value secs
         :on-blur       (fn [event]
                          (let [value (-> (util/evalue event)
                                          util/safe-parse-int)]
                            (if (and (number? value)
                                     (< 0 value (inc 600)))
                              (do
                                (state/set-state! [:electron/user-cfgs :git/auto-commit-seconds] value)
                                (ipc/ipc :userAppCfgs :git/auto-commit-seconds value))
                              (when-let [elem (gobj/get event "target")]
                                (notification/show!
                                 [:div "Invalid value! Must be a number between 1 and 600."]
                                 :warning true)
                                (gobj/set elem "value" secs)))))}]]]]))

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

(defn theme-modes-row [t switch-theme system-theme? dark?]
  (let [pick-theme [:ul.theme-modes-options
                    [:li {:on-click (partial state/use-theme-mode! "light")
                          :class    (classnames [{:active (and (not system-theme?) (not dark?))}])} [:i.mode-light] [:strong "light"]]
                    [:li {:on-click (partial state/use-theme-mode! "dark")
                          :class    (classnames [{:active (and (not system-theme?) dark?)}])} [:i.mode-dark] [:strong "dark"]]
                    [:li {:on-click (partial state/use-theme-mode! "system")
                          :class    (classnames [{:active system-theme?}])} [:i.mode-system] [:strong "system"]]]]
    (row-with-button-action {:left-label (t :right-side-bar/switch-theme (string/capitalize switch-theme))
                             :-for       "toggle_theme"
                             :action     pick-theme
                             :desc       (ui/render-keyboard-shortcut (shortcut-helper/gen-shortcut-seq :ui/toggle-theme))})))

(defn file-format-row [t preferred-format]
  [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
   [:label.block.text-sm.font-medium.leading-5.opacity-70
    {:for "preferred_format"}
    (t :settings-page/preferred-file-format)]
   [:div.mt-1.sm:mt-0.sm:col-span-2
    [:div.max-w-lg.rounded-md
     [:select.form-select.is-small
      {:value     (name preferred-format)
       :on-change (fn [e]
                    (let [format (-> (util/evalue e)
                                     (string/lower-case)
                                     keyword)]
                      (user-handler/set-preferred-format! format)))}
      (for [format (map name [:org :markdown])]
        [:option {:key format :value format} (string/capitalize format)])]]]])

(defn date-format-row [t preferred-date-format]
  [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
   [:label.block.text-sm.font-medium.leading-5.opacity-70
    {:for "custom_date_format"}
    (t :settings-page/custom-date-format)
    (ui/tippy {:html        (t :settings-page/custom-date-format-warning)
               :class       "tippy-hover ml-2"
               :interactive true
               :disabled    false}
              (svg/info))]
   [:div.mt-1.sm:mt-0.sm:col-span-2
    [:div.max-w-lg.rounded-md
     [:select.form-select.is-small
      {:value     preferred-date-format
       :on-change (fn [e]
                    (let [format (util/evalue e)]
                      (when-not (string/blank? format)
                        (config-handler/set-config! :journal/page-title-format format)
                        (notification/show!
                          [:div "You must re-index your graph for this change to take effect"]
                          :warning false)
                        (state/close-modal!)
                        (route-handler/redirect! {:to :repos}))))}
      (for [format (sort (date/journal-title-formatters))]
        [:option {:key format} format])]]]])

(defn workflow-row [t preferred-workflow]
  [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
   [:label.block.text-sm.font-medium.leading-5.opacity-70
    {:for "preferred_workflow"}
    (t :settings-page/preferred-workflow)]
   [:div.mt-1.sm:mt-0.sm:col-span-2
    [:div.max-w-lg.rounded-md
     [:select.form-select.is-small
      {:value     (name preferred-workflow)
       :on-change (fn [e]
                    (-> (util/evalue e)
                        string/lower-case
                        keyword
                        (#(if (= % :now) :now :todo))
                        user-handler/set-preferred-workflow!))}
      (for [workflow [:now :todo]]
        [:option {:key (name workflow) :value (name workflow)}
         (if (= workflow :now) "NOW/LATER" "TODO/DOING")])]]]])

(defn outdenting-row [t logical-outdenting?]
  (toggle "preferred_outdenting"
          [(t :settings-page/preferred-outdenting)
           (ui/tippy {:html        (outdenting-hint)
                      :class       "tippy-hover ml-2"
                      :interactive true
                      :disabled    false}
                     (svg/info))]
          logical-outdenting?
          config-handler/toggle-logical-outdenting!))

(defn showing-full-blocks [t show-full-blocks?]
  (toggle "show_full_blocks"
          (t :settings-page/show-full-blocks)
          show-full-blocks?
          config-handler/toggle-show-full-blocks!))

(defn preferred-pasting-file [t preferred-pasting-file?]
  (toggle "preferred_pasting_file"
          (t :settings-page/preferred-pasting-file)
          preferred-pasting-file?
          config-handler/toggle-preferred-pasting-file!))

(defn auto-expand-row [t auto-expand-block-refs?]
  (toggle "auto_expand_block_refs"
          [(t :settings-page/auto-expand-block-refs)
           (ui/tippy {:html        (auto-expand-hint)
                      :class       "tippy-hover ml-2"
                      :interactive true
                      :disabled    false}
                     (svg/info))]
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

(defn timetracking-row [t enable-timetracking?]
  (toggle "enable_timetracking"
          (t :settings-page/enable-timetracking)
          enable-timetracking?
          #(let [value (not enable-timetracking?)]
             (config-handler/set-config! :feature/enable-timetracking? value))))

(defn update-home-page
  [event]
  (let [value (util/evalue event)]
    (cond
      (string/blank? value)
      (let [home (get (state/get-config) :default-home {})
            new-home (dissoc home :page)]
        (config-handler/set-config! :default-home new-home)
        (notification/show! "Home default page updated successfully!" :success))

      (db/page-exists? value)
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

;; (defn enable-block-timestamps-row [t enable-block-timestamps?]
;;   (toggle "block timestamps"
;;           (t :settings-page/enable-block-time)
;;           enable-block-timestamps?
;;           (fn []
;;             (let [value (not enable-block-timestamps?)]
;;               (config-handler/set-config! :feature/enable-block-timestamps? value)))))

(rum/defc keyboard-shortcuts-row [t]
  (row-with-button-action
    {:left-label   (t :settings-page/customize-shortcuts)
     :button-label (t :settings-page/shortcut-settings)
     :on-click      (fn []
                      (state/close-settings!)
                      (route-handler/redirect! {:to :shortcut-setting}))
     :-for         "customize_shortcuts"}))

(defn zotero-settings-row []
  [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
   [:label.block.text-sm.font-medium.leading-5.opacity-70
    {:for "zotero_settings"}
    "Zotero"]
   [:div.mt-1.sm:mt-0.sm:col-span-2
    [:div
     (ui/button
       (t :settings)
       :class "text-sm p-1"
       :style {:margin-top "0px"}
       :on-click
       (fn []
         (state/close-settings!)
         (route-handler/redirect! {:to :zotero-setting})))]]])

(defn auto-push-row [_t current-repo enable-git-auto-push?]
  (when (and current-repo (string/starts-with? current-repo "https://"))
    (toggle "enable_git_auto_push"
            "Enable Git auto push"
            enable-git-auto-push?
            (fn []
              (let [value (not enable-git-auto-push?)]
                (config-handler/set-config! :git-auto-push value))))))

(defn usage-diagnostics-row [t instrument-disabled?]
  (toggle "usage-diagnostics"
          (t :settings-page/disable-sentry)
          (not instrument-disabled?)
          (fn [] (instrument/disable-instrument
                   (not instrument-disabled?)))
          [:span.text-sm.opacity-50 (t :settings-page/disable-sentry-desc)]))

(defn clear-cache-row [t]
  (row-with-button-action {:left-label   (t :settings-page/clear-cache)
                           :button-label (t :settings-page/clear)
                           :on-click     handler/clear-cache!
                           :-for         "clear_cache"}))

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
    [:div.flex.items-center
     (ui/toggle on? on-toggle true)
     (when (not= (boolean value) on?)
       [:div.relative.opacity-70
        [:span.absolute.whitespace-nowrap
         {:style {:top -18 :left 10}}
         (ui/button (t :plugin/restart)
                    :on-click #(js/logseq.api.relaunch)
           :small? true :intent "logseq")]])]))

(rum/defc http-server-enabled-switcher
  [t]
  (let [[value _] (rum/use-state (boolean (storage/get ::storage-spec/http-server-enabled)))
        [on? set-on?] (rum/use-state value)
        on-toggle #(let [v (not on?)]
                     (set-on? v)
                     (storage/set ::storage-spec/http-server-enabled v))]
    [:div.flex.items-center
     (ui/toggle on? on-toggle true)
     (when (not= (boolean value) on?)
       [:div.relative.opacity-70
        [:span.absolute.whitespace-nowrap
         {:style {:top -18 :left 10}}
         (ui/button (t :plugin/restart)
                    :on-click #(js/logseq.api.relaunch)
                    :small? true :intent "logseq")]])]))

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
              [:strong.pr-1
               (case type
                 "system" "System Default"
                 "direct" "Direct"
                 (and protocol host port (str protocol "://" host ":" port)))]
              (ui/icon "edit")]
             :small? true
             :on-click #(state/set-sub-modal!
                         (fn [_] (plugins/user-proxy-settings-panel agent-opts))
                         {:id :https-proxy-panel :center? true})))

(defn plugin-system-switcher-row []
  (row-with-button-action
   {:left-label (t :settings-page/plugin-system)
    :action (plugin-enabled-switcher t)}))

(defn http-server-switcher-row []
  (row-with-button-action
   {:left-label "HTTP APIs server"
    :action (http-server-enabled-switcher t)}))

(defn flashcards-switcher-row [enable-flashcards?]
  (row-with-button-action
   {:left-label (t :settings-page/enable-flashcards)
    :action (flashcards-enabled-switcher enable-flashcards?)}))

(defn https-user-agent-row [agent-opts]
  (row-with-button-action
   {:left-label (t :settings-page/network-proxy)
    :action (user-proxy-settings agent-opts)}))

(defn filename-format-row []
  (row-with-button-action
   {:left-label (t :settings-page/filename-format)
    :button-label (t :settings-page/edit-setting)
    :on-click #(state/set-sub-modal!
                (fn [_] (conversion-component/files-breaking-changed))
                {:id :filename-format-panel :center? true})}))

(rum/defcs settings-general < rum/reactive
  [_state current-repo]
  (let [preferred-language (state/sub [:preferred-language])
        theme (state/sub :ui/theme)
        dark? (= "dark" theme)
        system-theme? (state/sub :ui/system-theme?)
        switch-theme (if dark? "light" "dark")]
    [:div.panel-wrap.is-general
     (version-row t version)
     (language-row t preferred-language)
     (theme-modes-row t switch-theme system-theme? dark?)
     (when (config/global-config-enabled?) (edit-global-config-edn))
     (when current-repo (edit-config-edn))
     (when current-repo (edit-custom-css))
     (when current-repo (edit-export-css))
     (keyboard-shortcuts-row t)]))

(rum/defcs settings-editor < rum/reactive
  [_state current-repo]
  (let [preferred-format (state/get-preferred-format)
        preferred-date-format (state/get-date-formatter)
        preferred-workflow (state/get-preferred-workflow)
        enable-timetracking? (state/enable-timetracking?)
        enable-all-pages-public? (state/all-pages-public?)
        logical-outdenting? (state/logical-outdenting?)
        show-full-blocks? (state/show-full-blocks?)
        preferred-pasting-file? (state/preferred-pasting-file?)
        auto-expand-block-refs? (state/auto-expand-block-refs?)
        enable-tooltip? (state/enable-tooltip?)
        enable-shortcut-tooltip? (state/sub :ui/shortcut-tooltip?)
        show-brackets? (state/show-brackets?)
        enable-git-auto-push? (state/enable-git-auto-push? current-repo)]

    [:div.panel-wrap.is-editor
     (file-format-row t preferred-format)
     (date-format-row t preferred-date-format)
     (workflow-row t preferred-workflow)
     ;; (enable-block-timestamps-row t enable-block-timestamps?)
     (show-brackets-row t show-brackets?)

     (when (util/electron?) (switch-spell-check-row t))
     (outdenting-row t logical-outdenting?)
     (showing-full-blocks t show-full-blocks?)
     (preferred-pasting-file t preferred-pasting-file?)
     (auto-expand-row t auto-expand-block-refs?)
     (when-not (or (util/mobile?) (mobile-util/native-platform?))
       (shortcut-tooltip-row t enable-shortcut-tooltip?))
     (when-not (or (util/mobile?) (mobile-util/native-platform?))
       (tooltip-row t enable-tooltip?))
     (timetracking-row t enable-timetracking?)
     (enable-all-pages-public-row t enable-all-pages-public?)
     (auto-push-row t current-repo enable-git-auto-push?)]))

(rum/defc settings-git
  []
  [:div.panel-wrap
   [:div.text-sm.my-4
    [:span.text-sm.opacity-50.my-4
     "You can view a page's edit history by clicking the three horizontal dots "
     "in the top-right corner and selecting \"View page history\". "
     "Logseq uses "]
    [:a {:href "https://git-scm.com/" :target "_blank"}
     "Git"]
    [:span.text-sm.opacity-50.my-4
     " for version control."]]
   [:br]
   (switch-git-auto-commit-row t)
   (git-auto-commit-seconds t)

   (ui/admonition
     :warning
     [:p (t :settings-page/git-confirm)])])

(rum/defc settings-advanced < rum/reactive
  [current-repo]
  (let [instrument-disabled? (state/sub :instrument/disabled?)
        developer-mode? (state/sub [:ui/developer-mode?])
        https-agent-opts (state/sub [:electron/user-cfgs :settings/agent])]
    [:div.panel-wrap.is-advanced
     (when (and (or util/mac? util/win32?) (util/electron?)) (app-auto-update-row t))
     (usage-diagnostics-row t instrument-disabled?)
     (when-not (mobile-util/native-platform?) (developer-mode-row t developer-mode?))
     (when (util/electron?) (https-user-agent-row https-agent-opts))
     (when (and (util/electron?) (not (config/demo-graph? current-repo))) (filename-format-row))
     (clear-cache-row t)

     (ui/admonition
       :warning
       [:p (t :settings-page/clear-cache-warning)])]))

(rum/defc sync-enabled-switcher
  [enabled?]
  (ui/toggle enabled?
             (fn []
               (file-sync-handler/set-sync-enabled! (not enabled?)))
             true))

(defn sync-switcher-row [enabled?]
  (row-with-button-action
   {:left-label (t :settings-page/sync)
    :action (sync-enabled-switcher enabled?)}))

(rum/defc whiteboards-enabled-switcher
  [enabled?]
  (ui/toggle enabled?
             (fn []
               (let [value (not enabled?)]
                 (config-handler/set-config! :feature/enable-whiteboards? value)))
             true))

(defn whiteboards-switcher-row [enabled?]
  (row-with-button-action
   {:left-label (t :settings-page/enable-whiteboards)
    :action (whiteboards-enabled-switcher enabled?)}))

(rum/defc settings-features < rum/reactive
  []
  (let [current-repo (state/get-current-repo)
        enable-journals? (state/enable-journals? current-repo)
        enable-flashcards? (state/enable-flashcards? current-repo)
        enable-sync? (state/enable-sync?)
        enable-whiteboards? (state/enable-whiteboards? current-repo)
        logged-in? (user-handler/logged-in?)]
    [:div.panel-wrap.is-features.mb-8
     (journal-row enable-journals?)
     (when (not enable-journals?)
       [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
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
     (whiteboards-switcher-row enable-whiteboards?)
     (when (and (util/electron?) config/feature-plugin-system-on?)
       (plugin-system-switcher-row))
     (when (util/electron?)
       (http-server-switcher-row))
     (flashcards-switcher-row enable-flashcards?)
     (zotero-settings-row)
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
           [:p.text-sm.opacity-50 (t :settings-page/login-prompt)]])])

     (when-not web-platform?
       [:<>
        [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
         [:label.flex.font-medium.leading-5.self-start.mt-1 (ui/icon  (if logged-in? "lock-open" "lock") {:class "mr-1"}) (t :settings-page/beta-features)]]
        [:div.flex.flex-col.gap-4
         {:class (when-not user-handler/alpha-or-beta-user? "opacity-50 pointer-events-none cursor-not-allowed")}
         (sync-switcher-row enable-sync?)
         [:div.text-sm
          "Click"
          [:a.mx-1 {:href "https://blog.logseq.com/how-to-setup-and-use-logseq-sync/"
                    :target "_blank"}
           "here"]
          "for instructions on how to set up and use Sync."]]])

     ;; (when-not web-platform?
     ;;   [:<>
     ;;    [:hr]
     ;;    [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
     ;;     [:label.flex.font-medium.leading-5.self-start.mt-1 (ui/icon  (if logged-in? "lock-open" "lock") {:class "mr-1"}) (t :settings-page/alpha-features)]]
     ;;    [:div.flex.flex-col.gap-4
     ;;     {:class (when-not user-handler/alpha-user? "opacity-50 pointer-events-none cursor-not-allowed")}
     ;;     ;; features
     ;;     ]])
     ]))

(rum/defcs settings
  < (rum/local [:general :general] ::active)
    {:will-mount
     (fn [state]
       (state/load-app-user-cfgs)
       state)
     :will-unmount
     (fn [state]
       (state/close-settings!)
       state)}
    rum/reactive
  [state]
  (let [current-repo (state/sub :git/current-repo)
        ;; enable-block-timestamps? (state/enable-block-timestamps?)
        _installed-plugins (state/sub :plugin/installed-plugins)
        plugins-of-settings (and config/lsp-enabled? (seq (plugin-handler/get-enabled-plugins-if-setting-schema)))
        *active (::active state)]

    [:div#settings.cp__settings-main
     [:header
      [:h1.title (t :settings)]]

     [:div.cp__settings-inner

      [:aside.md:w-64 {:style {:min-width "10rem"}}
       [:ul.settings-menu
        (for [[label id text icon]
              [[:general "general" (t :settings-page/tab-general) (ui/icon "adjustments")]
               [:editor "editor" (t :settings-page/tab-editor) (ui/icon "writing")]

               (when (and
                      (util/electron?)
                      (not (file-sync-handler/synced-file-graph? current-repo)))
                 [:git "git" (t :settings-page/tab-version-control) (ui/icon "history")])

               ;; (when (util/electron?)
               ;;   [:assets "assets" (t :settings-page/tab-assets) (ui/icon "box")])

               [:advanced "advanced" (t :settings-page/tab-advanced) (ui/icon "bulb")]
               [:features "features" (t :settings-page/tab-features) (ui/icon "app-feature")]

               (when plugins-of-settings
                 [:plugins-setting "plugins" (t :settings-of-plugins) (ui/icon "puzzle")])]]

          (when label
            [:li.settings-menu-item
             {:key      text
              :class    (util/classnames [{:active (= label (first @*active))}])
              :on-click #(reset! *active [label (first @*active)])}

             [:a.flex.items-center.settings-menu-link
             {:data-id id}
              icon
              [:strong text]]]))]]

      [:article

       (case (first @*active)

         :plugins-setting
         (let [label (second @*active)]
           (state/pub-event! [:go/plugins-settings (:id (first plugins-of-settings))])
           (reset! *active [label label])
           nil)

         :general
         (settings-general current-repo)

         :editor
         (settings-editor current-repo)

         :git
         (settings-git)

         :assets
         (assets/settings-content)

         :advanced
         (settings-advanced current-repo)

         :features
         (settings-features)

         nil)]]]))
