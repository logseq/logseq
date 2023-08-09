(ns frontend.persist-db
  "Backend of DB based graph"
  (:require [frontend.persist-db.browser :as browser]
            [frontend.persist-db.node :as node]
            [frontend.persist-db.protocol :as protocol]
            [frontend.util :as util]
            [promesa.core :as p]))


(defonce electron-ipc-sqlite-db (node/->ElectronIPC))

(defonce opfs-db (browser/->InBrowser))

(defn- get-impl
  "Get the actual implementation of PersistentDB"
  []
  (cond
    (util/electron?)
    electron-ipc-sqlite-db

    :else
    opfs-db))



(defn <new [repo]
  (protocol/<new (get-impl) repo))

(defn <transact-data [repo added-blocks deleted-block-uuids]
  (protocol/<transact-data (get-impl) repo added-blocks deleted-block-uuids))

(defn <fetch-init-data
  ([repo]
   (<fetch-init-data repo {}))
  ([repo opts]
   (p/let [ret (protocol/<fetch-initital-data (get-impl) repo opts)]
     (js/console.log "fetch-initital" ret)
     ret)))

(defn <fetch-blocks-excluding
  ([repo exclude-uuids]
   (<fetch-blocks-excluding repo exclude-uuids {}))
  ([repo exclude-uuids opts]
   (p/let [ret (protocol/<fetch-blocks-excluding (get-impl) repo exclude-uuids opts)]
     (js/console.log "fetch-by-exclude" ret)
     ret)))

(defn <rtc-init [repo]
  (protocol/<rtc-init (get-impl) repo))

(defn <rtc-clean-ops [repo]
  (protocol/<rtc-clean-ops (get-impl) repo))

(defn <rtc-get-ops [repo]
  (protocol/<rtc-get-ops (get-impl) repo))

(defn <rtc-add-ops [repo raw-ops]
  (protocol/<rtc-add-ops (get-impl) repo raw-ops))
