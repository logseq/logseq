(ns frontend.worker.pipeline-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.pipeline :as worker-pipeline]
            [logseq.common.util :as common-util]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.db :as ldb]
            [logseq.db.common.order :as db-order]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.page :as outliner-page]))

(deftest test-built-in-page-updates-that-should-be-reverted
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "b1"}
                         {:block/title "b2" :build/tags [:tag1]}]}])
        library (ldb/get-built-in-page @conn "Library")]

    (ldb/register-transact-pipeline-fn!
     (fn [tx-report]
       (worker-pipeline/transact-pipeline tx-report)))

    (testing "Using built-in pages as tags"
      (let [page-1 (ldb/get-page @conn "page1")
            b1 (first (:block/_page page-1))]
        (ldb/transact! conn [{:db/id (:db/id b1)
                              :block/title "b1 #Library"
                              :block/tags [library]}])

        (is (not (ldb/class? library)))
        (is (empty? (:block/tags (d/entity @conn (:db/id b1)))))))

    (testing "Updating protected properties for built-in nodes"
      (ldb/transact! conn [{:db/id (:db/id library)
                            :block/title "newlibrary"
                            :db/ident :test/ident}])
      (let [library (ldb/get-built-in-page @conn "Library")]
        (is (nil? (:db/ident library)))
        (is (= "Library" (:block/title library))))

      (let [task (d/entity @conn :logseq.class/Task)]
        (ldb/transact! conn [{:db/id (:db/id task)
                              :db/ident :logseq.class/task-new-ident
                              :block/title "task"}])
        (let [task (d/entity @conn (:db/id task))]
          (is (= :logseq.class/Task (:db/ident task)))
          (is (= "Task" (:block/title task))))

        (ldb/transact! conn [{:db/id (:db/id task)
                              :logseq.property.class/extends :logseq.class/Journal}])
        (let [task (d/entity @conn (:db/id task))]
          (is (= [:logseq.class/Root] (map :db/ident (:logseq.property.class/extends task)))))))

    (testing "User class extends unexpected built-in classes"
      (let [t1 (ldb/get-page @conn "tag1")]
        (ldb/transact! conn [{:db/id (:db/id t1)
                              :logseq.property.class/extends :logseq.class/Journal}])
        (let [t1 (d/entity @conn (:db/id t1))]
          (is (= [:logseq.class/Root] (map :db/ident (:logseq.property.class/extends t1)))))))

    ;; return global fn back to previous behavior
    (ldb/register-transact-pipeline-fn! identity)))

(deftest ensure-query-property-on-tag-additions-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "b1"}
                                            {:block/title "b2"}]}]
               :classes {:QueryChild {:build/class-extends [:logseq.class/Query]}}})
        page (ldb/get-page @conn "page1")
        blocks (:block/_page page)
        b1 (some #(when (= "b1" (:block/title %)) %) blocks)
        b2 (some #(when (= "b2" (:block/title %)) %) blocks)
        query-child (ldb/get-page @conn "QueryChild")]
    (ldb/register-transact-pipeline-fn! worker-pipeline/transact-pipeline)

    (testing "tagging with #Query adds query property"
      (ldb/transact! conn [[:db/add (:db/id b1) :block/tags :logseq.class/Query]])
      (let [block (d/entity @conn (:db/id b1))
            query (:logseq.property/query block)]
        (is query)
        (is (uuid? (:block/uuid query)))
        (is (= "" (:block/title query)))))

    (testing "tagging with class extending #Query adds query property"
      (ldb/transact! conn [[:db/add (:db/id b2) :block/tags (:db/id query-child)]])
      (let [block (d/entity @conn (:db/id b2))
            query (:logseq.property/query block)]
        (is query)
        (is (uuid? (:block/uuid query)))
        (is (= "" (:block/title query)))))

    ;; return global fn back to previous behavior
    (ldb/register-transact-pipeline-fn! identity)))

(deftest journal-name-title-updates-throw-in-transact-pipeline-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:build/journal 20250203}}
                                  {:page {:block/title "page1"}}]})
        journal (db-test/find-journal-by-journal-day @conn 20250203)
        page1 (ldb/get-page @conn "page1")
        run-pipeline (fn [tx-data]
                       (worker-pipeline/transact-pipeline
                        (d/with @conn tx-data)))]
    (testing "updating journal :block/title should throw"
      (let [error (try
                    (run-pipeline [{:db/id (:db/id journal)
                                    :block/title "journal title changed"}])
                    nil
                    (catch :default e
                      e))]
        (is (some? error))
        (is (= :journal-page-protected-attr-updated (:type (ex-data error))))
        (is (= :block/title (:attr (ex-data error))))))

    (testing "updating journal :block/name should throw"
      (let [error (try
                    (run-pipeline [{:db/id (:db/id journal)
                                    :block/name "journal-name-changed"}])
                    nil
                    (catch :default e
                      e))]
        (is (some? error))
        (is (= :journal-page-protected-attr-updated (:type (ex-data error))))
        (is (= :block/name (:attr (ex-data error))))))

    (testing "updating journal protected attrs via :db/add should throw"
      (let [title-error (try
                          (run-pipeline [[:db/add (:db/id journal) :block/title "journal-title-via-datom"]])
                          nil
                          (catch :default e
                            e))
            name-error (try
                         (run-pipeline [[:db/add (:db/id journal) :block/name "journal-name-via-datom"]])
                         nil
                         (catch :default e
                           e))]
        (is (some? title-error))
        (is (= :journal-page-protected-attr-updated (:type (ex-data title-error))))
        (is (= :block/title (:attr (ex-data title-error))))
        (is (some? name-error))
        (is (= :journal-page-protected-attr-updated (:type (ex-data name-error))))
        (is (= :block/name (:attr (ex-data name-error))))))

    (testing "updating non-journal page title should be allowed"
      (let [result (run-pipeline [{:db/id (:db/id page1)
                                   :block/title "page1-renamed"}])]
        (is (= "page1-renamed"
               (:block/title (d/entity (:db-after result) (:db/id page1)))))))))

(deftest create-journal-page-name-uses-default-formatter-test
  (let [conn (db-test/create-conn)]
    (d/transact! conn [[:db/add :logseq.class/Journal :logseq.property.journal/title-format "yyyy-MM-dd EEEE"]])
    (let [[_ page-uuid] (outliner-page/create! conn "Dec 16th, 2024" {})
          page (d/entity @conn [:block/uuid page-uuid])
          journal-day (:block/journal-day page)
          expected-title (date-time-util/int->journal-title journal-day "yyyy-MM-dd EEEE")
          expected-name (-> journal-day
                            (date-time-util/int->journal-title date-time-util/default-journal-title-formatter)
                            common-util/page-name-sanity-lc)]
      (is (= expected-title (:block/title page))
          "Journal title follows configured title format")
      (is (= expected-name (:block/name page))
          "Journal block/name keeps the default formatter for stable identity"))))

(deftest built-in-tag-must-not-convert-page-child-block-to-class-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "page1"}}]})
        page1 (ldb/get-page @conn "page1")
        now (js/Date.now)
        bad-block-uuid (random-uuid)
        new-tag-uuid (random-uuid)]
    (ldb/register-transact-pipeline-fn! worker-pipeline/transact-pipeline)

    (testing "page-child block with built-in #Tag stays a block"
      (ldb/transact! conn [{:block/uuid bad-block-uuid
                            :block/title "charlie"
                            :block/created-at now
                            :block/updated-at now
                            :block/page (:db/id page1)
                            :block/parent (:db/id page1)
                            :block/order (db-order/gen-key)
                            :block/tags [:logseq.class/Tag]}])
      (let [block (d/entity @conn [:block/uuid bad-block-uuid])]
        (is (some? block))
        (is (nil? (:db/ident block)))
        (is (nil? (:logseq.property.class/extends block)))
        (is (not (ldb/class? block)))
        (is (= (:db/id page1) (:db/id (:block/parent block))))
        (is (empty? (:block/tags block)))))

    (testing "standalone candidate is still converted to a class page"
      (ldb/transact! conn [{:block/uuid new-tag-uuid
                            :block/name "standalone-tag"
                            :block/title "standalone-tag"
                            :block/created-at now
                            :block/updated-at now
                            :block/tags [:logseq.class/Tag]}])
      (let [tag-page (d/entity @conn [:block/uuid new-tag-uuid])]
        (is (ldb/class? tag-page))
        (is (keyword? (:db/ident tag-page)))
        (is (= "user.class" (namespace (:db/ident tag-page))))
        (is (= [:logseq.class/Root]
               (map :db/ident (:logseq.property.class/extends tag-page))))))

    ;; return global fn back to previous behavior
    (ldb/register-transact-pipeline-fn! identity)))

(deftest tag-template-insertion-resolves-dynamic-variable-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:block/title "Target Page"}
                 :blocks [{:block/title "target block"}]}
                {:page {:block/title "Templates"}
                 :blocks [{:block/title "tag template root"
                           :build/children [{:block/title "auto <% current page %>"}]}]}]
               :classes {:DiaryEntry {}}})
        target-block (db-test/find-block-by-content @conn "target block")
        template-root (db-test/find-block-by-content @conn "tag template root")
        diary-entry (ldb/get-page @conn "DiaryEntry")]
    (ldb/transact! conn [[:db/add (:db/id template-root)
                          :logseq.property/template-applied-to
                          (:db/id diary-entry)]])
    (ldb/register-transact-pipeline-fn! worker-pipeline/transact-pipeline)
    (try
      (ldb/transact! conn [[:db/add (:db/id target-block) :block/tags (:db/id diary-entry)]])
      (is (some? (db-test/find-block-by-content @conn "auto [[Target Page]]")))
      (finally
        ;; return global fn back to previous behavior
        (ldb/register-transact-pipeline-fn! identity)))))
