(ns frontend.worker.pipeline-test
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.worker.db.validate :as worker-db-validate]
            [frontend.worker.handler.block :as block-handler]
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
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.op :as outliner-op]
            [logseq.outliner.page :as outliner-page]
            [logseq.outliner.recycle :as outliner-recycle]))

(deftest save-block-resolves-page-refs-in-worker-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "first"}
                         {:block/title "second"}]}])
        first-block (db-test/find-block-by-content @conn "first")
        second-block (db-test/find-block-by-content @conn "second")
        first-page-uuid (random-uuid)
        second-page-uuid (random-uuid)
        now (common-util/time-ms)
        page-ref-map (fn [page-uuid]
                       {:block/uuid page-uuid
                        :block/title "foo"
                        :block/name "foo"
                        :block/created-at now
                        :block/updated-at now
                        :block/type "page"})]
    (ldb/register-transact-pipeline-fn! worker-pipeline/transact-pipeline)
    (try
      (outliner-core/save-block!
       conn
       {:db/id (:db/id first-block)
        :block/uuid (:block/uuid first-block)
        :block/title (str "[[" first-page-uuid "]]")
        :block/refs [(page-ref-map first-page-uuid)]})
      (let [page (ldb/get-page @conn "foo")]
        (is (= [:logseq.class/Page] (map :db/ident (:block/tags page))))
        (outliner-core/save-block!
         conn
         {:db/id (:db/id second-block)
          :block/uuid (:block/uuid second-block)
          :block/title (str "[[" second-page-uuid "]]")
          :block/refs [(page-ref-map second-page-uuid)]})
        (let [second-block (d/entity @conn (:db/id second-block))]
          (is (= (:block/uuid page)
                 (:block/uuid (first (:block/refs second-block)))))
          (is (= "[[foo]]" (:block/title second-block)))))

      (let [tag-ref-uuid (random-uuid)
            tag-uuid (random-uuid)]
        (outliner-core/save-block!
         conn
         {:db/id (:db/id second-block)
          :block/uuid (:block/uuid second-block)
          :block/title (str "#[[" tag-ref-uuid "]]")
          :block/tags [{:block/uuid tag-uuid
                        :block/title "tag"
                        :block/name "tag"
                        :block/type "page"}]
          :block/refs [{:block/uuid tag-ref-uuid
                        :block/title "tag"
                        :block/name "tag"
                        :block/type "page"}]})
        (let [block (d/entity @conn (:db/id second-block))
              tag (first (:block/tags block))]
          (is (ldb/class? tag))
          (is (some #(= (:block/uuid tag) (:block/uuid %))
                    (:block/refs block)))
          (is (empty? (:errors (worker-db-validate/validate-db conn :fix false))))))

      (let [journal-uuid (random-uuid)
            journal-name "Jul 9th, 2026"]
        (outliner-core/save-block!
         conn
         {:db/id (:db/id second-block)
          :block/uuid (:block/uuid second-block)
          :block/title (str "[[" journal-uuid "]]")
          :block/refs [{:block/uuid journal-uuid
                        :block/title journal-name
                        :block/name (string/lower-case journal-name)
                        :block/journal-day 20260709
                        :block/created-at now
                        :block/updated-at now
                        :block/type "journal"}]})
        (let [journal (ldb/get-page @conn (string/lower-case journal-name))]
          (is (= 20260709 (:block/journal-day journal)))
          (is (= [:logseq.class/Journal] (map :db/ident (:block/tags journal))))))
      (finally
        (ldb/register-transact-pipeline-fn! identity)))))

(defn- raw-block-title
  [db block]
  (when block
    (:v (first (d/datoms db :eavt (:db/id block) :block/title)))))

(defn- default-journal-page-name
  [journal-day]
  (-> journal-day
      (date-time-util/int->journal-title date-time-util/default-journal-title-formatter)
      common-util/page-name-sanity-lc))

(defn- silence-stderr
  [f]
  (let [orig-write (.-write js/process.stderr)]
    (set! (.-write js/process.stderr) (fn [& _] true))
    (try
      (f)
      (finally
        (set! (.-write js/process.stderr) orig-write)))))

(defn- with-transact-pipeline
  [f]
  (ldb/register-transact-pipeline-fn! worker-pipeline/transact-pipeline)
  (try
    (f)
    (finally
      (ldb/register-transact-pipeline-fn! identity))))

(defn- revision
  [db entity]
  (:block/tx-id (d/entity db (:db/id entity))))

(deftest nested-insert-keeps-parent-revision-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "ancestor"
                          :build/children [{:block/title "parent"
                                            :build/children [{:block/title "target"}]}]}]}])
        db-before @conn
        ancestor (db-test/find-block-by-content db-before "ancestor")
        parent (db-test/find-block-by-content db-before "parent")
        target (db-test/find-block-by-content db-before "target")
        page (:block/page target)
        inserted-uuid (random-uuid)]
    (with-transact-pipeline
      #(outliner-core/insert-blocks!
        conn
        [{:block/uuid inserted-uuid
          :block/title "inserted"
          :block/page (:db/id page)}]
        target
        {:sibling? true
         :keep-uuid? true}))
    (is (= (revision db-before parent) (revision @conn parent))
        "Changing direct children is independent from the parent entity revision.")
    (is (some? (:block/tx-id (d/entity @conn [:block/uuid inserted-uuid]))))
    (is (= (revision db-before ancestor) (revision @conn ancestor))
        "Structural revisions do not propagate to ancestors.")
    (is (= (revision db-before page) (revision @conn page))
        "Nested structural revisions do not propagate to the page.")))

(deftest top-level-insert-keeps-page-revision-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "target"}]}])
        db-before @conn
        target (db-test/find-block-by-content db-before "target")
        page (:block/page target)
        inserted-uuid (random-uuid)]
    (with-transact-pipeline
      #(outliner-core/insert-blocks!
        conn
        [{:block/uuid inserted-uuid
          :block/title "inserted"
          :block/page (:db/id page)}]
        target
        {:sibling? true
         :keep-uuid? true}))
    (is (= (revision db-before page) (revision @conn page))
        "Top-level membership is independent from the page entity revision.")))

(deftest sibling-reorder-keeps-parent-revision-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "ancestor"
                          :build/children [{:block/title "parent"
                                            :build/children [{:block/title "first"}
                                                             {:block/title "second"}]}]}]}])
        db-before @conn
        ancestor (db-test/find-block-by-content db-before "ancestor")
        parent (db-test/find-block-by-content db-before "parent")
        second-block (db-test/find-block-by-content db-before "second")
        page (:block/page second-block)]
    (with-transact-pipeline
      #(outliner-core/move-blocks-up-down! conn [second-block] true))
    (is (= (revision db-before parent) (revision @conn parent))
        "Reordering children does not revise their direct parent.")
    (is (= (revision db-before ancestor) (revision @conn ancestor)))
    (is (= (revision db-before page) (revision @conn page)))))

(deftest nested-move-keeps-old-and-new-parent-revisions-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "ancestor"
                          :build/children [{:block/title "old parent"
                                            :build/children [{:block/title "moved"}]}
                                           {:block/title "new parent"
                                            :build/children [{:block/title "existing"}]}]}]}])
        db-before @conn
        ancestor (db-test/find-block-by-content db-before "ancestor")
        old-parent (db-test/find-block-by-content db-before "old parent")
        new-parent (db-test/find-block-by-content db-before "new parent")
        moved (db-test/find-block-by-content db-before "moved")
        page (:block/page moved)]
    (with-transact-pipeline
      #(outliner-core/move-blocks! conn [moved] new-parent {:sibling? false}))
    (is (= (revision db-before old-parent) (revision @conn old-parent))
        "Removing a child does not revise its old direct parent.")
    (is (= (revision db-before new-parent) (revision @conn new-parent))
        "Adding a child does not revise its new direct parent.")
    (is (= (revision db-before ancestor) (revision @conn ancestor)))
    (is (= (revision db-before page) (revision @conn page)))))

(deftest nested-delete-keeps-surviving-parent-revision-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "ancestor"
                          :build/children [{:block/title "parent"
                                            :build/children [{:block/title "deleted"}]}]}]}])
        db-before @conn
        ancestor (db-test/find-block-by-content db-before "ancestor")
        parent (db-test/find-block-by-content db-before "parent")
        deleted (db-test/find-block-by-content db-before "deleted")
        page (:block/page deleted)]
    (with-transact-pipeline
      #(outliner-core/delete-blocks! conn [deleted] {}))
    (is (nil? (d/entity @conn [:block/uuid (:block/uuid deleted)])))
    (is (= (revision db-before parent) (revision @conn parent))
        "Deleting a child does not revise its surviving direct parent.")
    (is (= (revision db-before ancestor) (revision @conn ancestor)))
    (is (= (revision db-before page) (revision @conn page)))))

(deftest direct-child-visibility-keeps-its-membership-owner-revision-test
  (doseq [[label attr value-for]
          [["recycled child"
            :logseq.property/deleted-at
            (constantly 1000)]
           ["text property value"
            :logseq.property/created-from-property
            (fn [{:keys [property]}]
              (:db/id property))]]]
    (testing label
      (let [conn (db-test/create-conn-with-blocks
                  [{:page {:block/title "page1"}
                    :blocks [{:block/title "ancestor"
                              :build/children [{:block/title "parent"
                                                :build/children [{:block/title "child"}]}]}]}])
            initial-db @conn
            initial-ancestor (db-test/find-block-by-content initial-db "ancestor")
            initial-parent (db-test/find-block-by-content initial-db "parent")
            initial-child (db-test/find-block-by-content initial-db "child")
            initial-page (:block/page initial-child)
            property (d/entity initial-db :logseq.property/query)
            _ (d/transact!
               conn
               [[:db/add (:db/id initial-page) :block/tx-id 10]
                [:db/add (:db/id initial-ancestor) :block/tx-id 10]
                [:db/add (:db/id initial-parent) :block/tx-id 10]
                [:db/add (:db/id initial-child) :block/tx-id 10]])
            db-before @conn
            ancestor (d/entity db-before (:db/id initial-ancestor))
            parent (d/entity db-before (:db/id initial-parent))
            child (d/entity db-before (:db/id initial-child))
            page (:block/page child)
            child-uuid (:block/uuid child)
            value (value-for {:property property})]
        (is (= [[child-uuid (:block/order child)]]
               (:items (block-handler/direct-children-membership db-before
                                                                 (:block/uuid parent)))))
        (with-transact-pipeline
          #(ldb/transact! conn [[:db/add (:db/id child) attr value]]))
        (let [hidden-db @conn
              hidden-parent-revision (revision hidden-db parent)]
          (is (= (revision db-before parent) hidden-parent-revision)
              "Hiding a direct child does not revise the membership owner.")
          (is (empty? (:items (block-handler/direct-children-membership
                               hidden-db
                               (:block/uuid parent)))))
          (is (= (revision db-before ancestor) (revision hidden-db ancestor)))
          (is (= (revision db-before page) (revision hidden-db page)))

          (with-transact-pipeline
            #(ldb/transact! conn [[:db/retract (:db/id child) attr value]]))
          (is (= hidden-parent-revision (revision @conn parent))
              "Showing a direct child does not revise the membership owner.")
          (is (= [[child-uuid (:block/order child)]]
                 (:items (block-handler/direct-children-membership
                          @conn
                          (:block/uuid parent))))))))))

(deftest renderer-hook-uses-explicit-resource-affected-keys-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "before"}]}])
        block (db-test/find-block-by-content @conn "before")
        block-uuid (:block/uuid block)
        tx-report (assoc (d/with @conn [[:db/add (:db/id block)
                                        :block/title
                                        "after"]])
                         :tx-meta {})
        result (worker-pipeline/invoke-hooks conn tx-report {})]
    (is (= #{[:graph]
             [:entity block-uuid]
             [:attr :block/title]
             [:property-membership :block/title]
             [:unlinked-index]}
           (:affected-keys result)))))

(deftest referenced-entity-content-change-invalidates-owning-block-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "ordered"}]}])
        block (db-test/find-block-by-content @conn "ordered")
        value-uuid (random-uuid)
        value-report (d/with @conn [{:block/uuid value-uuid
                                     :block/title "before"
                                     :logseq.property/created-from-property
                                     :logseq.property/order-list-type}])
        db-with-value (:db-after value-report)
        value (d/entity db-with-value [:block/uuid value-uuid])
        reference-report (d/with db-with-value
                                 [[:db/add (:db/id block)
                                   :logseq.property/order-list-type
                                   (:db/id value)]])
        db-before (:db-after reference-report)
        tx-report (assoc (d/with db-before
                                 [[:db/add (:db/id value)
                                   :block/title
                                   "number"]])
                         :tx-meta {})
        result (worker-pipeline/transact-pipeline tx-report)]
    (is (not= (revision db-before block)
              (revision (:db-after result) block))
        "Changing projected reference content must revise every owning block.")))

(deftest referenced-entity-timestamp-change-does-not-revise-rendered-blocks-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "owner"}]}])
        page (ldb/get-page @conn "page1")
        owner (db-test/find-block-by-content @conn "owner")
        _ (d/transact! conn [[:db/add (:db/id owner) :block/refs (:db/id page)]
                             [:db/add (:db/id page) :block/tx-id 10]
                             [:db/add (:db/id owner) :block/tx-id 10]])
        db-before @conn
        tx-report (assoc (d/with db-before
                                 [[:db/add (:db/id page)
                                   :block/updated-at
                                   (js/Date.now)]])
                         :tx-meta {})
        result (worker-pipeline/transact-pipeline tx-report)]
    (is (= (revision db-before page)
           (revision (:db-after result) page)))
    (is (= (revision db-before owner)
           (revision (:db-after result) owner))
        "A non-rendered timestamp must not fan out revisions to reference owners.")))

(deftest property-assignment-revises-block-only-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "parent"
                          :build/children [{:block/title "block"}]}]}])
        db-before @conn
        block (db-test/find-block-by-content db-before "block")
        parent (:block/parent block)
        page (:block/page block)]
    (with-transact-pipeline
      #(ldb/transact! conn [[:db/add (:db/id block)
                             :logseq.property/publishing-public?
                             true]]))
    (is (not= (revision db-before block) (revision @conn block))
        "Assigning a property revises the owning block.")
    (is (= (revision db-before parent) (revision @conn parent)))
    (is (= (revision db-before page) (revision @conn page)))))

(deftest collapsed-state-revises-parent-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "parent"}]}])
        db-before @conn
        parent (db-test/find-block-by-content db-before "parent")]
    (with-transact-pipeline
      #(ldb/transact! conn [[:db/add (:db/id parent) :block/collapsed? true]]))
    (is (not= (revision db-before parent) (revision @conn parent))
        "Collapsed state belongs to the parent entity revision.")))

(deftest direct-page-update-revises-page-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "before"}}])
        db-before @conn
        page (ldb/get-page db-before "before")]
    (with-transact-pipeline
      #(ldb/transact! conn [[:db/add (:db/id page) :block/title "after"]]))
    (is (not= (revision db-before page) (revision @conn page))
        "Pages are block entities and own their direct data revision.")))

(deftest temp-inner-mutations-enter-the-pipeline-once-at-the-final-live-commit-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "before"}]}])
        block (db-test/find-block-by-content @conn "before")
        block-id (:db/id block)
        _ (d/transact! conn [[:db/add block-id :block/tx-id 10]])
        db-before @conn
        outer-tx-meta {:rtc-tx? true
                       :with-local-changes? true}
        original-pipeline @ldb/*transact-pipeline-fn
        pipeline-metas (atom [])
        live-reports (atom [])]
    (d/listen! conn ::capture-formal-outer-commit
               #(swap! live-reports conj %))
    (try
      (ldb/register-transact-pipeline-fn!
       (fn [tx-report]
         (swap! pipeline-metas conj (:tx-meta tx-report))
         (worker-pipeline/transact-pipeline tx-report)))
      (ldb/batch-transact-with-temp-conn!
       conn
       outer-tx-meta
       (fn [temp-conn _batch-tx-data]
         (ldb/transact! temp-conn
                        [[:db/add block-id :block/title "reversed"]]
                        {:reverse? true
                         :skip-validate-db? true})
         (ldb/transact! temp-conn
                        [[:db/add block-id :block/title "remote"]]
                        {:transact-remote? true})
         (ldb/transact! temp-conn
                        [[:db/add block-id :block/title "rebased"]]
                        {:outliner-op :rebase})))
      (finally
        (d/unlisten! conn ::capture-formal-outer-commit)
        (reset! ldb/*transact-pipeline-fn original-pipeline)))
    (is (= [outer-tx-meta] @pipeline-metas)
        "Only the final live commit is a formal transaction.")
    (is (= 1 (count @live-reports)))
    (is (= outer-tx-meta (:tx-meta (first @live-reports))))
    (is (= "rebased" (:block/title (d/entity @conn block-id))))
    (is (not= (revision db-before block) (revision @conn block)))
    (is (= (get-in (first @live-reports) [:tempids :db/current-tx])
           (revision @conn block))
        "The final formal commit supplies the canonical local block revision.")))

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
        ;; Shift subsequent built-in eids without leaving invalid datoms in the export.
        _ (d/transact! source-conn [{:db/id 1 :block/uuid (random-uuid)}])
        _ (d/transact! source-conn [[:db/retractEntity 1]])
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

(deftest imported-data-rebuilds-block-refs-in-the-formal-pipeline-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}}
               {:page {:block/title "target"}}])
        page (ldb/get-page @conn "page1")
        target (ldb/get-page @conn "target")
        block-uuid (random-uuid)]
    (ldb/register-transact-pipeline-fn! worker-pipeline/transact-pipeline)
    (try
      (ldb/transact! conn
                     [{:block/uuid block-uuid
                       :block/title (page-ref/->page-ref (:block/uuid target))
                       :block/created-at 1000
                       :block/updated-at 1000
                       :block/page (:db/id page)
                       :block/parent (:db/id page)
                       :block/order "a0"}]
                     {::sqlite-export/imported-data? true})
      (let [block (d/entity @conn [:block/uuid block-uuid])]
        (is (= [(:block/uuid target)]
               (mapv :block/uuid (:block/refs block)))
            "Imported block refs must be rebuilt before the canonical delta is published."))
      (finally
        (ldb/register-transact-pipeline-fn! identity)))))

(deftest batch-import-edn-invalid-datom-format-does-not-change-db-test
  (let [conn (sqlite-export/create-conn)
        page-class-id (:db/id (d/entity @conn :logseq.class/Page))
        invalid-export-edn {::sqlite-export/export-type :graph
                            ::sqlite-export/graph-format :datoms
                            :datoms [[1 :block/title "Orphan Page"]
                                     [1 :block/name "orphan page"]
                                     [1 :block/uuid #uuid "33333333-3333-4333-8333-000000000001"]
                                     [1 :block/tags 2]
                                     [2 :block/title "Page"]
                                     [2 :block/name "page"]
                                     [2 :db/ident :logseq.class/Page]
                                     [2 :block/uuid #uuid "33333333-3333-4333-8333-000000000002"]]}]
    (ldb/register-transact-pipeline-fn! worker-pipeline/transact-pipeline)
    (try
      (let [result (silence-stderr
                    #(outliner-op/apply-ops!
                      conn
                      [[:batch-import-edn [invalid-export-edn {:tx-meta {:import-db? true}}]]]
                      {}))]
        (is (string? (:error result)))
        (is (= page-class-id (:db/id (d/entity @conn :logseq.class/Page)))
            "Invalid datom import should not replace the existing graph"))
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
              raw-title (raw-block-title @conn inserted-block)]
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
          expected-tomorrow-name (default-journal-page-name tomorrow)
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
              expected-raw-title (when tomorrow-page
                                   (str "date " (page-ref/->page-ref (:block/uuid tomorrow-page))))
              inserted-block (when expected-raw-title
                               (db-test/find-block-by-content @conn expected-raw-title))
              raw-title (raw-block-title @conn inserted-block)]
          (is (some? tomorrow-page))
          (is (= expected-tomorrow-title (:block/title tomorrow-page)))
          (is (= expected-tomorrow-name (:block/name tomorrow-page)))
          (is (some? inserted-block))
          (is (= expected-raw-title raw-title))
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
            raw-title (raw-block-title @conn inserted-block)]
        (is (some? inserted-block))
        (is (= (str "auto " (page-ref/->page-ref (:block/uuid target-page)))
               raw-title))
        (is (= "auto [[Target Page]]" (:block/title inserted-block)))
        (is (= [(:block/uuid target-page)]
               (mapv :block/uuid (:block/refs inserted-block)))))
      (finally
        ;; return global fn back to previous behavior
        (ldb/register-transact-pipeline-fn! identity)))))

(deftest tag-template-insertion-creates-missing-journal-ref-test
  (let [today (date-time-util/ms->journal-day (js/Date.))
        tomorrow (date-time-util/ms->journal-day (+ (js/Date.now) (* 24 60 60 1000)))
        journal-title-format "yyyy-MM-dd"
        expected-tomorrow-title (date-time-util/int->journal-title tomorrow journal-title-format)
        expected-tomorrow-name (default-journal-page-name tomorrow)
        conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:build/journal today}
                 :blocks [{:block/title "target block"}]}
                {:page {:block/title "Templates"}
                 :blocks [{:block/title "tag template root"
                           :build/children [{:block/title "auto <% tomorrow %>"}]}]}]
               :classes {:DiaryEntry {}}})
        target-block (db-test/find-block-by-content @conn "target block")
        template-root (db-test/find-block-by-content @conn "tag template root")
        diary-entry (ldb/get-page @conn "DiaryEntry")]
    (ldb/transact! conn [[:db/add :logseq.class/Journal :logseq.property.journal/title-format journal-title-format]
                         [:db/add (:db/id template-root)
                          :logseq.property/template-applied-to
                          (:db/id diary-entry)]])
    (ldb/register-transact-pipeline-fn! worker-pipeline/transact-pipeline)
    (try
      (is (nil? (db-test/find-journal-by-journal-day @conn tomorrow)))
      (ldb/transact! conn [[:db/add (:db/id target-block) :block/tags (:db/id diary-entry)]])
      (let [tomorrow-page (db-test/find-journal-by-journal-day @conn tomorrow)
            expected-raw-title (when tomorrow-page
                                 (str "auto " (page-ref/->page-ref (:block/uuid tomorrow-page))))
            inserted-block (when expected-raw-title
                             (db-test/find-block-by-content @conn expected-raw-title))
            raw-title (raw-block-title @conn inserted-block)]
        (is (some? tomorrow-page))
        (is (= expected-tomorrow-title (:block/title tomorrow-page)))
        (is (= expected-tomorrow-name (:block/name tomorrow-page)))
        (is (some? inserted-block))
        (is (= expected-raw-title raw-title))
        (is (= (str "auto " (page-ref/->page-ref (:block/title tomorrow-page)))
               (:block/title inserted-block)))
        (is (= [(:block/uuid tomorrow-page)]
               (mapv :block/uuid (:block/refs inserted-block)))))
      (finally
        (ldb/register-transact-pipeline-fn! identity)))))

(deftest tag-template-journal-ref-survives-cli-upsert-property-history-tx-test
  (let [today (date-time-util/ms->journal-day (js/Date.))
        tomorrow (date-time-util/ms->journal-day (+ (js/Date.now) (* 24 60 60 1000)))
        conn (db-test/create-conn-with-blocks
              {:pages-and-blocks
               [{:page {:build/journal today}}
                {:page {:block/title "Templates"}
                 :blocks [{:block/title "tag template root"
                           :build/children [{:block/title "auto <% tomorrow %>"}]}]}]
               :classes {:DiaryEntry {}}})
        today-page (db-test/find-journal-by-journal-day @conn today)
        target-block-uuid (random-uuid)
        template-root (db-test/find-block-by-content @conn "tag template root")
        diary-entry (ldb/get-page @conn "DiaryEntry")]
    (ldb/transact! conn [[:db/add (:db/id template-root)
                          :logseq.property/template-applied-to
                          (:db/id diary-entry)]])
    (ldb/register-transact-pipeline-fn! worker-pipeline/transact-pipeline)
    (try
      (outliner-op/apply-ops! conn [[:insert-blocks [[{:block/uuid target-block-uuid
                                                        :block/title "target block"}]
                                                      (:block/uuid today-page)
                                                      {:outliner-op :insert-blocks
                                                       :keep-uuid? true
                                                       :bottom? true}]]
                                    [:batch-set-property [[target-block-uuid]
                                                          :logseq.property/status
                                                          :logseq.property/status.done
                                                          {}]]
                                    [:batch-set-property [[target-block-uuid]
                                                          :block/tags
                                                          (:db/id diary-entry)
                                                          {}]]]
                               {})
      (let [target-block (db-test/find-block-by-content @conn "target block")
            tomorrow-page (db-test/find-journal-by-journal-day @conn tomorrow)
            expected-raw-title (str "auto " (page-ref/->page-ref (:block/uuid tomorrow-page)))
            inserted-block (db-test/find-block-by-content @conn expected-raw-title)]
        (is (= 1 (count (:logseq.property.history/_block target-block)))
            "The CLI-style batched outliner ops create property history before tag template tx-data")
        (is (some? inserted-block))
        (is (= [(:block/uuid tomorrow-page)]
               (mapv :block/uuid (:block/refs inserted-block)))))
      (finally
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
