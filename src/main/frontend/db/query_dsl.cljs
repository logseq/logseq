(ns frontend.db.query-dsl
  "Renderer wrapper for simple query APIs.

  Query execution belongs to the db worker. This namespace only keeps pure
  query-string transforms used by UI controls and dispatches query requests to
  worker thread APIs."
  (:require [clojure.string :as string]
            [frontend.db.async :as db-async]
            [frontend.template :as template]
            [logseq.db.frontend.query-dsl :as shared-query-dsl]))

(def pre-transform shared-query-dsl/pre-transform)
(def simplify-query shared-query-dsl/simplify-query)
(def get-timestamp-property shared-query-dsl/get-timestamp-property)
(def custom-readers shared-query-dsl/custom-readers)

(defn pre-transform-query
  [q]
  (let [q' (template/resolve-dynamic-template! q)]
    (pre-transform q')))

(def db-block-attrs
  "Block fields needed to render query results without a renderer DB."
  [:db/id :block/uuid :block/title :block/raw-title])

(defn- require-query-string!
  [query-string]
  (when-not (and (string? query-string)
                 (not (string/blank? query-string))
                 (not= "\"\"" query-string))
    (throw (ex-info "Invalid DSL query" {:query query-string})))
  query-string)

(defn- require-custom-query!
  [query-m]
  (when-not (and (map? query-m) (seq (:query query-m)))
    (throw (ex-info "Invalid custom query" {:query query-m})))
  query-m)

(defn query
  "Runs a dsl query with query as a string. Primary use is from '/query' or '{{query }}'."
  ([repo query-string]
   (query repo query-string {}))
  ([repo query-string query-opts]
   (require-query-string! query-string)
   (db-async/<invoke-db-worker :thread-api/query-dsl-query
                               repo
                               query-string
                               {:cards? (:cards? query-opts)
                                :block-attrs db-block-attrs})))

(defn custom-query
  "Runs a dsl query with query as a seq. Primary use is from advanced query."
  [repo query-m _query-opts]
  (require-custom-query! query-m)
  (db-async/<invoke-db-worker :thread-api/query-dsl-custom-query
                              repo
                              query-m
                              {:block-attrs db-block-attrs}))
