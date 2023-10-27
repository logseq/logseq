(ns transact
  "This script generically runs transactions against the queried blocks"
  (:require [logseq.outliner.cli.persist-graph :as persist-graph]
            [logseq.db.sqlite.cli :as sqlite-cli]
            [logseq.db.sqlite.db :as sqlite-db]
            [logseq.db.frontend.rules :as rules]
            [datascript.core :as d]
            [clojure.edn :as edn]
            [clojure.string :as string]
            [nbb.core :as nbb]
            ["path" :as node-path]
            ["os" :as os]))

(defn -main [args]
  (when (< (count args) 2)
    (println "Usage: $0 GRAPH-DIR QUERY")
    (js/process.exit 1))
  (let [[graph-dir query*] args
        dry-run? (contains? (set args) "-n")
        [dir db-name] (if (string/includes? graph-dir "/")
                        ((juxt node-path/dirname node-path/basename) graph-dir)
                        [(node-path/join (os/homedir) "logseq" "graphs") graph-dir])
        _ (sqlite-db/open-db! dir db-name)
        conn (sqlite-cli/read-graph db-name)
        ;; find blocks to update
        query (into (edn/read-string query*) [:in '$ '%]) ;; assumes no :in are in queries
        blocks-to-update (mapv first (d/q query @conn (rules/extract-rules rules/db-query-dsl-rules)))
        ;; TODO: Make this configurable
        update-tx (mapv #(vector :db.fn/retractEntity %)
                        blocks-to-update)]
    (if dry-run?
      (do (println "Would update" (count blocks-to-update) "blocks with the following tx:")
          (prn update-tx)
          (println "With the following blocks updated:")
          (prn (map #(into {} (d/entity @conn %)) blocks-to-update)))
      (do
        (persist-graph/add-listener conn db-name)
        (d/transact! conn update-tx)
        (println "Updated" (count update-tx) "block(s) for graph" (str db-name "!"))))))

(when (= nbb/*file* (:file (meta #'-main)))
  (-main *command-line-args*))