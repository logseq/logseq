(ns frontend.components.settings
  (:require [rum.core :as rum]
            [frontend.ui :as ui]
            [frontend.components.svg :as svg]
            [frontend.handler.notification :as notification]
            [frontend.handler.user :as user-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.config :as config-handler]
            [frontend.handler.page :as page-handler]
            [frontend.state :as state]
            [frontend.version :refer [version]]
            [frontend.util :as util]
            [frontend.config :as config]
            [frontend.dicts :as dicts]
            [clojure.string :as string]
            [goog.object :as gobj]
            [frontend.context.i18n :as i18n]
            [reitit.frontend.easy :as rfe]
            [frontend.date :as date]))

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
  [label-for name state on-toggle]
  [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
   [:label.block.text-sm.font-medium.leading-5.opacity-70
    {:for label-for}
    name]
   [:div.mt-1.sm:mt-0.sm:col-span-2
    [:div.rounded-md.sm:max-w-xs
     (ui/toggle state on-toggle true)]]])

(rum/defcs app-updater < rum/reactive
  [state]
  (let [update-pending? (state/sub :electron/updater-pending?)
        {:keys [type payload]} (state/sub :electron/updater)]
    [:div.cp__settings-app-updater
     (ui/button
      (if update-pending? "Checking ..." "Check for updates")

      :intent "logseq"
      :class "check-update"
      :disabled update-pending?
      :on-click #(js/window.apis.checkForUpdates false))
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
  [:div
   [:p "See more details at " [:a {:href "https://discuss.logseq.com/t/whats-your-preferred-outdent-behavior-the-direct-one-or-the-logical-one/978"} "here"] "."]
   [:img {:src "https://discuss.logseq.com/uploads/default/original/1X/e8ea82f63a5e01f6d21b5da827927f538f3277b9.gif"}]])

(rum/defcs settings < rum/reactive
  []
  (let [preferred-format (state/get-preferred-format)
        custom-date-format (state/get-date-formatter)
        preferred-workflow (state/get-preferred-workflow)
        preferred-language (state/sub [:preferred-language])
        enable-timetracking? (state/enable-timetracking?)
        current-repo (state/get-current-repo)
        enable-journals? (state/enable-journals? current-repo)
        enable-encryption? (state/enable-encryption? current-repo)
        sentry-disabled? (state/sub :sentry/disabled?)
        logical-outdenting? (state/logical-outdenting?)
        enable-git-auto-push? (state/enable-git-auto-push? current-repo)
        enable-block-time? (state/enable-block-time?)
        show-brackets? (state/show-brackets?)
        github-token (state/sub [:me :access-token])
        cors-proxy (state/sub [:me :cors_proxy])
        logged? (state/logged?)
        developer-mode? (state/sub [:ui/developer-mode?])
        theme (state/sub :ui/theme)
        dark? (= "dark" theme)
        switch-theme (if dark? "white" "dark")]
    (rum/with-context [[t] i18n/*tongue-context*]
      [:div#settings.cp__settings-main
       [:h1.title (t :settings)]

       [:div.panel-wrap
        [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
         [:label.block.text-sm.font-medium.leading-5.opacity-70
          {:for "toggle_theme"}
          (t :right-side-bar/switch-theme (string/capitalize switch-theme))]
         [:div.flex.flex-row.mt-1.sm:mt-0.sm:col-span-2
          [:div.rounded-md.sm:max-w-xs
           (ui/toggle dark?
                      (fn []
                        (state/set-theme! switch-theme))
                      true)]
          [:span.ml-4.opacity-50.text-sm "t t"]]]

        [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
         [:label.block.text-sm.font-medium.leading-5.opacity-70
          {:for "show_brackets"}
          (t :settings-page/show-brackets)]
         [:div.flex.flex-row.mt-1.sm:mt-0.sm:col-span-2
          [:div.rounded-md.sm:max-w-xs
           (ui/toggle show-brackets?
                      config-handler/toggle-ui-show-brackets!
                      true)]
          [:span.ml-4.opacity-50.text-sm "Ctrl-c Ctrl-b"]]]

        [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
         [:label.block.text-sm.font-medium.leading-5.opacity-70
          {:for "preferred_language"}
          (t :language)]
         [:div.mt-1.sm:mt-0.sm:col-span-2
          [:div.max-w-lg.rounded-md
           [:select.form-select.is-small
            {:on-change (fn [e]
                          (let [lang (util/evalue e)
                                lang-val (filter (fn [el] (if (= (:label el) lang) true nil)) dicts/languages)
                                lang-val (name (:value (first lang-val)))]
                            (state/set-preferred-language! lang-val)
                            (ui-handler/re-render-root!)))}
            (for [language dicts/languages]
              [:option (cond->
                        {:key (:value language)}
                         (= (name (:value language)) preferred-language)
                         (assoc :selected "selected"))
               (:label language)])]]]]

                        ;; config.edn
        (when current-repo
          [:div.mt-5.text-sm
           [:a {:href     (rfe/href :file {:path (config/get-config-path)})
                :on-click #(js/setTimeout (fn [] (ui-handler/toggle-settings-modal!)))}
            (t :settings-page/edit-config-edn)]])]

       [:hr]

       [:div.panel-wrap
        [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
         [:label.block.text-sm.font-medium.leading-5.opacity-70
          {:for "preferred_format"}
          (t :settings-page/preferred-file-format)]
         [:div.mt-1.sm:mt-0.sm:col-span-2
          [:div.max-w-lg.rounded-md
           [:select.form-select.is-small
            {:on-change (fn [e]
                          (let [format (-> (util/evalue e)
                                           (string/lower-case)
                                           keyword)]
                            (user-handler/set-preferred-format! format)))}
            (for [format [:org :markdown]]
              [:option (cond->
                        {:key (name format)}
                         (= format preferred-format)
                         (assoc :selected "selected"))
               (string/capitalize (name format))])]]]]

        [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
         [:label.block.text-sm.font-medium.leading-5.opacity-70
          {:for "custom_date_format"}
          (t :settings-page/custom-date-format)]
         [:div.mt-1.sm:mt-0.sm:col-span-2
          [:div.max-w-lg.rounded-md
           [:select.form-select.is-small
            {:on-change (fn [e]
                          (let [format (util/evalue e)]
                            (when-not (string/blank? format)
                              (config-handler/set-config! :date-formatter format))))}
            (for [format (sort (date/journal-title-formatters))]
              [:option (cond->
                           {:key format}
                         (= format custom-date-format)
                         (assoc :selected "selected"))
               format])]]]]

        [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
         [:label.block.text-sm.font-medium.leading-5.opacity-70
          {:for "preferred_workflow"}
          (t :settings-page/preferred-workflow)]
         [:div.mt-1.sm:mt-0.sm:col-span-2
          [:div.max-w-lg.rounded-md
           [:select.form-select.is-small
            {:on-change (fn [e]
                          (-> (util/evalue e)
                              string/lower-case
                              keyword
                              (#(if (= % :now/later) :now :todo))
                              user-handler/set-preferred-workflow!))}
            (for [workflow [:now :todo]]
              [:option (cond->
                        {:key (name workflow)}
                         (= workflow preferred-workflow)
                         (assoc :selected "selected"))
               (if (= workflow :now)
                 "NOW/LATER"
                 "TODO/DOING")])]]]]

        (toggle "preferred_outdenting"
                (ui/tippy {:html (outdenting-hint)
                           :interactive true
                           :theme "customized"}
                          (t :settings-page/preferred-outdenting))
                logical-outdenting?
                (fn []
                  (config-handler/toggle-logical-outdenting!)))

        (toggle "enable_timetracking"
                (t :settings-page/enable-timetracking)
                enable-timetracking?
                (fn []
                  (let [value (not enable-timetracking?)]
                    (config-handler/set-config! :feature/enable-timetracking? value))))

                        ;; (toggle "enable_block_time"
                        ;;         (t :settings-page/enable-block-time)
                        ;;         enable-block-time?
                        ;;         (fn []
                        ;;           (let [value (not enable-block-time?)]
                        ;;             (config-handler/set-config! :feature/enable-block-time? value))))

        (toggle "enable_journals"
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
               :on-blur       (fn [event]
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
                                    (notification/show! "Please make sure the page exists!" :warning))))}]]]])

        (toggle "enable_encryption"
                (t :settings-page/enable-encryption)
                enable-encryption?
                (fn []
                  (let [value (not enable-encryption?)]
                    (config-handler/set-config! :feature/enable-encryption? value))))

        (when (string/starts-with? current-repo "https://")
          (toggle "enable_git_auto_push"
                  "Enable Git auto push"
                  enable-git-auto-push?
                  (fn []
                    (let [value (not enable-git-auto-push?)]
                      (config-handler/set-config! :git-auto-push value)))))]

       [:hr]

       [:div.panel-wrap
        [:div.it.app-updater.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
         [:label.block.text-sm.font-medium.leading-5.opacity-70
          (t :settings-page/current-version)]
         [:div.wrap.sm:mt-0.sm:col-span-2
          [:div.ver version]
          (if (util/electron?) (app-updater))]]

        (toggle "disable_sentry"
                (t :settings-page/disable-sentry)
                sentry-disabled?
                (fn []
                  (let [value (not sentry-disabled?)]
                    (state/set-sentry-disabled! value))))

        [:div.it.sm:grid.sm:grid-cols-3.sm:gap-4.sm:items-start
         [:label.block.text-sm.font-medium.leading-5.opacity-70
          {:for "developer_mode"}
          (t :settings-page/developer-mode)]

         [:div.mt-1.sm:mt-0.sm:col-span-2
          [:div.rounded-md.sm:max-w-xs
           (ui/toggle developer-mode?
                      #(state/set-developer-mode! (not developer-mode?))
                      true)]]]
        [:div.text-sm.opacity-50
         (t :settings-page/developer-mode-desc)]

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
                                   (if (= "Enter" k)
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
                                     (js/setTimeout #(state/set-modal! delete-account-confirm))))]]]])]])))
