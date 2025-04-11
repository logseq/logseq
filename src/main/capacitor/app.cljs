(ns capacitor.app
  (:require [rum.core :as rum]
            [capacitor.ionic :as ionic]))

(rum/defc main
  []
  [:> (.-IonApp ionic/ionic-react)
   [:div
    [:h1.text-6xl.text-center.py-20.border.p-8.m-2.rounded-xl
     "Hello World, capacitor!"]
    [:p.flex.p-4.justify-center.bg-gray-03.flex-col
     (ionic/ion-button {:on-click #(js/alert "hello click me!")} "Default primary")
     (ionic/ion-button {:color "secondary"} "Primary Button")
     (ionic/ion-button {:color "danger"} "Danger button")]]
   ])