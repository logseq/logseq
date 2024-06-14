(ns logseq.tasks.dev.publishing
  "Basic script for publishing from CLI"
  (:require [logseq.graph-parser.cli :as gp-cli]
            [logseq.publishing :as publishing]
            [logseq.db.sqlite.cli :as sqlite-cli]
            ["fs" :as fs]
            ["path" :as node-path]
            [clojure.edn :as edn]
            [datascript.core :as d]))


(defn- get-db [graph-dir]
  (let [{:keys [conn]} (gp-cli/parse-graph graph-dir {:verbose false})] @conn))

(defn- publish-file-graph [static-dir graph-dir output-path options]
  (let [repo-config (-> (node-path/join graph-dir "logseq" "config.edn") fs/readFileSync str edn/read-string)]
    (publishing/export (get-db graph-dir)
                       static-dir
                       graph-dir
                       output-path
                       (merge options {:repo-config repo-config :ui/theme "dark" :ui/radix-color :purple}))))

(defn- publish-db-graph [static-dir graph-dir output-path opts]
  (let [db-name (node-path/basename graph-dir)
        conn (sqlite-cli/open-db! (node-path/dirname graph-dir) db-name)
        repo-config (-> (d/q '[:find ?content
                               :where [?b :file/path "logseq/config.edn"] [?b :file/content ?content]]
                             @conn)
                        ffirst
                        edn/read-string)]
    (publishing/export @conn
                       static-dir
                       graph-dir
                       output-path
                       (merge opts {:repo-config repo-config :db-graph? true :ui/theme "dark" :ui/radix-color :cyan}))))

(defn -main
  [& args]
  (when (< (count args) 3)
    (println "Usage: $0 STATIC-DIR GRAPH-DIR OUT-DIR")
    (js/process.exit 1))
  (let [[static-dir graph-dir output-path]
        ;; Offset relative paths since they are run in a different directory than user is in
        (map #(if (node-path/isAbsolute %) % (node-path/resolve ".." %)) args)
        options {:dev? (contains? (set args) "--dev")}]
    (if (sqlite-cli/db-graph-directory? graph-dir)
      (publish-db-graph static-dir graph-dir output-path options)
      (publish-file-graph static-dir graph-dir output-path options))))
