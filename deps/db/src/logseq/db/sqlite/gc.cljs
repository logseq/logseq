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
  "WASM version to GC kvs table to remove unused addresses"
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
          (println :debug :db-gc :unused-addresses unused-addresses)
          (.transaction db (fn [tx]
                             (doseq [addr unused-addresses]
                               (.exec tx #js {:sql "Delete from kvs where addr = ?"
                                              :bind #js [addr]})))))
        (println :debug :db-gc "There's no garbage data that's need to be collected.")))))

(defn gc-kvs-table-node-version!
  "Node version to GC kvs table to remove unused addresses"
  [^Object db]
  (when db
    (let [schema (let [stmt (.prepare db "select content from kvs where addr = ?")
                       content (.-content (.get stmt 0))]
                   (sqlite-util/transit-read content))
          internal-addrs (set [0 1 (:eavt schema) (:avet schema) (:aevt schema)])
          result (let [stmt (.prepare db "select addr, addresses from kvs")]
                   (->> (.all ^object stmt)
                        bean/->clj
                        (map (fn [{:keys [addr addresses]}]
                               [addr (bean/->clj (js/JSON.parse addresses))]))))
          used-addresses (set (concat (mapcat second result) internal-addrs))
          unused-addresses (clojure.set/difference (set (map first result)) used-addresses)
          addrs-count (let [stmt (.prepare db "select count(*) as c from kvs")]
                        (.-c (.get stmt)))]
      (println :debug "addrs total count: " addrs-count)
      (if (seq unused-addresses)
        (do
          (println :debug :db-gc :unused-addresses-count (count unused-addresses))
          (let [stmt (.prepare db "Delete from kvs where addr = ?")
                delete (.transaction
                        db
                        (fn [addrs]
                          (doseq [addr addrs]
                            (.run stmt addr))))]
            (delete (bean/->js unused-addresses))))
        (println :debug :db-gc "There's no garbage data that's need to be collected.")))))
