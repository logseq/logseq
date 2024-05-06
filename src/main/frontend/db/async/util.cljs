(ns frontend.db.async.util
  "Async util helper"
  (:require [frontend.state :as state]
            [promesa.core :as p]
            [frontend.db.conn :as db-conn]
            [datascript.core :as d]
            [logseq.db :as ldb]))

(defn <q
  [graph {:keys [transact-db?]
          :or {transact-db? true}} & inputs]
  (assert (not-any? fn? inputs) "Async query inputs can't include fns because fn can't be serialized")
  (when-let [^Object sqlite @state/*db-worker]
    (p/let [result (.q sqlite graph (ldb/write-transit-str inputs))]
      (when result
        (let [result' (ldb/read-transit-str result)]
          (when (and transact-db? (seq result') (coll? result'))
            (when-let [conn (db-conn/get-db graph false)]
              (let [tx-data (->>
                             (if (and (coll? (first result'))
                                      (not (map? (first result'))))
                               (apply concat result')
                               result')
                             (remove nil?))]
                (if (every? map? tx-data)
                  (try
                    (d/transact! conn tx-data)
                    (catch :default e
                      (js/console.error "<q failed with:" e)
                      nil))
                  (js/console.log "<q skipped tx for inputs:" inputs)))))
          result')))))

(defn <pull
  ([graph id]
   (<pull graph '[*] id))
  ([graph selector id]
   (when-let [^Object sqlite @state/*db-worker]
     (p/let [result (.pull sqlite graph (ldb/write-transit-str selector) (ldb/write-transit-str id))]
       (when result
         (let [result' (ldb/read-transit-str result)]
           (when-let [conn (db-conn/get-db graph false)]
             (d/transact! conn [result']))
           result'))))))

(comment
  (defn <pull-many
   [graph selector ids]
   (assert (seq ids))
   (when-let [^Object sqlite @state/*db-worker]
     (p/let [result (.pull-many sqlite graph (ldb/write-transit-str selector) (ldb/write-transit-str ids))]
       (when result
         (ldb/read-transit-str result))))))
