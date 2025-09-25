(ns mobile.components.header
  "App top header"
  (:require [clojure.string :as string]
            [frontend.common.missionary :as c.m]
            [frontend.components.repo :as repo]
            [frontend.components.rtc.indicator :as rtc-indicator]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.conn :as db-conn]
            [frontend.handler.page :as page-handler]
            [frontend.handler.user :as user-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.date :as gdate]
            [logseq.db :as ldb]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [missionary.core :as m]
            [mobile.components.ui :as ui-component]
            [mobile.components.ui-silk :as ui-silk]
            [mobile.state :as mobile-state]
            [promesa.core :as p]
            [rum.core :as rum]))

(rum/defc app-graphs-select
  []
  (let [current-repo (state/get-current-repo)
        short-repo-name (if current-repo
                          (db-conn/get-short-repo-name current-repo)
                          "Select a Graph")]
    [:.app-graph-select
     (shui/button
      {:variant :text
       :size :sm
       :on-click (fn [e]
                   (shui/popup-show! (.-target e)
                                     (fn [{:keys [id]}]
                                       (repo/repos-dropdown-content {:contentid id}))
                                     {:id :switch-graph
                                      :default-height false
                                      :content-props {:class "repos-list"}}))}
      [:span.flex.items-center.pt-1
       [:span.overflow-hidden.text-ellipsis.block.text-base
        {:style {:max-width "40vw"}}
        short-repo-name]])]))

(rum/defc journal-calendar-btn
  []
  (shui/button
   {:variant :text
    :size :sm
    :on-click (fn []
                (let [apply-date! (fn [date]
                                    (let [page-name (date/journal-name (gdate/Date. (js/Date. date)))]
                                      (if-let [journal (db/get-page page-name)]
                                        (mobile-state/open-block-modal! journal)
                                        (-> (page-handler/<create! page-name {:redirect? false})
                                            (p/then #(mobile-state/open-block-modal! (db/get-page page-name)))))))]
                  (-> (.showDatePicker mobile-util/ui-local)
                      (p/then (fn [^js e] (some-> e (.-value) (apply-date!)))))))}
   [:span.mt-1
    (shui/tabler-icon "calendar-month" {:size 24})]))

(rum/defc rtc-indicator-btn
  []
  (let [repo (state/get-current-repo)]
    [:div.flex.flex-row.items-center.gap-2
     (when (and repo
                (ldb/get-graph-rtc-uuid (db/get-db))
                (user-handler/logged-in?))
       (rtc-indicator/indicator))]))

(rum/defc menu-button
  []
  (shui/button
   {:variant :text
    :size :sm
    :on-pointer-down (fn [e]
                       (util/stop e)
                       (mobile-state/close-block-modal!)
                       (mobile-state/open-left-sidebar!))}
   [:span.mt-2
    (shui/tabler-icon "menu" {:size 24})]))

(rum/defc log
  []
  (let [[error-only? set-error-only!] (hooks/use-state false)
        [reversed? set-reversed!] (hooks/use-state false)
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
        :on-click (fn []
                    (set-error-only! (not error-only?)))}
       (if error-only?
         "All"
         "Errors only"))

      (shui/button
       {:size :sm
        :on-click (fn []
                    (set-reversed! (not reversed?)))}
       (if reversed?
         "New record first"
         "Old record first"))

      (shui/button
       {:size :sm
        :on-click (fn []
                    (set-show-worker-log! (not show-worker-log?)))}
       (if show-worker-log?
         "UI logs"
         "worker logs"))]

     (let [records (cond->> (if show-worker-log? worker-records @mobile-state/*log)
                     error-only?
                     (filter (fn [record] (contains? #{:error :severe} (:level record))))
                     reversed?
                     reverse)]
       [:ul
        (for [record records]
          [:li (str (:level record) " " (:message record))])])]))

(rum/defc header
  [tab login?]
  (ui-silk/app-silk-topbar
   (cond-> {:title [:span.capitalize (str tab)]
            :props {:class (str tab)}}
     (= tab "home")
     (assoc
      :left-render (menu-button)
      :title (app-graphs-select)
      :right-render [:div.flex.items-center.gap-1
                     (journal-calendar-btn)
                     (rtc-indicator-btn)]
      :center-title? true)

     (= tab "settings")
     (assoc
      :right-render
      [:<>
       (shui/button
        {:variant :icon :size :sm
         :on-click (fn []
                     (ui-component/open-popup!
                      (fn []
                        [:div.-mx-2
                         (when login?
                           (ui/menu-link {:on-click #(user-handler/logout)}
                                         [:span.text-lg.flex.gap-2.items-center.text-red-700
                                          (shui/tabler-icon "logout" {:class "opacity-80" :size 22})
                                          "Logout"]))
                         (ui/menu-link {:on-click #(js/window.open "https://github.com/logseq/db-test/issues")}
                                       [:span.text-lg.flex.gap-2.items-center
                                        (shui/tabler-icon "bug" {:class "opacity-70" :size 22})
                                        "Report bug"])
                         (ui/menu-link {:on-click (fn []
                                                    (mobile-state/set-popup! nil)
                                                    (mobile-state/set-popup!
                                                     {:open? true
                                                      :content-fn (fn [] (log))}))}
                                       [:span.text-lg.flex.gap-2.items-center
                                        "Check log"])])
                      {:title "Actions"
                       :default-height false
                       :type :action-sheet}))}
        (shui/tabler-icon "dots" {:size 23}))]))))
