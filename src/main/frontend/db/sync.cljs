(ns ^:no-doc frontend.db.sync
  (:require [datascript.core :as d]
            [frontend.db.conn :as conn]))


(defn export-as-blocks
  [repo]
  (let [db (conn/get-db repo)
        datoms (d/datoms db :eavt)]
    (->> datoms
         (partition-by :e)
         (keep (fn [datoms]
                 (when (seq datoms)
                   (reduce
                    (fn [r datom] (assoc r (:a datom) (:v datom)))
                    {:db/id (:e (first datoms))}
                    datoms)))))))
