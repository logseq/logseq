(ns frontend.db.query-custom
  "Custom queries."
  (:require [frontend.state :as state]
            [clojure.string :as string]
            [cljs.reader :as reader]
            [frontend.db.query-react :as react]
            [frontend.template :as template]
            [frontend.db.query-dsl :as dsl]))

(defn custom-query
  ([query]
   (custom-query query {}))
  ([query query-opts]
   (when-let [query' (cond
                       (and (string? query)
                            (not (string/blank? query)))
                       (let [query-string (template/resolve-dynamic-template! query)]
                         (reader/read-string query))

                       (map? query)
                       query

                       :else
                       nil)]
     (let [repo (state/get-current-repo)]
       (if (list? (:query query')) ; dsl query
         (dsl/custom-query repo query' query-opts )
         (react/react-query repo query' query-opts))))))
