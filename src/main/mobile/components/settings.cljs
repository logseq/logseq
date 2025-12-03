(ns mobile.components.settings
  "Mobile settings"
  (:require [clojure.string :as string]
            [frontend.common.missionary :as c.m]
            [frontend.components.user.login :as login]
            [frontend.config :as config]
            [frontend.handler.user :as user-handler]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.version :as version]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [missionary.core :as m]
            [mobile.state :as mobile-state]
            [promesa.core :as p]
            [rum.core :as rum]))

(rum/defc user-profile
  [login?]
  (let [username (user-handler/username)
        email (user-handler/email)
        initial  (or (some-> username (subs 0 1) string/upper-case) "?")]
    [:div.pt-4
     (if-not login?
       (shui/button
        {:variant :default
         :class "text-1xl flex flex-1 w-full my-8"
         :on-click #(shui/dialog-open! login/page-impl
                                       {:close-btn? false
                                        :label "user-login"
                                        :align :top
                                        :content-props {:class "app-login-modal"}})}
        "Login")
       ;; Logged in: account cell
       [:div.mobile-setting-item
        [:div.flex.items-center.gap-3
         [:div.w-10.h-10.rounded-full.flex.items-center.justify-center.text-base.font-semibold
          initial]
         [:div.flex.flex-col.items-start
          [:span.text-base.font-semibold (or username "Account")]
          [:span.text-xs email]]]])]))

(defn theme-select
  [{:keys [value on-change]}]
  [:select
   {:value     (name value)
    :class     "text-sm bg-transparent rounded border-none focus:outline-none"
    :on-change (fn [e]
                 (let [new-value (keyword (.. e -target -value))]
                   (on-change new-value)))}
   [:option {:value "system"} "System"]
   [:option {:value "light"}  "Light"]
   [:option {:value "dark"}   "Dark"]])

(rum/defc log
  []
  (let [[error-only? set-error-only!]       (hooks/use-state false)
        [reversed? set-reversed!]           (hooks/use-state false)
        [show-worker-log? set-show-worker-log!] (hooks/use-state false)
        [worker-records set-worker-records!] (hooks/use-state [])]
    (hooks/use-effect!
     #(c.m/run-task*
       (m/sp
         (set-worker-records! (c.m/<? (state/<invoke-db-worker :thread-api/mobile-logs)))))
     [])
    [:div.flex.flex-col.gap-1.p-2.ls-debug-log
     [:div.flex.flex-row.justify-between
      [:div.text-lg.font-medium.mb-2 "Full log: "]

      (shui/button
       {:variant :ghost
        :size :sm
        :on-click (fn []
                    (util/copy-to-clipboard! (str (string/join "\n\n" @mobile-state/*log)
                                                  "\n\n================================================================\n\n"
                                                  (string/join "\n\n" worker-records))))}
       "Copy")]

     [:div.flex.flex-row.gap-2
      (shui/button
       {:size :sm
        :on-click (fn [] (set-error-only! (not error-only?)))}
       (if error-only? "All" "Errors only"))

      (shui/button
       {:size :sm
        :on-click (fn [] (set-reversed! (not reversed?)))}
       (if reversed? "New record first" "Old record first"))

      (shui/button
       {:size :sm
        :on-click (fn [] (set-show-worker-log! (not show-worker-log?)))}
       (if show-worker-log? "UI logs" "worker logs"))]

     (let [records (cond->> (if show-worker-log? worker-records @mobile-state/*log)
                     error-only?
                     (filter (fn [record] (contains? #{:error :severe} (:level record))))
                     reversed?
                     reverse)]
       [:ul
        (for [record records]
          [:li (str (:level record) " " (:message record))])])]))

(rum/defc page < rum/reactive
  []
  (let [login? (and (state/sub :auth/id-token)
                    (user-handler/logged-in?))]
    [:div.app-index-settings.min-h-full.py-4.space-y-4
     (user-profile login?)
     [:div.space-y-4
      [:div.mobile-setting-item
       [:span.text-base "Theme"]
       [:div.flex.items-center
        (theme-select {:value (state/sub :ui/theme)
                       :on-change state/use-theme-mode!})]]

      [:div.mobile-setting-item
       [:span.text-base "Version"]
       [:span.text-sm version/version]]

      (let [revision (string/replace config/revision "-dirty" "")]
        [:div.mobile-setting-item
         {:on-click (fn []
                      (js/window.open (str "https://github.com/logseq/logseq/commit/" revision)))}
         [:span.text-base "Revision"]
         [:span.text-sm revision]])

      [:div.mobile-setting-item
       {:on-click (fn []
                    (js/window.open "https://github.com/logseq/db-test/issues"))}
       [:span.text-base "Report bug"]]

      [:div.mobile-setting-item
       {:on-click (fn []
                    (shui/popup-show! nil (fn [] (log)) {}))}
       [:span.text-base "Check log"]]

      (when login?
        [:div.mobile-setting-item
         {:on-click (fn []
                      (p/do!
                       (user-handler/logout)
                       (shui/popup-hide!)))}
         [:span.text-base "Logout"]])

      [:div.flex.flex-row.flex-row.gap-4
       [:a {:href "https://discord.com/invite/KpN4eHY"
            :target "_blank"}
        [:div.flex.items-center
         (ui/icon "brand-discord")
         [:span.ml-1 "Discord community"]]]
       [:a {:href "https://discuss.logseq.com"
            :target "_blank"}
        [:div.flex.items-center
         (ui/icon "message")
         [:span.ml-1 "Forum"]]]
       [:a {:href "https://github.com/logseq/logseq"
            :target "_blank"}
        [:div.flex.items-center
         (ui/icon "brand-github")
         [:span.ml-1 "GitHub"]]]]]]))
