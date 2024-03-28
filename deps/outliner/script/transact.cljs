(ns transact
  "This script generically runs transactions against the queried blocks"
  (:require [logseq.outliner.cli.pipeline :as cli-pipeline]
            [logseq.db.sqlite.db :as sqlite-db]
            [logseq.db.frontend.rules :as rules]
            [datascript.core :as d]
            [clojure.edn :as edn]
            [clojure.string :as string]
            [nbb.core :as nbb]
            ["path" :as node-path]
            ["os" :as os]))

(defn -main [args]
  (when (< (count args) 3)
    (println "Usage: $0 GRAPH-DIR QUERY TRANSACT-FN")
    (js/process.exit 1))
  (let [[graph-dir query* transact-fn*] args
        dry-run? (contains? (set args) "-n")
        [dir db-name] (if (string/includes? graph-dir "/")
                        ((juxt node-path/dirname node-path/basename) graph-dir)
                        [(node-path/join (os/homedir) "logseq" "graphs") graph-dir])
        conn (sqlite-db/open-db! dir db-name)
        ;; find blocks to update
        query (into (edn/read-string query*) [:in '$ '%]) ;; assumes no :in are in queries
        transact-fn (edn/read-string transact-fn*)
        blocks-to-update (mapv first (d/q query @conn (rules/extract-rules rules/db-query-dsl-rules)))
        ;; TODO: Use sci eval when it's available in nbb-logseq
        update-tx (mapv (fn [id] (eval (list transact-fn id)))
                        blocks-to-update)]
    (if dry-run?
      (do (println "Would update" (count blocks-to-update) "blocks with the following tx:")
          (prn update-tx)
          (println "With the following blocks updated:")
          (prn (map #(select-keys (d/entity @conn %) [:block/name :block/content]) blocks-to-update)))
      (do
        (cli-pipeline/add-listener conn)
        (d/transact! conn update-tx)
        (println "Updated" (count update-tx) "block(s) for graph" (str db-name "!"))))))

(when (= nbb/*file* (:file (meta #'-main)))
  (-main *command-line-args*))