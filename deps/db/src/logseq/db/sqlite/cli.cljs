(ns ^:node-only logseq.db.sqlite.cli
  "Primary ns to interact with DB graphs with node.js based CLIs"
  (:require ["fs" :as fs]
            ["path" :as node-path]))

(defn db-graph-directory?
  "Returns boolean indicating if the given directory is a DB graph"
  [graph-dir]
  (fs/existsSync (node-path/join graph-dir "db.sqlite")))