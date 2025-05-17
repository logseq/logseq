(ns capacitor.app
  (:require ["@capacitor/app" :refer [App]]
            ["@capacitor/status-bar" :refer [StatusBar Style]]
            ["./externals.js"]
            [clojure.string :as string]
            [frontend.db.react :as react]
            [frontend.util :as util]
            [rum.core :as rum]
            [frontend.rum :as frum]
            [promesa.core :as p]
            [capacitor.ionic :as ionic]
            [capacitor.state :as state]
            [capacitor.handler :as handler]
            [capacitor.pages.utils :as pages-util]
            [capacitor.pages.blocks :as blocks]
            [capacitor.components.ui :as ui]
            [frontend.db.conn :as db-conn]
            [frontend.db-mixins :as db-mixins]
            [frontend.state :as fstate]
            [frontend.db.utils :as db-util]
            [frontend.date :as frontend-date]
            [frontend.handler.repo :as repo-handler]
            [frontend.mobile.util :as mobile-util]
            [goog.date :as gdate]
            [logseq.db :as ldb]
            [capacitor.pages.settings :as settings]))

(rum/defc app-graphs-select
  []
  (let [current-repo (fstate/get-current-repo)
        graphs (fstate/get-repos)
        short-repo-name (if current-repo
                          (db-conn/get-short-repo-name current-repo)
                          "Select a Graph")]
    [:<>
     (ionic/ion-button
       {:fill "clear" :mode "ios"
        :class "border-none w-full rounded-lg font-semibold pt-2"
        :on-click (fn []
                    (ui/open-modal! "Switch graph"
                      {:type :action-sheet
                       :buttons (for [repo graphs]
                                  {:text (some-> (:url repo) (string/replace #"^logseq_db_" ""))
                                   :role (:url repo)})
                       :inputs []
                       :on-action (fn [e]
                                    (when-let [url (:role e)]
                                      (when (string/starts-with? url "logseq_db_")
                                        (fstate/pub-event! [:graph/switch url]))))}))}
       short-repo-name)

     (ionic/ion-button
       {:class "relative -left-2 pt-1.5 opacity-50"
        :on-click (fn []
                    (when-let [db-name (js/prompt "Create new db")]
                      (when-not (string/blank? db-name)
                        (-> (repo-handler/new-db! db-name)
                          (p/then #())))))}
       (ionic/tabler-icon "plus" {:size 24}))]))

(rum/defc app-sidebar []
  (ionic/ion-menu {:content-id "app-main-content"
                   :type "push"}
    (ionic/ion-header
      (ionic/ion-toolbar
        [:strong.px-2 {:slot "start"} "Navigations"]))
    (ionic/ion-content
      [:div.p-4
       [:strong "hello, logseq?"]])))

(rum/defc app-tabbar []
  (ionic/ion-tab-bar {:color "light"
                      :class "w-full fixed bottom-4"}
    (ionic/ion-tab-button {:tab "tab1"
                           :selected true
                           :on-click #(js/alert "home")}
      (ionic/tabler-icon "home" {:size 22}) "Journals")
    (ionic/ion-tab-button {:tab "tab0"
                           :selected false}
      (ionic/tabler-icon "circle-plus" {:size 24}) "Capture New")
    (ionic/ion-tab-button {:tab "tab2"}
      (ionic/tabler-icon "settings" {:size 22}) "Settings")))

(rum/defc journals-list < rum/reactive db-mixins/query
  []
  (let [journals (handler/sub-journals)]
    [:ul.app-journals-list
     (for [journal-id journals]
       (let [journal (db-util/entity journal-id)]
         [:li.flex.py-1.active:opacity-50.flex-col.w-full
          {:on-click #(pages-util/nav-to-block! journal {:reload-pages! (fn [] ())})}
          [:h1.font-semibold.opacity-90 (:block/title journal)]
          ;; blocks editor
          (blocks/page-blocks journal)
          ]))]))

(rum/defc home []
  (let [[reload set-reload!] (rum/use-state 0)]

    (ionic/ion-content
      (ionic/ion-refresher
        {:slot "fixed"
         :pull-factor 0.5
         :pull-min 100
         :pull-max 200
         :on-ion-refresh (fn [^js e]
                           (js/setTimeout
                             (fn [] (.complete (.-detail e))
                               (set-reload! (inc reload)))
                             1000))}
        (ionic/ion-refresher-content))

      [:div.pt-4.px-4
       (journals-list)
       ]

      ;; tabbar
      ;(app-tabbar)
      )
    ))

(rum/defc root < rum/reactive
  []
  (let [db-restoring? (fstate/sub :db/restoring?)]
    [:<>
     (ionic/ion-page
       {:id "app-main-content"}
       (ionic/ion-header
         (ionic/ion-toolbar
           (ionic/ion-buttons {:slot "start"}
             (app-graphs-select))

           (ionic/ion-buttons {:slot "end"}
             (ionic/ion-button
               {:size "small" :fill "clear"
                :on-click (fn []
                            (let [apply-date! (fn [date]
                                                (let [page-name (frontend-date/journal-name (gdate/Date. (js/Date. date)))
                                                      nav-to-journal! #(pages-util/nav-to-block! % {:reload-pages! (fn [] ())})]
                                                  (if-let [journal (handler/local-page page-name)]
                                                    (nav-to-journal! journal)
                                                    (-> (handler/<create-page! page-name)
                                                      (p/then #(nav-to-journal! (handler/local-page page-name)))))))]

                              (if (mobile-util/native-android?)
                                (-> (.showDatePicker mobile-util/ui-local)
                                  (p/then (fn [^js e] (some-> e (.-value) (apply-date!)))))

                                (ui/open-modal!
                                  (fn [{:keys [close!]}]
                                    (ionic/ion-datetime
                                      {:presentation "date"
                                       :onIonChange (fn [^js e]
                                                      (let [val (.-value (.-detail e))]
                                                        (apply-date! val)
                                                        (close!)))}))))))}
               [:span {:slot "icon-only"} (ionic/tabler-icon "calendar-month" {:size 26})])

             (ionic/ion-button {:fill "clear"}
               (ionic/ion-nav-link
                 {:routerDirection "forward"
                  :class "w-full"
                  :component settings/page}
                 [:span {:slot "icon-only"} (ionic/tabler-icon "dots-circle-horizontal" {:size 26})])))))

       ;; main content
       (if db-restoring?
         (ionic/ion-content
           [:strong.flex.justify-center.items-center.py-24
            (ionic/tabler-icon "loader" {:class "animate animate-spin opacity-50" :size 30})])
         (home)))]))

(rum/defc main []
  (let [nav-ref (rum/use-ref nil)
        [_ set-nav-root!] (state/use-nav-root)
        current-repo (frum/use-atom-in fstate/state :git/current-repo)]

    ;; global
    (rum/use-effect!
      (fn []
        (some-> js/window.externalsjs (.settleStatusBar))
        (some-> js/window.externalsjs (.initGlobalListeners)))
      [current-repo])

    ;; navigation
    (rum/use-effect!
      (fn []
        (let [handle-back! (fn []
                             (-> (rum/deref nav-ref) (.pop)))
              ^js back-listener (.addListener App "backButton" handle-back!)]
          #(.remove back-listener)))
      [])

    (rum/use-effect!
      (fn []
        (set-nav-root! (rum/deref nav-ref))
        #())
      [(rum/deref nav-ref)])

    [:> (.-IonApp ionic/ionic-react)
     [:<>
      (ionic/ion-nav {:ref nav-ref
                      :root root                            ;;settings/page
                      :animated true
                      :swipeGesture false})

      (ui/install-notifications)
      (ui/install-modals)]]))