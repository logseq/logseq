(ns mobile.components.header
  "App top header"
  (:require ["@capacitor/dialog" :refer [Dialog]]
            [clojure.string :as string]
            [frontend.context.i18n :refer [t]]
            [frontend.components.repo :as repo]
            [frontend.components.rtc.indicator :as rtc-indicator]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.db.conn :as db-conn]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.user :as user-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.rfx :as rfx]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [goog.date :as gdate]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [mobile.components.settings :as mobile-settings]
            [mobile.components.ui :as ui-component]
            [mobile.state :as mobile-state]
            [promesa.core :as p]
            [io.factorhouse.hsx.core :as hsx]))

(defonce native-top-bar-listener? (atom false))
(defonce native-top-bar-listener-version (atom nil))
(defonce *journal-calendar-open? (atom false))
(def ^:private native-top-bar-listener-current-version :flashcards-title-selector-v1)

(defn- open-journal-calendar! []
  (when (compare-and-set! *journal-calendar-open? false true)
    (let [apply-date! (fn [date]
                        (let [page-name (date/journal-name (gdate/Date. (js/Date. date)))]
                          (if-let [journal (db/get-page page-name)]
                            (route-handler/redirect-to-page! (:block/uuid journal))
                            (p/let [page (page-handler/<create! page-name {:redirect? false})]
                              (route-handler/redirect-to-page! (:block/uuid page))))))]
      (-> (.showDatePicker mobile-util/ui-local)
          (p/then (fn [^js e]
                    (when-let [value (some-> e (.-value))]
                      (apply-date! value))))
          (p/finally (fn []
                       (reset! *journal-calendar-open? false)))))))

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
       {:on-click (fn []
                    (p/do!
                     (shui/popup-hide!)
                     (route-handler/redirect! {:to :import})))}
       [:span.text-lg.flex.gap-2.items-center
        (shui/tabler-icon "file-upload" {:class "opacity-80" :size 22})
        (t :import/title)])])
   {:default-height false}))

(defn- open-new-db-graph! []
  (if (and (mobile-util/native-ios?) (= @mobile-state/*tab "graphs"))
    (ui-component/open-popup!
     (fn []
       [:div.px-2
        [:h2.py-2.opacity-40 (t :graph/create-new)]
        (repo/new-db-graph)])
     {:default-height false})
    (state/pub-event! [:graph/new-db-graph])))

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
                         #js {:title (t :ui/confirm)
                              :message (if (entity-util/page? block)
                                         (t :mobile.header/delete-page-confirm-desc)
                                         (t :mobile.header/delete-block-confirm-desc))})
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
        (t :ui/delete)])])
   {:title (t :mobile.header/actions)
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
                    (open-new-db-graph!))}
     (t :mobile.header/create-graph))])
   {:default-height false}))

(defn- global-cards-id?
  [cards-id]
  (contains? #{:global "global"} cards-id))

(defn- same-cards-id?
  [a b]
  (or (= a b)
      (and (global-cards-id? a)
           (global-cards-id? b))))

(defn- open-flashcards-selector!
  []
  (when-let [{:keys [cards cards-id select-card!]} @mobile-state/*flashcards-selector]
    (ui-component/open-popup!
     (fn []
       [:div.-mx-2
        (for [card cards
              :let [card-id (:db/id card)]]
          (ui/menu-link
           {:key (str card-id)
            :on-click (fn []
                        (p/do!
                         (select-card! card-id)
                         (shui/popup-hide!)))}
           [:span.text-lg.flex.items-center.justify-between.gap-3.w-full
            [:span.min-w-0.truncate (:block/title card)]
            (when (same-cards-id? cards-id card-id)
              (shui/tabler-icon "check" {:class "text-primary flex-none" :size 20}))]))])
     {:title (t :flashcard/select-cards)
      :default-height false})))

(defn current-local-uploadable-graph
  []
  (let [current-repo (state/get-current-repo)]
    (some (fn [{:keys [url] :as graph}]
            (when (and (= current-repo url)
                       (repo/local-uploadable-graph?
                        (assoc graph :rtc-graph?
                               (boolean (ldb/get-graph-rtc-uuid (db/get-db current-repo))))))
              graph))
          (state/get-repos))))

(defn- register-native-top-bar-events! [*configure-top-bar-f]
  (when (and (mobile-util/native-platform?)
             mobile-util/native-top-bar
             (not= native-top-bar-listener-current-version @native-top-bar-listener-version))
    (.addListener ^js mobile-util/native-top-bar "buttonTapped"
                  (fn [^js e]
                    (case (.-id e)
                      "back" (js/history.back)
                      "title" (if (= @mobile-state/*tab "flashcards")
                                (open-flashcards-selector!)
                                (open-graph-switch!))
                      "calendar" (open-journal-calendar!)
                      "capture" (do
                                  (state/clear-edit!)
                                  (editor-handler/quick-add-blocks!))
                      "audio-record" (state/pub-event! [:mobile/start-audio-record])
                      "add-graph" (open-new-db-graph!)
                      "home-setting" (open-home-settings-actions!)
                      "graph-setting" (open-graph-settings-actions!)
                      "sync" (if-let [graph (current-local-uploadable-graph)]
                               (repo/upload-local-graph-with-confirm! graph)
                               (shui/popup-show! nil
                                                 (rtc-indicator/details)
                                                 {}))
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
    (reset! native-top-bar-listener? true)
    (reset! native-top-bar-listener-version native-top-bar-listener-current-version)))

(defn- configure-native-top-bar!
  [{:keys [tab title route-name route-view sync-color favorited? show-sync? show-local-upload?]}]
  (when (and (mobile-util/native-platform?)
             mobile-util/native-top-bar)
    (let [hidden? (and (mobile-util/native-ios?) (= tab "search"))
          base (cond->
                {:hidden hidden?}
                 (not (mobile-util/native-ipad?))
                 (assoc :title title))
          page? (and (= route-name :page)
                     (not (and (mobile-util/native-ios?)
                               (= tab "graphs"))))
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
                            (and show-local-upload? (not page?))
                            (conj {:id "sync" :systemIcon "icloud.and.arrow.up"
                                   :size "medium"})
                            (and (not show-local-upload?) show-sync? (not page?))
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
                   (and (contains? #{"home" "flashcards"} tab) (not route-view))
                   (assoc :titleClickable true))]
      (.configure ^js mobile-util/native-top-bar
                  (clj->js header)))))

(defn- flashcards-native-title
  [{:keys [title progress]}]
  (let [title (if (string/blank? title)
                (t :nav/flashcards)
                title)]
    (string/trim (str title " ▾"
                      (when-not (string/blank? progress)
                        (str "  " progress))))))

(defn- build-fallback-title
  [current-repo tab flashcards-header]
  (cond
    (= tab "home")
    (if current-repo
      (db-conn/get-short-repo-name current-repo)
      (t :graph.switch/select-prompt))

    (= tab "search")
    (t :nav/search)

    (= tab "graphs")
    (t :mobile.tab/graphs)

    (= tab "flashcards")
    (flashcards-native-title flashcards-header)

    :else
    (string/capitalize tab)))

(hsx/defc header-inner
  [current-repo tab route-match flashcards-header]
  (let [route-name (get-in route-match [:data :name])
        route-view (get-in route-match [:data :view])
        route-id (get-in route-match [:parameters :path :name])
        native-ios-graphs? (and (mobile-util/native-ios?) (= tab "graphs"))
        page-route? (and (= route-name :page) (not native-ios-graphs?))
        [*configure-top-bar-f _] (hooks/use-state (atom nil))
        detail-info (hooks/use-atom-value rtc-indicator/*detail-info)
        _ (rfx/use-sub [:auth/current-login-user])
        online? (rfx/use-sub [:network/online?])
        rtc-state (:rtc-state detail-info)
        graph-uuid (or (:graph-uuid detail-info)
                       (ldb/get-graph-rtc-uuid (db/get-db)))
        local-uploadable-graph (current-local-uploadable-graph)
        show-sync? (and current-repo graph-uuid (user-handler/logged-in?))
        show-local-upload? (some? local-uploadable-graph)
        unpushed-block-update-count (:pending-local-ops detail-info)
        pending-asset-ops           (:pending-asset-ops detail-info)
        fallback-title (build-fallback-title current-repo tab flashcards-header)
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
                     :show-local-upload? show-local-upload?
                     :favorited? favorited?}))]
           (reset! *configure-top-bar-f f)
           (f favorited?)))
       nil)
     [current-repo tab route-name route-view route-id fallback-title sync-color show-sync? show-local-upload? page-route?])

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
                                :show-local-upload? show-local-upload?
                                :favorited? favorited?}))]
                      (reset! *configure-top-bar-f f)
                      (f favorited?)))))
               (p/catch (fn [_] nil)))
           #(reset! cancelled? true))
         nil))
     [current-repo tab route-name route-view route-id sync-color show-sync? show-local-upload? page-route?])

    [:<>]))

(hsx/defc header
  [current-repo tab]
  (let [route-match (rfx/use-sub [:route-match])
        [flashcards-header] (hooks/use-atom mobile-state/*flashcards-header)]
    (header-inner current-repo tab
                  route-match
                  flashcards-header)))
