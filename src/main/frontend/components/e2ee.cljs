(ns frontend.components.e2ee
  (:require [frontend.common.crypt :as crypt]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]
            [rum.core :as rum]))

(rum/defc e2ee-request-new-password
  [password-promise]
  (let [[password set-password!] (hooks/use-state "")]
    [:div.e2ee-password-modal-overlay
     [:div.e2ee-password-modal-content
      [:h3 "Enter new E2EE Password"]
      [:input {:type "password"
               :value password
               :on-change (fn [e] (set-password! (-> e .-target .-value)))}]
      (shui/button
       {:on-click (fn []
                    (p/resolve! password-promise password)
                    (shui/dialog-close!))}
       "OK")
      (shui/button
       {:on-click (fn []
                    (p/reject! password-promise (ex-info "cancelled" {}))
                    (shui/dialog-close!))}
       "Cancel")]]))

(rum/defc e2ee-password-to-decrypt-private-key
  [encrypted-private-key private-key-promise]
  (let [[password set-password!] (hooks/use-state "")
        [decrypt-fail? set-decrypt-fail] (hooks/use-state false)]
    [:div.e2ee-password-modal-overlay
     [:div.e2ee-password-modal-content
      [:h3 "Enter E2EE Password"]
      (when decrypt-fail? [:p "Wrong Password"])
      [:input {:type "password"
               :value password
               :on-change (fn [e] (set-password! (-> e .-target .-value)))}]
      (shui/button
       {:on-click (fn []
                    (->
                     (p/let [private-key (crypt/<decrypt-private-key password encrypted-private-key)]
                       (p/resolve! private-key-promise private-key)
                       (shui/dialog-close!))
                     (p/catch (fn [e]
                                (when (= "decrypt-private-key" (ex-message e))
                                  (set-decrypt-fail true))))))}
       "OK")
      (shui/button
       {:on-click (fn []
                    (p/reject! private-key-promise (ex-info "input E2EE password cancelled" {}))
                    (shui/dialog-close!))}
       "Cancel")]]))
