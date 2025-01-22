(ns frontend.components.user.login
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [dommy.core :refer-macros [sel]]
            [frontend.config :as config]
            [frontend.handler.notification :as notification]
            [frontend.handler.route :as route-handler]
            [frontend.handler.user :as user]
            [frontend.hooks :as hooks]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.rum :refer [adapt-class]]
            [frontend.state :as state]
            [logseq.shui.ui :as shui]
            [rum.core :as rum]))

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
  (let [[ready?, set-ready?] (rum/use-state false)
        [tab, set-tab!] (rum/use-state :login)
        *ref-el (rum/use-ref nil)]

    (hooks/use-effect!
     (fn [] (setup-configure!)
       (set-ready? true)
       (js/setTimeout
        (fn []
          (when-let [^js el (some-> (rum/deref *ref-el) (.querySelector ".amplify-tabs"))]
            (let [btn1 (.querySelector el "button")]
              (.addEventListener el "pointerdown"
                                 (fn [^js e]
                                   (if (= (.-target e) btn1)
                                     (set-tab! :login)
                                     (set-tab! :create-account)))))))))
     [])

    (hooks/use-effect!
     (fn []
       (when-let [^js el (rum/deref *ref-el)]
         (js/setTimeout
          #(some-> (.querySelector el (str "input[name=" (if (= tab :login) "username" "email") "]"))
                   (.focus)) 100)))
     [tab])

    [:div.cp__user-login
     {:ref *ref-el}
     (when ready?
       (LSAuthenticator
        {:termsLink "https://blog.logseq.com/terms/"}
        (fn [^js op]
          (let [sign-out!'      (.-signOut op)
                ^js user-proxy (.-user op)
                ^js user       (try (js/JSON.parse (js/JSON.stringify user-proxy))
                                    (catch js/Error e
                                      (js/console.error "Error: Amplify user payload:" e)))
                user'          (bean/->clj user)]
            (user-pane sign-out!' user')))))]))

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
    :content-props {:onPointerDownOutside #(let [inputs (sel "form[data-amplify-form] input:not([type=checkbox])")
                                                 inputs (some->> inputs (map (fn [^js e] (.-value e))) (remove string/blank?))]
                                             (when (seq inputs)
                                               (.preventDefault %)))}}))
