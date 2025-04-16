(ns capacitor.app
  (:require ["@capacitor/app" :refer [App]]
            ["@capacitor/status-bar" :refer [StatusBar Style]]
            [rum.core :as rum]
            [promesa.core :as p]
            [capacitor.ionic :as ionic]
            [capacitor.state :as state]
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

(rum/defc home []
  (let [[open? set-open!] (rum/use-state false)
        [selected-src set-selected-src] (rum/use-state nil)]

    (rum/use-effect!
      (fn []
        (js/setTimeout
          (fn []
            (.setStyle StatusBar #js {:style (.-Light Style)})
            (.setBackgroundColor StatusBar #js {:color "#ffffff"}))
          200)
        #())
      [])

    [:<>
     (app-sidebar)

     (ionic/ion-page
       {:id "app-main-content"}
       (ionic/ion-header
         (ionic/ion-toolbar
           (ionic/ion-buttons {:slot "start"}
             (ionic/ion-menu-button)
             (ionic/ion-button {:class "opacity-90"} (ionic/tabler-icon "search" {:size 22 :stroke 2}))
             )
           [:a.px-2 {:slot "end"}
            (ionic/tabler-icon "help" {:size 24 :class "opacity-70"})]))
       (ionic/ion-content
         [:div.pt-10.px-8
          [:h1.text-3xl.font-mono.font-bold.py-2 "Suggested"]
          [:p.flex.py-4.justify-center.bg-gray-03.flex-col.gap-6
           (ionic/ion-button {:on-click #(js/alert "hello click me!")
                              :size "large"}
             "Default primary")
           (ionic/ion-button {:color "warning"
                              :size "large"
                              :fill "outline"
                              :on-click #(set-open! true)} "Primary Button")
           (ionic/ion-button {:color "success"
                              :size "large"
                              :on-click
                              (fn []
                                (-> ionic/ionic-camera
                                  (.getPhoto
                                    #js {:source "PHOTOS"
                                         :resultType (.-DataUrl ionic/ionic-camera-result-type)})
                                  (p/then #(set-selected-src (.-dataUrl %)))))}
             [:span.pl-2 {:slot "end"} (ionic/tabler-icon "cloud-upload" {:size 22})]
             [:strong "获取图片"]
             (ionic/ion-badge {:color "danger"} "99+"))

           [:<>
            (ionic/ion-datetime-button {:datetime "datetime"})
            (ionic/ion-modal
              {:keepContentsMounted true}
              (ionic/ion-datetime {:id "datetime"}))]]

          [:div.p-4.flex.justify-center
           (ionic/ion-nav-link
             {:routerDirection "forward"
              :component settings/page}
             (ionic/ion-button {:size "large"} "Go to settings page")
             )]

          ;; selected image
          (when selected-src
            [:p.p-3.flex.items-center.justify-center
             [:img {:src selected-src :width "70%"}]])

          ;; alert
          (ionic/ion-alert {:is-open open?
                            :onDidDismiss #(set-open! false)
                            :buttons ["Action"]
                            :message "hello alert?"})]

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
         ))]))

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
     (ionic/ion-nav {:ref nav-ref :root home
                     :animated true :swipeGesture false})]))