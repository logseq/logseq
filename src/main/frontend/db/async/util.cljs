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
         ;; TODO: remove :block/content if it's no longer used
         (and (keyword? f) (= f :block/content))
         :block/title

         (and (list? f) (= 'pull (first f)) (vector? (last f)) (not-any? #{:db/id} f))
         (list 'pull (second f) (conj (last f) :db/id))

         :else
         f))
     query)
    query))

(defn- truncate-log-value
  [value limit]
  (let [s (pr-str value)]
    (if (> (count s) limit)
      (str (subs s 0 limit) "...")
      s)))

(defn- log-db-worker-q!
  [graph opts inputs' started-at status]
  (let [query (first inputs')]
    (js/console.info
     (str "[db-worker/q]"
          " elapsed-ms=" (- (js/Date.now) started-at)
          " graph=" graph
          " key=" (truncate-log-value (:debug-query-key opts) 180)
          " query-hash=" (hash query)
          " input-count=" (count (rest inputs'))
          " advanced=" (boolean (:advanced-query? opts))
          " transact-db=" (not (false? (:transact-db? opts)))
          " status=" status
          " inputs=" (truncate-log-value (rest inputs') 480)
          " query=" (truncate-log-value query 220)))))

(defn <q
  [graph {:keys [transact-db? advanced-query?]
          :or {transact-db? true}
          :as opts} & inputs]
  (assert (not-any? fn? inputs) "Async query inputs can't include fns because fn can't be serialized")
  (let [cache-opts (dissoc opts :debug-query-key)
        inputs' (if advanced-query?
                  (cons (transform-pull-query (first inputs))
                        (rest inputs))
                  inputs)
        query-key [inputs' cache-opts]
        async-requested? (get (state/get-state :db/async-queries) query-key)]
    (if (and async-requested? transact-db?)
      (p/promise
       (let [db (db-conn/get-db graph)]
         (apply d/q (first inputs') db (rest inputs'))))
      (let [started-at (js/Date.now)]
        (p/let [result (-> (state/<invoke-db-worker :thread-api/q graph inputs')
                           (p/then (fn [result]
                                     (log-db-worker-q! graph opts inputs' started-at "resolved")
                                     result))
                           (p/catch (fn [error]
                                      (log-db-worker-q! graph opts inputs' started-at "rejected")
                                      (throw error))))]
        (state/update-state! :db/async-queries assoc query-key true)
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
          result))))))
