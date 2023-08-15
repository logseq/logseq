(ns ^:node-only logseq.db.sqlite.cli
  "Primary ns to interact with DB graphs with node.js based CLIs"
  (:require [logseq.db.sqlite.db :as sqlite-db]
            [logseq.db.sqlite.restore :as sqlite-restore]
            [cljs-bean.core :as bean]
            [datascript.core :as d]
            ["fs" :as fs]
            ["path" :as node-path]))

(defn db-graph-directory?
  "Returns boolean indicating if the given directory is a DB graph"
  [graph-dir]
  (fs/existsSync (node-path/join graph-dir "db.sqlite")))

(defn read-graph
  "Reads a given sqlite db and returns a datascript connection of its contents.
   The sqlite db is assumed to have already been opened by sqlite-db/open-db!"
  [db-name]
  (let [{:keys [uuid->db-id-map conn]}
        (sqlite-restore/restore-initial-data (bean/->js (sqlite-db/get-initial-data db-name)))
        db (sqlite-restore/restore-other-data
                conn
                (sqlite-db/get-other-data db-name [])
                uuid->db-id-map)]
    (d/conn-from-db db)))