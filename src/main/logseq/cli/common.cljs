(ns logseq.cli.common
  "Shared local graph deletion entry point."
  (:require ["@logseq/graph-lifecycle" :as lifecycle]
            ["path" :as node-path]
            [logseq.common.graph :as common-graph]
            [promesa.core :as p]))

(defn <unlink-graph!
  "Stops graph workers and preserves `repo` under Unlinked graphs."
  ([repo]
   (<unlink-graph! (common-graph/expand-home (common-graph/get-default-graphs-dir)) repo))
  ([graphs-dir repo]
   (<unlink-graph! graphs-dir repo nil))
  ([graphs-dir repo commit]
   (p/let [result (lifecycle/deleteGraph
                  (lifecycle/resolveStorage
                   (node-path/dirname (common-graph/expand-home graphs-dir))
                   (common-graph/expand-home graphs-dir)) repo commit)]
     (when-not (.-existed ^js result)
       (throw (ex-info "Graph does not exist" {:code :graph-not-exists :repo repo})))
     (.-destination ^js result))))
