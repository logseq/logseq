(ns electron.db
  "Provides SQLite dbs for electron and manages files of those dbs"
  (:require ["path" :as node-path]
            ["fs-extra" :as fs]
            ["electron" :refer [app]]
            [electron.logger :as logger]
            [logseq.db.sqlite.db :as sqlite-db]))

(def close! sqlite-db/close!)

;; ~/logseq
(defn get-graphs-dir
  []
  (let [path (.getPath ^object app "home")]
    (node-path/join path "logseq" "graphs")))

(defn ensure-graphs-dir!
  []
  (fs/ensureDirSync (get-graphs-dir)))

(defn open-db!
  [db-name]
  (let [graphs-dir (get-graphs-dir)]
    (fs/ensureDirSync (node-path/join graphs-dir (sqlite-db/sanitize-db-name db-name)))
    (try (sqlite-db/open-db! graphs-dir db-name)
         (catch :default e
           (logger/error (str e ": " db-name))
           ;; (fs/unlinkSync db-full-path)
           ))))

(defn upsert-blocks!
  [repo blocks]
  (or (sqlite-db/upsert-blocks! repo blocks)
      ;; FIXME: When would an upsert not have a database connection?
      (do (open-db! repo)
          (sqlite-db/upsert-blocks! repo blocks))))

(defn unlink-graph!
  [repo]
  (let [db-name (sqlite-db/sanitize-db-name repo)
        path (node-path/join (get-graphs-dir) db-name)
        unlinked (node-path/join (get-graphs-dir) "Unlinked graphs")
        new-path (node-path/join unlinked db-name)]
    (when (fs/existsSync path)
      (fs/ensureDirSync unlinked)
      (fs/moveSync path new-path))))
