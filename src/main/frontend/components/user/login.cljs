(ns frontend.components.user.login
  (:require ["/frontend/amplify"]
            [rum.core :as rum]
            [frontend.rum :refer [adapt-class]]
            [frontend.handler.user :as user]
            [cljs-bean.core :as bean]
            [frontend.ui :as ui]
            [frontend.state :as state]))

(def setupAuthConfigure! (.-setupAuthConfigure js/LSAmplify))
(def LSAuthenticator
  (adapt-class (.-LSAuthenticator js/LSAmplify)))

(defn- setup-configure!
  []
  (setupAuthConfigure!
    #js {:region                 "us-east-2",
         :userPoolId             "us-east-2_kAqZcxIeM",
         :userPoolWebClientId    "3ji1a0059hspovjq5fhed3uil8",
         :cookieStorage          #js {:domain   "localhost",
                                      :path     "/",
                                      :expires  365,
                                      :sameSite "strict",
                                      :secure   true},
         :authenticationFlowType "USER_SRP_AUTH"}))

(rum/defc user-pane
  [sign-out! user]
  (let [session (:signInUserSession user)]

    (rum/use-effect!
      #(user/login-callback session)
      [])

    (when session
      [:main.max-w-screen-sm.p-6
       [:h1.text-3xl.mb-2.flex.justify-between
        (str "Hi, " (:username user))

        [:span (ui/button "Logout" :on-click sign-out!)]]
       [:pre.text-sm.whitespace-pre-wrap (with-out-str (cljs.pprint/pprint session))]])))

(rum/defc page
  []
  (let [[ready?, set-ready?] (rum/use-state false)
        *ref-el (rum/use-ref nil)]

    (rum/use-effect!
      (fn [] (setup-configure!)
        (set-ready? true)
        (when-let [^js el (rum/deref *ref-el)]
          (js/setTimeout #(some-> (.querySelector el "input[name=username]")
                                  (.focus)) 100))) [])

    [:div.cp__user-login
     {:ref *ref-el}
     (when ready?
       (LSAuthenticator
         (fn [^js op]
           (let [sign-out! (.-signOut op)
                 ^js user-proxy (.-user op)
                 ^js user (try (js/JSON.parse (js/JSON.stringify user-proxy))
                               (catch js/Error e
                                 (js/console.error "Error: Amplify user payload:" e)))
                 user' (bean/->clj user)]
             (user-pane sign-out! user')))))]))

(defn open-login-modal!
  []
  (state/set-modal!
    (fn [_close] (page))
    {:close-btn? false
     :label      "user-login"
     :center?    true}))
