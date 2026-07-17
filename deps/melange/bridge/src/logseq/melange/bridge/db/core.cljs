(ns logseq.melange.bridge.db.core
  "Main namespace for db fns. All fns are only for DB graphs"
  (:require ["@logseq/melange-js-api/db" :as melange-db]
            [logseq.melange.bridge.common.uuid :as melange-uuid]
            [logseq.melange.bridge.db.initial-data :as common-initial-data]
            [logseq.melange.bridge.db.class :as db-class]
            [logseq.melange.bridge.db.entity :as entity-util]
            [logseq.melange.bridge.db.entity-plus]
            [logseq.melange.bridge.db.frontend :as db-db]
            [logseq.melange.bridge.db.property :as melange-property]
            [logseq.melange.bridge.platform.datascript :as d]
            [logseq.melange.bridge.db.sqlite.util :as sqlite-util]
            [logseq.melange.bridge.common.log :as log]
            [logseq.melange.bridge.runtime :as runtime])
  (:refer-clojure :exclude [object?]))

(def ^:private bidirectional-api (.-Bidirectional melange-db))
(def ^:private core-read-api (.-CoreRead melange-db))
(def ^:private tree-workflow-api (.-TreeWorkflow melange-db))
(def ^:private transaction-policy-api (.-TransactionPolicy melange-db))
(def ^:private transaction-execution-api (.-TransactionExecution melange-db))
(def ^:private transaction-workflow-api (.-TransactionWorkflow melange-db))
(def ^:private transaction-runtime-api (.-TransactionRuntime melange-db))

(def built-in? entity-util/built-in?)
(def built-in-class-property? db-db/built-in-class-property?)
(def private-built-in-page? db-db/private-built-in-page?)

(def write-transit-str sqlite-util/write-transit-str)
(def read-transit-str sqlite-util/read-transit-str)
(defn build-favorite-tx
  [favorite-uuid]
  (let [favorite ((.-favorite transaction-policy-api) (str favorite-uuid))]
    {:block/link [:block/uuid (uuid (.-linkUuid ^js favorite))]
     :block/title (.-title ^js favorite)}))

(def ^:dynamic *batch-tx-report?* false)

(defn register-transact-fn!
  [f]
  ((.-registerTransact transaction-runtime-api) f))
(defn register-transact-invalid-callback-fn!
  [f]
  ((.-registerInvalidCallback transaction-runtime-api) f))
(defn register-transact-pipeline-fn!
  [f]
  ((.-registerPipeline transaction-runtime-api) f))

(defn transact-fn [] ((.-transactCallback transaction-runtime-api)))
(defn transact-invalid-callback [] ((.-invalidCallback transaction-runtime-api)))
(defn transact-pipeline-fn [] ((.-pipelineCallback transaction-runtime-api)))

(defn entity->db-id
  [tx-data]
  ((.-replaceEntities transaction-workflow-api)
   (runtime/runtime-adapter)
   (d/adapter)
   tx-data))

(defn- tx-report-pipeline-data
  [tx-report]
  (map (fn [[e a v t]]
         [e a v t])
       (:tx-data tx-report)))

(defn- invalid-tx-debug-data
  [tx-meta tx-data errors tx-report]
  {:tx-meta tx-meta
   :tx-data tx-data
   :errors errors
   :pipeline-tx-data (tx-report-pipeline-data tx-report)})

(defn- invalid-tx-error
  [tx-meta tx-data errors tx-report]
  (let [debug-data (invalid-tx-debug-data tx-meta tx-data errors tx-report)]
    (prn :debug :invalid-data debug-data)
    (prn :debug :errors errors)
    (ex-info "DB write failed with invalid data" debug-data)))

(defn- unwrap-melange-error
  [error]
  (loop [^js error error]
    (let [id (.-MEL_EXN_ID error)
          nested (.-_1 error)]
      (if (and (string? id)
               (.startsWith id "Js__Js_exn.Error/")
               (some? nested))
        (recur nested)
        error))))

(defn- transaction-execution-adapter
  []
  #js {:makeInvalidError invalid-tx-error
       :makeParentError
       (fn [tx-data]
         (ex-info "Page can't have block as parent" {:tx-data tx-data}))
       :errorCode
       (fn [error]
         (some-> (unwrap-melange-error error)
                 ex-data
                 :error
                 runtime/to-string))
       :rethrowError
       (fn [error]
         (throw (unwrap-melange-error error)))
       :logFailure
       (fn [error tx-meta tx-data]
         (let [error (unwrap-melange-error error)]
           (prn :debug :transact-failed
                :tx-meta tx-meta
                :tx-data tx-data
                :error (str error))
           (js/console.error error)))
       :createCollector
       (fn []
         (volatile! []))
       :appendCollector
       (fn [collector values]
         (vswap! collector into (array-seq values)))
       :collectorValue deref
       :clearCollector
       (fn [collector]
         (vreset! collector nil))
       :makeNestedError
       (fn [tx-meta]
         (ex-info "batch-transact! can't be nested called" {:tx-meta tx-meta}))
       :logBatchError log/error
       :localConnection identity
       :localResult identity
       :makeMissingTargetError
       (fn [target]
         (ex-info "Local transaction requires a DataScript connection"
                  {:target target}))})

(defn transact!
  "`repo-or-conn`: repo for UI thread and conn for worker/node"
  ([repo-or-conn tx-data]
   (transact! repo-or-conn tx-data nil))
  ([repo-or-conn tx-data tx-meta]
   ((.-transactOwnedWith transaction-execution-api)
    (runtime/runtime-adapter)
    (d/adapter)
    (transaction-execution-adapter)
    repo-or-conn
    tx-data
    tx-meta
    *batch-tx-report?*)))

(defn batch-transact-with-temp-conn!
  "Run batched tx work against a temporary conn, then apply all collected tx-data
  to `conn` with a single final `transact!`.

  Semantics:
  - Uses `d/conn-from-db` so batch work runs on an isolated in-memory conn.
  - Temp conn can still read from storage-backed db state, but cannot write to disk
    (`:skip-store? true`).
  - Defers db validation during inner batch ops (`:skip-validate-db? true`), then
    validates on the final `transact!` to `conn`.
  - Supports nested usage.

  Notes:
  - `batch-tx-fn` is called as `(batch-tx-fn temp-conn *batch-tx-data)`.
  - `listen-db` (if provided) receives each intermediate tx-report from temp conn.
  - Do not rely on returned tx-report shape for undo/redo behavior."
  [conn tx-meta batch-tx-fn & {:keys [listen-db before-commit]}]
  ((.-batchWithTemp transaction-execution-api)
   (runtime/runtime-adapter)
   (d/adapter)
   (transaction-execution-adapter)
   conn
   tx-meta
   batch-tx-fn
   listen-db
   before-commit
   transact!
   ::temp-conn-batch-tx))

(defn batch-transact!
  "Run batched tx work on `conn` and persist once at the end.
  Not nestable; throws when called inside another `:batch-tx?`."
  [conn tx-meta batch-tx-fn & {:keys [listen-db]}]
  ((.-batchWith transaction-execution-api)
   (runtime/runtime-adapter)
   (d/adapter)
   (transaction-execution-adapter)
   conn
   tx-meta
   (fn [connection]
     (binding [*batch-tx-report?* true]
       (batch-tx-fn connection)))
   listen-db
   ::batch-tx))

(def page? entity-util/page?)
(def internal-page? entity-util/internal-page?)
(def class? entity-util/class?)
(def property? entity-util/property?)
(def closed-value? entity-util/closed-value?)
(def journal? entity-util/journal?)
(def hidden? entity-util/hidden?)
(def recycled? entity-util/recycled?)
(def object? entity-util/object?)
(def asset? entity-util/asset?)
(def public-built-in-property? melange-property/public-built-in-property?)
(def get-entity-types entity-util/get-entity-types)
(defn sort-by-order
  [blocks]
  (or (seq ((.-sortWith tree-workflow-api)
            (runtime/runtime-adapter)
            (d/adapter)
            (to-array blocks)))
      ()))

(defn get-block-and-children
  [db block-uuid & {:keys [include-property-block?]
                    :or {include-property-block? false}}]
  (some-> ((.-blockAndChildrenWith tree-workflow-api)
           (runtime/runtime-adapter)
           (d/adapter)
           db
           block-uuid
           (boolean include-property-block?))
          seq))

(defn get-page-blocks
  "Return blocks of the designated page, without using cache.
   page-id - eid"
  [db page-id & {:keys [pull-keys]
                 :or {pull-keys '[*]}}]
  (some-> ((.-pageBlocksByPageWith core-read-api)
           (runtime/runtime-adapter)
           (d/adapter)
           db
           page-id
           pull-keys)
          array-seq
          vec))

(defn get-page-blocks-count
  [db page-id]
  ((.-pageBlocksCountWith core-read-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   page-id))

(defn get-right-sibling
  [block]
  (assert (or (d/entity? block) (nil? block)))
  ((.-siblingWith tree-workflow-api)
   (runtime/runtime-adapter)
   (d/adapter)
   block
   "right"))

(defn get-left-sibling
  [block]
  (assert (or (d/entity? block) (nil? block)))
  ((.-siblingWith tree-workflow-api)
   (runtime/runtime-adapter)
   (d/adapter)
   block
   "left"))

(defn get-down
  [block]
  (assert (or (d/entity? block) (nil? block)))
  ((.-firstChildOfWith tree-workflow-api)
   (runtime/runtime-adapter)
   (d/adapter)
   block))

(defn get-pages
  [db]
  (map identity
       (array-seq
        ((.-pagesWith core-read-api)
         (runtime/runtime-adapter)
         (d/adapter)
         db))))

(def get-first-page-by-name common-initial-data/get-first-page-by-name)

(defn page-exists?
  "Returns all page db ids that given title and one of the given `tags`."
  [db page-name tags]
  (some-> ((.-pageExistsInputWith core-read-api)
           (runtime/runtime-adapter)
           (d/adapter)
           db
           page-name
           tags)
          seq))

(defn get-page
  "Get a page given its unsanitized name or uuid"
  [db page-id-name-or-uuid]
  ((.-pageByReferenceWith core-read-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   page-id-name-or-uuid))

(defn get-journal-page
  "Get a journal page given its unsanitized name.
   This will be useful for DB graphs later as we can switch to a different lookup
  approach for journals e.g. like get-built-in-page"
  [db page-name]
  ((.-journalPageByDatabaseWith core-read-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   page-name))

(defn get-journal-page-by-day
  "Get a journal page given its :block/journal-day value."
  [db journal-day]
  ((.-journalPageByDayInputWith core-read-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   journal-day))

(def get-built-in-page db-db/get-built-in-page)

(def library? db-db/library?)
(defn get-library-page
  [db]
  ((.-libraryPageWith core-read-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db))

(defn get-case-page
  "Case sensitive version of get-page. For use with DB graphs"
  [db page-name-or-uuid]
  ((.-casePageByReferenceWith core-read-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   page-name-or-uuid))

(defn page-empty?
  "Whether a page is empty. Does it has a non-page block?
  `page-id` could be either a string or a db/id."
  [db page-id]
  ((.-pageEmptyByReferenceWith core-read-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   page-id))

(defn get-first-child
  [db id]
  ((.-firstChildWith tree-workflow-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   "id"
   id))

(defn get-orphaned-pages
  [db {:keys [pages empty-ref-f built-in-pages-names]}]
  ((.-orphanedPagesWith core-read-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   pages
   built-in-pages-names
   empty-ref-f))

(defn has-children?
  [db block-id]
  ((.-hasChildrenByReferenceWith core-read-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   block-id))

(defn get-block-last-direct-child-id
  "Notice: if `not-collapsed?` is true, will skip searching for any collapsed block."
  ([db db-id]
   (get-block-last-direct-child-id db db-id false))
  ([db db-id not-collapsed?]
   ((.-lastDirectChildIdWith core-read-api)
    (runtime/runtime-adapter)
    (d/adapter)
    db
    db-id
    (boolean not-collapsed?))))

(defn get-children
  "Doesn't include nested children."
  ([block-entity]
   (get-children nil block-entity))
  ([db block-entity-or-eid]
   (some-> ((.-childrenByReferenceWith tree-workflow-api)
            (runtime/runtime-adapter)
            (d/adapter)
            db
            block-entity-or-eid)
           seq)))

(defn get-block-parents
  "Returns parents entities"
  [db block-id & {:keys [depth] :or {depth 100}}]
  (map identity
       (array-seq
        ((.-parentsWith core-read-api)
         (runtime/runtime-adapter)
         (d/adapter)
         db
         block-id
         depth))))

(def get-block-children-ids common-initial-data/get-block-children-ids)
(def get-block-full-children-ids common-initial-data/get-block-full-children-ids)

(defn sort-page-random-blocks
  "Blocks could be non consecutive."
  [db blocks]
  (array-seq
   ((.-sortPageRandomBlocksWith core-read-api)
    (runtime/runtime-adapter)
    (d/adapter)
    db
    (to-array blocks))))

(defn last-child-block?
  "The child block could be collapsed."
  [db parent-id child-id]
  ((.-lastChildBlockWith core-read-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   parent-id
   child-id))

(defn get-non-consecutive-blocks
  [db blocks]
  (vec
   (array-seq
    ((.-nonConsecutiveBlocksWith core-read-api)
     (runtime/runtime-adapter)
     (d/adapter)
     db
     (to-array blocks)))))

(defn new-block-id
  []
  (melange-uuid/gen))

(defn get-alias-source-page
  "return the source page of an alias"
  [db alias-id]
  ((.-aliasSourcePageWith core-read-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   alias-id))

(def get-block-alias common-initial-data/get-block-alias)

(defn page-alias-set
  [db page-id]
  (set
   (array-seq
    ((.-pageAliasSetWith core-read-api)
     (runtime/runtime-adapter)
     (d/adapter)
     db
     page-id))))

(def get-block-refs-count common-initial-data/get-block-refs-count)

(defn hidden-or-internal-tag?
  [e]
  ((.-hiddenOrInternalTagWith core-read-api)
   (runtime/runtime-adapter)
   (d/adapter)
   e))

(defn get-all-pages
  [db]
  (map identity
       (array-seq
        ((.-allPagesWith core-read-api)
         (runtime/runtime-adapter)
         (d/adapter)
         db))))

(defn get-key-value
  [db key-ident]
  (assert (= "logseq.kv" (namespace key-ident)) key-ident)
  ((.-keyValueWith core-read-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   key-ident))

(def kv sqlite-util/kv)

(defn get-graph-rtc-uuid
  [db]
  ((.-optionalKeyValueWith core-read-api)
   (runtime/runtime-adapter) (d/adapter) db :logseq.kv/graph-uuid))

(defn get-graph-local-uuid
  [db]
  ((.-optionalKeyValueWith core-read-api)
   (runtime/runtime-adapter) (d/adapter) db :logseq.kv/local-graph-uuid))

(defn get-graph-schema-version
  [db]
  ((.-optionalKeyValueWith core-read-api)
   (runtime/runtime-adapter) (d/adapter) db :logseq.kv/schema-version))

(defn get-graph-remote-schema-version
  [db]
  ((.-optionalKeyValueWith core-read-api)
   (runtime/runtime-adapter) (d/adapter) db :logseq.kv/remote-schema-version))

(defn get-graph-rtc-e2ee?
  [db]
  ((.-optionalKeyValueWith core-read-api)
   (runtime/runtime-adapter) (d/adapter) db :logseq.kv/graph-rtc-e2ee?))

(def get-all-properties db-db/get-all-properties)
(def get-class-extends db-class/get-class-extends)
(def get-classes-parents db-db/get-classes-parents)
(def get-page-parents db-db/get-page-parents)
(def get-title-with-parents db-db/get-title-with-parents)
(def class-instance? db-db/class-instance?)
(def inline-tag? db-db/inline-tag?)
(def node-display-type-classes db-db/node-display-type-classes)
(def get-class-ident-by-display-type db-db/get-class-ident-by-display-type)
(def get-display-type-by-class-ident db-db/get-display-type-by-class-ident)

(def get-recent-updated-pages common-initial-data/get-recent-updated-pages)

(def get-latest-journals common-initial-data/get-latest-journals)

(defn get-pages-relation
  [db with-journal?]
  ((.-pagesRelationWith core-read-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   (boolean with-journal?)))

(defn get-all-tagged-pages
  [db]
  ((.-allTaggedPagesWith core-read-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db))

(defn page-in-library?
  "Check whether a `page` exists on the Library page"
  [db page]
  ((.-pageInLibraryWith core-read-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   page))

(def get-class-title-with-extends db-db/get-class-title-with-extends)

(defn get-bidirectional-properties
  "Given a target entity id, returns a seq of maps with:
   * :class - class entity
   * :title - pluralized class title
   * :entities - node entities that reference the target via ref properties"
  [db target-id]
  (seq
   ((.-getPropertiesWith bidirectional-api)
    (runtime/runtime-adapter)
    (d/adapter)
    db
    target-id)))
