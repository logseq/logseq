(ns frontend.components.user.login
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [dommy.core :refer-macros [sel by-id]]
            [frontend.config :as config]
            [frontend.handler.notification :as notification]
            [frontend.handler.route :as route-handler]
            [frontend.handler.user :as user]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.rum :refer [adapt-class]]
            [frontend.state :as state]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

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
    (adapt-class (.-LSAuthenticator js/LSAuth)))

  (setupAuthConfigure!
   {:region config/REGION,
    :userPoolId config/USER-POOL-ID,
    :userPoolClientId config/COGNITO-CLIENT-ID,
    :identityPoolId config/IDENTITY-POOL-ID,
    :oauthDomain config/OAUTH-DOMAIN}))

(rum/defc user-pane
  [_sign-out! user]
  (let [session  (:signInUserSession user)
        username (:username user)]

    (hooks/use-effect!
     (fn []
       (when session
         (user/login-callback session)
         (notification/show! (str "Hi, " username " :)") :success)
         (shui/dialog-close!)
         (when (= :user-login (state/get-current-route))
           (route-handler/redirect! {:to :home}))))
     [])

    nil))

(rum/defc page-impl
  []
  (let [*ref-el (rum/use-ref nil)
        [tab set-tab!] (rum/use-state nil)]
    [:div.cp__user-login
     {:ref *ref-el
      :id (str "user-auth-" tab)}
     (LSAuthenticator
      {:titleRender (fn [key title]
                      (set-tab! key)
                      (shui/card-header
                       {:class "px-0"}
                       (shui/card-title
                        {:class "capitalize"}
                        (string/replace title "-" " "))))
       :onSessionCallback #()}
      (fn [^js op]
        (let [sign-out!' (.-signOut op)
              user' (bean/->clj (.-sessionUser op))]
          (user-pane sign-out!' user'))))]))

(rum/defcs modal-inner <
  shortcut/disable-all-shortcuts
  [_state]
  (page-impl))

(rum/defc page
  []
  [:div.pt-10 (page-impl)])

(defn open-login-modal!
  []
  (shui/dialog-open!
   (fn [_close] (modal-inner))
   {:label "user-login"
    :content-props {:onPointerDownOutside #(if (by-id "#user-auth-login")
                                             (let [inputs (sel ".ls-authenticator-content form input:not([type=checkbox])")
                                                   inputs (some->> inputs (map (fn [^js e] (.-value e))) (remove string/blank?))]
                                               (when (seq inputs)
                                                 (.preventDefault %)))
                                             (.preventDefault %))}}))
