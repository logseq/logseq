(ns logseq.db.sqlite.gc-mutation3-test
  (:require [cljs-bean.core :as bean]
            [cljs.test :refer [deftest is]]
            [logseq.db.common.sqlite :as common-sqlite]
            [logseq.db.common.sqlite-cli :as sqlite-cli]
            [logseq.db.sqlite.gc :as sqlite-gc]
            [logseq.db.sqlite.util :as sqlite-util]))

;; addr 0 holds the schema pointing at roots 2 (eavt), 3 (avet), 4 (aevt);
;; 2 -> 5 -> 6 is used; 7 -> 8 is a garbage chain; 9 <-> 10 is a garbage cycle
(def ^:private kvs-rows
  [[0 (sqlite-util/write-transit-str {:eavt 2 :avet 3 :aevt 4}) "[]"]
   [1 "x" "[]"]
   [2 "x" "[5]"]
   [3 "x" "[]"]
   [4 "x" "[]"]
   [5 "x" "[6]"]
   [6 "x" "[]"]
   [7 "x" "[8]"]
   [8 "x" "[]"]
   [9 "x" "[10]"]
   [10 "x" "[9]"]])

(defn- new-kvs-db
  ([] (new-kvs-db kvs-rows))
  ([rows]
   (let [db (new sqlite-cli/sqlite ":memory:" nil)
         insert (do (common-sqlite/create-kvs-table! db)
                    (.prepare db "insert into kvs (addr, content, addresses) values (?, ?, ?)"))]
     (doseq [[addr content addresses] rows]
       (.run insert addr content addresses))
     db)))

(defn- addrs [db]
  (set (map :addr (bean/->clj (sqlite-cli/query db "select addr from kvs")))))

(defn- wasm-db
  "better-sqlite3 db behind the sqlite-wasm api gc-kvs-table! calls: exec with
  {:sql :bind :rowMode} and transaction with a callback taking the tx."
  [db]
  (let [shim #js {}]
    (set! (.-exec shim)
          (fn [opts]
            (let [stmt (.prepare db (.-sql opts))]
              (cond
                (.-bind opts) (.run stmt (.-bind opts))
                (= "array" (.-rowMode opts)) (.all (.raw stmt))
                :else (.all stmt)))))
    (set! (.-transaction shim) (fn [f] (f shim)))
    shim))

(def ^:private used-addrs #{0 1 2 3 4 5 6})

(deftest gc-kvs-table-single-pass-deletes-only-unreferenced-addrs-test
  (let [db (new-kvs-db)]
    (sqlite-gc/gc-kvs-table! (wasm-db db) {})
    (is (= #{0 1 2 3 4 5 6 8 9 10} (addrs db)))))

(deftest gc-kvs-table-full-gc-repeats-until-no-unreferenced-addrs-test
  (let [db (new-kvs-db)]
    (sqlite-gc/gc-kvs-table! (wasm-db db) {:full-gc? true})
    (is (= #{0 1 2 3 4 5 6 9 10} (addrs db)))))

(deftest gc-kvs-table-node-version-without-walk-recurses-test
  (let [db (new-kvs-db)]
    (sqlite-gc/gc-kvs-table-node-version! db false)
    (is (= #{0 1 2 3 4 5 6 9 10} (addrs db)))))

(deftest gc-kvs-table-node-version-walk-deletes-everything-unreachable-test
  (let [db (new-kvs-db)]
    (sqlite-gc/gc-kvs-table-node-version! db true)
    (is (= used-addrs (addrs db)))))

(deftest gc-kvs-table-node-version-walk-keeps-used-addrs-with-little-garbage-test
  ;; the used trees hold more addresses than the 5 internal ones and there is
  ;; only 1 garbage address (8)
  (let [db (new-kvs-db [[0 (sqlite-util/write-transit-str {:eavt 2 :avet 3 :aevt 4}) "[]"]
                        [1 "x" "[]"]
                        [2 "x" "[5,6,7]"]
                        [3 "x" "[]"]
                        [4 "x" "[]"]
                        [5 "x" "[]"]
                        [6 "x" "[]"]
                        [7 "x" "[]"]
                        [8 "x" "[]"]])]
    (sqlite-gc/gc-kvs-table-node-version! db true)
    (is (= #{0 1 2 3 4 5 6 7} (addrs db)))))

(deftest ensure-no-garbage-test
  (let [db (new-kvs-db)]
    (is (false? (sqlite-gc/ensure-no-garbage db)))
    (sqlite-gc/gc-kvs-table-node-version! db false)
    (is (true? (sqlite-gc/ensure-no-garbage db)))))
