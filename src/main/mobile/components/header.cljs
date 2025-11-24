(ns mobile.components.header
  "App top header"
  (:require [clojure.string :as string]
            [frontend.common.missionary :as c.m]
            [frontend.components.repo :as repo]
            [frontend.components.rtc.indicator :as rtc-indicator]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.db.conn :as db-conn]
            [frontend.flows :as flows]
            [frontend.handler.page :as page-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.user :as user-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.date :as gdate]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [missionary.core :as m]
            [mobile.components.ui :as ui-component]
            [mobile.state :as mobile-state]
            [promesa.core :as p]
            [rum.core :as rum]))

(defonce native-top-bar-listener? (atom false))

(defn- open-journal-calendar! []
  (let [apply-date! (fn [date]
                      (let [page-name (date/journal-name (gdate/Date. (js/Date. date)))]
                        (if-let [journal (db/get-page page-name)]
                          (route-handler/redirect-to-page! (:block/uuid journal))
                          (p/let [page (page-handler/<create! page-name {:redirect? false})]
                            (route-handler/redirect-to-page! (:block/uuid page))))))]
    (-> (.showDatePicker mobile-util/ui-local)
        (p/then (fn [^js e] (some-> e (.-value) (apply-date!)))))))

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

(defn- open-settings-actions! []
  (ui-component/open-popup!
   (fn []
     [:div
      (when (user-handler/logged-in?)
        (ui/menu-link {:on-click #(user-handler/logout)}
                      [:span.text-lg.flex.gap-2.items-center.text-red-700
                       (shui/tabler-icon "logout" {:class "opacity-80" :size 22})
                       "Logout"]))
      (ui/menu-link {:on-click #(js/window.open "https://github.com/logseq/db-test/issues")}
                    [:span.text-lg.flex.gap-2.items-center
                     (shui/tabler-icon "bug" {:class "opacity-70" :size 22})
                     "Report bug"])
      (ui/menu-link {:on-click (fn []
                                 (shui/popup-show! nil (fn [] (log)) {}))}
                    [:span.text-lg.flex.gap-2.items-center
                     "Check log"])])
   {:title "Actions"
    :default-height false}))

(defn- open-graph-switcher! []
  (ui-component/open-popup!
   (fn []
     [:div.px-1
      (repo/repos-dropdown-content {})])
   {:title "Select a Graph"
    :default-height false}))

(defn- register-native-top-bar-events! []
  (when (and (mobile-util/native-ios?)
             (not @native-top-bar-listener?))
    (.addListener mobile-util/native-top-bar "buttonTapped"
                  (fn [^js e]
                    (case (.-id e)
                      "title" (open-graph-switcher!)
                      "calendar" (open-journal-calendar!)
                      "settings-actions" (open-settings-actions!)
                      "sync" (shui/popup-show! nil
                                               (rtc-indicator/details)
                                               {})

                      nil)))
    (reset! native-top-bar-listener? true)))

(defn- configure-native-top-bar!
  [repo {:keys [tab title route-name sync-color]}]
  (when (mobile-util/native-ios?)
    (let [hidden? (and (= tab "search")
                       (not= route-name :page))
          rtc-indicator? (and repo
                              (ldb/get-graph-rtc-uuid (db/get-db))
                              (user-handler/logged-in?))
          base {:title title
                :hidden (boolean hidden?)}
          right-buttons (cond
                          (= tab "home")
                          (cond-> [{:id "calendar" :systemIcon "calendar"}]
                            rtc-indicator?
                            (conj {:id "sync" :systemIcon "circle.fill" :color sync-color
                                   :size "small"}))

                          (= tab "settings")
                          [{:id "settings-actions" :systemIcon "ellipsis"}]

                          :else nil)
          header (cond-> base
                   right-buttons (assoc :rightButtons right-buttons)
                   (= tab "home") (assoc :titleClickable true))]
      (.configure mobile-util/native-top-bar
                  (clj->js header)))))

(rum/defc header-inner
  [current-repo tab route-match]
  (let [short-repo-name (if current-repo
                          (db-conn/get-short-repo-name current-repo)
                          "Select a Graph")
        route-name (get-in route-match [:data :name])
        detail-info (hooks/use-flow-state (m/watch rtc-indicator/*detail-info))
        _ (hooks/use-flow-state flows/current-login-user-flow)
        online? (hooks/use-flow-state flows/network-online-event-flow)
        rtc-state (:rtc-state detail-info)
        sync-color (if (and online? (= :open rtc-state))
                     "green"
                     "yellow")]
    (hooks/use-effect!
     (fn []
       (when (mobile-util/native-ios?)
         (register-native-top-bar-events!)
         (p/let [block (when (= route-name :page)
                         (let [id (get-in route-match [:parameters :path :name])]
                           (when (common-util/uuid-string? id)
                             (db-async/<get-block current-repo (uuid id) {:children? false}))))
                 title (cond block
                             (:block/title block)
                             (= tab "home")
                             short-repo-name
                             :else
                             (string/capitalize tab))]
           (configure-native-top-bar!
            current-repo
            {:tab tab
             :title title
             :hidden? (and (= tab "search")
                           (not= route-name :page))
             :route-name route-name
             :sync-color sync-color})))
       nil)
     [tab short-repo-name route-match])

    [:<>]))

(rum/defc header < rum/reactive
  [current-repo tab]
  (let [route-match (state/sub :route-match)]
    (header-inner current-repo tab
                  route-match)))
