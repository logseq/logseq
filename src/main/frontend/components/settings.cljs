(ns frontend.components.settings
  (:require [clojure.string :as string]
            [frontend.components.svg :as svg]
            [frontend.config :as config]
            [frontend.context.i18n :as i18n]
            [frontend.date :as date]
            [frontend.dicts :as dicts]
            [frontend.handler :as handler]
            [frontend.handler.config :as config-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.user :as user-handler]
            [frontend.modules.instrumentation.core :as instrument]
            [frontend.modules.shortcut.data-helper :as shortcut-helper]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [electron.ipc :as ipc]
            [promesa.core :as p]
            [frontend.util :refer [classnames] :as util]
            [frontend.version :refer [version]]
            [goog.object :as gobj]
            [reitit.frontend.easy :as rfe]
            [rum.core :as rum]))

(rum/defcs set-email < (rum/local "" ::email)
  [state]
  (let [email (get state ::email)]
    [:div.p-8.flex.items-center.justify-center
     [:div.w-full.mx-auto
      [:div
       [:div
        [:h1.title.mb-1
         "Your email address:"]
        [:div.mt-2.mb-4.relative.rounded-md.max-w-xs
         [:input#.form-input.is-small
          {:autoFocus true
           :on-change (fn [e]
                        (reset! email (util/evalue e)))}]]]]
      (ui/button
        "Submit"
        :on-click
        (fn []
          (user-handler/set-email! @email)))

      [:hr]

      [:span.pl-1.opacity-70 "Git commit requires the email address."]]]))

(rum/defcs set-cors < (rum/local "" ::cors)
  [state]
  (let [cors (get state ::cors)]
    [:div.p-8.flex.items-center.justify-center
     [:div.w-full.mx-auto
      [:div
       [:div
        [:h1.title.mb-1
         "Your cors address:"]
        [:div.mt-2.mb-4.relative.rounded-md.max-w-xs
         [:input#.form-input.is-small
          {:autoFocus true
           :on-change (fn [e]
                        (reset! cors (util/evalue e)))}]]]]
      (ui/button
        "Submit"
        :on-click
        (fn []
          (user-handler/set-cors! @cors)))

      [:hr]

      [:span.pl-1.opacity-70 "Git commit requires the cors address."]]]))

(defn toggle
  [label-for name state on-toggle & [detail-text]]
  [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
   [:label.block.text-sm.font-medium.leading-5.opacity-70
    {:for label-for}
    name]
   [:div.mt-1.sm:mt-0.sm:col-span-2
    [:div.rounded-md
     {:style {:display "flex" :gap "1rem" :align-items "center"}}
     (ui/toggle state on-toggle true)
     detail-text]]])

(rum/defcs app-updater < rum/reactive
  [state version]
  (let [update-pending? (state/sub :electron/updater-pending?)
        {:keys [type payload]} (state/sub :electron/updater)]
    [:span.cp__settings-app-updater

     [:div.ctls.flex.items-center
      (ui/button
        (if update-pending? "Checking ..." "Check for updates")
        :class "text-sm p-1 mr-3"
        :disabled update-pending?
        :on-click #(js/window.apis.checkForUpdates false))

      [:span version]]

     (when-not (or update-pending?
                   (string/blank? type))
       [:div.update-state
        (case type
          "update-not-available"
          [:p "😀 Your app is up-to-date!"]

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

(rum/defc delete-account-confirm
  [close-fn]
  (rum/with-context [[t] i18n/*tongue-context*]
    [:div
     (ui/admonition
      :important
      [:p.text-gray-700 (t :user/delete-account-notice)])
     [:div.mt-5.sm:mt-4.sm:flex.sm:flex-row-reverse
      [:span.flex.w-full.rounded-md.sm:ml-3.sm:w-auto
       [:button.inline-flex.justify-center.w-full.rounded-md.border.border-transparent.px-4.py-2.bg-indigo-600.text-base.leading-6.font-medium.text-white.shadow-sm.hover:bg-indigo-500.focus:outline-none.focus:border-indigo-700.focus:shadow-outline-indigo.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
        {:type     "button"
         :on-click user-handler/delete-account!}
        (t :user/delete-account)]]
      [:span.mt-3.flex.w-full.rounded-md.sm:mt-0.sm:w-auto
       [:button.inline-flex.justify-center.w-full.rounded-md.border.border-gray-300.px-4.py-2.bg-white.text-base.leading-6.font-medium.text-gray-700.shadow-sm.hover:text-gray-500.focus:outline-none.focus:border-blue-300.focus:shadow-outline-blue.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
        {:type     "button"
         :on-click close-fn}
        "Cancel"]]]]))

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

(defn edit-config-edn []
  (rum/with-context [[t] i18n/*tongue-context*]
    [:div.text-sm
     [:a.text-xs {:href     (rfe/href :file {:path (config/get-config-path)})
                  :on-click #(js/setTimeout (fn [] (ui-handler/toggle-settings-modal!)))}
      (t :settings-page/edit-config-edn)]]))

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
   [:div {:style {:text-align "right"}}
    (ui/keyboard-shortcut (shortcut-helper/gen-shortcut-seq :ui/toggle-brackets))]])

(rum/defcs switch-spell-check-row < rum/reactive
  [state t]
  (let [enabled? (state/sub [:electron/user-cfgs :spell-check])
        enabled? (if (nil? enabled?) true enabled?)]

    [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
     [:label.block.text-sm.font-medium.leading-5.opacity-70
      (t :settings-page/spell-checker)]
     [:div
      [:div.rounded-md.sm:max-w-xs
       (ui/toggle
        enabled?
        (fn []
          (state/set-state! [:electron/user-cfgs :spell-check] (not enabled?))
          (p/then (ipc/ipc "userAppCfgs" :spell-check (not enabled?))
                  #(when (js/confirm (t :relaunch-confirm-to-work))
                     (js/logseq.api.relaunch))))
        true)]]]))

(rum/defcs switch-git-auto-commit-row < rum/reactive
  [state t]
  (let [enabled? (state/get-git-auto-commit-enabled?)]
    [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
     [:label.block.text-sm.font-medium.leading-5.opacity-70
      "Enable Git auto commit"]
     [:div
      [:div.rounded-md.sm:max-w-xs
       (ui/toggle
        enabled?
        (fn []
          (state/set-state! [:electron/user-cfgs :git/disable-auto-commit?] enabled?)
          (ipc/ipc "userAppCfgs" :git/disable-auto-commit? enabled?))
        true)]]]))

(rum/defcs git-auto-commit-seconds < rum/reactive
  [state t]
  (let [secs (or (state/sub [:electron/user-cfgs :git/auto-commit-seconds]) 60)]
    [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
     [:label.block.text-sm.font-medium.leading-5.opacity-70
      "Git auto commit seconds"]
     [:div.mt-1.sm:mt-0.sm:col-span-2
      [:div.max-w-lg.rounded-md.sm:max-w-xs
       [:input#home-default-page.form-input.is-small.transition.duration-150.ease-in-out
        {:default-value secs
         :on-blur       (fn [event]
                          (when-let [value (-> (util/evalue event)
                                               util/safe-parse-int)]
                            (when (< 0 value (inc 600))
                              (state/set-state! [:electron/user-cfgs :git/auto-commit-seconds] value)
                              (ipc/ipc "userAppCfgs" :git/auto-commit-seconds value))))}]]]]))

(rum/defc app-auto-update-row < rum/reactive
  [t]
  (let [enabled? (state/sub [:electron/user-cfgs :auto-update])
        enabled? (if (nil? enabled?) true enabled?)]

    [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
     [:label.block.text-sm.font-medium.leading-5.opacity-70
      (t :settings-page/auto-updater)]
     [:div
      [:div.rounded-md.sm:max-w-xs
       (ui/toggle
        enabled?
        (fn []
          (state/set-state! [:electron/user-cfgs :auto-update] (not enabled?))
          (ipc/ipc "userAppCfgs" :auto-update (not enabled?)))
        true)]]]))

(rum/defcs current-graph
  [state t]

  (when-let [current-repo (state/sub :git/current-repo)]
    (let [repo-list (state/sub [:me :repos])]

      [:div.it.sm:grid.sm:grid-cols-5.sm:gap-4.sm:items-start.sm:grid-rows-1
       [:label.block.text-sm.font-medium.leading-5.opacity-70.sm:col-span-1
        {:for "input_current_graph"}
        (t :settings-page/current-graph)]
       [:div.mt-1.sm:mt-0.sm:col-span-4
        [:div.max-w-lg.rounded-md
         [:select#input_current_graph.form-select.is-small
          {:value     current-repo
           :disabled  true
           :on-change #()}
          (for [it repo-list]
            (when-let [url (and (not= (:url it) "local") (:url it))]
              [:option {:key url :value url} (util/node-path.basename url)]))]

         [:div.inline-flex.items-center.pl-5 (edit-config-edn)]]]])))

(defn language-row [t preferred-language]
  [:div.it.sm:grid.sm:grid-cols-5.sm:gap-4.sm:items-start
   [:label.block.text-sm.font-medium.leading-5.opacity-70
    {:for "preferred_language"}
    (t :language)]
   [:div.mt-1.sm:mt-0.sm:col-span-4
    [:div.max-w-lg.rounded-md
     [:select.form-select.is-small
      {:value     preferred-language
       :on-change (fn [e]
                    (let [lang-code (util/evalue e)]
                      (state/set-preferred-language! lang-code)
                      (ui-handler/re-render-root!)))}
      (for [language dicts/languages]
        (let [lang-code (name (:value language))
              lang-label (:label language)]
          [:option {:key lang-code :value lang-code} lang-label]))]]]])

(defn theme-modes-row [t switch-theme system-theme? dark?]
  [:div.it.sm:grid.sm:grid-cols-5.sm:gap-4
   [:label.block.text-sm.font-medium.leading-5.opacity-70
    {:for "toggle_theme"}
    (t :right-side-bar/switch-theme (string/capitalize switch-theme))]
   [:div.flex.flex-row.mt-1.sm:mt-0.sm:col-span-4
    [:div.rounded-md.sm:max-w-xs

     [:ul.theme-modes-options
      [:li {:on-click (partial state/use-theme-mode! "light")
            :class    (classnames [{:active (and (not system-theme?) (not dark?))}])} [:i.mode-light] [:strong "light"]]
      [:li {:on-click (partial state/use-theme-mode! "dark")
            :class    (classnames [{:active (and (not system-theme?) dark?)}])} [:i.mode-dark] [:strong "dark"]]
      [:li {:on-click (partial state/use-theme-mode! "system")
            :class    (classnames [{:active system-theme?}])} [:i.mode-system] [:strong "system"]]]]

    [:div.pl-16
     (ui/keyboard-shortcut (shortcut-helper/gen-shortcut-seq :ui/toggle-theme))]]])

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
    (t :settings-page/custom-date-format)]
   [:div.mt-1.sm:mt-0.sm:col-span-2
    [:div.max-w-lg.rounded-md
     [:select.form-select.is-small
      {:value     preferred-date-format
       :on-change (fn [e]
                    (let [format (util/evalue e)]
                      (when-not (string/blank? format)
                        (config-handler/set-config! :journal/page-title-format format)
                        (notification/show!
                         [:div "You need to re-index your graph to make the change works"]
                         :success)
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

(defn tooltip-row [t enable-tooltip?]
  (toggle "enable_tooltip"
          (t :settings-page/enable-tooltip)
          enable-tooltip?
          (fn []
            (config-handler/toggle-ui-enable-tooltip!))))

(defn timetracking-row [t enable-timetracking?]
  (toggle "enable_timetracking"
          (t :settings-page/enable-timetracking)
          enable-timetracking?
          (fn []
            (let [value (not enable-timetracking?)]
              (config-handler/set-config! :feature/enable-timetracking? value)))))

(defn update-home-page
  [event]
  (let [value (util/evalue event)]
    (cond
      (string/blank? value)
      (let [home (get (state/get-config) :default-home {})
            new-home (dissoc home :page)]
        (config-handler/set-config! :default-home new-home)
        (notification/show! "Home default page updated successfully!" :success))

      (page-handler/page-exists? (string/lower-case value))
      (let [home (get (state/get-config) :default-home {})
            new-home (assoc home :page value)]
        (config-handler/set-config! :default-home new-home)
        (notification/show! "Home default page updated successfully!" :success))

      :else
      (notification/show! (str "The page \"" value "\" doesn't exist yet. Please create that page first, and then try again.") :warning))))

(defn journal-row [t enable-journals?]
  [(toggle "enable_journals"
           (t :settings-page/enable-journals)
           enable-journals?
           (fn []
             (let [value (not enable-journals?)]
               (config-handler/set-config! :feature/enable-journals? value))))

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
                             (update-home-page e)))}]]]])])

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

(defn encryption-row [t enable-encryption?]
  (toggle "enable_encryption"
          (str (t :settings-page/enable-encryption) "\n(experimental!)")
          enable-encryption?
          (fn []
            (let [value (not enable-encryption?)]
              (config-handler/set-config! :feature/enable-encryption? value)))))

(rum/defc keyboard-shortcuts-row
  [t]
  [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
   [:label.block.text-sm.font-medium.leading-5.opacity-70
    {:for "customize_shortcuts"}
    (t :settings-page/customize-shortcuts)]
   (let [h (fn []
             (state/close-settings!)
             (route-handler/redirect! {:to :shortcut-setting}))]
     [:div.mt-1.sm:mt-0.sm:col-span-2
      [:div
       (ui/button
         (t :settings-page/shortcut-settings)
         :class "text-sm p-1"
         :style {:margin-top "0px"}
         :on-click h)]])])

(defn zotero-settings-row [t]
  [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
   [:label.block.text-sm.font-medium.leading-5.opacity-70
    {:for "zotero_settings"}
    "Zotero settings"]
   [:div.mt-1.sm:mt-0.sm:col-span-2
    [:div
     (ui/button
       "Zotero settings"
       :class "text-sm p-1"
       :style {:margin-top "0px"}
       :on-click
       (fn []
         (state/close-settings!)
         (route-handler/redirect! {:to :zotero-setting})))]]])

(defn auto-push-row [t current-repo enable-git-auto-push?]
  (when (string/starts-with? current-repo "https://")
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
          [:span.text-sm.opacity-50 "Logseq will never collect your local graph database or sell your data."]))

(defn clear-cache-row [t]
  [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-center
   [:label.block.text-sm.font-medium.leading-5.opacity-70
    {:for "clear_cache"}
    (t :settings-page/clear-cache)]
   [:div.mt-1.sm:mt-0.sm:col-span-2
    [:div.max-w-lg.rounded-md.sm:max-w-xs
     (ui/button
       (t :settings-page/clear)
       :class "text-sm p-1"
       :on-click handler/clear-cache!)]]])

(defn version-row [t version]
  [:div.it.app-updater.sm:grid.sm:grid-cols-5.sm:gap-4.sm:items-center
   [:label.block.text-sm.font-medium.leading-5.opacity-70
    (t :settings-page/current-version)]
   [:div.wrap.sm:mt-0.sm:col-span-4
    (if (util/electron?)
      (app-updater version)
      [:span.ver version])]])

(defn developer-mode-row [t developer-mode?]
  (toggle "developer_mode"
          (t :settings-page/developer-mode)
          developer-mode?
          (fn []
            (let [mode (not developer-mode?)]
              (state/set-developer-mode! mode)
              (and mode (util/electron?)
                   (when (js/confirm (t :developer-mode-alert))
                     (js/logseq.api.relaunch)))))
          [:div.text-sm.opacity-50 (t :settings-page/developer-mode-desc)]))

(rum/defcs settings
  < (rum/local :general ::active)
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
  (let [preferred-format (state/get-preferred-format)
        preferred-date-format (state/get-date-formatter)
        preferred-workflow (state/get-preferred-workflow)
        preferred-language (state/sub [:preferred-language])
        enable-timetracking? (state/enable-timetracking?)
        current-repo (state/get-current-repo)
        enable-journals? (state/enable-journals? current-repo)
        enable-encryption? (state/enable-encryption? current-repo)
        enable-all-pages-public? (state/all-pages-public?)
        instrument-disabled? (state/sub :instrument/disabled?)
        logical-outdenting? (state/logical-outdenting?)
        enable-tooltip? (state/enable-tooltip?)
        enable-git-auto-push? (state/enable-git-auto-push? current-repo)
        ;; enable-block-timestamps? (state/enable-block-timestamps?)
        show-brackets? (state/show-brackets?)
        github-token (state/sub [:me :access-token])
        cors-proxy (state/sub [:me :cors_proxy])
        logged? (state/logged?)
        developer-mode? (state/sub [:ui/developer-mode?])
        theme (state/sub :ui/theme)
        dark? (= "dark" theme)
        system-theme? (state/sub :ui/system-theme?)
        switch-theme (if dark? "white" "dark")
        *active (::active state)]

    (rum/with-context
      [[t] i18n/*tongue-context*]

      [:div#settings.cp__settings-main
       [:header
        [:h1.title (t :settings)]]

       [:div.cp__settings-inner.md:flex

        [:aside.md:w-64
         [:ul
          (for [[label text icon] [[:general (t :settings-page/tab-general) (svg/adjustments 16)]
                                   [:editor (t :settings-page/tab-editor) (svg/icon-editor 16)]
                                   [:shortcuts (t :settings-page/tab-shortcuts) (svg/icon-cmd 18)]
                                   [:git (t :settings-page/tab-version-control) svg/git]
                                   [:advanced (t :settings-page/tab-advanced) (svg/icon-cli 16)]]]

            [:li
             {:class    (util/classnames [{:active (= label @*active)}])
              :on-click #(reset! *active label)}

             [:a.flex.items-center
              [[:i.flex.items-center icon] [:strong text]]]])]]

        [:article

         (case @*active

           :general
           [:div.panel-wrap.is-general
            (version-row t version)
            (current-graph t)
            (language-row t preferred-language)
            (theme-modes-row t switch-theme system-theme? dark?)]

           :editor
           [:div.panel-wrap.is-editor
            (file-format-row t preferred-format)
            (date-format-row t preferred-date-format)
            (workflow-row t preferred-workflow)
            ;; (enable-block-timestamps-row t enable-block-timestamps?)
            (show-brackets-row t show-brackets?)
            (when (util/electron?) (switch-spell-check-row t))
            (outdenting-row t logical-outdenting?)
            (tooltip-row t enable-tooltip?)
            (timetracking-row t enable-timetracking?)
            (journal-row t enable-journals?)
            (enable-all-pages-public-row t enable-all-pages-public?)
            (encryption-row t enable-encryption?)
            (zotero-settings-row t)
            (auto-push-row t current-repo enable-git-auto-push?)]

           :shortcuts
           [:div.panel-wrap
            (keyboard-shortcuts-row t)]

           :git
           [:div.panel-wrap
            [:div.text-sm.my-4
             [:a {:href "https://git-scm.com/"
                  :target "_blank"} "Git"]
             " is used for pages version control, you can click the vertical three dots menu to check the page's history."]
            (switch-git-auto-commit-row t)
            (git-auto-commit-seconds t)

            (ui/admonition
             :warning
             [:p "You need to restart the app after updating the settings."])]

           :advanced
           [:div.panel-wrap.is-advanced
            (when (and util/mac? (util/electron?)) (app-auto-update-row t))
            (usage-diagnostics-row t instrument-disabled?)
            (developer-mode-row t developer-mode?)
            (clear-cache-row t)

            (when logged?
              [:div
               [:div.mt-6.sm:mt-5.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-center.sm:pt-5
                [:label.block.text-sm.font-medium.leading-5.sm:mt-px..opacity-70
                 {:for "cors"}
                 (t :settings-page/custom-cors-proxy-server)]
                [:div.mt-1.sm:mt-0.sm:col-span-2
                 [:div.max-w-lg.rounded-md.sm:max-w-xs
                  [:input#pat.form-input.is-small.transition.duration-150.ease-in-out
                   {:default-value cors-proxy
                    :on-blur       (fn [event]
                                     (when-let [server (util/evalue event)]
                                       (user-handler/set-cors! server)
                                       (notification/show! "Custom CORS proxy updated successfully!" :success)))
                    :on-key-press  (fn [event]
                                     (let [k (gobj/get event "key")]
                                       (when (= "Enter" k)
                                         (when-let [server (util/evalue event)]
                                           (user-handler/set-cors! server)
                                           (notification/show! "Custom CORS proxy updated successfully!" :success)))))}]]]]
               (ui/admonition
                :important
                [:p (t :settings-page/dont-use-other-peoples-proxy-servers)
                 [:a {:href   "https://github.com/isomorphic-git/cors-proxy"
                      :target "_blank"}
                  "https://github.com/isomorphic-git/cors-proxy"]])])

            (when logged?
              [:div
               [:hr]
               [:div.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-center.sm:pt-5
                [:label.block.text-sm.font-medium.leading-5.opacity-70.text-red-600.dark:text-red-400
                 {:for "delete account"}
                 (t :user/delete-account)]
                [:div.mt-1.sm:mt-0.sm:col-span-2
                 [:div.max-w-lg.rounded-md.sm:max-w-xs
                  (ui/button (t :user/delete-your-account)
                    :on-click (fn []
                                (ui-handler/toggle-settings-modal!)
                                (js/setTimeout #(state/set-modal! delete-account-confirm))))]]]])]

           nil)]]])))
