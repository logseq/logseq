(ns frontend.worker.pipeline-repeat-refs-test
  "The refs of a repeating task after the repeat command reschedules it"
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.pipeline :as worker-pipeline]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.op :as outliner-op]))

(defn- with-transact-pipeline
  [f]
  (ldb/register-transact-pipeline-fn! worker-pipeline/transact-pipeline)
  (try
    (f)
    (finally
      (ldb/register-transact-pipeline-fn! identity))))

(defn- ref-journal-days
  [conn block-uuid]
  (set (keep :block/journal-day (:block/refs (d/entity @conn [:block/uuid block-uuid])))))

(defn- set-property-op
  [block-uuid property value]
  [:batch-set-property [[block-uuid] property value {}]])

(defn- upsert-task-status-ops
  "The ops of `logseq upsert task --id <id> --status <status>`: the Task tag
  and the status in one batch."
  [conn block-uuid status]
  [(set-property-op block-uuid :block/tags (:db/id (d/entity @conn :logseq.class/Task)))
   (set-property-op block-uuid :logseq.property/status status)])

(deftest completing-a-repeating-task-moves-its-journal-ref-to-the-new-scheduled-day-test
  (let [scheduled-ms (tc/to-long (t/local-date-time 2026 11 8 0 0 0))
        old-day 20261108
        next-day 20261115
        conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "Home"}
                 :blocks [{:block/title "weekly chore"}]}
                {:page {:build/journal old-day}}]})
        block-uuid (:block/uuid (db-test/find-block-by-content @conn "weekly chore"))
        entity-id #(:db/id (d/entity @conn %))]
    (with-transact-pipeline
      (fn []
        (outliner-op/apply-ops! conn (upsert-task-status-ops conn block-uuid :logseq.property/status.todo) {})
        ;; One property per call, as `upsert block --update-properties` sends it
        (doseq [op [(set-property-op block-uuid :logseq.property/scheduled scheduled-ms)
                    (set-property-op block-uuid :logseq.property.repeat/repeated? true)
                    (set-property-op block-uuid :logseq.property.repeat/recur-frequency 1)
                    (set-property-op block-uuid :logseq.property.repeat/recur-unit
                                     (entity-id :logseq.property.repeat/recur-unit.week))
                    (set-property-op block-uuid :logseq.property.repeat/repeat-type
                                     (entity-id :logseq.property.repeat/repeat-type.plus))
                    (set-property-op block-uuid :logseq.property.repeat/temporal-property
                                     (entity-id :logseq.property/scheduled))]]
          (outliner-op/apply-ops! conn [op] {}))
        (is (= #{old-day} (ref-journal-days conn block-uuid))
            "setting Scheduled refs its journal page")
        (testing "completing the task"
          (with-redefs [t/now (fn [] (t/local-date-time 2026 11 8 12 0 0))]
            (outliner-op/apply-ops! conn (upsert-task-status-ops conn block-uuid :logseq.property/status.done) {}))
          (let [block (d/entity @conn [:block/uuid block-uuid])]
            (is (= next-day (date-time-util/ms->journal-day (:logseq.property/scheduled block)))
                "the repeat command moves Scheduled a week on")
            (is (= :logseq.property/status.todo (:db/ident (:logseq.property/status block)))
                "the repeat command resets the status")
            (is (= #{next-day} (ref-journal-days conn block-uuid))
                "the refs hold the journal of the new Scheduled day, not the old one")))))))
