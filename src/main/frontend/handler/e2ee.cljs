(ns frontend.handler.e2ee
  "rtc E2EE related fns"
  (:require [electron.ipc :as ipc]
            [frontend.common.crypt :as crypt]
            [frontend.common.thread-api :refer [def-thread-api]]
            [frontend.state :as state]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

(def ^:private save-op :keychain/save-e2ee-password)
(def ^:private get-op :keychain/get-e2ee-password)
(def ^:private delete-op :keychain/delete-e2ee-password)

(defn- <keychain-save!
  [refresh-token encrypted-text]
  (if (util/electron?)
    (-> (ipc/ipc save-op refresh-token encrypted-text)
        (p/catch (fn [e]
                   (log/error :keychain-save-failed e)
                   (throw e))))
    (p/resolved nil)))

(defn- <keychain-get
  [refresh-token]
  (if (util/electron?)
    (-> (ipc/ipc get-op refresh-token)
        (p/catch (fn [e]
                   (log/error :keychain-get-failed e)
                   (throw e))))
    (p/resolved nil)))

(defn- <keychain-delete!
  [refresh-token]
  (if (util/electron?)
    (-> (ipc/ipc delete-op refresh-token)
        (p/catch (fn [e]
                   (log/error :keychain-delete-failed e)
                   (throw e))))
    (p/resolved nil)))

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

(def-thread-api :thread-api/electron-save-e2ee-password
  [refresh-token encrypted-text]
  (<keychain-save! refresh-token encrypted-text))

(def-thread-api :thread-api/electron-get-e2ee-password
  [refresh-token]
  (<keychain-get refresh-token))

(def-thread-api :thread-api/electron-delete-e2ee-password
  [refresh-token]
  (<keychain-delete! refresh-token))
