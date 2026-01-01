(ns frontend.db.async.util
  "Async util helper"
  (:require [clojure.walk :as walk]
            [datascript.core :as d]
            [frontend.db.conn :as db-conn]
            [frontend.state :as state]
            [promesa.core :as p]))

(defn- transform-pull-query
  [query]
  (if (= :find (first query))
    (walk/postwalk
     (fn [f]
       (cond
         (and (keyword? f) (= f :block/content))
         :block/title

         (and (list? f) (= 'pull (first f)) (vector? (last f)) (not-any? #{:db/id} f))
         (list 'pull (second f) (conj (last f) :db/id))

         :else
         f))
     query)
    query))

(defn <q
  [graph {:keys [transact-db? advanced-query?]
          :or {transact-db? true}
          :as opts} & inputs]
  (assert (not-any? fn? inputs) "Async query inputs can't include fns because fn can't be serialized")
  (let [*async-queries (:db/async-queries @state/state)
        async-requested? (get @*async-queries [inputs opts])
        inputs' (if advanced-query?
                  (cons (transform-pull-query (first inputs))
                        (rest inputs))
                  inputs)]
    (if (and async-requested? transact-db?)
      (p/promise
       (let [db (db-conn/get-db graph)]
         (apply d/q (first inputs') db (rest inputs'))))
      (p/let [result (state/<invoke-db-worker :thread-api/q graph inputs')]
        (swap! *async-queries assoc [inputs' opts] true)
        (when result
          (when (and transact-db? (seq result) (coll? result))
            (when-let [conn (db-conn/get-db graph false)]
              (let [tx-data (->>
                             (if (and (coll? (first result))
                                      (not (map? (first result))))
                               (apply concat result)
                               result)
                             (remove nil?))]
                (if (every? map? tx-data)
                  (try
                    (d/transact! conn tx-data)
                    (catch :default e
                      (js/console.error "<q failed with:" e)
                      nil))
                  (js/console.log "<q skipped tx for inputs:" inputs')))))
          result)))))

(defn <pull
  ([graph id]
   (<pull graph '[*] id))
  ([graph selector id]
   (p/let [result' (state/<invoke-db-worker :thread-api/pull graph selector id)]
     (when result'
       (when-let [conn (db-conn/get-db graph false)]
         (d/transact! conn [result']))
       result'))))
