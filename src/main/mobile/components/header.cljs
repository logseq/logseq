(ns mobile.components.header
  "App top header"
  (:require ["@capacitor/dialog" :refer [Dialog]]
            [clojure.string :as string]
            [frontend.components.repo :as repo]
            [frontend.components.rtc.indicator :as rtc-indicator]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.db.conn :as db-conn]
            [frontend.flows :as flows]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.user :as user-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [goog.date :as gdate]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [missionary.core :as m]
            [mobile.components.settings :as mobile-settings]
            [mobile.components.ui :as ui-component]
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

(defn- open-home-settings-actions! []
  (ui-component/open-popup!
   (fn []
     (mobile-settings/page))
   {}))

(defn- open-graph-settings-actions! []
  (ui-component/open-popup!
   (fn []
     [:div.-mx-2
      ;; TODO: support export
      ;; (ui/menu-link
      ;;  {:on-click (fn [] (route-handler/redirect! {:to :export}))}
      ;;  [:span.text-lg.flex.gap-2.items-center
      ;;   (shui/tabler-icon "database-export" {:class "opacity-80" :size 22})
      ;;   "Export"])

      (ui/menu-link
       {:on-click (fn [] (route-handler/redirect! {:to :import}))}
       [:span.text-lg.flex.gap-2.items-center
        (shui/tabler-icon "file-upload" {:class "opacity-80" :size 22})
        "Import"])])
   {:default-height false}))

(defn open-page-settings
  [block]
  (shui/popup-show!
   nil
   (fn []
     [:div.-mx-2
      (ui/menu-link
       {:on-click
        (fn []
          (p/do!
           (shui/popup-hide!)
           (-> (.confirm ^js Dialog
                         #js {:title "Confirm"
                              :message (str "Are you sure to delete this "
                                            (if (entity-util/page? block) "page" "block")
                                            "?")})
               (p/then
                (fn [^js result]
                  (let [value (.-value result)]
                    (when value
                      (some->
                       (:block/uuid block)
                       (page-handler/<delete!
                        (fn []
                          (js/history.back))
                        {:error-handler
                         (fn [{:keys [msg]}]
                           (notification/show! msg :warning))})))))))))}
       [:span.text-lg.flex.gap-2.items-center.text-red-700
        (shui/tabler-icon "trash" {:class "opacity-80" :size 22})
        "Delete"])])
   {:title "Actions"
    :default-height false}))

(defn- open-graph-switch!
  []
  (ui-component/open-popup!
   (fn []
     [:div.px-1
      (repo/repos-dropdown-content {:footer? false})
      (ui/menu-link
       {:on-click #(p/do!
                    (shui/popup-hide!)
                    (state/pub-event! [:graph/new-db-graph]))}
       "Create new graph")])
   {:default-height false}))

(defn- register-native-top-bar-events! [*configure-top-bar-f]
  (when (and (mobile-util/native-platform?)
             mobile-util/native-top-bar
             (not @native-top-bar-listener?))
    (.addListener ^js mobile-util/native-top-bar "buttonTapped"
                  (fn [^js e]
                    (case (.-id e)
                      "back" (js/history.back)
                      "title" (open-graph-switch!)
                      "calendar" (open-journal-calendar!)
                      "capture" (do
                                  (state/clear-edit!)
                                  (editor-handler/quick-add-blocks!))
                      "audio-record" (state/pub-event! [:mobile/start-audio-record])
                      "add-graph" (state/pub-event! [:graph/new-db-graph])
                      "home-setting" (open-home-settings-actions!)
                      "graph-setting" (open-graph-settings-actions!)
                      "sync" (shui/popup-show! nil
                                               (rtc-indicator/details)
                                               {})
                      "favorite" (when-let [id (state/get-current-page)]
                                   (when (common-util/uuid-string? id)
                                     (when-let [block (db/entity [:block/uuid (uuid id)])]
                                       (let [favorited? (page-handler/favorited? (str (:block/uuid block)))]
                                         (p/do!
                                          (if favorited?
                                            (page-handler/<unfavorite-page! id)
                                            (page-handler/<favorite-page! id))
                                          (let [favorited? (not favorited?)]
                                            (when-let [f @*configure-top-bar-f]
                                              (f favorited?))))))))
                      "page-setting" (when-let [id (state/get-current-page)]
                                       (when (common-util/uuid-string? id)
                                         (when-let [block (db/entity [:block/uuid (uuid id)])]
                                           (open-page-settings block))))

                      nil)))
    (reset! native-top-bar-listener? true)))

(defn- configure-native-top-bar!
  [{:keys [tab title route-name route-view sync-color favorited? show-sync?]}]
  (when (and (mobile-util/native-platform?)
             mobile-util/native-top-bar)
    (let [hidden? (and (mobile-util/native-ios?) (= tab "search"))
          base (cond->
                {:hidden hidden?}
                 (not (mobile-util/native-ipad?))
                 (assoc :title title))
          page? (= route-name :page)
          left-buttons (cond
                         page? [{:id "back" :systemIcon "chevron.backward"}]
                         (and (= tab "home") (nil? route-view))
                         [(conj {:id "calendar" :systemIcon "calendar"})]
                         (and (= tab "capture") (nil? route-view))
                         [(conj {:id "audio-record" :systemIcon "waveform"})])
          right-buttons (cond
                          page?
                          (into [{:id "page-setting" :systemIcon "ellipsis"}
                                 {:id "favorite" :systemIcon (if favorited? "star.fill" "star")}])

                          (= tab "home")
                          (cond-> []
                            (nil? route-view)
                            (conj {:id "home-setting" :systemIcon "ellipsis"})
                            (and show-sync? (not page?))
                            (conj {:id "sync" :systemIcon "circle.fill" :color sync-color
                                   :size "small"}))

                          (= tab "graphs")
                          [{:id "graph-setting" :systemIcon "ellipsis"}
                           {:id "add-graph" :systemIcon "plus"}]

                          (= tab "capture")
                          [{:id "capture" :systemIcon "paperplane"}]

                          :else nil)
          [left-buttons right-buttons] (if (mobile-util/native-android?)
                                         [(reverse left-buttons) (reverse right-buttons)]
                                         [left-buttons right-buttons])
          header (cond-> base
                   left-buttons (assoc :leftButtons left-buttons)
                   right-buttons (assoc :rightButtons right-buttons)
                   (and (= tab "home") (not route-view)) (assoc :titleClickable true))]
      (.configure ^js mobile-util/native-top-bar
                  (clj->js header)))))

(rum/defc header-inner
  [current-repo tab route-match]
  (let [short-repo-name (if current-repo
                          (db-conn/get-short-repo-name current-repo)
                          "Select a Graph")
        route-name (get-in route-match [:data :name])
        route-view (get-in route-match [:data :view])
        route-id (get-in route-match [:parameters :path :name])
        page-route? (= route-name :page)
        [*configure-top-bar-f _] (hooks/use-state (atom nil))
        detail-info (hooks/use-flow-state (m/watch rtc-indicator/*detail-info))
        _ (hooks/use-flow-state flows/current-login-user-flow)
        online? (hooks/use-flow-state flows/network-online-event-flow)
        rtc-state (:rtc-state detail-info)
        graph-uuid (or (:graph-uuid detail-info)
                       (ldb/get-graph-rtc-uuid (db/get-db)))
        show-sync? (and current-repo graph-uuid (user-handler/logged-in?))
        unpushed-block-update-count (:pending-local-ops detail-info)
        pending-asset-ops           (:pending-asset-ops detail-info)
        fallback-title (cond
                         (= tab "home")
                         short-repo-name

                         (= tab "search")
                         "Search"

                         :else
                         (string/capitalize tab))
        sync-color (if (and online?
                            (= :open rtc-state)
                            (zero? unpushed-block-update-count)
                            (zero? pending-asset-ops))
                     ;; green
                     "#16A34A"
                     ;; yellow
                     "#CA8A04")]
    (hooks/use-effect!
     (fn []
       (when (and (mobile-util/native-platform?)
                  mobile-util/native-top-bar)
         (register-native-top-bar-events! *configure-top-bar-f)
         (let [block (when (and page-route?
                                (common-util/uuid-string? route-id))
                       (db/entity [:block/uuid (uuid route-id)]))
               favorited? (when block
                            (page-handler/favorited? (str (:block/uuid block))))
               title (or (:block/title block) fallback-title)
               f (fn [favorited?]
                   (configure-native-top-bar!
                    {:tab tab
                     :title title
                     :route-name route-name
                     :route-view route-view
                     :sync-color sync-color
                     :show-sync? show-sync?
                     :favorited? favorited?}))]
           (reset! *configure-top-bar-f f)
           (f favorited?)))
       nil)
     [current-repo tab route-name route-view route-id fallback-title sync-color show-sync? page-route?])

    (hooks/use-effect!
     (fn []
       (if (and (mobile-util/native-platform?)
                mobile-util/native-top-bar
                current-repo
                page-route?
                (common-util/uuid-string? route-id))
         (let [cancelled? (atom false)
               page-id (uuid route-id)]
           (-> (db-async/<get-block current-repo page-id {:children? false})
               (p/then
                (fn [block]
                  (when (and block (not @cancelled?))
                    (let [favorited? (page-handler/favorited? (str (:block/uuid block)))
                          title (:block/title block)
                          f (fn [favorited?]
                              (configure-native-top-bar!
                               {:tab tab
                                :title title
                                :route-name route-name
                                :route-view route-view
                                :sync-color sync-color
                                :show-sync? show-sync?
                                :favorited? favorited?}))]
                      (reset! *configure-top-bar-f f)
                      (f favorited?)))))
               (p/catch (fn [_] nil)))
           #(reset! cancelled? true))
         nil))
     [current-repo tab route-name route-view route-id sync-color show-sync? page-route?])

    [:<>]))

(rum/defc header < rum/reactive
  [current-repo tab]
  (let [route-match (state/sub :route-match)]
    (header-inner current-repo tab
                  route-match)))
