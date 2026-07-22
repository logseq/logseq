(ns frontend.worker.render-affected-keys-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.render-affected-keys :as render-affected-keys]))

(def ^:private schema
  {:db/ident {:db/unique :db.unique/identity}
   :block/uuid {:db/unique :db.unique/identity}
   :block/tags {:db/valueType :db.type/ref
                :db/cardinality :db.cardinality/many}
   :block/refs {:db/valueType :db.type/ref
                :db/cardinality :db.cardinality/many}
   :block/alias {:db/valueType :db.type/ref
                 :db/cardinality :db.cardinality/many}
   :block/parent {:db/valueType :db.type/ref}
   :block/page {:db/valueType :db.type/ref}
   :logseq.property/status {:db/valueType :db.type/ref}
   :logseq.property/default-value {:db/valueType :db.type/ref}
   :logseq.property.class/properties {:db/valueType :db.type/ref
                                      :db/cardinality :db.cardinality/many}
   :block/closed-value-property {:db/valueType :db.type/ref
                                 :db/cardinality :db.cardinality/many}
   :logseq.property/created-from-property {:db/valueType :db.type/ref}
   :logseq.property.comments/blocks {:db/valueType :db.type/ref
                                     :db/cardinality :db.cardinality/many}
   :logseq.property.history/block {:db/valueType :db.type/ref}
   :logseq.property.history/property {:db/valueType :db.type/ref}
   :logseq.property.history/ref-value {:db/valueType :db.type/ref}
   :logseq.property.reaction/target {:db/valueType :db.type/ref}
   :logseq.property/view-for {:db/valueType :db.type/ref}
   :logseq.property.class/extends {:db/valueType :db.type/ref
                                   :db/cardinality :db.cardinality/many}
   :logseq.property/classes {:db/valueType :db.type/ref
                             :db/cardinality :db.cardinality/many}
   :user.property/target {:db/valueType :db.type/ref}
   :plugin.property.example/target {:db/valueType :db.type/ref}})

(defn- db-with
  [entities]
  (d/db-with (d/empty-db schema) entities))

(defn- affected-keys
  [db-before tx-data]
  (render-affected-keys/affected-keys (d/with db-before tx-data)))

(defn- keys-with-tag
  [tag keys]
  (into #{} (filter #(= tag (first %))) keys))

(deftest direct-children-invalidation-follows-membership-and-order-test
  (let [parent-before-uuid (random-uuid)
        parent-after-uuid (random-uuid)
        child-uuid (random-uuid)
        db (db-with [{:db/id 10 :block/uuid parent-before-uuid}
                     {:db/id 11 :block/uuid parent-after-uuid}
                     {:db/id 12
                      :block/uuid child-uuid
                      :block/title "Child"
                      :block/parent 10
                      :block/order "a0"}])
        children-keys #(keys-with-tag :children %)]
    (testing "adding and removing a direct child"
      (let [db-without-child (db-with [{:db/id 10 :block/uuid parent-before-uuid}])]
        (is (= #{[:children parent-before-uuid]}
               (children-keys
                (affected-keys
                 db-without-child
                 [{:db/id 12
                   :block/uuid child-uuid
                   :block/parent 10
                   :block/order "a0"}])))))
      (is (= #{[:children parent-before-uuid]}
             (children-keys
              (affected-keys db [[:db/retractEntity 12]])))))
    (testing "moving a child invalidates both parents"
      (is (= #{[:children parent-before-uuid]
               [:children parent-after-uuid]}
             (children-keys
              (affected-keys db [[:db/add 12 :block/parent 11]])))))
    (testing "ordering and visibility invalidate the current parent"
      (doseq [tx-data [[[:db/add 12 :block/order "b0"]]
                       [[:db/add 12 :block/closed-value-property 11]]
                       [[:db/add 12 :logseq.property/created-from-property 11]]
                       [[:db/add 12 :logseq.property/deleted-at 1000]]]]
        (is (= #{[:children parent-before-uuid]}
               (children-keys (affected-keys db tx-data))))))
    (testing "renaming a child does not invalidate membership"
      (is (= #{}
             (children-keys
              (affected-keys db [[:db/add 12 :block/title "Renamed"]])))))))

(deftest route-page-invalidation-is-limited-to-heading-candidates-test
  (let [page-before-uuid (random-uuid)
        page-after-uuid (random-uuid)
        reference-before-uuid (random-uuid)
        reference-after-uuid (random-uuid)
        heading-uuid (random-uuid)
        plain-block-uuid (random-uuid)
        db (db-with [{:db/id 10 :block/uuid page-before-uuid}
                     {:db/id 11 :block/uuid page-after-uuid}
                     {:db/id 12 :block/uuid reference-before-uuid
                      :block/title "Before reference"}
                     {:db/id 13 :block/uuid reference-after-uuid
                      :block/title "After reference"}
                     {:db/id 14
                      :block/uuid heading-uuid
                      :block/title "Heading"
                      :block/page 10
                      :block/refs 12
                      :logseq.property/heading 2}
                     {:db/id 15
                      :block/uuid plain-block-uuid
                      :block/title "Plain"
                      :block/page 10}])
        route-page-keys #(keys-with-tag :route-page %)]
    (testing "candidate title, refs, tags, and heading changes"
      (doseq [tx-data [[[:db/add 14 :block/title "Renamed heading"]]
                       [[:db/retract 14 :block/refs 12]
                        [:db/add 14 :block/refs 13]]
                       [[:db/add 14 :block/tags 13]]
                       [[:db/retract 14 :logseq.property/heading 2]]]]
        (is (= #{[:route-page page-before-uuid]}
               (route-page-keys (affected-keys db tx-data))))))
    (testing "moving a candidate invalidates the old and new page scopes"
      (is (= #{[:route-page page-before-uuid]
               [:route-page page-after-uuid]}
             (route-page-keys
              (affected-keys db [[:db/add 14 :block/page 11]])))))
    (testing "adding heading status makes an existing block a candidate"
      (is (= #{[:route-page page-before-uuid]}
             (route-page-keys
              (affected-keys
               db
               [[:db/add 15 :logseq.property/heading 2]])))))
    (testing "unrelated plain block and referenced-title changes stay exact"
      (is (= #{}
             (route-page-keys
              (affected-keys db [[:db/add 15 :block/title "Still plain"]]))))
      (let [keys (affected-keys
                  db
                  [[:db/add 12 :block/title "Renamed reference"]])]
        (is (= #{} (route-page-keys keys)))
        (is (contains? keys [:entity reference-before-uuid])
            "Referenced entities invalidate through their exact entity key.")))))

(deftest graph-invalidation-is-always-present-and-transaction-stamps-are-ignored-test
  (let [block-uuid (random-uuid)
        db (db-with [{:db/id 10
                      :block/uuid block-uuid
                      :block/tx-id 10}])]
    (is (= #{[:graph]}
           (affected-keys db [])))
    (is (= #{[:graph]}
           (affected-keys db [[:db/add 10 :block/tx-id 11]]))
        "Pipeline transaction stamps are transport metadata, not resource dependencies.")))

(deftest semantic-attributes-invalidate-the-entity-and-property-membership-test
  (let [block-uuid (random-uuid)
        property-ident :user.property/priority
        db (db-with [{:db/id 10
                      :block/uuid block-uuid
                      property-ident "low"}])]
    (is (= #{[:graph]
             [:entity block-uuid]
             [:attr property-ident]
             [:property-membership property-ident]}
           (affected-keys db [[:db/add 10 property-ident "high"]])))))

(deftest page-identity-invalidation-uses-old-and-new-lookups-test
  (let [old-uuid (random-uuid)
        new-uuid (random-uuid)
        db (db-with [{:db/id 10
                      :block/uuid old-uuid
                      :block/name "old page"}])]
    (is (= #{[:graph]
             [:entity old-uuid]
             [:entity new-uuid]
             [:attr :block/uuid]
             [:attr :block/name]
             [:property-membership :block/uuid]
             [:property-membership :block/name]
             [:page-lookup old-uuid]
             [:page-lookup new-uuid]
             [:page-lookup "old page"]
             [:page-lookup "new page"]
             [:page-membership]}
           (affected-keys db [{:db/id 10
                               :block/uuid new-uuid
                               :block/name "new page"}])))))

(deftest page-visibility-invalidates-page-membership-and-unlinked-references-test
  (let [page-uuid (random-uuid)
        db (db-with [{:db/id 10
                      :block/uuid page-uuid
                      :block/name "page"
                      :block/title "Page"}])]
    (is (= #{[:graph]
             [:entity page-uuid]
             [:attr :logseq.property/deleted-at]
             [:property-membership :logseq.property/deleted-at]
             [:page-membership]
             [:unlinked-index]}
           (affected-keys db [[:db/add 10 :logseq.property/deleted-at 1000]])))))

(deftest journal-membership-follows-journal-identity-and-visibility-test
  (let [journal-tag-uuid (random-uuid)
        journal-uuid (random-uuid)
        db (db-with [{:db/id 1
                      :db/ident :logseq.class/Journal
                      :block/uuid journal-tag-uuid}
                     {:db/id 10
                      :block/uuid journal-uuid
                      :block/name "journal"
                      :block/title "Journal"
                      :block/journal-day 20260720
                      :block/tags 1}])]
    (testing "journal day changes"
      (is (= #{[:graph]
               [:entity journal-uuid]
               [:attr :block/journal-day]
               [:property-membership :block/journal-day]
               [:journals]}
             (affected-keys db [[:db/add 10 :block/journal-day 20260721]]))))
    (testing "recycling a journal"
      (is (= #{[:graph]
               [:entity journal-uuid]
               [:attr :logseq.property/deleted-at]
               [:property-membership :logseq.property/deleted-at]
               [:page-membership]
               [:journals]
               [:unlinked-index]}
             (affected-keys db [[:db/add 10 :logseq.property/deleted-at 1000]]))))))

(deftest reaction-invalidation-resolves-targets-from-both-databases-test
  (let [target-before-uuid (random-uuid)
        target-after-uuid (random-uuid)
        reaction-uuid (random-uuid)
        db (db-with [{:db/id 10 :block/uuid target-before-uuid}
                     {:db/id 11 :block/uuid target-after-uuid}
                     {:db/id 12
                      :block/uuid reaction-uuid
                      :logseq.property.reaction/target 10
                      :logseq.property.reaction/emoji-id "old"}])]
    (testing "moving a reaction invalidates the old and new target"
      (is (= #{[:graph]
               [:entity reaction-uuid]
               [:attr :logseq.property.reaction/target]
               [:property-membership :logseq.property.reaction/target]
               [:reactions target-before-uuid]
               [:reactions target-after-uuid]}
             (affected-keys
              db
              [[:db/add 12 :logseq.property.reaction/target 11]]))))
    (testing "editing a reaction still invalidates its unchanged target"
      (is (= #{[:graph]
               [:entity reaction-uuid]
               [:attr :logseq.property.reaction/emoji-id]
               [:property-membership :logseq.property.reaction/emoji-id]
               [:reactions target-before-uuid]}
             (affected-keys
              db
              [[:db/add 12 :logseq.property.reaction/emoji-id "new"]]))))))

(deftest view-definition-invalidation-uses-before-and-after-owner-feature-pairs-test
  (let [owner-before-uuid (random-uuid)
        owner-after-uuid (random-uuid)
        view-uuid (random-uuid)
        db (db-with [{:db/id 10 :block/uuid owner-before-uuid}
                     {:db/id 11 :block/uuid owner-after-uuid}
                     {:db/id 12
                      :block/uuid view-uuid
                      :block/order "a0"
                      :logseq.property/view-for 10
                      :logseq.property.view/feature-type :class-objects}])]
    (testing "owner and feature changes produce two real pairs, not a Cartesian product"
      (is (= #{[:graph]
               [:entity view-uuid]
               [:attr :logseq.property/view-for]
               [:attr :logseq.property.view/feature-type]
               [:property-membership :logseq.property/view-for]
               [:property-membership :logseq.property.view/feature-type]
               [:views owner-before-uuid :class-objects]
               [:views owner-after-uuid :linked-references]}
             (affected-keys
              db
              [{:db/id 12
                :logseq.property/view-for 11
                :logseq.property.view/feature-type :linked-references}]))))
    (testing "ordering a view invalidates its current definition list"
      (is (= #{[:graph]
               [:entity view-uuid]
               [:attr :block/order]
               [:property-membership :block/order]
               [:views owner-before-uuid :class-objects]}
             (affected-keys db [[:db/add 12 :block/order "b0"]]))))))

(deftest class-membership-invalidation-uses-old-and-new-classes-test
  (let [class-before-uuid (random-uuid)
        class-after-uuid (random-uuid)
        object-uuid (random-uuid)
        db (db-with [{:db/id 10 :block/uuid class-before-uuid}
                     {:db/id 11 :block/uuid class-after-uuid}
                     {:db/id 12
                      :block/uuid object-uuid
                      :block/tags 10}])]
    (is (= #{[:graph]
             [:entity object-uuid]
             [:attr :block/tags]
             [:property-membership :block/tags]
             [:display-properties object-uuid]
             [:class-membership class-before-uuid]
             [:class-membership class-after-uuid]}
           (affected-keys db [[:db/retract 12 :block/tags 10]
                              [:db/add 12 :block/tags 11]])))))

(deftest class-hierarchy-and-aliases-invalidate-reference-scope-test
  (let [class-uuid (random-uuid)
        parent-before-uuid (random-uuid)
        parent-after-uuid (random-uuid)
        alias-before-uuid (random-uuid)
        alias-after-uuid (random-uuid)
        db (db-with [{:db/id 10
                      :block/uuid class-uuid
                      :logseq.property.class/extends 11
                      :block/alias 13}
                     {:db/id 11 :block/uuid parent-before-uuid}
                     {:db/id 12 :block/uuid parent-after-uuid}
                     {:db/id 13 :block/uuid alias-before-uuid}
                     {:db/id 14 :block/uuid alias-after-uuid}])]
    (testing "class hierarchy"
      (is (= #{[:graph]
               [:entity class-uuid]
               [:attr :logseq.property.class/extends]
               [:property-membership :logseq.property.class/extends]
               [:class-tree]
               [:ref-scope]}
             (affected-keys db [[:db/retract 10 :logseq.property.class/extends 11]
                                [:db/add 10 :logseq.property.class/extends 12]]))))
    (testing "aliases"
      (is (= #{[:graph]
               [:entity class-uuid]
               [:attr :block/alias]
               [:property-membership :block/alias]
               [:ref-scope]}
             (affected-keys db [[:db/retract 10 :block/alias 13]
                                [:db/add 10 :block/alias 14]]))))))

(deftest reference-invalidation-uses-old-and-new-targets-test
  (let [target-before-uuid (random-uuid)
        target-after-uuid (random-uuid)
        ref-block-uuid (random-uuid)
        db (db-with [{:db/id 10 :block/uuid target-before-uuid}
                     {:db/id 11 :block/uuid target-after-uuid}
                     {:db/id 12
                      :block/uuid ref-block-uuid
                      :block/title "Reference"
                      :block/refs 10}])]
    (is (= #{[:graph]
             [:entity ref-block-uuid]
             [:attr :block/refs]
             [:property-membership :block/refs]
             [:refs target-before-uuid]
             [:refs target-after-uuid]
             [:unlinked-index]}
           (affected-keys db [[:db/retract 12 :block/refs 10]
                              [:db/add 12 :block/refs 11]])))))

(deftest ref-bearing-block-content-structure-and-visibility-invalidate-its-target-test
  (let [target-uuid (random-uuid)
        parent-before-uuid (random-uuid)
        parent-after-uuid (random-uuid)
        ref-block-uuid (random-uuid)
        db (db-with [{:db/id 10 :block/uuid target-uuid}
                     {:db/id 11 :block/uuid parent-before-uuid}
                     {:db/id 12 :block/uuid parent-after-uuid}
                     {:db/id 13
                      :block/uuid ref-block-uuid
                      :block/title "Before"
                      :block/parent 11
                      :block/refs 10}])
        common #{[:graph]
                 [:entity ref-block-uuid]
                 [:refs target-uuid]}]
    (testing "content"
      (is (= (into common
                   #{[:attr :block/title]
                     [:property-membership :block/title]
                     [:unlinked-index]})
             (affected-keys db [[:db/add 13 :block/title "After"]]))))
    (testing "structure"
      (is (= (into common
                   #{[:attr :block/parent]
                     [:property-membership :block/parent]
                     [:children parent-before-uuid]
                     [:children parent-after-uuid]})
             (affected-keys db [[:db/add 13 :block/parent 12]]))))
    (testing "visibility"
      (is (= (into common
                   #{[:attr :logseq.property/deleted-at]
                     [:property-membership :logseq.property/deleted-at]
                     [:children parent-before-uuid]
                     [:unlinked-index]})
             (affected-keys db [[:db/add 13 :logseq.property/deleted-at 1000]]))))))

(deftest comments-invalidation-resolves-old-and-new-thread-targets-test
  (let [comments-tag-uuid (random-uuid)
        target-before-uuid (random-uuid)
        target-after-uuid (random-uuid)
        comments-area-uuid (random-uuid)
        db (db-with [{:db/id 1
                      :db/ident :logseq.class/Comments
                      :block/uuid comments-tag-uuid}
                     {:db/id 10 :block/uuid target-before-uuid}
                     {:db/id 11 :block/uuid target-after-uuid}
                     {:db/id 12
                      :block/uuid comments-area-uuid
                      :block/tags 1
                      :logseq.property.comments/blocks 10}])]
    (testing "thread target assignment"
      (is (= #{[:comments target-before-uuid]
               [:comments target-after-uuid]}
             (keys-with-tag
              :comments
              (affected-keys
               db
               [[:db/retract 12 :logseq.property.comments/blocks 10]
                [:db/add 12 :logseq.property.comments/blocks 11]])))))
    (testing "comments tag removal"
      (is (= #{[:comments target-before-uuid]}
             (keys-with-tag
              :comments
              (affected-keys db [[:db/retract 12 :block/tags 1]])))))
    (testing "comments area deletion"
      (is (= #{[:comments target-before-uuid]}
             (keys-with-tag
              :comments
              (affected-keys db [[:db/add 12 :logseq.property/deleted-at 1000]])))))
    (testing "comments area reorder"
      (is (= #{[:comments target-before-uuid]}
             (keys-with-tag
              :comments
              (affected-keys db [[:db/add 12 :block/order "a0"]])))))))

(deftest task-time-invalidation-covers-history-lifecycle-and-edits-test
  (let [task-before-uuid (random-uuid)
        task-after-uuid (random-uuid)
        history-uuid (random-uuid)
        status-property-uuid (random-uuid)
        other-property-uuid (random-uuid)
        status-before-uuid (random-uuid)
        status-after-uuid (random-uuid)
        base-entities [{:db/id 10 :block/uuid task-before-uuid}
                       {:db/id 11 :block/uuid task-after-uuid}
                       {:db/id 12
                        :db/ident :logseq.property/status
                        :block/uuid status-property-uuid}
                       {:db/id 13
                        :db/ident :user.property/other
                        :block/uuid other-property-uuid}
                       {:db/id 14
                        :db/ident :logseq.property/status.doing
                        :block/uuid status-before-uuid}
                       {:db/id 15
                        :db/ident :logseq.property/status.done
                        :block/uuid status-after-uuid}]
        history {:db/id 16
                 :block/uuid history-uuid
                 :block/created-at 1000
                 :logseq.property.history/block 10
                 :logseq.property.history/property 12
                 :logseq.property.history/ref-value 14}
        db-without-history (db-with base-entities)
        db (db-with (conj base-entities history))
        task-time-keys #(keys-with-tag :task-time %)]
    (testing "history creation and deletion"
      (is (= #{[:task-time task-before-uuid]}
             (task-time-keys (affected-keys db-without-history [history]))))
      (is (= #{[:task-time task-before-uuid]}
             (task-time-keys
              (affected-keys db [[:db/retractEntity 16]])))))
    (testing "history fields"
      (doseq [tx-data [[[:db/add 16 :block/created-at 2000]]
                       [[:db/add 16 :logseq.property.history/property 13]]
                       [[:db/add 16 :logseq.property.history/ref-value 15]]]]
        (is (= #{[:task-time task-before-uuid]}
               (task-time-keys (affected-keys db tx-data))))))
    (testing "moving history invalidates both tasks"
      (is (= #{[:task-time task-before-uuid]
               [:task-time task-after-uuid]}
             (task-time-keys
              (affected-keys
               db
               [[:db/add 16 :logseq.property.history/block 11]])))))))

(deftest task-query-invalidation-is-semantic-test
  (let [status-value-uuid (random-uuid)
        default-status-value-uuid (random-uuid)
        plain-block-uuid (random-uuid)
        db (db-with [{:db/id 1
                      :db/ident :logseq.property/status
                      :logseq.property/default-value 5}
                     {:db/id 2
                      :block/uuid status-value-uuid
                      :block/title "Doing"}
                     {:db/id 3
                      :block/uuid (random-uuid)
                      :logseq.property/status 2}
                     {:db/id 4
                      :block/uuid plain-block-uuid
                      :block/title "Plain"}
                     {:db/id 5
                      :block/uuid default-status-value-uuid
                      :block/title "Todo"}
                     {:db/id 10
                      :block/uuid (random-uuid)
                      :logseq.property.class/properties 1}])
        task-keys #(keys-with-tag :tasks (affected-keys db %))]
    (testing "ordinary block title edits do not rerun task queries"
      (is (= #{} (task-keys [[:db/add 4 :block/title "Edited"]]))))
    (testing "task status and status label edits rerun task queries"
      (is (= #{[:tasks]}
             (task-keys [[:db/retract 3 :logseq.property/status 2]])))
      (is (= #{[:tasks]}
             (task-keys [[:db/add 2 :block/title "In progress"]])))
      (is (= #{[:tasks]}
             (task-keys [[:db/add 5 :block/title "Not started"]]))))
    (testing "class membership changes can change a default task status"
      (is (= #{[:tasks]}
             (task-keys [[:db/add 4 :block/tags 10]]))))))

(deftest task-attribute-invalidation-only-follows-task-entities-test
  (let [task-uuid (random-uuid)
        default-task-uuid (random-uuid)
        plain-block-uuid (random-uuid)
        db (db-with [{:db/id 1
                      :db/ident :logseq.property/status
                      :logseq.property/default-value 2}
                     {:db/id 2 :block/uuid (random-uuid) :block/title "Doing"}
                     {:db/id 3
                      :block/uuid task-uuid
                      :logseq.property/status 2
                      :block/page 10}
                     {:db/id 4
                      :block/uuid plain-block-uuid
                      :block/page 10}
                     {:db/id 5
                      :block/uuid default-task-uuid
                      :block/tags 12
                      :block/page 10}
                     {:db/id 10 :block/uuid (random-uuid)}
                     {:db/id 11 :block/uuid (random-uuid)}
                     {:db/id 12
                      :block/uuid (random-uuid)
                      :logseq.property.class/properties 1}])
        task-attr-keys #(keys-with-tag :task-attr (affected-keys db %))]
    (testing "ordinary block insertion and movement do not invalidate task attributes"
      (is (= #{} (task-attr-keys [[:db/add 4 :block/page 11]]))))
    (testing "moving a task invalidates its task-scoped page dependency"
      (is (= #{[:task-attr :block/page]}
             (task-attr-keys [[:db/add 3 :block/page 11]])))
      (is (= #{[:task-attr :block/page]}
             (task-attr-keys [[:db/add 5 :block/page 11]]))))))

(deftest display-properties-ignore-title-and-timestamp-edits-test
  (let [block-uuid (random-uuid)
        property-uuid (random-uuid)
        db (db-with [{:db/id 1
                      :db/ident :user.property/display
                      :block/uuid property-uuid}
                     {:db/id 2
                      :block/uuid block-uuid
                      :block/title "Before"}])
        display-keys #(keys-with-tag :display-properties
                                     (affected-keys db %))]
    (is (= #{} (display-keys [[:db/add 2 :block/title "After"]])))
    (is (= #{} (display-keys [[:db/add 2 :block/updated-at 1000]])))
    (is (= #{[:display-properties block-uuid]}
           (display-keys [[:db/add 2 :user.property/display "value"]])))))

(defn- bidirectional-db
  [property-ident]
  (let [tag-uuid (random-uuid)
        class-uuid (random-uuid)
        disabled-class-uuid (random-uuid)
        property-uuid (random-uuid)
        source-uuid (random-uuid)
        target-before-uuid (random-uuid)
        target-after-uuid (random-uuid)]
    {:class-uuid class-uuid
     :disabled-class-uuid disabled-class-uuid
     :property-uuid property-uuid
     :source-uuid source-uuid
     :target-before-uuid target-before-uuid
     :target-after-uuid target-after-uuid
     :db
     (db-with [{:db/id 1
                :db/ident :logseq.class/Tag
                :block/uuid tag-uuid}
               {:db/id 2
                :block/uuid class-uuid
                :block/tags 1
                :logseq.property.class/enable-bidirectional? true}
               {:db/id 3
                :block/uuid disabled-class-uuid
                :block/tags 1
                :logseq.property.class/enable-bidirectional? false}
               {:db/id 4
               :db/ident property-ident
               :block/uuid property-uuid
               :db/valueType :db.type/ref
               :db/cardinality :db.cardinality/one
               :logseq.property/classes 2}
               {:db/id 5
                :block/uuid source-uuid
                :block/tags 2
                property-ident 6}
               {:db/id 6 :block/uuid target-before-uuid}
               {:db/id 7 :block/uuid target-after-uuid}])}))

(deftest bidirectional-invalidation-resolves-old-and-new-user-and-plugin-property-targets-test
  (doseq [property-ident [:user.property/target
                          :plugin.property.example/target]]
    (testing (str property-ident)
      (let [{:keys [db target-before-uuid target-after-uuid]}
            (bidirectional-db property-ident)]
        (is (= #{[:bidirectional target-before-uuid]
                 [:bidirectional target-after-uuid]}
               (keys-with-tag
                :bidirectional
                (affected-keys db [[:db/add 5 property-ident 7]]))))))))

(deftest bidirectional-invalidation-covers-source-membership-and-visibility-test
  (let [{:keys [db target-before-uuid]} (bidirectional-db :user.property/target)
        expected #{[:bidirectional target-before-uuid]}]
    (testing "source class membership"
      (is (= expected
             (keys-with-tag
              :bidirectional
              (affected-keys db [[:db/retract 5 :block/tags 2]])))))
    (testing "source deletion"
      (is (= expected
             (keys-with-tag
              :bidirectional
              (affected-keys db [[:db/add 5 :logseq.property/deleted-at 1000]])))))))

(deftest bidirectional-invalidation-covers-property-and-class-configuration-test
  (let [{:keys [db target-before-uuid]} (bidirectional-db :user.property/target)
        expected #{[:bidirectional target-before-uuid]}]
    (testing "property class scope"
      (is (= expected
             (keys-with-tag
              :bidirectional
              (affected-keys db [[:db/retract 4 :logseq.property/classes 2]
                                 [:db/add 4 :logseq.property/classes 3]])))))
    (testing "class enablement"
      (is (= expected
             (keys-with-tag
              :bidirectional
              (affected-keys
               db
               [[:db/add 2 :logseq.property.class/enable-bidirectional? false]])))))
    (testing "class deletion"
      (is (= expected
             (keys-with-tag
              :bidirectional
              (affected-keys db [[:db/add 2 :logseq.property/deleted-at 1000]])))))))
