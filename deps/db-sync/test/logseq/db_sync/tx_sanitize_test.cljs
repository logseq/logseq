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
