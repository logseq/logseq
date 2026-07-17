(ns logseq.melange.bridge.platform.datascript
  "Primitive DataScript capabilities used by DB bridge workflows."
  (:require [datascript.conn :as conn]
            [datascript.core :as d]
            [datascript.impl.entity :as entity]
            [datascript.storage :as storage]
            [datascript.transit :as transit]))

(defn create-conn
  ([]
   (d/create-conn {:block/uuid {:db/unique :db.unique/identity}}))
  ([schema]
   (d/create-conn schema))
  ([schema options]
   (d/create-conn schema options)))

(def database deref)
(def restore-conn d/restore-conn)
(def conn-from-db d/conn-from-db)
(def transact! d/transact!)
(def transact transact!)
(def entity d/entity)
(def datoms d/datoms)
(def rseek-datoms d/rseek-datoms)
(def query d/q)
(def q query)
(def pull d/pull)
(def pull-many d/pull-many)
(def with d/with)
(def store d/store)
(def squuid d/squuid)
(def entity? entity/entity?)
(def lookup-entity @#'entity/lookup-entity)

(defn unsafe-entity
  [db entity-id]
  (entity/Entity. db entity-id (volatile! false) (volatile! {})))

(defn entity-type
  []
  entity/Entity)

(defn entity-kv
  [^js value]
  (.-kv value))

(def transit-write-handlers transit/write-handlers)
(def transit-read-handlers transit/read-handlers)

(defn storage-for
  [db]
  (storage/storage db))

(defn store-after-transact!
  [connection tx-report]
  (conn/store-after-transact! connection tx-report))

(defn run-callbacks
  [connection tx-report]
  (conn/run-callbacks connection tx-report))

(defn- connection-with-database
  [db]
  (let [connection (create-conn (:schema db))
        state (cond-> {:db db}
                (storage-for db)
                (assoc :tx-tail [] :db-last-stored db))]
    (swap! (:atom connection) merge state)
    connection))

(defn- create-temporary-connection
  [db]
  (doto (connection-with-database db)
    (swap! assoc
           :skip-store? true
           :skip-validate-db? true
           :batch-tx? true)))

(def listen! d/listen!)
(def report-db-before :db-before)
(def report-db-after :db-after)
(def report-datoms :tx-data)
(def report-tx-metadata :tx-meta)

(defn unlisten
  [conn key]
  (swap! (:atom conn) update :listeners dissoc key))

(defn adapter
  []
  #js {:createConn (fn [schema options]
                     (if (some? options)
                       (create-conn schema options)
                       (create-conn schema)))
       :restoreConn restore-conn
       :createConnWithStorage (fn [schema storage]
                                (create-conn schema {:storage storage}))
       :database database
       :connectionSkipsValidation
       (fn [connection]
         (boolean (:skip-validate-db? @connection)))
       :createTemporaryConnection create-temporary-connection
       :connectionBatchActive
       (fn [connection]
         (boolean (:batch-tx? @connection)))
       :beginBatch
       (fn [connection]
         (swap! connection assoc :skip-store? true :batch-tx? true))
       :endBatch
       (fn [connection]
         (swap! connection dissoc :skip-store? :batch-tx?))
       :resetDatabase reset!
       :releaseConnection
       (fn [connection]
         (reset! connection nil))
       :markDatabaseStored
       (fn [connection db]
         (swap! (:atom connection) assoc
                :tx-tail []
                :db-last-stored db))
       :compareAndSetDatabase compare-and-set!
       :databaseSchema (fn [db] (:schema db))
       :entity entity
       :entityDb (fn [value]
                   (when (entity? value)
                     (.-db ^js value)))
       :entityGet (fn [entity attribute] (get entity attribute))
       :entityIs entity?
       :datoms (fn [db index components]
                 (to-array (apply datoms db index (array-seq components))))
       :rseekDatoms (fn [db index components]
                      (to-array (apply rseek-datoms db index (array-seq components))))
       :query (fn [form db inputs]
                (apply query form db (array-seq inputs)))
       :pull pull
       :pullAll (fn [db lookup] (pull db '[*] lookup))
       :pullMany (fn [db pattern lookups]
                   (to-array (pull-many db pattern (array-seq lookups))))
       :withTx (fn [db tx-data tx-meta]
                 (if (some? tx-meta)
                   (with db tx-data tx-meta)
                   (with db tx-data)))
       :transact (fn [connection tx-data tx-meta]
                   (if (some? tx-meta)
                     (transact connection tx-data tx-meta)
                     (transact connection tx-data)))
       :listen listen!
       :unlisten unlisten
       :reportDbBefore (fn [report] (report-db-before report))
       :reportDbAfter (fn [report] (report-db-after report))
       :reportDatoms (fn [report] (to-array (report-datoms report)))
       :reportTxMetadata (fn [report] (report-tx-metadata report))
       :makeTransactionReport
       (fn [db-before db-after tx-meta tx-data]
         {:db-before db-before
          :db-after db-after
          :tx-meta tx-meta
          :tx-data (vec (array-seq tx-data))})
       :datomEntity (fn [datom] (:e datom))
       :datomAttribute (fn [datom] (:a datom))
       :datomValue (fn [datom] (:v datom))
       :datomAdded (fn [datom] (boolean (:added datom)))
       :datomEquals (fn [left right] (= left right))
       :datomFromValue (fn [value]
                         (when (and (some? (:e value))
                                    (some? (:a value))
                                    (not= ::missing (get value :added ::missing)))
                           value))
       :storageFor storage-for
       :store store
       :storeAfterTransact store-after-transact!
       :runCallbacks run-callbacks
       :squuid squuid})
