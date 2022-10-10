(ns frontend.components.encryption
  (:require [clojure.string :as string]
            [frontend.context.i18n :refer [t]]
            [frontend.encrypt :as encrypt]
            [frontend.handler.metadata :as metadata-handler]
            [frontend.handler.notification :as notification]
            [frontend.fs.sync :as sync]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [frontend.config :as config]
            [promesa.core :as p]
            [cljs.core.async :as async]
            [rum.core :as rum]))

(rum/defcs encryption-dialog-inner <
  (rum/local false ::reveal-secret-phrase?)
  [state repo-url close-fn]
  (let [reveal-secret-phrase? (get state ::reveal-secret-phrase?)
        public-key (encrypt/get-public-key repo-url)
        private-key (encrypt/get-secret-key repo-url)]
    [:div
     [:div.sm:flex.sm:items-start
      [:div.mt-3.text-center.sm:mt-0.sm:text-left
       [:h3#modal-headline.text-lg.leading-6.font-medium
        "This graph is encrypted with " [:a {:href "https://age-encryption.org/" :target "_blank" :rel "noopener"} "age-encryption.org/v1"]]]]

     [:div.mt-1
      [:div.max-w-2xl.rounded-md.shadow-sm.sm:max-w-xl
       [:div.cursor-pointer.block.w-full.rounded-sm.p-2
        {:on-click (fn []
                     (when (not @reveal-secret-phrase?)
                       (reset! reveal-secret-phrase? true)))}
        [:div.font-medium "Public Key:"]
        [:div.font-mono.select-all.break-all public-key]
        (if @reveal-secret-phrase?
          [:div
           [:div.mt-1.font-medium "Private Key:"]
           [:div.font-mono.select-all.break-all private-key]]
          [:div.underline "click to view the private key"])]]]

     [:div.mt-5.sm:mt-4.sm:flex.sm:flex-row-reverse
      [:span.mt-3.flex.w-full.rounded-md.shadow-sm.sm:mt-0.sm:w-auto
       [:button.inline-flex.justify-center.w-full.rounded-md.border.border-gray-300.px-4.py-2.bg-white.text-base.leading-6.font-medium.text-gray-700.shadow-sm.hover:text-gray-500.focus:outline-none.focus:border-blue-300.focus:shadow-outline-blue.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
        {:type "button"
         :on-click close-fn}
        (t :close)]]]]))

(defn encryption-dialog
  [repo-url]
  (fn [close-fn]
    (encryption-dialog-inner repo-url close-fn)))

(rum/defc show-password-cp
  [*show-password?]
  [:div.flex.flex-row.items-center
   [:label.px-1 {:for "show-password"}
    (ui/checkbox {:checked?  @*show-password?
                  :on-change (fn [e]
                               (reset! *show-password? (util/echecked? e)))
                  :id        "show-password"})
    [:span.text-sm.ml-1.opacity-80.select-none.px-1 "Show password"]]])

(rum/defcs ^:large-vars/cleanup-todo input-password-inner < rum/reactive
  (rum/local "" ::password)
  (rum/local "" ::pw-confirm)
  (rum/local false ::pw-confirm-focused?)
  (rum/local false ::show-password?)
  {:will-mount (fn [state]
                 ;; try to close tour tips
                 (some->> (state/sub :file-sync/jstour-inst)
                          (.complete))
                 state)}
  [state repo-url close-fn {:keys [type GraphName GraphUUID init-graph-keys after-input-password]}]
  (let [*password (get state ::password)
        *pw-confirm (get state ::pw-confirm)
        *pw-confirm-focused? (get state ::pw-confirm-focused?)
        *show-password? (get state ::show-password?)
        *input-ref-0 (rum/create-ref)
        *input-ref-1 (rum/create-ref)
        remote-pw? (= type :input-pwd-remote)
        loading? (state/sub [:ui/loading? :set-graph-password])
        pw-strength (when (and init-graph-keys
                               (not (string/blank? @*password)))
                      (util/check-password-strength @*password))
        can-submit? #(if init-graph-keys
                       (and (>= (count @*password) 6)
                            (>= (:id pw-strength) 1))
                       true)
        set-remote-graph-pwd-result (state/sub [:file-sync/set-remote-graph-password-result])

        submit-handler
        (fn []
          (let [value @*password]
            (cond
              (string/blank? value)
              nil

              (and init-graph-keys (not= @*password @*pw-confirm))
              (notification/show! "The passwords are not matched." :error)

              :else
              (case type
                :local
                (p/let [keys                (encrypt/generate-key-pair-and-save! repo-url)
                        db-encrypted-secret (encrypt/encrypt-with-passphrase value keys)]
                  (metadata-handler/set-db-encrypted-secret! db-encrypted-secret)
                  (close-fn true))

                (:create-pwd-remote :input-pwd-remote)
                (do
                  (state/set-state! [:ui/loading? :set-graph-password] true)
                  (state/set-state! [:file-sync/set-remote-graph-password-result] {})
                  (async/go
                    (let [persist-r (async/<! (sync/encrypt+persist-pwd! @*password GraphUUID))]
                      (if (instance? js/Error persist-r)
                        (js/console.error persist-r)
                        (when (fn? after-input-password)
                          (async/<! (after-input-password))
                          ;; TODO: it's better if based on sync state
                          (when init-graph-keys
                            (js/setTimeout #(state/pub-event! [:file-sync/maybe-onboarding-show :sync-learn]) 10000)))))))))))

        cancel-handler
        (fn []
          (state/set-state! [:file-sync/set-remote-graph-password-result] {})
          (close-fn))

        enter-handler
        (fn [^js e]
          (when-let [^js input (and e (= 13 (.-which e)) (.-target e))]
            (when-not (string/blank? (.-value input))
              (let [input-0? (= (util/safe-lower-case (.-placeholder input)) "password")]
                (if init-graph-keys
                  ;; setup mode
                  (if input-0?
                    (.select (rum/deref *input-ref-1))
                    (submit-handler))

                  ;; unlock mode
                  (submit-handler))))))]

    [:div.encryption-password.max-w-2xl.-mb-2
     [:div.cp__file-sync-related-normal-modal
      [:div.flex.justify-center.pb-4 [:span.icon-wrap (ui/icon "lock-access" {:size 28})]]

      [:div.mt-3.text-center.sm:mt-0.sm:text-left
       [:h1#modal-headline.text-2xl.font-bold.text-center
        (if init-graph-keys
          (if remote-pw?
            "Secure this remote graph!"
            "Encrypt this graph")
          (if remote-pw?
            "Unlock this remote graph!"
            "Decrypt this graph"))]]

      ;; decrypt remote graph with one password
      (when (and remote-pw? (not init-graph-keys))
        [:<>

         [:div.folder-tip.flex.flex-col.items-center
          [:h3
           [:span.flex.space-x-2.leading-none.pb-1
            (ui/icon "cloud-lock" {:size 20})
            [:span GraphName]
            [:span.scale-75 (ui/icon "arrow-right")]
            [:span (ui/icon "folder")]]]
          [:h4.px-2.-mb-1.5 (config/get-string-repo-dir repo-url)]]

         [:div.input-hints.text-sm.py-2.px-3.rounded.mb-2.mt-2.flex.items-center
          (if-let [display-str (:fail set-remote-graph-pwd-result)]
            [:<>
             [:span.flex.pr-1.text-error (ui/icon "alert-circle" {:class "text-md mr-1"})]
             [:span.text-error display-str]]
            [:<>
             [:span.flex.pr-1 (ui/icon "bulb" {:class "text-md mr-1"})]
             [:span "Please enter the password for this graph to continue syncing."]])]])

      ;; secure this remote graph
      (when (and remote-pw? init-graph-keys)
        (let [pattern-ok? #(>= (count @*password) 6)]
          [:<>
           [:h2.text-center.opacity-70.text-sm.py-2
            "Each graph you want to synchronize via Logseq needs its own password for end-to-end encryption."]
           [:div.input-hints.text-sm.py-2.px-3.rounded.mb-3.mt-4.flex.items-center
            (if (or (not (string/blank? @*password))
                    (not (string/blank? @*pw-confirm)))
              (if (or (not (pattern-ok?))
                      (not= @*password @*pw-confirm))
                [:span.flex.pr-1.text-error (ui/icon "alert-circle" {:class "text-md mr-1"})]
                [:span.flex.pr-1.text-success (ui/icon "circle-check" {:class "text-md mr-1"})])
              [:span.flex.pr-1 (ui/icon "bulb" {:class "text-md mr-1"})])

            (if (not (string/blank? @*password))
              (if-not (pattern-ok?)
                [:span "Password can't be less than 6 characters"]
                (if (not (string/blank? @*pw-confirm))
                  (if (not= @*pw-confirm @*password)
                    [:span "Password fields are not matching!"]
                    [:span "Password fields are matching!"])
                  [:span "Enter your chosen password again!"]))
              [:span "Choose a strong and hard to guess password!"])
            ]

           ;; password strength checker
           (when-not (string/blank? @*password)
             [:<>
              [:div.input-hints.text-sm.py-2.px-3.rounded.mb-2.-mt-1.5.flex.items-center.space-x-3
               (let [included-set (set (:contains pw-strength))]
                 (for [i ["lowercase" "uppercase" "number" "symbol"]
                       :let [included? (contains? included-set i)]]
                   [:span.strength-item
                    {:key i
                     :class (when included? "included")}
                    (ui/icon (if included? "check" "x") {:class "mr-1"})
                    [:span.capitalize i]
                    ]))]

              [:div.input-pw-strength
               [:div.indicator.flex
                (for [i (range 4)
                      :let [title (get ["Too weak" "Weak" "Medium" "Strong"] i)]]
                  [:i {:key i
                       :title title
                       :class (when (>= (int (:id pw-strength)) i) "active")} i])]]])]))

      [:input.form-input.block.w-full.sm:text-sm.sm:leading-5.my-2
       {:type        (if @*show-password? "text" "password")
        :ref         *input-ref-0
        :placeholder "Password"
        :auto-focus  true
        :disabled    loading?
        :on-key-up   enter-handler
        :on-change   (fn [^js e]
                       (reset! *password (util/evalue e))
                       (when (:fail set-remote-graph-pwd-result)
                         (state/set-state! [:file-sync/set-remote-graph-password-result] {})))}]

      (when init-graph-keys
        [:input.form-input.block.w-full.sm:text-sm.sm:leading-5.my-2
         {:type        (if @*show-password? "text" "password")
          :ref         *input-ref-1
          :placeholder "Re-enter the password"
          :on-focus    #(reset! *pw-confirm-focused? true)
          :on-blur     #(reset! *pw-confirm-focused? false)
          :disabled    loading?
          :on-key-up   enter-handler
          :on-change   (fn [^js e]
                         (reset! *pw-confirm (util/evalue e)))}])

      (show-password-cp *show-password?)

      (when init-graph-keys
        [:div.init-remote-pw-tips.space-x-4.pt-2.hidden.sm:flex
         [:div.flex-1.flex.items-center
          [:span.px-3.flex (ui/icon "key")]
          [:p.dark:text-gray-100
           [:span "Please make sure you "]
           "remember the password you have set, "
           [:span "and we recommend you "]
           "keep a secure backup "
           [:span "of the password."]]]

         [:div.flex-1.flex.items-center
          [:span.px-3.flex (ui/icon "lock")]
          [:p.dark:text-gray-100
           "If you lose your password, all of your data in the cloud can’t be decrypted. "
           [:span "You will still be able to access the local version of your graph."]]]])]

     [:div.mt-5.sm:mt-4.flex.justify-center.sm:justify-end.space-x-3
      (ui/button (t :cancel) :background "gray" :disabled loading? :class "opacity-60" :on-click cancel-handler)
      (ui/button [:span.inline-flex.items-center.leading-none
                  [:span (t :submit)]
                  (when loading?
                    [:span.ml-1 (ui/loading "" {:class "w-4 h-4"})])]

                 :disabled (or (not (can-submit?)) loading?)
                 :on-click submit-handler)]]))

(defn input-password
  ([repo-url close-fn] (input-password repo-url close-fn {:type :local}))
  ([repo-url close-fn opts]
   (fn [close-fn']
     (let [close-fn' (if (fn? close-fn)
                       #(do (close-fn %)
                            (close-fn'))
                       close-fn')]
       (input-password-inner repo-url close-fn' opts)))))

(rum/defcs encryption-setup-dialog-inner
  [state repo-url close-fn]
  [:div
   [:div.sm:flex.sm:items-start
    [:div.mt-3.text-center.sm:mt-0.sm:text-left
     [:h3#modal-headline.text-lg.leading-6.font-medium
      "Do you want to create an encrypted graph?"]]]

   [:div.mt-5.sm:mt-4.sm:flex.sm:flex-row-reverse
    [:span.flex.w-full.rounded-md.shadow-sm.sm:ml-3.sm:w-auto
     [:button.inline-flex.justify-center.w-full.rounded-md.border.border-transparent.px-4.py-2.bg-indigo-600.text-base.leading-6.font-medium.text-white.shadow-sm.hover:bg-indigo-500.focus:outline-none.focus:border-indigo-700.focus:shadow-outline-indigo.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
      {:type "button"
       :on-click (fn []
                   (state/set-modal!
                    (input-password repo-url close-fn)
                    {:center? true :close-btn? false}))}
      (t :yes)]]
    [:span.mt-3.flex.w-full.rounded-md.shadow-sm.sm:mt-0.sm:w-auto
     [:button.inline-flex.justify-center.w-full.rounded-md.border.border-gray-300.px-4.py-2.bg-white.text-base.leading-6.font-medium.text-gray-700.shadow-sm.hover:text-gray-500.focus:outline-none.focus:border-blue-300.focus:shadow-outline-blue.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
      {:type "button"
       :on-click (fn [] (close-fn false))}
      (t :no)]]]])

(defn encryption-setup-dialog
  [repo-url close-fn]
  (fn [close-modal-fn]
    (let [close-fn (fn [encrypted?]
                     (close-fn encrypted?)
                     (close-modal-fn))]
      (encryption-setup-dialog-inner repo-url close-fn))))

(rum/defcs encryption-input-secret-inner <
  (rum/local "" ::secret)
  (rum/local false ::loading)
  (rum/local false ::show-password?)
  [state _repo-url db-encrypted-secret close-fn]
  (let [secret (::secret state)
        loading (::loading state)
        *show-password? (::show-password? state)
        on-click-fn (fn []
                      (reset! loading true)
                      (let [value @secret]
                        (when-not (string/blank? value) ; TODO: length or other checks
                          (let [repo (state/get-current-repo)]
                            (p/do!
                             (-> (encrypt/decrypt-with-passphrase value db-encrypted-secret)
                                 (p/then (fn [keys]
                                           (encrypt/save-key-pair! repo keys)
                                           (close-fn true)
                                           (state/set-state! :encryption/graph-parsing? false)))
                                 (p/catch #(notification/show! "The password is not matched." :warning true))
                                 (p/finally #(reset! loading false))))))))]
    [:div
     [:div.sm:flex.sm:items-start
      [:div.mt-3.text-center.sm:mt-0.sm:text-left
       [:h3#modal-headline.text-lg.leading-6.font-medium
        "Enter your password"]]]

     [:input.form-input.block.w-full.sm:text-sm.sm:leading-5.my-2
      {:type (if @*show-password? "text" "password")
       :auto-focus true
       :on-change (fn [e]
                    (reset! secret (util/evalue e)))
       :on-key-down (fn [e]
                      (when (= (.-key e) "Enter")
                        (on-click-fn)))}]

     (show-password-cp *show-password?)

     [:div.mt-5.sm:mt-4.sm:flex.sm:flex-row-reverse
      [:span.flex.w-full.rounded-md.shadow-sm.sm:ml-3.sm:w-auto
       [:button.inline-flex.justify-center.w-full.rounded-md.border.border-transparent.px-4.py-2.bg-indigo-600.text-base.leading-6.font-medium.text-white.shadow-sm.hover:bg-indigo-500.focus:outline-none.focus:border-indigo-700.focus:shadow-outline-indigo.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
        {:type "button"
         :on-click on-click-fn}
        (if @loading (ui/loading "Decrypting") "Decrypt")]]]]))

(defn encryption-input-secret-dialog
  [repo-url db-encrypted-secret close-fn]
  (fn [close-modal-fn]
    (let [close-fn (fn [encrypted?]
                     (close-fn encrypted?)
                     (close-modal-fn))]
      (encryption-input-secret-inner repo-url db-encrypted-secret close-fn))))
