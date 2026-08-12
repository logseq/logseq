(ns frontend.components.user.login
  (:require ["aws-amplify" :refer [Amplify]]
            ["aws-amplify/auth" :as Auth]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [dommy.core :refer-macros [sel]]
            [frontend.config :as config]
            [frontend.context.i18n :refer [t]]
            [frontend.handler.route :as route-handler]
            [frontend.handler.user :as user]
            [frontend.modules.shortcut.core :as shortcut]
            [frontend.state :as state]
            [io.factorhouse.hsx.core :as hsx]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]))

(defn sign-out!
  []
  (try (Auth/signOut)
       (catch :default e (js/console.warn e))))

(defn setup-configure!
  []
  (.configure Amplify
              (bean/->js
               {:Auth {:Cognito {:region config/REGION
                                  :userPoolId config/USER-POOL-ID
                                  :userPoolClientId config/COGNITO-CLIENT-ID
                                  :identityPoolId config/IDENTITY-POOL-ID
                                  :oauthDomain config/OAUTH-DOMAIN
                                  :loginWith {:email true}}}})))

(defn- auth-error-message
  [error]
  (case (or (.-name error) (.-code error))
    "UserNotFoundException" (t :account/auth-error-user-not-found)
    "NotAuthorizedException" (t :account/auth-error-invalid-credentials)
    "UserNotConfirmedException" (t :account/auth-error-user-not-confirmed)
    "UsernameExistsException" (t :account/auth-error-username-exists)
    "InvalidPasswordException" (t :account/password-policy-tip)
    "CodeMismatchException" (t :account/auth-error-code-mismatch)
    "ExpiredCodeException" (t :account/auth-error-code-expired)
    "LimitExceededException" (t :account/auth-error-too-many-requests)
    "TooManyRequestsException" (t :account/auth-error-too-many-requests)
    "TooManyFailedAttemptsException" (t :account/auth-error-too-many-attempts)
    "CodeDeliveryFailureException" (t :account/auth-error-code-delivery-failed)
    "UserAlreadyAuthenticatedException" (t :account/auth-error-already-authenticated)
    "InvalidParameterException" (t :account/auth-error-invalid-parameter)
    (t :account/auth-error-generic)))

(defn- form-data
  [^js event]
  (-> (js/FormData. (.-target event))
      js/Object.fromEntries
      (bean/->clj :keywordize-keys true)))

(defn- validate-password!
  [password]
  (when (or (string/blank? password)
            (< (count password) 8)
            (not (re-find #"[a-z]" password))
            (not (re-find #"[A-Z]" password))
            (not (re-find #"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>/?~`]" password)))
    (throw (js/Error. (t :account/password-policy-tip)))))

(defn- build-session-user
  [^js session ^js current-user]
  (let [tokens (.-tokens session)]
    {:username (.-username current-user)
     :signInUserSession {:idToken {:jwtToken (some-> tokens .-idToken str)}
                         :accessToken {:jwtToken (some-> tokens .-accessToken str)}
                         :refreshToken nil}}))

(defn- <load-session!
  [set-session-user! on-session-callback]
  (-> (Auth/fetchAuthSession)
      (.then (fn [session]
               (if-not (.-userSub session)
                 (throw (js/Error. "No session"))
                 (-> (Auth/getCurrentUser)
                     (.then (fn [current-user]
                              (let [user (build-session-user session current-user)]
                                (on-session-callback user)
                                (set-session-user! user))))))))
      (.catch (fn [_error]
                (set-session-user! false)))))

(defn- input-row
  [{:keys [id label error] :as props}]
  [:div.relative.w-full.flex.flex-col.gap-3.pb-1
   [:label.text-sm.font-medium {:for id} label]
   [shui/input (dissoc props :label :error)]
   (when error
     [shui/alert {:variant :destructive}
      [shui/alert-description error]])])

(defn- submit-button
  [loading? label]
  [shui/button {:type "submit" :disabled loading? :class "w-full"} label])

(hsx/defc login-form
  [{:keys [set-current-tab! set-session-user! set-error! on-session-callback]}]
  (let [[loading? set-loading!] (hooks/use-state false)
        email-ref (hooks/use-ref nil)]
    (hooks/use-effect!
     (fn []
       (let [timeout (js/setTimeout #(some-> (hooks/deref email-ref) (.focus)) 16)]
         #(js/clearTimeout timeout)))
     [])
    [:form.relative.flex.flex-col.justify-center.items-center.gap-4.w-full
     {:on-submit
      (fn [event]
        (.preventDefault event)
        (set-error! nil)
        (let [{:keys [email password]} (form-data event)
              username (string/trim (or email ""))]
          (set-loading! true)
          (-> (Auth/signIn (bean/->js {:username username :password password}))
              (.then (fn [ret]
                       (let [next-step (some-> ret .-nextStep .-signInStep)]
                         (case next-step
                           ("CONFIRM_SIGN_UP" "CONFIRM_SIGN_IN_WITH_EMAIL_CODE" "CONFIRM_SIGN_IN_WITH_TOTP_CODE")
                           (set-current-tab! {:type :confirm-code :user (merge (bean/->clj ret :keywordize-keys true) {:username username}) :next-step next-step})

                           "RESET_PASSWORD"
                           (set-current-tab! {:type :reset-password :username username})

                           "DONE"
                           (<load-session! set-session-user! on-session-callback)

                           (throw (js/Error. (str "Unsupported sign-in step: " next-step)))))))
              (.catch #(set-error! (auth-error-message %)))
              (.finally #(set-loading! false)))))}
     (input-row {:id "email" :type "text" :name "email" :required true :auto-focus true
                 :ref email-ref
                 :auto-complete "username" :label (t :account/email)})
     (input-row {:id "password" :type "password" :name "password" :required true
                 :auto-complete "current-password" :label (t :account/password)})
     [:div.w-full
      (submit-button loading? (t :account/sign-in))
      [:p.pt-4.text-center
       [:span.text-sm
        [:span.opacity-50 (str (t :account/dont-have-account-question) " ")]
        [:a.underline.opacity-60.hover:opacity-80 {:on-click #(set-current-tab! :signup)}
         (t :account/sign-up)]
        [:br]
        [:span.opacity-50 (str (t :account/or) " ")]]
       [:a.text-sm.opacity-60.hover:opacity-80.underline {:on-click #(set-current-tab! :reset-password)}
        (t :encryption/forgot-password-question)]]]]))

(hsx/defc signup-form
  [{:keys [set-current-tab! set-error!]}]
  (let [[loading? set-loading!] (hooks/use-state false)]
    [:form.relative.flex.flex-col.justify-center.items-center.gap-4.w-full
     {:on-submit
      (fn [event]
        (.preventDefault event)
        (set-error! nil)
        (let [{:keys [email username password confirm-password]} (form-data event)]
          (try
            (validate-password! password)
            (when (not= password confirm-password)
              (throw (js/Error. (t :account/passwords-do-not-match))))
            (set-loading! true)
            (-> (Auth/signUp (bean/->js {:username username
                                          :password password
                                          :options {:userAttributes {:email email}}}))
                (.then (fn [ret]
                         (if (= "CONFIRM_SIGN_UP" (some-> ret .-nextStep .-signUpStep))
                           (set-current-tab! {:type :confirm-code
                                              :user (merge (bean/->clj ret :keywordize-keys true) {:username username})
                                              :next-step "CONFIRM_SIGN_UP"})
                           (set-current-tab! :login))))
                (.catch #(set-error! (auth-error-message %)))
                (.finally #(set-loading! false)))
            (catch :default e
              (set-error! (.-message e))))))}
     (input-row {:id "email" :type "email" :name "email" :required true :auto-focus true
                 :auto-complete "email" :label (t :account/email)})
     (input-row {:id "username" :type "text" :name "username" :required true
                 :auto-complete "username" :label (t :account/username)})
     (input-row {:id "password" :type "password" :name "password" :required true
                 :auto-complete "new-password" :label (t :account/password)})
     (input-row {:id "confirm-password" :type "password" :name "confirm-password" :required true
                 :auto-complete "new-password" :label (t :account/confirm-password)})
     [:div.w-full (submit-button loading? (t :account/create-account))]
     [:p.pt-1.text-center
      [:a.text-sm.opacity-60.hover:opacity-80.underline {:on-click #(set-current-tab! :login)}
       (t :account/back-to-login)]]]))

(hsx/defc reset-password-form
  [{:keys [set-current-tab! set-error!] :as _props}]
  (let [[sent-username set-sent-username!] (hooks/use-state nil)
        [loading? set-loading!] (hooks/use-state false)]
    [:form.relative.flex.flex-col.justify-center.items-center.gap-4.w-full
     {:auto-complete "off"
      :on-submit
      (fn [event]
        (.preventDefault event)
        (set-error! nil)
        (let [{:keys [email code password confirm-password]} (form-data event)]
          (set-loading! true)
          (if sent-username
            (try
              (validate-password! password)
              (when (not= password confirm-password)
                (throw (js/Error. (t :account/passwords-do-not-match))))
              (-> (Auth/confirmResetPassword (bean/->js {:username sent-username
                                                          :confirmationCode code
                                                          :newPassword password}))
                  (.then #(set-current-tab! :login))
                  (.catch #(set-error! (auth-error-message %)))
                  (.finally #(set-loading! false)))
              (catch :default e
                (set-loading! false)
                (set-error! (.-message e))))
            (-> (Auth/resetPassword (bean/->js {:username (string/trim (or email ""))}))
                (.then (fn [_]
                         (set-sent-username! (string/trim (or email "")))))
                (.catch #(set-error! (auth-error-message %)))
                (.finally #(set-loading! false))))))}
     (if sent-username
       [:<>
        (input-row {:id "code" :type "text" :name "code" :required true
                    :auto-complete "off" :label (t :account/enter-code)})
        (input-row {:id "password" :type "password" :name "password" :required true
                    :auto-complete "new-password" :label (t :account/password)})
        (input-row {:id "confirm-password" :type "password" :name "confirm-password" :required true
                    :auto-complete "new-password" :label (t :account/confirm-password)})
        [:div.w-full (submit-button loading? (t :account/reset-password))]]
       [:<>
        (input-row {:id "email" :type "email" :name "email" :required true :auto-focus true
                    :label (t :account/enter-email)})
        [:div.w-full (submit-button loading? (t :account/send-code))]])
     [:p.pt-1.text-center
      [:a.text-sm.opacity-60.hover:opacity-80.underline {:on-click #(set-current-tab! :login)}
       (t :account/back-to-login)]]]))

(hsx/defc confirm-code-form
  [{:keys [current-tab set-current-tab! set-error!]}]
  (let [[loading? set-loading!] (hooks/use-state false)
        {:keys [user next-step]} current-tab
        details (get-in user [:nextStep :codeDeliveryDetails])]
    [:form.relative.flex.flex-col.justify-center.items-center.gap-4.w-full
     {:auto-complete "off"
      :on-submit
      (fn [event]
        (.preventDefault event)
        (set-error! nil)
        (let [{:keys [code]} (form-data event)]
          (set-loading! true)
          (-> (if (= "CONFIRM_SIGN_UP" next-step)
                (Auth/confirmSignUp (bean/->js {:username (:username user)
                                                :confirmationCode code}))
                (Auth/confirmSignIn (bean/->js {:challengeResponse code})))
              (.then #(set-current-tab! :login))
              (.catch #(set-error! (auth-error-message %)))
              (.finally #(set-loading! false)))))}
     [:p.pb-2.opacity-60
      (if-let [destination (:destination details)]
        (t :account/code-sent-to-email destination)
        (t :account/code-on-the-way-tip))]
     (input-row {:id "code" :type "text" :name "code" :required true :auto-focus true
                 :auto-complete "off" :label (t :account/enter-code)})
     [:div.w-full (submit-button loading? (t :account/confirm))]
     [:p.pt-1.text-center
      [:a.text-sm.opacity-60.hover:opacity-80.underline {:on-click #(set-current-tab! :login)}
       (t :account/back-to-login)]]]))

(defn authenticator
  [opts & children]
  (let [[current-tab set-current-tab!] (hooks/use-state :login)
        [session-user set-session-user!] (hooks/use-state nil)
        [error set-error!] (hooks/use-state nil)
        on-session-callback (:onSessionCallback opts)]
    (hooks/use-effect!
     (fn []
       (<load-session! set-session-user! (or on-session-callback identity))
       #())
     [])
    (hooks/use-effect!
     (fn [] (set-error! nil) #())
     [current-tab])
    (let [tab-key (if (map? current-tab) (:type current-tab) current-tab)
          title (case tab-key
                  :signup (t :account/sign-up)
                  :reset-password (t :account/reset-password)
                  :confirm-code (t :account/confirm)
                  (t :ui/login))]
      [:<>
       (when-let [title-render (:titleRender opts)]
         (title-render (name tab-key) title))
       [:div.ls-authenticator-content
        (cond
          (nil? session-user)
          [shui/skeleton {:class "h-4 w-[250px]"}]

          (:username session-user)
          (let [child (first children)]
            (if (fn? child)
              (child #js {:sessionUser (bean/->js session-user)
                          :signOut #(-> (Auth/signOut)
                                        (.then (fn [] (set-session-user! false))))})
              [:div.w-full.text-center
               [:p.mb-4 (t :account/already-logged-in-as (:username session-user))]
               [shui/button {:variant :secondary :class "w-full"
                             :on-click #(-> (Auth/signOut)
                                            (.then (fn [] (set-session-user! false))))}
                (t :account/sign-out)]]))

          :else
          [:<>
           (when error [shui/alert {:variant :destructive :class "mb-4"}
                        [shui/alert-description error]])
           (case tab-key
             :signup [signup-form {:set-current-tab! set-current-tab!
                                   :set-error! set-error!}]
             :reset-password [reset-password-form {:set-current-tab! set-current-tab!
                                                   :set-error! set-error!}]
             :confirm-code [confirm-code-form {:current-tab current-tab
                                               :set-current-tab! set-current-tab!
                                               :set-error! set-error!}]
             [login-form {:set-current-tab! set-current-tab!
                          :set-session-user! set-session-user!
                          :set-error! set-error!
                          :on-session-callback (or on-session-callback identity)}])])]])))

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

(hsx/defc dialog-inner
  []
  (shortcut/use-disable-all-shortcuts!)
  (page-impl))

(hsx/defc page
  []
  [:div.pt-10 (page-impl)])

(defn open-login-modal!
  []
  (shui/dialog-open!
   (fn [_close] (dialog-inner))
   {:label :user-login
    :content-props {:onPointerDownOutside #(if (seq (sel "[data-auth-title-key='login']"))
                                             (let [inputs (sel ".ls-authenticator-content form input:not([type=checkbox])")
                                                   inputs (some->> inputs (map (fn [^js e] (.-value e))) (remove string/blank?))]
                                               (when (seq inputs)
                                                 (.preventDefault %)))
                                             (.preventDefault %))}}))
