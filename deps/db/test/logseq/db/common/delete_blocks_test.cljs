(ns logseq.db.common.delete-blocks-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.common.delete-blocks :as delete-blocks]
            [logseq.db.test.helper :as db-test]))

(deftest delete-blocks-removes-reactions
  (testing "reactions targeting deleted blocks are retracted"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "Page"}
                   :blocks [{:block/title "Block"}]}]})
          block (db-test/find-block-by-content @conn "Block")
          now (common-util/time-ms)
          reaction {:block/uuid (random-uuid)
                    :block/created-at now
                    :block/updated-at now
                    :logseq.property.reaction/emoji-id "+1"
                    :logseq.property.reaction/target (:db/id block)}
          _ (d/transact! conn [reaction])
          reaction-entity (first (:logseq.property.reaction/_target (d/entity @conn (:db/id block))))
          retracts [[:db/retractEntity (:db/id block)]]
          extra (delete-blocks/update-refs-history @conn retracts {})]
      (d/transact! conn (concat retracts extra))
      (is (nil? (d/entity @conn (:db/id reaction-entity)))))))

(deftest delete-blocks-expands-property-value-children
  (testing "delete-blocks retracts generated property value children"
    (let [property-value-uuid (random-uuid)
          conn (db-test/create-conn-with-blocks
                {:properties {:user.property/cli-http-prop {:logseq.property/type :default}}
                 :pages-and-blocks
                 [{:page {:block/title "Page"}
                   :blocks [{:block/title "Parent"
                             :build/properties
                             {:user.property/cli-http-prop
                              {:build/property-value :block
                               :block/title "Property value"
                               :block/uuid property-value-uuid
                               :build/keep-uuid? true}}}]}]})
          parent (db-test/find-block-by-content @conn "Parent")
          property-value (d/entity @conn [:block/uuid property-value-uuid])
          txs [[:db/retractEntity (:db/id parent)]]
          expanded (delete-blocks/expand-delete-blocks-tx @conn txs {:outliner-op :delete-blocks})]
      (is (= (:db/id parent) (:db/id (:block/parent property-value))))
      (is (some #(= [:db/retractEntity (:db/id property-value)] %) expanded)))))

(deftest delete-blocks-removes-history-with-ref-value
  (testing "property history entries referencing a deleted block are retracted"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "Page"}
                   :blocks [{:block/title "Target block"}
                            {:block/title "Choice value"}]}]})
          target-block (db-test/find-block-by-content @conn "Target block")
          choice-value-block (db-test/find-block-by-content @conn "Choice value")
          history-uuid (random-uuid)
          now (common-util/time-ms)
          _ (d/transact! conn [{:block/uuid history-uuid
                                :block/created-at now
                                :block/updated-at now
                                :logseq.property.history/block (:db/id target-block)
                                :logseq.property.history/property (:db/id (d/entity @conn :logseq.property/status))
                                :logseq.property.history/ref-value (:db/id choice-value-block)}])
          history-entity (d/entity @conn [:block/uuid history-uuid])
          retracts [[:db/retractEntity (:db/id choice-value-block)]]
          extra (delete-blocks/update-refs-history @conn retracts {})]
      (d/transact! conn (concat retracts extra))
      (is (nil? (d/entity @conn (:db/id history-entity)))))))

(deftest property-history-block-updates-are-kept
  (testing "history block updates do not delete the history entity"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "Page"}
                   :blocks [{:block/title "Target block"}
                            {:block/title "Choice value"}]}]})
          target-block (db-test/find-block-by-content @conn "Target block")
          choice-value-block (db-test/find-block-by-content @conn "Choice value")
          history-uuid (random-uuid)
          now (common-util/time-ms)
          _ (d/transact! conn [{:block/uuid history-uuid
                                :block/title "History entry"
                                :block/page (:db/id (:block/page target-block))
                                :block/parent (:db/id (:block/page target-block))
                                :block/order "a0"
                                :block/created-at now
                                :block/updated-at now
                                :logseq.property.history/block (:db/id target-block)
                                :logseq.property.history/property (:db/id (d/entity @conn :logseq.property/status))
                                :logseq.property.history/ref-value (:db/id choice-value-block)}])
          history-entity (d/entity @conn [:block/uuid history-uuid])
          txs [[:db/retract (:db/id history-entity) :block/title "History entry"]
               [:db/add (:db/id history-entity) :block/title "Updated history entry"]
               [:db/retract (:db/id history-entity) :block/parent (:db/id (:block/page history-entity))]
               [:db/add (:db/id history-entity) :block/parent (:db/id target-block)]
               [:db/retract (:db/id history-entity) :block/order "a0"]
               [:db/add (:db/id history-entity) :block/order "b0"]]
          extra (delete-blocks/update-refs-history @conn txs {})]
      (d/transact! conn (concat txs extra))
      (let [updated-history (d/entity @conn (:db/id history-entity))]
        (is (= {:block/title "Updated history entry"
                :block/parent (:db/id target-block)
                :block/order "b0"}
               {:block/title (:block/title updated-history)
                :block/parent (:db/id (:block/parent updated-history))
                :block/order (:block/order updated-history)}))))))

(deftest remote-delete-blocks-removes-history-when-owner-ref-retracted
  (testing "remote delete-blocks datoms fully retract property history blocks"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "Page"}
                   :blocks [{:block/title "Target block"}
                            {:block/title "Choice value"}]}]})
          target-block (db-test/find-block-by-content @conn "Target block")
          choice-value-block (db-test/find-block-by-content @conn "Choice value")
          history-uuid (random-uuid)
          now (common-util/time-ms)
          _ (d/transact! conn [{:block/uuid history-uuid
                                :block/created-at now
                                :block/updated-at now
                                :logseq.property.history/block (:db/id target-block)
                                :logseq.property.history/property (:db/id (d/entity @conn :logseq.property/status))
                                :logseq.property.history/ref-value (:db/id choice-value-block)}])
          history-entity (d/entity @conn [:block/uuid history-uuid])
          txs [[:db/retract (:db/id history-entity) :logseq.property.history/block (:db/id target-block)]]
          extra (delete-blocks/update-refs-history @conn txs {:outliner-op :delete-blocks})]
      (d/transact! conn (concat txs extra))
      (is (nil? (d/entity @conn (:db/id history-entity)))))))

(deftest delete-blocks-removes-new-history-for-deleted-block
  (testing "history blocks created in the same tx as their deleted owner are retracted"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "Page"}
                   :blocks [{:block/title "Target block"}
                            {:block/title "Choice value"}]}]})
          target-block (db-test/find-block-by-content @conn "Target block")
          choice-value-block (db-test/find-block-by-content @conn "Choice value")
          history-uuid (random-uuid)
          now (common-util/time-ms)
          txs [{:block/uuid history-uuid
                :block/created-at now
                :block/updated-at now
                :logseq.property.history/block (:db/id target-block)
                :logseq.property.history/property (:db/id (d/entity @conn :logseq.property/status))
                :logseq.property.history/ref-value (:db/id choice-value-block)}
               [:db/retractEntity (:db/id target-block)]]
          extra (delete-blocks/update-refs-history @conn txs {:outliner-op :delete-blocks})]
      (d/transact! conn (concat txs extra))
      (is (nil? (d/entity @conn [:block/uuid history-uuid]))))))

(deftest remote-delete-blocks-removes-new-normalized-history-when-owner-ref-retracted
  (testing "remote normalized delete-blocks datoms fully retract new property history blocks"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "Page"}
                   :blocks [{:block/title "Target block"}
                            {:block/title "Choice value"}]}]})
          target-block (db-test/find-block-by-content @conn "Target block")
          choice-value-block (db-test/find-block-by-content @conn "Choice value")
          history-uuid (random-uuid)
          history-eid 1000000
          now (common-util/time-ms)
          txs [[:db/add history-eid :block/uuid history-uuid]
               [:db/add history-eid :block/created-at now]
               [:db/add history-eid :block/updated-at now]
               [:db/add history-eid :logseq.property.history/block (:db/id target-block)]
               [:db/add history-eid :logseq.property.history/property (:db/id (d/entity @conn :logseq.property/status))]
               [:db/add history-eid :logseq.property.history/ref-value (:db/id choice-value-block)]
               [:db/retract history-eid :logseq.property.history/block (:db/id target-block)]]
          extra (delete-blocks/update-refs-history @conn txs {:outliner-op :delete-blocks})]
      (d/transact! conn (concat txs extra))
      (is (nil? (d/entity @conn [:block/uuid history-uuid]))))))

(deftest delete-page-removes-history-with-ref-value
  (testing "deleting a page retracts property history entries that referenced that page"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "Journal"}
                   :blocks [{:block/title "b1"}]}
                  {:page {:block/title "Page to delete"}}]})
          block (db-test/find-block-by-content @conn "b1")
          page (db-test/find-page-by-title @conn "Page to delete")
          history-uuid (random-uuid)
          now (common-util/time-ms)
          _ (d/transact! conn [{:block/uuid history-uuid
                                :block/created-at now
                                :block/updated-at now
                                :logseq.property.history/block (:db/id block)
                                :logseq.property.history/property (:db/id (d/entity @conn :logseq.property/status))
                                :logseq.property.history/ref-value (:db/id page)}])
          history-entity (d/entity @conn [:block/uuid history-uuid])]
      (ldb/transact! conn [[:db/retractEntity (:db/id page)]])
      (is (nil? (d/entity @conn (:db/id history-entity)))))))

(deftest delete-property-removes-history-for-property
  (testing "property history entries for a deleted property are retracted"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "Page"}
                   :blocks [{:block/title "Target block"}]}]
                 :properties {:obsolete {:logseq.property/type :string}}})
          block (db-test/find-block-by-content @conn "Target block")
          property (d/entity @conn :user.property/obsolete)
          history-uuid (random-uuid)
          now (common-util/time-ms)
          _ (d/transact! conn [{:block/uuid history-uuid
                                :block/created-at now
                                :block/updated-at now
                                :logseq.property.history/block (:db/id block)
                                :logseq.property.history/property (:db/id property)
                                :logseq.property.history/scalar-value "old"}])
          history-entity (d/entity @conn [:block/uuid history-uuid])
          retracts [[:db/retractEntity (:db/id property)]]
          extra (delete-blocks/update-refs-history @conn retracts {})]
      (d/transact! conn (concat retracts extra))
      (is (nil? (d/entity @conn (:db/id history-entity)))))))

(deftest delete-blocks-removes-history-for-corresponding-views
  (testing "property history entries attached to a deleted block's view are retracted"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "Page"}
                   :blocks [{:block/title "Target block"}]}]})
          target-block (db-test/find-block-by-content @conn "Target block")
          view-uuid (random-uuid)
          target-history-uuid (random-uuid)
          view-history-uuid (random-uuid)
          now (common-util/time-ms)
          _ (d/transact! conn [{:block/uuid view-uuid
                                :block/title "Target view"
                                :block/created-at now
                                :block/updated-at now
                                :logseq.property/view-for (:db/id target-block)
                                :logseq.property.view/type :logseq.property.view/type.table
                                :logseq.property.view/feature-type :linked-references}
                               {:block/uuid target-history-uuid
                                :block/created-at now
                                :block/updated-at now
                                :logseq.property.history/block (:db/id target-block)
                                :logseq.property.history/property (:db/id (d/entity @conn :logseq.property/status))
                                :logseq.property.history/scalar-value "Todo"}
                               {:block/uuid view-history-uuid
                                :block/created-at now
                                :block/updated-at now
                                :logseq.property.history/block [:block/uuid view-uuid]
                                :logseq.property.history/property (:db/id (d/entity @conn :logseq.property/status))
                                :logseq.property.history/scalar-value "List"}])]
      (ldb/transact! conn [[:db/retractEntity (:db/id target-block)]])
      (is (nil? (d/entity @conn [:block/uuid view-uuid])))
      (is (nil? (d/entity @conn [:block/uuid target-history-uuid])))
      (is (nil? (d/entity @conn [:block/uuid view-history-uuid]))))))

(deftest delete-blocks-does-not-rewrite-title-for-deleted-view
  (testing "reference title rewrite should skip generated views deleted by the same cleanup"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "Page"}
                   :blocks [{:block/title "Asset target"}]}]})
          target-block (db-test/find-block-by-content @conn "Asset target")
          page (:block/page target-block)
          view-uuid (random-uuid)
          now (common-util/time-ms)
          _ (d/transact! conn [{:block/uuid view-uuid
                                :block/title "Unlinked references"
                                :block/raw-title "Unlinked references"
                                :block/created-at now
                                :block/updated-at now
                                :block/page (:db/id page)
                                :block/parent (:db/id page)
                                :block/order "cD66"
                                :block/refs (:db/id target-block)
                                :logseq.property/view-for (:db/id target-block)
                                :logseq.property.view/type :logseq.property.view/type.list
                                :logseq.property.view/feature-type :unlinked-references}])
          view (d/entity @conn [:block/uuid view-uuid])
          retracts [[:db/retractEntity (:db/id target-block)]]
          extra (delete-blocks/update-refs-history @conn retracts {})]
      (is (some #(= [:db/retractEntity (:db/id view)] %) extra))
      (is (not-any? #(= [:db/add (:db/id view) :block/title "Unlinked references"] %) extra)))))

(deftest delete-blocks-does-not-rewrite-title-for-deleted-history
  (testing "reference title rewrite should skip history entities deleted by the same cleanup"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "Page"}
                   :blocks [{:block/title "Target block"}]}]})
          target-block (db-test/find-block-by-content @conn "Target block")
          page (:block/page target-block)
          history-uuid (random-uuid)
          now (common-util/time-ms)
          _ (d/transact! conn [{:block/uuid history-uuid
                                :block/title "History entry"
                                :block/raw-title "History entry"
                                :block/created-at now
                                :block/updated-at now
                                :block/page (:db/id page)
                                :block/parent (:db/id page)
                                :block/order "a0"
                                :block/refs (:db/id target-block)
                                :logseq.property.history/block (:db/id target-block)
                                :logseq.property.history/property (:db/id (d/entity @conn :logseq.property/status))
                                :logseq.property.history/scalar-value "Todo"}])
          history (d/entity @conn [:block/uuid history-uuid])
          retracts [[:db/retractEntity (:db/id target-block)]]
          extra (delete-blocks/update-refs-history @conn retracts {})]
      (is (some #(= [:db/retractEntity (:db/id history)] %) extra))
      (is (not-any? #(= [:db/add (:db/id history) :block/title "History entry"] %) extra)))))
