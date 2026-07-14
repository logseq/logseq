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

(defn- extends-idents
  [db entity]
  (let [parents (:logseq.property.class/extends entity)]
    (map (fn [parent]
           (:db/ident (if (number? parent)
                        (d/entity db parent)
                        parent)))
         (cond
           (nil? parents) []
           (set? parents) parents
           (sequential? parents) parents
           :else [parents]))))

(defn- ref-ids
  [refs]
  (set
   (map (fn [ref]
          (if (number? ref) ref (:db/id ref)))
        (cond
          (nil? refs) []
          (set? refs) refs
          (sequential? refs) refs
          :else [refs]))))

(def ^:private legacy-65-24-schema
  (merge db-schema/schema
         {:block/pre-block? {:db/index true}
          :logseq.property.embedding/hnsw-label {:db/index true}
          :logseq.property.embedding/hnsw-label-updated-at {:db/index true}}))

(def ^:private delete-property-schema
  (merge db-schema/schema
         {:user.property/obsolete {:db/index true}
          :logseq.property/view-for {:db/valueType :db.type/ref}
          :logseq.property.view/type {:db/valueType :db.type/ref}
          :logseq.property.view/feature-type {}
          :logseq.property.history/block {:db/valueType :db.type/ref}
          :logseq.property.history/property {:db/valueType :db.type/ref}
          :logseq.property.history/scalar-value {}}))

(deftest delete-property-cleans-property-usages
  (let [conn (d/create-conn delete-property-schema)
        target-block-uuid #uuid "11111111-1111-1111-1111-111111111111"
        view-uuid #uuid "22222222-2222-2222-2222-222222222222"
        history-uuid #uuid "33333333-3333-3333-3333-333333333333"
        view-history-uuid #uuid "44444444-4444-4444-4444-444444444444"]
    (d/transact! conn
                 [{:db/ident :logseq.class/Property
                   :block/title "Property"}
                  {:db/ident :logseq.property.view/type.table
                   :block/title "Table View"}
                  {:db/ident :user.property/obsolete
                   :block/title "Obsolete property"
                   :block/tags #{:logseq.class/Property}}
                  {:block/uuid target-block-uuid
                   :block/title "target block"
                   :user.property/obsolete "stale value"}
                  {:block/uuid view-uuid
                   :block/title "view block"
                   :logseq.property/view-for :user.property/obsolete
                   :logseq.property.view/type :logseq.property.view/type.table
                   :logseq.property.view/feature-type :property}
                  {:block/uuid history-uuid
                   :block/title "history"
                   :logseq.property.history/block [:block/uuid target-block-uuid]
                   :logseq.property.history/property :user.property/obsolete
                   :logseq.property.history/scalar-value "stale value"}
                  {:block/uuid view-history-uuid
                   :block/title "view history"
                   :logseq.property.history/block [:block/uuid view-uuid]
                   :logseq.property.history/property :user.property/obsolete
                   :logseq.property.history/scalar-value "stale value"}])

    (d/transact! conn (db-migrate/delete-property @conn :user.property/obsolete))

    (let [db @conn]
      (is (nil? (d/entity db :user.property/obsolete)))
      (is (nil? (:user.property/obsolete (d/entity db [:block/uuid target-block-uuid]))))
      (is (nil? (d/entity db [:block/uuid view-uuid])))
      (is (nil? (d/entity db [:block/uuid history-uuid])))
      (is (nil? (d/entity db [:block/uuid view-history-uuid]))))))

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

(deftest migrate-65-25-adds-repeat-type-property
  (let [conn (d/create-conn db-schema/schema)]
    (d/transact! conn [{:db/ident :logseq.kv/schema-version
                        :kv/value {:major 65 :minor 25}}])

    (db-migrate/migrate conn)

    (is (= db-schema/version
           (:kv/value (d/entity @conn :logseq.kv/schema-version))))
    (let [property (d/entity @conn :logseq.property.repeat/repeat-type)]
      (is (some? property))
      (is (= :logseq.property.repeat/repeat-type.double-plus
             (:db/ident (:logseq.property/default-value property))))
      (is (= #{:logseq.property.repeat/repeat-type.dotted-plus
               :logseq.property.repeat/repeat-type.plus
               :logseq.property.repeat/repeat-type.double-plus}
             (set (map :db/ident (:property/closed-values property))))))))

(deftest migrate-65-26-adds-comments-blocks-property
  (let [conn (d/create-conn db-schema/schema)]
    (d/transact! conn [{:db/ident :logseq.kv/schema-version
                        :kv/value {:major 65 :minor 26}}])

    (db-migrate/migrate conn :target-version {:major 65 :minor 27})

    (is (= {:major 65 :minor 27}
           (:kv/value (d/entity @conn :logseq.kv/schema-version))))
    (let [property (d/entity @conn :logseq.property.comments/blocks)]
      (is (some? property))
      (is (= "Commented blocks" (:block/title property)))
      (is (= :node (:logseq.property/type property)))
      (is (true? (:logseq.property/hide? property)))
      (is (false? (:logseq.property/public? property))))))

(deftest migrate-65-28-tags-existing-comment-blocks
  (let [conn (d/create-conn db-schema/schema)
        comments-area-uuid #uuid "11111111-1111-1111-1111-111111111111"
        first-comment-uuid #uuid "22222222-2222-2222-2222-222222222222"
        second-comment-uuid #uuid "33333333-3333-3333-3333-333333333333"
        ordinary-child-uuid #uuid "44444444-4444-4444-4444-444444444444"]
    (d/transact! conn
                 [{:db/ident :logseq.kv/schema-version
                   :kv/value {:major 65 :minor 27}}
                  {:db/ident :logseq.class/Comments
                   :block/title "Comments"}
                  {:db/ident :logseq.class/Task
                   :block/title "Task"}
                  {:block/uuid comments-area-uuid
                   :block/title "Comments"
                   :block/tags #{:logseq.class/Comments}}
                  {:block/uuid first-comment-uuid
                   :block/title "first comment"
                   :block/parent [:block/uuid comments-area-uuid]}
                  {:block/uuid second-comment-uuid
                   :block/title "second comment"
                   :block/parent [:block/uuid comments-area-uuid]
                   :block/tags #{:logseq.class/Task}}
                  {:block/uuid ordinary-child-uuid
                   :block/title "ordinary child"}])

    (db-migrate/migrate conn :target-version {:major 65 :minor 28})

    (is (= {:major 65 :minor 28}
           (:kv/value (d/entity @conn :logseq.kv/schema-version))))
    (is (some? (d/entity @conn :logseq.class/Comment)))
    (is (= #{:logseq.class/Comment}
           (set (map :db/ident (:block/tags (d/entity @conn [:block/uuid first-comment-uuid]))))))
    (is (= #{:logseq.class/Task :logseq.class/Comment}
           (set (map :db/ident (:block/tags (d/entity @conn [:block/uuid second-comment-uuid]))))))
    (is (= #{:logseq.class/Comments}
           (set (map :db/ident (:block/tags (d/entity @conn [:block/uuid comments-area-uuid]))))))
    (is (empty? (:block/tags (d/entity @conn [:block/uuid ordinary-child-uuid]))))))

(deftest migrate-65-29-adds-single-block-comment-targets
  (let [conn (d/create-conn db-schema/schema)
        target-uuid #uuid "11111111-1111-1111-1111-111111111111"
        comments-area-uuid #uuid "22222222-2222-2222-2222-222222222222"
        range-comments-uuid #uuid "33333333-3333-3333-3333-333333333333"
        range-target-uuid #uuid "44444444-4444-4444-4444-444444444444"]
    (d/transact! conn
                 [{:db/ident :logseq.kv/schema-version
                   :kv/value {:major 65 :minor 28}}
                  {:db/ident :logseq.class/Comments
                   :block/title "Comments"}
                  {:block/uuid target-uuid
                   :block/title "target"}
                  {:block/uuid comments-area-uuid
                   :block/title "Comments"
                   :block/parent [:block/uuid target-uuid]
                   :block/tags #{:logseq.class/Comments}}
                  {:block/uuid range-target-uuid
                   :block/title "range target"}
                  {:block/uuid range-comments-uuid
                   :block/title "Comments"
                   :block/tags #{:logseq.class/Comments}}])
    (d/transact! conn
                 [[:db/add
                   (:db/id (d/entity @conn [:block/uuid range-comments-uuid]))
                   :logseq.property.comments/blocks
                   (:db/id (d/entity @conn [:block/uuid range-target-uuid]))]])

    (db-migrate/migrate conn :target-version {:major 65 :minor 29})

    (is (= {:major 65 :minor 29}
           (:kv/value (d/entity @conn :logseq.kv/schema-version))))
    (is (= #{(:db/id (d/entity @conn [:block/uuid target-uuid]))}
           (set (map :db/id
                     (:logseq.property.comments/blocks
                      (d/entity @conn [:block/uuid comments-area-uuid]))))))
    (is (= #{(:db/id (d/entity @conn [:block/uuid range-target-uuid]))}
           (set (map :db/id
                     (:logseq.property.comments/blocks
                      (d/entity @conn [:block/uuid range-comments-uuid])))))
        "Existing range comment targets should be preserved")))

(deftest migrate-65-27-with-missing-comments-built-ins-does-not-crash
  (let [conn (d/create-conn db-schema/schema)]
    (d/transact! conn [{:db/ident :logseq.kv/schema-version
                        :kv/value {:major 65 :minor 27}}
                       {:db/ident :logseq.class/Root
                        :block/title "Root Tag"}])

    (is (nil? (d/entity @conn :logseq.class/Comments)))
    (is (nil? (d/entity @conn :logseq.property.comments/blocks)))

    (db-migrate/migrate conn :target-version {:major 65 :minor 33})

    (is (= {:major 65 :minor 33}
           (:kv/value (d/entity @conn :logseq.kv/schema-version))))
    (is (some? (d/entity @conn :logseq.class/Comments)))
    (is (some? (d/entity @conn :logseq.class/Comment)))
    (is (some? (d/entity @conn :logseq.property.comments/blocks)))))

(deftest migrate-65-30-adds-assignee-property
  (let [conn (d/create-conn db-schema/schema)]
    (d/transact! conn [{:db/ident :logseq.kv/schema-version
                        :kv/value {:major 65 :minor 29}}])

    (let [result (db-migrate/migrate conn :target-version {:major 65 :minor 30})]
      (is (= {:major 65 :minor 30}
             (:kv/value (d/entity @conn :logseq.kv/schema-version))))
      (let [property (d/entity @conn :logseq.property/assignee)]
        (is (some? property))
        (is (= "Assignee" (:block/title property)))
        (is (= :node (:logseq.property/type property)))
        (is (= :db.cardinality/many (:db/cardinality property)))
        (is (true? (:logseq.property/public? property))))
      (is (some #(= {:properties [:logseq.property/assignee]}
                    (:migrate-updates %))
                (:upgrade-result-coll result))))))

(deftest migrate-65-31-adds-agent-session-id-property
  (let [conn (d/create-conn db-schema/schema)]
    (d/transact! conn [{:db/ident :logseq.kv/schema-version
                        :kv/value {:major 65 :minor 30}}])

    (let [result (db-migrate/migrate conn :target-version {:major 65 :minor 31})]
      (is (= {:major 65 :minor 31}
             (:kv/value (d/entity @conn :logseq.kv/schema-version))))
      (let [property (d/entity @conn :logseq.property.agent/session-id)]
        (is (some? property))
        (is (= "Agent Session ID" (:block/title property)))
        (is (= :string (:logseq.property/type property)))
        (is (true? (:logseq.property/public? property)))
        (is (true? (:logseq.property/hide? property)))
        (is (= "Stores the AgentBridge session ID for a routed task."
               (:block/title (:logseq.property/description property)))))
      (is (some #(= {:properties [:logseq.property.agent/session-id]}
                    (:migrate-updates %))
                (:upgrade-result-coll result))))))

(deftest migrate-65-32-adds-root-extends-to-comment-classes
  (let [conn (d/create-conn db-schema/schema)
        target-uuid #uuid "11111111-1111-1111-1111-111111111111"
        comments-area-uuid #uuid "22222222-2222-2222-2222-222222222222"]
    (d/transact! conn [{:db/ident :logseq.kv/schema-version
                        :kv/value {:major 65 :minor 31}}
                       {:db/ident :logseq.class/Root
                        :block/title "Root Tag"}
                       {:db/ident :logseq.class/Comments
                        :block/title "Comments"
                        :block/order "a0"}
                       {:db/ident :logseq.class/Comment
                        :block/title "Comment"
                        :block/order "a1"}
                       {:block/uuid target-uuid
                        :block/title "target"}
                       {:block/uuid comments-area-uuid
                        :block/title "Comments"
                        :block/parent [:block/uuid target-uuid]
                        :block/tags #{:logseq.class/Comments}}])

    (let [result (db-migrate/migrate conn :target-version {:major 65 :minor 32})
          migration-report (first (:upgrade-result-coll result))
          migration-db (:db-after migration-report)]

      (is (= {:major 65 :minor 32}
             (:kv/value (d/entity @conn :logseq.kv/schema-version))))
      (is (= [:logseq.class/Root]
             (extends-idents migration-db (d/entity migration-db :logseq.class/Comments))))
      (is (nil? (:block/order (d/entity migration-db :logseq.class/Comments))))
      (is (= [:logseq.class/Root]
             (extends-idents migration-db (d/entity migration-db :logseq.class/Comment))))
      (is (nil? (:block/order (d/entity migration-db :logseq.class/Comment))))
      (is (= #{(:db/id (d/entity migration-db [:block/uuid target-uuid]))}
             (ref-ids (:logseq.property.comments/blocks
                       (d/entity migration-db [:block/uuid comments-area-uuid]))))))))

(deftest migrate-65-33-adds-gallery-view-properties
  (let [conn (d/create-conn db-schema/schema)
        property-idents [:logseq.property.view/gallery-asset-property
                         :logseq.property.view/gallery-display-properties
                         :logseq.property.view/gallery-card-size
                         :logseq.property.view/gallery-card-width
                         :logseq.property.view/gallery-card-height]]
    (d/transact! conn [{:db/ident :logseq.kv/schema-version
                        :kv/value {:major 65 :minor 32}}])

    (is (every? nil? (map #(d/entity @conn %) property-idents)))

    (db-migrate/migrate conn :target-version {:major 65 :minor 33})

    (is (= {:major 65 :minor 33}
           (:kv/value (d/entity @conn :logseq.kv/schema-version))))
    (is (every? some? (map #(d/entity @conn %) property-idents)))
    (is (= :property
           (:logseq.property/type
            (d/entity @conn :logseq.property.view/gallery-asset-property))))
    (is (= :db.cardinality/many
           (:db/cardinality
            (d/entity @conn :logseq.property.view/gallery-display-properties))))
    (is (= :keyword
           (:logseq.property/type
            (d/entity @conn :logseq.property.view/gallery-card-size))))
    (is (= :default
           (:logseq.property/scalar-default-value
            (d/entity @conn :logseq.property.view/gallery-card-size))))
    (is (every? #(= :raw-number (:logseq.property/type (d/entity @conn %)))
                [:logseq.property.view/gallery-card-width
                 :logseq.property.view/gallery-card-height]))))
