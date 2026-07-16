(ns mobile.components.settings
  "Mobile settings"
  (:require [clojure.string :as string]
            [frontend.common.missionary :as c.m]
            [frontend.components.dnd :as dnd]
            [frontend.components.email :as email-component]
            [frontend.components.user.login :as login]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.dicts :as dicts]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.user :as user-handler]
            [frontend.state :as state]
            [frontend.storage :as storage]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.version :as version]
            [logseq.common.version :as build-version]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [missionary.core :as m]
            [mobile.bottom-tabs :as bottom-tabs]
            [mobile.state :as mobile-state]
            [mobile.tabs :as mobile-tabs]
            [promesa.core :as p]
            [io.factorhouse.hsx.core :as hsx]))

(hsx/defc user-profile
  [login?]
  (let [username (user-handler/username)
        email (user-handler/email)
        initial  (or (some-> username (subs 0 1) string/upper-case) "?")]
    [:div.pt-2
     (if-not login?
       (shui/button
        {:variant :default
         :class "text-1xl flex flex-1 w-full my-8"
         :on-click #(shui/popup-show!
                     nil
                     (fn []
                       [:div.w-full.h-full
                        (login/page-impl)])
                     {:id :login})}
        (t :ui/login))
       ;; Logged in: account cell
       [:div.mobile-setting-item
        [:div.flex.items-center.gap-3
         [:div.w-10.h-10.rounded-full.flex.items-center.justify-center.text-base.font-semibold
          initial]
         [:div.flex.flex-col.items-start
          [:span.text-base.font-semibold (or username (t :mobile.settings/account))]
          (email-component/email-address {:email email
                                          :class "text-xs"
                                          :tooltip? false})]]])]))

(defn theme-select
  [{:keys [value on-change]}]
  [:select
   {:value     (name value)
    :class     "text-sm bg-transparent rounded border-none focus:outline-none"
    :on-change (fn [e]
                 (let [new-value (.. e -target -value)]
                   (on-change new-value)))}
   [:option {:value "system"} (t :settings.general/theme-system)]
   [:option {:value "light"}  (t :settings.general/theme-light)]
   [:option {:value "dark"}   (t :settings.general/theme-dark)]])

(defn language-select
  [{:keys [value on-change]}]
  [:select
   {:value     value
    :class     "text-sm bg-transparent rounded border-none focus:outline-none"
    :on-change (fn [e]
                 (let [new-value (util/evalue e)]
                   (on-change new-value)))}
   (for [language dicts/languages
         :let [lang-code (name (:value language))]]
     [:option {:key lang-code :value lang-code} (:label language)])])

(defn- set-language!
  [lang-code]
  (state/set-preferred-language! lang-code)
  (state/pub-event! [:init/commands])
  (ui-handler/re-render-root!))

(hsx/defc log
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
      [:div.text-lg.font-medium.mb-2 (str (t :mobile.log/full) ": ")]

      (shui/button
       {:variant :ghost
        :size :sm
        :on-click (fn []
                    (util/copy-to-clipboard! (str (string/join "\n\n" @mobile-state/*log)
                                                  "\n\n================================================================\n\n"
                                                  (string/join "\n\n" worker-records))))}
       (t :ui/copy))]

     [:div.flex.flex-row.gap-2
      (shui/button
       {:size :sm
        :on-click (fn [] (set-error-only! (not error-only?)))}
       (if error-only?
         (t :mobile.log/all)
         (t :mobile.log/errors-only)))

      (shui/button
       {:size :sm
        :on-click (fn [] (set-reversed! (not reversed?)))}
       (if reversed?
         (t :mobile.log/new-first)
         (t :mobile.log/old-first)))

      (shui/button
       {:size :sm
        :on-click (fn [] (set-show-worker-log! (not show-worker-log?)))}
       (if show-worker-log?
         (t :mobile.log/ui)
         (t :mobile.log/worker)))]

     (let [records (cond->> (if show-worker-log? worker-records @mobile-state/*log)
                     error-only?
                     (filter (fn [record] (contains? #{:error :severe} (:level record))))
                     reversed?
                     reverse)]
       [:ul
        (for [record records]
          [:li (str (:level record) " " (:message record))])])]))

(defn- persist-mobile-tabs!
  [tab-ids]
  (storage/set :ls-mobile-tabs tab-ids)
  (when-not (contains? (set tab-ids) @mobile-state/*tab)
    (mobile-state/set-tab! mobile-tabs/required-tab-id))
  (bottom-tabs/configure))

(defn- selected-mobile-tabs-label
  []
  (let [available-tabs (mobile-tabs/available-tabs
                        {:flashcards? (state/enable-flashcards?)})
        available-tabs-by-id (zipmap (map :id available-tabs) available-tabs)]
    (->> (bottom-tabs/selected-tab-ids)
         (keep #(some-> (get available-tabs-by-id %) :title-key t))
         (string/join " · "))))

(defn- mobile-tab-picker-row
  [{:keys [id title-key checked? disabled? sortable? toggle-tab! key]}]
  [:label.flex.items-center.justify-between.gap-3.py-2
   {:key (or key id)
    :class (util/classnames
            [{:opacity-50 disabled?}])}
   [:span.flex.items-center.gap-2.min-w-0
    [:span.text-muted-foreground
     {:class (if sortable? "cursor-grab" "opacity-30")}
     (shui/tabler-icon "grip-vertical" {:size 14})]
    [:span.text-base.truncate (t title-key)]]
   (shui/checkbox
    {:checked checked?
     :disabled disabled?
     :on-checked-change #(toggle-tab! id %)})])

(hsx/defc mobile-tabs-picker
  []
  (let [[custom-tab-ids set-custom-tab-ids!] (hooks/use-state
                                              (storage/get :ls-mobile-tabs))
        features {:flashcards? (state/enable-flashcards?)}
        max-tabs (mobile-tabs/max-main-tabs)
        selected-tab-ids (mobile-tabs/selected-tab-ids custom-tab-ids features max-tabs)
        selected-tab-id-set (set selected-tab-ids)
        available-tabs (mobile-tabs/available-tabs features)
        available-tabs-by-id (zipmap (map :id available-tabs) available-tabs)
        toggle-tab! (fn [id checked?]
                      (let [next-requested-ids (if checked?
                                                 (conj selected-tab-ids id)
                                                 (filterv #(not= id %) selected-tab-ids))
                            next-tab-ids (mobile-tabs/selected-tab-ids next-requested-ids
                                                                       features
                                                                       max-tabs)]
                        (set-custom-tab-ids! next-tab-ids)
                        (persist-mobile-tabs! next-tab-ids)))
        reorder-tab! (fn [tab-ids]
                       (let [next-tab-ids (mobile-tabs/selected-tab-ids tab-ids features max-tabs)]
                         (set-custom-tab-ids! next-tab-ids)
                         (persist-mobile-tabs! next-tab-ids)))
        selected-tabs (keep available-tabs-by-id selected-tab-ids)
        unselected-tabs (remove #(contains? selected-tab-id-set (:id %)) available-tabs)]
    [:div.p-4.space-y-3.min-w-64
     [:div.text-lg.font-medium (t :mobile.settings/tabs)]
     [:div.space-y-2
      (dnd/items
       (mapv
        (fn [{:keys [id title-key]}]
          (let [required? (= id mobile-tabs/required-tab-id)]
            {:id id
             :value id
             :disabled? required?
             :content (mobile-tab-picker-row
                       {:id id
                        :title-key title-key
                        :checked? true
                        :disabled? required?
                        :sortable? (not required?)
                        :toggle-tab! toggle-tab!})}))
        selected-tabs)
       {:on-drag-end (fn [tab-ids _drag]
                       (reorder-tab! tab-ids))})
      (for [{:keys [id title-key]} unselected-tabs
            :let [disabled? (>= (count selected-tab-ids) max-tabs)]]
        (mobile-tab-picker-row
         {:id id
          :key id
          :title-key title-key
          :checked? false
          :disabled? disabled?
          :sortable? false
          :toggle-tab! toggle-tab!}))]]))

(hsx/defc page
  []
  (let [login? (and (state/use-sub :auth/id-token)
                    (user-handler/logged-in?))
        theme (state/use-sub :ui/theme)
        system-theme? (state/use-sub :ui/system-theme?)
        preferred-language (state/use-sub :preferred-language)
        theme-value (if system-theme?
                      "system"
                      (or theme "system"))]
    [:div.app-index-settings.min-h-full.space-y-4
     (user-profile login?)
     [:div.space-y-4
      [:div.mobile-setting-item
       [:span.text-base (t :mobile.settings/theme)]
       [:div.flex.items-center
        (theme-select {:value theme-value
                       :on-change state/use-theme-mode!})]]

      [:div.mobile-setting-item
       [:span.text-base (t :settings.general/language)]
       [:div.flex.items-center
        (language-select {:value preferred-language
                          :on-change set-language!})]]

      [:div.mobile-setting-item
       [:span.text-base (t :mobile.settings/version)]
       [:span.text-sm version/version]]

      [:div.mobile-setting-item
       {:on-click (fn []
                    (shui/popup-show! nil (fn [] (mobile-tabs-picker)) {}))}
       [:span.text-base (t :mobile.settings/tabs)]
       [:span.text-sm.opacity-70 (selected-mobile-tabs-label)]]

      (let [revision (string/replace (build-version/revision) "-dirty" "")]
        [:div.mobile-setting-item
         {:on-click (fn []
                      (js/window.open (str "https://github.com/logseq/logseq/commit/" revision)))}
         [:span.text-base (t :mobile.settings/revision)]
         [:span.text-sm revision]])

      [:div.mobile-setting-item
       {:on-click (fn []
                    (js/window.open "https://github.com/logseq/db-test/issues"))}
       [:span.text-base (t :mobile.settings/report-bug)]]

      [:div.mobile-setting-item
       {:on-click (fn []
                    (shui/popup-show! nil (fn [] (log)) {}))}
       [:span.text-base (t :mobile.settings/check-log)]]

      [:div.mobile-setting-item
       {:on-click #(state/pub-event! [:go/sync-server-settings])}
       [:span.text-base (t :settings.sync-server/url)]
       [:span.text-sm.opacity-70
        (if-let [custom (config/get-custom-sync-server-url)]
          (str (t :settings.sync-server/self-hosted)
               " · "
               (try (.-host (js/URL. custom))
                    (catch :default _ custom)))
          "Logseq Sync")]]

      (when login?
        [:div.mobile-setting-item
         {:on-click (fn []
                      (p/do!
                       (user-handler/logout)
                       (shui/popup-hide!)))}
         [:span.text-base (t :ui/logout)]])

      [:div.flex.flex-row.flex-row.gap-4
       [:a {:href "https://discord.com/invite/KpN4eHY"
            :target "_blank"}
        [:div.flex.items-center
         (ui/icon "brand-discord")
         [:span.ml-1 (t :mobile.settings/discord-community)]]]
       [:a {:href "https://discuss.logseq.com"
            :target "_blank"}
        [:div.flex.items-center
         (ui/icon "message")
         [:span.ml-1 (t :mobile.settings/forum)]]]
       [:a {:href "https://github.com/logseq/logseq"
            :target "_blank"}
        [:div.flex.items-center
         (ui/icon "brand-github")
         [:span.ml-1 (t :mobile.settings/github)]]]]]]))
