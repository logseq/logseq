(ns frontend.db.async.util
  "Async util helper"
  (:require [datascript.core :as d]
            [frontend.db.conn :as db-conn]
            [frontend.state :as state]
            [promesa.core :as p]))

(defn <q
  [graph {:keys [transact-db?]
          :or {transact-db? true}
          :as opts} & inputs]
  (assert (not-any? fn? inputs) "Async query inputs can't include fns because fn can't be serialized")
  (let [*async-queries (:db/async-queries @state/state)
        async-requested? (get @*async-queries [inputs opts])]
    (if (and async-requested? transact-db?)
      (p/promise
       (let [db (db-conn/get-db graph)]
         (apply d/q (first inputs) db (rest inputs))))
      (p/let [result (state/<invoke-db-worker :thread-api/q graph inputs)]
        (swap! *async-queries assoc [inputs opts] true)
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
                  (js/console.log "<q skipped tx for inputs:" inputs)))))
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
