(ns capacitor.app
  (:require ["@capacitor/app" :refer [App]]
            ["@capacitor/status-bar" :refer [StatusBar Style]]
            ["./externals.js"]
            [clojure.string :as string]
            [frontend.db.react :as react]
            [frontend.util :as util]
            [rum.core :as rum]
            [promesa.core :as p]
            [capacitor.ionic :as ionic]
            [capacitor.state :as state]
            [capacitor.handler :as handler]
            [capacitor.pages.utils :as pages-util]
            [capacitor.components.ui :as ui]
            [frontend.db-mixins :as db-mixins]
            [frontend.state :as fstate]
            [frontend.db.utils :as db-util]
            [frontend.date :as frontend-date]
            [frontend.handler.repo :as repo-handler]
            [goog.date :as gdate]
            [logseq.db :as ldb]
            [capacitor.pages.settings :as settings]))

(rum/defc app-sidebar []
  (ionic/ion-menu {:content-id "app-main-content"
                   :type "push"}
    (ionic/ion-header
      (ionic/ion-toolbar
        [:strong.px-2 {:slot "start"} "Navigations"]))
    (ionic/ion-content
      [:div.p-4
       [:strong "hello, logseq?"]])))

(rum/defc journals-list < rum/reactive db-mixins/query
  []
  (let [journals (handler/sub-journals)]
    [:ul
     (for [journal-id journals]
       (let [journal (db-util/entity journal-id)]
         [::li.font-mono.flex.items-center.py-1.active:opacity-50.active:underline.whitespace-nowrap
          {:on-click #(pages-util/nav-to-block! journal {:reload-pages! (fn [] ())})}
          (ionic/tabler-icon "calendar")
          [:span.pl-1 (:block/title journal)]]))]))

(rum/defc create-page-input
  [{:keys [close! reload-pages!]}]
  (ionic/ion-alert
    {:is-open true
     :header "Create new page"
     :onWillDismiss (fn [^js e]
                      (let [^js detail (.-detail e)]
                        (when-let [val (and (= "confirm" (.-role detail))
                                         (aget (.-values (.-data detail)) 0))]
                          (-> (handler/<create-page! val)
                            (p/finally reload-pages!)))
                        (close!)))
     :onDidPresent (fn [^js e]
                     (let [^js target (.-target e)]
                       (when-let [input (.querySelector target "input")]
                         (js/setTimeout #(.focus input)))))
     :buttons [#js {:text "Cancel"
                    :role "cancel"}
               #js {:text "Confirm"
                    :role "confirm"}]
     :inputs [#js {:placeholder "page name"
                   :auto-focus true}]}))

(rum/defc home []
  (let [[all-pages set-all-pages!] (rum/use-state [])
        [reload set-reload!] (rum/use-state 0)
        [page-input-open? set-page-input-open?] (rum/use-state false)
        [filtered-pages set-filtered-pages!] (rum/use-state [])]

    (rum/use-effect!
      (fn []
        (set-all-pages! (handler/local-all-pages))
        #())
      [reload])

    (rum/use-effect!
      (fn []
        (let [pages (filterv (fn [page]
                               (let [ident (some-> (:block/tags page) first :db/ident)]
                                 (not (contains? #{:logseq.class/Journal :logseq.class/Property} ident))))
                      all-pages)]
          (set-filtered-pages! pages))
        #())
      [all-pages])

    (ionic/ion-content
      (when page-input-open?
        (create-page-input {:close! #(set-page-input-open? false)
                            :reload-pages! #(set-reload! (inc reload))}))
      [:div.pt-6.px-6
       [:div.flex.justify-between.items-center
        [:h1.text-3xl.font-mono.font-bold.py-2 "Current graph"]

        (ionic/ion-button {:size "small"
                           :fill "clear"
                           :on-click (fn []
                                       (when-let [db-name (js/prompt "Create new db")]
                                         (when-not (string/blank? db-name)
                                           (-> (repo-handler/new-db! db-name)
                                             (p/then #(set-reload! (inc reload)))))))}
          [:span {:slot "icon-only"} (ionic/tabler-icon "plus" {:size 22})])]
       [:h2.py-1.text-lg (fstate/get-current-repo)]

       [:div.flex.justify-between.items-center.mt-4
        [:h1.text-3xl.font-mono.font-bold.py-2 "Journals"]
        [:flex.gap-1
         (ionic/ion-button
           {:size "small" :fill "clear"
            :on-click (fn []
                        (ui/open-modal!
                          (fn [{:keys [close!]}]
                            (ionic/ion-datetime
                              {:presentation "date"
                               :onIonChange (fn [^js e]
                                              (let [val (.-value (.-detail e))]
                                                (let [page-name (frontend-date/journal-name (gdate/Date. (js/Date. val)))
                                                      nav-to-journal! #(pages-util/nav-to-block! % {:reload-pages! (fn [] ())})]
                                                  (if-let [journal (handler/local-page page-name)]
                                                    (nav-to-journal! journal)
                                                    (-> (handler/<create-page! page-name)
                                                      (p/then #(nav-to-journal! (handler/local-page page-name)))))
                                                  (close!))))}))))}
           [:span {:slot "icon-only"} (ionic/tabler-icon "calendar" {:size 22})])]]

       (journals-list)

       ;(when journal-calendar-open?
       ;  (journals-calendar-modal {:close! #(set-journal-calendar-open? false)}))

       [:div.flex.justify-between.items-center.pt-4
        [:h1.text-3xl.font-mono.font-bold.py-2
         "All pages"
         [:small.text-xs.pl-2.opacity-50 (count filtered-pages)]]

        [:div.flex.gap-1
         (ionic/ion-button {:size "small" :fill "clear" :on-click #(set-page-input-open? true)}
           [:span {:slot "icon-only"} (ionic/tabler-icon "file-plus" {:size 22})])
         ;(ionic/ion-button {:size "small" :fill "clear" :on-click #(set-reload! (inc reload))}
         ;  [:span {:slot "icon-only"} (ionic/tabler-icon "refresh")])
         ]]
       [:ul.mb-24.pt-2
        (for [page filtered-pages]
          (let [ident (some-> (:block/tags page) first :db/ident)]
            [:li.font-mono.flex.items-center.py-1.active:opacity-50.active:underline.whitespace-nowrap
             {:on-click #(pages-util/nav-to-block! page {:reload-pages! (fn [] (set-reload! (inc reload)))})}
             (case ident
               :logseq.class/Property (ionic/tabler-icon "letter-t")
               :logseq.class/Page (ionic/tabler-icon "file")
               :logseq.class/Journal (ionic/tabler-icon "calendar")
               (ionic/tabler-icon "hash"))
             [:span.pl-1 (:block/title page)]
             [:code.opacity-30.scale-75 (.toLocaleDateString (js/Date. (:block/created-at page)))]]))]]

      ;; tabbar
      ;(ionic/ion-tab-bar {:color "light"
      ;                    :class "w-full fixed bottom-4"}
      ;  (ionic/ion-tab-button {:tab "tab1"
      ;                         :selected true
      ;                         :on-click #(js/alert "home")}
      ;    (ionic/tabler-icon "home" {:size 22}) "Home")
      ;  (ionic/ion-tab-button {:tab "tab0"
      ;                         :selected false}
      ;    (ionic/tabler-icon "circle-plus" {:size 24}) "Capture New")
      ;  (ionic/ion-tab-button {:tab "tab2"}
      ;    (ionic/tabler-icon "settings" {:size 22}) "Settings"))
      )
    ))

(rum/defc root < rum/reactive
  []
  (let [db-restoring? (fstate/sub :db/restoring?)]
    [:<>
     (app-sidebar)

     (ionic/ion-page
       {:id "app-main-content"}
       (ionic/ion-header
         (ionic/ion-toolbar
           (ionic/ion-buttons {:slot "start"}
             (ionic/ion-menu-button)
             (ionic/ion-button {:class "opacity-90"} (ionic/tabler-icon "search" {:size 22 :stroke 2})))

           (ionic/ion-button
             {:slot "end"
              :fill "clear"}
             (ionic/ion-nav-link
               {:routerDirection "forward"
                :class "w-full"
                :component settings/page}
               (ionic/tabler-icon "upload" {:size 24 :class "opacity-70"})))))
       ;; main content
       (if db-restoring?
         (ionic/ion-content
           [:strong.flex.justify-center.items-center.py-24
            (ionic/tabler-icon "loader" {:class "animate animate-spin opacity-50" :size 30})])
         (home)))]))

(rum/defc main []
  (let [nav-ref (rum/use-ref nil)
        [_ set-nav-root!] (state/use-nav-root)]

    ;; global
    (rum/use-effect!
      (fn []
        (some-> js/window.externalsjs (.settleStatusBar))
        (some-> js/window.externalsjs (.initGlobalListeners)))
      [])

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
      (ionic/ion-nav {:ref nav-ref :root root
                      :animated true :swipeGesture false})

      (ui/install-notifications)
      (ui/install-modals)]]))