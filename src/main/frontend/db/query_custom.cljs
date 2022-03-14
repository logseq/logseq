(ns frontend.db.query-custom
  "Handles executing custom queries a.k.a. advanced queries"
  (:require [frontend.state :as state]
            [frontend.db.query-react :as query-react]
            [frontend.db.query-dsl :as query-dsl]
            [frontend.db.model :as model]
            [frontend.db.rules :as rules]
            [frontend.util.datalog :as datalog-util]
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

(defn- add-rules-to-query
  "Searches query's :where for rules and adds them to query if used"
  [{:keys [query] :as query-m}]
  (let [{:keys [where]} (datalog-util/query-vec->map query)
        rules-found (datalog-util/find-rules-in-where where (-> rules/query-dsl-rules keys set))]
    (if (seq rules-found)
      (-> query-m
          (update :query (fn [q]
                           (if (contains? (set q) :in)
                             (datalog-util/add-to-end-of-query-section q :in ['%])
                             (into q [:in '$ '%]))))
          (assoc :rules (mapv rules/query-dsl-rules rules-found)))
      query-m)))

(defn custom-query
  "Executes a datalog query through query-react, given either a regular datalog
  query or a simple query"
  ([query]
   (custom-query query {}))
  ([query query-opts]
   (custom-query (state/get-current-repo) query query-opts))
  ([repo query query-opts]
   (let [query' (replace-star-with-block-attrs! query)]
     (if (or (list? (:query query'))
             (not= :find (first (:query query')))) ; dsl query
       (query-dsl/custom-query repo query' query-opts)
       (query-react/react-query repo (add-rules-to-query query') query-opts)))))
