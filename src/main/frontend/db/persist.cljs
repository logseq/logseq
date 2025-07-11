(ns frontend.db.persist
  "Handles operations to persisting db to disk or indexedDB"
  (:require [cljs-bean.core :as bean]
            [electron.ipc :as ipc]
            [frontend.config :as config]
            [frontend.db.conn :as db-conn]
            [frontend.idb :as idb]
            [frontend.persist-db :as persist-db]
            [frontend.util :as util]
            [promesa.core :as p]))

(defn get-all-graphs
  []
  (p/let [idb-repos (idb/get-nfs-dbs)
          repos (persist-db/<list-db)
          repos' (map
                  (fn [{:keys [name] :as repo}]
                    (assoc repo :name
                           (if (config/local-file-based-graph? name)
                             name
                             (str config/db-version-prefix name))))
                  repos)
          electron-disk-graphs (when (util/electron?) (ipc/ipc "getGraphs"))]
    (distinct (concat
               repos'
               (map (fn [repo-name] {:name repo-name})
                    (concat idb-repos (some-> electron-disk-graphs bean/->clj)))))))

(defn delete-graph!
  [graph]
  (let [key (db-conn/get-repo-path graph)
        db-based? (config/db-based-graph? graph)]
    (p/let [_ (persist-db/<unsafe-delete graph)]
      (if (util/electron?)
        (ipc/ipc "deleteGraph" graph key db-based?)
        (idb/remove-item! key)))))
