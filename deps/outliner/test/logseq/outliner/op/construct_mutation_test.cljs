(ns logseq.outliner.op.construct-mutation-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.op.construct :as op-construct]))

(defn- conn-with-blocks-a-b
  []
  (db-test/create-conn-with-blocks
   {:pages-and-blocks
    [{:page {:block/title "page"}
      :blocks [{:block/title "a"} {:block/title "b"}]}]}))

(defn- forward-ops
  [db tx-data outliner-ops]
  (:forward-outliner-ops
   (op-construct/derive-history-outliner-ops db db tx-data {:outliner-ops outliner-ops})))

(deftest derive-history-outliner-ops-resolves-block-maps-to-uuids-test
  (testing "a block id given as a map with only :block/uuid or only :db/id becomes the block's uuid"
    (let [conn (conn-with-blocks-a-b)
          a (db-test/find-block-by-content @conn "a")
          b (db-test/find-block-by-content @conn "b")]
      (is (= [[:move-blocks-up-down [[(:block/uuid a) (:block/uuid b)] true]]]
             (forward-ops @conn []
                          [[:move-blocks-up-down [[{:block/uuid (:block/uuid a)}
                                                   {:db/id (:db/id b)}]
                                                  true]]]))))))

(deftest derive-history-outliner-ops-save-block-marks-refs-created-in-tx-test
  (let [conn (conn-with-blocks-a-b)
        a (db-test/find-block-by-content @conn "a")
        created-uuid (random-uuid)
        save-op (fn [refs]
                  [[:save-block [{:block/uuid (:block/uuid a)
                                  :block/title "a"
                                  :block/refs refs}
                                 {}]]])]
    (testing "a ref to a block whose uuid the tx adds ([:db/add e :block/uuid v]) is kept as a created ref"
      (is (= [created-uuid]
             (get-in (forward-ops @conn
                                  [[:db/add -1 :block/uuid created-uuid]]
                                  (save-op [{:block/uuid created-uuid :block/title "New"}]))
                     [0 1 0 op-construct/rebase-created-refs-key]))))
    (testing "without created refs the block has no created-refs key"
      (is (not (contains? (get-in (forward-ops @conn
                                               []
                                               (save-op [{:block/uuid (:block/uuid a) :block/title "a"}]))
                                  [0 1 0])
                          op-construct/rebase-created-refs-key))))))

(deftest rewrite-block-title-with-retracted-refs-restores-missing-ref-test
  (testing "a ref missing from the db is put back as a page with its title, and the title shows its name"
    (let [conn (conn-with-blocks-a-b)
          gone-uuid (random-uuid)
          block {:block/uuid (random-uuid)
                 :block/title (str "see [[" gone-uuid "]]")
                 :block/refs [[:block/uuid gone-uuid]]
                 op-construct/rebase-refs-key [{:block/uuid gone-uuid :block/title "Gone"}]}
          result (op-construct/rewrite-block-title-with-retracted-refs @conn block)]
      (is (= "see Gone" (:block/title result)))
      (is (= [["Gone" gone-uuid]]
             (map (juxt :block/title :block/uuid) (:block/refs result))))
      (is (not (contains? result op-construct/rebase-refs-key))))))

(deftest derive-history-outliner-ops-create-page-finds-created-uuid-in-tx-data-test
  (testing "from entity maps: the map with the page's title"
    (let [conn (conn-with-blocks-a-b)
          other-uuid (random-uuid)
          page-uuid (random-uuid)]
      (is (= page-uuid
             (get-in (forward-ops @conn
                                  [{:block/uuid other-uuid :block/title "Other"}
                                   {:block/uuid page-uuid :block/title "New"}]
                                  [[:create-page ["New" {}]]])
                     [0 1 1 :uuid])))))
  (testing "from datoms: the entity that adds the page's title, whatever the datom order"
    (let [conn (conn-with-blocks-a-b)
          other-uuid (random-uuid)
          page-uuid (random-uuid)]
      (is (= page-uuid
             (get-in (forward-ops @conn
                                  [{:e 1 :a :block/title :v "Other" :added true}
                                   {:e 1 :a :block/uuid :v other-uuid :added true}
                                   {:e 2 :a :block/uuid :v page-uuid :added true}
                                   {:e 2 :a :block/title :v "New" :added true}]
                                  [[:create-page ["New" {}]]])
                     [0 1 1 :uuid]))))))

(deftest derive-history-outliner-ops-delete-blocks-takes-ids-retracted-in-tx-data-test
  (let [conn (conn-with-blocks-a-b)
        a (db-test/find-block-by-content @conn "a")
        b (db-test/find-block-by-content @conn "b")]
    (testing "from a [:db/retractEntity id] vector"
      (is (= [[:delete-blocks [[(:block/uuid a)] {}]]]
             (forward-ops @conn
                          [[:db/retractEntity (:db/id a)]]
                          [[:delete-blocks [[(:db/id b)] {}]]]))))
    (testing "from datom maps: only the entities whose :block/uuid is retracted"
      (is (= [[:delete-blocks [[(:block/uuid a)] {}]]]
             (forward-ops @conn
                          [{:e (:db/id a) :a :block/uuid :v (:block/uuid a) :added false}
                           {:e (:db/id b) :a :block/title :v "b" :added false}]
                          [[:delete-blocks [[(:db/id a)] {}]]]))))))
