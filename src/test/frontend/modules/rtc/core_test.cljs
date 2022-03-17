(ns frontend.modules.rtc.core-test
  (:require [cljs.test :refer [deftest testing] :as test]
            [datascript.core :as d]
            [frontend.modules.outliner.core2 :as outliner-core]
            [clojure.test.check.generators :as g]
            [frontend.modules.rtc.core :as rtc]))

(defn- validate-nodes-parent
  "check that NODE's :block/parent node is positioned before NODE"
  [nodes db]
  (let [seen (volatile! #{1})]
    (doseq [node nodes]
      (assert (contains? @seen (outliner-core/get-id (outliner-core/get-parent node db)))
              (outliner-core/get-id (outliner-core/get-parent node db)))
      (vswap! seen conj (outliner-core/get-id node)))))

(def tree
  [{:block/uuid 1 :level 1 :data "1"}
   {:block/uuid 2 :level 2 :data "2"}
   {:block/uuid 3 :level 3 :data "3"}
   {:block/uuid 4 :level 4 :data "4"}
   {:block/uuid 5 :level 1 :data "5"}
   {:block/uuid 6 :level 2 :data "6"}
   {:block/uuid 7 :level 3 :data "7"}
   {:block/uuid 8 :level 4 :data "8"}
   {:block/uuid 9 :level 3 :data "9"}
   {:block/uuid 10 :level 4 :data "10"}
   {:block/uuid 11 :level 4 :data "11"}
   {:block/uuid 12 :level 1 :data "12"}
   {:block/uuid 13 :level 2 :data "13"}
   {:block/uuid 14 :level 3 :data "14"}]
  )

(defn- build-db-records
  [tree]
  (let [conn (d/create-conn {:block/next {:db/valueType :db.type/ref
                                          :db/unique :db.unique/value}
                             :block/uuid {:db/unique :db.unique/identity}
                             :block/parent {:db/valueType :db.type/ref
                                            :db/index true}
                             :block/name {:db/unique :db.unique/identity}})]
    (d/transact! conn [[:db/add 1 :page-block true]
                       [:db/add 1 :block/name "fake-page-name"]])
    (d/transact! conn (outliner-core/insert-nodes tree @conn 1 false))
    conn))

(defn- get-page-nodes
  [db]
  (map #(select-keys % [:data :block/parent :db/id :block/uuid])
       (outliner-core/get-page-nodes (d/entity db 1) db)))

(defn- print-page-nodes
  [db]
  (loop [parents {}
         [node & tail] (get-page-nodes db)]
    (when node
      (->> node
           ((juxt #(apply str (repeat (inc (get parents (:db/id (:block/parent %)) -1)) "__")) (constantly "- ") :data))
           (apply str)
           println)
      (recur (assoc parents (:db/id node) (inc (get parents (:db/id (:block/parent node)) -1))) tail))))

(def ^:private last-id (atom 100))
(defn- new-id []
  (swap! last-id inc)
  @last-id)

(defn- gen:insert-block-op
  [db]
  (when-some [datoms (d/datoms db :avet :block/uuid)]
    (let [target-uuid (:v (g/generate (g/elements datoms)))
          siblings? (g/generate g/boolean)
          block-uuid (new-id)]
      [:insert-block-op
       [["fake-page-name" target-uuid siblings?]]
       [block-uuid]
       (str "insert " block-uuid)])))

(defn- gen:update-block-op
  [db]
  (when-some [datoms (d/datoms db :avet :block/uuid)]
    (let [block-entity (d/entity db (:e (g/generate (g/elements datoms))))
          prev-sibling-entity (outliner-core/get-prev-sibling-node
                               block-entity db)
          siblings? (boolean prev-sibling-entity)
          parent-node (outliner-core/get-parent block-entity db)
          block-uuid (:block/uuid block-entity)]
      [:update-block-op
       [["fake-page-name"
         (:block/uuid (or prev-sibling-entity parent-node))
         siblings?]]
       [block-uuid]
       (str "update " block-uuid)])))

(defn- gen:delete-blocks-op
  [db]
  (when-some [datoms (d/datoms db :avet :block/uuid)]
    (let [node (d/entity db (:e (g/generate (g/elements datoms))))
          nodes (outliner-core/get-children-nodes node db)]
      [:delete-blocks-op (mapv :block/uuid nodes)])))

(defn- gen:move-blocks-op
  [db]
  (when-some [datoms (d/datoms db :avet :block/uuid)]
    (let [node (d/entity db (:e (g/generate (g/elements datoms))))
          nodes (outliner-core/get-children-nodes node db)
          target-node
          (loop [n 10
                 maybe-result-node
                 (d/entity db (:e (g/generate (g/elements datoms))))]
            (cond (= 0 n)
                  nil
                  (outliner-core/contains-node? nodes maybe-result-node)
                  (recur (dec n)
                         (d/entity db (:e (g/generate (g/elements datoms)))))
                  :else
                  maybe-result-node))
          siblings? (g/generate g/boolean)]
      (when target-node
        [:move-blocks-op
         [["fake-page-name" (:block/uuid target-node) siblings?]]
         (mapv :block/uuid nodes)]))))


(deftest test-random-op-on-2-db
  (testing "insert-block/update-block/move-block/delete-block"
    (let [server-conn (build-db-records tree)
          client-conn (d/conn-from-db @server-conn)
          client-replay-conn (d/conn-from-db @server-conn)
          server-ops (volatile! [])
          client-ops (volatile! [])]
      (dotimes [_ 500]
        (let [op ((g/generate
                   (g/frequency [[5 (g/return gen:insert-block-op)]
                                 [5 (g/return gen:move-blocks-op)]
                                 [5 (g/return gen:update-block-op)]
                                 [1 (g/return gen:delete-blocks-op)]]))
                  @server-conn)]
          (when op
            (println "server" op)
            (d/transact! server-conn (rtc/apply-op op @server-conn))
            (vswap! server-ops conj op))))
      (dotimes [_ 500]
        (let [op ((g/generate
                   (g/frequency [[5 (g/return gen:insert-block-op)]
                                 [5 (g/return gen:move-blocks-op)]
                                 [5 (g/return gen:update-block-op)]
                                 [1 (g/return gen:delete-blocks-op)]]))
                  @client-conn)]
          (when op
            (println "client" op)
            (let [apply-tx (rtc/apply-op op @client-conn)
                  {tx-data :tx-data} (d/transact! client-conn apply-tx)]
              (vswap! client-ops conj [op tx-data])))))
      (doseq [[op tx-data] @client-ops]
        (let [ops (rtc/apply-op-on-altered-db
                   op @server-conn @client-replay-conn)]
          (doseq [op ops]
            (println "op" op)
            (d/transact! server-conn (rtc/apply-op op @server-conn)))
          (d/transact! client-replay-conn tx-data)
          (validate-nodes-parent
           (outliner-core/get-page-nodes (d/entity @server-conn 1) @server-conn) @server-conn)))
      (def xxx [client-replay-conn server-conn]))))
