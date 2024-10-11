(ns frontend.worker.device
  "Each device is assigned an id, and has some metadata(e.g. public&private-key for each device)"
  (:require ["/frontend/idbkv" :as idb-keyval]
            [datascript.core :as d]
            [frontend.worker.crypt :as crypt]
            [frontend.worker.rtc.ws-util :as ws-util]
            [logseq.db :as ldb]
            [promesa.core :as p]))

;;; TODO: move frontend.idb to deps/, then we can use it in both frontend and db-worker
;;; now, I just direct use "/frontend/idbkv" here
(defonce ^:private store (delay (idb-keyval/newStore "localforage" "keyvaluepairs" 2)))

(defn- <get-item
  [key']
  (when (and key' @store)
    (idb-keyval/get key' @store)))

(defn- <set-item!
  [key' value]
  (when (and key' @store)
    (idb-keyval/set key' value @store)))

(def ^:private item-key-device-id "device-id")
(def ^:private item-key-device-public-key-jwk "device-public-key-jwk")
(def ^:private item-key-device-private-key-jwk "device-private-key-jwk")

(defonce *device-id (atom nil :validator uuid?))
(defonce *device-public-key (atom nil :validator #(instance? js/CryptoKey %)))
(defonce *device-private-key (atom nil :validator #(instance? js/CryptoKey %)))

(defn <ensure-device-metadata!
  "Generate new device items if not exists.
  Store in indexeddb.
  Import to `*device-id`, `*device-public-key`, `*device-private-key`"
  []
  (p/let [device-uuid (<get-item item-key-device-id)]
    (when-not device-uuid
      (p/let [device-uuid (d/squuid)
              {:keys [publicKey privateKey]} (crypt/<gen-key-pair)
              public-key-jwk (crypt/<export-key publicKey)
              private-key-jwk (crypt/<export-key privateKey)]
        (<set-item! item-key-device-id (str device-uuid))
        (<set-item! item-key-device-public-key-jwk public-key-jwk)
        (<set-item! item-key-device-private-key-jwk private-key-jwk)))

    (p/let [device-uuid-str (<get-item item-key-device-id)
            device-public-key-jwk (<get-item item-key-device-public-key-jwk)
            device-public-key (crypt/<import-public-key device-public-key-jwk)
            device-private-key-jwk (<get-item item-key-device-private-key-jwk)
            device-private-key (crypt/<import-private-key device-private-key-jwk)]
      (reset! *device-id (uuid device-uuid-str))
      (reset! *device-public-key device-public-key)
      (reset! *device-private-key device-private-key))))

(defn new-task--get-user-devices
  [get-ws-create-task]
  (ws-util/send&recv get-ws-create-task {:action "get-user-devices"}))

(defn new-task--add-user-device
  [get-ws-create-task device-name]
  (ws-util/send&recv get-ws-create-task {:action "add-user-device"
                                         :device-name device-name}))

(defn new-task--remove-user-device
  [get-ws-create-task device-uuid]
  (ws-util/send&recv get-ws-create-task {:action "remove-user-device"
                                         :device-uuid device-uuid}))

(defn new-task--add-device-public-key
  [get-ws-create-task device-uuid key-name public-key-jwk]
  (ws-util/send&recv get-ws-create-task {:action "add-device-public-key"
                                         :device-uuid device-uuid
                                         :key-name key-name
                                         :public-key (ldb/write-transit-str public-key-jwk)}))

(defn new-task--remove-device-public-key
  [get-ws-create-task device-uuid key-name]
  (ws-util/send&recv get-ws-create-task {:action "remove-device-public-key"
                                         :device-uuid device-uuid
                                         :key-name key-name}))
