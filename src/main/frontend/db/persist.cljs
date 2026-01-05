(ns frontend.db.persist
  "Handles operations to persisting db to disk or indexedDB"
  (:require [cljs-bean.core :as bean]
            [electron.ipc :as ipc]
            [frontend.config :as config]
            [frontend.db.conn :as db-conn]
            [frontend.persist-db :as persist-db]
            [frontend.util :as util]
            [logseq.db.common.sqlite :as common-sqlite]
            [promesa.core :as p]))

(defn get-all-graphs
  []
  (p/let [repos (persist-db/<list-db)
          repos' (->> repos
                      (remove (fn [{:keys [name]}]
                                (common-sqlite/local-file-based-graph? name)))
                      (map
                       (fn [{:keys [name] :as repo}]
                         (assoc repo :name
                                (str config/db-version-prefix name)))))
          electron-disk-graphs (when (util/electron?) (ipc/ipc "getGraphs"))]
    (distinct
     (concat
      repos'
      (map (fn [repo-name] {:name repo-name})
           (some-> electron-disk-graphs bean/->clj))))))

(defn delete-graph!
  [graph]
  (let [key (db-conn/get-repo-path graph)]
    (p/let [_ (persist-db/<unsafe-delete graph)]
      (when (util/electron?)
        (ipc/ipc "deleteGraph" graph key true)))))
