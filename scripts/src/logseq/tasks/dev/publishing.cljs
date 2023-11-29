(ns logseq.tasks.dev.publishing
  "Basic script for publishing from CLI"
  (:require [logseq.graph-parser.cli :as gp-cli]
            [logseq.publishing :as publishing]
            [logseq.db.sqlite.db :as sqlite-db]
            [logseq.db.sqlite.cli :as sqlite-cli]
            ["fs" :as fs]
            ["path" :as node-path]
            [clojure.edn :as edn]
            [datascript.core :as d]))


(defn- get-db [graph-dir]
  (let [{:keys [conn]} (gp-cli/parse-graph graph-dir {:verbose false})] @conn))

(defn- publish-file-graph [static-dir graph-dir output-path]
  (let [repo-config (-> (node-path/join graph-dir "logseq" "config.edn") fs/readFileSync str edn/read-string)]
    (publishing/export (get-db graph-dir)
                       static-dir
                       graph-dir
                       output-path
                       {:repo-config repo-config :ui/theme "dark" :ui/radix-color :purple})))

(defn- publish-db-graph [static-dir graph-dir output-path]
  (let [db-name (node-path/basename graph-dir)
        _ (sqlite-db/open-db! (node-path/dirname graph-dir) db-name)
        conn (sqlite-cli/read-graph db-name)
        repo-config (-> (d/q '[:find ?content
                               :where [?b :file/path "logseq/config.edn"] [?b :file/content ?content]]
                             @conn)
                        ffirst
                        edn/read-string)]
    (publishing/export @conn
                       static-dir
                       graph-dir
                       output-path
                       {:repo-config repo-config :db-graph? true :ui/theme "dark" :ui/radix-color :cyan})))

(defn -main
  [& args]
  (when-not (= 3 (count args))
    (println "Usage: $0 STATIC-DIR GRAPH-DIR OUT-DIR")
    (js/process.exit 1))
  (let [[static-dir graph-dir output-path]
        ;; Offset relative paths since they are run in a different directory than user is in
        (map #(if (node-path/isAbsolute %) % (node-path/resolve ".." %)) args)]
    (if (sqlite-cli/db-graph-directory? graph-dir)
      (publish-db-graph static-dir graph-dir output-path)
      (publish-file-graph static-dir graph-dir output-path))))
