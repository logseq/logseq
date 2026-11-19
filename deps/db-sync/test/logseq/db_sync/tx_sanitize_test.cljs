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

(defn- hierarchy-conn
  []
  (let [conn (d/create-conn {:block/uuid {:db/unique :db.unique/identity}
                           :block/parent {:db/valueType :db.type/ref}
                           :block/page {:db/valueType :db.type/ref}})]
    (d/transact! conn (mapv #(assoc % :block/uuid (random-uuid))
                     [{:db/id 1 :block/name "p1"}
                      {:db/id 2 :block/name "p2"}
                      {:db/id 3 :block/parent 1 :block/page 1}
                      {:db/id 4 :block/parent 3 :block/page 1}
                      {:db/id 5 :block/parent 4 :block/page 1}]))
    conn))

(deftest sanitize-tx-derives-pages-from-final-parents-test
  (doseq [move [[[:db/add 3 :block/parent 2]]
                [[:db/add 3 :block/parent 2] [:db/add 3 :block/page 2]]
                [[:db/retract 3 :block/parent 1] [:db/add 3 :block/parent 2]
                 [:db/retract 3 :block/page 1] [:db/add 3 :block/page 1]]
                [[:db/cas 3 :block/parent 1 2]]]]
    (let [conn (hierarchy-conn)
          db (:db-after (d/with @conn (tx-sanitize/sanitize-tx @conn move)))]
      (is (= [2 2 2] (mapv #(-> (d/entity db %) :block/page :db/id) [3 4 5])))
      (is (= 2 (-> (d/entity db 3) :block/parent :db/id)))
      (is (nil? (:block/page (d/entity db 2)))))))

(deftest sanitize-tx-corrects-new-child-with-stale-page-test
  (let [conn (hierarchy-conn)
        child-uuid #uuid "33333333-3333-3333-3333-333333333333"
        tx [[:db/add 3 :block/parent 2]
            {:db/id "child" :block/uuid child-uuid :block/parent 4 :block/page 1}]
        sanitized (tx-sanitize/sanitize-tx @conn tx)
        db (:db-after (d/with @conn sanitized))]
    (is (= 2 (-> (d/entity db [:block/uuid child-uuid]) :block/page :db/id)))
    (is (= 4 (-> (d/entity db [:block/uuid child-uuid]) :block/parent :db/id)))))

(deftest sanitize-tx-move-then-delete-old-page-test
  (let [conn (hierarchy-conn)]
    (d/transact! conn (tx-sanitize/sanitize-tx @conn [[:db/add 3 :block/parent 2]]))
    (d/transact! conn (tx-sanitize/sanitize-tx @conn [[:db/retractEntity 1]]))
    (is (= [2 2 2] (mapv #(-> (d/entity @conn %) :block/page :db/id) [3 4 5])))
    (is (nil? (d/entity @conn 1)))))

(deftest sanitize-tx-preserves-page-anchors-and-retracted-children-test
  (let [conn (hierarchy-conn)]
    (d/transact! conn [{:db/id 6 :db/ident :user.property/example :block/parent 3}
                      {:db/id 7 :block/parent 6 :block/page 6}])
    (let [tx [[:db/add 3 :block/parent 2] [:db/retractEntity 4]]
          db (:db-after (d/with @conn (tx-sanitize/sanitize-tx @conn tx)))]
      (is (= 2 (-> (d/entity db 3) :block/page :db/id)))
      (is (= 6 (-> (d/entity db 7) :block/page :db/id)))
      (is (nil? (:block/page (d/entity db 6))))
      (is (nil? (d/entity db 4)))
      (is (nil? (d/entity db 5))))))

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
