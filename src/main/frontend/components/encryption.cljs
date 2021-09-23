(ns frontend.components.encryption
  (:require [clojure.string :as string]
            [frontend.context.i18n :as i18n]
            [frontend.encrypt :as e]
            [frontend.handler.metadata :as metadata-handler]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [promesa.core :as p]
            [rum.core :as rum]))

(rum/defcs encryption-dialog-inner <
  (rum/local false ::reveal-secret-phrase?)
  [state repo-url close-fn]
  (let [reveal-secret-phrase? (get state ::reveal-secret-phrase?)
        secret-phrase (e/get-key-pair repo-url)
        public-key (e/get-public-key repo-url)
        private-key (e/get-secret-key repo-url)]
    (rum/with-context [[t] i18n/*tongue-context*]
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
          [:div public-key]
          (if @reveal-secret-phrase?
            [:div
             [:div.mt-1.font-medium "Private Key:"]
             [:div private-key]]
            [:div "click to view the private key"])]]]

       [:div.mt-5.sm:mt-4.sm:flex.sm:flex-row-reverse
        [:span.mt-3.flex.w-full.rounded-md.shadow-sm.sm:mt-0.sm:w-auto
         [:button.inline-flex.justify-center.w-full.rounded-md.border.border-gray-300.px-4.py-2.bg-white.text-base.leading-6.font-medium.text-gray-700.shadow-sm.hover:text-gray-500.focus:outline-none.focus:border-blue-300.focus:shadow-outline-blue.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
          {:type "button"
           :on-click close-fn}
          (t :close)]]]])))

(defn encryption-dialog
  [repo-url]
  (fn [close-fn]
    (encryption-dialog-inner repo-url close-fn)))

(rum/defcs input-password-inner <
  (rum/local "" ::password)
  (rum/local "" ::password-confirm)
  [state repo-url close-fn]
  (rum/with-context [[t] i18n/*tongue-context*]
    (let [password (get state ::password)
          password-confirm (get state ::password-confirm)]
      [:div
       [:div.sm:flex.sm:items-start
        [:div.mt-3.text-center.sm:mt-0.sm:text-left
         [:h3#modal-headline.text-lg.leading-6.font-medium.font-bold
          "Enter a password"]]]

       (ui/admonition
        :warning
        [:div.opacity-70
         "Choose a strong and hard to guess password.\nIf you lose your password, all the data can't be decrypted!! Please make sure you remember the password you have set, or you can keep a secure backup of the password."])
       [:input.form-input.block.w-full.sm:text-sm.sm:leading-5.my-2
        {:type "password"
         :placeholder "Password"
         :auto-focus true
         :on-change (fn [e]
                      (reset! password (util/evalue e)))}]
       [:input.form-input.block.w-full.sm:text-sm.sm:leading-5.my-2
        {:type "password"
         :placeholder "Re-enter the password"
         :on-change (fn [e]
                      (reset! password-confirm (util/evalue e)))}]

       [:div.mt-5.sm:mt-4.sm:flex.sm:flex-row-reverse
        [:span.flex.w-full.rounded-md.shadow-sm.sm:ml-3.sm:w-auto
         [:button.inline-flex.justify-center.w-full.rounded-md.border.border-transparent.px-4.py-2.bg-indigo-600.text-base.leading-6.font-medium.text-white.shadow-sm.hover:bg-indigo-500.focus:outline-none.focus:border-indigo-700.focus:shadow-outline-indigo.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
          {:type "button"
           :on-click (fn []
                       (let [value @password]
                         (cond
                           (string/blank? value)
                           nil

                           (not= @password @password-confirm)
                           (notification/show! "The passwords are not matched." :error)

                           :else
                           (p/let [keys (e/generate-key-pair-and-save! repo-url)
                                   db-encrypted-secret (e/encrypt-with-passphrase value keys)]
                             (metadata-handler/set-db-encrypted-secret! db-encrypted-secret)
                             (close-fn true)))))}
          "Submit"]]]])))

(defn input-password
  [repo-url close-fn]
  (fn [_close-fn]
    (input-password-inner repo-url close-fn)))

(rum/defcs encryption-setup-dialog-inner
  [state repo-url close-fn]
  (rum/with-context [[t] i18n/*tongue-context*]
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
                     (state/set-modal! (input-password repo-url close-fn)))}
        (t :yes)]]
      [:span.mt-3.flex.w-full.rounded-md.shadow-sm.sm:mt-0.sm:w-auto
       [:button.inline-flex.justify-center.w-full.rounded-md.border.border-gray-300.px-4.py-2.bg-white.text-base.leading-6.font-medium.text-gray-700.shadow-sm.hover:text-gray-500.focus:outline-none.focus:border-blue-300.focus:shadow-outline-blue.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
        {:type "button"
         :on-click (fn [] (close-fn false))}
        (t :no)]]]]))

(defn encryption-setup-dialog
  [repo-url close-fn]
  (fn [close-modal-fn]
    (let [close-fn (fn [encrypted?]
                     (close-fn encrypted?)
                     (close-modal-fn))]
      (encryption-setup-dialog-inner repo-url close-fn))))

(rum/defcs encryption-input-secret-inner <
  (rum/local "" ::secret)
  [state repo-url db-encrypted-secret close-fn]
  (rum/with-context [[t] i18n/*tongue-context*]
    (let [secret (get state ::secret)]
      [:div
       [:div.sm:flex.sm:items-start
        [:div.mt-3.text-center.sm:mt-0.sm:text-left
         [:h3#modal-headline.text-lg.leading-6.font-medium
          "Enter your password"]]]

       [:input.form-input.block.w-full.sm:text-sm.sm:leading-5.my-2
        {:type "password"
         :auto-focus true
         :on-change (fn [e]
                      (reset! secret (util/evalue e)))}]

       [:div.mt-5.sm:mt-4.sm:flex.sm:flex-row-reverse
        [:span.flex.w-full.rounded-md.shadow-sm.sm:ml-3.sm:w-auto
         [:button.inline-flex.justify-center.w-full.rounded-md.border.border-transparent.px-4.py-2.bg-indigo-600.text-base.leading-6.font-medium.text-white.shadow-sm.hover:bg-indigo-500.focus:outline-none.focus:border-indigo-700.focus:shadow-outline-indigo.transition.ease-in-out.duration-150.sm:text-sm.sm:leading-5
          {:type "button"
           :on-click (fn []
                       (let [value @secret]
                         (when-not (string/blank? value) ; TODO: length or other checks
                           (p/let [repo (state/get-current-repo)
                                   keys (e/decrypt-with-passphrase value db-encrypted-secret)]
                             (e/save-key-pair! repo keys)
                             (close-fn true)
                             (state/set-state! :encryption/graph-parsing? false)))))}
          "Submit"]]]])))

(defn encryption-input-secret-dialog
  [repo-url db-encrypted-secret close-fn]
  (fn [close-modal-fn]
    (let [close-fn (fn [encrypted?]
                     (close-fn encrypted?)
                     (close-modal-fn))]
      (encryption-input-secret-inner repo-url db-encrypted-secret close-fn))))
