(ns frontend.components.user.login
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [dommy.core :refer-macros [sel]]
            [frontend.config :as config]
            [frontend.handler.route :as route-handler]
            [frontend.handler.user :as user]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.state :as state]
            [io.factorhouse.hsx.core :as hsx]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]))

(declare setupAuthConfigure! LSAuthenticator)

(defn sign-out!
  []
  (try (.signOut js/LSAuth.Auth)
       (catch :default e (js/console.warn e))))

(defn setup-configure!
  []
  #_:clj-kondo/ignore
  (defn setupAuthConfigure! [config]
    (.init js/LSAuth (bean/->js {:authCognito (merge config {:loginWith {:email true}})})))
  #_:clj-kondo/ignore
    (def LSAuthenticator
      (.-LSAuthenticator js/LSAuth))

  (setupAuthConfigure!
   {:region config/REGION,
    :userPoolId config/USER-POOL-ID,
    :userPoolClientId config/COGNITO-CLIENT-ID,
    :identityPoolId config/IDENTITY-POOL-ID,
    :oauthDomain config/OAUTH-DOMAIN}))

(defn authenticator
  [opts & children]
  (into [:> LSAuthenticator opts] children))

(hsx/defc user-pane
  [_sign-out! user]
  (let [session  (:signInUserSession user)]

    (hooks/use-effect!
     (fn []
       (when session
         (user/login-callback session)
         (shui/dialog-close!)
         (shui/popup-hide!)
         (when (= :user-login (state/get-current-route))
           (route-handler/redirect! {:to :home}))))
     [])

    nil))

(hsx/defc page-impl
  []
  [:div.cp__user-login
     (authenticator
      {:titleRender (fn [key title]
                      (shui/card-header
                       {:class "px-0"
                        :data-auth-title-key (str key)}
                       (shui/card-title
                        {:class "capitalize"}
                        (string/replace title "-" " "))))
       :onSessionCallback #()}
      (fn [^js op]
        (let [sign-out!' (.-signOut op)
              user' (bean/->clj (.-sessionUser op))]
          (user-pane sign-out!' user'))))])

(hsx/defc modal-inner
  []
  (shortcut/use-disable-all-shortcuts!)
  (page-impl))

(hsx/defc page
  []
  [:div.pt-10 (page-impl)])

(defn open-login-modal!
  []
  (shui/dialog-open!
   (fn [_close] (modal-inner))
   {:label :user-login
    :content-props {:onPointerDownOutside #(if (seq (sel "[data-auth-title-key='login']"))
                                             (let [inputs (sel ".ls-authenticator-content form input:not([type=checkbox])")
                                                   inputs (some->> inputs (map (fn [^js e] (.-value e))) (remove string/blank?))]
                                               (when (seq inputs)
                                                 (.preventDefault %)))
                                             (.preventDefault %))}}))
