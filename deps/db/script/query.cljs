  (ns query
    "An example script that queries any db graph from the commandline e.g.

     $ yarn -s nbb-logseq script/query.cljs db-name '[:find (pull ?b [:block/name :block/content]) :where [?b :block/created-at]]'"
    (:require [datascript.core :as d]
              [clojure.edn :as edn]
              [cljs-bean.core :as bean]
              [logseq.db.sqlite.db :as sqlite-db]
              [logseq.db.sqlite.restore :as sqlite-restore]
              [logseq.db.rules :as rules]
              [nbb.core :as nbb]
              ["path" :as path]
              ["os" :as os]))

(defn read-graph
  "The db graph bare version of gp-cli/parse-graph"
  [graph-name]
  (let [graphs-dir (path/join (os/homedir) "logseq/graphs")
        _ (sqlite-db/open-db! graphs-dir graph-name)
        {:keys [uuid->db-id-map conn]}
        (sqlite-restore/restore-initial-data (bean/->js (sqlite-db/get-initial-data graph-name)))
        db (sqlite-restore/restore-other-data conn (sqlite-db/get-other-data graph-name []) uuid->db-id-map)]
    (d/conn-from-db db)))

(defn -main [args]
  (when (not= 2 (count args))
    (println "Usage: $0 GRAPH QUERY")
    (js/process.exit 1))
  (let [[graph-name query*] args
        conn (read-graph graph-name)
        query (into (edn/read-string query*) [:in '$ '%]) ;; assumes no :in are in queries
        results (mapv first (d/q query @conn (rules/extract-rules rules/db-query-dsl-rules)))]
    (println "DB contains" (count (d/datoms @conn :eavt)) "datoms")
    (prn results)))

(when (= nbb/*file* (:file (meta #'-main)))
  (-main *command-line-args*))