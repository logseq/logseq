(ns frontend.components.e2ee
  (:require [clojure.string :as string]
            [frontend.common.crypt :as crypt]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [rum.core :as rum]))

(rum/defc e2ee-request-new-password
  [password-promise]
  (let [[password set-password!] (hooks/use-state "")
        [password-confirm set-password-confirm!] (hooks/use-state "")
        [matched? set-matched!] (hooks/use-state nil)
        on-submit (fn []
                    (p/resolve! password-promise password)
                    (shui/dialog-close!))]
    [:div.e2ee-password-modal-overlay
     [:div.encryption-password.max-w-2xl.e2ee-password-modal-content.flex.flex-col.gap-8.p-4
      [:div.text-2xl.font-medium "Set password for remote graphs"]

      [:div.init-remote-pw-tips.space-x-4.hidden.sm:flex
       [:div.flex-1.flex.items-center
        [:span.px-3.flex (ui/icon "key")]
        [:p
         [:span "Please make sure you "]
         "remember the password you have set, as we are unable to reset or retrieve it in case you forget it, "
         [:span "and we recommend you "]
         "keep a secure backup "
         [:span "of the password."]]]

       [:div.flex-1.flex.items-center
        [:span.px-3.flex (ui/icon "lock")]
        [:p
         "If you lose your password, all of your data in the cloud can’t be decrypted. "
         [:span "You will still be able to access the local version of your graph."]]]]

      [:div.flex.flex-col.gap-4
       (shui/toggle-password
        {:placeholder "Enter password"
         :value password
         :on-change (fn [e] (set-password! (-> e .-target .-value)))
         :on-blur (fn []
                    (when-not (string/blank? password-confirm)
                      (set-matched! (= password-confirm password))))})

       [:div.flex.flex-col.gap-2
        (shui/input
         {:type "password-confirm"
          :placeholder "Enter password again"
          :value password-confirm
          :on-change (fn [e] (set-password-confirm! (-> e .-target .-value)))
          :on-blur (fn [] (set-matched! (= password-confirm password)))})

        (when (false? matched?)
          [:div.text-warning.text-sm
           "Password not matched"])]

       (shui/button
        {:on-click on-submit
         :disabled (or (string/blank? password)
                       (false? matched?))}
        "Submit")]]]))

(rum/defc e2ee-password-to-decrypt-private-key
  [encrypted-private-key private-key-promise refresh-token]
  (let [[password set-password!] (hooks/use-state "")
        [decrypt-fail? set-decrypt-fail!] (hooks/use-state false)
        on-submit (fn []
                    (->
                     (p/let [private-key (crypt/<decrypt-private-key password encrypted-private-key)]
                       (state/<invoke-db-worker :thread-api/save-e2ee-password refresh-token password)
                       (p/resolve! private-key-promise private-key)
                       (shui/dialog-close!))
                     (p/catch (fn [e]
                                (when (= "decrypt-private-key" (ex-message e))
                                  (set-decrypt-fail! true))))))]
    [:div.e2ee-password-modal-overlay
     [:div.e2ee-password-modal-content.flex.flex-col.gap-8.p-4
      [:div.text-2xl.font-medium "Enter password for remote graphs"]
      [:div.flex.flex-col.gap-4
       [:div.flex.flex-col.gap-1
        (shui/toggle-password
         {:value password
          :on-key-press (fn [e]
                          (when (= "Enter" (util/ekey e))
                            (on-submit)))
          :on-change (fn [e]
                       (set-decrypt-fail! false)
                       (set-password! (-> e .-target .-value)))})
        (when decrypt-fail? [:p.text-warning.text-sm "Wrong password"])]
       (shui/button
        {:on-click on-submit
         :disabled (string/blank? password)
         :on-key-press (fn [e]
                         (when (= "Enter" (util/ekey e))
                           (on-submit)))}
        "Submit")]]]))
