(ns frontend.components.query.result
  "Query result related functionality for query components"
  (:require [clojure.string :as string]
            [frontend.db.hooks :as db-hooks]
            [frontend.db.query-dsl :as query-dsl]
            [logseq.shui.hooks :as hooks]))

(defn get-group-by-page
  [{:keys [result-transform query] :as query-config}
   {:keys [table? db-graph?]}]
  (if (or table? db-graph?)
    false
    (get query-config :group-by-page?
         (and (not result-transform)
              (not (and (string? query)
                        (string/includes? query "(by-page false)")))))))

(defn- query-spec
  [config query]
  (let [kind (if (:dsl-query? config) :dsl :datalog)
        current-block-uuid (or (:current-block-uuid config)
                               (:block/uuid (:block config))
                               (:block/uuid config))]
    (cond-> {:kind kind
             :query (:query query)}
      (and (= :dsl kind) (contains? config :cards?))
      (assoc :cards? (boolean (:cards? config)))

      (and (= :datalog kind) (contains? query :inputs))
      (assoc :inputs (vec (:inputs query)))

      (and (= :datalog kind) (contains? query :rules))
      (assoc :rules (vec (:rules query)))

      current-block-uuid
      (assoc :current-block-uuid current-block-uuid)

      (:current-page-title config)
      (assoc :current-page-title (:current-page-title config))

      (:today-day config)
      (assoc :today-day (:today-day config))

      (contains? query :remove-block-children?)
      (assoc :remove-block-children? (boolean (:remove-block-children? query)))

      (:result-transform query)
      (assoc :result-transform-edn (pr-str (:result-transform query))))))

(defn- executable-query
  "Rewrite incomplete DSL to a blank query so live mid-edit syntax is not
  evaluated. Hooks stay unconditional."
  [config query]
  (if-not (and (:dsl-query? config) (string? (:query query)))
    query
    (let [query-string (:query query)]
      (if (or (string/blank? query-string)
              (some? (query-dsl/read-query-form query-string)))
        query
        (assoc query :query "")))))

(defn use-query-result
  [config query]
  (let [resource (db-hooks/use-resource [:query (query-spec config (executable-query config query))])
        result (:rows resource)
        query-result (:query-result config)
        error (:error resource)]
    (hooks/use-effect! #(when query-result
                          (reset! query-result result))
                       [query-result result])
    (when error
      (throw (ex-info (or (:message error) "Query failed")
                      (or (:data error) {}))))
    result))
