(ns ^:node-only logseq.cli.common.graph
  "Graph related fns shared between CLI and electron"
  (:require ["fs-extra" :as fs-extra]
            [clojure.string :as string]
            [logseq.common.config :as common-config]
            [logseq.common.graph :as common-graph]
            [logseq.common.graph-dir :as graph-dir]))

(defn ^:api graph-name->path
  [graph-name]
  (graph-dir/decode-graph-dir-name graph-name))

(defn get-db-graphs-dir
  "Directory where DB graphs are stored"
  []
  (common-graph/expand-home (common-graph/get-default-graphs-dir)))

(defn get-db-based-graphs
  []
  (let [dir (get-db-graphs-dir)]
    (fs-extra/ensureDirSync dir)
    (->> (common-graph/read-directories dir)
         (remove (fn [s] (= s common-config/unlinked-graphs-dir)))
         (map graph-name->path)
         (keep (fn [s]
                 (when (and (string? s)
                            (not (string/starts-with? s common-config/file-version-prefix)))
                   (common-config/canonicalize-db-version-repo s))))
         distinct)))
