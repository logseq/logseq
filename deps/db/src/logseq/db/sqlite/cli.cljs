(ns ^:node-only logseq.db.sqlite.cli
  "Primary ns to interact with DB graphs with node.js based CLIs"
  (:require [logseq.db.sqlite.db :as sqlite-db]
            [logseq.db.sqlite.common-db :as sqlite-common-db]
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
  (-> (sqlite-db/get-conn db-name)
      deref
      sqlite-common-db/get-initial-data
      sqlite-common-db/restore-initial-data))