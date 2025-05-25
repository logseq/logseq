(ns capacitor.app
  (:require ["./externals.js"]
            ["@capacitor/app" :refer [App]]
            ["@capacitor/status-bar" :refer [StatusBar Style]]
            [capacitor.components.blocks :as cc-blocks]
            [capacitor.components.nav-utils :as cc-utils]
            [capacitor.components.settings :as settings]
            [capacitor.components.ui :as ui]
            [capacitor.handler :as handler]
            [capacitor.ionic :as ionic]
            [capacitor.state :as state]
            [clojure.string :as string]
            [frontend.components.journal :as journal]
            [frontend.date :as frontend-date]
            [frontend.db-mixins :as db-mixins]
            [frontend.db.conn :as db-conn]
            [frontend.db.utils :as db-util]
            [frontend.handler.repo :as repo-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.rum :as frum]
            [frontend.state :as fstate]
            [goog.date :as gdate]
            [logseq.shui.dialog.core :as shui-dialog]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.popup.core :as shui-popup]
            [logseq.shui.toaster.core :as shui-toaster]
            [promesa.core :as p]
            [rum.core :as rum]))

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

(rum/defc bottom-tabs
  []
  (ionic/ion-tab-bar
   {:slot "bottom"}
   (ionic/ion-tab-button
    {:tab "home"
     :selected true}
    (ionic/tabler-icon "home" {:size 22}) "Journals")
   (ionic/ion-tab-button
    {:tab "search"}
    (ionic/tabler-icon "search" {:size 22}) "Search")
   (ionic/ion-tab-button
    {:tab "settings"}
    (ionic/tabler-icon "settings" {:size 22}) "Settings")))

(rum/defc journals-list < rum/reactive db-mixins/query
  []
  (let [journals (handler/sub-journals)]
    [:ul.app-journals-list
     (for [journal-id journals]
       (let [journal (db-util/entity journal-id)]
         [:li.flex.py-1.flex-col.w-full
          [:h1.font-semibold.opacity-90.active:opacity-50
           {:on-click #(cc-utils/nav-to-block! journal {:reload-pages! (fn [] ())})}
           (:block/title journal)]
          ;; blocks editor
          (cc-blocks/page-blocks journal)]))]))

(rum/defc contents-playground < rum/reactive db-mixins/query
  []

  [:div.py-4
   [:h1.text-4xl.flex.gap-1.items-center.mb-4.pt-2.font-mono
    (ionic/tabler-icon "file" {:size 30}) "Contents"]
   (cc-blocks/page-blocks "Contents")])

(rum/defc keep-keyboard-open
  []
  [:input.absolute.top-4.left-0.w-1.h-1.opacity-0
   {:id "app-keep-keyboard-open-input"}])

(rum/defc journals []
  (let [[reload set-reload!] (hooks/use-state 0)]
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
      [:main#app-container-wrapper.ls-fold-button-on-right
       [:div#app-container
        [:div#main-container.flex.flex-1
         [:div#main-content-container.w-full
          (journal/all-journals)]]]]])))

(rum/defc home < rum/reactive
  []
  (let [db-restoring? (fstate/sub :db/restoring?)]
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
                                                                  nav-to-journal! #(cc-utils/nav-to-block! % {:reload-pages! (fn [] ())})]
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
       (journals)))))

(rum/defc search
  []
  (ionic/ion-page
   {:id "search-tab"}
   (ionic/ion-header
    (ionic/ion-toolbar
     "Search"))
   [:div.flex.flex-1.p-4 "Search results"]))

(rum/defc settings
  []
  (ionic/ion-page
   {:id "settings-tab"}
   (ionic/ion-header
    (ionic/ion-toolbar
     "Settings"))
   [:div.flex.flex-1.p-4 "TODO..."]))

(rum/defc tabs
  []
  (let [nav-ref (hooks/use-ref nil)
        [_ set-nav-root!] (state/use-nav-root)]
    (hooks/use-effect!
     (fn []
       (when-let [nav (rum/deref nav-ref)]
         (set-nav-root! nav))
       #())
     [(rum/deref nav-ref)])
    (ionic/ion-tabs
     (ionic/ion-tab
      {:tab "home"}
      (ionic/ion-nav {:ref nav-ref
                      :root home                            ;;settings/page
                      :animated true
                      :swipeGesture true}))
     (ionic/ion-tab
      {:tab "search"}
      (ionic/ion-content
       (search)))
     (ionic/ion-tab
      {:tab "settings"}
      (ionic/ion-content
       (settings)))
     (bottom-tabs))))

(rum/defc main []
  (let [current-repo (frum/use-atom-in fstate/state :git/current-repo)]
    ;; global
    (hooks/use-effect!
     (fn []
       (some-> js/window.externalsjs (.settleStatusBar))
       (some-> js/window.externalsjs
               (.initGlobalListeners #js {:onKeyboardHide (fn [] (state/exit-editing!))})))
     [current-repo])

    ;; navigation
    (hooks/use-effect!
     (fn []
       (let [handle-back!
             (fn []
               (cond
                 (not (nil? (state/get-editing-block)))
                 (state/exit-editing!)

                 (seq (ui/get-modal))
                 nil

                 :else
                 (-> (cc-utils/nav-length?)
                     (p/then (fn [len]
                               (if (= len 1)
                                 (.exitApp App)
                                 (cc-utils/nav-pop!)))))))
             ^js back-listener (.addListener App "backButton" handle-back!)]
         #(.remove back-listener)))
     [])

    (tabs)))
