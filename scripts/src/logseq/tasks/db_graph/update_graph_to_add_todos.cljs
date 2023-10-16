(ns logseq.tasks.db-graph.update-graph-to-add-todos
  "This script updates blocks that match the given query and turns them into TODOs"
  (:require [logseq.tasks.db-graph.persist-graph :as persist-graph]
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
  (when (not= 2 (count args))
    (println "Usage: $0 GRAPH-DIR QUERY")
    (js/process.exit 1))
  (let [[graph-dir query*] args
        [dir db-name] (if (string/includes? graph-dir "/")
                        ((juxt node-path/dirname node-path/basename) graph-dir)
                        [(node-path/join (os/homedir) "logseq" "graphs") graph-dir])
        _ (sqlite-db/open-db! dir db-name)
        conn (sqlite-cli/read-graph db-name)
        ;; find blocks to update
        query (into (edn/read-string query*) [:in '$ '%]) ;; assumes no :in are in queries
        blocks-to-update (mapv first (d/q query @conn (rules/extract-rules rules/db-query-dsl-rules)))
        ;; update
        todo-id (or (:db/id (d/entity @conn [:block/name "todo"]))
                    (throw (ex-info "No :db/id for TODO" {})))
        update-tx (vec (keep #(when-not (:block/marker %)
                                (hash-map :db/id (:db/id %)
                                          :block/content (str "TODO " (:block/content %))
                                          :block/marker "TODO"
                                          :block/refs (into [{:db/id todo-id}] (:block/refs %))))
                             blocks-to-update))]
    (persist-graph/add-listener conn db-name)
    (d/transact! conn update-tx)
    (println "Updated" (count update-tx) "block(s) with a 'TODO' for graph" (str db-name "!"))))

(when (= nbb/*file* (:file (meta #'-main)))
  (-main *command-line-args*))