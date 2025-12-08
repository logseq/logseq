(ns frontend.handler.e2ee
  "rtc E2EE related fns"
  (:require [electron.ipc :as ipc]
            [frontend.common.crypt :as crypt]
            [frontend.common.thread-api :refer [def-thread-api]]
            [frontend.mobile.secure-storage :as secure-storage]
            [frontend.state :as state]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

(def ^:private save-op :keychain/save-e2ee-password)
(def ^:private get-op :keychain/get-e2ee-password)
(def ^:private delete-op :keychain/delete-e2ee-password)

(defn- <keychain-save!
  [key encrypted-text]
  (cond
    (util/electron?)
    (ipc/ipc save-op key encrypted-text)

    (util/capacitor?)
    (secure-storage/<set-item! key encrypted-text)

    :else
    (p/resolved nil)))

(defn- <keychain-get
  [key]
  (cond
    (util/electron?)
    (ipc/ipc get-op key)

    (util/capacitor?)
    (secure-storage/<get-item key)

    :else
    (p/resolved nil)))

(defn- <keychain-delete!
  [key]
  (cond
    (util/electron?)
    (ipc/ipc delete-op key)

    (util/capacitor?)
    (secure-storage/<remove-item! key)

    :else
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

(def-thread-api :thread-api/native-save-e2ee-password
  [encrypted-text]
  (<keychain-save! "logseq-encrypted-password" encrypted-text))

(def-thread-api :thread-api/native-get-e2ee-password
  []
  (<keychain-get "logseq-encrypted-password"))

(def-thread-api :thread-api/native-delete-e2ee-password
  []
  (<keychain-delete! "logseq-encrypted-password"))
