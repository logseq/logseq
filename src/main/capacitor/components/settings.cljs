(ns capacitor.components.settings
  (:require [capacitor.ionic :as ion]
            [capacitor.state :as state]
            [frontend.components.repo :as repo]
            [frontend.components.user.login :as login]
            [frontend.handler.user :as user-handler]
            [frontend.state :as fstate]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

(comment
  (rum/defc all-graphs < rum/reactive
    []
    (let [graphs (fstate/sub :rtc/graphs)]
      [:div.py-4
       [:div.flex.justify-between.items-center
        [:h2.text-xl.font-medium.my-3.flex.gap-2.items-center.opacity-80
         (shui/tabler-icon "server" {:size 22}) "Your RTC graphs"]

        (ion/button
         {:mode "ios" :size "small" :color "secondary"
          :on-click (fn [] (rtc-handler/<get-remote-graphs))} "refresh")]

       [:ul
        (for [{:keys [url GraphName GraphSchemaVersion]} graphs]
          [:li
           [:p.inline-flex.items-center.gap-1
            [:a.text-lg.mr-2 GraphName]] [:code "ver." GraphSchemaVersion]])]])))

(rum/defc user-profile < rum/reactive
  []
  (let [login? (and (fstate/sub :auth/id-token) (user-handler/logged-in?))]
    (if-not login?
      [:h1.text-3xl.font-bold.underline
       [:a {:on-click #(shui/dialog-open! login/page-impl
                                          {:close-btn? false
                                           :align :top
                                           :content-props {:class "app-login-modal"}})} "login"]]
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
                  (user-profile)
                  [:div.mt-8
                   (repo/repos-cp)]))))
