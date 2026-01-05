(ns frontend.worker.rtc.client-op-test
  (:require [cljs.test :as t :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.rtc.client-op :as client-op]
            [frontend.worker.state :as worker-state]))

(deftest merge-update-ops-test
  (testing "older op added after newer op should be merged in correct order"
    (let [conn (d/create-conn client-op/schema-in-db)
          block-uuid (random-uuid)
          op1 [:update 1 {:block-uuid block-uuid
                          :av-coll [[:block/title "A" 1 true]]}]
          op2 [:update 2 {:block-uuid block-uuid
                          :av-coll [[:block/title "B" 2 true]]}]]
      (with-redefs [worker-state/get-client-ops-conn (constantly conn)]
        ;; 1. Add newer op first
        (client-op/add-ops! "repo" [op2])

        ;; 2. Add older op later
        (client-op/add-ops! "repo" [op1])

        ;; 3. Verify merged result
        (let [ops (client-op/get&remove-all-block-ops "repo")
              merged-op (first ops)]
          (is (= 1 (count ops)))
          (is (= :update (first (:update merged-op))))
          (is (= 2 (second (:update merged-op)))) ;; Should keep the max t

          (let [av-coll (:av-coll (last (:update merged-op)))]
            (is (= 2 (count av-coll)))
            ;; The av-coll should contain both, but order matters for semantic correctness.
            ;; Logic in merge-update-ops:
            ;; (if (> t1 t2) (merge-update-ops op2 op1) ...)
            ;; so it recursively ensures older is merged into newer (or concatenated properly).
            ;; effectively: (concat av-coll-of-older av-coll-of-newer)

            (is (= [[:block/title "A" 1 true]
                    [:block/title "B" 2 true]]
                   av-coll))))))))

(deftest remove-op-wins-over-older-move-op-test
  (testing "older move-op added after newer remove-op should NOT resurrect the block"
    (let [conn (d/create-conn client-op/schema-in-db)
          block-uuid (random-uuid)
          move-op [:move 1 {:block-uuid block-uuid}]
          remove-op [:remove 2 {:block-uuid block-uuid}]]
      (with-redefs [worker-state/get-client-ops-conn (constantly conn)]
        ;; 1. Add newer remove-op first
        (client-op/add-ops! "repo" [remove-op])

        ;; 2. Add older move-op later (simulating rollback)
        (client-op/add-ops! "repo" [move-op])

        ;; 3. Verify result
        (let [ops (client-op/get&remove-all-block-ops "repo")
              result-op (first ops)]
          (is (= 1 (count ops)))
          ;; Expectation: The remove-op (t=2) should win over move-op (t=1).
          ;; The block should remain removed.
          (is (some? (:remove result-op)))
          (is (nil? (:move result-op)))
          (is (= 2 (second (:remove result-op)))))))))

(deftest move-op-and-remove-op-exclusivity-test
  (testing "move-op and remove-op should never coexist"
    (let [conn (d/create-conn client-op/schema-in-db)
          block-uuid (random-uuid)]
      (with-redefs [worker-state/get-client-ops-conn (constantly conn)]
        (testing "Scenario 1: Newer Move after Older Remove -> Move wins"
          (let [remove-op [:remove 1 {:block-uuid block-uuid}]
                move-op [:move 2 {:block-uuid block-uuid}]]
            (client-op/add-ops! "repo" [remove-op])
            (client-op/add-ops! "repo" [move-op])

            (let [ops (client-op/get-all-block-ops "repo")
                  ;; ops = '([:move 2 {:block-uuid #uuid "461222f8-d43a-4726-9063-3a14b46d26b8"}])
                  result-op (first ops)]
              (is (= :move (first result-op)))
              (is (= 2 (second result-op)))
              ;; Clean up
              (client-op/get&remove-all-block-ops "repo"))))

        (testing "Scenario 2: Newer Remove after Older Move -> Remove wins"
          (let [move-op [:move 1 {:block-uuid block-uuid}]
                remove-op [:remove 2 {:block-uuid block-uuid}]]
            (client-op/add-ops! "repo" [move-op])
            (client-op/add-ops! "repo" [remove-op])

            (let [ops (client-op/get-all-block-ops "repo")
                  result-op (first ops)]
              (is (= :remove (first result-op)))
              (is (= 2 (second result-op)))
              ;; Clean up
              (client-op/get&remove-all-block-ops "repo"))))))))

(deftest ops-combinations-test
  (testing "Various combinations of ops on the same block"
    (let [conn (d/create-conn client-op/schema-in-db)
          block-uuid (random-uuid)]
      (with-redefs [worker-state/get-client-ops-conn (constantly conn)]
        (testing "Duplicate Ops: Add same op twice"
          (let [move-op [:move 1 {:block-uuid block-uuid}]]
            (client-op/add-ops! "repo" [move-op])
            (client-op/add-ops! "repo" [move-op])
            (let [ops (client-op/get&remove-all-block-ops "repo")
                  result-op (first ops)]
              (is (= 1 (count ops)))
              (is (some? (:move result-op)))
              (is (= 1 (second (:move result-op)))))))

        (testing "Move then Update (older move, newer update) -> Both present"
          (let [move-op [:move 1 {:block-uuid block-uuid}]
                update-op [:update 2 {:block-uuid block-uuid :av-coll []}]]
            (client-op/add-ops! "repo" [move-op])
            (client-op/add-ops! "repo" [update-op])
            (let [ops (client-op/get&remove-all-block-ops "repo")
                  result-op (first ops)]
              (is (= 1 (count ops)))
              (is (some? (:move result-op)))
              (is (= 1 (second (:move result-op))))
              (is (some? (:update result-op)))
              (is (= 2 (second (:update result-op)))))))

        (testing "Update then Move (older update, newer move) -> Both present"
          (let [update-op [:update 1 {:block-uuid block-uuid :av-coll []}]
                move-op [:move 2 {:block-uuid block-uuid}]]
            (client-op/add-ops! "repo" [update-op])
            (client-op/add-ops! "repo" [move-op])
            (let [ops (client-op/get&remove-all-block-ops "repo")
                  result-op (first ops)]
              (is (= 1 (count ops)))
              (is (some? (:update result-op)))
              (is (= 1 (second (:update result-op))))
              (is (some? (:move result-op)))
              (is (= 2 (second (:move result-op)))))))

        (testing "Update then Remove (Newer Remove) -> Remove wins"
          (let [update-op [:update 1 {:block-uuid block-uuid :av-coll []}]
                remove-op [:remove 2 {:block-uuid block-uuid}]]
            (client-op/add-ops! "repo" [update-op])
            (client-op/add-ops! "repo" [remove-op])
            (let [ops (client-op/get&remove-all-block-ops "repo")
                  result-op (first ops)]
              (is (= 1 (count ops)))
              (is (some? (:remove result-op)))
              (is (nil? (:update result-op))))))

        (testing "Remove then Update (Newer Update) -> Update wins"
          (let [remove-op [:remove 1 {:block-uuid block-uuid}]
                update-op [:update 2 {:block-uuid block-uuid :av-coll []}]]
            (client-op/add-ops! "repo" [remove-op])
            (client-op/add-ops! "repo" [update-op])
            (let [ops (client-op/get&remove-all-block-ops "repo")
                  result-op (first ops)]
              (is (= 1 (count ops)))
              (is (some? (:update result-op)))
              (is (nil? (:remove result-op))))))

        (testing "Move(t1) -> Remove(t2) -> Update(t3) -> Update wins, Move stays retracted"
          (let [move-op [:move 1 {:block-uuid block-uuid}]
                remove-op [:remove 2 {:block-uuid block-uuid}]
                update-op [:update 3 {:block-uuid block-uuid :av-coll []}]]
            (client-op/add-ops! "repo" [move-op])
            (client-op/add-ops! "repo" [remove-op])
            (client-op/add-ops! "repo" [update-op])
            (let [ops (client-op/get&remove-all-block-ops "repo")
                  result-op (first ops)]
              (is (= 1 (count ops)))
              (is (some? (:update result-op)))
              (is (= 3 (second (:update result-op))))
              (is (nil? (:remove result-op)))
              (is (nil? (:move result-op))))))

        (testing "Remove(t1) -> Update(t2) -> Move(t3) -> Update+Move wins"
          (let [remove-op [:remove 1 {:block-uuid block-uuid}]
                update-op [:update 2 {:block-uuid block-uuid :av-coll []}]
                move-op [:move 3 {:block-uuid block-uuid}]]
            (client-op/add-ops! "repo" [remove-op])
            (client-op/add-ops! "repo" [update-op])
            (client-op/add-ops! "repo" [move-op])
            (let [ops (client-op/get&remove-all-block-ops "repo")
                  result-op (first ops)]
              (is (= 1 (count ops)))
              (is (some? (:update result-op)))
              (is (= 2 (second (:update result-op))))
              (is (some? (:move result-op)))
              (is (= 3 (second (:move result-op))))
              (is (nil? (:remove result-op))))))))))

(deftest add-op-merge-test
  (testing "Merge :add and :move"
    (let [conn (d/create-conn client-op/schema-in-db)
          block-uuid (random-uuid)
          add-op [:add 1 {:block-uuid block-uuid :av-coll []}]
          move-op [:move 2 {:block-uuid block-uuid}]]
      (with-redefs [worker-state/get-client-ops-conn (constantly conn)]
        (client-op/add-ops! "repo" [add-op])
        (client-op/add-ops! "repo" [move-op])
        (let [ops (client-op/get&remove-all-block-ops "repo")
              result-op (first ops)]
          (is (= 1 (count ops)))
          (is (some? (:add result-op)))
          (is (= 2 (second (:add result-op))))
          (is (nil? (:move result-op)))))))

  (testing "Merge :add and :update"
    (let [conn (d/create-conn client-op/schema-in-db)
          block-uuid (random-uuid)
          add-op [:add 1 {:block-uuid block-uuid :av-coll [[:block/title "A" 1 true]]}]
          update-op [:update 2 {:block-uuid block-uuid :av-coll [[:block/title "B" 2 true]]}]]
      (with-redefs [worker-state/get-client-ops-conn (constantly conn)]
        (client-op/add-ops! "repo" [add-op])
        (client-op/add-ops! "repo" [update-op])
        (let [ops (client-op/get&remove-all-block-ops "repo")
              result-op (first ops)]
          (is (= 1 (count ops)))
          (is (some? (:add result-op)))
          (is (= 2 (second (:add result-op))))
          (let [av-coll (:av-coll (last (:add result-op)))]
            (is (= [[:block/title "A" 1 true] [:block/title "B" 2 true]] av-coll)))
          (is (nil? (:update result-op)))))))

  (testing "Merge :add and :remove (Newer Remove)"
    (let [conn (d/create-conn client-op/schema-in-db)
          block-uuid (random-uuid)
          add-op [:add 1 {:block-uuid block-uuid :av-coll []}]
          remove-op [:remove 2 {:block-uuid block-uuid}]]
      (with-redefs [worker-state/get-client-ops-conn (constantly conn)]
        (client-op/add-ops! "repo" [add-op])
        (client-op/add-ops! "repo" [remove-op])
        (let [ops (client-op/get&remove-all-block-ops "repo")
              result-op (first ops)]
          (is (= 1 (count ops)))
          (is (some? (:remove result-op)))
          (is (nil? (:add result-op)))))))

  (testing "Merge :remove and :add (Newer Add)"
    (let [conn (d/create-conn client-op/schema-in-db)
          block-uuid (random-uuid)
          remove-op [:remove 1 {:block-uuid block-uuid}]
          add-op [:add 2 {:block-uuid block-uuid :av-coll []}]]
      (with-redefs [worker-state/get-client-ops-conn (constantly conn)]
        (client-op/add-ops! "repo" [remove-op])
        (client-op/add-ops! "repo" [add-op])
        (let [ops (client-op/get&remove-all-block-ops "repo")
              result-op (first ops)]
          (is (= 1 (count ops)))
          (is (some? (:add result-op)))
          (is (nil? (:remove result-op))))))))
