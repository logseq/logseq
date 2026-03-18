(ns frontend.worker.pipeline-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.pipeline :as worker-pipeline]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]))

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
