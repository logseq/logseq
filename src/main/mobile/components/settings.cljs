(ns mobile.components.settings
  "Mobile settings"
  (:require [frontend.components.repo :as repo]
            [frontend.components.user.login :as login]
            [frontend.handler.user :as user-handler]
            [frontend.state :as state]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

(rum/defc user-profile
  [login?]
  (if-not login?
    (shui/button
     {:variant :default
      :class "text-1xl flex flex-1 w-full my-8"
      :on-click #(shui/dialog-open! login/page-impl
                                    {:close-btn? false
                                     :align :top
                                     :content-props {:class "app-login-modal"}})}
     "Login")
    [:div.py-2
     [:h2.py-3.flex.justify-between.items-center
      [:strong.text-4xl.font-semibold (user-handler/username)]]
     [:div.text-sm.text-muted-foreground.px-1 (user-handler/email)]]))

(rum/defc page < rum/reactive
  []
  (let [login? (and (state/sub :auth/id-token)
                    (user-handler/logged-in?))]
    [:div.app-index-settings
     (user-profile login?)
     [:div.mt-8
      (repo/repos-cp)]]))
