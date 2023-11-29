  (ns query
    "An example script that queries any db graph from the commandline e.g.

     $ yarn -s nbb-logseq script/query.cljs db-name '[:find (pull ?b [:block/name :block/content]) :where [?b :block/created-at]]'"
    (:require [datascript.core :as d]
              [clojure.edn :as edn]
              [logseq.db.sqlite.db :as sqlite-db]
              [logseq.db.sqlite.cli :as sqlite-cli]
              [logseq.db.frontend.rules :as rules]
              [nbb.core :as nbb]
              ["path" :as path]
              ["os" :as os]))

(defn read-graph
  "The db graph bare version of gp-cli/parse-graph"
  [graph-name]
  (let [graphs-dir (path/join (os/homedir) "logseq/graphs")]
    (sqlite-db/open-db! graphs-dir graph-name)
    (sqlite-cli/read-graph graph-name)))

(defn -main [args]
  (when (not= 2 (count args))
    (println "Usage: $0 GRAPH QUERY")
    (js/process.exit 1))
  (let [[graph-name query*] args
        conn (read-graph graph-name)
        query (into (edn/read-string query*) [:in '$ '%]) ;; assumes no :in are in queries
        results (mapv first (d/q query @conn (rules/extract-rules rules/db-query-dsl-rules)))]
    #_(println "DB contains" (count (d/datoms @conn :eavt)) "datoms")
    (prn results)))

(when (= nbb/*file* (:file (meta #'-main)))
  (-main *command-line-args*))