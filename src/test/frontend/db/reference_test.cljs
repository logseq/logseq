(ns frontend.db.reference-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.common.reference :as db-reference]
            [shadow.resource :as rc]))

(def test-transit (rc/inline "fixtures/references.transit"))
;; (use-fixtures :each test-helper/db-based-start-and-destroy-db)

(defn- create-conn!
  []
  (let [db (ldb/read-transit-str test-transit)]
    (d/conn-from-db db)))

;; FIXME: EDN import doesn't work
(comment
  (def test-page-blocks
    {:pages-and-blocks
     [{:page
       {:build/journal 20250611},
       :blocks
       [{:block/title "[[68485f78-1e70-4173-a569-1ebcb2ba69e6]] 1",
         :build/children
         [{:block/title "[[68485f7a-d9c1-495a-a364-e7aae6ab0147]] 1",
           :build/children
           [{:block/title "test",
             :build/children
             [{:block/title "[[68485f7f-3de9-46d3-a1e5-50a7d052066e]] 1"}]}
            {:block/title "another test",
             :build/children
             [{:block/title "[[68485f7f-3de9-46d3-a1e5-50a7d052066e]] 2"}]}]}
          {:block/title "[[68485f7f-3de9-46d3-a1e5-50a7d052066e]] 3"}]}
        {:block/title "[[68485f78-1e70-4173-a569-1ebcb2ba69e6]] 2",
         :build/children
         [{:block/title "[[68485f7f-3de9-46d3-a1e5-50a7d052066e]] 4",
           :build/children
           [{:block/title "[[68485f7a-d9c1-495a-a364-e7aae6ab0147]] 1"}]}]}]}
      {:page
       {:block/title "bar",
        :block/uuid #uuid "68485f7a-d9c1-495a-a364-e7aae6ab0147",
        :build/keep-uuid? true}}
      {:page
       {:block/title "baz",
        :block/uuid #uuid "68485f7f-3de9-46d3-a1e5-50a7d052066e",
        :build/keep-uuid? true}}
      {:page
       {:block/title "foo",
        :block/uuid #uuid "68485f78-1e70-4173-a569-1ebcb2ba69e6",
        :build/keep-uuid? true}}],
     :logseq.db.sqlite.export/export-type :page}))

(comment
  (defn- import-edn!
    [conn data]
    (let [{:keys [init-tx block-props-tx misc-tx error] :as _txs} (sqlite-export/build-import data @conn {})]
      (when error
        (throw (ex-info "Build import failed" {:data test-page-blocks})))
      (d/transact! conn init-tx)
      (when (seq block-props-tx)
        (d/transact! conn block-props-tx))
      (when (seq misc-tx)
        (d/transact! conn misc-tx)))))

(defn- retract-filters!
  [conn foo-id]
  (d/transact! conn [[:db/retract foo-id :logseq.property.linked-references/includes]
                     [:db/retract foo-id :logseq.property.linked-references/excludes]]))

(deftest ^:large-vars/cleanup-todo get-linked-references
  (let [conn (create-conn!)
        foo-id (:db/id (ldb/get-page @conn "foo"))
        _ (retract-filters! conn foo-id)
        db @conn
        [foo bar baz] (map #(ldb/get-page @conn %) ["foo" "bar" "baz"])]

    (testing "Linked references without filters"
      (let [{:keys [ref-pages-count ref-blocks ref-matched-children-ids]} (db-reference/get-linked-references db (:db/id foo))]
        (is (= [["baz" 4] ["Journal" 2] ["Jun 11th, 2025" 2] ["bar" 2]] (vec ref-pages-count))
            "ref-pages-count check failed")
        (is (empty? ref-matched-children-ids)
            "ref-matched-children-ids check failed")
        (is (= #{"[[foo]] 1" "[[foo]] 2"} (set (map :block/title ref-blocks)))
            "ref-blocks check failed")))

    (testing "Linked references include \"bar\""
      (d/transact! conn
                   [{:db/id (:db/id foo)
                     :logseq.property.linked-references/includes (:db/id bar)}])
      (let [{:keys [ref-pages-count ref-blocks ref-matched-children-ids]} (db-reference/get-linked-references @conn (:db/id foo))]
        (is (= [["baz" 3] ["Journal" 2] ["Jun 11th, 2025" 2] ["bar" 2]] (vec ref-pages-count))
            "ref-pages-count check failed")
        (is (= 7 (count ref-matched-children-ids))
            "ref-matched-children-ids check failed")
        (is (= #{"[[foo]] 1" "[[foo]] 2"} (set (map :block/title ref-blocks)))
            "ref-blocks check failed")))

    (testing "Linked references include \"bar\" and \"baz\""
      (d/transact! conn
                   [{:db/id (:db/id foo)
                     :logseq.property.linked-references/includes (:db/id baz)}])
      (let [{:keys [ref-pages-count ref-blocks ref-matched-children-ids]} (db-reference/get-linked-references @conn (:db/id foo))]
        (is (= [["baz" 3] ["Journal" 2] ["Jun 11th, 2025" 2] ["bar" 2]] (vec ref-pages-count))
            "ref-pages-count check failed")
        (is (= 7 (count ref-matched-children-ids))
            "ref-matched-children-ids check failed")
        (is (= #{"[[foo]] 1" "[[foo]] 2"} (set (map :block/title ref-blocks)))
            "ref-blocks check failed")))

    (testing "Linked references exclude \"bar\""
      (retract-filters! conn foo-id)
      (d/transact! conn
                   [{:db/id (:db/id foo)
                     :logseq.property.linked-references/excludes (:db/id bar)}])
      (let [{:keys [ref-pages-count ref-blocks ref-matched-children-ids]} (db-reference/get-linked-references @conn (:db/id foo))]
        (is (= [["Journal" 2] ["Jun 11th, 2025" 2] ["baz" 2]] (vec ref-pages-count))
            "ref-pages-count check failed")
        (is (= 2 (count ref-matched-children-ids))
            "ref-matched-children-ids check failed")
        (is (= #{"[[foo]] 1" "[[foo]] 2"} (set (map :block/title ref-blocks)))
            "ref-blocks check failed")))

    (testing "Linked references exclude \"baz\""
      (retract-filters! conn foo-id)
      (d/transact! conn
                   [{:db/id (:db/id foo)
                     :logseq.property.linked-references/excludes (:db/id baz)}])
      (let [{:keys [ref-pages-count ref-blocks ref-matched-children-ids]} (db-reference/get-linked-references @conn (:db/id foo))]
        (is (= [["Journal" 2] ["Jun 11th, 2025" 2] ["bar" 1]] (vec ref-pages-count))
            "ref-pages-count check failed")
        (is (= 3 (count ref-matched-children-ids))
            "ref-matched-children-ids check failed")
        (is (= #{"[[foo]] 1" "[[foo]] 2"} (set (map :block/title ref-blocks)))
            "ref-blocks check failed")))

    (testing "Linked references exclude both \"baz\" and \"bar\""
      (retract-filters! conn foo-id)
      (d/transact! conn
                   [{:db/id (:db/id foo)
                     :logseq.property.linked-references/excludes #{(:db/id baz) (:db/id bar)}}])
      (let [{:keys [ref-pages-count ref-blocks ref-matched-children-ids]} (db-reference/get-linked-references @conn (:db/id foo))]
        (is (= [["Journal" 2] ["Jun 11th, 2025" 2]] (vec ref-pages-count))
            "ref-pages-count check failed")
        (is (zero? (count ref-matched-children-ids))
            "ref-matched-children-ids check failed")
        (is (= #{"[[foo]] 1" "[[foo]] 2"} (set (map :block/title ref-blocks)))
            "ref-blocks check failed")))

    (testing "Linked references includes \"bar\" and excludes \"baz\""
      (retract-filters! conn foo-id)
      (d/transact! conn
                   [{:db/id (:db/id foo)
                     :logseq.property.linked-references/includes (:db/id bar)
                     :logseq.property.linked-references/excludes (:db/id baz)}])
      (let [{:keys [ref-pages-count ref-blocks ref-matched-children-ids]} (db-reference/get-linked-references @conn (:db/id foo))]
        (is (= [["Journal" 1] ["Jun 11th, 2025" 1] ["bar" 1]] (vec ref-pages-count))
            "ref-pages-count check failed")
        (is (= 3 (count ref-matched-children-ids))
            "ref-matched-children-ids check failed")
        (is (= #{"[[foo]] 1"} (set (map :block/title ref-blocks)))
            "ref-blocks check failed")))

    (testing "Linked references includes \"baz\" and excludes \"bar\""
      (retract-filters! conn foo-id)
      (d/transact! conn
                   [{:db/id (:db/id foo)
                     :logseq.property.linked-references/includes (:db/id baz)
                     :logseq.property.linked-references/excludes (:db/id bar)}])
      (let [{:keys [ref-pages-count ref-blocks ref-matched-children-ids]} (db-reference/get-linked-references @conn (:db/id foo))]
        (is (= [["Journal" 2] ["Jun 11th, 2025" 2] ["baz" 2]] (vec ref-pages-count))
            "ref-pages-count check failed")
        (is (= 2 (count ref-matched-children-ids))
            "ref-matched-children-ids check failed")
        (is (= #{"[[foo]] 1" "[[foo]] 2"} (set (map :block/title ref-blocks)))
            "ref-blocks check failed")))))

(deftest get-unlinked-references
  (let [conn (create-conn!)
        db @conn
        ids (map #(:db/id (ldb/get-page @conn %)) ["foo" "bar" "baz"])]
    (is (= [3 2 3]
           (mapv #(count (db-reference/get-unlinked-references db %)) ids)))))
