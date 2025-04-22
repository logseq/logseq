(ns capacitor.app
  (:require ["@capacitor/app" :refer [App]]
            ["@capacitor/status-bar" :refer [StatusBar Style]]
            [frontend.db.react :as react]
            [frontend.util :as util]
            [rum.core :as rum]
            [promesa.core :as p]
            [capacitor.ionic :as ionic]
            [capacitor.state :as state]
            [capacitor.handler :as handler]
            [capacitor.pages.utils :as pages-util]
            [frontend.db-mixins :as db-mixins]
            [frontend.state :as fstate]
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

(defn- sub-journals
  []
  (-> (react/q (fstate/get-current-repo)
        [:frontend.worker.react/journals]
        {:async-query-fn
         (fn []
           (p/let [{:keys [data]} (handler/<load-view-data nil {:journals? true})]
             (remove nil? data)))}
        nil)
    util/react))

(rum/defc journals-list < rum/reactive db-mixins/query
  []
  (let [journals (sub-journals)]

    [:pre
     (prn-str journals)]))

(rum/defc home []
  (let [[all-pages set-all-pages!] (rum/use-state [])
        [reload set-reload!] (rum/use-state 0)]

    (rum/use-effect!
      (fn []
        (set-all-pages! (handler/get-all-pages))
        #())
      [reload])

    (ionic/ion-content
      [:div.pt-6.px-6
       [:h1.text-3xl.font-mono.font-bold.py-2 "Current graph"]
       [:h2.py-1.text-lg (fstate/get-current-repo)]

       [:h1.text-3xl.font-mono.font-bold.py-2.mt-4 "Journals"]
       [:ul.pt-2
        (journals-list)]

       [:div.flex.justify-between.items-center.pt-4
        [:h1.text-3xl.font-mono.font-bold.py-2
         "All pages"
         [:small.text-xs.pl-2.opacity-50 (count all-pages)]]

        (ionic/ion-button {:size "small" :fill "clear" :on-click #(set-reload! (inc reload))}
          [:span {:slot "icon-only"} (ionic/tabler-icon "refresh")])]
       [:ul.mb-24.pt-2
        (for [page all-pages]
          (let [ident (some-> (:block/tags page) first :db/ident)]
            [:li.font-mono.flex.items-center.py-1.active:opacity-50.active:underline.whitespace-nowrap
             {:on-click #(pages-util/nav-to-block! page)}
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

(rum/defc root <
  rum/reactive
  {:did-mount
   (fn [s]
     (js/setTimeout
       (fn []
         (.setStyle StatusBar #js {:style (.-Light Style)})
         (.setBackgroundColor StatusBar #js {:color "#ffffff"}))
       300)
     s)}
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
               (ionic/tabler-icon "help" {:size 24 :class "opacity-70"})))))
       ;; main content
       (if db-restoring?
         (ionic/ion-content
           [:strong.flex.justify-center.items-center.py-24
            (ionic/tabler-icon "loader" {:class "animate animate-spin opacity-50" :size 30})])
         (home)))]))

(rum/defc main []
  (let [nav-ref (rum/use-ref nil)
        [_ set-nav-root!] (state/use-nav-root)]

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
     (ionic/ion-nav {:ref nav-ref :root root
                     :animated true :swipeGesture false})]))