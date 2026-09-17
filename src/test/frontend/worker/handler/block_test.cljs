(ns frontend.worker.handler.block-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.util.entity :as entity]
            [frontend.worker.handler.block :as block-handler]
            [frontend.worker.handler.property :as property-handler]
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

(defn- open-block-tree-api
  []
  (let [api (some-> (resolve 'frontend.worker.handler.block/open-block-tree)
                    deref)]
    (is (fn? api) "Missing worker block API: open-block-tree")
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
                   :block/title "Referenced tag title must not be copied"
                   :logseq.property.class/hide-from-node true
                   :logseq.property/choice-exclusions [-7]}
                  {:db/id -7
                   :block/uuid #uuid "10000000-0000-0000-0000-000000000007"
                   :block/tx-id 10
                   :block/title "Excluded choice"}
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
                :block/tags :logseq.property/value :logseq.property/icon
                :logseq.property/type :db/cardinality
                :logseq.property.class/hide-from-node
                :logseq.property/choice-exclusions
                :logseq.property.asset/type
                :logseq.property.asset/width
                :logseq.property.asset/height
                :logseq.property.asset/resize-metadata
                :logseq.property.asset/external-url}
              (keys reference))))

(deftest canonical-property-reference-values-keep-type-tags-test
  (when-let [canonical-block (canonical-block-api)]
    (let [conn (db-test/create-conn)
          block-uuid (random-uuid)
          cases [{:property-ident :user.property/Page
                  :target-id -11
                  :tag-ident :logseq.class/Page
                  :predicate entity/page?}
                 {:property-ident :user.property/Class
                  :target-id -12
                  :tag-ident :logseq.class/Tag
                  :predicate entity/class?}
                 {:property-ident :user.property/Property
                  :target-id -13
                  :tag-ident :logseq.class/Property
                  :predicate entity/property?}
                 {:property-ident :user.property/Journal
                  :target-id -14
                  :tag-ident :logseq.class/Journal
                  :predicate entity/journal?}]]
      (d/transact! conn
                   (concat
                    (map-indexed (fn [index {:keys [property-ident]}]
                                   {:db/id (- -20 index)
                                    :db/ident property-ident
                                    :db/valueType :db.type/ref
                                    :db/cardinality :db.cardinality/one})
                                 cases)
                    (map (fn [{:keys [target-id tag-ident]}]
                           {:db/id target-id
                            :block/uuid (random-uuid)
                            :block/tx-id 1
                            :block/title (name tag-ident)
                            :block/name (name tag-ident)
                            :block/tags tag-ident})
                         cases)
                    [(reduce (fn [block {:keys [property-ident target-id]}]
                               (assoc block property-ident target-id))
                             {:db/id -2
                              :block/uuid block-uuid
                              :block/tx-id 1
                              :block/title "Block"}
                             cases)]))
      (let [block (canonical-block @conn
                                   (d/entity @conn [:block/uuid block-uuid]))]
        (doseq [{:keys [property-ident tag-ident predicate]} cases]
          (let [value (get block property-ident)]
            (is (= tag-ident (get-in value [:block/tags 0 :db/ident])))
            (is (predicate value)
                "Reference-valued properties retain their renderer type identity")))))))

(deftest canonical-property-values-retain-source-property-type-test
  (let [{:keys [conn target-uuid page-uuid]} (canonical-block-fixture)
        property-uuid (random-uuid)]
    (d/transact! conn [{:db/id -1
                       :block/uuid property-uuid
                       :block/title "URL"
                       :db/ident :user.property/URL
                       :db/valueType :db.type/ref
                       :db/cardinality :db.cardinality/many
                       :block/tags :logseq.class/Property
                       :logseq.property/type :url}
                      {:block/uuid target-uuid
                       :logseq.property/created-from-property -1}])
    (doseq [property-type [:url :default]]
      (d/transact! conn [{:block/uuid property-uuid
                         :logseq.property/type property-type}])
      (let [block (block-handler/canonical-block
                   @conn (d/entity @conn [:block/uuid target-uuid]))]
        (is (= property-type
               (get-in block [:logseq.property/created-from-property
                              :logseq.property/type])))
        (is (= :db.cardinality/many
               (get-in block [:logseq.property/created-from-property :db/cardinality])))
        (is (= (= :url property-type) (entity/url-property-value? block)))))
    (is (not (entity/url-property-value?
              (block-handler/canonical-block
               @conn (d/entity @conn [:block/uuid page-uuid])))))))

(deftest canonical-block-keeps-own-attributes-and-only-shallow-references-test
  (when-let [canonical-block (canonical-block-api)]
    (let [{:keys [conn target-uuid]} (canonical-block-fixture)
          entity (d/entity @conn [:block/uuid target-uuid])
          block (canonical-block @conn entity)
          references (concat [(:block/page block)
                              (:block/parent block)
                              (:block/link block)]
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
      (is (= 4 (count references)))
      (doseq [reference references]
        (assert-shallow-identity-ref reference))
      (is (nil? (:block/refs block))
          "Plain titles skip :block/refs. Table cells already have property/tag refs.")
      (is (= #uuid "10000000-0000-0000-0000-000000000007"
             (get-in block
                     [:block/tags 0
                      :logseq.property/choice-exclusions 0
                      :block/uuid])))
      (is (true? (get-in block
                         [:block/tags 0
                          :logseq.property.class/hide-from-node])))
      (is (= "number"
             (get-in block
                     [:logseq.property/order-list-type
                      :block/title]))
          "Property references retain the scalar content required to render their value.")
      (is (= 1 (:block.temp/order-list-index block))
          "Canonical blocks retain worker-derived ordered-list indexes.")
      (is (map? (:block.temp/positioned-properties block))
          "Positioned properties arrive with the canonical row.")
      (is (not (contains? block :block.temp/breadcrumb)))
      (is (integer? (:block.temp/refs-count block)))
      (is (not (contains? block :block.temp/property-keys))
          "Collapse can read own property idents from the row map.")
      (is (not (contains? block :block/children)))
      (is (not (contains? block :block/properties)))
      (is (not-any? #(and (keyword? %)
                          (= "block.temp" (namespace %)))
                    (remove #{:block.temp/positioned-properties
                              :block.temp/order-list-index
                              :block.temp/refs-count}
                            (keys block)))))))

(deftest canonical-block-numbers-ref-typed-list-siblings-test
  (when-let [canonical-block (canonical-block-api)]
    (let [conn (db-test/create-conn)
          page-uuid (random-uuid)
          parent-uuid (random-uuid)
          type-uuid (random-uuid)
          a-uuid (random-uuid)
          b-uuid (random-uuid)
          c-uuid (random-uuid)]
      (d/transact! conn
                   [{:db/id -1
                     :block/uuid page-uuid
                     :block/tx-id 1
                     :block/title "List page"
                     :block/name "list page"
                     :block/tags :logseq.class/Page}
                    {:db/id -2
                     :block/uuid parent-uuid
                     :block/tx-id 1
                     :block/title "parent"
                     :block/page -1
                     :block/parent -1
                     :block/order "a0"}
                    {:db/id -3
                     :block/uuid type-uuid
                     :block/tx-id 1
                     :block/title "number"
                     :logseq.property/created-from-property :logseq.property/order-list-type}
                    {:db/id -4
                     :block/uuid a-uuid
                     :block/tx-id 1
                     :block/title "a"
                     :block/page -1
                     :block/parent -2
                     :block/order "a1"
                     :logseq.property/order-list-type -3}
                    {:db/id -5
                     :block/uuid b-uuid
                     :block/tx-id 1
                     :block/title "b"
                     :block/page -1
                     :block/parent -2
                     :block/order "a2"
                     :logseq.property/order-list-type -3}
                    {:db/id -6
                     :block/uuid c-uuid
                     :block/tx-id 1
                     :block/title "c"
                     :block/page -1
                     :block/parent -2
                     :block/order "a3"
                     :logseq.property/order-list-type -3}])
      (is (= [1 2 3]
             (mapv (fn [block-uuid]
                     (:block.temp/order-list-index
                      (canonical-block @conn (d/entity @conn [:block/uuid block-uuid]))))
                   [a-uuid b-uuid c-uuid]))
          "Sibling number-list indexes stay 1. 2. 3. when the type is a closed-value ref."))))

(deftest canonical-block-keeps-empty-placeholder-priority-ident-test
  (when-let [canonical-block (canonical-block-api)]
    (let [conn (db-test/create-conn)
          page-uuid (random-uuid)
          block-uuid (random-uuid)]
      (d/transact! conn
                   [{:db/id -1
                     :block/uuid page-uuid
                     :block/tx-id 1
                     :block/title "Priority page"
                     :block/name "priority page"
                     :block/tags :logseq.class/Page}
                    {:db/id -2
                     :block/uuid block-uuid
                     :block/tx-id 1
                     :block/title "No priority test"
                     :block/page -1
                     :block/parent -1
                     :block/order "a0"
                     :logseq.property/priority :logseq.property/empty-placeholder}])
      (is (= :logseq.property/empty-placeholder
             (:db/ident (:logseq.property/priority
                         (canonical-block @conn (d/entity @conn [:block/uuid block-uuid])))))
          "The dashed chip matches on :db/ident after shallow-ref-identity."))))

(deftest canonical-block-skips-path-refs-and-plain-title-block-refs-test
  (when-let [canonical-block (canonical-block-api)]
    (let [conn (db-test/create-conn)
          page-uuid (random-uuid)
          actor-uuid (random-uuid)
          row-uuid (random-uuid)]
      (d/transact! conn
                   [{:db/id -1
                     :block/uuid page-uuid
                     :block/tx-id 1
                     :block/title "Movies"
                     :block/name "movies"
                     :block/tags :logseq.class/Page}
                    {:db/id -2
                     :block/uuid actor-uuid
                     :block/tx-id 1
                     :block/title "Paul Walker"
                     :block/name "paul walker"
                     :block/tags :logseq.class/Page}
                    {:db/id -3
                     :db/ident :user.property/actors
                     :db/valueType :db.type/ref
                     :db/cardinality :db.cardinality/many
                     :block/uuid (random-uuid)
                     :block/tx-id 1
                     :block/title "Actors"}
                    {:block/uuid row-uuid
                     :block/tx-id 1
                     :block/title "2 Fast 2 Furious (2003)"
                     :block/page -1
                     :block/refs [-1 -2]
                     :block/path-refs [-1 -2]
                     :user.property/actors [-2]}])
      (let [block (canonical-block @conn
                                   (d/entity @conn [:block/uuid row-uuid]))]
        (is (nil? (:block/refs block)))
        (is (nil? (:block/path-refs block))
            "Legacy path-refs are excluded. They duplicate :block/refs on imported graphs.")
        (is (= actor-uuid (get-in block [:user.property/actors 0 :block/uuid]))
            "Displayed column values stay as shallow identities.")
        (is (= #{:db/id :block/uuid :block/title :block/name :block/tags}
               (set (keys (first (:user.property/actors block)))))
            "Page-valued cells are one eavt scan: uuid/title/name/tags. No property extras.")
        (is (map? (:block.temp/positioned-properties block)))
        (is (not (contains? block :block.temp/property-keys)))))))

(deftest canonical-block-uses-stored-journal-title-test
  (when-let [canonical-block (canonical-block-api)]
    (let [conn (db-test/create-conn)
          page-uuid (random-uuid)
          journal-uuid (random-uuid)
          journal-title "20260915"]
      (d/transact! conn
                   [{:db/id -1
                     :block/uuid page-uuid
                     :block/tx-id 1
                     :block/title "Mentioned"
                     :block/name "mentioned"
                     :block/tags :logseq.class/Page}
                    {:block/uuid journal-uuid
                     :block/tx-id 1
                     :block/title journal-title
                     :block/name journal-title
                     :block/journal-day 20260915
                     :block/tags :logseq.class/Journal
                     :block/refs [-1]}])
      (let [block (canonical-block @conn
                                   (d/entity @conn [:block/uuid journal-uuid]))]
        (is (= journal-title (:block/title block)))
        (is (= journal-title (:block/raw-title block)))
        (is (nil? (:block/refs block))
            "Journal table rows keep the stored date title and skip Entity ref walks.")))))

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
          canonical-property (canonical-block @conn property)
          display-property (property-handler/display-property-map @conn property-id)]
      (is (zero? (:block.temp/refs-count canonical-property))
          "Property column headers skip refs-count. Incoming refs are every user of the property.")
      (is (= (:property/closed-values display-property)
             (:property/closed-values canonical-property))
          "Canonical property definitions carry every choice for pickers.")
      (is (seq (:property/closed-values display-property)))
      (is (every? :block/uuid (:property/closed-values display-property)))
      (is (= #{"Low" "Medium" "High" "Urgent"}
             (set (map :block/title (:property/closed-values display-property))))
          "Display property maps keep every closed value, not only the current one"))))

(deftest canonical-class-skips-refs-count-test
  (when-let [canonical-block (canonical-block-api)]
    (let [conn (db-test/create-conn)
          class-uuid (random-uuid)
          page-uuid (random-uuid)]
      (d/transact! conn
                   [{:db/id -1
                     :block/uuid class-uuid
                     :block/tx-id 1
                     :block/title "Movie"
                     :block/name "movie"
                     :block/tags :logseq.class/Tag}
                    {:db/id -2
                     :block/uuid page-uuid
                     :block/tx-id 1
                     :block/title "Mentions movie"
                     :block/refs [-1]}])
      (let [block (canonical-block @conn (d/entity @conn [:block/uuid class-uuid]))]
        (is (zero? (:block.temp/refs-count block))
            "Class/tag rows skip refs-count. Incoming refs are every tagged object.")))))

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
      (let [{:keys [conn page-uuid target-uuid ref-uuid]} (canonical-block-fixture)
            db @conn
            response (canonical-blocks db [target-uuid page-uuid])]
        (is (= (:max-tx db) (:basis-rev response)))
        (is (= #{target-uuid page-uuid}
               (set (keys (:blocks response))))
            "A row load must not hydrate every :block/refs target as its own canonical block.")
        (is (not (contains? (set (keys (:blocks response))) ref-uuid))
            "Unrequested :block/refs targets stay out of the snapshot.")
        (is (nil? (get-in response [:blocks target-uuid :block/refs]))
            "Plain-title rows skip :block/refs. Property and tag refs stay inlined.")
        (doseq [[block-uuid block] (:blocks response)]
          (is (= block-uuid (:block/uuid block)))
          (is (= block
                 (canonical-block db
                                  (d/entity db [:block/uuid block-uuid])))))))))

(deftest canonical-blocks-inlines-positioned-property-definitions-test
  (when-let [canonical-blocks (canonical-blocks-api)]
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "Page"}
                  :blocks [{:block/title "task doing"
                            :build/tags [:logseq.class/Task]
                            :build/properties {:logseq.property/status :logseq.property/status.doing}}]}])
          task (db-test/find-block-by-content @conn "task doing")
          status-uuid (:block/uuid (d/entity @conn :logseq.property/status))]
      (d/transact! conn [{:db/id (:db/id task) :block/tx-id 1}])
      (let [response (canonical-blocks @conn [(:block/uuid task)])
            block (get-in response [:blocks (:block/uuid task)])]
        (is (= #{(:block/uuid task)} (set (keys (:blocks response))))
            "Definitions are inlined on the row, without loading extra canonical blocks.")
        (is (not (contains? (set (keys (:blocks response))) status-uuid)))
        (is (= [status-uuid]
               (mapv :block/uuid (get-in block [:block.temp/positioned-properties :block-left])))
            "Positioned chips can render without another request.")
        (is (some? (:logseq.property/status block))
            "The written status value stays on the row for table cells.")))))

(deftest canonical-blocks-omits-absent-requested-uuids-at-the-same-basis-test
  (when-let [canonical-blocks (canonical-blocks-api)]
    (let [{:keys [conn target-uuid]} (canonical-block-fixture)
          missing-uuid (random-uuid)
          db @conn
          response (canonical-blocks db [target-uuid missing-uuid])]
      (is (= (:max-tx db) (:basis-rev response)))
      (is (= #{target-uuid} (set (keys (:blocks response))))
          "Missing requested UUIDs stay omitted, and unrequested refs are not pulled in.")
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

(deftest open-block-tree-includes-open-descendants-and-stops-at-collapsed-blocks-test
  (when-let [open-block-tree (open-block-tree-api)]
    (let [conn (db-test/create-conn)
          page-uuid (random-uuid)
          open-child-uuid (random-uuid)
          open-grandchild-uuid (random-uuid)
          collapsed-child-uuid (random-uuid)
          hidden-grandchild-uuid (random-uuid)]
      (d/transact! conn
                   [{:db/id -1
                     :block/uuid page-uuid
                     :block/tx-id 30
                     :block/title "Page"
                     :block/name "page"
                     :block/tags :logseq.class/Page}
                    {:db/id -2
                     :block/uuid open-child-uuid
                     :block/tx-id 30
                     :block/title "Open child"
                     :block/page -1
                     :block/parent -1
                     :block/order "a0"}
                    {:db/id -3
                     :block/uuid open-grandchild-uuid
                     :block/tx-id 30
                     :block/title "Open grandchild"
                     :block/page -1
                     :block/parent -2
                     :block/order "a0"}
                    {:db/id -4
                     :block/uuid collapsed-child-uuid
                     :block/tx-id 30
                     :block/title "Collapsed child"
                     :block/collapsed? true
                     :block/page -1
                     :block/parent -1
                     :block/order "b0"}
                    {:block/uuid hidden-grandchild-uuid
                     :block/tx-id 30
                     :block/title "Hidden grandchild"
                     :block/page -1
                     :block/parent -4
                     :block/order "a0"}])
      (let [{:keys [blocks children]} (open-block-tree @conn page-uuid)]
        (is (= #{page-uuid open-child-uuid open-grandchild-uuid
                 collapsed-child-uuid}
               (set (keys blocks))))
        (is (= #{page-uuid open-child-uuid open-grandchild-uuid}
               (set (keys children))))
        (is (= [[open-child-uuid "a0"] [collapsed-child-uuid "b0"]]
               (get-in children [page-uuid :items])))
        (is (= [[open-grandchild-uuid "a0"]]
               (get-in children [open-child-uuid :items])))))))

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

(deftest canonical-block-snapshots-are-transit-safe-pure-results-test
  (let [canonical-blocks (canonical-blocks-api)
        direct-children-membership (direct-children-membership-api)
        open-block-tree (open-block-tree-api)]
    (when (and canonical-blocks direct-children-membership open-block-tree)
      (let [{:keys [conn target-uuid parent-uuid]}
            (canonical-block-fixture)
            block-uuids [target-uuid]
            blocks (canonical-blocks @conn block-uuids)
            membership (direct-children-membership @conn parent-uuid)
            tree (open-block-tree @conn parent-uuid)]
        (doseq [value [blocks membership tree]]
          (is (= value
                 (-> value ldb/write-transit-str ldb/read-transit-str))))))))

(deftest block-property-keys-include-own-and-class-properties-test
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:c1 {:build/class-properties [:p1]}}
               :properties {:own {:logseq.property/type :default}}
               :pages-and-blocks
               [{:page {:block/title "Page"}
                 :blocks [{:block/title "with-own"
                           :build/properties {:own "v"}}
                          {:block/title "with-class"
                           :build/tags [:c1]}
                          {:block/title "plain"}]}]})
        db @conn
        with-own (db-test/find-block-by-content db "with-own")
        with-class (db-test/find-block-by-content db "with-class")
        plain (db-test/find-block-by-content db "plain")
        own-map (:block (block-handler/get-block-and-children db (:db/id with-own) {:children? false}))
        class-map (:block (block-handler/get-block-and-children db (:db/id with-class) {:children? false}))
        plain-map (:block (block-handler/get-block-and-children db (:db/id plain) {:children? false}))]
    (is (some #{:user.property/own} (property-handler/block-property-keys db with-own)))
    (is (some #{:user.property/p1} (property-handler/block-property-keys db with-class))
        "Class-provided properties are included even when the node has no own value.")
    (is (not-any? #{:user.property/own :user.property/p1}
                  (property-handler/block-property-keys db plain)))
    (is (some #{:user.property/own} (:block.temp/property-keys own-map)))
    (is (some #{:user.property/p1} (:block.temp/property-keys class-map)))
    (is (not-any? #{:user.property/own :user.property/p1}
                  (:block.temp/property-keys plain-map)))
    (when-let [canonical-block (canonical-block-api)]
      (d/transact! conn [{:db/id (:db/id with-class)
                          :block/tx-id 1}])
      (is (not (contains? (canonical-block @conn (d/entity @conn (:db/id with-class)))
                          :block.temp/property-keys))
          "Row snapshots skip property-keys. Table cells read values from the row map."))))

(deftest canonical-block-positions-default-task-status-test
  (when-let [canonical-block (canonical-block-api)]
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "Page"}
                  :blocks [{:block/title "task only"
                            :build/tags [:logseq.class/Task]}
                           {:block/title "task doing"
                            :build/tags [:logseq.class/Task]
                            :build/properties {:logseq.property/status :logseq.property/status.doing}}]}])
          task-only (db-test/find-block-by-content @conn "task only")
          task-doing (db-test/find-block-by-content @conn "task doing")
          status-uuid (:block/uuid (d/entity @conn :logseq.property/status))]
      (d/transact! conn [{:db/id (:db/id task-only) :block/tx-id 1}
                         {:db/id (:db/id task-doing) :block/tx-id 1}])
      (let [only-block (canonical-block @conn (d/entity @conn (:db/id task-only)))
            doing-block (canonical-block @conn (d/entity @conn (:db/id task-doing)))
            only-left (set (property-handler/block-positioned-property-idents
                            @conn (:db/id task-only) :block-left))
            doing-left (set (property-handler/block-positioned-property-idents
                             @conn (:db/id task-doing) :block-left))]
        (is (= [status-uuid]
               (mapv :block/uuid (get-in only-block [:block.temp/positioned-properties :block-left]))))
        (is (contains? only-left :logseq.property/status)
            "Tag-only #Task exposes the default status on its first render.")
        (is (not (contains? only-block :logseq.property/status))
            "Canonical row maps omit unset status so table/query cells stay empty.")
        (is (contains? doing-left :logseq.property/status)
            "Explicit status still positions.")
        (is (some? (:logseq.property/status doing-block)))
        (is (uuid? status-uuid))))))

(deftest get-block-and-children-positions-default-task-status-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "Page"}
                :blocks [{:block/title "task only"
                          :build/tags [:logseq.class/Task]}
                         {:block/title "plain"}]}])
        task-only (db-test/find-block-by-content @conn "task only")
        plain (db-test/find-block-by-content @conn "plain")
        task-result (:block (block-handler/get-block-and-children
                             @conn (:db/id task-only)
                             {:children? false :render-data? true}))
        plain-result (:block (block-handler/get-block-and-children
                              @conn (:db/id plain)
                              {:children? false :render-data? true}))
        task-left (set (map :db/ident
                            (get-in task-result [:block.temp/positioned-properties :block-left])))]
    (is (contains? task-left :logseq.property/status)
        "Tag-only #Task is not treated as a plain block for positioned status.")
    (is (empty? (get-in plain-result [:block.temp/positioned-properties :block-left]))
        "Untagged blocks still skip positioned status.")))

(defn- cover-row-fixture
  []
  (let [conn (db-test/create-conn)
        page-uuid #uuid "20000000-0000-0000-0000-000000000001"
        row-uuid #uuid "20000000-0000-0000-0000-000000000002"
        cover-uuid #uuid "20000000-0000-0000-0000-000000000003"]
    (d/transact! conn
                 [{:db/id -1
                   :block/uuid page-uuid
                   :block/tx-id 10
                   :block/title "Movies"
                   :block/name "movies"
                   :block/tags :logseq.class/Page}
                  {:db/id -2
                   :db/ident :user.property/cover
                   :db/valueType :db.type/ref
                   :db/cardinality :db.cardinality/one
                   :block/uuid #uuid "20000000-0000-0000-0000-000000000004"
                   :block/tx-id 10
                   :block/title "Cover"
                   :logseq.property/type :asset
                   :block/tags :logseq.class/Property}
                  {:db/id -3
                   :block/uuid cover-uuid
                   :block/tx-id 10
                   :block/title "poster"
                   :block/tags :logseq.class/Asset
                   :logseq.property.asset/type "webp"
                   :logseq.property.asset/width 800
                   :logseq.property.asset/height 1200
                   :logseq.property.asset/external-url "https://example.com/poster.webp"}
                  {:db/id -4
                   :block/uuid row-uuid
                   :block/tx-id 10
                   :block/title "Inception"
                   :block/page -1
                   :block/parent -1
                   :block/order "a0"
                   :user.property/cover -3}])
    {:conn conn
     :row-uuid row-uuid
     :cover-uuid cover-uuid}))

(deftest canonical-page-property-values-keep-eavt-tags-test
  (when-let [canonical-block (canonical-block-api)]
    (let [conn (db-test/create-conn)
          page-uuid (random-uuid)
          block-uuid (random-uuid)]
      (d/transact! conn
                   [{:db/id -1
                     :block/uuid page-uuid
                     :block/tx-id 1
                     :block/title "Actor"
                     :block/name "actor"
                     :block/tags :logseq.class/Page}
                    {:db/id -2
                     :db/ident :user.property/Cast
                     :db/valueType :db.type/ref
                     :db/cardinality :db.cardinality/one
                     :block/uuid (random-uuid)
                     :block/tx-id 1
                     :block/title "Cast"
                     :block/tags :logseq.class/Property}
                    {:block/uuid block-uuid
                     :block/tx-id 1
                     :block/title "Movie"
                     :user.property/Cast -1}])
      (let [block (canonical-block @conn
                                   (d/entity @conn [:block/uuid block-uuid]))
            cast (:user.property/Cast block)]
        (is (= :logseq.class/Page (get-in cast [:block/tags 0 :db/ident])))
        (is (entity/page? cast)
            "Page-valued table cells keep type tags without building Entities.")))))

(deftest canonical-blocks-reuse-shared-ref-identities-test
  (when-let [canonical-blocks (canonical-blocks-api)]
    (let [conn (db-test/create-conn)
          page-uuid (random-uuid)
          first-uuid (random-uuid)
          second-uuid (random-uuid)]
      (d/transact! conn
                   [{:db/id -1
                     :block/uuid page-uuid
                     :block/tx-id 1
                     :block/title "Shared"
                     :block/name "shared"
                     :block/tags :logseq.class/Page}
                    {:block/uuid first-uuid
                     :block/tx-id 1
                     :block/title (str "One [[" page-uuid "]]")
                     :block/refs [-1]}
                    {:block/uuid second-uuid
                     :block/tx-id 1
                     :block/title (str "Two [[" page-uuid "]]")
                     :block/refs [-1]}])
      (let [response (canonical-blocks @conn [first-uuid second-uuid])
            first-ref (get-in response [:blocks first-uuid :block/refs 0])
            second-ref (get-in response [:blocks second-uuid :block/refs 0])]
        (is (= first-ref second-ref))
        (is (= page-uuid (:block/uuid first-ref)))
        (is (= :logseq.class/Page (get-in first-ref [:block/tags 0 :db/ident])))))))

(deftest canonical-cover-property-is-not-a-db-id-stub-test
  (when-let [canonical-block (canonical-block-api)]
    (let [{:keys [conn row-uuid cover-uuid]} (cover-row-fixture)
          block (canonical-block @conn (d/entity @conn [:block/uuid row-uuid]))
          cover (:user.property/cover block)]
      (is (map? cover))
      (is (not= {:db/id (:db/id cover)} cover)
          "Gallery/Table Cover values must keep more than a bare db/id stub.")
      (is (= cover-uuid (:block/uuid cover)))
      (is (= "webp" (:logseq.property.asset/type cover)))
      (is (= 800 (:logseq.property.asset/width cover)))
      (is (= 1200 (:logseq.property.asset/height cover)))
      (is (= "https://example.com/poster.webp"
             (:logseq.property.asset/external-url cover)))
      (assert-shallow-identity-ref cover))))

(deftest canonical-task-snapshot-includes-complete-positioned-choices-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "Tasks"}
                :blocks [{:block/title "Task with status" :build/tags [:logseq.class/Task]
                          :build/properties {:logseq.property/status :logseq.property/status.doing}}
                         {:block/title "Task with default" :build/tags [:logseq.class/Task]}
                         {:block/title "Plain block"}]}])
        tasks (mapv #(db-test/find-block-by-content @conn %)
                    ["Task with status" "Task with default" "Plain block"])]
    (d/transact! conn (conj (mapv #(hash-map :db/id (:db/id %) :block/tx-id 1) tasks)
                            {:db/ident :logseq.property/status :block/tx-id 1}))
    (let [blocks (:blocks (block-handler/canonical-blocks @conn (mapv :block/uuid tasks)))
          status (d/entity @conn :logseq.property/status)
          expected (property-handler/property-closed-values @conn status)]
      (is (= 6 (count expected)))
      (doseq [task (take 2 tasks)]
        (let [properties (get-in blocks [(:block/uuid task) :block.temp/positioned-properties :block-left])
              status-property (some #(when (= :logseq.property/status (:db/ident %)) %) properties)]
          (is (= (set (map :db/ident expected))
                 (set (map :db/ident (:property/closed-values status-property)))))
          (is (every? :logseq.property/icon (:property/closed-values status-property)))))
      (is (= {} (get-in blocks [(:block/uuid (last tasks)) :block.temp/positioned-properties])))
      (is (= expected (:property/closed-values (block-handler/canonical-block @conn status)))
          "Property pickers outside positioned chips also receive the complete choice set."))))

(deftest canonical-block-batch-shares-positioned-property-work-test
  (let [conn (db-test/create-conn)
        ids (vec (repeatedly 50 random-uuid))
        calls (atom [])
        closed-values property-handler/property-closed-values]
    (d/transact! conn
                 (mapv (fn [id] {:block/uuid id :block/title "Task" :block/tx-id 1
                                  :block/tags :logseq.class/Task}) ids))
    (with-redefs [property-handler/property-closed-values
                  (fn [db property]
                    (swap! calls conj (:db/ident property))
                    (closed-values db property))]
      (let [result (block-handler/canonical-blocks @conn ids)]
        (is (= 50 (count (:blocks result))))
        (is (= 1 (count (filter #{:logseq.property/status} @calls)))
            "A batch reads the shared status choices once, without retaining the database globally.")))))

(deftest positioned-node-property-preserves-selector-and-icon-contract-test
  (let [conn (db-test/create-conn-with-blocks
              {:properties {:owner {:logseq.property/type :node
                                    :logseq.property/ui-position :block-left}}
               :classes {:Work {:build/class-properties [:owner]}
                         :Person {}}
               :pages-and-blocks
               [{:page {:block/title "Assignments"}
                 :blocks [{:block/title "Assignment" :build/tags [:Work]}
                          {:block/title "Alice" :build/tags [:Person]}
                          {:block/title "Unrelated"}]}]})
        icon {:type :tabler-icon :id "user"}
        assignment (db-test/find-block-by-content @conn "Assignment")
        person (d/entity @conn :user.class/Person)]
    (d/transact! conn [{:db/ident :user.property/owner
                       :logseq.property/classes [(:db/id person)]
                       :logseq.property/icon icon}
                      {:db/id (:db/id assignment) :block/tx-id 1}])
    (let [block (block-handler/canonical-block @conn (d/entity @conn (:db/id assignment)))
          property (first (get-in block [:block.temp/positioned-properties :block-left]))
          selector (property-handler/property-node-selector-data
                    @conn {:property property :block block})]
      (is (= :user.property/owner (:db/ident property)))
      (is (= [:user.class/Person] (mapv :db/ident (:logseq.property/classes property)))
          "The picker retains class filtering and the tag for newly created values.")
      (is (= [(:block/uuid person)] (mapv :block/uuid (:logseq.property/classes property))))
      (is (= ["Alice"] (mapv :block/title (:initial-choices selector)))
          "An unused positioned property offers existing nodes of its allowed class.")
      (is (= icon (:logseq.property/icon property))
          "Empty left/right values can render their configured icon immediately."))))

(deftest property-value-children-do-not-count-as-outline-children-test
  (let [conn (db-test/create-conn)
        page-uuid (random-uuid)
        parent-uuid (random-uuid)
        value-uuid (random-uuid)
        child-uuid (random-uuid)]
    (d/transact! conn
                 [{:db/id -1
                   :block/uuid page-uuid
                   :block/tx-id 1
                   :block/title "Page"
                   :block/name "page"
                   :block/tags :logseq.class/Page}
                  {:db/id -2
                   :block/uuid parent-uuid
                   :block/tx-id 1
                   :block/title "Parent"
                   :block/page -1
                   :block/parent -1
                   :block/order "a0"}
                  {:db/id -3
                   :block/uuid value-uuid
                   :block/tx-id 1
                   :block/title ""
                   :block/page -1
                   :block/parent -2
                   :block/order "a1"
                   :logseq.property/created-from-property :logseq.property/status}])
    (is (false? (get-in (block-handler/get-block-and-children @conn parent-uuid {})
                        [:block :block.temp/has-children?]))
        "A property value child is not an outline child")
    (let [page-id (:db/id (d/entity @conn [:block/uuid page-uuid]))
          parent-id (:db/id (d/entity @conn [:block/uuid parent-uuid]))]
      (d/transact! conn [{:block/uuid child-uuid
                          :block/tx-id 1
                          :block/title "Real child"
                          :block/page page-id
                          :block/parent parent-id
                          :block/order "a2"}]))
    (is (true? (get-in (block-handler/get-block-and-children @conn parent-uuid {})
                       [:block :block.temp/has-children?]))
        "A real outline child still counts")))
