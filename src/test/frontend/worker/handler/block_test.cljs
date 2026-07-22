(ns frontend.worker.handler.block-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.common.thread-api :as thread-api]
            [frontend.worker.handler.block]
            [frontend.worker.state :as worker-state]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]))

(defn- canonical-block-api
  []
  (let [api (some-> (resolve 'frontend.worker.handler.block/canonical-block) deref)]
    (is (fn? api) "Missing worker block API: canonical-block")
    api))

(defn- canonical-blocks-api
  []
  (let [api (some-> (resolve 'frontend.worker.handler.block/canonical-blocks) deref)]
    (is (fn? api) "Missing worker block API: canonical-blocks")
    api))

(defn- direct-children-membership-api
  []
  (let [api (some-> (resolve 'frontend.worker.handler.block/direct-children-membership)
                    deref)]
    (is (fn? api) "Missing worker block API: direct-children-membership")
    api))

(defn- canonical-block-fixture
  []
  (let [conn (db-test/create-conn)
        page-uuid #uuid "10000000-0000-0000-0000-000000000001"
        parent-uuid #uuid "10000000-0000-0000-0000-000000000002"
        ref-uuid #uuid "10000000-0000-0000-0000-000000000003"
        tag-uuid #uuid "10000000-0000-0000-0000-000000000004"
        target-uuid #uuid "10000000-0000-0000-0000-000000000005"]
    (d/transact! conn
                 [{:db/id -1
                   :block/uuid page-uuid
                   :block/tx-id 10
                   :block/title "Page"
                   :block/name "page"
                   :block/tags :logseq.class/Page}
                  {:db/id -2
                   :block/uuid parent-uuid
                   :block/tx-id 10
                   :block/title "Parent"
                   :block/page -1
                   :block/parent -1
                   :block/order "a0"}
                  {:db/id -3
                   :block/uuid ref-uuid
                   :block/tx-id 10
                   :block/title "Referenced title must not be copied"}
                  {:db/id -4
                   :db/ident :user.class/Test
                   :block/uuid tag-uuid
                   :block/tx-id 10
                   :block/title "Referenced tag title must not be copied"}
                  {:db/id -6
                   :block/uuid #uuid "10000000-0000-0000-0000-000000000006"
                   :block/tx-id 10
                   :block/title "number"
                   :logseq.property/created-from-property :logseq.property/order-list-type}
                  {:db/id -5
                   :block/uuid target-uuid
                   :block/tx-id 10
                   :block/title "Target"
                   :block/page -1
                   :block/parent -2
                   :block/order "a1"
                   :block/link -3
                   :block/refs [-3]
                   :block/tags [-4]
                   :block/collapsed? true
                   :logseq.property/order-list-type -6
                   :block/created-at 1000
                   :user.property/priority "high"
                   :block/children "legacy tree"
                   :block/properties {:legacy true}
                   :block.temp/load-status :full}])
    {:conn conn
     :page-uuid page-uuid
     :parent-uuid parent-uuid
     :ref-uuid ref-uuid
     :target-uuid target-uuid}))

(defn- assert-shallow-identity-ref
  [reference]
  (is (map? reference))
  (is (contains? reference :db/id))
  (is (or (uuid? (:block/uuid reference))
          (keyword? (:db/ident reference))))
  (is (every? #{:db/id :block/uuid :db/ident :block/title :block/name
                :logseq.property/value :logseq.property/icon}
              (keys reference))))

(deftest canonical-block-keeps-own-attributes-and-only-shallow-references-test
  (when-let [canonical-block (canonical-block-api)]
    (let [{:keys [conn target-uuid]} (canonical-block-fixture)
          entity (d/entity @conn [:block/uuid target-uuid])
          block (canonical-block @conn entity)
          references (concat [(:block/page block)
                              (:block/parent block)
                              (:block/link block)]
                             (:block/refs block)
                             (:block/tags block))]
      (is (= {:block/uuid target-uuid
              :block/tx-id 10
              :block/title "Target"
              :block/order "a1"
              :block/collapsed? true
              :block/created-at 1000
              :user.property/priority "high"}
             (select-keys block
                          [:block/uuid :block/tx-id :block/title :block/order
                           :block/collapsed? :block/created-at
                           :user.property/priority])))
      (is (= 5 (count references)))
      (doseq [reference references]
        (assert-shallow-identity-ref reference))
      (is (= "number"
             (get-in block
                     [:logseq.property/order-list-type
                      :block/title]))
          "Property references retain the scalar content required to render their value.")
      (is (= 1 (:block.temp/order-list-index block))
          "Canonical blocks retain worker-derived ordered-list indexes.")
      (is (map? (:block.temp/positioned-properties block)))
      (is (integer? (:block.temp/refs-count block)))
      (is (not (contains? block :block/children)))
      (is (not (contains? block :block/properties)))
      (is (not-any? #(and (keyword? %)
                          (= "block.temp" (namespace %)))
                    (remove #{:block.temp/order-list-index
                              :block.temp/positioned-properties
                              :block.temp/refs-count}
                            (keys block)))))))

(deftest canonical-block-full-replacement-drops-retracted-attributes-test
  (when-let [canonical-block (canonical-block-api)]
    (let [{:keys [conn target-uuid]} (canonical-block-fixture)
          before (canonical-block @conn (d/entity @conn [:block/uuid target-uuid]))]
      (d/transact! conn
                   [[:db/retract [:block/uuid target-uuid]
                     :block/collapsed? true]
                    [:db/add [:block/uuid target-uuid] :block/tx-id 11]])
      (let [after (canonical-block @conn
                                   (d/entity @conn [:block/uuid target-uuid]))]
        (is (true? (:block/collapsed? before)))
        (is (= 11 (:block/tx-id after)))
        (is (not (contains? after :block/collapsed?)))))))

(deftest canonical-block-exposes-page-reference-titles-for-editing-test
  (when-let [canonical-block (canonical-block-api)]
    (let [conn (db-test/create-conn)
          page-uuid (random-uuid)
          block-uuid (random-uuid)]
      (d/transact! conn
                   [{:db/id -1
                     :block/uuid page-uuid
                     :block/tx-id 1
                     :block/title "Foo"
                     :block/name "foo"
                     :block/tags :logseq.class/Page}
                    {:block/uuid block-uuid
                     :block/tx-id 1
                     :block/title (str "Reference [[" page-uuid "]]")
                     :block/refs [-1]}])
      (let [block (canonical-block @conn
                                   (d/entity @conn [:block/uuid block-uuid]))]
        (is (= (str "Reference [[" page-uuid "]]")
               (:block/raw-title block)))
        (is (= "Reference [[Foo]]" (:block/title block)))))))

(deftest canonical-property-includes-derived-closed-values-test
  (when-let [canonical-block (canonical-block-api)]
    (let [{:keys [conn]} (canonical-block-fixture)
          property-id (:db/id (d/entity @conn :logseq.property/priority))
          _ (d/transact! conn [[:db/add property-id :block/tx-id 10]])
          property (d/entity @conn property-id)
          canonical-property (canonical-block @conn property)]
      (is (seq (:property/closed-values canonical-property)))
      (is (every? :block/uuid (:property/closed-values canonical-property))))))

(deftest canonical-block-allows-db-id-only-reference-identities-test
  (when-let [canonical-block (canonical-block-api)]
    (let [conn (db-test/create-conn)
          block-uuid (random-uuid)]
      (d/transact! conn
                   [{:db/id -1
                     :file/path "assets/image.png"}
                    {:block/uuid block-uuid
                     :block/tx-id 1
                     :block/title "Asset link"
                     :block/link -1}])
      (let [file-id (:db/id (d/entity @conn [:file/path "assets/image.png"]))
            block (canonical-block @conn
                                   (d/entity @conn [:block/uuid block-uuid]))]
        (is (= {:db/id file-id} (:block/link block)))))))

(deftest canonical-block-requires-a-uuid-and-numeric-transaction-id-test
  (when-let [canonical-block (canonical-block-api)]
    (let [conn (db-test/create-conn)
          missing-tx-id-uuid (random-uuid)]
      (d/transact! conn
                   [{:db/id -1
                     :block/tx-id 1
                     :block/title "Missing UUID"}
                    {:block/uuid missing-tx-id-uuid
                     :block/title "Missing transaction ID"}
                    {:block/uuid "not-a-uuid"
                     :block/tx-id 1
                     :block/title "Invalid UUID"}
                    {:block/uuid (random-uuid)
                     :block/tx-id "not-a-number"
                     :block/title "Invalid transaction ID"}])
      (testing "missing UUID"
        (is (thrown? js/Error
                     (canonical-block
                      @conn
                      (d/entity @conn
                                (ffirst
                                 (d/q '[:find ?e
                                        :where [?e :block/title "Missing UUID"]]
                                      @conn)))))))
      (testing "non-UUID identity"
        (is (thrown? js/Error
                     (canonical-block
                      @conn
                      (d/entity @conn [:block/uuid "not-a-uuid"])))))
      (testing "missing transaction ID"
        (is (thrown? js/Error
                     (canonical-block
                      @conn
                      (d/entity @conn [:block/uuid missing-tx-id-uuid])))))
      (testing "non-numeric transaction ID"
        (let [entity-id (ffirst
                         (d/q '[:find ?e
                                :where
                                [?e :block/title "Invalid transaction ID"]]
                              @conn))]
          (is (thrown? js/Error
                       (canonical-block @conn (d/entity @conn entity-id)))))))))

(deftest canonical-blocks-returns-uuid-keyed-replacements-at-one-basis-test
  (let [canonical-block (canonical-block-api)
        canonical-blocks (canonical-blocks-api)]
    (when (and canonical-block canonical-blocks)
      (let [{:keys [conn page-uuid ref-uuid target-uuid]} (canonical-block-fixture)
            db @conn
            response (canonical-blocks db [target-uuid page-uuid])]
        (is (= (:max-tx db) (:basis-rev response)))
        (is (= #{target-uuid page-uuid ref-uuid}
               (set (keys (:blocks response)))))
        (doseq [[block-uuid block] (:blocks response)]
          (is (= block-uuid (:block/uuid block)))
          (is (= block
                 (canonical-block db
                                  (d/entity db [:block/uuid block-uuid])))))))))

(deftest canonical-blocks-omits-absent-requested-uuids-at-the-same-basis-test
  (when-let [canonical-blocks (canonical-blocks-api)]
    (let [{:keys [conn target-uuid ref-uuid]} (canonical-block-fixture)
          missing-uuid (random-uuid)
          db @conn
          response (canonical-blocks db [target-uuid missing-uuid])]
      (is (= (:max-tx db) (:basis-rev response)))
      (is (= #{target-uuid ref-uuid} (set (keys (:blocks response)))))
      (is (= target-uuid
             (get-in response [:blocks target-uuid :block/uuid]))))))

(defn- padded-order
  [index]
  (str "a-"
       (cond
         (< index 10) "00"
         (< index 100) "0"
         :else "")
       index))

(deftest direct-page-children-membership-is-complete-ordered-and-visible-test
  (when-let [direct-children-membership
             (direct-children-membership-api)]
    (let [conn (db-test/create-conn)
          page-uuid (random-uuid)
          property-uuid (random-uuid)
          visible-children (mapv (fn [index]
                                   {:block/uuid (random-uuid)
                                    :block/tx-id 11
                                    :block/title (str "Child " index)
                                    :block/page [:block/uuid page-uuid]
                                    :block/parent [:block/uuid page-uuid]
                                    :block/order (padded-order index)})
                                 (range 105))
          expected-items (mapv (juxt :block/uuid :block/order)
                               visible-children)
          first-child-uuid (:block/uuid (first visible-children))]
      (d/transact! conn
                   [{:block/uuid page-uuid
                     :block/tx-id 10
                     :block/title "Page"
                     :block/name "page"
                     :block/tags :logseq.class/Page}
                    {:block/uuid property-uuid
                     :block/tx-id 10
                     :block/title "Closed value property"}])
      (d/transact! conn
                   (into [[:db/add [:block/uuid page-uuid] :block/tx-id 11]]
                         visible-children))
      (d/transact! conn
                   [[:db/add [:block/uuid page-uuid] :block/tx-id 12]
                    [:db/add [:block/uuid first-child-uuid] :block/tx-id 12]
                    {:block/uuid (random-uuid)
                     :block/tx-id 12
                     :block/title "Grandchild"
                     :block/page [:block/uuid page-uuid]
                     :block/parent [:block/uuid first-child-uuid]
                     :block/order "a-grandchild"}
                    {:block/uuid (random-uuid)
                     :block/tx-id 12
                     :block/title "Recycled direct child"
                     :block/page [:block/uuid page-uuid]
                     :block/parent [:block/uuid page-uuid]
                     :block/order "a-recycled"
                     :logseq.property/deleted-at 1000}
                    {:block/uuid (random-uuid)
                     :block/tx-id 12
                     :block/title "Closed value direct child"
                     :block/page [:block/uuid page-uuid]
                     :block/parent [:block/uuid page-uuid]
                     :block/order "a-closed"
                     :block/closed-value-property
                     [:block/uuid property-uuid]}
                    {:block/uuid (random-uuid)
                     :block/tx-id 12
                     :block/title "Text property value"
                     :block/page [:block/uuid page-uuid]
                     :block/parent [:block/uuid page-uuid]
                     :block/order "a-property-value"
                     :logseq.property/created-from-property
                     [:block/uuid property-uuid]}])
      (let [db @conn
            response (direct-children-membership db page-uuid)]
        (is (= (:max-tx db) (:basis-rev response)))
        (is (= 12 (:parent-tx-id response)))
        (is (= 105 (count (:items response))))
        (is (= expected-items (:items response)))))))

(deftest direct-block-children-membership-does-not-traverse-descendants-test
  (when-let [direct-children-membership
             (direct-children-membership-api)]
    (let [conn (db-test/create-conn)
          page-uuid (random-uuid)
          parent-uuid (random-uuid)
          first-child-uuid (random-uuid)
          second-child-uuid (random-uuid)]
      (d/transact! conn
                   [{:db/id -1
                     :block/uuid page-uuid
                     :block/tx-id 20
                     :block/title "Page"
                     :block/name "page"
                     :block/tags :logseq.class/Page}
                    {:db/id -2
                     :block/uuid parent-uuid
                     :block/tx-id 21
                     :block/title "Parent"
                     :block/page -1
                     :block/parent -1
                     :block/order "a0"}
                    {:db/id -3
                     :block/uuid first-child-uuid
                     :block/tx-id 21
                     :block/title "First child"
                     :block/page -1
                     :block/parent -2
                     :block/order "a0"}
                    {:db/id -4
                     :block/uuid second-child-uuid
                     :block/tx-id 21
                     :block/title "Second child"
                     :block/page -1
                     :block/parent -2
                     :block/order "b0"}
                    {:block/uuid (random-uuid)
                     :block/tx-id 21
                     :block/title "Grandchild"
                     :block/page -1
                     :block/parent -3
                     :block/order "a0"}])
      (let [db @conn
            response (direct-children-membership db parent-uuid)]
        (is (= (:max-tx db) (:basis-rev response)))
        (is (= 21 (:parent-tx-id response)))
        (is (= [[first-child-uuid "a0"]
                [second-child-uuid "b0"]]
               (:items response)))))))

(deftest direct-children-membership-requires-parent-transaction-id-test
  (when-let [direct-children-membership
             (direct-children-membership-api)]
    (let [conn (db-test/create-conn)
          page-uuid (random-uuid)]
      (d/transact! conn
                   [{:db/id -1
                     :block/uuid page-uuid
                     :block/title "Page without transaction ID"
                     :block/name "page"
                     :block/tags :logseq.class/Page}
                    {:block/uuid (random-uuid)
                     :block/tx-id 1
                     :block/title "Child"
                     :block/page -1
                     :block/parent -1
                     :block/order "a0"}])
      (is (thrown? js/Error
                   (direct-children-membership @conn page-uuid))))))

(deftest canonical-block-thread-apis-return-transit-safe-pure-results-test
  (let [canonical-blocks (canonical-blocks-api)
        direct-children-membership (direct-children-membership-api)
        get-canonical-blocks (get @thread-api/*thread-apis
                                  :thread-api/get-canonical-blocks)
        get-direct-children (get @thread-api/*thread-apis
                                 :thread-api/get-direct-children)]
    (is (fn? get-canonical-blocks)
        "Missing thread API: get-canonical-blocks")
    (is (fn? get-direct-children)
        "Missing thread API: get-direct-children")
    (when (and canonical-blocks
               direct-children-membership
               get-canonical-blocks
               get-direct-children)
      (let [{:keys [conn target-uuid parent-uuid]}
            (canonical-block-fixture)
            repo "canonical-block-thread-api-test"
            block-uuids [target-uuid]
            expected-blocks (canonical-blocks @conn block-uuids)
            membership (direct-children-membership @conn parent-uuid)
            expected-children
            {:basis-rev (:basis-rev membership)
             :children {parent-uuid (dissoc membership :basis-rev)}}]
        (with-redefs [worker-state/get-datascript-conn
                      (fn [requested-repo]
                        (is (= repo requested-repo))
                        conn)]
          (let [actual-blocks (get-canonical-blocks repo block-uuids)
                actual-children (get-direct-children repo [parent-uuid])]
            (is (= expected-blocks actual-blocks))
            (is (= expected-children actual-children))
            (is (= actual-blocks
                   (-> actual-blocks
                       ldb/write-transit-str
                       ldb/read-transit-str)))
            (is (= actual-children
                   (-> actual-children
                       ldb/write-transit-str
                       ldb/read-transit-str)))))))))
