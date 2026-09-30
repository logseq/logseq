(ns logseq.outliner.recycle-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.op :as outliner-op]
            [logseq.outliner.page :as outliner-page]
            [logseq.outliner.recycle :as recycle]))

(defn- recycle-page
  [db]
  (ldb/get-built-in-page db common-config/recycle-page-name))

(defn- retract-recycle-page!
  [conn]
  (when-let [page (recycle-page @conn)]
    (d/transact! conn [[:db/retractEntity (:db/id page)]])))

(defn- untag-recycle-page!
  [conn]
  (when-let [page (recycle-page @conn)]
    (d/transact! conn [[:db/retract (:db/id page) :block/tags :logseq.class/Page]])))

(defn- assert-page-recycled-under-tagged-recycle
  [db page-id]
  (let [page (d/entity db page-id)
        recycle (recycle-page db)]
    (is (some? recycle))
    (is (true? (ldb/page? recycle)))
    (is (contains? (set (map :db/ident (:block/tags recycle))) :logseq.class/Page))
    (is (true? (ldb/recycled? page)))
    (is (= (:db/id recycle) (:db/id (:block/parent page))))))

(deftest recycle-page-creates-page-tagged-recycle-when-missing
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}}])
        page (ldb/get-page @conn "page1")
        page-id (:db/id page)]
    (retract-recycle-page! conn)
    (is (nil? (recycle-page @conn)))
    (ldb/transact! conn (recycle/recycle-page-tx-data @conn page {}) {:outliner-op :delete-page})
    (assert-page-recycled-under-tagged-recycle @conn page-id)))

(deftest recycle-page-repairs-untagged-recycle
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}}])
        page (ldb/get-page @conn "page1")
        page-id (:db/id page)
        recycle (recycle-page @conn)]
    (untag-recycle-page! conn)
    (is (some? recycle))
    (is (not (ldb/page? (d/entity @conn (:db/id recycle)))))
    (ldb/transact! conn (recycle/recycle-page-tx-data @conn page {}) {:outliner-op :delete-page})
    (assert-page-recycled-under-tagged-recycle @conn page-id)
    (is (= (:db/id recycle) (:db/id (recycle-page @conn))))))

(deftest restore-recycled-page-removes-recycle-parent
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "b1"}]}])
        page (ldb/get-page @conn "page1")]
    (recycle/recycle-page-tx-data @conn page {})
    (ldb/transact! conn (recycle/recycle-page-tx-data @conn page {}) {:outliner-op :delete-page})
    (recycle/restore! conn (:block/uuid page))
    (let [page' (ldb/get-page @conn "page1")]
      (is (nil? (:block/parent page')))
      (is (nil? (:logseq.property/deleted-at page')))
      (is (nil? (:logseq.property.recycle/original-parent page'))))))

(deftest apply-ops-restore-recycled-page-removes-recycle-parent
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "b1"}]}])
        page (ldb/get-page @conn "page1")
        page-uuid (:block/uuid page)]
    (ldb/transact! conn (recycle/recycle-page-tx-data @conn page {}) {:outliner-op :delete-page})
    (is (true? (ldb/recycled? (d/entity @conn [:block/uuid page-uuid]))))
    (outliner-op/apply-ops! conn [[:restore-recycled [page-uuid]]] {})
    (let [page' (ldb/get-page @conn "page1")]
      (is (nil? (:block/parent page')))
      (is (nil? (:logseq.property/deleted-at page')))
      (is (nil? (:logseq.property.recycle/original-parent page'))))))

(deftest permanently-delete-recycled-page-removes-page-and-descendants
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "b1"}]}])
        page (ldb/get-page @conn "page1")
        block (db-test/find-block-by-content @conn "b1")
        page-uuid (:block/uuid page)
        block-uuid (:block/uuid block)]
    (ldb/transact! conn (recycle/recycle-page-tx-data @conn page {}) {:outliner-op :delete-page})
    (is (true? (ldb/recycled? (d/entity @conn [:block/uuid page-uuid]))))
    (is (true? (recycle/permanently-delete! conn page-uuid)))
    (is (nil? (d/entity @conn [:block/uuid page-uuid])))
    (is (nil? (d/entity @conn [:block/uuid block-uuid])))))

(deftest permanently-delete-recycled-page-removes-blocks-parented-by-page
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
    (ldb/transact! conn (recycle/recycle-page-tx-data @conn page1 {}) {:outliner-op :delete-page})
    (is (true? (ldb/recycled? (d/entity @conn (:db/id page1)))))
    (is (true? (recycle/permanently-delete! conn (:block/uuid page1))))
    (is (nil? (d/entity @conn [:block/uuid block-uuid])))))

(deftest permanently-delete-recycled-converted-page-removes-property-value-blocks
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "outer"}
                :blocks [{:block/title "target"
                          :build/properties {:default "value"}}]}])
        target (db-test/find-block-by-content @conn "target")
        target-id (:db/id target)
        target-uuid (:block/uuid target)
        value-id (d/q '[:find ?value .
                        :in $ ?target
                        :where
                        [?value :block/parent ?target]
                        [?value :logseq.property/created-from-property]]
                      @conn target-id)]
    (d/transact! conn [[:db/retract target-id :block/page]
                       [:db/add target-id :block/name "target"]
                       [:db/add target-id :block/tags :logseq.class/Page]])
    (let [page (d/entity @conn target-id)]
      (ldb/transact! conn (recycle/recycle-page-tx-data @conn page {}) {:outliner-op :delete-page}))
    (is (true? (recycle/permanently-delete! conn target-uuid)))
    (is (nil? (d/entity @conn target-id)))
    (is (nil? (d/entity @conn value-id)))))

(deftest gc-recycled-converted-page-removes-property-value-blocks
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "outer"}
                :blocks [{:block/title "target"
                          :build/properties {:default "value"}}
                         {:block/title "unrelated"}]}])
        outer (ldb/get-page @conn "outer")
        target (db-test/find-block-by-content @conn "target")
        unrelated (db-test/find-block-by-content @conn "unrelated")
        target-id (:db/id target)
        value-id (d/q '[:find ?value .
                        :in $ ?target
                        :where
                        [?value :block/parent ?target]
                        [?value :logseq.property/created-from-property]]
                      @conn target-id)]
    (d/transact! conn [[:db/retract target-id :block/page]
                       [:db/add target-id :block/name "target"]
                       [:db/add target-id :block/tags :logseq.class/Page]])
    (let [page (d/entity @conn target-id)]
      (ldb/transact! conn
                     (recycle/recycle-page-tx-data @conn page {:now-ms 0})
                     {:outliner-op :delete-page}))
    (is (true? (recycle/gc! conn {:now-ms (* 31 24 3600 1000)})))
    (is (nil? (d/entity @conn target-id)))
    (is (nil? (d/entity @conn value-id)))
    (is (some? (d/entity @conn (:db/id outer))))
    (is (some? (d/entity @conn (:db/id unrelated))))))

(deftest gc-keeps-unexpired-recycled-page
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}}])
        page (ldb/get-page @conn "page1")
        page-id (:db/id page)]
    (ldb/transact! conn
                   (recycle/recycle-page-tx-data @conn page {:now-ms 0})
                   {:outliner-op :delete-page})
    (is (nil? (recycle/gc! conn {:now-ms (* 29 24 3600 1000)})))
    (is (some? (d/entity @conn page-id)))))

(deftest apply-ops-permanently-delete-recycled-page-removes-page-and-descendants
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "b1"}]}])
        page (ldb/get-page @conn "page1")
        block (db-test/find-block-by-content @conn "b1")
        page-uuid (:block/uuid page)
        block-uuid (:block/uuid block)]
    (ldb/transact! conn (recycle/recycle-page-tx-data @conn page {}) {:outliner-op :delete-page})
    (is (true? (ldb/recycled? (d/entity @conn [:block/uuid page-uuid]))))
    (outliner-op/apply-ops! conn [[:recycle-delete-permanently [page-uuid]]] {})
    (is (nil? (d/entity @conn [:block/uuid page-uuid])))
    (is (nil? (d/entity @conn [:block/uuid block-uuid])))))

(deftest permanently-delete-recycled-block-removes-subtree-only
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "parent"
                          :build/children [{:block/title "child"}]}]}])
        page (ldb/get-page @conn "page1")
        parent (db-test/find-block-by-content @conn "parent")
        child (db-test/find-block-by-content @conn "child")
        parent-uuid (:block/uuid parent)
        child-uuid (:block/uuid child)]
    (ldb/transact! conn (recycle/recycle-blocks-tx-data @conn [parent] {}) {:outliner-op :delete-blocks})
    (is (true? (ldb/recycled? (d/entity @conn [:block/uuid parent-uuid]))))
    (is (true? (recycle/permanently-delete! conn parent-uuid)))
    (is (some? (d/entity @conn [:block/uuid (:block/uuid page)])))
    (is (nil? (d/entity @conn [:block/uuid parent-uuid])))
    (is (nil? (d/entity @conn [:block/uuid child-uuid])))))

(deftest apply-ops-permanently-delete-recycled-block-removes-subtree-only
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "parent"
                          :build/children [{:block/title "child"}]}]}])
        parent (db-test/find-block-by-content @conn "parent")
        child (db-test/find-block-by-content @conn "child")
        parent-uuid (:block/uuid parent)
        child-uuid (:block/uuid child)]
    (ldb/transact! conn (recycle/recycle-blocks-tx-data @conn [parent] {}) {:outliner-op :delete-blocks})
    (is (true? (ldb/recycled? (d/entity @conn [:block/uuid parent-uuid]))))
    (outliner-op/apply-ops! conn [[:recycle-delete-permanently [parent-uuid]]] {})
    (is (nil? (d/entity @conn [:block/uuid parent-uuid])))
    (is (nil? (d/entity @conn [:block/uuid child-uuid])))))

(defn- create-namespace-parent-child!
  [conn parent-title child-title]
  (let [[_ child-uuid] (outliner-page/create! conn (str parent-title "/" child-title) {:split-namespace? true})
        child (d/entity @conn [:block/uuid child-uuid])
        parent (:block/parent child)]
    {:parent parent
     :child child
     :parent-uuid (:block/uuid parent)
     :child-uuid child-uuid
     :parent-id (:db/id parent)}))

(defn- recycle-page!
  [conn page]
  (ldb/transact! conn (recycle/recycle-page-tx-data @conn (d/entity @conn (:db/id page)) {})
                 {:outliner-op :delete-page}))

(defn- assert-namespace-restored
  [db parent-uuid child-uuid]
  (let [parent (d/entity db [:block/uuid parent-uuid])
        child (d/entity db [:block/uuid child-uuid])]
    (is (some? parent))
    (is (some? child))
    (is (false? (ldb/recycled? parent)))
    (is (false? (ldb/recycled? child)))
    (is (= (:db/id parent) (:db/id (:block/parent child))))
    (is (nil? (:logseq.property.recycle/original-parent child)))
    (is (nil? (:logseq.property.recycle/original-order child)))))

(deftest restore-namespace-child-before-parent-reattaches
  (let [conn (db-test/create-conn)
        {:keys [parent child parent-uuid child-uuid parent-id]} (create-namespace-parent-child! conn "Foo" "Bar")]
    (recycle-page! conn child)
    (recycle-page! conn parent)
    (is (true? (recycle/restore! conn child-uuid)))
    (let [child' (d/entity @conn [:block/uuid child-uuid])]
      (is (false? (ldb/recycled? child')))
      (is (nil? (:block/parent child')))
      (is (= parent-id (:db/id (:logseq.property.recycle/original-parent child')))))
    (is (true? (recycle/restore! conn parent-uuid)))
    (assert-namespace-restored @conn parent-uuid child-uuid)))

(deftest restore-namespace-parent-before-child-reattaches
  (let [conn (db-test/create-conn)
        {:keys [parent child parent-uuid child-uuid]} (create-namespace-parent-child! conn "Foo" "Bar")]
    (recycle-page! conn child)
    (recycle-page! conn parent)
    (is (true? (recycle/restore! conn parent-uuid)))
    (is (true? (recycle/restore! conn child-uuid)))
    (assert-namespace-restored @conn parent-uuid child-uuid)))

(deftest apply-ops-restore-namespace-child-before-parent-reattaches
  (let [conn (db-test/create-conn)
        {:keys [parent child parent-uuid child-uuid]} (create-namespace-parent-child! conn "Foo" "Bar")]
    (recycle-page! conn child)
    (recycle-page! conn parent)
    (outliner-op/apply-ops! conn [[:restore-recycled [child-uuid]]] {})
    (outliner-op/apply-ops! conn [[:restore-recycled [parent-uuid]]] {})
    (assert-namespace-restored @conn parent-uuid child-uuid)))

(deftest restore-namespace-children-then-parent-reattaches-all
  (let [conn (db-test/create-conn)
        {:keys [parent child parent-uuid child-uuid]} (create-namespace-parent-child! conn "Foo" "Bar")
        [_ baz-uuid] (outliner-page/create! conn "Foo/Baz" {:split-namespace? true})
        baz (d/entity @conn [:block/uuid baz-uuid])]
    (recycle-page! conn child)
    (recycle-page! conn baz)
    (recycle-page! conn parent)
    (is (true? (recycle/restore! conn child-uuid)))
    (is (true? (recycle/restore! conn baz-uuid)))
    (is (true? (recycle/restore! conn parent-uuid)))
    (assert-namespace-restored @conn parent-uuid child-uuid)
    (assert-namespace-restored @conn parent-uuid baz-uuid)
    (let [parent' (d/entity @conn [:block/uuid parent-uuid])]
      (is (= #{"Bar" "Baz"}
             (->> (:block/_parent parent')
                  (map :block/title)
                  set))))))

(deftest restore-namespace-parent-skips-child-moved-elsewhere
  (let [conn (db-test/create-conn)
        {:keys [parent child parent-uuid child-uuid]} (create-namespace-parent-child! conn "Foo" "Bar")
        [_ other-uuid] (outliner-page/create! conn "Other" {})
        other (d/entity @conn [:block/uuid other-uuid])]
    (recycle-page! conn child)
    (recycle-page! conn parent)
    (is (true? (recycle/restore! conn child-uuid)))
    (d/transact! conn [{:db/id (:db/id (d/entity @conn [:block/uuid child-uuid]))
                        :block/parent (:db/id other)}])
    (is (true? (recycle/restore! conn parent-uuid)))
    (let [child' (d/entity @conn [:block/uuid child-uuid])
          parent' (d/entity @conn [:block/uuid parent-uuid])]
      (is (= (:db/id other) (:db/id (:block/parent child'))))
      (is (nil? (:logseq.property.recycle/original-parent child')))
      (is (false? (ldb/recycled? parent')))
      (is (not= (:db/id parent') (:db/id (:block/parent child')))))))

(deftest permanently-delete-recycled-block-removes-corresponding-view-history
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "target"}]}])
        target (db-test/find-block-by-content @conn "target")
        target-uuid (:block/uuid target)
        view-uuid (random-uuid)
        target-history-uuid (random-uuid)
        view-history-uuid (random-uuid)
        now (common-util/time-ms)
        _ (d/transact! conn [{:block/uuid view-uuid
                              :block/title "target view"
                              :block/created-at now
                              :block/updated-at now
                              :logseq.property/view-for (:db/id target)
                              :logseq.property.view/type :logseq.property.view/type.table
                              :logseq.property.view/feature-type :linked-references}
                             {:block/uuid target-history-uuid
                              :block/created-at now
                              :block/updated-at now
                              :logseq.property.history/block (:db/id target)
                              :logseq.property.history/property (:db/id (d/entity @conn :logseq.property/status))
                              :logseq.property.history/scalar-value "Todo"}
                             {:block/uuid view-history-uuid
                              :block/created-at now
                              :block/updated-at now
                              :logseq.property.history/block [:block/uuid view-uuid]
                              :logseq.property.history/property (:db/id (d/entity @conn :logseq.property/status))
                              :logseq.property.history/scalar-value "List"}])]
    (ldb/transact! conn (recycle/recycle-blocks-tx-data @conn [target] {}) {:outliner-op :delete-blocks})
    (is (true? (recycle/permanently-delete! conn target-uuid)))
    (is (nil? (d/entity @conn [:block/uuid target-uuid])))
    (is (nil? (d/entity @conn [:block/uuid view-uuid])))
    (is (nil? (d/entity @conn [:block/uuid target-history-uuid])))
    (is (nil? (d/entity @conn [:block/uuid view-history-uuid])))))
