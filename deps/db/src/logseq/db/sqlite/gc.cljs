(ns logseq.db.sqlite.gc
  "GC unused addresses from `kvs` table"
  (:require [cljs-bean.core :as bean]
            [clojure.set]
            [logseq.db.sqlite.util :as sqlite-util]))

(defonce get-non-refed-addrs-sql
  "WITH all_referenced AS (
     SELECT CAST(value AS INTEGER) AS addr
     FROM kvs, json_each(kvs.addresses)
  )
  SELECT kvs.addr
  FROM kvs
  WHERE kvs.addr NOT IN (SELECT addr FROM all_referenced)")

(defn gc-kvs-table!
  "GC kvs table to remove unused addresses"
  [^Object db]
  (when db
    (let [schema (some->> (.exec db #js {:sql "select content from kvs where addr = 0"
                                         :rowMode "array"})
                          bean/->clj
                          ffirst
                          sqlite-util/transit-read)
          internal-addrs (set [0 1 (:eavt schema) (:avet schema) (:aevt schema)])
          non-refed-addrs (->> (.exec db #js {:sql get-non-refed-addrs-sql
                                              :rowMode "array"})
                               (map first)
                               set)
          unused-addresses (clojure.set/difference non-refed-addrs internal-addrs)]
      (if (seq unused-addresses)
        (do
          (prn :debug :db-gc :unused-addresses unused-addresses)
          (.transaction db (fn [tx]
                             (doseq [addr unused-addresses]
                               (.exec tx #js {:sql "Delete from kvs where addr = ?"
                                              :bind #js [addr]})))))
        (prn :debug :db-gc "There's no garbage data that needs to be collected.")))))
