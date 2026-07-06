(ns frontend.worker.pipeline-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.pipeline :as worker-pipeline]
            [logseq.common.util :as common-util]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db :as ldb]
            [logseq.db.common.order :as db-order]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.sqlite.export :as sqlite-export]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.op :as outliner-op]
            [logseq.outliner.page :as outliner-page]
            [logseq.outliner.recycle :as outliner-recycle]))

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

(deftest ensure-comments-blocks-property-on-tag-additions-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "target"
                                             :build/children [{:block/title ""}]}]}]})
        target (db-test/find-block-by-content @conn "target")
        empty-block (first (:block/_parent target))]
    (ldb/register-transact-pipeline-fn! worker-pipeline/transact-pipeline)
    (try
      (ldb/transact! conn [[:db/add (:db/id empty-block) :block/tags :logseq.class/Comments]])
      (let [comments-area (d/entity @conn (:db/id empty-block))]
        (is (= #{(:db/id target)}
               (set (map :db/id (:logseq.property.comments/blocks comments-area))))
            "Tagging an existing empty child block with #Comments should target its parent"))
      (finally
        ;; return global fn back to previous behavior
        (ldb/register-transact-pipeline-fn! identity)))))

(deftest batch-import-edn-datom-format-with-shifted-builtin-eids-test
  (let [source-conn (d/create-conn db-schema/schema)
        _ (d/transact! source-conn [{:block/uuid (random-uuid)}])
        _ (d/transact! source-conn (sqlite-create-graph/build-db-initial-data "{}"))
        export-edn (sqlite-export/build-export @source-conn {:export-type :graph})
        source-purple-eid (some (fn [[e a v]]
                                  (when (and (= a :db/ident)
                                             (= v :logseq.property/color.purple))
                                    e))
                                (:datoms export-edn))
        conn (sqlite-export/create-conn)
        dest-purple-eid (:db/id (d/entity @conn :logseq.property/color.purple))]
    (assert (= :datoms (::sqlite-export/graph-format export-edn))
            "Test relies on a datom-format export")
    (assert (and source-purple-eid dest-purple-eid (not= source-purple-eid dest-purple-eid))
            "Test relies on shifted built-in eids between source and dest")
    (ldb/register-transact-pipeline-fn! worker-pipeline/transact-pipeline)
    (try
      (let [result (outliner-op/apply-ops!
                    conn
                    [[:batch-import-edn [export-edn {:tx-meta {:import-db? true}}]]]
                    {})]
        (is (nil? (:error result)))
        (is (= :logseq.property/color.purple
               (:db/ident (d/entity @conn :logseq.property/color.purple)))
            "color.purple ident is preserved after datom import despite eid shift"))
      (finally
        (ldb/register-transact-pipeline-fn! identity)))))

(deftest permanent-delete-recycled-page-with-transact-pipeline-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "b1"}]}])
        page (ldb/get-page @conn "page1")
        block (db-test/find-block-by-content @conn "b1")
        page-uuid (:block/uuid page)
        block-uuid (:block/uuid block)]
    (ldb/register-transact-pipeline-fn! worker-pipeline/transact-pipeline)
    (try
      (outliner-page/delete! conn page-uuid {})
      (is (true? (ldb/recycled? (d/entity @conn [:block/uuid page-uuid]))))
      (outliner-op/apply-ops! conn [[:recycle-delete-permanently [page-uuid]]] {})
      (is (nil? (d/entity @conn [:block/uuid page-uuid])))
      (is (nil? (d/entity @conn [:block/uuid block-uuid])))
      (finally
        (ldb/register-transact-pipeline-fn! identity)))))

(deftest recycle-ops-return-apply-result-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}}])
        page (ldb/get-page @conn "page1")
        page-uuid (:block/uuid page)]
    (ldb/register-transact-pipeline-fn! worker-pipeline/transact-pipeline)
    (try
      (outliner-page/delete! conn page-uuid {})
      (is (true? (outliner-op/apply-ops!
                  conn
                  [[:restore-recycled [page-uuid]]]
                  {})))
      (is (false? (ldb/recycled? (d/entity @conn [:block/uuid page-uuid]))))
      (outliner-page/delete! conn page-uuid {})
      (is (true? (outliner-op/apply-ops!
                  conn
                  [[:recycle-delete-permanently [page-uuid]]]
                  {})))
      (is (nil? (d/entity @conn [:block/uuid page-uuid])))
      (finally
        (ldb/register-transact-pipeline-fn! identity)))))

(deftest permanent-delete-recycled-page-removes-blocks-parented-by-page-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}}
               {:page {:block/title "page2"}}])
        page1 (ldb/get-page @conn "page1")
        page2 (ldb/get-page @conn "page2")
        block-uuid (random-uuid)
        now (common-util/time-ms)]
    (d/transact! conn [{:block/uuid block-uuid
                        :block/title "parented by page1"
                        :block/created-at now
                        :block/updated-at now
                        :block/parent (:db/id page1)
                        :block/page (:db/id page2)
                        :block/order "a0"}])
    (ldb/register-transact-pipeline-fn! worker-pipeline/transact-pipeline)
    (try
      (ldb/transact! conn
                     (outliner-recycle/recycle-page-tx-data @conn page1 {})
                     {:outliner-op :delete-page})
      (is (true? (ldb/recycled? (d/entity @conn (:db/id page1)))))
      (is (true? (outliner-recycle/permanently-delete! conn (:block/uuid page1))))
      (is (nil? (d/entity @conn [:block/uuid block-uuid])))
      (finally
        (ldb/register-transact-pipeline-fn! identity)))))

(deftest permanent-delete-recycled-block-with-transact-pipeline-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "parent"
                          :build/children [{:block/title "child"}]}]}])
        parent (db-test/find-block-by-content @conn "parent")
        child (db-test/find-block-by-content @conn "child")
        parent-uuid (:block/uuid parent)
        child-uuid (:block/uuid child)]
    (ldb/register-transact-pipeline-fn! worker-pipeline/transact-pipeline)
    (try
      (ldb/transact! conn
                     (outliner-recycle/recycle-blocks-tx-data @conn [parent] {})
                     {:outliner-op :delete-blocks})
      (is (true? (ldb/recycled? (d/entity @conn [:block/uuid parent-uuid]))))
      (outliner-op/apply-ops! conn
                              [[:recycle-delete-permanently [parent-uuid]]]
                              {:db-sync/tx-id (random-uuid)})
      (is (nil? (d/entity @conn [:block/uuid parent-uuid])))
      (is (nil? (d/entity @conn [:block/uuid child-uuid])))
      (finally
        (ldb/register-transact-pipeline-fn! identity)))))

(deftest code-block-tag-addition-preserves-explicit-code-lang-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "page1"}}]})
        page (ldb/get-page @conn "page1")
        now (js/Date.now)
        code-block-uuid (random-uuid)
        code-block-without-lang-uuid (random-uuid)]
    (ldb/register-transact-pipeline-fn! worker-pipeline/transact-pipeline)
    (try
      (ldb/transact! conn [{:db/ident :logseq.kv/latest-code-lang
                            :kv/value "pascal"}])
      (ldb/transact! conn [{:block/uuid code-block-uuid
                            :block/title "1 + 2"
                            :block/created-at now
                            :block/updated-at now
                            :block/page (:db/id page)
                            :block/parent (:db/id page)
                            :block/order (db-order/gen-key)
                            :block/tags [:logseq.class/Code-block]
                            :logseq.property.code/lang "calc"}])
      (let [block (d/entity @conn [:block/uuid code-block-uuid])]
        (is (= :code (:logseq.property.node/display-type block)))
        (is (= "calc" (:logseq.property.code/lang block))))
      (ldb/transact! conn [{:block/uuid code-block-without-lang-uuid
                            :block/title "plain code"
                            :block/created-at now
                            :block/updated-at now
                            :block/page (:db/id page)
                            :block/parent (:db/id page)
                            :block/order (db-order/gen-key)
                            :block/tags [:logseq.class/Code-block]}])
      (let [block (d/entity @conn [:block/uuid code-block-without-lang-uuid])]
        (is (= :code (:logseq.property.node/display-type block)))
        (is (= "pascal" (:logseq.property.code/lang block))))
      (finally
        ;; return global fn back to previous behavior
        (ldb/register-transact-pipeline-fn! identity)))))

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
    (let [[_ page-uuid] (outliner-page/create! conn "Dec 16th, 2024" {:journal? true})
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

(deftest apply-template-today-dynamic-variable-persists-journal-ref-test
  (testing "apply-template stores <% today %> as a DB graph id ref to the journal page"
    (let [today (date-time-util/ms->journal-day (js/Date.))
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:build/journal today}
                   :blocks [{:block/title "target block"}]}
                  {:page {:block/title "Templates"}
                   :blocks [{:block/title "template root"
                             :build/children [{:block/title "date <% today %>"}]}]}]})
          today-page (db-test/find-journal-by-journal-day @conn today)
          template-root (db-test/find-block-by-content @conn "template root")
          target-block (db-test/find-block-by-content @conn "target block")
          template-blocks (->> (ldb/get-block-and-children @conn (:block/uuid template-root)
                                                           {:include-property-block? true})
                               rest)
          blocks-to-insert (cons (assoc (into {} (first template-blocks))
                                        :db/id (:db/id (first template-blocks))
                                        :logseq.property/used-template (:db/id template-root))
                                 (map (fn [block]
                                        (assoc (into {} block) :db/id (:db/id block)))
                                      (rest template-blocks)))]
      (ldb/register-transact-pipeline-fn! worker-pipeline/transact-pipeline)
      (try
        (outliner-op/apply-ops! conn
                                [[:apply-template [(:block/uuid template-root)
                                                   (:block/uuid target-block)
                                                   {:template-blocks blocks-to-insert}]]]
                                {})
        (let [inserted-block (db-test/find-block-by-content
                              @conn
                              (str "date " (page-ref/->page-ref (:block/uuid today-page))))
              raw-title (:v (first (d/datoms @conn :eavt (:db/id inserted-block) :block/title)))]
          (is (some? inserted-block))
          (is (= (str "date " (page-ref/->page-ref (:block/uuid today-page)))
                 raw-title))
          (is (= (str "date " (page-ref/->page-ref (:block/title today-page)))
                 (:block/title inserted-block)))
          (is (= [(:block/uuid today-page)]
                 (mapv :block/uuid (:block/refs inserted-block)))))
        (finally
          (ldb/register-transact-pipeline-fn! identity))))))

(deftest apply-template-tomorrow-dynamic-variable-creates-missing-journal-ref-test
  (testing "apply-template creates a missing journal page before storing <% tomorrow %> as an id ref"
    (let [today (date-time-util/ms->journal-day (js/Date.))
          tomorrow (date-time-util/ms->journal-day (+ (js/Date.now) (* 24 60 60 1000)))
          journal-title-format "yyyy-MM-dd"
          expected-tomorrow-title (date-time-util/int->journal-title tomorrow journal-title-format)
          conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:build/journal today}
                   :blocks [{:block/title "target block"}]}
                  {:page {:block/title "Templates"}
                   :blocks [{:block/title "template root"
                             :build/children [{:block/title "date <% tomorrow %>"}]}]}]})
          template-root (db-test/find-block-by-content @conn "template root")
          target-block (db-test/find-block-by-content @conn "target block")
          template-blocks (->> (ldb/get-block-and-children @conn (:block/uuid template-root)
                                                           {:include-property-block? true})
                               rest)
          blocks-to-insert (cons (assoc (into {} (first template-blocks))
                                        :db/id (:db/id (first template-blocks))
                                        :logseq.property/used-template (:db/id template-root))
                                 (map (fn [block]
                                        (assoc (into {} block) :db/id (:db/id block)))
                                      (rest template-blocks)))]
      (ldb/register-transact-pipeline-fn! worker-pipeline/transact-pipeline)
      (try
        (ldb/transact! conn [[:db/add :logseq.class/Journal :logseq.property.journal/title-format journal-title-format]])
        (is (nil? (db-test/find-journal-by-journal-day @conn tomorrow)))
        (outliner-op/apply-ops! conn
                                [[:apply-template [(:block/uuid template-root)
                                                   (:block/uuid target-block)
                                                   {:template-blocks blocks-to-insert}]]]
                                {})
        (let [tomorrow-page (db-test/find-journal-by-journal-day @conn tomorrow)
              inserted-block (db-test/find-block-by-content
                              @conn
                              (str "date " (page-ref/->page-ref (:block/uuid tomorrow-page))))
              raw-title (:v (first (d/datoms @conn :eavt (:db/id inserted-block) :block/title)))]
          (is (some? tomorrow-page))
          (is (= expected-tomorrow-title (:block/title tomorrow-page)))
          (is (= expected-tomorrow-title (:block/name tomorrow-page)))
          (is (some? inserted-block))
          (is (= (str "date " (page-ref/->page-ref (:block/uuid tomorrow-page)))
                 raw-title))
          (is (= (str "date " (page-ref/->page-ref (:block/title tomorrow-page)))
                 (:block/title inserted-block)))
          (is (= [(:block/uuid tomorrow-page)]
                 (mapv :block/uuid (:block/refs inserted-block)))))
        (finally
          (ldb/register-transact-pipeline-fn! identity))))))

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
        target-page (ldb/get-page @conn "Target Page")
        template-root (db-test/find-block-by-content @conn "tag template root")
        diary-entry (ldb/get-page @conn "DiaryEntry")]
    (ldb/transact! conn [[:db/add (:db/id template-root)
                          :logseq.property/template-applied-to
                          (:db/id diary-entry)]])
    (ldb/register-transact-pipeline-fn! worker-pipeline/transact-pipeline)
    (try
      (ldb/transact! conn [[:db/add (:db/id target-block) :block/tags (:db/id diary-entry)]])
      (let [inserted-block (db-test/find-block-by-content
                            @conn
                            (str "auto " (page-ref/->page-ref (:block/uuid target-page))))
            raw-title (:v (first (d/datoms @conn :eavt (:db/id inserted-block) :block/title)))]
        (is (some? inserted-block))
        (is (= (str "auto " (page-ref/->page-ref (:block/uuid target-page)))
               raw-title))
        (is (= "auto [[Target Page]]" (:block/title inserted-block)))
        (is (= [(:block/uuid target-page)]
               (mapv :block/uuid (:block/refs inserted-block)))))
      (finally
        ;; return global fn back to previous behavior
        (ldb/register-transact-pipeline-fn! identity)))))

(deftest import-tx-skips-property-history-recording-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "page1"}
                                   :blocks [{:block/title "task block"}]}]})
        block (db-test/find-block-by-content @conn "task block")
        history-count #(count (d/q '[:find ?e :where [?e :logseq.property.history/property]] @conn))]
    (ldb/register-transact-pipeline-fn! worker-pipeline/transact-pipeline)
    (try
      (testing "Baseline: a normal status change records property history"
        (let [before (history-count)]
          (ldb/transact! conn [[:db/add (:db/id block)
                                :logseq.property/status :logseq.property/status.todo]])
          (is (= (inc before) (history-count))
              "One :logseq.property.history entry is recorded for a user-driven status change")))

      (testing "Import: setting a history-enabled property with ::sqlite-export/imported-data? does not record history"
        (let [before (history-count)]
          (ldb/transact! conn
                         [[:db/add (:db/id block)
                           :logseq.property/status :logseq.property/status.doing]]
                         {::sqlite-export/imported-data? true})
          (is (= before (history-count))
              "No :logseq.property.history entries are added for an imported transaction")))
      (finally
        (ldb/register-transact-pipeline-fn! identity)))))
