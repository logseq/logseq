(ns frontend.components.user.login
  (:require [rum.core :as rum]
            [frontend.rum :refer [adapt-class]]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.handler.user :as user]
            [cljs-bean.core :as bean]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [frontend.config :as config]))

(declare setupAuthConfigure! LSAuthenticator)

(defn sign-out!
  []
  (try (.signOut js/LSAmplify.Auth)
       (catch :default e (js/console.warn e))))

(defn- setup-configure!
  []
  #_:clj-kondo/ignore
  (def setupAuthConfigure! (.-setupAuthConfigure js/LSAmplify))
  #_:clj-kondo/ignore
  (def LSAuthenticator
    (adapt-class (.-LSAuthenticator js/LSAmplify)))

  (.setLanguage js/LSAmplify.I18n (or (:preferred-language @state/state) "en"))
  (setupAuthConfigure!
    #js {:region              config/REGION,
         :userPoolId          config/USER-POOL-ID,
         :userPoolWebClientId config/COGNITO-CLIENT-ID,
         :identityPoolId      config/IDENTITY-POOL-ID,
         :oauthDomain         config/OAUTH-DOMAIN}))

(rum/defc user-pane
  [_sign-out! user]
  (let [session  (:signInUserSession user)]

    (rum/use-effect!
      (fn []
        (when session
          (user/login-callback session)
          (state/close-modal!)))
      [])

    nil))

(rum/defc page-impl
  [props]
  (let [[ready?, set-ready?] (rum/use-state false)
        *ref-el (rum/use-ref nil)]

    (rum/use-effect!
      (fn [] (setup-configure!)
        (set-ready? true)
        (when-let [^js el (rum/deref *ref-el)]
          (js/setTimeout #(some-> (.querySelectorAll el "[autocomplete=username]")
                                  (aget 0)
                                  (.focus)) 100))) [])

    [:div.cp__user-login
     {:ref *ref-el}
     (when ready?
       (LSAuthenticator
         (assoc props :termsLink "https://blog.logseq.com/terms/")
         (fn [^js op]
           (let [sign-out!      (.-signOut op)
                 ^js user-proxy (.-user op)
                 ^js user       (try (js/JSON.parse (js/JSON.stringify user-proxy))
                                     (catch js/Error e
                                       (js/console.error "Error: Amplify user payload:" e)))
                 user'          (bean/->clj user)]
             (user-pane sign-out! user')))))]))

(rum/defcs page <
  shortcut/disable-all-shortcuts
  [_state props]
  (page-impl props))

(defn open-login-modal!
  ([] (open-login-modal! :signIn))
  ([type]
   (state/set-modal!
     (fn [_close] (page {:initialState (and type (name type))}))
     {:close-btn?      true
      :label           "user-login"
      :close-backdrop? false
      :center?         false})))
