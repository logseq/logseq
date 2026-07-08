(ns frontend.db.async.util
  "Async util helper"
  (:require [clojure.walk :as walk]
            [frontend.state :as state]))

(defn- transform-pull-query
  [query]
  (if (= :find (first query))
    (walk/postwalk
     (fn [f]
       (cond
         ;; TODO: remove :block/content if it's no longer used
         (and (keyword? f) (= f :block/content))
         :block/title

         (and (list? f) (= 'pull (first f)) (vector? (last f)) (not-any? #{:db/id} f))
         (list 'pull (second f) (conj (last f) :db/id))

         :else
         f))
     query)
    query))

(defn <invoke-db-worker
  [api & args]
  (apply state/<invoke-db-worker api args))

(defn <q
  [graph {:keys [advanced-query?]
          :as _opts} & inputs]
  (assert (not-any? fn? inputs) "Async query inputs can't include fns because fn can't be serialized")
  (let [inputs' (if advanced-query?
                  (cons (transform-pull-query (first inputs))
                        (rest inputs))
                  inputs)]
    (<invoke-db-worker :thread-api/q graph inputs')))
