(ns logseq.cli.command.add-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.cli.command.add :as add-command]))

(deftest test-collect-created-block-uuids
  (testing "collects uuids depth-first and removes duplicates"
    (let [root-uuid (random-uuid)
          child-uuid (random-uuid)
          grandchild-uuid (random-uuid)
          sibling-uuid (random-uuid)
          blocks [{:block/uuid root-uuid
                   :block/children [{:block/uuid child-uuid}
                                    {:block/title "without uuid"
                                     :block/children [{:block/uuid grandchild-uuid}]}]}
                  {:block/uuid sibling-uuid}
                  {:block/uuid child-uuid}]]
      (is (= [root-uuid child-uuid grandchild-uuid sibling-uuid]
             (#'add-command/collect-created-block-uuids blocks))))))

(deftest test-created-ids-in-order
  (testing "normalizes created ids in deterministic uuid order"
    (let [uuid-a (random-uuid)
          uuid-b (random-uuid)
          uuid-c (random-uuid)
          ordered-uuids [uuid-c uuid-a uuid-b]
          entities [{:block/uuid uuid-a :db/id 101}
                    {:block/uuid uuid-b :db/id 202}
                    {:block/uuid uuid-c :db/id 303}]]
      (is (= [303 101 202]
             (#'add-command/created-ids-in-order ordered-uuids entities :block))))))

(deftest test-created-ids-in-order-errors-on-missing-entity
  (testing "throws when any created uuid cannot be resolved to db/id"
    (let [uuid-a (random-uuid)
          uuid-b (random-uuid)
          error (try
                  (#'add-command/created-ids-in-order
                   [uuid-a uuid-b]
                   [{:block/uuid uuid-a :db/id 11}]
                   :block)
                  nil
                  (catch :default e e))]
      (is (some? error))
      (is (= :add-id-resolution-failed (-> error ex-data :code)))
      (is (= [uuid-b] (-> error ex-data :missing-uuids))))))
