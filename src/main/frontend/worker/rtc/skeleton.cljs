(ns frontend.worker.rtc.skeleton
  "Validate skeleton data between server and client"
  (:require [datascript.core :as d]
            [frontend.worker.rtc.ws-util :as ws-util]
            [logseq.db :as ldb]
            [missionary.core :as m]))

(defn- block-ref-type-attributes
  [db-schema]
  (->> db-schema
       (keep (fn [[k v]]
               (when (and (keyword? k)
                          (= :db.type/ref (:db/valueType v)))
                 k)))
       set))

(defn- block-card-many-attributes
  [db-schema]
  (->> db-schema
       (keep (fn [[k v]]
               (when (and (keyword? k)
                          (= :db.cardinality/many (:db/cardinality v)))
                 k)))
       set))

(defn- get-builtin-db-ident-blocks
  [db]
  (let [db-schema (d/schema db)
        block-ref-type-attrs (block-ref-type-attributes db-schema)
        block-card-many-attrs (block-card-many-attributes db-schema)
        pull-pattern ['* (into {} (map (fn [k] [k [:block/uuid]]) block-ref-type-attrs))]
        block-ids (->> (d/q '[:find ?b
                              :in $
                              :where
                              [?b :db/ident]
                              [?b :block/uuid]
                              [?b :logseq.property/built-in?]]
                            db)
                       (apply concat))]
    (map (fn [m]
           (into {}
                 (keep
                  (fn [[k v]]
                    (when-not (contains? #{:db/id} k)
                      (let [v-converter
                            (case [(contains? block-ref-type-attrs k)
                                   (contains? block-card-many-attrs k)]
                              [true true] (partial map :block/uuid)
                              [true false] :block/uuid
                              [false true] (partial map ldb/write-transit-str)
                              [false false] ldb/write-transit-str)
                            v* (v-converter v)
                            v** (if (contains? #{:db/ident :block/order} k)
                                  (ldb/read-transit-str v*)
                                  v*)]
                        [k v**]))))
                 m))
         (d/pull-many db pull-pattern block-ids))))

(defn- get-schema-version
  [db]
  (:kv/value (d/entity db :logseq.kv/schema-version)))

(defn new-task--calibrate-graph-skeleton
  [get-ws-create-task graph-uuid conn t]
  (m/sp
    (let [db @conn
          db-ident-blocks (get-builtin-db-ident-blocks db)
          r (m/? (ws-util/send&recv get-ws-create-task
                                    {:action "calibrate-graph-skeleton"
                                     :graph-uuid graph-uuid
                                     :t t
                                     :db-ident-blocks db-ident-blocks
                                     :schema-version (get-schema-version db)}))]
      (if-let [remote-ex (:ex-data r)]
        (throw (ex-info "Unavailable" {:remote-ex remote-ex}))
        (let [server-only-db-ident-blocks (some-> (:server-only-db-ident-blocks r)
                                                  ldb/read-transit-str)]
          (when (seq server-only-db-ident-blocks)
            (throw (ex-info "different graph skeleton between server and client"
                            {:type :rtc.exception/different-graph-skeleton
                             :server-schema-version (:server-schema-version r)
                             :server-only-db-ident-blocks server-only-db-ident-blocks}))))))))
