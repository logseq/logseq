(ns mobile.components.header
  "App top header"
  (:require [clojure.string :as string]
            [frontend.components.rtc.indicator :as rtc-indicator]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.conn :as db-conn]
            [frontend.handler.page :as page-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.user :as user-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [goog.date :as gdate]
            [logseq.db :as ldb]
            [logseq.shui.ui :as shui]
            [mobile.components.ui :as ui-component]
            [mobile.components.ui-silk :as ui-silk]
            [mobile.state :as mobile-state]
            [promesa.core :as p]
            [rum.core :as rum]))

(rum/defc app-graphs-select < rum/reactive
  []
  (let [current-repo (state/get-current-repo)
        graphs (->> (state/sub [:me :repos])
                    (util/distinct-by :url))
        remote-graphs (state/sub :rtc/graphs)
        graphs (->>
                (if (seq remote-graphs)
                  (repo-handler/combine-local-&-remote-graphs graphs remote-graphs)
                  graphs)
                (filter (fn [item] (config/db-based-graph? (:url item)))))
        short-repo-name (if current-repo
                          (db-conn/get-short-repo-name current-repo)
                          "Select a Graph")]
    [:.app-graph-select
     (shui/button
      {:variant :text
       :size :sm
       :class "ml-1 text-primary !font-semibold !opacity-90 text-base"
       :on-click (fn []
                   (let [buttons (concat
                                  (->>
                                   (for [repo graphs]
                                     {:text (some-> (:url repo) (string/replace #"^logseq_db_" ""))
                                      :role (:url repo)})
                                   (remove (fn [{:keys [text]}] (string/blank? text))))
                                  [{:text [:div.text-gray-09.pb-4.active:opacity-80.flex.flex-row.items-center
                                           (ui/icon "plus")
                                           "Add new graph"]
                                    :role "add-new-graph"}])]
                     (ui-component/open-modal! "Switch graph"
                                               {:type :action-sheet
                                                :buttons buttons
                                                :on-action (fn [e]
                                                             (when-let [role (:role e)]
                                                               (if (= "add-new-graph" role)
                                                                 (state/pub-event! [:graph/new-db-graph])
                                                                 (when (string/starts-with? role "logseq_db_")
                                                                   (state/pub-event! [:graph/switch role])))))
                                                :modal-props {:class "graph-switcher"}})))}
      [:span.flex.items-center.gap-2.opacity-80.pt-1
       [:strong.overflow-hidden.text-ellipsis.block.font-normal
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
   [:span.text-muted-foreground.mt-1
    (shui/tabler-icon "calendar-month" {:size 24})]))

(rum/defc rtc-indicator-btn
  []
  (let [repo (state/get-current-repo)]
    [:div.flex.flex-row.items-center.gap-2.text-muted-foreground
     (when (and repo
                (ldb/get-graph-rtc-uuid (db/get-db))
                (user-handler/logged-in?))
       (rtc-indicator/indicator))]))

(rum/defc header
  [tab login?]
  (ui-silk/app-silk-topbar
   (cond-> {:title [:span.capitalize (str tab)]
            :props {:class (str tab)}}
     (= tab "home")
     (assoc
      :left-render (shui/button
                    {:variant :text
                     :size :sm}
                    [:span.text-muted-foreground.mt-2
                     (shui/tabler-icon "menu" {:size 24})])
      :title (app-graphs-select)
      :right-render [:div.flex.items-center.gap-1
                     (journal-calendar-btn)
                     (rtc-indicator-btn)])

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
                                        "Report bug"])])
                      {:title "Actions"}))}
        (shui/tabler-icon "dots" {:size 23}))]))))
