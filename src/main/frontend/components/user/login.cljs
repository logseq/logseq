(ns frontend.components.user.login
  (:require ["/frontend/amplify"]
            [rum.core :as rum]
            [frontend.rum :refer [adapt-class]]
            [cljs-bean.core :as bean]
            [frontend.ui :as ui]))

(def setupAuthConfigure! (.-setupAuthConfigure js/LSAmplify))
(def LSAuthenticator
  (adapt-class (.-LSAuthenticator js/LSAmplify)))

(defn- setup-configure!
  []
  (setupAuthConfigure!
    #js {:region                 "us-east-1",
         :userPoolId             "us-east-1_ldvDmC9Fe",
         :userPoolWebClientId    "41m82unjghlea984vjpk887qcr",
         :cookieStorage          #js {:domain   "localhost",
                                      :path     "/",
                                      :expires  365,
                                      :sameSite "strict",
                                      :secure   true},
         :authenticationFlowType "USER_SRP_AUTH"}))

(rum/defc user-pane
  [sign-out! user]
  (when-let [session (:signInUserSession user)]
    [:main
     [:h1.text-3xl.mb-2.flex.justify-between
      (str "Hi, " (:username user))

      [:span (ui/button "Logout" :on-click sign-out!)]]
     [:pre.text-sm.whitespace-pre-wrap (with-out-str (cljs.pprint/pprint session))]]))

(rum/defc page
  []
  (let [[ready?, set-ready?] (rum/use-state false)]

    (rum/use-effect!
      (fn [] (setup-configure!)
        (set-ready? true)) [])

    [:div.cp__user-login
     (when ready?
       (LSAuthenticator
         (fn [^js op]
           (let [sign-out! (.-signOut op)
                 ^js user-proxy (.-user op)
                 ^js user (try (js/JSON.parse (js/JSON.stringify user-proxy))
                               (catch js/Error e
                                 (js/console.error "Error: Amplify user payload:" e)))]

             (user-pane sign-out! (bean/->clj user))))))]))
