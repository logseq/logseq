(ns frontend.worker.pipeline-mutation-test
  "Tests for frontend.worker.pipeline found by mutation testing"
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.pipeline :as worker-pipeline]
            [frontend.worker.state :as worker-state]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.common.uuid :as common-uuid]
            [logseq.db :as ldb]
            [logseq.db.common.order :as db-order]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.page :as outliner-page]))

(defn- run-pipeline
  "Transacts tx-data on db without a conn and runs the pipeline on the report."
  [db tx-data tx-meta]
  (worker-pipeline/transact-pipeline (d/with db tx-data tx-meta)))

(defn- db-after-pipeline
  [db tx-data tx-meta]
  (:db-after (run-pipeline db tx-data tx-meta)))

(defn- tag-idents
  [db id]
  (set (map :db/ident (:block/tags (d/entity db id)))))

(defn- tag-ids
  [db id]
  (set (map :db/id (:block/tags (d/entity db id)))))

(defn- ref-ids
  [db id]
  (set (map :db/id (:block/refs (d/entity db id)))))

(defn- revision
  [db id]
  (:block/tx-id (d/entity db id)))

(defn- new-block
  [page-id title]
  {:block/uuid (random-uuid)
   :block/title title
   :block/parent page-id
   :block/page page-id
   :block/order (db-order/gen-key)
   :block/created-at 1
   :block/updated-at 1})

;; Fails if, in `refs-need-recalculated?`, `or` becomes `and`.
;; Fails if, in `rebuild-block-refs`, `and` becomes `or`.
;; Fails if, in `transact-pipeline`, `and` becomes `or`.
(deftest refs-are-rebuilt-only-for-outliner-ops-that-change-content-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "b1"}]}
               {:page {:block/title "other"}}])
        b1 (:db/id (db-test/find-block-by-content @conn "b1"))
        other (:db/id (ldb/get-page @conn "other"))
        _ (d/transact! conn [[:db/add b1 :block/refs other]])
        db @conn]
    (testing "a save-block op rebuilds refs from the content, dropping a stale ref"
      (is (not (contains? (ref-ids (db-after-pipeline db [[:db/add b1 :block/title "b1 saved"]]
                                                      {:outliner-op :save-block})
                                   b1)
                          other))))
    (testing "a collapse op keeps refs as they are"
      (is (contains? (ref-ids (db-after-pipeline db [[:db/add b1 :block/collapsed? true]]
                                                 {:outliner-op :collapse-expand-blocks})
                              b1)
                     other)))
    (testing "a transaction without an outliner op keeps refs as they are"
      (is (contains? (ref-ids (db-after-pipeline db [[:db/add b1 :block/title "b1 plain"]] {}) b1)
                     other)))))

(defn- create-tag-template-conn
  "A conn with class Foo whose template has the children \"one\" and \"two\"."
  []
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "page1"}
                 :blocks [{:block/title "target"}]}
                {:page {:block/title "Templates"}
                 :blocks [{:block/title "foo template"
                           :build/children [{:block/title "one"}
                                            {:block/title "two"}]}]}]
               :classes {:Foo {}}})
        template (db-test/find-block-by-content @conn "foo template")
        foo (ldb/get-page @conn "Foo")]
    (d/transact! conn [[:db/add (:db/id template) :logseq.property/template-applied-to (:db/id foo)]])
    conn))

(defn- children-of
  [db id]
  (ldb/sort-by-order (:block/_parent (d/entity db id))))

;; Fails if, in `insert-tag-templates`, `and` becomes `or`, `=` becomes `not=` or `first` becomes `last`.
(deftest tag-template-inserts-fresh-copies-of-all-children-in-order-test
  (let [conn (create-tag-template-conn)
        target (:db/id (db-test/find-block-by-content @conn "target"))
        template (:db/id (db-test/find-block-by-content @conn "foo template"))
        foo (:db/id (ldb/get-page @conn "Foo"))
        template-child-uuids (set (map :block/uuid (children-of @conn template)))
        db' (db-after-pipeline @conn [[:db/add target :block/tags foo]] {})
        inserted (children-of db' target)]
    (is (= ["one" "two"] (map :block/title inserted)))
    (is (= [template nil] (map #(:db/id (:logseq.property/used-template %)) inserted))
        "Only the first inserted block records the template it came from")
    (is (empty? (filter template-child-uuids (map :block/uuid inserted)))
        "A non-journal tag template is inserted with fresh uuids")
    (is (= ["one" "two"] (map :block/title (children-of db' template)))
        "The template keeps its own children")))

;; Fails if, in `compute-extra-tx-data`, `or` becomes `and`.
(deftest undo-tag-addition-does-not-insert-the-tag-template-test
  (let [conn (create-tag-template-conn)
        target (:db/id (db-test/find-block-by-content @conn "target"))
        foo (:db/id (ldb/get-page @conn "Foo"))
        db' (db-after-pipeline @conn [[:db/add target :block/tags foo]] {:undo? true})]
    (is (contains? (tag-ids db' target) foo))
    (is (empty? (children-of db' target)))))

;; Fails if, in `insert-tag-templates`, `when` becomes `when-not`, `and` becomes `or` or `=` becomes `not=`.
(deftest journal-template-blocks-get-uuids-derived-from-the-new-journal-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "page1"}
                 :blocks [{:block/title "touched"}]}
                {:page {:block/title "Templates"}
                 :blocks [{:block/title "journal template"
                           :build/children [{:block/title "journal body"}]}]}]})
        touched (:db/id (db-test/find-block-by-content @conn "touched"))
        template (db-test/find-block-by-content @conn "journal template")
        body (first (children-of @conn (:db/id template)))
        _ (d/transact! conn [[:db/add (:db/id template) :logseq.property/template-applied-to :logseq.class/Journal]])
        journal-day 20300101
        title (date-time-util/int->journal-title
               journal-day
               (:logseq.property.journal/title-format (d/entity @conn :logseq.class/Journal)))
        page-tx (:tx-data (outliner-page/create @conn title {:journal? true}))
        ;; another entity's datom comes first in the transaction
        db' (db-after-pipeline @conn (cons [:db/add touched :block/title "touched again"] page-tx) {})
        journal (db-test/find-journal-by-journal-day db' journal-day)
        inserted (first (children-of db' (:db/id journal)))]
    (is (some? journal))
    (is (= "journal body" (:block/title inserted)))
    (is (= (common-uuid/gen-journal-template-block (:block/uuid journal) (:block/uuid body))
           (:block/uuid inserted)))))

;; Fails if, in `fix-page-tags`, `=` becomes `not=`, `and` becomes `or` or `seq` becomes `empty?`.
(deftest fix-page-tags-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "page1"}}
                                  {:page {:build/journal 20300102}}]
               :classes {:Foo {}}})
        page1 (:db/id (ldb/get-page @conn "page1"))
        journal (:db/id (db-test/find-journal-by-journal-day @conn 20300102))
        foo (:db/id (ldb/get-page @conn "Foo"))
        db @conn]
    (testing "#Page added to a journal is removed again"
      (is (= #{:logseq.class/Journal}
             (tag-idents (db-after-pipeline db [[:db/add journal :block/tags :logseq.class/Page]] {}) journal))))
    (testing "a user tag added to a page keeps its #Page"
      (is (= #{(d/entid db :logseq.class/Page) foo}
             (tag-ids (db-after-pipeline db [[:db/add page1 :block/tags foo]] {}) page1))))
    (testing "a new page created with #Page and a user tag keeps both"
      (let [page-uuid (random-uuid)
            db' (db-after-pipeline db [{:block/uuid page-uuid
                                        :block/title "newp"
                                        :block/name "newp"
                                        :block/tags [:logseq.class/Page foo]
                                        :block/created-at 1
                                        :block/updated-at 1}]
                                   {})]
        (is (= #{(d/entid db :logseq.class/Page) foo}
               (tag-ids db' (:db/id (d/entity db' [:block/uuid page-uuid])))))))))

;; Fails if, in `fix-inline-built-in-page-classes`, `when-not` becomes `when`, `=` becomes `not=` or `or` becomes `and`.
(deftest inline-built-in-page-class-is-removed-from-block-title-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "b1"}]}])
        b1 (:db/id (db-test/find-block-by-content @conn "b1"))
        tag-class (d/entity @conn :logseq.class/Tag)
        db' (db-after-pipeline @conn [{:db/id b1
                                       :block/title (str "x #" (page-ref/->page-ref (:block/uuid tag-class)))
                                       :block/tags [:logseq.class/Tag]}]
                               {})]
    (is (= "x" (:v (first (d/datoms db' :eavt b1 :block/title)))))
    (is (not (contains? (tag-idents db' b1) :logseq.class/Tag)))
    (testing "also when the block refs the class, so its display title names it"
      (let [db'' (db-after-pipeline @conn [{:db/id b1
                                            :block/title (str "y #" (page-ref/->page-ref (:block/uuid tag-class)))
                                            :block/tags [:logseq.class/Tag]
                                            :block/refs [:logseq.class/Tag]}]
                                    {})]
        (is (= "y" (:v (first (d/datoms db'' :eavt b1 :block/title)))))
        (is (not (contains? (tag-idents db'' b1) :logseq.class/Tag)))))))

;; Fails if, in `toggle-page-and-block`, `=` becomes `not=`, `and` becomes `or`, `when` becomes `when-not`, `not` becomes `identity` or `or` becomes `and`.
(deftest block-tagged-page-becomes-a-page-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "parent"
                          :build/children [{:block/title "child"}]}]}])
        parent (:db/id (db-test/find-block-by-content @conn "parent"))
        child (:db/id (db-test/find-block-by-content @conn "child"))
        sub-uuid (random-uuid)
        ;; a page whose parent is the converted block
        _ (d/transact! conn [{:block/uuid sub-uuid
                              :block/title "sub"
                              :block/name "sub"
                              :block/tags :logseq.class/Page
                              :block/parent parent
                              :block/created-at 1
                              :block/updated-at 1}])
        sub (:db/id (d/entity @conn [:block/uuid sub-uuid]))
        db' (db-after-pipeline @conn [[:db/add parent :block/tags :logseq.class/Page]] {})]
    (is (= "parent" (:block/name (d/entity db' parent))))
    (is (nil? (:block/page (d/entity db' parent))))
    (is (= parent (:db/id (:block/page (d/entity db' child))))
        "Descendant blocks point at the new page")
    (is (nil? (:block/page (d/entity db' sub)))
        "Descendant pages get no :block/page")))

;; Fails if, in `toggle-page-and-block`, `not` becomes `identity`.
(deftest block-moved-to-library-becomes-a-page-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "b1"}]}])
        b1 (:db/id (db-test/find-block-by-content @conn "b1"))
        library (:db/id (ldb/get-library-page @conn))
        db' (db-after-pipeline @conn [[:db/add b1 :block/parent library]
                                      [:db/add b1 :block/order (db-order/gen-key)]]
                               {})]
    (is (ldb/internal-page? (d/entity db' b1)))
    (is (= "b1" (:block/name (d/entity db' b1))))
    (is (nil? (:block/page (d/entity db' b1))))))

;; Fails if, in `toggle-page-and-block`, `and` becomes `or`, `nil?` becomes `some?` or `not` becomes `identity`.
(deftest class-page-tagged-page-does-not-move-its-parent-to-library-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "root"}}]
               :classes {:Foo {}}})
        root (:db/id (ldb/get-page @conn "root"))
        foo (:db/id (ldb/get-page @conn "Foo"))
        _ (d/transact! conn [[:db/add foo :block/parent root]])
        db' (db-after-pipeline @conn [[:db/add foo :block/tags :logseq.class/Page]] {})]
    (is (nil? (:block/parent (d/entity db' root))))))

;; Fails if, in `toggle-page-and-block`, `=` becomes `not=`, `and` becomes `or`, `or` becomes `and` or `not` becomes `identity`.
(deftest block-on-class-page-converted-to-page-drops-class-parent-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "page1"}}]
               :classes {:Foo {}}})
        foo (:db/id (ldb/get-page @conn "Foo"))
        block (new-block foo "on class")
        _ (d/transact! conn [block])
        id (:db/id (d/entity @conn [:block/uuid (:block/uuid block)]))
        db' (db-after-pipeline @conn [[:db/add id :block/tags :logseq.class/Page]] {})]
    (is (ldb/internal-page? (d/entity db' id)))
    (is (nil? (:block/parent (d/entity db' id))))))

;; Fails if, in `add-missing-properties-to-typed-display-blocks`, `=` becomes `not=`.
(deftest display-type-adds-its-class-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "b1"}]}])
        b1 (:db/id (db-test/find-block-by-content @conn "b1"))
        db' (db-after-pipeline @conn [[:db/add b1 :logseq.property.node/display-type :code]] {})]
    (is (contains? (tag-idents db' b1) :logseq.class/Code-block))))

;; Fails if, in `ensure-query-property-on-tag-additions`, `and` becomes `or`.
;; Fails if, in `ensure-comments-blocks-property-on-tag-additions`, `and` becomes `or`.
(deftest query-and-comments-properties-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "parent"
                          :build/children [{:block/title "q1"}
                                           {:block/title "q2"}
                                           {:block/title "c1"}
                                           {:block/title "c2"}
                                           {:block/title "c3"}]}
                         {:block/title "elsewhere"}]}])
        id (fn [title] (:db/id (db-test/find-block-by-content @conn title)))
        [parent q1 q2 c1 c2 c3 elsewhere] (map id ["parent" "q1" "q2" "c1" "c2" "c3" "elsewhere"])
        _ (d/transact! conn [[:db/add q2 :block/tags :logseq.class/Query]
                             [:db/add c3 :logseq.property.comments/blocks elsewhere]])
        db @conn
        comment-targets (fn [db' id] (set (map :db/id (:logseq.property.comments/blocks (d/entity db' id)))))]
    (testing "an undo that tags #Query adds no query property"
      (is (nil? (:logseq.property/query
                 (d/entity (db-after-pipeline db [[:db/add q1 :block/tags :logseq.class/Query]] {:undo? true}) q1)))))
    (testing "editing a #Query block that has no query property adds none"
      (is (nil? (:logseq.property/query
                 (d/entity (db-after-pipeline db [[:db/add q2 :block/title "q2 edited"]] {}) q2)))))
    (testing "an undo that tags #Comments sets no commented blocks"
      (is (empty? (comment-targets (db-after-pipeline db [[:db/add c1 :block/tags :logseq.class/Comments]] {:undo? true}) c1))))
    (testing "editing a block sets no commented blocks"
      (is (empty? (comment-targets (db-after-pipeline db [[:db/add c2 :block/title "c2 edited"]] {}) c2))))
    (testing "tagging #Comments keeps commented blocks already set"
      (is (= #{elsewhere}
             (comment-targets (db-after-pipeline db [[:db/add c3 :block/tags :logseq.class/Comments]] {}) c3))))
    (is (some? parent))))

(defn- fake-id-token
  [user-uuid]
  (let [payload (js/btoa (js/JSON.stringify (clj->js {:sub (str user-uuid)
                                                       "cognito:username" "alice"
                                                       :email "alice@example.com"})))]
    (str "header." payload ".signature")))

;; Fails if, in `add-created-by-ref-hook`, `when` becomes `when-not`, `and` becomes `or`, `not` becomes `identity`, `or` becomes `and` or `seq` becomes `empty?`.
(deftest created-by-ref-is-added-to-new-blocks-except-on-undo-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}}])
        page1 (:db/id (ldb/get-page @conn "page1"))
        user-uuid (random-uuid)
        db @conn
        created-by (fn [tx-meta]
                     (let [block (new-block page1 "new")
                           db' (db-after-pipeline db [block] tx-meta)]
                       (:block/uuid (:logseq.property/created-by-ref (d/entity db' [:block/uuid (:block/uuid block)])))))]
    (worker-state/set-new-state! {:auth/id-token (fake-id-token user-uuid)})
    (try
      (is (= user-uuid (created-by {})))
      (is (nil? (created-by {:undo? true})))
      (finally
        (worker-state/set-new-state! {:auth/id-token nil})))))

;; Fails if, in `revert-disallowed-changes`, `or` becomes `and`.
(deftest built-in-protected-attrs-are-reverted-except-in-fix-db-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}}])
        library (:db/id (ldb/get-library-page @conn))
        db @conn]
    (is (= "Library" (:block/title (d/entity (db-after-pipeline db [[:db/add library :block/title "Renamed"]] {}) library))))
    (is (= "Renamed" (:block/title (d/entity (db-after-pipeline db [[:db/add library :block/title "Renamed"]] {:fix-db? true}) library))))))

;; Fails if, in `compute-extra-tx-data`, `or` becomes `and`.
(deftest undo-of-task-done-does-not-reschedule-test
  (let [now (t/local-date-time 2026 9 20 12 0 0)
        scheduled-ms (tc/to-long now)
        conn (db-test/create-conn-with-blocks
              [{:page {:block/title "Inbox"}
                :blocks [{:block/title "repeating task"
                          :build/tags [:logseq.class/Task]
                          :build/properties
                          {:logseq.property/status :logseq.property/status.todo
                           :logseq.property/scheduled scheduled-ms
                           :logseq.property.repeat/repeated? true
                           :logseq.property.repeat/recur-frequency 6
                           :logseq.property.repeat/recur-unit :logseq.property.repeat/recur-unit.day}}]}])
        task (:db/id (db-test/find-block-by-content @conn "repeating task"))
        done-tx [[:db/add task :logseq.property/status :logseq.property/status.done]]
        scheduled (fn [tx-meta]
                    (with-redefs [t/now (fn [] now)]
                      (:logseq.property/scheduled (d/entity (db-after-pipeline @conn done-tx tx-meta) task))))]
    (is (not= scheduled-ms (scheduled {})) "precondition: done reschedules a repeating task")
    (is (= scheduled-ms (scheduled {:undo? true})))))

;; Fails if, in `reference-attrs`, `false` becomes `true`.
(deftest reference-attrs-follow-public-and-private-ref-properties-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "owner"}
                         {:block/title "target"}
                         {:block/title "query owner"}]}])
        id (fn [title] (:db/id (db-test/find-block-by-content @conn title)))
        [owner target query-owner] (map id ["owner" "target" "query owner"])
        query-value-uuid (random-uuid)
        _ (d/transact! conn [[:db/add owner :logseq.property.comments/blocks target]
                             {:block/uuid query-value-uuid :block/title "q" :block/created-at 1 :block/updated-at 1}])
        query-value (:db/id (d/entity @conn [:block/uuid query-value-uuid]))
        _ (d/transact! conn [[:db/add query-owner :logseq.property/query query-value]
                             [:db/add owner :block/tx-id 10]
                             [:db/add query-owner :block/tx-id 10]])
        db @conn]
    (is (false? (:logseq.property/public? (d/entity db :logseq.property.comments/blocks))) "precondition")
    (is (true? (:logseq.property/public? (d/entity db :logseq.property/query))) "precondition")
    (is (= 10 (revision (db-after-pipeline db [[:db/add target :block/title "target edited"]] {}) owner))
        "A private ref property is not a projected reference")
    (is (not= 10 (revision (db-after-pipeline db [[:db/add query-value :block/title "q edited"]] {}) query-owner))
        "A public ref property is a projected reference")))

;; Fails if, in `projected-reference-owner-ids`, `when-not` becomes `when`.
(deftest new-ref-property-is-a-reference-attr-in-later-transactions-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "owner"}
                         {:block/title "target"}]}])
        id (fn [title] (:db/id (db-test/find-block-by-content @conn title)))
        [owner target] (map id ["owner" "target"])
        db0 (db-after-pipeline @conn [[:db/add owner :block/title "owner warm"]] {})
        db1 (db-after-pipeline db0 [{:db/ident :user.property/link
                                     :block/uuid (random-uuid)
                                     :block/title "link"
                                     :block/name "link"
                                     :block/tags :logseq.class/Property
                                     :logseq.property/type :node
                                     :db/valueType :db.type/ref
                                     :db/cardinality :db.cardinality/one
                                     :block/created-at 1
                                     :block/updated-at 1}]
                               {})
        db2 (db-after-pipeline db1 [[:db/add owner :user.property/link target]] {})
        db3 (db-after-pipeline db2 [[:db/add target :block/title "target edited"]] {})]
    (is (not= (revision db2 owner) (revision db3 owner)))))

;; Fails if, in `invoke-hooks-default`, `when` becomes `when-not`.
(deftest invoke-hooks-lists-only-deleted-assets-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "plain"}]}])
        page1 (:db/id (ldb/get-page @conn "page1"))
        asset (assoc (new-block page1 "picture") :logseq.property.asset/type "png")
        _ (d/transact! conn [asset])
        asset-id (:db/id (d/entity @conn [:block/uuid (:block/uuid asset)]))
        plain-id (:db/id (db-test/find-block-by-content @conn "plain"))
        deleted-assets (fn [id]
                         (:deleted-assets
                          (worker-pipeline/invoke-hooks conn (d/with @conn [[:db/retractEntity id]] {}) {})))]
    (is (= [{:block/uuid (:block/uuid asset) :ext "png"}] (vec (deleted-assets asset-id))))
    (is (empty? (deleted-assets plain-id)))))
