(ns logseq.outliner.date-property-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.pipeline :as outliner-pipeline]
            [logseq.outliner.property :as outliner-property]))

(deftest set-date-property-can-clear-to-empty-placeholder
  (testing "Date values can be cleared while the property remains on the block"
    (let [conn (db-test/create-conn-with-blocks
                {:properties {:due {:logseq.property/type :date}}
                 :pages-and-blocks
                 [{:page {:build/journal 20250203}}
                  {:page {:block/title "page1"}
                   :blocks [{:block/title "b1"
                             :build/properties {:due [:build/page {:build/journal 20250203}]}}]}]})
          block-uuid (:block/uuid (db-test/find-block-by-content @conn "b1"))
          empty-placeholder-id (:db/id (d/entity @conn :logseq.property/empty-placeholder))]
      (is (= 20250203
             (:block/journal-day (:user.property/due (d/entity @conn [:block/uuid block-uuid])))))
      (outliner-property/set-block-property! conn [:block/uuid block-uuid] :user.property/due :logseq.property/empty-placeholder)
      (let [updated (d/entity @conn [:block/uuid block-uuid])]
        (is (= empty-placeholder-id (:db/id (:user.property/due updated)))
            "Date property remains on the block")
        (is (= :logseq.property/empty-placeholder
               (:db/ident (:user.property/due updated)))
            "Date value is cleared to empty"))))

  (testing "Datetime values can be cleared while the property remains on the block"
    (let [conn (db-test/create-conn-with-blocks
                {:properties {:when {:logseq.property/type :datetime}}
                 :pages-and-blocks
                 [{:page {:block/title "page1"}
                   :blocks [{:block/title "b1"
                             :build/properties {:when 1700000000000}}]}]})
          block-uuid (:block/uuid (db-test/find-block-by-content @conn "b1"))]
      (is (= 1700000000000
             (:user.property/when (d/entity @conn [:block/uuid block-uuid]))))
      (outliner-property/set-block-property! conn [:block/uuid block-uuid] :user.property/when :logseq.property/empty-placeholder)
      (is (= :logseq.property/empty-placeholder
             (:user.property/when (d/entity @conn [:block/uuid block-uuid])))))))

(deftest clearing-past-deadline-drops-journal-ref-from-rebuild
  (testing "Set a past Deadline, then clear it the same way the UI does"
    (let [past-day 20260923
          timestamp (date-time-util/journal-day->ms past-day)
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:build/journal past-day}}
                  {:page {:block/title "today"}
                   :blocks [{:block/title "task"
                             :build/tags [:logseq.class/Task]
                             :build/properties {:logseq.property/deadline timestamp}}]}]})
          block (db-test/find-block-by-content @conn "task")
          journal-id (:db/id (db-test/find-journal-by-journal-day @conn past-day))]
      (is (contains? (set (outliner-pipeline/db-rebuild-block-refs @conn block)) journal-id)
          "A past Deadline creates a journal ref")
      (is (contains? (set ((outliner-pipeline/db-rebuild-block-refs-fn @conn) block)) journal-id)
          "Bulk rebuild also creates the past Deadline journal ref")
      (outliner-property/set-block-property! conn [:block/uuid (:block/uuid block)]
                                             :logseq.property/deadline
                                             :logseq.property/empty-placeholder)
      (let [cleared (d/entity @conn (:db/id block))
            rebuilt (set (outliner-pipeline/db-rebuild-block-refs @conn cleared))
            rebuilt-bulk (set ((outliner-pipeline/db-rebuild-block-refs-fn @conn) cleared))]
        (is (= :logseq.property/empty-placeholder (:logseq.property/deadline cleared)))
        (is (nil? (outliner-pipeline/get-journal-day-from-long @conn :logseq.property/empty-placeholder))
            "empty-placeholder must not resolve to any journal page")
        (is (not (contains? rebuilt journal-id))
            "Clearing a past Deadline to empty-placeholder drops the journal ref")
        (is (not (contains? rebuilt-bulk journal-id))
            "Bulk rebuild also drops the past Deadline journal ref"))))

  (testing "Clearing a date property to empty-placeholder also drops the journal ref"
    (let [past-day 20260923
          conn (db-test/create-conn-with-blocks
                {:properties {:due {:logseq.property/type :date}}
                 :pages-and-blocks
                 [{:page {:build/journal past-day}}
                  {:page {:block/title "today"}
                   :blocks [{:block/title "dated"
                             :build/properties {:due [:build/page {:build/journal past-day}]}}]}]})
          block (db-test/find-block-by-content @conn "dated")
          journal-id (:db/id (db-test/find-journal-by-journal-day @conn past-day))
          due-ident (->> (keys (:block/properties block))
                         (some (fn [k]
                                 (when (= "due" (name k)) k))))]
      (is (some? due-ident))
      (is (contains? (set (outliner-pipeline/db-rebuild-block-refs @conn block)) journal-id))
      (outliner-property/set-block-property! conn [:block/uuid (:block/uuid block)]
                                             due-ident
                                             :logseq.property/empty-placeholder)
      (is (not (contains? (set (outliner-pipeline/db-rebuild-block-refs @conn (d/entity @conn (:db/id block))))
                          journal-id))))))
