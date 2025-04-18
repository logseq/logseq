(ns capacitor.pages.settings
  (:require [rum.core :as rum]
            [capacitor.state :as state]
            [capacitor.ionic :as ionic]))

(rum/defc page
  []
  (let [[^js nav] (state/use-nav-root)]
    (ionic/ion-page
      (ionic/ion-header
        (ionic/ion-toolbar
          (ionic/ion-buttons {:slot "start"}
            (ionic/ion-button {:fill "clear"
                               :on-click #(.pop nav)}
              (ionic/tabler-icon "arrow-left" {:size 26})))

          (ionic/ion-buttons {:slot "end"}
            (ionic/ion-button {:fill "clear"
                               :on-click #(.pop nav)}
              (ionic/tabler-icon "share" {:size 26})))

          (ionic/ion-title "Settings")))

      (ionic/ion-content {:class "ion-padding"}
        (ionic/ion-refresher {:slot "fixed"
                              :pull-factor 0.5
                              :pull-min 100
                              :pull-max 200
                              :on-ion-refresh (fn [^js e]
                                                (js/setTimeout
                                                  #(.complete (.-detail e))
                                                  3000))}
          (ionic/ion-refresher-content))
        [:p.text-xl
         "settings page!"
         (ionic/ion-list
           (ionic/ion-item {:label "text 1"}
             (ionic/ion-input {:placeholder "hi"}))
           (ionic/ion-item {:label "number 2"}
             (ionic/ion-input))
           )]))))
