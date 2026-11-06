(ns frontend.worker.pipeline-cli-refs-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.pipeline :as worker-pipeline]
            [logseq.common.util.page-ref :as page-ref]
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

(defn- ref-ids
  [conn block-uuid]
  (set (map :db/id (:block/refs (d/entity @conn [:block/uuid block-uuid])))))

(defn- create-refs-test-conn
  []
  (db-test/create-conn-with-blocks
   {:pages-and-blocks [{:page {:block/title "page1"}}
                       {:page {:block/title "Foo"}}]
    :classes {:TagA {}}
    :properties {:pn {:logseq.property/type :number}}}))

(defn- insert-titled-block-op
  [block page]
  [:insert-blocks [[block]
                   (:block/uuid page)
                   {:outliner-op :insert-blocks
                    :keep-uuid? true
                    :bottom? true}]])

(deftest multi-op-batch-rebuilds-refs-of-its-metadata-ops-test
  (let [conn (create-refs-test-conn)
        page (ldb/get-page @conn "page1")
        foo (ldb/get-page @conn "Foo")
        tag (d/entity @conn :user.class/TagA)
        property (d/entity @conn :user.property/pn)
        block-uuid (random-uuid)]
    (with-transact-pipeline
      (fn []
        (outliner-op/apply-ops!
         conn
         [(insert-titled-block-op {:block/uuid block-uuid
                                   :block/title (str "see " (page-ref/->page-ref (:block/uuid foo)))
                                   :block/refs [[:block/uuid (:block/uuid foo)]]}
                                  page)
          [:batch-set-property [[block-uuid] :block/tags (:db/id tag) {}]]
          [:batch-set-property [[block-uuid] :user.property/pn 3 {}]]]
         {})
        (let [refs (ref-ids conn block-uuid)]
          (is (contains? refs (:db/id foo)) "the page in the title")
          (is (contains? refs (:db/id tag)) "the tag")
          (is (contains? refs (:db/id property)) "the key of the property"))))))

(deftest multi-op-batch-drops-refs-of-the-title-it-replaces-test
  (let [conn (create-refs-test-conn)
        page (ldb/get-page @conn "page1")
        foo (ldb/get-page @conn "Foo")
        property (d/entity @conn :user.property/pn)
        block-uuid (random-uuid)]
    (with-transact-pipeline
      (fn []
        (outliner-op/apply-ops!
         conn
         [(insert-titled-block-op {:block/uuid block-uuid
                                   :block/title (str "see " (page-ref/->page-ref (:block/uuid foo)))
                                   :block/refs [[:block/uuid (:block/uuid foo)]]}
                                  page)]
         {})
        (is (contains? (ref-ids conn block-uuid) (:db/id foo)))
        (outliner-op/apply-ops!
         conn
         [[:save-block [{:block/uuid block-uuid :block/title "plain"} {}]]
          [:batch-set-property [[block-uuid] :user.property/pn 3 {}]]]
         {})
        (let [refs (ref-ids conn block-uuid)]
          (is (not (contains? refs (:db/id foo))) "the page of the old title")
          (is (contains? refs (:db/id property)) "the key of the property"))))))

(deftest name-spelled-page-ref-in-title-survives-a-later-refs-rebuild-test
  (let [conn (create-refs-test-conn)
        page (ldb/get-page @conn "page1")
        foo (ldb/get-page @conn "Foo")
        tag (d/entity @conn :user.class/TagA)
        block-uuid (random-uuid)]
    (with-transact-pipeline
      (fn []
        (testing "a block created with a [[Page]] title, as the CLI sends it"
          (outliner-op/apply-ops!
           conn
           [(insert-titled-block-op {:block/uuid block-uuid
                                     :block/title "two [[Foo]]"
                                     :block/refs [[:block/uuid (:block/uuid foo)]]}
                                    page)]
           {})
          (is (contains? (ref-ids conn block-uuid) (:db/id foo)))
          (outliner-op/apply-ops! conn [[:batch-set-property [[block-uuid] :block/tags (:db/id tag) {}]]] {})
          (is (contains? (ref-ids conn block-uuid) (:db/id foo))
              "setting a tag rebuilds the refs and keeps the page of the title")
          (is (= "two [[Foo]]" (:block/title (d/entity @conn [:block/uuid block-uuid])))))
        (testing "a block saved with a [[New page]] title"
          (outliner-op/apply-ops!
           conn
           [[:save-block [{:block/uuid block-uuid
                           :block/title "now [[Bar]]"
                           :block/refs [{:block/title "Bar"
                                         :block/name "bar"
                                         :block/tags [:logseq.class/Page]}]}
                          {}]]]
           {})
          (let [bar (ldb/get-page @conn "Bar")]
            (is (some? bar) "the page is created")
            (is (contains? (ref-ids conn block-uuid) (:db/id bar)))
            (outliner-op/apply-ops! conn [[:batch-delete-property-value [[block-uuid] :block/tags (:db/id tag)]]] {})
            (is (contains? (ref-ids conn block-uuid) (:db/id bar))
                "removing a tag rebuilds the refs and keeps the page of the title")))))))
