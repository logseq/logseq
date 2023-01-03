(ns frontend.db.persist
  "Handles operations to persisting db to disk or indexedDB"
  (:require [frontend.util :as util]
            [frontend.idb :as idb]
            [frontend.config :as config]
            [electron.ipc :as ipc]
            [frontend.db.conn :as db-conn]
            [promesa.core :as p]))

(defn get-all-graphs
  []
  (if (util/electron?)
    (p/let [result (ipc/ipc "getGraphs")
            result (vec result)
            ;; backward compatibility (release <= 0.5.4)
            result (if (seq result) result (idb/get-nfs-dbs))]
      result)
    (idb/get-nfs-dbs)))

(defn get-serialized-graph
  [graph-name]
  (if (util/electron?)
    (p/let [result (ipc/ipc "getSerializedGraph" graph-name)
            result (if result result
                       (let [graph-name (str config/idb-db-prefix graph-name)]
                         (idb/get-item graph-name)))]
      result)
    (idb/get-item graph-name)))

(defn save-graph!
  [key value]
  (if (util/electron?)
    (do
      (ipc/ipc "saveGraph" key value)
      ;; remove cache before 0.5.5
      (idb/remove-item! key))
    (idb/set-batch! [{:key key :value value}])))

(defn delete-graph!
  [graph]
  (let [key (db-conn/datascript-db graph)]
    (if (util/electron?)
      (do
        (ipc/ipc "deleteGraph" key)
        (idb/remove-item! key))
     (idb/remove-item! key))))
