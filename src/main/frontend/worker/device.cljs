(ns frontend.worker.device
  "Each device is assigned an id, and has some metadata(e.g. public&private-key for each device)"
  (:require ["/frontend/idbkv" :as idb-keyval]
            [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [clojure.string :as string]
            [frontend.common.missionary-util :as c.m]
            [frontend.worker.crypt :as crypt]
            [frontend.worker.rtc.ws-util :as ws-util]
            [logseq.db :as ldb]
            [missionary.core :as m]
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
(def ^:private item-key-device-name "device-name")
(def ^:private item-key-device-created-at "device-created-at")
(def ^:private item-key-device-updated-at "device-updated-at")
(def ^:private item-key-device-public-key-jwk "device-public-key-jwk")
(def ^:private item-key-device-private-key-jwk "device-private-key-jwk")

(defonce *device-id (atom nil :validator uuid?))
(defonce *device-name (atom nil))
(defonce *device-public-key (atom nil :validator #(instance? js/CryptoKey %)))
(defonce *device-private-key (atom nil :validator #(instance? js/CryptoKey %)))

(defn- new-task--get-user-devices
  [get-ws-create-task]
  (m/join :devices (ws-util/send&recv get-ws-create-task {:action "get-user-devices"})))

(defn- new-task--add-user-device
  [get-ws-create-task device-name]
  (m/join :device (ws-util/send&recv get-ws-create-task {:action "add-user-device"
                                                         :device-name device-name})))

(defn- new-task--remove-user-device
  [get-ws-create-task device-uuid]
  (ws-util/send&recv get-ws-create-task {:action "remove-user-device"
                                         :device-uuid device-uuid}))

(defn- new-task--update-user-device-name
  [get-ws-create-task device-uuid device-name]
  (ws-util/send&recv get-ws-create-task {:action "update-user-device-name"
                                         :device-uuid device-uuid
                                         :device-name device-name}))

(defn- new-task--add-device-public-key
  [get-ws-create-task device-uuid key-name public-key-jwk]
  (ws-util/send&recv get-ws-create-task {:action "add-device-public-key"
                                         :device-uuid device-uuid
                                         :key-name key-name
                                         :public-key (ldb/write-transit-str public-key-jwk)}))

(defn- new-task--remove-device-public-key
  [get-ws-create-task device-uuid key-name]
  (ws-util/send&recv get-ws-create-task {:action "remove-device-public-key"
                                         :device-uuid device-uuid
                                         :key-name key-name}))

(defn- new-get-ws-create-task
  [token]
  (:get-ws-create-task (ws-util/gen-get-ws-create-map--memoized (ws-util/get-ws-url token))))

(defn new-task--ensure-device-metadata!
  "Generate new device items if not exists.
  Store in indexeddb.
  Import to `*device-id`, `*device-public-key`, `*device-private-key`"
  [token]
  (m/sp
    (let [device-uuid (c.m/<? (<get-item item-key-device-id))]
      (when-not device-uuid
        (let [get-ws-create-task (new-get-ws-create-task token)
              agent-data (js->clj (.toJSON js/navigator.userAgentData) :keywordize-keys true)
              generated-device-name (string/join
                                     "-"
                                     [(:platform agent-data)
                                      (when (:mobile agent-data) "mobile")
                                      (:brand (first (:brands agent-data)))
                                      (tc/to-epoch (t/now))])
              {:keys [device-id device-name created-at updated-at]}
              (new-task--add-user-device get-ws-create-task generated-device-name)
              {:keys [publicKey privateKey]} (c.m/<? (crypt/<gen-key-pair))
              public-key-jwk (c.m/<? (crypt/<export-key publicKey))
              private-key-jwk (c.m/<? (crypt/<export-key privateKey))]
          (c.m/<? (<set-item! item-key-device-id (str device-id)))
          (c.m/<? (<set-item! item-key-device-name device-name))
          (c.m/<? (<set-item! item-key-device-created-at created-at))
          (c.m/<? (<set-item! item-key-device-updated-at updated-at))
          (c.m/<? (<set-item! item-key-device-public-key-jwk public-key-jwk))
          (c.m/<? (<set-item! item-key-device-private-key-jwk private-key-jwk))
          (m/? (new-task--add-device-public-key
                get-ws-create-task device-id "default-public-key" public-key-jwk))))
      (c.m/<?
       (p/let [device-uuid-str (<get-item item-key-device-id)
               device-name (<get-item item-key-device-name)
               device-public-key-jwk (<get-item item-key-device-public-key-jwk)
               device-public-key (crypt/<import-public-key device-public-key-jwk)
               device-private-key-jwk (<get-item item-key-device-private-key-jwk)
               device-private-key (crypt/<import-private-key device-private-key-jwk)]
         (reset! *device-id (uuid device-uuid-str))
         (reset! *device-name device-name)
         (reset! *device-public-key device-public-key)
         (reset! *device-private-key device-private-key))))))

(defn new-task--list-devices
  "Return device list.
  Also sync local device metadata to remote if not exists in remote side"
  [token]
  (m/sp
    (let [get-ws-create-task (new-get-ws-create-task token)
          devices (m/? (new-task--get-user-devices get-ws-create-task))]
      (when ;; check current device has been synced to remote
       (and @*device-id @*device-name @*device-public-key
            (not (some
                  (fn [device]
                    (let [{:keys [device-id]} device]
                      (when (= device-id @*device-id)
                        true)))
                  devices)))
        (m/? (new-task--add-user-device get-ws-create-task @*device-name))
        (m/? (new-task--add-device-public-key
              get-ws-create-task @*device-id "default-public-key" @*device-public-key)))
      (prn :debug-devices devices)
      devices)))
