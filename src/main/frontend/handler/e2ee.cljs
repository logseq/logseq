(ns frontend.handler.e2ee
  "rtc E2EE related fns"
  (:require [frontend.common.crypt :as crypt]
            [frontend.common.thread-api :refer [def-thread-api]]
            [frontend.state :as state]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

(def-thread-api :thread-api/request-e2ee-password
  []
  (p/let [password-promise (state/pub-event! [:rtc/request-e2ee-password])
          password password-promise]
    {:password password}))

(defn- <decrypt-user-e2ee-private-key
  [encrypted-private-key]
  (->
   (p/let [private-key-promise (state/pub-event! [:rtc/decrypt-user-e2ee-private-key encrypted-private-key])
           private-key private-key-promise]
     (crypt/<export-private-key private-key))
   (p/catch (fn [e]
              (log/error :<decrypt-user-e2ee-private-key e)
              e))))

(def-thread-api :thread-api/decrypt-user-e2ee-private-key
  [encrypted-private-key]
  (<decrypt-user-e2ee-private-key encrypted-private-key))
