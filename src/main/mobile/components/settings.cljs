(ns mobile.components.settings
  "Mobile settings"
  (:require [mobile.ionic :as ion]
            [frontend.components.repo :as repo]
            [frontend.components.user.login :as login]
            [frontend.handler.user :as user-handler]
            [frontend.state :as state]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

(rum/defc user-profile < rum/reactive
  []
  (let [login? (and (state/sub :auth/id-token) (user-handler/logged-in?))]
    (if-not login?
      (shui/button
       {:variant :default
        :class "text-1xl flex flex-1 w-full"
        :on-click #(shui/dialog-open! login/page-impl
                                      {:close-btn? false
                                       :align :top
                                       :content-props {:class "app-login-modal"}})}
       "Login")
      [:div.py-2
       [:h2.py-3.flex.justify-between.items-center
        [:strong.text-4xl.font-semibold (user-handler/username)]
        (ion/button {:size "small"
                     :mode "ios"
                     :fill "outline"
                     :color "danger"
                     :on-click user-handler/logout} "logout")]
       [:code (user-handler/email)]])))

(rum/defc page
  []
  (ion/page
    (ion/header
      (ion/toolbar
        (ion/title "Settings")))
    (ion/content {:class "ion-padding"}
      (user-profile)
      [:div.mt-8
       (repo/repos-cp)])))
