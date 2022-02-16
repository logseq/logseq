(ns frontend.modules.outliner.core2-test
  (:require [cljs.test :refer [deftest is testing] :as test]
            [clojure.test.check.generators :as g]
            [datascript.core :as d]
            [frontend.modules.outliner.core2 :as outliner-core]
            [frontend.modules.outliner.transaction :as tx]))

(def tree
  "
- 1
 - 2
  - 3
   - 4
   - 5
  - 6
   - 7
    - 8
  - 9
   - 10
   - 11
   - 12
 - 13
  - 14
"
  [{:data 1 :block/level 1}
   {:data 2 :block/level 2}
   {:data 3 :block/level 3}
   {:data 4 :block/level 4}
   {:data 5 :block/level 4}
   {:data 6 :block/level 3}
   {:data 7 :block/level 4}
   {:data 8 :block/level 5}
   {:data 9 :block/level 3}
   {:data 10 :block/level 4}
   {:data 11 :block/level 4}
   {:data 12 :block/level 4}
   {:data 13 :block/level 2}
   {:data 14 :block/level 3}])

(defn- build-db-records
  [tree]
  (let [conn (d/create-conn {:block/next {:db/valueType :db.type/ref
                                          :db/unique :db.unique/value}
                             :data {:db/unique :db.unique/identity}})]
    (d/transact! conn [[:db/add 1 :page-block true]])
    (loop [last-node (d/entity @conn 1) tree tree]
      (when-let [node (first tree)]
        (let [{tx-data :tx-data}
              (d/transact! conn [{:db/id  -1
                                  :data (:data node)
                                  :block/level (:block/level node)}])
              new-e (.-e (first tx-data))]
          (d/transact! conn [{:db/id (:db/id last-node)
                              :block/next new-e}])
          (recur (d/entity @conn new-e) (next tree)))))
    conn))

(defn- get-page-nodes
  [db]
  (map #(select-keys % [:data :block/level]) (outliner-core/get-page-nodes (d/entity db 1) db)))


;;; testcases for operations (pure functions)

(deftest test-insert-nodes
  (testing "insert 15, 16 as children after 5; 15 & 16 are siblings"
    (let [conn (build-db-records tree)
          txs-data
          (outliner-core/insert-nodes [{:data 15 :block/level 100} {:data 16 :block/level 100}] @conn
                                      (d/entid @conn [:data 5]) false)]
      (d/transact! conn txs-data)
      (let [nodes-data (get-page-nodes @conn)]
        (is (= [{:data 1 :block/level 1}
                {:data 2 :block/level 2}
                {:data 3 :block/level 3}
                {:data 4 :block/level 4}
                {:data 5 :block/level 4}
                {:data 15 :block/level 5}
                {:data 16 :block/level 5}
                {:data 6 :block/level 3}
                {:data 7 :block/level 4}
                {:data 8 :block/level 5}
                {:data 9 :block/level 3}
                {:data 10 :block/level 4}
                {:data 11 :block/level 4}
                {:data 12 :block/level 4}
                {:data 13 :block/level 2}
                {:data 14 :block/level 3}] nodes-data)))))
  (testing "insert 15, 16 as children after 5; 16 is child of 15"
    (let [conn (build-db-records tree)
          txs-data
          (outliner-core/insert-nodes [{:data 15 :block/level 1} {:data 16 :block/level 2}] @conn
                                      (d/entid @conn [:data 5]) false)]
      (d/transact! conn txs-data)
      (let [nodes-data (get-page-nodes @conn)]
        (is (= [{:data 1 :block/level 1}
                {:data 2 :block/level 2}
                {:data 3 :block/level 3}
                {:data 4 :block/level 4}
                {:data 5 :block/level 4}
                {:data 15 :block/level 5}
                {:data 16 :block/level 6}
                {:data 6 :block/level 3}
                {:data 7 :block/level 4}
                {:data 8 :block/level 5}
                {:data 9 :block/level 3}
                {:data 10 :block/level 4}
                {:data 11 :block/level 4}
                {:data 12 :block/level 4}
                {:data 13 :block/level 2}
                {:data 14 :block/level 3}] nodes-data))))))

(deftest test-get-children-nodes
  (testing "get 3 and its children nodes"
    (let [conn (build-db-records tree)
          nodes (outliner-core/get-children-nodes (d/entity @conn [:data 3]) @conn)]
      (is (= '(3 4 5) (map :data nodes))))))


(deftest test-move-nodes
  (testing "move 3 and its children to 11 (as children)"
    (let [conn (build-db-records tree)
          nodes (outliner-core/get-children-nodes (d/entity @conn [:data 3] @conn) @conn)
          node-11 (d/entity @conn [:data 11])
          txs-data (outliner-core/move-nodes nodes @conn node-11 false)]
      (d/transact! conn txs-data)
      (let [page-nodes (get-page-nodes @conn)]
        (is (= page-nodes
               [{:data 1, :block/level 1}
                {:data 2, :block/level 2}
                {:data 6, :block/level 3}
                {:data 7, :block/level 4}
                {:data 8, :block/level 5}
                {:data 9, :block/level 3}
                {:data 10, :block/level 4}
                {:data 11, :block/level 4}
                {:data 3, :block/level 5}
                {:data 4, :block/level 6}
                {:data 5, :block/level 6}
                {:data 12, :block/level 4}
                {:data 13, :block/level 2}
                {:data 14, :block/level 3}]))))))

(deftest test-delete-nodes
  (testing "delete 6-12 nodes"
    (let [conn (build-db-records tree)
          nodes-6 (outliner-core/get-children-nodes (d/entity @conn [:data 6] @conn) @conn)
          nodes-9 (outliner-core/get-children-nodes (d/entity @conn [:data 9] @conn) @conn)
          txs-data (outliner-core/delete-nodes (concat nodes-6 nodes-9) @conn)]
      (d/transact! conn txs-data)
      (let [page-nodes (get-page-nodes @conn)]
        (is (= page-nodes
               [{:data 1 :block/level 1}
                {:data 2 :block/level 2}
                {:data 3 :block/level 3}
                {:data 4 :block/level 4}
                {:data 5 :block/level 4}
                {:data 13 :block/level 2}
                {:data 14 :block/level 3}]))))))

(deftest test-indent-nodes
  (testing "indent 6-12 nodes"
    (let [conn (build-db-records tree)
          nodes-6 (outliner-core/get-children-nodes (d/entity @conn [:data 6] @conn) @conn)
          nodes-9 (outliner-core/get-children-nodes (d/entity @conn [:data 9] @conn) @conn)
          txs-data (outliner-core/indent-nodes (concat nodes-6 nodes-9) @conn)]
      (d/transact! conn txs-data)
      (let [page-nodes (get-page-nodes @conn)]
        (is (= page-nodes
               [{:data 1 :block/level 1}
                {:data 2 :block/level 2}
                {:data 3 :block/level 3}
                {:data 4 :block/level 4}
                {:data 5 :block/level 4}
                {:data 6 :block/level 4}
                {:data 7 :block/level 5}
                {:data 8 :block/level 6}
                {:data 9 :block/level 4}
                {:data 10 :block/level 5}
                {:data 11 :block/level 5}
                {:data 12 :block/level 5}
                {:data 13 :block/level 2}
                {:data 14 :block/level 3}]))))))

(deftest test-outdent-nodes
  (testing "outdent 6-12 nodes"
    (let [conn (build-db-records tree)
          nodes-6 (outliner-core/get-children-nodes (d/entity @conn [:data 6] @conn) @conn)
          nodes-9 (outliner-core/get-children-nodes (d/entity @conn [:data 9] @conn) @conn)
          txs-data (outliner-core/outdent-nodes (concat nodes-6 nodes-9) @conn)]
      (d/transact! conn txs-data)
      (let [page-nodes (get-page-nodes @conn)]
        (is (= page-nodes
               [{:data 1 :block/level 1}
                {:data 2 :block/level 2}
                {:data 3 :block/level 3}
                {:data 4 :block/level 4}
                {:data 5 :block/level 4}
                {:data 6 :block/level 2}
                {:data 7 :block/level 3}
                {:data 8 :block/level 4}
                {:data 9 :block/level 2}
                {:data 10 :block/level 3}
                {:data 11 :block/level 3}
                {:data 12 :block/level 3}
                {:data 13 :block/level 2}
                {:data 14 :block/level 3}]))))))


(defn- validate-nodes-level
  "check consecutive sorted nodes' :block/level are legal"
  [nodes]
  (loop [nodes (next nodes) last-level (some-> (first nodes) outliner-core/-get-level)]
    (when (seq nodes)
      (let [node (first nodes)
            level (outliner-core/-get-level node)]
        (is (<= level (inc last-level)) (str "node: " node))
        (recur (next nodes) level)))))


(defn- gen-random-tree
  "PREFIX: used for generating unique data, :data is :db/unique in this test-file for test"
  [n prefix]
  (let [coll (transient [])]
    (loop [i 0 last-level 0]
      (when (< i n)
        (let [level (inc (rand-int (inc last-level)))]
          (conj! coll {:data (str prefix "-" i) :block/level level})
          (recur (inc i) level))))
    (persistent! coll)))

(defn- op-insert-nodes
  [db seq-state]
  (let [datoms (d/datoms db :avet :data)]
    (if (empty? datoms)
      {:txs-data [] :nodes-count-change 0}
      (let [nodes (gen-random-tree (inc (rand-int 10)) (vswap! seq-state inc))
            target-id (:e (g/generate (g/elements datoms)))]
        {:txs-data (outliner-core/insert-nodes nodes db target-id (g/generate g/boolean))
         :nodes-count-change (count nodes)}))))

(defn- op-delete-nodes
  [db _]
  (let [datoms (d/datoms db :avet :data)]
    (if (empty? datoms)
      {:txs-data [] :nodes-count-change 0}
      (let [node (d/entity db (:e (g/generate (g/elements datoms))))
            nodes (outliner-core/get-children-nodes node db)]
        {:txs-data (outliner-core/delete-nodes nodes db)
         :nodes-count-change (- (count nodes))}))))

(defn- op-indent-nodes
  [db _]
  (let [datoms (d/datoms db :avet :data)]
    (if (empty? datoms)
      {:txs-data [] :nodes-count-change 0}
      (let [nodes (apply subvec (vec (outliner-core/get-page-nodes (d/entity db 1) db))
                         (sort [(rand-int (count datoms)) (rand-int (count datoms))]))]
        (if (seq nodes)
          {:txs-data (outliner-core/indent-nodes nodes db)
             :nodes-count-change 0}
          {:txs-data [] :nodes-count-change 0})))))

(defn- op-outdent-nodes
  [db _]
  (let [datoms (d/datoms db :avet :data)]
    (if (empty? datoms)
      {:txs-data [] :nodes-count-change 0}
      (let [nodes (apply subvec (vec (outliner-core/get-page-nodes (d/entity db 1) db))
                         (sort [(rand-int (count datoms)) (rand-int (count datoms))]))]
        (if (seq nodes)
          {:txs-data (outliner-core/outdent-nodes nodes db)
           :nodes-count-change 0}
          {:txs-data [] :nodes-count-change 0})))))

(defn- op-move-nodes
  [db _seq-state]
  (let [datoms (d/datoms db :avet :data)]
    (if (empty? datoms)
      {:txs-data [] :nodes-count-change 0}
      (let [node (d/entity db (:e (g/generate (g/elements datoms))))
            nodes (outliner-core/get-children-nodes node db)
            target (loop [n 10 maybe-node (d/entity db (:e (g/generate (g/elements datoms))))]
                     (cond
                       (= 0 n)
                       nil
                       (outliner-core/contains-node? nodes maybe-node)
                       (recur (dec n) (d/entity db (:e (g/generate (g/elements datoms)))))
                       :else
                       maybe-node))]
        (if-not target
          {:txs-data [] :nodes-count-change 0}
          {:txs-data (outliner-core/move-nodes nodes db target (g/generate g/boolean))
           :nodes-count-change 0})))))


;;; generative testcases
;; build random legal tree, then apply random operations on it.

(deftest test-random-op
  (testing "random insert/delete/indent/outdent nodes"
    (dotimes [_ 20]
      (let [seq-state (volatile! 0)
            tree (gen-random-tree 20 (vswap! seq-state inc))
            conn (build-db-records tree)
            nodes-count (volatile! (count tree))]
        (println "(test-random-op) random insert/delete/indent/outdent nodes (100 runs)")
        (dotimes [_ 100]
          (let [{:keys [txs-data nodes-count-change]}
                ((g/generate (g/elements [op-insert-nodes
                                          op-delete-nodes
                                          op-indent-nodes
                                          op-outdent-nodes
                                          op-move-nodes])) @conn seq-state)]
            (d/transact! conn txs-data)
            (vswap! nodes-count #(+ % nodes-count-change))
            (let [page-nodes (get-page-nodes @conn)]
              (validate-nodes-level page-nodes) ;check nodes level
              (is (= @nodes-count (count page-nodes))) ; check node count
              )))))))

;;; generative testcases on write-operations with side-effects

(defn- fetch-tx-data [*txs]
  (fn [tx-data]
    (vswap! *txs into tx-data)))

(defn- undo-tx-data! [conn tx-data]
  (let [rev-tx-data (->> tx-data
                         reverse
                         (map (fn [[e a v t add?]]
                                (let [op (if add? :db/retract :db/add)]
                                  [op e a v t]))))]
    (d/transact! conn rev-tx-data)))

(defn- op-insert-nodes!
  [conn seq-state]
  (let [datoms (d/datoms @conn :avet :data)]
    (when (seq datoms)
      (let [nodes (gen-random-tree (inc (rand-int 10)) (vswap! seq-state inc))
            target-id (:e (g/generate (g/elements datoms)))]
        (outliner-core/insert-nodes! nodes conn target-id (g/generate g/boolean))))))

(defn- op-delete-nodes!
  [conn _seq-state]
  (let [datoms (d/datoms @conn :avet :data)]
    (when (seq datoms)
      (let [node (d/entity @conn (:e (g/generate (g/elements datoms))))
            nodes (outliner-core/get-children-nodes node @conn)]
        (outliner-core/delete-nodes! nodes conn)))))

(defn- op-indent-nodes!
  [conn _seq-state]
  (let [datoms (d/datoms @conn :avet :data)]
    (when (seq datoms)
      (let [nodes (apply subvec (vec (outliner-core/get-page-nodes (d/entity @conn 1) @conn))
                         (sort [(rand-int (count datoms)) (rand-int (count datoms))]))]
        (when (seq nodes)
          (outliner-core/indent-nodes! nodes conn))))))

(defn- op-outdent-nodes!
  [conn _seq-state]
  (let [datoms (d/datoms @conn :avet :data)]
    (when (seq datoms)
      (let [nodes (apply subvec (vec (outliner-core/get-page-nodes (d/entity @conn 1) @conn))
                         (sort [(rand-int (count datoms)) (rand-int (count datoms))]))]
        (when (seq nodes)
          (outliner-core/outdent-nodes! nodes conn))))))

(defn- op-move-nodes!
  [conn _seq-state]
  (let [datoms (d/datoms @conn :avet :data)]
    (when (seq datoms)
      (let [node (d/entity @conn (:e (g/generate (g/elements datoms))))
            nodes (outliner-core/get-children-nodes node @conn)
            target (loop [n 10 maybe-node (d/entity @conn (:e (g/generate (g/elements datoms))))]
                     (cond
                       (= 0 n)
                       nil
                       (outliner-core/contains-node? nodes maybe-node)
                       (recur (dec n) (d/entity @conn (:e (g/generate (g/elements datoms)))))
                       :else
                       maybe-node))]
        (when target
          (outliner-core/move-nodes! nodes conn target (g/generate g/boolean)))))))

(deftest test-random-op!
  (testing "random insert nodes"
    (dotimes [_ 20]
      (let [seq-state (volatile! 0)
            tree (gen-random-tree 20 (vswap! seq-state inc))
            conn (build-db-records tree)
            origin-db @conn
            *tx-data (volatile! [])]
        (binding [tx/listeners (volatile! [(fetch-tx-data *tx-data)])]
          (tx/save-transactions
           {}
           (println "(test-random-op!) random insert/delete/indent/outdent nodes (100 runs)")
           (dotimes [_ 100]
             ((g/generate (g/elements [op-insert-nodes!
                                       op-delete-nodes!
                                       op-indent-nodes!
                                       op-outdent-nodes!
                                       op-move-nodes!])) conn seq-state)))
          ;; undo all *tx-data, then validate it's equal to origin db
          (is (not= origin-db @conn))
          (undo-tx-data! conn @*tx-data)
          (is (= origin-db @conn)))))))
