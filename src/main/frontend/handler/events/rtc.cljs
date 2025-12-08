(ns frontend.handler.events.rtc
  "RTC events"
  (:require [frontend.common.crypt :as crypt]
            [frontend.components.e2ee :as e2ee]
            [frontend.handler.events :as events]
            [frontend.state :as state]
            [lambdaisland.glogi :as log]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

(defmethod events/handle :rtc/decrypt-user-e2ee-private-key [[_ encrypted-private-key]]
  (let [private-key-promise (p/deferred)
        refresh-token (str (state/get-auth-refresh-token))]
    (shui/dialog-close-all!)
    (->
     (p/let [{:keys [password]} (state/<invoke-db-worker :thread-api/get-e2ee-password refresh-token)
             private-key (crypt/<decrypt-private-key password encrypted-private-key)]
       (p/resolve! private-key-promise private-key))
     (p/catch
      (fn [error]
        (log/error :read-e2ee-password-failed error)
        (shui/dialog-open!
         #(e2ee/e2ee-password-to-decrypt-private-key encrypted-private-key private-key-promise refresh-token)
         {:auto-width? true
          :content-props {:onPointerDownOutside #(.preventDefault %)}
          :on-close (fn []
                      (p/reject! private-key-promise (ex-info "input E2EE password cancelled" {}))
                      (shui/dialog-close!))}))))
    private-key-promise))

(defmethod events/handle :rtc/request-e2ee-password [[_]]
  (let [password-promise (p/deferred)]
    (shui/dialog-close-all!)
    (shui/dialog-open!
     #(e2ee/e2ee-request-new-password password-promise)
     {:auto-width? true
      :content-props {:onPointerDownOutside #(.preventDefault %)}
      :on-close (fn []
                  (p/reject! password-promise (ex-info "cancelled" {}))
                  (shui/dialog-close!))})
    password-promise))
