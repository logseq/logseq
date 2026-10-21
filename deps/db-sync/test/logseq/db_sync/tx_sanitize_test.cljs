(ns logseq.db-sync.tx-sanitize-test
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.set :as set]
            [datascript.core :as d]
            [logseq.db-sync.tx-sanitize :as tx-sanitize]
            [logseq.db.test.helper :as db-test]))

(def ^:private migration-deleted-attrs
  #{:block/path-refs
    :block/pre-block?
    :logseq.property.embedding/hnsw-label
    :logseq.property.embedding/hnsw-label-updated-at})

(def ^:private graph-backup-folder-ops
  #{[:db/retractEntity :logseq.kv/graph-backup-folder]
    [:db/add :logseq.kv/graph-backup-folder :logseq.kv/value "/tmp/backup"]})

(defn- tx-item-attrs
  [item]
  (cond
    (map? item)
    (set (keys item))

    (and (vector? item) (<= 4 (count item)))
    #{(nth item 2)}

    :else
    #{}))

(deftest sanitize-tx-drops-migration-deleted-attrs-test
  (testing "remote txs from older clients should not reintroduce attrs deleted by client migrations"
    (let [conn (db-test/create-conn)
          block-uuid #uuid "11111111-1111-1111-1111-111111111111"
          tx-data [[:db/add [:block/uuid block-uuid] :block/title "remote title"]
                   [:db/add [:block/uuid block-uuid] :block/path-refs #uuid "22222222-2222-2222-2222-222222222222"]
                   [:db/retract [:block/uuid block-uuid] :block/pre-block? true]
                   [:db/add [:block/uuid block-uuid] :logseq.property.embedding/hnsw-label "label"]
                   [:db/retract [:block/uuid block-uuid] :logseq.property.embedding/hnsw-label-updated-at 123]]
          sanitized (tx-sanitize/sanitize-tx @conn tx-data)
          sanitized-attrs (set (mapcat tx-item-attrs sanitized))]
      (is (empty? (set/intersection migration-deleted-attrs sanitized-attrs)))
      (is (some #(= [:db/add [:block/uuid block-uuid] :block/title "remote title"] %) sanitized)))))

(deftest sanitize-tx-drops-ignored-kv-entity-ops-test
  (testing "remote txs should not apply KV entities that are excluded from sync"
    (let [block-uuid #uuid "11111111-1111-1111-1111-111111111111"
          conn (db-test/create-conn)
          tx-data (into [[:db/add [:block/uuid block-uuid] :block/title "remote title"]]
                        graph-backup-folder-ops)
          sanitized (tx-sanitize/sanitize-tx @conn tx-data)]
      (is (empty? (set/intersection graph-backup-folder-ops (set sanitized))))
      (is (some #(= [:db/add [:block/uuid block-uuid] :block/title "remote title"] %) sanitized)))))

(deftest sanitize-tx-drops-same-tx-ignored-kv-tempid-ops-test
  (testing "remote txs should drop all ops for tempids identified as ignored KV entities"
    (let [block-uuid #uuid "11111111-1111-1111-1111-111111111111"
          conn (db-test/create-conn)
          ignored-ops #{[:db/add "kv-temp" :db/ident :logseq.kv/graph-backup-folder]
                        [:db/add "kv-temp" :logseq.kv/value "/tmp/backup"]
                        [:db/retractEntity "kv-temp"]}
          tx-data (into [[:db/add [:block/uuid block-uuid] :block/title "remote title"]]
                        ignored-ops)
          sanitized (tx-sanitize/sanitize-tx @conn tx-data)]
      (is (empty? (set/intersection ignored-ops (set sanitized))))
      (is (some #(= [:db/add [:block/uuid block-uuid] :block/title "remote title"] %) sanitized)))))

(deftest sanitize-tx-drops-same-tx-ignored-kv-map-ops-test
  (testing "remote txs should drop map-form ignored KV entities and following tempid ops"
    (let [block-uuid #uuid "11111111-1111-1111-1111-111111111111"
          conn (db-test/create-conn)
          ignored-map {:db/id -1
                       :db/ident :logseq.kv/graph-backup-folder
                       :logseq.kv/value "/tmp/backup"}
          ignored-ops #{ignored-map
                        [:db/add -1 :logseq.kv/value "/tmp/backup-2"]
                        [:db/retractEntity -1]}
          tx-data (into [[:db/add [:block/uuid block-uuid] :block/title "remote title"]]
                        ignored-ops)
          sanitized (tx-sanitize/sanitize-tx @conn tx-data)]
      (is (empty? (set/intersection ignored-ops (set sanitized))))
      (is (some #(= [:db/add [:block/uuid block-uuid] :block/title "remote title"] %) sanitized)))))

(defn- tx-attrs
  [tx-data]
  (set (mapcat tx-item-attrs tx-data)))

(defn- rating-graph
  [property-type]
  {:properties {:user.property/rating {:logseq.property/type property-type}}
   :pages-and-blocks
   [{:page {:block/title "Page"}
     :blocks [{:block/title "a"}]}]})

(deftest sanitize-tx-drops-values-of-concurrently-deleted-user-property-test
  (testing "scalar adds and map keys for a deleted user property are dropped"
    (let [conn (db-test/create-conn-with-blocks (rating-graph :checkbox))
          block (db-test/find-block-by-content @conn "a")
          block-uuid (:block/uuid block)
          _ (d/transact! conn [[:db/retractEntity :user.property/rating]])
          tx-data [[:db/add [:block/uuid block-uuid] :block/title "a"]
                   [:db/add [:block/uuid block-uuid] :user.property/rating true]
                   [:db/retract [:block/uuid block-uuid] :user.property/rating false]
                   {:db/id [:block/uuid block-uuid]
                    :block/updated-at 2
                    :user.property/rating true}]
          sanitized (tx-sanitize/sanitize-tx @conn tx-data)]
      (is (nil? (d/entity @conn :user.property/rating)))
      (is (not (contains? (tx-attrs sanitized) :user.property/rating)))
      (is (some #(= [:db/add [:block/uuid block-uuid] :block/title "a"] %) sanitized))
      (is (some (fn [item]
                  (and (map? item)
                       (= [:block/uuid block-uuid] (:db/id item))
                       (= 2 (:block/updated-at item))
                       (not (contains? item :user.property/rating))))
                sanitized)))))

(deftest sanitize-tx-keeps-existing-user-and-built-in-property-ops-test
  (testing "ops for properties that still exist, built-ins, and non-property attrs are kept"
    (let [conn (db-test/create-conn-with-blocks (rating-graph :checkbox))
          block (db-test/find-block-by-content @conn "a")
          block-uuid (:block/uuid block)
          tx-data [[:db/add [:block/uuid block-uuid] :user.property/rating true]
                   [:db/add [:block/uuid block-uuid] :logseq.property/hide? true]
                   [:db/add [:block/uuid block-uuid] :block/title "kept"]]
          sanitized (tx-sanitize/sanitize-tx @conn tx-data)]
      (is (= (set tx-data) (set sanitized))))))

(deftest sanitize-tx-keeps-property-created-in-same-tx-test
  (testing "a property ident created in the same tx is not treated as deleted"
    (let [conn (db-test/create-conn-with-blocks
                {:pages-and-blocks
                 [{:page {:block/title "Page"}
                   :blocks [{:block/title "a"}]}]})
          block (db-test/find-block-by-content @conn "a")
          block-uuid (:block/uuid block)
          tx-data [[:db/add -1 :db/ident :user.property/fresh]
                   [:db/add -1 :logseq.property/type :checkbox]
                   [:db/add [:block/uuid block-uuid] :user.property/fresh true]
                   {:db/id -2
                    :db/ident :user.property/from-map
                    :logseq.property/type :checkbox}
                   [:db/add [:block/uuid block-uuid] :user.property/from-map true]]
          sanitized (tx-sanitize/sanitize-tx @conn tx-data)]
      (is (= (set tx-data) (set sanitized))))))

(deftest sanitize-tx-drops-value-blocks-of-deleted-property-test
  (testing "value blocks created only for a deleted property are dropped with the property pair"
    (let [conn (db-test/create-conn-with-blocks (rating-graph :number))
          block (db-test/find-block-by-content @conn "a")
          block-uuid (:block/uuid block)
          property-uuid (:block/uuid (d/entity @conn :user.property/rating))
          value-uuid (random-uuid)
          _ (d/transact! conn [[:db/retractEntity :user.property/rating]])
          tx-data [[:db/add "value-temp" :block/uuid value-uuid]
                   [:db/add "value-temp" :block/parent [:block/uuid property-uuid]]
                   [:db/add "value-temp" :logseq.property/created-from-property [:block/uuid property-uuid]]
                   [:db/add "value-temp" :logseq.property/value 5]
                   [:db/add [:block/uuid block-uuid] :user.property/rating "value-temp"]
                   [:db/add [:block/uuid block-uuid] :block/updated-at 2]
                   {:db/id -3
                    :block/uuid (random-uuid)
                    :block/parent :user.property/rating
                    :logseq.property/created-from-property :user.property/rating
                    :logseq.property/value 9}]
          sanitized (tx-sanitize/sanitize-tx @conn tx-data)
          sanitized-eids (into #{}
                               (keep (fn [item]
                                       (cond
                                         (map? item) (:db/id item)
                                         (and (vector? item) (>= (count item) 2)) (second item))))
                               sanitized)]
      (is (not (contains? (tx-attrs sanitized) :user.property/rating)))
      (is (not (contains? sanitized-eids "value-temp")))
      (is (not (contains? sanitized-eids -3)))
      (is (not-any? #(= value-uuid (:block/uuid %)) sanitized))
      (is (some #(= [:db/add [:block/uuid block-uuid] :block/updated-at 2] %) sanitized)))))

(deftest sanitize-tx-keeps-existing-block-used-as-deleted-node-property-value-test
  (testing "a node-property value that is an existing block is not retracted; only the pair is dropped"
    (let [conn (db-test/create-conn-with-blocks
                {:properties {:user.property/related {:logseq.property/type :node}}
                 :pages-and-blocks
                 [{:page {:block/title "Page"}
                   :blocks [{:block/title "a"}
                            {:block/title "target"}]}]})
          block (db-test/find-block-by-content @conn "a")
          target (db-test/find-block-by-content @conn "target")
          _ (d/transact! conn [[:db/retractEntity :user.property/related]])
          tx-data [[:db/add [:block/uuid (:block/uuid block)]
                    :user.property/related
                    [:block/uuid (:block/uuid target)]]
                   [:db/add [:block/uuid (:block/uuid target)] :block/title "target"]]
          sanitized (tx-sanitize/sanitize-tx @conn tx-data)]
      (is (not (contains? (tx-attrs sanitized) :user.property/related)))
      (is (some #(= [:db/add [:block/uuid (:block/uuid target)] :block/title "target"] %)
                sanitized)))))

(deftest sanitize-delete-blocks-retracts-property-value-children-test
  (testing "delete-blocks adds retracts for generated property value children"
    (let [conn (db-test/create-conn-with-blocks
                {:properties {:user.property/cli-http-prop {:logseq.property/type :default}}
                 :pages-and-blocks
                 [{:page {:block/title "Page"}
                   :blocks [{:block/title "Parent"
                             :build/properties
                             {:user.property/cli-http-prop
                              {:build/property-value :block
                               :block/title "Property value"}}}]}]})
          parent (db-test/find-block-by-content @conn "Parent")
          property-value (db-test/find-block-by-content @conn "Property value")
          tx-data [[:db/retractEntity [:block/uuid (:block/uuid parent)]]]
          sanitized (tx-sanitize/sanitize-tx @conn
                                             tx-data
                                             {:drop-missing-retract-ops? true
                                              :drop-ops-targeting-retracted-entities? true
                                              :retract-touched-descendants? true})]
      (is (= (:db/id property-value)
             (:db/id (:user.property/cli-http-prop (d/entity @conn (:db/id parent))))))
      (is (some #(= [:db/retractEntity (:db/id property-value)] %) sanitized)))))
