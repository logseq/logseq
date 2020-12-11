(ns frontend.handler.block
  (:require [clojure.string :as string]
            [cljs.reader :as reader]
            [frontend.state :as state]
            [frontend.db.utils :as db-utils]
            [frontend.db.react-queries :as react-queries]))

(defn custom-query-aux
  [{:keys [query inputs] :as query'} query-opts]
  (try
    (let [inputs (map db-utils/resolve-input inputs)
          repo (state/get-current-repo)
          k [:custom query']]
      (apply react-queries/q repo k query-opts query inputs))
    (catch js/Error e
      (println "Custom query failed: ")
      (js/console.dir e))))


(defn custom-query
  ([query]
   (custom-query query {}))
  ([query query-opts]
   (when-let [query' (cond
                       (and (string? query)
                         (not (string/blank? query)))
                       (reader/read-string query)

                       (map? query)
                       query

                       :else
                       nil)]
     (custom-query-aux query' query-opts))))


