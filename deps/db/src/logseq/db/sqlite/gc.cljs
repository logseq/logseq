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

(defn- get-unused-addresses
  [db]
  (let [schema (some->> (.exec db #js {:sql "select content from kvs where addr = 0"
                                       :rowMode "array"})
                        bean/->clj
                        ffirst
                        sqlite-util/transit-read)
          ;; 0: Datascript sets 0 as the address to store the db's meta, including addresses for :eavt, :avet, and aevt index.
          ;; 1: Datascript sets 1 for tail, to improve the performance
        internal-addrs (set [0 1 (:eavt schema) (:avet schema) (:aevt schema)])
        non-refed-addrs (->> (.exec db #js {:sql get-non-refed-addrs-sql
                                            :rowMode "array"})
                             (map first)
                             set)]
    (clojure.set/difference non-refed-addrs internal-addrs)))

(defn gc-kvs-table!
  "WASM version to GC kvs table to remove unused addresses"
  [^Object db]
  (when db
    (let [unused-addresses (get-unused-addresses db)]
      (if (seq unused-addresses)
        (do
          (println :debug :db-gc :unused-addresses unused-addresses)
          (.transaction db (fn [tx]
                             (doseq [addr unused-addresses]
                               (.exec tx #js {:sql "Delete from kvs where addr = ?"
                                              :bind #js [addr]})))))
        (println :debug :db-gc "There's no garbage data that's need to be collected.")))))

(defn- get-unused-addresses-node-version
  [db]
  (let [schema (let [stmt (.prepare db "select content from kvs where addr = ?")
                     content (.-content (.get stmt 0))]
                 (sqlite-util/transit-read content))
        internal-addrs (set [0 1 (:eavt schema) (:avet schema) (:aevt schema)])
        non-refed-addrs (let [stmt (.prepare db get-non-refed-addrs-sql)]
                          (->> (.all ^object stmt)
                               bean/->clj
                               (map :addr)
                               (set)))]
    (clojure.set/difference non-refed-addrs internal-addrs)))

(defn gc-kvs-table-node-version!
  "Node version to GC kvs table to remove unused addresses"
  [^Object db]
  (let [unused-addresses (get-unused-addresses-node-version db)
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
          (delete (bean/->js unused-addresses))
          (gc-kvs-table-node-version! db)))
      (println :debug :db-gc "There's no garbage data that's need to be collected."))))

(defn ensure-no-garbage
  [^Object db]
  (let [unused-addresses (get-unused-addresses-node-version db)]
    ;; (println :debug :db-gc :unused-addresses-count (count unused-addresses))
    ;; (println :debug :unused-addresses unused-addresses)
    (empty? unused-addresses)))
