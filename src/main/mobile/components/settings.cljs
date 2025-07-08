(ns mobile.components.settings
  "Mobile settings"
  (:require [frontend.components.repo :as repo]
            [frontend.components.user.login :as login]
            [frontend.handler.user :as user-handler]
            [frontend.state :as state]
            [logseq.shui.ui :as shui]
            [logseq.shui.silkhq :as silkhq]
            [mobile.components.ui :as ui-component]
            [mobile.ionic :as ion]
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

(rum/defc silk-bottom-sheet
  []
  (silkhq/bottom-sheet
    (silkhq/bottom-sheet-trigger
      (shui/button "open bottom sheet / trigger"))
    (silkhq/bottom-sheet-portal
      (silkhq/bottom-sheet-view
        (silkhq/bottom-sheet-backdrop)
        (silkhq/bottom-sheet-content
          {:class "flex flex-col justify-center items-center p-2"}
          (silkhq/bottom-sheet-handle)
          [:div.py-24.flex
           [:h1.my-4.text-2xl "hello silkhq"]])))
    ))

(rum/defc page < rum/reactive
  []
  (let [login? (and (state/sub :auth/id-token) (user-handler/logged-in?))]
    (ion/page
     (ion/header
      (ion/toolbar
       (ion/title "Settings")
       (let [buttons (->> [(when login?
                             {:text "Logout" :role "logout"})
                           {:text "Report bug" :role "report-bug"}]
                          (remove nil?))]
         (ion/buttons {:slot "end"}
                      (ion/button
                       {:size "small"
                        :fill "clear"
                        :on-click (fn [_e]
                                    (ui-component/open-modal! "Settings"
                                                              {:type :action-sheet
                                                               :buttons buttons
                                                               :inputs []
                                                               :on-action (fn [e]
                                                                            (when-let [role (:role e)]
                                                                              (case role
                                                                                "logout"
                                                                                (user-handler/logout)
                                                                                "report-bug"
                                                                                (js/window.open "https://github.com/logseq/db-test/issues" "_blank")
                                                                                nil)))
                                                               :modal-props {:class "graph-switcher"}}))}
                       [:span.text-muted-foreground {:slot "icon-only"}
                        (ion/tabler-icon "dots" {:size 20})])))))
      (ion/content {:class "ion-padding"}
        (user-profile login?)
        [:div.mt-8
         (repo/repos-cp)]
        (silk-bottom-sheet)))))
