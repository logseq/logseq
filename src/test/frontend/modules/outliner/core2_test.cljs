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
  [{:data 1 :level 1}
   {:data 2 :level 2}
   {:data 3 :level 3}
   {:data 4 :level 4}
   {:data 5 :level 4}
   {:data 6 :level 3}
   {:data 7 :level 4}
   {:data 8 :level 5}
   {:data 9 :level 3}
   {:data 10 :level 4}
   {:data 11 :level 4}
   {:data 12 :level 4}
   {:data 13 :level 2}
   {:data 14 :level 3}])

(defn- build-db-records
  [tree]
  (let [conn (d/create-conn {:block/next {:db/valueType :db.type/ref
                                          :db/unique :db.unique/value}
                             :block/parent {:db/valueType :db.type/ref
                                            :db/index true}
                             :data {:db/unique :db.unique/identity}})]
    (d/transact! conn [[:db/add 1 :page-block true]])
    (d/transact! conn (outliner-core/insert-nodes tree @conn 1 false))
    conn))

(defn- get-page-nodes1
  [db]
  (sequence
   (comp
    (map #(select-keys % [:data :block/parent :db/id]))
    (map #(update % :block/parent :db/id)))
   (outliner-core/get-page-nodes (d/entity db 1) db)))

(defn- get-page-nodes2
  [db]
  (outliner-core/get-page-nodes (d/entity db 1) db))

;;; testcases for operations (pure functions)

(deftest test-insert-nodes
  (testing "insert 15, 16 as children after 5; 15 & 16 are siblings"
    (let [conn (build-db-records tree)
          txs-data
          (outliner-core/insert-nodes [{:data 15 :level 1} {:data 16 :level 1}] @conn
                                      (d/entid @conn [:data 5]) false)]
      (d/transact! conn txs-data)
      (let [nodes-data (get-page-nodes1 @conn)]
        (is (= [{:data 1, :block/parent 1, :db/id 2}
                {:data 2, :block/parent 2, :db/id 3}
                {:data 3, :block/parent 3, :db/id 4}
                {:data 4, :block/parent 4, :db/id 5}
                {:data 5, :block/parent 4, :db/id 6}
                {:data 15, :block/parent 6, :db/id 16}
                {:data 16, :block/parent 6, :db/id 17}
                {:data 6, :block/parent 3, :db/id 7}
                {:data 7, :block/parent 7, :db/id 8}
                {:data 8, :block/parent 8, :db/id 9}
                {:data 9, :block/parent 3, :db/id 10}
                {:data 10, :block/parent 10, :db/id 11}
                {:data 11, :block/parent 10, :db/id 12}
                {:data 12, :block/parent 10, :db/id 13}
                {:data 13, :block/parent 2, :db/id 14}
                {:data 14, :block/parent 14, :db/id 15}] nodes-data)))))
  (testing "insert 15, 16 as children after 5; 16 is child of 15"
    (let [conn (build-db-records tree)
          txs-data
          (outliner-core/insert-nodes [{:data 15 :level 1} {:data 16 :level 2}] @conn
                                      (d/entid @conn [:data 5]) false)]
      (d/transact! conn txs-data)
      (let [nodes-data (get-page-nodes1 @conn)]
        (is (= [{:data 1, :block/parent 1, :db/id 2}
                {:data 2, :block/parent 2, :db/id 3}
                {:data 3, :block/parent 3, :db/id 4}
                {:data 4, :block/parent 4, :db/id 5}
                {:data 5, :block/parent 4, :db/id 6}
                {:data 15, :block/parent 6, :db/id 16}
                {:data 16, :block/parent 16, :db/id 17}
                {:data 6, :block/parent 3, :db/id 7}
                {:data 7, :block/parent 7, :db/id 8}
                {:data 8, :block/parent 8, :db/id 9}
                {:data 9, :block/parent 3, :db/id 10}
                {:data 10, :block/parent 10, :db/id 11}
                {:data 11, :block/parent 10, :db/id 12}
                {:data 12, :block/parent 10, :db/id 13}
                {:data 13, :block/parent 2, :db/id 14}
                {:data 14, :block/parent 14, :db/id 15}] nodes-data))))))

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
      (let [page-nodes (get-page-nodes1 @conn)]
        (is (= page-nodes
               [{:data 1, :block/parent 1, :db/id 2}
                {:data 2, :block/parent 2, :db/id 3}
                {:data 6, :block/parent 3, :db/id 7}
                {:data 7, :block/parent 7, :db/id 8}
                {:data 8, :block/parent 8, :db/id 9}
                {:data 9, :block/parent 3, :db/id 10}
                {:data 10, :block/parent 10, :db/id 11}
                {:data 11, :block/parent 10, :db/id 12}
                {:data 3, :block/parent 12, :db/id 4}
                {:data 4, :block/parent 4, :db/id 5}
                {:data 5, :block/parent 4, :db/id 6}
                {:data 12, :block/parent 10, :db/id 13}
                {:data 13, :block/parent 2, :db/id 14}
                {:data 14, :block/parent 14, :db/id 15}]))))))

(deftest test-delete-nodes
  (testing "delete 6-12 nodes"
    (let [conn (build-db-records tree)
          nodes-6 (outliner-core/get-children-nodes (d/entity @conn [:data 6] @conn) @conn)
          nodes-9 (outliner-core/get-children-nodes (d/entity @conn [:data 9] @conn) @conn)
          txs-data (outliner-core/delete-nodes (concat nodes-6 nodes-9) @conn)]
      (d/transact! conn txs-data)
      (let [page-nodes (get-page-nodes1 @conn)]
        (is (= page-nodes
               [{:data 1, :block/parent 1, :db/id 2}
                {:data 2, :block/parent 2, :db/id 3}
                {:data 3, :block/parent 3, :db/id 4}
                {:data 4, :block/parent 4, :db/id 5}
                {:data 5, :block/parent 4, :db/id 6}
                {:data 13, :block/parent 2, :db/id 14}
                {:data 14, :block/parent 14, :db/id 15}]))))))

(deftest test-indent-nodes
  (testing "indent 6-12 nodes"
    (let [conn (build-db-records tree)
          nodes-6 (outliner-core/get-children-nodes (d/entity @conn [:data 6] @conn) @conn)
          nodes-9 (outliner-core/get-children-nodes (d/entity @conn [:data 9] @conn) @conn)
          txs-data (outliner-core/indent-nodes (concat nodes-6 nodes-9) @conn)]
      (d/transact! conn txs-data)
      (let [page-nodes (get-page-nodes1 @conn)]
        (is (= page-nodes
               [{:data 1, :block/parent 1, :db/id 2}
                {:data 2, :block/parent 2, :db/id 3}
                {:data 3, :block/parent 3, :db/id 4}
                {:data 4, :block/parent 4, :db/id 5}
                {:data 5, :block/parent 4, :db/id 6}
                {:data 6, :block/parent 4, :db/id 7}
                {:data 7, :block/parent 7, :db/id 8}
                {:data 8, :block/parent 8, :db/id 9}
                {:data 9, :block/parent 4, :db/id 10}
                {:data 10, :block/parent 10, :db/id 11}
                {:data 11, :block/parent 10, :db/id 12}
                {:data 12, :block/parent 10, :db/id 13}
                {:data 13, :block/parent 2, :db/id 14}
                {:data 14, :block/parent 14, :db/id 15}]))))))

(deftest test-outdent-nodes
  (testing "outdent 6-12 nodes"
    (let [conn (build-db-records tree)
          nodes-6 (outliner-core/get-children-nodes (d/entity @conn [:data 6] @conn) @conn)
          nodes-9 (outliner-core/get-children-nodes (d/entity @conn [:data 9] @conn) @conn)
          txs-data (outliner-core/outdent-nodes (concat nodes-6 nodes-9) @conn)]
      (d/transact! conn txs-data)
      (let [page-nodes (get-page-nodes1 @conn)]
        (is (= page-nodes
               [{:data 1, :block/parent 1, :db/id 2}
                {:data 2, :block/parent 2, :db/id 3}
                {:data 3, :block/parent 3, :db/id 4}
                {:data 4, :block/parent 4, :db/id 5}
                {:data 5, :block/parent 4, :db/id 6}
                {:data 6, :block/parent 2, :db/id 7}
                {:data 7, :block/parent 7, :db/id 8}
                {:data 8, :block/parent 8, :db/id 9}
                {:data 9, :block/parent 2, :db/id 10}
                {:data 10, :block/parent 10, :db/id 11}
                {:data 11, :block/parent 10, :db/id 12}
                {:data 12, :block/parent 10, :db/id 13}
                {:data 13, :block/parent 2, :db/id 14}
                {:data 14, :block/parent 14, :db/id 15}]))))))

(defn- validate-nodes-parent
  "check that NODE's :block/parent node is positioned before NODE"
  [nodes db]
  (let [seen (volatile! #{1})]
    (doseq [node nodes]
      (assert (contains? @seen (outliner-core/get-id (outliner-core/get-parent node db)))
              (outliner-core/get-id (outliner-core/get-parent node db)))
      (vswap! seen conj (outliner-core/get-id node)))))


(defn- gen-random-tree
  "PREFIX: used for generating unique data, :data is :db/unique in this test-file for test"
  [n prefix]
  (let [coll (transient [])]
    (loop [i 0 last-level 0]
      (when (< i n)
        (let [level (inc (rand-int (inc last-level)))]
          (conj! coll {:data (str prefix "-" i) :level level})
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
            (let [page-nodes (get-page-nodes2 @conn)]
              (validate-nodes-parent page-nodes @conn)
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
