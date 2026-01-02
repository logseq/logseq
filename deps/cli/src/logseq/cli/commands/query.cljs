(ns logseq.cli.commands.query
  "Query command"
  (:require ["fs" :as fs]
            [clojure.edn :as edn]
            [clojure.pprint :as pprint]
            [clojure.string :as string]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.cli.util :as cli-util]
            [logseq.common.util :as common-util]
            [logseq.db.common.sqlite-cli :as sqlite-cli]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.rules :as rules]
            [promesa.core :as p]))

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
        (p/catch cli-util/command-catch-handler))))

(defn- readable-properties
  "Expands an entity's properties and tags to be readable. Similar to
   db-test/readable-properties but to be customized for CLI use"
  [ent]
  (->> (db-property/properties ent)
       (mapv (fn [[k v]]
               [k
                (cond
                  (#{:block/tags :logseq.property.class/extends :logseq.property/classes :logseq.property.class/properties} k)
                  (mapv :db/ident v)
                  (and (set? v) (every? de/entity? v))
                  (set (map db-property/property-value-content v))
                  (de/entity? v)
                  (or (:db/ident v) (db-property/property-value-content v))
                  :else
                  v)]))
       (into {})))

(defn- local-entities-query
  "Queries by calling d/entity"
  [db properties-expand args]
  (map #(when-let [ent (d/entity db
                                 (cond
                                   (and (string? %) (common-util/uuid-string? %))
                                   [:block/uuid (uuid %)]
                                   (string? %)
                                   (edn/read-string %)
                                   :else
                                   %))]
          (let [m (into {:db/id (:db/id ent)} ent)]
            (if properties-expand
              (merge m (readable-properties m))
              m)))
       args))

(defn- local-datalog-query [db query*]
  (let [query (into query* [:in '$ '%]) ;; assumes no :in are in queries
        res (d/q query db (rules/extract-rules rules/db-query-dsl-rules))]
    ;; Remove nesting for most queries which just have one :find binding
    (if (= 1 (count (first res))) (mapv first res) res)))

(defn- local-query
  [{{:keys [args graphs properties-readable title-query]} :opts}]
  (when-not graphs
    (cli-util/error "Command missing required option 'graphs'"))
  (doseq [graph graphs]
    (if (fs/existsSync (cli-util/get-graph-path graph))
      (let [conn (apply sqlite-cli/open-db! (cli-util/->open-db-args graph))
            _ (cli-util/ensure-db-graph-for-command @conn)
            query* (when (string? (first args)) (common-util/safe-read-string {:log-error? false} (first args)))
            results (cond
                      ;; Run datalog query if detected
                      (and (vector? query*) (= :find (first query*)))
                      (local-datalog-query @conn query*)
                      ;; Runs predefined title query. Predefined queries could better off in a separate command
                      ;; since they could be more powerful and have different args than query command
                      title-query
                      (let [query '[:find (pull ?b [*])
                                    :in $ % ?search-term
                                    :where (block-content ?b ?search-term)]
                            res (d/q query @conn (rules/extract-rules rules/db-query-dsl-rules)
                                     (string/join " " args))]
                        ;; Remove nesting for most queries which just have one :find binding
                        (if (= 1 (count (first res))) (mapv first res) res))
                      :else
                      (local-entities-query @conn properties-readable args))]
        (when (> (count graphs) 1)
          (println "Results for graph" (pr-str graph)))
        (pprint/pprint results))
      (cli-util/error "Graph" (pr-str graph) "does not exist"))))

(defn query
  [{{:keys [args api-server-token] :as opts} :opts :as m}]
  (if (cli-util/api-command? opts)
    (api-query (first args) api-server-token)
    (local-query m)))