(ns logseq.db-sync.checksum-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db-sync.checksum :as checksum]
            [logseq.db.frontend.schema :as db-schema]))

(deftest checksum-ignores-unrelated-datoms-test
  (testing "checksum only depends on uuid, title, parent, and page"
    (let [page-uuid (random-uuid)
          block-uuid (random-uuid)
          base-db (-> (d/empty-db db-schema/schema)
                      (d/db-with [{:db/id 1
                                   :block/uuid page-uuid
                                   :block/name "page"
                                   :block/title "Page"}
                                  {:db/id 2
                                   :block/uuid block-uuid
                                   :block/title "Block"
                                   :block/parent 1
                                   :block/page 1}]))
          db-with-unrelated (d/db-with base-db [[:db/add 2 :block/updated-at 1773661308002]
                                                [:db/add 2 :logseq.property/created-by-ref 99]])]
      (is (= (checksum/recompute-checksum base-db)
             (checksum/recompute-checksum db-with-unrelated))))))

(deftest recompute-checksum-does-not-use-d-entity-test
  (testing "full recompute streams relevant datoms without entity materialization"
    (let [page-uuid (random-uuid)
          block-uuid (random-uuid)
          db (-> (d/empty-db db-schema/schema)
                 (d/db-with [{:db/id 1
                              :block/uuid page-uuid
                              :block/name "page"
                              :block/title "Page"}
                             {:db/id 2
                              :block/uuid block-uuid
                              :block/title "Block"
                              :block/parent 1
                              :block/page 1}]))]
      (with-redefs [d/entity (fn [& _]
                               (throw (js/Error. "checksum should not call d/entity")))]
        (is (string? (checksum/recompute-checksum db)))))))

(deftest incremental-checksum-matches-recompute-test
  (testing "incremental checksum matches full recompute after a tx"
    (let [page-uuid (random-uuid)
          block-uuid (random-uuid)
          db-before (-> (d/empty-db db-schema/schema)
                        (d/db-with [{:db/id 1
                                     :block/uuid page-uuid
                                     :block/name "page"
                                     :block/title "Page"}
                                    {:db/id 2
                                     :block/uuid block-uuid
                                     :block/title "Block"
                                     :block/parent 1
                                     :block/page 1}]))
          tx-report (d/with db-before [[:db/add 2 :block/title "Updated"]
                                       [:db/add 1 :block/name "page-updated"]])]
      (is (= (checksum/recompute-checksum (:db-after tx-report))
             (checksum/update-checksum (checksum/recompute-checksum db-before) tx-report))))))
