(ns frontend.worker.pipeline-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.pipeline :as worker-pipeline]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]))

(deftest remove-conflict-datoms-test
  (testing "remove-conflict-datoms (1)"
    (let [datoms [[1 :a 1 1]
                  [1 :a 1 1]
                  [1 :a 2 1]
                  [2 :a 1 1]]]
      (is (= (set [[1 :a 1 1]
                   [1 :a 2 1]
                   [2 :a 1 1]])
             (set (#'worker-pipeline/remove-conflict-datoms datoms))))))
  (testing "check block/tags"
    (let [datoms [[163 :block/tags 2 536870930 true]
                  [163 :block/tags 136 536870930 true]
                  [163 :block/tags 136 536870930 false]]]
      (is (= (set [[163 :block/tags 2 536870930 true]
                   [163 :block/tags 136 536870930 false]])
             (set (#'worker-pipeline/remove-conflict-datoms datoms))))))
  (testing "check block/refs"
    (let [datoms [[176 :block/refs 177 536871080 true]
                  [158 :block/refs 21 536871082 false]
                  [158 :block/refs 137 536871082 false]
                  [158 :block/refs 137 536871082 true]
                  [158 :block/refs 21 536871082 true]
                  [176 :block/refs 177 536871082 false]
                  [176 :block/refs 177 536871082 true]
                  [177 :block/refs 136 536871082 true]
                  [177 :block/refs 21 536871082 true]]]
      (is (= (set [[176 :block/refs 177 536871080 true]
                   [158 :block/refs 137 536871082 true]
                   [158 :block/refs 21 536871082 true]
                   [176 :block/refs 177 536871082 true]
                   [177 :block/refs 136 536871082 true]
                   [177 :block/refs 21 536871082 true]])
             (set (#'worker-pipeline/remove-conflict-datoms datoms)))))))

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
