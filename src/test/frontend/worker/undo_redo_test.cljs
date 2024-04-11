(ns frontend.worker.undo-redo-test
  (:require [clojure.test :as t :refer [deftest is testing use-fixtures]]
            [clojure.test.check.generators :as gen]
            [datascript.core :as d]
            [frontend.db :as db]
            [frontend.test.generators :as t.gen]
            [frontend.test.helper :as test-helper]
            [frontend.worker.undo-redo :as undo-redo]))

(def ^:private page-uuid (random-uuid))
(def ^:private init-data (test-helper/initial-test-page-and-blocks {:page-uuid page-uuid}))

(defn- start-and-destroy-db
  [f]
  (test-helper/db-based-start-and-destroy-db
   f
   {:init-data (fn [conn] (d/transact! conn init-data))}))

(use-fixtures :each start-and-destroy-db)

(def ^:private gen-non-exist-block-uuid gen/uuid)

(defn- gen-block-uuid
  [db & {:keys [non-exist-frequency] :or {non-exist-frequency 1}}]
  (gen/frequency [[9 (t.gen/gen-available-block-uuid db {:page-uuid page-uuid})]
                  [non-exist-frequency gen-non-exist-block-uuid]]))

(defn- gen-parent-left-pair
  [db]
  (gen/frequency [[9 (t.gen/gen-available-parent-left-pair db {:page-uuid page-uuid})]
                  [1 (gen/vector gen-non-exist-block-uuid 2)]]))

(defn- gen-move-block-op
  [db]
  (gen/let [block-uuid (gen-block-uuid db)
            [parent left] (gen-parent-left-pair db)]
    [:frontend.worker.undo-redo/move-block
     {:block-uuid block-uuid
      :block-origin-left left
      :block-origin-parent parent}]))

(defn- gen-insert-block-op
  [db]
  (gen/let [block-uuid (gen-block-uuid db)]
    [:frontend.worker.undo-redo/insert-block
     {:block-uuid block-uuid}]))

(defn- gen-remove-block-op
  [db]
  (gen/let [block-uuid (gen-block-uuid db {:non-exist-frequency 90})
            [parent left] (gen-parent-left-pair db)
            content gen/string-alphanumeric]
    [:frontend.worker.undo-redo/remove-block
     {:block-uuid block-uuid
      :block-entity-map
      {:block/uuid block-uuid
       :block/left left
       :block/parent parent
       :block/content content}}]))

(defn- gen-update-block-op
  [db]
  (gen/let [block-uuid (gen-block-uuid db)
            content gen/string-alphanumeric]
    [:frontend.worker.undo-redo/update-block
     {:block-uuid block-uuid
      :block-origin-content content}]))

(def ^:private gen-boundary (gen/return [:frontend.worker.undo-redo/boundary]))

(defn- gen-op
  [db & {:keys [insert-block-op move-block-op remove-block-op update-block-op boundary-op]
         :or {insert-block-op 2
              move-block-op 2
              remove-block-op 4
              update-block-op 2
              boundary-op 2}}]
  (gen/frequency [[insert-block-op (gen-insert-block-op db)]
                  [move-block-op (gen-move-block-op db)]
                  [remove-block-op (gen-remove-block-op db)]
                  [update-block-op (gen-update-block-op db)]
                  [boundary-op gen-boundary]]))

(defn- get-db-block-set
  [db]
  (set
   (apply concat
          (d/q '[:find ?uuid
                 :where
                 [?b :block/uuid ?uuid]
                 [?b :block/parent ?parent]
                 [?b :block/left ?left]
                 [?parent :block/uuid ?parent-uuid]
                 [?left :block/uuid ?left-uuid]]
               db))))


(defn- check-block-count
  [{:keys [op tx]} current-db]
  (case (first op)
    :frontend.worker.undo-redo/move-block
    (assert (= (:block-origin-left (second op))
               (:block/uuid (:block/left (d/entity current-db [:block/uuid (:block-uuid (second op))]))))
            {:op op :tx-data (:tx-data tx) :x (keys tx)})

    :frontend.worker.undo-redo/update-block
    (assert (some? (d/entity current-db [:block/uuid (:block-uuid (second op))]))
            {:op op :tx-data (:tx-data tx)})

    :frontend.worker.undo-redo/insert-block
    (assert (nil? (d/entity current-db [:block/uuid (:block-uuid (second op))]))
            {:op op :tx-data (:tx-data tx) :x (keys tx)})
    :frontend.worker.undo-redo/remove-block
    (assert (some? (d/entity current-db [:block/uuid (:block-uuid (second op))]))
            {:op op :tx-data (:tx-data tx) :x (keys tx)})
    ;; else
    nil))

(defn- undo-all-then-redo-all
  [conn]
  (binding [undo-redo/*undo-redo-info-for-test* (atom nil)]
    (loop [i 0]
      (let [r (undo-redo/undo test-helper/test-db-name-db-version page-uuid conn)
            current-db @conn]
        (check-block-count @undo-redo/*undo-redo-info-for-test* current-db)
        (if (not= :frontend.worker.undo-redo/empty-undo-stack r)
          (recur (inc i))
          (prn :undo-count i))))

    (loop []
      (let [r (undo-redo/redo test-helper/test-db-name-db-version page-uuid conn)
            current-db @conn]
        (check-block-count @undo-redo/*undo-redo-info-for-test* current-db)
        (when (not= :frontend.worker.undo-redo/empty-redo-stack r)
          (recur))))))

(deftest undo-redo-gen-test
  (let [conn (db/get-db false)
        all-remove-ops (gen/generate (gen/vector (gen-op @conn {:remove-block-op 1000}) 100))]
    (#'undo-redo/push-undo-ops test-helper/test-db-name-db-version page-uuid all-remove-ops)
    (prn :block-count-before-init (count (get-db-block-set @conn)))
    (loop [i 0]
      (when (not= :frontend.worker.undo-redo/empty-undo-stack
                  (undo-redo/undo test-helper/test-db-name-db-version page-uuid conn))
        (recur (inc i))))
    (prn :block-count (count (get-db-block-set @conn)))
    (undo-redo/clear-undo-redo-stack)
    (testing "move blocks"
      (let [origin-graph-block-set (get-db-block-set @conn)
            ops (gen/generate (gen/vector (gen-op @conn {:move-block-op 1000 :boundary-op 500}) 300))]
        (prn :ops (count ops))
        (#'undo-redo/push-undo-ops test-helper/test-db-name-db-version page-uuid ops)

        (undo-all-then-redo-all conn)
        (undo-all-then-redo-all conn)
        (undo-all-then-redo-all conn)

        (is (= origin-graph-block-set (get-db-block-set @conn)))))

    (testing "random ops"
      (let [origin-graph-block-set (get-db-block-set @conn)
            ops (gen/generate (gen/vector (gen-op @conn) 1000))]
        (prn :ops (count ops))
        (#'undo-redo/push-undo-ops test-helper/test-db-name-db-version page-uuid ops)

        (undo-all-then-redo-all conn)
        (undo-all-then-redo-all conn)
        (undo-all-then-redo-all conn)

        (is (= origin-graph-block-set (get-db-block-set @conn)))))
    ))
