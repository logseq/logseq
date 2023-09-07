(ns frontend.db.persist
  "Handles operations to persisting db to disk or indexedDB"
  (:require [frontend.util :as util]
            [frontend.idb :as idb]
            [frontend.config :as config]
            [electron.ipc :as ipc]
            [frontend.db.conn :as db-conn]
            [promesa.core :as p]
            [frontend.persist-db :as persist-db]))

(defn get-all-graphs
  []
  (if (util/electron?)
    (p/let [result (ipc/ipc "getGraphs")
            result (vec result)
            ;; backward compatibility (release <= 0.5.4)
            result (if (seq result) result (idb/get-nfs-dbs))]
      (distinct result))
    (p/let [repos (idb/get-nfs-dbs)
            db-repos (persist-db/<list-db)]
      (concat repos db-repos))))

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
  (let [key (db-conn/datascript-db graph)
        db-based? (config/db-based-graph? graph)]
    (persist-db/<unsafe-delete graph)
    (if (util/electron?)
      (ipc/ipc "deleteGraph" graph key db-based?)
     (idb/remove-item! key))))

(defn rename-graph!
  [old-repo new-repo]
  (let [old-key (db-conn/datascript-db old-repo)
        new-key (db-conn/datascript-db new-repo)]
    (if (util/electron?)
      (do
        (js/console.error "rename-graph! is not supported in electron")
        (idb/rename-item! old-key new-key))
      (idb/rename-item! old-key new-key))))

