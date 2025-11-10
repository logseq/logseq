(ns frontend.components.e2ee
  (:require [clojure.string :as string]
            [frontend.common.crypt :as crypt]
            [frontend.util :as util]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [rum.core :as rum]))

(rum/defc e2ee-request-new-password
  [password-promise]
  (let [[password set-password!] (hooks/use-state "")
        on-submit (fn []
                    (p/resolve! password-promise password)
                    (shui/dialog-close!))]
    [:div.e2ee-password-modal-overlay
     [:div.e2ee-password-modal-content.flex.flex-col.gap-8.p-2
      [:div.text-2xl.font-medium "Set password for remote graphs"]
      [:div.flex.flex-col.gap-4
       [:div.flex.flex-col.gap-1
        (shui/input
         {:type "password"
          :value password
          :on-change (fn [e] (set-password! (-> e .-target .-value)))
          :on-key-press (fn [e]
                          (when (= "Enter" (util/ekey e))
                            (on-submit)))})]
       (shui/button
        {:on-click on-submit
         :disabled (string/blank? password)
         :on-key-press (fn [e]
                         (when (= "Enter" (util/ekey e))
                           (on-submit)))}
        "Submit")]]]))

(rum/defc e2ee-password-to-decrypt-private-key
  [encrypted-private-key private-key-promise]
  (let [[password set-password!] (hooks/use-state "")
        [decrypt-fail? set-decrypt-fail!] (hooks/use-state false)
        on-submit (fn []
                    (->
                     (p/let [private-key (crypt/<decrypt-private-key password encrypted-private-key)]
                       (p/resolve! private-key-promise private-key)
                       (shui/dialog-close!))
                     (p/catch (fn [e]
                                (when (= "decrypt-private-key" (ex-message e))
                                  (set-decrypt-fail! true))))))]
    [:div.e2ee-password-modal-overlay
     [:div.e2ee-password-modal-content.flex.flex-col.gap-8.p-2
      [:div.text-2xl.font-medium "Enter password for remote graphs"]
      [:div.flex.flex-col.gap-4
       [:div.flex.flex-col.gap-1
        (shui/input
         {:type "password"
          :value password
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
