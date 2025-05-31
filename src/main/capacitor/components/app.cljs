(ns capacitor.components.app
  (:require ["../externals.js"]
            ["@capacitor/app" :refer [App]]
            [capacitor.components.search :as search]
            [capacitor.components.settings :as settings]
            [capacitor.components.ui :as ui-component]
            [capacitor.ionic :as ion]
            [capacitor.nav :as nav]
            [capacitor.state :as state]
            [clojure.string :as string]
            [frontend.components.journal :as journal]
            [frontend.components.rtc.indicator :as rtc-indicator]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.conn :as db-conn]
            [frontend.handler.page :as page-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.user :as user-handler]
            [frontend.mobile.action-bar :as action-bar]
            [frontend.mobile.mobile-bar :as mobile-bar]
            [frontend.mobile.util :as mobile-util]
            [frontend.rum :as frum]
            [frontend.state :as fstate]
            [frontend.ui :as ui]
            [goog.date :as gdate]
            [logseq.db :as ldb]
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
    [:.app-graph-select
     (ion/button
      {:fill "clear"
       :mode "ios"
       :class "border-none w-full rounded-lg"
       :on-click (fn []
                   (let [buttons (concat
                                  (for [repo graphs]
                                    {:text (some-> (:url repo) (string/replace #"^logseq_db_" ""))
                                     :role (:url repo)})
                                  [{:text "+ Add new graph"
                                    :role "add-new-graph"}])]
                     (ui-component/open-modal! "Switch graph"
                                               {:type :action-sheet
                                                :buttons buttons
                                                :inputs []
                                                :on-action (fn [e]
                                                             (when-let [role (:role e)]
                                                               (if (= "add-new-graph" role)
                                                                 (when-let [db-name (js/prompt "Create new db")]
                                                                   (when-not (string/blank? db-name)
                                                                     (repo-handler/new-db! db-name)))
                                                                 (when (string/starts-with? role "logseq_db_")
                                                                   (fstate/pub-event! [:graph/switch role])))))})))}
      [:span.flex.items-center.gap-2.opacity-80.pt-1
       [:strong.overflow-hidden.text-ellipsis.block.font-normal
        {:style {:max-width "40vw"}}
        short-repo-name]])]))

(rum/defc bottom-tabs
  []
  (ion/tab-bar
   {:slot "bottom"}
   (ion/tab-button
    {:tab "home"
     :selected true}
    (ion/tabler-icon "home" {:size 22}) "Journals")
   (ion/tab-button
    {:tab "search"}
    (ion/tabler-icon "search" {:size 22}) "Search")
   (ion/tab-button
    {:tab "settings"}
    (ion/tabler-icon "settings" {:size 22}) "Settings")))

(rum/defc keep-keyboard-open
  []
  [:input.absolute.top-4.left-0.w-1.h-1.opacity-0
   {:id "app-keep-keyboard-open-input"}])

(rum/defc journals < rum/reactive
  []
  (let [show-action-bar? (fstate/sub :mobile/show-action-bar?)]
    (ion/content
     (ui-component/classic-app-container-wrap
      [:div.pt-3
       (journal/all-journals)
       (when show-action-bar?
         (action-bar/action-bar))]))))

(rum/defc home < rum/reactive
  {:did-mount (fn [state]
                (ui/inject-document-devices-envs!)
                state)}
  []
  (let [db-restoring? (fstate/sub :db/restoring?)]
    (ion/page
     {:id "app-main-content"}
     (ion/header
      (ion/toolbar
       (ion/buttons {:slot "start"}
                    (app-graphs-select))

       (ion/buttons {:slot "end"}
                    (ion/button
                     {:size "small"
                      :fill "clear"
                      :on-click (fn []
                                  (let [apply-date! (fn [date]
                                                      (let [page-name (date/journal-name (gdate/Date. (js/Date. date)))]
                                                        (if-let [journal (db/get-page page-name)]
                                                          (nav/nav-to-block! journal)
                                                          (-> (page-handler/<create! page-name {:redirect? false})
                                                              (p/then #(nav/nav-to-block! (db/get-page page-name)))))))]

                                    (if (mobile-util/native-platform?)
                                      (-> (.showDatePicker mobile-util/ui-local)
                                          (p/then (fn [^js e] (some-> e (.-value) (apply-date!)))))

                                      (ui-component/open-modal!
                                       (fn [{:keys [close!]}]
                                         (ion/datetime
                                          {:presentation "date"
                                           :onIonChange (fn [^js e]
                                                          (let [val (.-value (.-detail e))]
                                                            (apply-date! val)
                                                            (close!)))}))))))}
                     [:span.text-muted-foreground {:slot "icon-only"}
                      (ion/tabler-icon "calendar-month" {:size 24})])

                    (let [repo (fstate/get-current-repo)]
                      [:div.flex.flex-row.items-center.gap-2.text-muted-foreground
                       (when (and repo
                                  (ldb/get-graph-rtc-uuid (db/get-db))
                                  (user-handler/logged-in?)
                                  (config/db-based-graph? repo)
                                  (user-handler/team-member?))
                         [:<>
                  ;; (rum/with-key (rtc-collaborators)
                  ;;   (str "collab-" repo))
                          (rtc-indicator/indicator)
                  ;; (when (user-handler/logged-in?)
                  ;;   (rtc-indicator/downloading-detail))
                  ;; (when (user-handler/logged-in?)
                  ;;   (rtc-indicator/uploading-detail))
                          ])]))))

      ;; main content
     (if db-restoring?
       (ion/content
        [:strong.flex.justify-center.items-center.py-24
         (ion/tabler-icon "loader" {:class "animate animate-spin opacity-50" :size 30})])
       (journals)))))

(rum/defc settings
  []
  (ion/page
   {:id "settings-tab"}
   (ion/header
    (ion/toolbar
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
    (ion/tabs
     {:onIonTabsDidChange (fn [^js e]
                            (state/set-tab! (.-tab (.-detail e))))}
     (ion/tab
      {:tab "home"}
      (ion/nav {:ref nav-ref
                :root home                                ;;settings/page
                :animated true
                :swipeGesture true}))
     (ion/tab
      {:tab "search"}
      (ion/content
       (search/search)))
     (ion/tab
      {:tab "settings"}
      (ion/content
       (settings/page)))
     (bottom-tabs)

     (keep-keyboard-open)
     (ui-component/install-notifications)
     (ui-component/install-modals)

     (shui-toaster/install-toaster)
     (shui-dialog/install-modals)
     (shui-popup/install-popups))))

(defn use-theme-effects!
  [current-repo]
  (let [[theme] (frum/use-atom-in fstate/state :ui/theme)]
    (hooks/use-effect!
     #(let [^js doc js/document.documentElement
            ^js cls (.-classList doc)
            ^js cls-body (.-classList js/document.body)]
        (.setAttribute doc "data-theme" theme)
        (if (= theme "dark")                               ;; for tailwind dark mode
          (do (.add cls "dark") (.add cls "ion-palette-dark")
              (doto cls-body (.remove "light-theme") (.add "dark-theme")))
          (do (.remove cls "dark") (.remove cls "ion-palette-dark")
              (doto cls-body (.remove "dark-theme") (.add "light-theme")))))
     [theme]))

  (hooks/use-effect!
   (fn []
     (some-> js/window.externalsjs (.settleStatusBar)))
   [current-repo]))

(defn use-navigation-effects!
  []
  (hooks/use-effect!
   (fn []
     (let [handle-back!
           (fn []
             (cond
               (seq (ui-component/get-modal))
               (ui-component/close-modal!)

               (seq (shui-dialog/get-modal (shui-dialog/get-first-modal-id)))
               (shui-dialog/close!)

               (seq (fstate/get-selection-blocks))
               (fstate/clear-selection!)

               :else
               (-> (nav/nav-length?)
                   (p/then (fn [len]
                             (if (= len 1)
                               (.exitApp App)
                               (nav/nav-pop!))))))
             (fstate/clear-edit!))
           ^js back-listener (.addListener App "backButton" handle-back!)]
       #(.remove back-listener)))
   []))

(rum/defc main []
  (let [[current-repo] (frum/use-atom-in fstate/state :git/current-repo)]

    (use-theme-effects! current-repo)
    (use-navigation-effects!)

    [:<>
     (tabs)
     (mobile-bar/mobile-bar)]))
