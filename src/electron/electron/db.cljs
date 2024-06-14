(ns electron.db
  "Provides SQLite dbs for electron and manages files of those dbs"
  (:require ["path" :as node-path]
            ["fs-extra" :as fs]
            ["electron" :refer [app]]
            [logseq.db.sqlite.common-db :as sqlite-common-db]))

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
  (let [graph-dir (node-path/join (get-graphs-dir) (sqlite-common-db/sanitize-db-name db-name))]
    (fs/ensureDirSync graph-dir)
    graph-dir))

(defn save-db!
  [db-name data]
  (let [[_db-name db-path] (sqlite-common-db/get-db-full-path (get-graphs-dir) db-name)]
    (fs/writeFileSync db-path data)))

(defn get-db
  [db-name]
  (let [_ (ensure-graph-dir! db-name)
        [_db-name db-path] (sqlite-common-db/get-db-full-path (get-graphs-dir) db-name)]
    (when (fs/existsSync db-path)
      (fs/readFileSync db-path))))

(def unlinked-graphs-dir "Unlinked graphs")

(defn unlink-graph!
  [repo]
  (let [db-name (sqlite-common-db/sanitize-db-name repo)
        path (node-path/join (get-graphs-dir) db-name)
        unlinked (node-path/join (get-graphs-dir) unlinked-graphs-dir)
        new-path (node-path/join unlinked db-name)
        new-path-exists? (fs/existsSync new-path)
        new-path' (if new-path-exists?
                    (node-path/join unlinked (str db-name "-" (random-uuid)))
                    new-path)]
    (when (fs/existsSync path)
      (fs/ensureDirSync unlinked)
      (fs/moveSync path new-path'))))
