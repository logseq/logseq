(ns frontend.db.query-custom
  "Handles executing custom queries a.k.a. advanced queries"
  (:require [clojure.string :as string]
            [frontend.db.async :as db-async]
            [frontend.db.query-dsl :as query-dsl]
            [frontend.state :as state]))

(defn- function-bearing?
  [value]
  (cond
    (fn? value) true
    (map? value) (or (some function-bearing? (keys value))
                     (some function-bearing? (vals value)))
    (coll? value) (some function-bearing? value)
    :else false))

(defn- current-page
  []
  (or (state/get-current-page)
      (:page (state/get-default-home))))

(defn- query-context
  [query-opts]
  (when-not (every? #{:current-page-fn} (keys query-opts))
    (throw (ex-info "Invalid custom query options" {:options query-opts})))
  (let [current-page-fn (:current-page-fn query-opts)
        _ (when-not (or (nil? current-page-fn) (fn? current-page-fn))
            (throw (ex-info "Invalid current page function"
                            {:current-page-fn current-page-fn})))
        current-page-title (when current-page-fn (current-page-fn))
        page-identity (current-page)]
    (when-not (or (nil? current-page-title)
                  (and (string? current-page-title)
                       (not (string/blank? current-page-title))))
      (throw (ex-info "Invalid current page title"
                      {:current-page-title current-page-title})))
    (when-not (or (nil? page-identity)
                  (uuid? page-identity)
                  (and (string? page-identity)
                       (not (string/blank? page-identity))))
      (throw (ex-info "Invalid current page" {:current-page page-identity})))
    (cond-> {}
      page-identity (assoc :current-page page-identity)
      current-page-title (assoc :current-page-title current-page-title))))

(defn- require-datalog-query!
  [query-m]
  (when-not (and (map? query-m)
                 (vector? (:query query-m))
                 (= :find (first (:query query-m)))
                 (not (function-bearing? query-m)))
    (throw (ex-info "Invalid custom query" {:query query-m})))
  query-m)

(defn custom-query
  "Executes one custom query through a direct worker API."
  ([query]
   (custom-query query {}))
  ([query query-opts]
   (custom-query (state/get-current-repo) query query-opts))
  ([repo query-m query-opts]
   (if (or (list? (:query query-m))
           (not= :find (first (:query query-m)))) ; dsl query
     (query-dsl/custom-query repo query-m query-opts)
     (db-async/<invoke-db-worker :thread-api/query-custom
                                 repo
                                 (require-datalog-query! query-m)
                                 (query-context query-opts)))))
