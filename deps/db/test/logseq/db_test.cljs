(ns logseq.db-test
  (:require [cljs.test :refer [deftest is]]
            [logseq.db.frontend.schema :as db-schema]
            [datascript.core :as d]
            [logseq.db :as ldb]))


;;; datoms
;;; - 1 <----+
;;;   - 2    |
;;;     - 3 -+
(def broken-outliner-data-with-cycle
  [{:db/id 1
    :block/uuid #uuid"e538d319-48d4-4a6d-ae70-c03bb55b6fe4"
    :block/parent 3}
   {:db/id 2
    :block/uuid #uuid"c46664c0-ea45-4998-adf0-4c36486bb2e5"
    :block/parent 1}
   {:db/id 3
    :block/uuid #uuid"2b736ac4-fd49-4e04-b00f-48997d2c61a2"
    :block/parent 2}])

(deftest get-block-children-ids-on-bad-outliner-data
  (let [db (d/db-with (d/empty-db db-schema/schema)
                      broken-outliner-data-with-cycle)]
    (is (= "bad outliner data, need to re-index to fix"
           (try (ldb/get-block-children-ids db #uuid "e538d319-48d4-4a6d-ae70-c03bb55b6fe4")
                (catch :default e
                  (ex-message e)))))))
