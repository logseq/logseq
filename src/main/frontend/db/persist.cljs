(ns frontend.db.persist
  "Handles operations to persisting db to disk or indexedDB"
  (:require [frontend.util :as util]
            [frontend.idb :as idb]
            [electron.ipc :as ipc]
            [frontend.db.conn :as db-conn]
            [promesa.core :as p]
            [frontend.persist-db :as persist-db]
            [cljs-bean.core :as bean]
            [frontend.config :as config]))

(defn get-all-graphs
  []
  (p/let [repos (idb/get-nfs-dbs)
          db-repos (persist-db/<list-db)
          db-repos' (map
                      #(if (config/local-file-based-graph? %)
                         %
                         (str config/db-version-prefix %))
                      db-repos)
          electron-disk-graphs (when (util/electron?) (ipc/ipc "getGraphs"))]
    (distinct (concat repos db-repos' (some-> electron-disk-graphs bean/->clj)))))

(defn delete-graph!
  [graph]
  (let [key (db-conn/datascript-db graph)
        db-based? (config/db-based-graph? graph)]
    (p/let [_ (persist-db/<unsafe-delete graph)]
      (if (util/electron?)
        (ipc/ipc "deleteGraph" graph key db-based?)
        (idb/remove-item! key)))))

(defn rename-graph!
  [old-repo new-repo]
  (let [old-key (db-conn/datascript-db old-repo)
        new-key (db-conn/datascript-db new-repo)]
    (if (util/electron?)
      (do
        (js/console.error "rename-graph! is not supported in electron")
        (idb/rename-item! old-key new-key))
      (idb/rename-item! old-key new-key))))
