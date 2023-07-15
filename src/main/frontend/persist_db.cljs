(ns frontend.persist-db
  (:require [frontend.persist-db.in-browser :as in-browser]
            [frontend.persist-db.node :as node]
            [frontend.persist-db.protocol :as protocol]
            [frontend.util :as util]))


(defonce electron-ipc-sqlite-db (node/->ElectronIPC))

(defonce opfs-db (in-browser/->InBrowser))

(defn- get-impl
  "Get the actual implementation of PersistentDB"
  []
  (cond
    (util/electron?)
    electron-ipc-sqlite-db

    :else
    opfs-db
    ;(throw (js/Error. "No implementation found"))
    ))



(defn new [repo-name]
  (protocol/new (get-impl) repo-name))

(defn transact-data [repo-name added-blocks deleted-block-uuids]
  (protocol/transact-data (get-impl) repo-name added-blocks deleted-block-uuids))

(defn fetch-initital
  ([repo-name]
   (protocol/fetch-initital (get-impl) repo-name {}))
  ([repo-name opts]
   (protocol/fetch-initital (get-impl) repo-name opts)))

(defn fetch-by-exclude
  ([repo-name exclude-uuids]
   (protocol/fetch-by-exclude (get-impl) repo-name exclude-uuids {}))
  ([repo-name exclude-uuids opts]
   (protocol/fetch-by-exclude (get-impl) repo-name exclude-uuids opts)))


