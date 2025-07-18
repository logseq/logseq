(ns electron.db
  "Provides SQLite dbs for electron and manages files of those dbs"
  (:require ["electron" :refer [app]]
            ["fs-extra" :as fs]
            ["path" :as node-path]
            [logseq.common.config :as common-config]
            [logseq.db.common.sqlite :as common-sqlite]))

(defn get-graphs-dir
  []
  (let [path (.getPath ^object app "home")]
    (node-path/join path "logseq" "graphs")))

(defn ensure-graphs-dir!
  []
  (fs/ensureDirSync (get-graphs-dir)))

(defn ensure-graph-dir!
  [db-name]
  (ensure-graphs-dir!)
  (let [graph-dir (node-path/join (get-graphs-dir) (common-sqlite/sanitize-db-name db-name))]
    (fs/ensureDirSync graph-dir)
    graph-dir))

(defn save-db!
  [db-name data]
  (let [[_db-name db-path] (common-sqlite/get-db-full-path (get-graphs-dir) db-name)]
    (fs/writeFileSync db-path data)))

(defn get-db
  [db-name]
  (let [_ (ensure-graph-dir! db-name)
        [_db-name db-path] (common-sqlite/get-db-full-path (get-graphs-dir) db-name)]
    (when (fs/existsSync db-path)
      (fs/readFileSync db-path))))

(defn unlink-graph!
  [repo]
  (let [db-name (common-sqlite/sanitize-db-name repo)
        path (node-path/join (get-graphs-dir) db-name)
        unlinked (node-path/join (get-graphs-dir) common-config/unlinked-graphs-dir)
        new-path (node-path/join unlinked db-name)
        new-path-exists? (fs/existsSync new-path)
        new-path' (if new-path-exists?
                    (node-path/join unlinked (str db-name "-" (random-uuid)))
                    new-path)]
    (when (fs/existsSync path)
      (fs/ensureDirSync unlinked)
      (fs/moveSync path new-path'))))
