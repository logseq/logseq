(ns logseq.tasks.dev.publishing
  "Basic script for publishing from CLI"
  (:require [logseq.graph-parser.cli :as gp-cli]
            [logseq.publishing :as publishing]
            ["fs" :as fs]
            ["path" :as node-path]
            [clojure.edn :as edn]))


(defn- get-db [graph-dir]
  (let [{:keys [conn]} (gp-cli/parse-graph graph-dir {:verbose false})] @conn))

(defn -main
  [& args]
  (when-not (= 3 (count args))
    (println "Usage: $0 STATIC-DIR GRAPH-DIR OUT-DIR")
    (js/process.exit 1))
  (let [[static-dir graph-dir output-path]
        ;; Offset relative paths since they are run in a different directory than user is in
        (map #(if (node-path/isAbsolute %) % (node-path/resolve ".." %)) args)
        repo-config (-> (node-path/join graph-dir "logseq" "config.edn") fs/readFileSync str edn/read-string)]
    (publishing/export (get-db graph-dir)
                       static-dir
                       graph-dir
                       output-path
                       {:repo-config repo-config})))
