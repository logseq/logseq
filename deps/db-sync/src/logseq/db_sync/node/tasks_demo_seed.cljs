(ns logseq.db-sync.node.tasks-demo-seed
  "Write built-in classes, including Task, into a graph sqlite file.

  The semantic API opens that file later. Seeding has to finish, and the
  sqlite handle has to close, before the first request that opens the graph."
  (:require [datascript.core :as d]
            [logseq.db-sync.node.storage :as node-storage]
            [logseq.db-sync.storage :as storage]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]))

(defn- fail!
  [msg]
  (binding [*print-fn* *print-err-fn*]
    (println (str "Error: " msg)))
  (js/process.exit 1))

(defn main
  [& argv]
  (let [data-dir (first argv)
        graph-id (second argv)]
    (when (or (not (string? data-dir)) (not (string? graph-id)))
      (fail! "Usage: node worker/dist/tasks-demo-seed.js <data-dir> <graph-id>"))
    (let [{:keys [sql]} (node-storage/open-graph-db data-dir graph-id)]
      (try
        (let [conn (storage/open-conn sql)]
          (d/transact! conn (sqlite-create-graph/build-db-initial-data
                             "{}"
                             :creating-remote-graph? true))
          (println (str "seeded " graph-id)))
        (finally
          (.close sql))))))
