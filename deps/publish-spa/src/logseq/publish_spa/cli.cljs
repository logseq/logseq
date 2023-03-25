(ns logseq.publish-spa.cli
  (:require [logseq.graph-parser.cli :as gp-cli]
            [logseq.publish-spa :as publish-spa]
            ["fs" :as fs]
            ["path" :as path]
            [clojure.edn :as edn]))

(defn- get-repo-config
  [dir]
  (if (fs/existsSync (path/join dir "logseq" "config.edn"))
    (-> (path/join dir "logseq" "config.edn") fs/readFileSync str edn/read-string)
    {}))

(defn- get-app-state
  []
  {:ui/theme "dark", :ui/sidebar-collapsed-blocks {}, :ui/show-recent? false})

(defn- get-db [graph-dir]
  (let [{:keys [conn]} (gp-cli/parse-graph graph-dir {:verbose false})] @conn))

(defn -main
  [& args]
  (let [graph-dir  (or (first args)
                       (throw (ex-info "GRAPH DIR required" {})))
        output-path (or (second args)
                        (throw (ex-info "OUT DIR required" {})))
        repo-config (get-repo-config graph-dir)]
    (publish-spa/publish (get-db graph-dir)
                         graph-dir
                         output-path
                         {:app-state (get-app-state)
                          :repo-config repo-config})))
