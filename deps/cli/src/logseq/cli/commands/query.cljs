(ns logseq.cli.commands.query
  "Query command"
  (:require ["fs" :as fs]
            [clojure.edn :as edn]
            [clojure.pprint :as pprint]
            [datascript.core :as d]
            [logseq.cli.util :as cli-util]
            [logseq.db.common.sqlite-cli :as sqlite-cli]
            [logseq.db.frontend.rules :as rules]))

(def spec
  "Query spec"
  {:additional-graphs {:alias :a
                       :coerce []
                       :desc "Additional graphs to query"}})

(defn query
  [{{:keys [graph queries additional-graphs]} :opts}]
  (let [graphs (into [graph] additional-graphs)]
    (doseq [graph' graphs]
      (if (fs/existsSync (cli-util/get-graph-dir graph'))
        (let [conn (apply sqlite-cli/open-db! (cli-util/->open-db-args graph))
              query* (when (string? (first queries)) (edn/read-string (first queries)))
              ;; If datalog query detected run it or else default to entity lookups
              results (if (and (vector? query*) (= :find (first query*)))
                        ;; assumes no :in are in queries
                        (let [query' (into query* [:in '$ '%])
                              res (d/q query' @conn (rules/extract-rules rules/db-query-dsl-rules))]
                          ;; Remove nesting for most queries which just have one :find binding
                          (if (= 1 (count (first res))) (mapv first res) res))
                        (map #(when-let [ent (d/entity @conn
                                                       (if (string? %) (edn/read-string %) %))]
                                (into {:db/id (:db/id ent)} ent))
                             queries))]
          (when (> (count graphs) 1)
            (println "Results for graph" (pr-str graph')))
          (pprint/pprint results))
        (println "Graph" (pr-str graph') "does not exist")))))