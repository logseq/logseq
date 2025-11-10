(ns frontend.handler.events.rtc
  "RTC events"
  (:require [frontend.components.e2ee :as e2ee]
            [frontend.handler.events :as events]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

(defmethod events/handle :rtc/decrypt-user-e2ee-private-key [[_ encrypted-private-key]]
  (let [private-key-promise (p/deferred)]
    (shui/dialog-close-all!)
    (shui/dialog-open!
     #(e2ee/e2ee-password-to-decrypt-private-key encrypted-private-key private-key-promise)
     {:close-btn? false
      :auto-width? true})
    private-key-promise))

(defmethod events/handle :rtc/request-e2ee-password [[_]]
  (let [password-promise (p/deferred)]
    (shui/dialog-close-all!)
    (shui/dialog-open!
     #(e2ee/e2ee-request-new-password password-promise)
     {:close-btn? false
      :auto-width? true})
    password-promise))
