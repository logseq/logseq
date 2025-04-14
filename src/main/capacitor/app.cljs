(ns capacitor.app
  (:require [rum.core :as rum]
            [promesa.core :as p]
            [capacitor.ionic :as ionic]))

(rum/defc home []
  (let [[open? set-open!] (rum/use-state false)
        [selected-src set-selected-src] (rum/use-state nil)]
    (ionic/ion-content
      [:div.mt-12
       [:h1.text-6xl.text-center.py-20.border.p-8.m-2.rounded-xl
        "Hello World, capacitor!"]
       [:p.flex.p-4.justify-center.bg-gray-03.flex-col.gap-6
        (ionic/ion-button {:on-click #(js/alert "hello click me!")} "Default primary")
        (ionic/ion-button {:color "warning"
                           :size "small"
                           :fill "clear"
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
          "获取图片" (ionic/ion-badge {:color "danger"} "99+")
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
  [:> (.-IonApp ionic/ionic-react) (home)])