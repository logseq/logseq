(ns electron.db
  "Provides SQLite dbs for electron and manages files of those dbs"
  (:require ["path" :as node-path]
            ["fs-extra" :as fs]
            ["electron" :refer [app]]
            [electron.logger :as logger]
            [logseq.db.sqlite.db :as sqlite-db]
            [electron.backup-file :as backup-file]))

(def close! sqlite-db/close!)

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
  (let [graph-dir (node-path/join (get-graphs-dir) (sqlite-db/sanitize-db-name db-name))]
    (fs/ensureDirSync graph-dir)
    graph-dir))

(defn open-db!
  [db-name]
  (let [graphs-dir (get-graphs-dir)]
    (try (sqlite-db/open-db! graphs-dir db-name)
         (catch :default e
           (js/console.error e)
           (logger/error (str e ": " db-name))))))

(defn save-db!
  [db-name data]
  (let [graph-dir (ensure-graph-dir! db-name)
        [_db-name db-path] (sqlite-db/get-db-full-path (get-graphs-dir) db-name)]
    (fs/writeFileSync db-path data)
    (backup-file/backup-file graph-dir :backup-dir
                             ""
                             ".sqlite"
                             data
                             {:add-desktop? false
                              :skip-backup-fn (fn [latest-backup-size]
                                                (= latest-backup-size (.-length data)))})))

(def unlinked-graphs-dir "Unlinked graphs")

(defn unlink-graph!
  [repo]
  (let [db-name (sqlite-db/sanitize-db-name repo)
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
