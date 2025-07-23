(ns logseq.cli.util
  "Util fns"
  (:require ["path" :as node-path]
            [logseq.cli.common.graph :as cli-common-graph]
            [logseq.db.common.sqlite :as common-sqlite]))

(defn get-graph-dir
  [graph]
  (node-path/join (cli-common-graph/get-db-graphs-dir) (common-sqlite/sanitize-db-name graph)))

(defn ->open-db-args
  "Creates args for sqlite-cli/open-db! given a graph. Similar to sqlite-cli/->open-db-args"
  [graph]
  [(cli-common-graph/get-db-graphs-dir) (common-sqlite/sanitize-db-name graph)])