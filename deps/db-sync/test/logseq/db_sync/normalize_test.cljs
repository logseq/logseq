(ns logseq.db-sync.normalize-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db.common.normalize :as db-normalize]
            [logseq.db.test.helper :as db-test]))

(defn- new-conn []
  (db-test/create-conn))

(defn- create-page!
  [conn title]
  (let [page-uuid (random-uuid)]
    (d/transact! conn [{:block/uuid page-uuid
                        :block/name title
                        :block/title title}])
    page-uuid))

(defn- op-e-a-v
  [datom]
  (subvec (vec datom) 0 4))

(deftest normalize-tx-data-keeps-title-retract-without-replacement-test
  (let [conn (new-conn)
        page-uuid (create-page! conn "Page")
        tx-report (d/transact! conn [[:db/retract [:block/uuid page-uuid] :block/title "Page"]])
        normalized (db-normalize/normalize-tx-data (:db-after tx-report)
                                                   (:db-before tx-report)
                                                   (:tx-data tx-report))
        tx-data (mapv op-e-a-v normalized)]
    (testing "keeps :block/title retract when no replacement title exists in same tx"
      (is (= [[:db/retract [:block/uuid page-uuid] :block/title "Page"]]
             tx-data)))))

(deftest normalize-tx-data-drops-title-retract-when-replaced-test
  (let [conn (new-conn)
        page-uuid (create-page! conn "Page")
        tx-report (d/transact! conn [{:block/uuid page-uuid
                                      :block/title "Page 2"}])
        normalized (db-normalize/normalize-tx-data (:db-after tx-report)
                                                   (:db-before tx-report)
                                                   (:tx-data tx-report))
        tx-data (mapv op-e-a-v normalized)]
    (testing "drops old :block/title retract and keeps new add during title update"
      (is (some #(= [:db/add [:block/uuid page-uuid] :block/title "Page 2"] %) tx-data))
      (is (not-any? #(= [:db/retract [:block/uuid page-uuid] :block/title "Page"] %) tx-data)))))
