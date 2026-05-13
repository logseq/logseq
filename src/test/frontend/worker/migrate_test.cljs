(ns frontend.worker.migrate-test
  (:require ["fs" :as fs-node]
            [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [frontend.worker.db.migrate :as db-migrate]
            [logseq.db :as ldb]
            [logseq.db.frontend.schema :as db-schema]))

(defn- entities-with
  [db attr]
  (seq
   (d/q '[:find [?e ...]
          :in $ ?attr
          :where
          [?e ?attr]]
        db
        attr)))

(def ^:private legacy-65-24-schema
  (merge db-schema/schema
         {:block/pre-block? {:db/index true}
          :logseq.property.embedding/hnsw-label {:db/index true}
          :logseq.property.embedding/hnsw-label-updated-at {:db/index true}}))

(deftest ensure-built-in-data-exists!
  (let [db-transit (str (fs-node/readFileSync "src/test/migration/64.8.transit"))
        db (ldb/read-transit-str db-transit)
        conn (d/conn-from-db db)
        initial-version (:kv/value (d/entity @conn :logseq.kv/graph-initial-schema-version))
        graph-created-at (:kv/value (d/entity @conn :logseq.kv/graph-created-at))
        _ (assert (= {:major 64 :minor 8} initial-version))
        _ (assert (some? graph-created-at))
        _ (db-migrate/ensure-built-in-data-exists! conn)]
    (is (= initial-version
           (:kv/value (d/entity @conn :logseq.kv/graph-initial-schema-version)))
        "Initial version not changed by fn")
    (is (= graph-created-at
           (:kv/value (d/entity @conn :logseq.kv/graph-created-at)))
        "Graph created at not changed by fn")))

(deftest migrate-65-25-deletes-legacy-properties
  (let [conn (d/create-conn legacy-65-24-schema)
        legacy-block-uuid #uuid "11111111-1111-1111-1111-111111111111"
        legacy-attrs [:block/pre-block?
                      :logseq.property.embedding/hnsw-label
                      :logseq.property.embedding/hnsw-label-updated-at]]
    (d/transact! conn
                 [{:db/ident :logseq.kv/schema-version
                   :kv/value {:major 65 :minor 24}}
                  {:db/ident :logseq.property.embedding/hnsw-label
                   :block/uuid #uuid "22222222-2222-2222-2222-222222222222"
                   :block/title "HNSW label"}
                  {:db/ident :logseq.property.embedding/hnsw-label-updated-at
                   :block/uuid #uuid "33333333-3333-3333-3333-333333333333"
                   :block/title "HNSW label updated-at"}
                  {:block/uuid legacy-block-uuid
                   :block/title "legacy block"
                   :block/pre-block? true
                   :logseq.property.embedding/hnsw-label "label"
                   :logseq.property.embedding/hnsw-label-updated-at 123}])
    (is (every? #(entities-with @conn %) legacy-attrs))
    (is (some? (d/entity @conn :logseq.property.embedding/hnsw-label)))
    (is (some? (d/entity @conn :logseq.property.embedding/hnsw-label-updated-at)))

    (db-migrate/migrate conn :target-version {:major 65 :minor 25})

    (is (= {:major 65 :minor 25}
           (:kv/value (d/entity @conn :logseq.kv/schema-version))))
    (is (every? #(nil? (entities-with @conn %)) legacy-attrs))
    (is (nil? (d/entity @conn :logseq.property.embedding/hnsw-label)))
    (is (nil? (d/entity @conn :logseq.property.embedding/hnsw-label-updated-at)))
    (is (= "legacy block"
           (:block/title (d/entity @conn [:block/uuid legacy-block-uuid]))))))
