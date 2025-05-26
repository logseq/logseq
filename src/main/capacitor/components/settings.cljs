(ns capacitor.components.settings
  (:require [capacitor.ionic :as ion]
            [capacitor.state :as state]
            [frontend.components.user.login :as login]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

(rum/defc all-pages
  [])

(rum/defc page
  []
  (let [[^js nav] (state/use-nav-root)]
    (ion/page
      (ion/header
        (ion/toolbar
          (ion/title "Settings")
          (ion/buttons {:slot "end"}
            (ion/button {:fill "clear"
                         :on-click #(.pop nav)}
              (ion/tabler-icon "help" {:size 26})))))

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

        [:h1.text-3xl.font-bold.underline
         [:a {:on-click #(shui/dialog-open! login/page-impl
                           {:close-btn? false
                            :align :top
                            :content-props {:class "app-login-modal"}})} "login"]]
        ))))
