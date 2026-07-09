(ns logseq.db-sync.tx-sanitize-test
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.set :as set]
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
