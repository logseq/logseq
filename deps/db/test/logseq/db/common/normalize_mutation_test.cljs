(ns logseq.db.common.normalize-mutation-test
  "Tests for logseq.db.common.normalize found by mutation testing"
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db.common.normalize :as db-normalize]
            [logseq.db.test.helper :as db-test]))

(defn- conn-with-page-and-blocks
  "A conn with a page and 2 blocks on it; the 2nd block refs the 1st."
  [page-uuid block-uuid ref-uuid]
  (let [conn (db-test/create-conn)]
    (d/transact! conn [{:block/uuid page-uuid
                        :block/name "page"
                        :block/title "page"}
                       {:block/uuid block-uuid
                        :block/title "block"
                        :block/page [:block/uuid page-uuid]
                        :block/parent [:block/uuid page-uuid]
                        :block/order "a0"}])
    (d/transact! conn [{:block/uuid ref-uuid
                        :block/title "ref"
                        :block/page [:block/uuid page-uuid]
                        :block/parent [:block/uuid page-uuid]
                        :block/order "a1"
                        :block/refs [[:block/uuid block-uuid]]}])
    conn))

(defn- normalize-report
  [{:keys [db-after db-before tx-data]}]
  (vec (db-normalize/normalize-tx-data db-after db-before tx-data)))

(deftest normalize-tx-data-drops-ref-retracts-of-a-deleted-block-test
  (let [page-uuid (random-uuid)
        block-uuid (random-uuid)
        ref-uuid (random-uuid)
        conn (conn-with-page-and-blocks page-uuid block-uuid ref-uuid)
        normalized (normalize-report
                    (d/with @conn [[:db/retractEntity [:block/uuid block-uuid]]]))]
    (is (some #(= [:db/retractEntity [:block/uuid block-uuid]] %) normalized))
    (is (not-any? #(and (= 5 (count %)) (= [:block/uuid block-uuid] (nth % 3))) normalized)
        "the retractEntity covers the ref to the deleted block: no separate datom for it")))

(deftest remove-conflict-datoms-keeps-the-last-datom-of-an-eavt-test
  (let [added (d/datom 1 :block/title "x" 5 true)
        retracted (d/datom 1 :block/title "x" 5 false)]
    ;; datascript's datom = ignores :added, so compare it explicitly
    (is (= [false] (mapv :added (db-normalize/remove-conflict-datoms [added retracted]))))
    (is (= [true] (mapv :added (db-normalize/remove-conflict-datoms [retracted added]))))))

(deftest normalize-tx-data-add-then-retract-of-a-title-in-one-tx-test
  (let [page-uuid (random-uuid)
        block-uuid (random-uuid)
        ref-uuid (random-uuid)
        conn (conn-with-page-and-blocks page-uuid block-uuid ref-uuid)
        normalized (normalize-report
                    (d/with @conn [[:db/add [:block/uuid block-uuid] :block/title "new"]
                                   [:db/retract [:block/uuid block-uuid] :block/title "new"]]))]
    (is (not-any? #(and (= :db/add (first %)) (= "new" (nth % 3))) normalized)
        "the title added and retracted in one tx is not added on the other side")))

(deftest reorder-retract-entity-on-rebase-4-tuples-test
  ;; normalize-tx-data-for-rebase (frontend.worker.sync.apply-txs) drops the t
  ;; of each 5-tuple before calling reorder-retract-entity
  (let [recreated-uuid (random-uuid)
        other-uuid (random-uuid)
        other-datom [:db/add [:block/uuid other-uuid] :block/title "other"]
        retract [:db/retractEntity [:block/uuid recreated-uuid]]
        uuid-add [:db/add (str recreated-uuid) :block/uuid recreated-uuid]
        title-add [:db/add (str recreated-uuid) :block/title "recreated"]]
    (is (= [retract uuid-add title-add other-datom]
           (vec (db-normalize/reorder-retract-entity [other-datom retract uuid-add title-add])))
        "the recreated block's retract comes first, then the recreated block's datoms")))

(deftest reorder-retract-entity-moves-tempid-datoms-of-a-retracted-block-test
  (let [deleted-uuid (random-uuid)
        other-uuid (random-uuid)
        other-datom [:db/add [:block/uuid other-uuid] :block/title "other" 1]
        tempid-datom [:db/add (str deleted-uuid) :block/title "deleted" 1]
        retract [:db/retractEntity [:block/uuid deleted-uuid]]]
    (is (= [tempid-datom other-datom retract]
           (vec (db-normalize/reorder-retract-entity [other-datom tempid-datom retract]))))))

(deftest normalize-tx-data-resolves-ref-value-of-a-property-deleted-in-the-tx-test
  (let [page-uuid (random-uuid)
        block-uuid (random-uuid)
        ref-uuid (random-uuid)
        conn (conn-with-page-and-blocks page-uuid block-uuid ref-uuid)
        _ (d/transact! conn [{:db/ident :user.property/p
                              :block/uuid (random-uuid)
                              :db/valueType :db.type/ref
                              :db/cardinality :db.cardinality/one}])
        page-eid (:db/id (d/entity @conn [:block/uuid page-uuid]))
        _ (d/transact! conn [[:db/add [:block/uuid block-uuid] :user.property/p page-eid]])
        normalized (normalize-report
                    (d/with @conn [[:db/retract [:block/uuid block-uuid] :user.property/p page-eid]
                                   [:db/retractEntity :user.property/p]]))
        p-datoms (filter #(= :user.property/p (nth % 2 nil)) normalized)]
    (is (seq p-datoms))
    (is (every? #(= [:block/uuid page-uuid] (nth % 3)) p-datoms)
        "a ref value is sent as a lookup, not as a local eid")))

(deftest normalize-datom-drops-datom-of-entity-without-uuid-or-ident-test
  (let [conn (db-test/create-conn)
        e (get-in (d/transact! conn [{:db/id -1 :block/title "no id"}]) [:tempids -1])
        report (d/with @conn [[:db/add e :block/title "still no id"]])]
    (is (some? e))
    (is (nil? (db-normalize/normalize-datom (:db-after report) (:db-before report)
                                            [e :block/title "still no id" (:max-tx (:db-after report)) true])))
    (is (= [] (normalize-report report)))))
