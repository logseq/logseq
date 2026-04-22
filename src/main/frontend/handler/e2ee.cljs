(ns frontend.handler.e2ee
  "rtc E2EE related fns"
  (:require [electron.ipc :as ipc]
            [frontend.mobile.secure-storage :as secure-storage]
            [frontend.util :as util]
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

(defn native-storage-supported?
  []
  (or (util/electron?) (util/capacitor?)))

(defn <native-save-secret!
  [key encrypted-text]
  (if (native-storage-supported?)
    (<keychain-save! key encrypted-text)
    (p/resolved nil)))

(defn <native-get-secret
  [key]
  (if (native-storage-supported?)
    (<keychain-get key)
    (p/resolved nil)))

(defn <native-delete-secret!
  [key]
  (if (native-storage-supported?)
    (<keychain-delete! key)
    (p/resolved nil)))
