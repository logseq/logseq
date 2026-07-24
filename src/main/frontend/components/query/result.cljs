(ns frontend.components.query.result
  "Query result related functionality for query components"
  (:require [frontend.db.hooks :as db-hooks]))

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

(defn use-query-result
  [config query]
  (let [resource (db-hooks/use-resource [:query (query-spec config query)])]
    (:rows resource)))
