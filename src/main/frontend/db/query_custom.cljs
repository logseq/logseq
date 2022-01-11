(ns frontend.db.query-custom
  "Custom queries."
  (:require [frontend.state :as state]
            [clojure.string :as string]
            [cljs.reader :as reader]
            [frontend.db.query-react :as react]
            [frontend.template :as template]
            [frontend.db.query-dsl :as dsl]
            [frontend.db.model :as model]
            [clojure.walk :as walk]))

;; FIXME: what if users want to query other attributes than block-attrs?
(defn- replace-star-with-block-attrs!
  [l]
  (walk/postwalk
   (fn [f]
     (if (and (list? f)
                (= 'pull (first f))
                (= '?b (second f))
                (= '[*] (nth f 2)))
       `(~'pull ~'?b ~model/block-attrs)
       f))
   l))

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
     (let [repo (state/get-current-repo)
           query' (replace-star-with-block-attrs! query)]
       (if (or (list? (:query query'))
               (not= :find (first (:query query')))) ; dsl query
         (dsl/custom-query repo query' query-opts )
         (react/react-query repo query' query-opts))))))
