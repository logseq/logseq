(ns frontend.db.persist
  (:require [frontend.util :as util]
            [frontend.mobile.util :as mobile]
            [frontend.idb :as idb]
            [electron.ipc :as ipc]
            [frontend.db.conn :as db-conn]
            [promesa.core :as p]))

(defn get-all-graphs
  []
  (if (util/electron?)
    (p/let [result (ipc/ipc "getGraphs")]
      (vec result))
    (idb/get-nfs-dbs)))

(defn get-serialized-graph
  [graph-name]
  (if (util/electron?)
    (ipc/ipc "getSerializedGraph" graph-name)
    (idb/get-item graph-name)))

(defn save-graph!
  [key value]
  (if (util/electron?)
    (ipc/ipc "saveGraph" key value)
    (idb/set-batch! [{:key key :value value}])))

(defn delete-graph!
  [graph]
  (let [key (db-conn/datascript-db graph)]
    (if (util/electron?)
     (ipc/ipc "deleteGraph" key)
     (idb/remove-item! key))))
