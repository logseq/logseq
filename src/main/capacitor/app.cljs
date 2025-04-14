(ns capacitor.app
  (:require ["@capacitor/app" :refer [App]]
            [rum.core :as rum]
            [promesa.core :as p]
            [capacitor.ionic :as ionic]
            [capacitor.state :as state]
            [capacitor.pages.settings :as settings]))

(rum/defc home []
  (let [[open? set-open!] (rum/use-state false)
        [selected-src set-selected-src] (rum/use-state nil)]
    (ionic/ion-content
      [:div.mt-12
       [:h1.text-6xl.text-center.py-20.border.p-8.m-2.rounded-xl
        "Hello World, capacitor!"]
       [:p.flex.p-4.justify-center.bg-gray-03.flex-col.gap-6
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
      (ionic/ion-tab-bar {:color "light"
                          :class "w-full fixed bottom-4"}
        (ionic/ion-tab-button {:tab "tab1"
                               :selected true
                               :on-click #(js/alert "home")}
          (ionic/tabler-icon "home" {:size 22}) "Home")
        (ionic/ion-tab-button {:tab "tab0"
                               :selected false}
          (ionic/tabler-icon "circle-plus" {:size 24}) "Capture New")
        (ionic/ion-tab-button {:tab "tab2"}
          (ionic/tabler-icon "settings" {:size 22}) "Settings"))
      )))

(rum/defc main []
  (let [nav-ref (rum/use-ref nil)
        [_ set-nav-root!] (state/use-nav-root)]
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
                     :animated false :swipeGesture false})]))