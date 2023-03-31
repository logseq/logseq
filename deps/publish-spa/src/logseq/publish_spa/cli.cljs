(ns logseq.publish-spa.cli
  (:require [logseq.graph-parser.cli :as gp-cli]
            [logseq.publish-spa :as publish-spa]
            ["fs" :as fs]
            ["path" :as path]
            [clojure.edn :as edn]))


(defn- get-db [graph-dir]
  (let [{:keys [conn]} (gp-cli/parse-graph graph-dir {:verbose false})] @conn))

(defn -main
  [& args]
  (let [graph-dir  (or (first args)
                       (throw (ex-info "GRAPH DIR required" {})))
        output-path (or (second args)
                        (throw (ex-info "OUT DIR required" {})))
        repo-config (-> (path/join graph-dir "logseq" "config.edn") fs/readFileSync str edn/read-string)]
    (publish-spa/publish (get-db graph-dir)
                         "../../static"
                         graph-dir
                         output-path
                         {:repo-config repo-config})))
