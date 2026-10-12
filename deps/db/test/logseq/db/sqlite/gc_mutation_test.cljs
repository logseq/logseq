(ns logseq.db.sqlite.gc-mutation-test
  (:require [cljs.test :refer [deftest is]]
            [logseq.db.common.sqlite-cli :as sqlite-cli]
            [logseq.db.sqlite.gc :as sqlite-gc]
            [logseq.db.sqlite.util :as sqlite-util]))

;; Address 0 is the db's meta (index roots 2, 3, 4), 1 the tail. Index root 2
;; uses 5. 10 is unreferenced garbage that still references 11.
(def ^:private kvs-rows
  [[0 {:eavt 2 :avet 3 :aevt 4} []]
   [1 {} []]
   [2 {} [5]]
   [3 {} []]
   [4 {} []]
   [5 {} []]
   [10 {} [11]]
   [11 {} []]])

(defn- node-db []
  (let [^js db (new sqlite-cli/sqlite ":memory:" nil)
        _ (.exec db "create table if not exists kvs (addr INTEGER primary key, content TEXT, addresses JSON)")
        ^js insert (.prepare db "INSERT INTO kvs (addr, content, addresses) values (?, ?, ?)")]
    (doseq [[addr content addresses] kvs-rows]
      (.run insert addr (sqlite-util/write-transit-str content) (js/JSON.stringify (clj->js addresses))))
    db))

(defn- node-addrs [^js db]
  (set (map #(.-addr ^js %) (.all (.prepare db "select addr from kvs")))))

;; Fails if, in `gc-kvs-table-node-version!`, `if` becomes `if-not`.
(deftest gc-kvs-table-node-version-walk-removes-garbage-chain-test
  (let [db (node-db)]
    (sqlite-gc/gc-kvs-table-node-version! db true)
    (is (= #{0 1 2 3 4 5} (node-addrs db))
        "walking from the index roots removes the garbage and what only the garbage references")))

(defn- wasm-db
  "A stand-in for the sqlite-wasm db: answers the 2 queries of gc-kvs-table!
   and records deleted addresses."
  [deleted]
  (let [db #js {}]
    (set! (.-exec db)
          (fn [^js opts]
            (let [sql (.-sql opts)]
              (cond
                (= sql "select content from kvs where addr = 0")
                #js [#js [(sqlite-util/write-transit-str {:eavt 2 :avet 3 :aevt 4})]]

                (= sql sqlite-gc/get-non-refed-addrs-sql)
                #js [#js [0] #js [1] #js [2] #js [10]]

                (= sql "Delete from kvs where addr = ?")
                (swap! deleted conj (aget (.-bind opts) 0))))))
    (set! (.-transaction db) (fn [f] (f db)))
    db))

;; Fails if, in `gc-kvs-table!`, `if` becomes `if-not` or `seq` becomes `empty?`.
(deftest gc-kvs-table-deletes-unreferenced-addresses-test
  (let [deleted (atom [])]
    (sqlite-gc/gc-kvs-table! (wasm-db deleted) {:full-gc? false})
    (is (= [10] @deleted))))
