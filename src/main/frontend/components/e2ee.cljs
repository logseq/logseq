(ns frontend.components.e2ee
  (:require [clojure.string :as string]
            [frontend.common.crypt :as crypt]
            [frontend.context.i18n :refer [t]]
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
      [:div.text-2xl.font-medium (t :encryption/set-password-title)]

      [:div.init-remote-pw-tips.space-x-4.hidden.sm:flex
       [:div.flex-1.flex.items-center
        [:span.px-3.flex (ui/icon "key")]
        [:p (t :encryption/remember-password-rich)]]

       [:div.flex-1.flex.items-center
        [:span.px-3.flex (ui/icon "lock")]
        [:p (t :encryption/cloud-password-rich)]]]

      [:div.flex.flex-col.gap-4
       (shui/toggle-password
        {:placeholder (t :encryption/enter-password)
         :value password
         :on-change (fn [e] (set-password! (-> e .-target .-value)))
         :on-blur (fn []
                    (when-not (string/blank? password-confirm)
                      (set-matched! (= password-confirm password))))})

       [:div.flex.flex-col.gap-2
        (shui/toggle-password
         {:placeholder (t :encryption/enter-password-again)
          :value password-confirm
          :on-change (fn [e] (set-password-confirm! (-> e .-target .-value)))
          :on-blur (fn [] (set-matched! (= password-confirm password)))})

        (when (false? matched?)
          [:div.text-warning.text-sm
           (t :encryption/password-not-matched)])]

       (shui/button
        {:on-click on-submit
         :disabled (or (string/blank? password)
                       (false? matched?))}
        (t :ui/submit))]]]))

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
      [:div.text-2xl.font-medium (t :encryption/enter-password-title)]
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
          (when decrypt-fail? [:p.text-warning.text-sm (t :encryption/wrong-password)])]
       (shui/button
        {:on-click on-submit
         :disabled (string/blank? password)
         :on-key-press (fn [e]
                         (when (= "Enter" (util/ekey e))
                           (on-submit)))}
         (t :ui/submit))]]]))
