(ns transact
  "This script generically runs transactions against the queried blocks"
  (:require [clojure.edn :as edn]
            [datascript.core :as d]
            [logseq.db.common.sqlite-cli :as sqlite-cli]
            [logseq.db.frontend.rules :as rules]
            [logseq.outliner.db-pipeline :as db-pipeline]
            [nbb.core :as nbb]))

(defn -main [args]
  (when (< (count args) 3)
    (println "Usage: $0 GRAPH-DIR QUERY TRANSACT-FN")
    (js/process.exit 1))
  (let [[graph-dir query* transact-fn*] args
        dry-run? (contains? (set args) "-n")
        open-db-args (sqlite-cli/->open-db-args graph-dir)
        db-name (if (= 1 (count open-db-args)) (first open-db-args) (second open-db-args))
        conn (apply sqlite-cli/open-db! open-db-args)
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
          (prn (map #(select-keys (d/entity @conn %) [:block/name :block/title]) blocks-to-update)))
      (do
        (db-pipeline/add-listener conn)
        (d/transact! conn update-tx)
        (println "Updated" (count update-tx) "block(s) for graph" (str db-name "!"))))))

(when (= nbb/*file* (nbb/invoked-file))
  (-main *command-line-args*))
