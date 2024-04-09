(ns frontend.worker.undo-redo-test
  (:require [clojure.test :as t :refer [deftest is testing use-fixtures]]
            [clojure.test.check.generators :as gen]
            [datascript.core :as d]
            [frontend.db :as db]
            [frontend.test.generators :as t.gen]
            [frontend.test.helper :as test-helper]
            [frontend.worker.undo-redo :as undo-redo]))

(def init-data (test-helper/initial-test-page-and-blocks))
(defn start-and-destroy-db
  [f]
  (test-helper/db-based-start-and-destroy-db
   f
   {:init-data (fn [conn] (d/transact! conn init-data))}))

(use-fixtures :each start-and-destroy-db)

(def gen-non-exist-block-uuid gen/uuid)

(defn- gen-block-uuid
  [db & {:keys [non-exist-frequency] :or {non-exist-frequency 1}}]
  (gen/frequency [[9 (t.gen/gen-available-block-uuid db)] [non-exist-frequency gen-non-exist-block-uuid]]))

(defn- gen-parent-left-pair
  [db]
  (gen/frequency [[9 (t.gen/gen-available-parent-left-pair db)] [1 (gen/vector gen-non-exist-block-uuid 2)]]))

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
  (gen/let [block-uuid (gen-block-uuid db {:non-exist-frequency 80})
            [parent left] (gen-parent-left-pair db)
            content gen/string-ascii]
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
            content gen/string-ascii]
    [:frontend.worker.undo-redo/update-block
     {:block-uuid block-uuid
      :block-origin-content content}]))

(def gen-boundary (gen/return [:frontend.worker.undo-redo/boundary]))

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
  (set (d/q '[:find ?uuid ?parent-uuid ?left-uuid
              :where
              [?b :block/uuid ?uuid]
              [?b :block/parent ?parent]
              [?b :block/left ?left]
              [?parent :block/uuid ?parent-uuid]
              [?left :block/uuid ?left-uuid]]
            db)))

(defn- undo-all-then-redo-all
  [conn]
  (loop [i 0]
    (if (not= :frontend.worker.undo-redo/empty-undo-stack
              (undo-redo/undo test-helper/test-db-name-db-version conn))
      (recur (inc i))
      (prn :undo-count i)))

  (loop []
    (when (not= :frontend.worker.undo-redo/empty-redo-stack
                (undo-redo/redo test-helper/test-db-name-db-version conn))
      (recur))))

(deftest undo-test
  (let [conn (db/get-db false)
        all-remove-ops (gen/generate (gen/vector (gen-op @conn {:remove-block-op 1000}) 100))]
    (#'undo-redo/push-undo-ops test-helper/test-db-name-db-version all-remove-ops)
    (loop [i 0]
      (if (not= :frontend.worker.undo-redo/empty-undo-stack
                (undo-redo/undo test-helper/test-db-name-db-version conn))
        (recur (inc i))
        (prn :undo-count i)))
    (undo-redo/clear-undo-redo-stack)
    (testing "move blocks"
      (let [origin-graph-block-set (get-db-block-set @conn)
            ops (gen/generate (gen/vector (gen-op @conn {:move-block-op 1000 :boundary-op 500}) 1000))]
        (prn :ops (count ops))
        (#'undo-redo/push-undo-ops test-helper/test-db-name-db-version ops)

        (undo-all-then-redo-all conn)
        (undo-all-then-redo-all conn)
        (undo-all-then-redo-all conn)

        (is (= origin-graph-block-set (get-db-block-set @conn)))))

    (testing "random ops"
      (let [origin-graph-block-set (get-db-block-set @conn)
            ops (gen/generate (gen/vector (gen-op @conn) 1000))]
        (prn :ops (count ops))
        (#'undo-redo/push-undo-ops test-helper/test-db-name-db-version ops)

        (undo-all-then-redo-all conn)
        (undo-all-then-redo-all conn)
        (undo-all-then-redo-all conn)

        (is (= origin-graph-block-set (get-db-block-set @conn)))))))
