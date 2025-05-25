(ns capacitor.components.settings
  (:require [capacitor.ionic :as ion]
            [capacitor.state :as state]
            [rum.core :as rum]))

(rum/defc all-pages
  [])

(rum/defc page
  []
  (let [[^js nav] (state/use-nav-root)]
    (ion/page
     (ion/header
      (ion/toolbar
       (ion/buttons {:slot "start"}
                    (ion/button {:fill "clear"
                                 :on-click #(.pop nav)}
                                (ion/tabler-icon "arrow-left" {:size 26})))

       (ion/buttons {:slot "end"}
                    (ion/button {:fill "clear"
                                 :on-click #(.pop nav)}
                                (ion/tabler-icon "share" {:size 26})))

       (ion/title "Settings")))

     (ion/content {:class "ion-padding"}
                  (ion/refresher
                   {:slot "fixed"
                    :pull-factor 0.5
                    :pull-min 100
                    :pull-max 200
                    :on-ion-refresh (fn [^js e]
                                      (js/setTimeout
                                       #(.complete (.-detail e))
                                       3000))}
                   (ion/refresher-content))

                  (all-pages)))))
