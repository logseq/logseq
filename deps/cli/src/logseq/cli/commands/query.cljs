(ns logseq.cli.commands.query
  "Query command"
  (:require ["fs" :as fs]
            [clojure.edn :as edn]
            [clojure.pprint :as pprint]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.cli.util :as cli-util]
            [logseq.db.common.sqlite-cli :as sqlite-cli]
            [logseq.db.frontend.rules :as rules]
            [promesa.core :as p]))

(def spec
  "Query spec"
  {:graphs {:alias :g
            :coerce []
            :desc "Additional graphs to query"}
   :api-query-token {:alias :a
                     :desc "Query current graph with api server token"}})

(defn- api-query
  [query token]
  (let [datalog-query? (string/starts-with? query "[")
        method (if datalog-query?  "logseq.db.datascript_query" "logseq.db.q")]
    (-> (p/let [resp (cli-util/api-fetch token method [query])]
          (if (= 200 (.-status resp))
            (p/let [body (.json resp)]
              (let [res (js->clj body :keywordize-keys true)
                    results (if datalog-query?
                              ;; Remove nesting for most queries which just have one :find binding
                              (if (= 1 (count (first res))) (mapv first res) res)
                              res)]
                (pprint/pprint results)))
            (cli-util/api-handle-error-response resp)))
        (p/catch (fn [err]
                   (js/console.error "Error:" err)
                   (js/process.exit 1))))))

(defn query
  [{{:keys [graph queries graphs api-query-token]} :opts}]
  (if api-query-token
    ;; graph can be query since it's not used for api-query
    (api-query (or graph (first queries)) api-query-token)
    (let [graphs' (into [graph] graphs)]
      (doseq [graph' graphs']
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
            (when (> (count graphs') 1)
              (println "Results for graph" (pr-str graph')))
            (pprint/pprint results))
          (println "Graph" (pr-str graph') "does not exist"))))))