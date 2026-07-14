(ns frontend.worker.db-core
  "Core db-worker logic without host-specific bootstrap."
  (:require
   [cljs-bean.core :as bean]
   [cljs.cache :as cache]
   [cljs.reader]
   [clojure.set]
   [clojure.string :as string]
   [clojure.walk :as walk]
   [datascript.core :as d]
   [datascript.impl.entity :as de]
   [datascript.storage :refer [IStorage] :as storage]
   [frontend.common.cache :as common.cache]
   [frontend.common.thread-api :as thread-api :refer [def-thread-api]]
   [frontend.worker-common.util :as worker-util]
   [frontend.worker.db-listener :as db-listener]
   [frontend.worker.db.fix :as db-fix]
   [frontend.worker.db.migrate :as db-migrate]
   [frontend.worker.db.validate :as worker-db-validate]
   [frontend.worker.export :as worker-export]
   [frontend.worker.graph-view :as graph-view]
   [frontend.worker.handler.comments :as comments]
   [frontend.worker.handler.property]
   [frontend.worker.handler.view]
   [frontend.worker.markdown-mirror :as markdown-mirror]
   [frontend.worker.pipeline :as worker-pipeline]
   [frontend.worker.plain-value :as worker-plain]
   [frontend.worker.platform :as platform]
   [frontend.worker.publish]
   [frontend.worker.query-dsl :as query-dsl]
   [frontend.worker.search :as search]
   [frontend.worker.shared-service :as shared-service]
   [frontend.worker.state :as worker-state]
   [frontend.worker.sync :as db-sync]
   [frontend.worker.sync.client-op :as client-op]
   [frontend.worker.sync.crypt :as sync-crypt]
   [frontend.worker.sync.download :as sync-download]
   [frontend.worker.thread-atom]
   [frontend.worker.undo-redo :as worker-undo-redo]
   [goog.functions :as gfun]
   [lambdaisland.glogi :as log]
   [logseq.api.db-based.tools :as api-tools]
   [logseq.cli.common.db-worker :as cli-db-worker]
   [logseq.common.config :as common-config]
   [logseq.common.graph-dir :as graph-dir]
   [logseq.common.util :as common-util]
   [logseq.common.util.page-ref :as page-ref]
   [logseq.common.uuid :as common-uuid]
   [logseq.db :as ldb]
   [logseq.db.common.entity-plus :as entity-plus]
   [logseq.db.common.initial-data :as common-initial-data]
   [logseq.db.common.order :as db-order]
   [logseq.db.common.reference :as db-reference]
   [logseq.db.common.sqlite :as common-sqlite]
   [logseq.db.common.view :as db-view]
   [logseq.db.frontend.asset :as db-asset]
   [logseq.db.frontend.class :as db-class]
   [logseq.db.frontend.content :as db-content]
   [logseq.db.frontend.entity-util :as entity-util]
   [logseq.db.frontend.inputs :as db-inputs]
   [logseq.db.frontend.property :as db-property]
   [logseq.db.frontend.schema :as db-schema]
   [logseq.db.sqlite.create-graph :as sqlite-create-graph]
   [logseq.db.sqlite.export :as sqlite-export]
   [logseq.db.sqlite.gc :as sqlite-gc]
   [logseq.db.sqlite.util :as sqlite-util]
   [logseq.graph-parser.exporter :as gp-exporter]
   [logseq.outliner.core :as outliner-core]
   [logseq.outliner.op :as outliner-op]
   [logseq.outliner.property :as outliner-property]
   [logseq.outliner.recycle :as outliner-recycle]
   [logseq.outliner.tree :as otree]
   [logseq.outliner.validate :as outliner-validate]
   [logseq.publishing.html :as publish-html]
   [me.tonsky.persistent-sorted-set :as set :refer [BTSet]]
   [promesa.core :as p]
   [shadow.resource :as rc]))

(defonce *sqlite worker-state/*sqlite)
(defonce *sqlite-conns worker-state/*sqlite-conns)
(defonce *vector-indexes worker-state/*vector-indexes)
(defonce *datascript-conns worker-state/*datascript-conns)
(defonce *client-ops-conns worker-state/*client-ops-conns)
(defonce *opfs-pools worker-state/*opfs-pools)
(defonce *publishing? (atom false))
(defonce ^:private *node-pools (atom {}))

(def search-db-version
  "Current search index version, stored in PRAGMA user_version.
  Bump to force a rebuild when the index format changes."
  2)
(def ^:private recycle-gc-kv :logseq.kv/recycle-last-gc-at)

(def ^:private search-index-build-batch-size 200)
(def ^:private vector-embedding-batch-size 32)
(def ^:private vector-embedding-parallelism 2)
(def ^:private vector-embedding-max-batch-chars (* vector-embedding-batch-size 2048))
(def ^:private vector-embedding-max-title-length 2048)
(def ^:private query-embedding-timeout-ms 50)
(def ^:private search-index-build-time-budget-ms 8)
(def ^:private search-index-build-idle-status-ttl-ms 2000)
(def ^:private search-index-build-pause-ms 300)
(defonce ^:private *search-index-build-ids (atom {}))
(defonce ^:private *vector-index-rebuild-ids (atom {}))
(defonce ^:private *client-ops-cleanup-timers (atom {}))
(def ^:private client-ops-cleanup-interval-ms (* 3 60 60 1000))
(def ^:private wal-checkpoint-sql "PRAGMA wal_checkpoint(TRUNCATE)")
(def ^:private default-graph-config-content (rc/inline "templates/config.edn"))

(defn- resolve-initial-config
  [config]
  (if (some? config)
    config
    default-graph-config-content))

(defn- node-runtime?
  []
  (= :node (platform/env-flag (platform/current) :runtime)))

(defn- storage-pool-name
  [graph]
  (if (node-runtime?)
    (graph-dir/repo->graph-dir-key graph)
    (worker-util/get-pool-name graph)))

(defn- get-storage-pool
  [graph]
  (if (node-runtime?)
    (or (get @*node-pools graph)
        (worker-state/get-opfs-pool graph))
    (worker-state/get-opfs-pool graph)))

(defn- remember-storage-pool!
  [graph pool]
  (if (node-runtime?)
    (swap! *node-pools assoc graph pool)
    (swap! *opfs-pools assoc graph pool)))

(defn- forget-storage-pool!
  [graph]
  (if (node-runtime?)
    (do
      (swap! *node-pools dissoc graph)
      (swap! *opfs-pools dissoc graph))
    (swap! *opfs-pools dissoc graph)))

(defn- <get-opfs-pool
  [graph]
  (when-not @*publishing?
    (or (get-storage-pool graph)
        (p/let [storage (platform/storage (platform/current))
                ^js pool ((:install-opfs-pool storage) @*sqlite (storage-pool-name graph))]
          (remember-storage-pool! graph pool)
          pool))))

(defn- init-sqlite-module!
  []
  (when-not @*sqlite
    (p/let [publishing? (platform/env-flag (platform/current) :publishing?)
            sqlite (platform/sqlite-init! (platform/current))]
      (reset! *publishing? publishing?)
      (reset! *sqlite (or sqlite ::sqlite-initialized))
      nil)))

(def repo-path "/db.sqlite")
(def client-ops-repo-path (str "client-ops" repo-path))

(defn- resolve-db-path
  [repo pool path]
  (let [storage (platform/storage (platform/current))]
    (if-let [f (:resolve-db-path storage)]
      (f repo pool path)
      path)))

(defn- checkpoint-db!
  ([^Object db]
   (checkpoint-db! nil db))
  ([repo ^Object db]
   (when (and db (fn? (.-exec db)))
     (try
       (.exec db wal-checkpoint-sql)
       (catch :default e
         (log/warn :db-worker/wal-checkpoint-failed
                   (cond-> {:error e}
                     repo (assoc :repo repo))))))))

(defn- <export-db-file
  ([repo]
   (<export-db-file repo repo-path))
  ([repo path]
   (p/let [^js pool (<get-opfs-pool repo)]
     (when pool
       (let [storage (platform/storage (platform/current))]
         ((:export-file storage) pool path))))))

(defn- ->uint8array
  [data]
  (cond
    (instance? js/Uint8Array data)
    data

    (js/ArrayBuffer.isView data)
    (js/Uint8Array. (.-buffer data) (.-byteOffset data) (.-byteLength data))

    (instance? js/ArrayBuffer data)
    (js/Uint8Array. data)

    (array? data)
    (js/Uint8Array. data)

    :else
    data))

(defn- <export-db-file-with-paths
  [repo path-candidates]
  (let [paths (->> path-candidates
                   (filter string?)
                   (remove string/blank?)
                   distinct
                   vec)]
    (letfn [(try-export [remaining-paths]
              (if-let [path (first remaining-paths)]
                (-> (<export-db-file repo path)
                    (p/then (fn [result]
                              (let [payload (->uint8array result)]
                                (if (instance? js/Uint8Array payload)
                                  payload
                                  (try-export (subvec remaining-paths 1))))))
                    (p/catch (fn [_]
                               (try-export (subvec remaining-paths 1)))))
                (p/resolved nil)))]
      (try-export paths))))

(defn- <import-db
  [^js pool data]
  (let [storage (platform/storage (platform/current))]
    ((:import-db storage) pool repo-path data)))

(defn- import-state-summary
  [import-state]
  (into {}
        (map (fn [[k v]]
               [k (if (satisfies? IDeref v) @v v)]))
        import-state))

(defn- file-content
  [file]
  (or (:file/content file)
      (:content file)
      ""))

(defn- import-file-payload
  [payload]
  (cond
    (instance? js/Uint8Array payload)
    payload

    (instance? js/ArrayBuffer payload)
    (js/Uint8Array. payload)

    (array? payload)
    (js/Uint8Array. payload)

    :else
    nil))

(defn- <read-and-stage-import-asset
  [file assets buffer-handler staged-assets]
  (when-let [payload (some-> file :asset/payload import-file-payload)]
    (let [buffer (.-buffer payload)
          asset-type (db-asset/asset-path->type (:path file))
          asset-id (d/squuid)
          asset-name (some-> (:path file) gp-exporter/asset-path->name)
          size (or (:asset/size file) (.-byteLength payload))]
      (p/let [checksum (db-asset/<get-file-array-buffer-checksum buffer)
              {:keys [with-edn-content pdf-annotation?]} (buffer-handler payload)
              asset-data (with-edn-content
                           {:size size
                            :type asset-type
                            :path (:path file)
                            :checksum checksum
                            :asset-id asset-id})]
        (swap! assets assoc asset-name asset-data)
        (when-not pdf-annotation?
          (swap! staged-assets conj {:path (:path file)
                                     :asset-id asset-id
                                     :asset-type asset-type
                                     :payload payload}))))))

(defn- <import-file-graph!
  [repo config-file files opts]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [notifications (atom [])
          staged-assets (atom [])
          options (-> opts
                      (assoc :notify-user #(swap! notifications conj %)
                             :log-fn (fn [& args]
                                       (log/info :import-file-graph {:args args}))
                             :<read-file (fn [file] (p/resolved (file-content file)))
                             :<get-file-stat (constantly nil)
                             :<read-and-copy-asset (fn [file assets buffer-handler]
                                                     (<read-and-stage-import-asset file assets buffer-handler staged-assets)))
                      (dissoc :set-ui-state))]
      (p/let [result (gp-exporter/export-file-graph conn conn config-file files options)
              validation (worker-db-validate/validate-db conn :fix false)]
        {:files (:files result)
         :import-state (import-state-summary (:import-state result))
         :notifications @notifications
         :staged-assets @staged-assets
         :validation {:errors (:errors validation)
                      :invalid-entity-ids (:invalid-entity-ids validation)}}))))

(defn upsert-addr-content!
  "Upsert addr+data-seq. Update sqlite-cli/upsert-addr-content! when making changes"
  [db data]
  (assert (some? db) "sqlite db not exists")
  (.transaction
   db
   (fn [tx]
     (doseq [item data]
       (.exec tx #js {:sql "INSERT INTO kvs (addr, content, addresses) values ($addr, $content, $addresses) on conflict(addr) do update set content = $content, addresses = $addresses"
                      :bind item})))))

(defn restore-data-from-addr
  "Update sqlite-cli/restore-data-from-addr when making changes"
  [db addr]
  (assert (some? db) "sqlite db not exists")
  (when-let [result (-> (.exec db #js {:sql "select content, addresses from kvs where addr = ?"
                                       :bind #js [addr]
                                       :rowMode "array"})
                        first)]
    (let [[content addresses] (bean/->clj result)
          addresses (when addresses
                      (js/JSON.parse addresses))
          data (sqlite-util/read-transit-str content)]
      (if (and addresses (map? data))
        (assoc data :addresses addresses)
        data))))

(defn new-sqlite-storage
  "Update sqlite-cli/new-sqlite-storage when making changes"
  [^Object db]
  (reify IStorage
    (-store [_ addr+data-seq _delete-addrs]
      (let [data (map
                  (fn [[addr data]]
                    (let [data' (if (map? data) (dissoc data :addresses) data)
                          addresses (when (map? data)
                                      (when-let [addresses (:addresses data)]
                                        (js/JSON.stringify (bean/->js addresses))))]
                      #js {:$addr addr
                           :$content (sqlite-util/write-transit-str data')
                           :$addresses addresses}))
                  addr+data-seq)]
        (upsert-addr-content! db data)))

    (-restore [_ addr]
      (restore-data-from-addr db addr))))

(defn- close-db-aux!
  [repo ^Object db ^Object search ^Object client-ops]
  (checkpoint-db! repo db)
  (checkpoint-db! repo search)
  (checkpoint-db! repo client-ops)
  (sync-download/close-import-state-for-repo! repo)
  (when-let [timer (get @*client-ops-cleanup-timers repo)]
    (js/clearInterval timer))
  (swap! *client-ops-cleanup-timers dissoc repo)
  (swap! *sqlite-conns dissoc repo)
  (when-let [vector-index (worker-state/get-vector-index repo)]
    (when-let [close-fn (:close! vector-index)]
      (close-fn)))
  (swap! *vector-indexes dissoc repo)
  (swap! *datascript-conns dissoc repo)
  (swap! *client-ops-conns dissoc repo)
  (swap! client-op/*repo->pending-local-tx-count dissoc repo)
  (swap! *search-index-build-ids dissoc repo)
  (when db (.close db))
  (when search (.close search))
  (when client-ops (.close client-ops))
  (when-let [^js pool (get-storage-pool repo)]
    (when (exists? (.-pauseVfs pool))
      (.pauseVfs pool)))
  (forget-storage-pool! repo))

(defn- close-other-dbs!
  [repo]
  (doseq [[r {:keys [db search client-ops]}] @*sqlite-conns]
    (when-not (graph-dir/same-repo? repo r)
      (close-db-aux! r db search client-ops))))

(defn close-db!
  [repo]
  (let [{:keys [db search client-ops]} (get @*sqlite-conns repo)]
    (close-db-aux! repo db search client-ops)))

(defn- <invalidate-search-db!
  [repo]
  (if-let [search-db (worker-state/get-sqlite-conn repo :search)]
    (do
      (search/truncate-table! search-db)
      (search/truncate-vector-index! (worker-state/get-vector-index repo))
      (p/resolved nil))
    (when-not @*publishing?
      (p/let [pool (<get-opfs-pool repo)
              search-path (resolve-db-path repo pool (str "search" repo-path))
              search-db (platform/sqlite-open (platform/current)
                                              {:sqlite @*sqlite
                                               :pool pool
                                               :path search-path
                                               :mode "c"})]
        (try
          (search/truncate-table! search-db)
          (finally
            (.close search-db)))
        nil))))

(defn reset-db!
  [repo db-transit-str]
  (when-let [conn (get @*datascript-conns repo)]
    (let [new-db (ldb/read-transit-str db-transit-str)
          new-db' (update new-db :eavt (fn [^BTSet s]
                                         (set! (.-storage s) (.-storage (:eavt @conn)))
                                         s))]
      (d/reset-conn! conn new-db' {:reset-conn! true})
      (d/reset-schema! conn (:schema new-db)))))

(defn- vector-index-path
  [repo pool]
  (resolve-db-path repo pool "search/vector"))

(defn- get-dbs
  [repo]
  (if @*publishing?
    (p/let [db (platform/sqlite-open (platform/current)
                                     {:sqlite @*sqlite
                                      :path "/db.sqlite"
                                      :mode "c"})
            search-db (platform/sqlite-open (platform/current)
                                            {:sqlite @*sqlite
                                             :path "/search-db.sqlite"
                                             :mode "c"})]
      [db search-db nil nil])
    (p/let [^js pool (<get-opfs-pool repo)
            capacity (when (exists? (.-getCapacity pool))
                       (.getCapacity pool))
            _ (when (and (some? capacity) (zero? capacity))
                (.unpauseVfs pool))
            db-path (resolve-db-path repo pool repo-path)
            search-path (resolve-db-path repo pool (str "search" repo-path))
            current-platform (platform/current)
            vector-path (vector-index-path repo pool)
            client-ops-path (resolve-db-path repo pool (str "client-ops-" repo-path))
            _ (log/info :db-worker/get-dbs-open {:repo repo :db-path db-path})
            db (platform/sqlite-open (platform/current)
                                     {:sqlite @*sqlite
                                      :pool pool
                                      :path db-path})
            _ (log/info :db-worker/get-dbs-open {:repo repo :search-path search-path})
            search-db (platform/sqlite-open (platform/current)
                                            {:sqlite @*sqlite
                                             :pool pool
                                             :path search-path})
            vector-index (when (get-in current-platform [:vector :open-index])
                           (platform/vector-open current-platform
                                                 {:path vector-path
                                                  :dimension (platform/embedding-dimension current-platform)}))
            _ (log/info :db-worker/get-dbs-open {:repo repo :client-ops-path client-ops-path})
            client-ops-db (platform/sqlite-open (platform/current)
                                                {:sqlite @*sqlite
                                                 :pool pool
                                                 :path client-ops-path})]
      [db search-db client-ops-db vector-index])))

(defn- enable-sqlite-wal-mode!
  [^Object db]
  (.exec db "PRAGMA locking_mode=exclusive")
  (.exec db "PRAGMA journal_mode=WAL"))

(defn- gc-sqlite-dbs!
  [sqlite-db datascript-conn]
  (log/info :gc-sqlite-dbs "gc current graph")
  (sqlite-gc/gc-kvs-table! sqlite-db {:full-gc? true})
  (.exec sqlite-db "VACUUM")
  (ldb/transact! datascript-conn [{:db/ident :logseq.kv/graph-last-gc-at
                                   :kv/value (common-util/time-ms)}]
                 {:skip-validate-db? true
                  :persist-op? false}))

(defn- run-client-ops-cleanup!
  [repo]
  (let [protected-tx-ids (worker-undo-redo/referenced-history-tx-ids repo)]
    (client-op/cleanup-finished-history-ops! repo protected-tx-ids)
    nil))

(defn- ensure-client-ops-cleanup-timer!
  [repo]
  (when (and (not @*publishing?)
             repo
             (nil? (get @*client-ops-cleanup-timers repo)))
    (let [timer (js/setInterval (fn []
                                  (run-client-ops-cleanup! repo))
                                client-ops-cleanup-interval-ms)]
      (swap! *client-ops-cleanup-timers assoc repo timer))
    nil))

(defn- maybe-run-recycle-gc!
  [conn]
  (let [now (common-util/time-ms)
        last-gc-at (:kv/value (d/entity @conn recycle-gc-kv))]
    (when (or (not (number? last-gc-at))
              (> (- now last-gc-at) outliner-recycle/gc-interval-ms))
      (outliner-recycle/gc! conn {:now-ms now})
      (ldb/transact! conn [{:db/ident recycle-gc-kv
                            :kv/value now}]
                     {:persist-op? false
                      :skip-validate-db? true}))))

(defn- handle-migrate-result-local-txs!
  [repo migrate-result]
  (doseq [tx-report (:upgrade-result-coll migrate-result)]
    (db-sync/handle-local-tx! repo tx-report)))

(def ^:private built-in-sync-repair-tx-id
  #uuid "00000000-0000-4000-8000-652665286528")

(def ^:private built-in-sync-repair-properties
  [:logseq.property.repeat/repeat-type
   :logseq.property.comments/blocks])

(def ^:private built-in-sync-repair-classes
  [:logseq.class/Comments
   :logseq.class/Comment])

(def ^:private built-in-sync-repair-unordered-classes
  #{:logseq.class/Comments
    :logseq.class/Comment})

;; Fixed so duplicate repair txs from multiple clients converge on the same datoms.
(def ^:private built-in-sync-repair-timestamp 0)

(defn- stable-built-in-sync-repair-item
  [order item]
  (if (and (map? item) (:block/uuid item))
    (cond-> (assoc item
                   :block/created-at built-in-sync-repair-timestamp
                   :block/updated-at built-in-sync-repair-timestamp)
      (not (contains? built-in-sync-repair-unordered-classes (:db/ident item)))
      (assoc :block/order order))
    item))

(defn- built-in-sync-repair-tx-data
  []
  (let [properties built-in-sync-repair-properties
        new-properties (->> (select-keys db-property/built-in-properties properties)
                            sqlite-create-graph/build-properties
                            (map (fn [b] (assoc b :logseq.property/built-in? true))))
        new-classes (->> (select-keys db-class/built-in-classes built-in-sync-repair-classes)
                         (#(sqlite-create-graph/build-initial-classes* % (zipmap properties properties)))
                         (map (fn [b] (assoc b :logseq.property/built-in? true))))
        new-class-idents (keep (fn [class]
                                 (when-let [db-ident (:db/ident class)]
                                   {:db/ident db-ident}))
                               new-classes)
        tx-data (vec (concat new-class-idents new-properties new-classes))
        block-item-count (count (filter #(and (map? %) (:block/uuid %)) tx-data))
        orders (db-order/gen-n-keys block-item-count nil nil :max-key-atom (atom nil))
        *orders (atom orders)]
    (mapv (fn [item]
            (stable-built-in-sync-repair-item
             (when (and (map? item) (:block/uuid item))
               (let [order (first @*orders)]
                 (swap! *orders rest)
                 order))
             item))
          tx-data)))

(defn- enqueue-built-in-sync-repair!
  [repo]
  (when-not (client-op/get-local-tx-entry repo built-in-sync-repair-tx-id)
    (let [{:keys [should-inc-pending?]}
          (client-op/upsert-local-tx-entry!
           repo
           {:tx-id built-in-sync-repair-tx-id
            :created-at 0
            :pending? true
            :failed? false
            :outliner-op :fix
            :undo-redo :none
            :forward-outliner-ops []
            :inverse-outliner-ops []
            :inferred-outliner-ops? false
            :normalized-tx-data (built-in-sync-repair-tx-data)
            :reversed-tx-data []})]
      (when should-inc-pending?
        (client-op/adjust-pending-local-tx-count! repo 1)))))

(defn- maybe-enqueue-built-in-sync-repair!
  [repo conn migrate-result initial-data-exists?]
  (when (and (nil? migrate-result)
             initial-data-exists?
             (true? (:kv/value (d/entity @conn :logseq.kv/graph-remote?))))
    (enqueue-built-in-sync-repair! repo)))

(defn- debug-transit-raw->datoms
  [raw]
  (let [db-or-datoms (ldb/read-transit-str raw)]
    (if (d/db? db-or-datoms)
      (vec (d/datoms db-or-datoms :eavt))
      db-or-datoms)))

(defn- <create-or-open-db!
  [repo {:keys [config datoms debug-transit-raw sync-download-graph? creating-remote-graph?] :as opts}]
  (let [datoms (or datoms
                   (when debug-transit-raw
                     (debug-transit-raw->datoms debug-transit-raw)))]
    (when creating-remote-graph?
      (when (and (worker-state/get-sqlite-conn repo :client-ops)
                 (nil? (client-op/get-local-tx repo)))
        (client-op/update-local-tx repo 0)))
    (when-not (worker-state/get-sqlite-conn repo)
      (p/let [[db search-db client-ops-db vector-index] (get-dbs repo)
              dbs (cond-> [db search-db]
                    client-ops-db (conj client-ops-db))
              storage (new-sqlite-storage db)]
        (swap! *sqlite-conns assoc repo {:db db
                                         :search search-db
                                         :client-ops client-ops-db})
        (when vector-index
          (swap! *vector-indexes assoc repo vector-index))
        (doseq [db' dbs]
          (enable-sqlite-wal-mode! db'))
        (common-sqlite/create-kvs-table! db)
        (when-not @*publishing? (common-sqlite/create-kvs-table! client-ops-db))
        (search/create-tables-and-triggers! search-db)
        (ldb/register-transact-pipeline-fn! worker-pipeline/transact-pipeline)
        (ldb/register-debounce-fn! (gfun/debounce d/store 1000))
        (let [conn (common-sqlite/get-storage-conn storage db-schema/schema)
              _ (db-fix/check-and-fix-schema! conn)
              _ (when datoms
                  (let [ident-eids (into #{}
                                         (comp (filter (fn [datom]
                                                         (= (:a datom) :db/ident)))
                                               (map :e))
                                         datoms)
                        to-tx (fn [d] [:db/add (:e d) (:a d) (:v d)])
                        batch-size 20000
                        ident-batches (->> datoms
                                           (filter #(contains? ident-eids (:e %)))
                                           (map to-tx)
                                           (partition-all batch-size))
                        _ (doseq [batch ident-batches]
                            (d/transact! conn batch {:initial-db? true}))
                        non-ident-batches (->> datoms
                                               (remove #(contains? ident-eids (:e %)))
                                               (map to-tx)
                                               (partition-all batch-size))]
                    (doseq [batch non-ident-batches]
                      (d/transact! conn batch {:initial-db? true}))))
              client-ops-conn (when-not @*publishing? client-ops-db)
              initial-data-exists? (when (nil? datoms)
                                     (and (d/entity @conn :logseq.class/Root)
                                          (= "db" (:kv/value (d/entity @conn :logseq.kv/db-type)))))]
          (swap! *datascript-conns assoc repo conn)
          (swap! *client-ops-conns assoc repo client-ops-conn)
          (when-not @*publishing?
            (client-op/ensure-sqlite-schema! client-ops-db))
          (when creating-remote-graph?
            (when (nil? (client-op/get-local-tx repo))
              (client-op/update-local-tx repo 0)))
          (ensure-client-ops-cleanup-timer! repo)
          (let [initial-tx-report (when-not (or initial-data-exists?
                                                (seq datoms)
                                                sync-download-graph?)
                                    (let [config (resolve-initial-config config)
                                          initial-data (sqlite-create-graph/build-db-initial-data
                                                        config (select-keys opts [:import-type :graph-git-sha :creating-remote-graph?]))]
                                      (ldb/transact! conn initial-data
                                                     {:initial-db? true})))]
            (when-not sync-download-graph?
              (let [migrate-result (db-migrate/migrate conn)]
                (if migrate-result
                  (handle-migrate-result-local-txs! repo migrate-result)
                  (maybe-enqueue-built-in-sync-repair! repo conn migrate-result initial-data-exists?)))
              (maybe-run-recycle-gc! conn))

            (when initial-tx-report
              (db-sync/handle-local-tx! repo initial-tx-report))

            (db-listener/listen-db-changes! repo (get @*datascript-conns repo))

            nil))))))

(defn- <list-all-dbs
  []
  (p/let [storage (platform/storage (platform/current))
          graph-names ((:list-graphs storage))]
    (p/all (map (fn [graph-name]
                  (p/let [repo (str sqlite-util/db-version-prefix graph-name)]
                    {:name repo}))
                graph-names))))

(def-thread-api :thread-api/list-db
  []
  (<list-all-dbs))

(defn- <db-exists?
  [graph]
  (let [storage (platform/storage (platform/current))]
    ((:db-exists? storage) graph)))

(defn- remove-vfs!
  [^js pool]
  (when pool
    (let [storage (platform/storage (platform/current))]
      ((:remove-vfs! storage) pool))))

(defn- get-search-db
  [repo]
  (worker-state/get-sqlite-conn repo :search))

(defn- search-index-version
  [^js search-db]
  (aget (aget (.exec search-db #js {:sql "PRAGMA user_version" :rowMode "array"}) 0) 0))

(defn- expected-vector-index-metadata
  []
  {:embedding-model-id (platform/embedding-model-id (platform/current))
   :embedding-dimension (platform/embedding-dimension (platform/current))
   :context-version search/vector-context-version})

(defn- persist-vector-index-metadata!
  [repo]
  (when-let [set-metadata! (:set-metadata! (worker-state/get-vector-index repo))]
    (set-metadata! (expected-vector-index-metadata))))

(declare <embed-index-batches vector-embedding-batches)

(defn- start-vector-index-rebuild!
  [repo build-id]
  (swap! *vector-index-rebuild-ids assoc repo build-id))

(defn- active-vector-index-rebuild?
  [repo build-id]
  (= build-id (get @*vector-index-rebuild-ids repo)))

(defn- clear-vector-index-rebuild!
  [repo build-id]
  (swap! *vector-index-rebuild-ids
         (fn [builds]
           (if (= build-id (get builds repo))
             (dissoc builds repo)
             builds))))

(defn- schedule-vector-index-rebuild!
  [repo build-id indexed-blocks]
  (when (worker-state/get-vector-index repo)
    (start-vector-index-rebuild! repo build-id)
    (let [indexed-blocks (vec indexed-blocks)]
      (-> (if (seq indexed-blocks)
            (p/let [vector-blocks (<embed-index-batches (vector-embedding-batches indexed-blocks))]
              (when (active-vector-index-rebuild? repo build-id)
                (when-let [vector-index (worker-state/get-vector-index repo)]
                  (search/upsert-vector-blocks! vector-index vector-blocks))))
            (p/resolved nil))
          (p/then (fn [_]
                    (when (active-vector-index-rebuild? repo build-id)
                      (persist-vector-index-metadata! repo))))
          (p/catch (fn [error]
                     (when (active-vector-index-rebuild? repo build-id)
                       (log/error :search/vector-index-rebuild-failed {:repo repo
                                                                       :error error}))))
          (p/finally (fn []
                       (clear-vector-index-rebuild! repo build-id))))))
  nil)

(defn- start-search-index-build!
  [repo]
  (let [build-id (str (random-uuid))]
    (swap! *search-index-build-ids assoc repo build-id)
    build-id))

(defn- clear-search-index-build!
  [repo build-id]
  (swap! *search-index-build-ids
         (fn [builds]
           (if (= build-id (get builds repo))
             (dissoc builds repo)
             builds))))

(defn- ensure-active-search-index-build!
  [repo build-id]
  (when-not (= build-id (get @*search-index-build-ids repo))
    (throw (ex-info "stale search index build"
                    {:type :search/stale-index-build
                     :repo repo
                     :build-id build-id}))))

(defn- report-search-index-progress!
  [repo payload]
  (if (node-runtime?)
    (do
      (platform/post-message! (platform/current)
                              :thread-api/search-index-build-progress
                              [repo payload])
      (p/resolved nil))
    (-> (worker-state/<invoke-main-thread :thread-api/search-index-build-progress repo payload)
        (p/catch (fn [_error] nil)))))

(def-thread-api :thread-api/init
  []
  (init-sqlite-module!))

(def-thread-api :thread-api/set-db-sync-config
  [config]
  (reset! worker-state/*db-sync-config (worker-state/non-auth-db-sync-config config))
  nil)

(def-thread-api :thread-api/get-db-sync-config
  []
  (worker-state/non-auth-db-sync-config @worker-state/*db-sync-config))

(def-thread-api :thread-api/db-sync-status
  [repo]
  (db-sync/status repo))

(defn- db-sync-dbs-open?
  [repo]
  (and (some? (worker-state/get-datascript-conn repo))
       (some? (worker-state/get-client-ops-conn repo))))

(declare start-db!)
(def-thread-api :thread-api/db-sync-start
  [repo]
  (if (db-sync-dbs-open? repo)
    (db-sync/start! repo)
    (p/do!
     (start-db! repo {:close-other-db? false})
     (db-sync/start! repo))))

(def-thread-api :thread-api/db-sync-stop
  []
  (db-sync/stop!))

(def-thread-api :thread-api/db-sync-update-presence
  [editing-block-uuid]
  (db-sync/update-presence! editing-block-uuid))

(def-thread-api :thread-api/db-sync-request-asset-download
  [repo asset-uuid]
  (db-sync/request-asset-download! repo asset-uuid))

(def-thread-api :thread-api/db-sync-download-missing-assets
  [repo graph-id]
  (db-sync/download-missing-assets! repo graph-id))

(def-thread-api :thread-api/db-sync-retry-asset-upload
  [repo]
  (db-sync/retry-asset-upload! repo))

(def-thread-api :thread-api/db-sync-grant-graph-access
  [repo graph-id target-email]
  (sync-crypt/<grant-graph-access! repo graph-id target-email))

(def-thread-api :thread-api/db-sync-ensure-user-rsa-keys
  [& [opts]]
  (sync-crypt/ensure-user-rsa-keys! opts))

(def-thread-api :thread-api/db-sync-list-remote-graphs
  []
  (db-sync/list-remote-graphs!))

(def-thread-api :thread-api/db-sync-upload-graph
  [repo]
  (db-sync/upload-graph! repo))

(def-thread-api :thread-api/db-sync-create-remote-graph
  [repo graph-e2ee? graph-ready-for-use?]
  (db-sync/create-remote-graph! repo {:graph-e2ee? graph-e2ee?
                                      :graph-ready-for-use? graph-ready-for-use?}))

(def-thread-api :thread-api/db-sync-stop-upload
  [repo]
  (db-sync/stop-upload! repo))

(def-thread-api :thread-api/db-sync-resume-upload
  [repo]
  (db-sync/resume-upload! repo))

(def-thread-api :thread-api/db-sync-upload-stopped?
  [repo]
  (db-sync/upload-stopped? repo))

(def-thread-api :thread-api/db-sync-get-block-conflicts
  [repo block-uuid]
  (client-op/get-sync-conflicts repo block-uuid))

(def-thread-api :thread-api/db-sync-clear-block-conflicts
  [repo block-uuid]
  (client-op/clear-sync-conflicts! repo block-uuid)
  (shared-service/broadcast-to-clients!
   :sync-conflicts-updated
   {:repo repo
    :block-uuid block-uuid
    :conflicts []}))

(def-thread-api :thread-api/db-sync-download-graph-by-id
  [repo graph-id graph-e2ee?]
  (sync-download/download-graph-by-id! repo graph-id graph-e2ee?))

;; [graph service]
(defonce *service (atom []))

(defn- remote-binary-function
  [qualified-kw-str & args]
  (let [qkw (keyword qualified-kw-str)]
    (vswap! thread-api/*profile update qkw inc)
    (if-let [f (@thread-api/*thread-apis qkw)]
      (p/let [result (apply f args)]
        (if (instance? js/Uint8Array result)
          (let [transfer-fn (get-in (platform/current) [:storage :transfer])]
            (if (fn? transfer-fn)
              (transfer-fn result #js [(.-buffer result)])
              result))
          result))
      (throw (ex-info (str "not found thread-api: " qualified-kw-str) {})))))

(defonce fns {"remoteInvoke" thread-api/remote-function
              "remoteInvokeBinary" remote-binary-function})

(defn- start-db!
  [repo {:keys [close-other-db?]
         :or {close-other-db? true}
         :as opts}]
  (p/do!
   (when close-other-db?
     (close-other-dbs! repo))
   (when @shared-service/*master-client?
     (<create-or-open-db! repo (dissoc opts :close-other-db?)))
   nil))

(def-thread-api :thread-api/create-or-open-db
  [repo opts]
  (when-not (graph-dir/same-repo? repo (worker-state/get-current-repo)) ; graph switched
    (reset! worker-state/*deleted-block-uuid->db-id {}))
  (start-db! repo opts))

(def-thread-api :thread-api/q
  [repo inputs]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (apply d/q (first inputs) @conn (rest inputs))))

(def-thread-api :thread-api/query-dsl-query
  [repo query-string opts]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (query-dsl/execute-query query-string @conn opts)))

(def-thread-api :thread-api/query-dsl-custom-query
  [repo query-m opts]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (query-dsl/execute-custom-query query-m @conn opts)))

(def-thread-api :thread-api/datoms
  [repo & args]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [result (apply d/datoms @conn args)]
      (map (fn [d] [(:e d) (:a d) (:v d) (:tx d) (:added d)]) result))))

(def-thread-api :thread-api/pull
  [repo selector id]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [eid (if (and (vector? id) (= :block/name (first id)))
                (:db/id (ldb/get-page @conn (second id)))
                id)]
      (some->> eid
               (d/pull @conn selector)
               (common-initial-data/with-parent @conn)))))

(defn- block-status-history
  [db block-id]
  (->> (d/q '[:find ?history ?created-at ?status
              :in $ ?block-id
              :where
              [?history :logseq.property.history/block ?block-id]
              [?history :logseq.property.history/property :logseq.property/status]
              [?history :logseq.property.history/ref-value ?status]
              [?history :block/created-at ?created-at]]
            db
            block-id)
       (map (fn [[history-id created-at status-id]]
              (let [status (d/entity db status-id)]
                {:db/id history-id
                 :block/created-at created-at
                 :logseq.property.history/property-ident :logseq.property/status
                 :logseq.property.history/ref-value-ident (:db/ident status)
                 :logseq.property.history/ref-value-title (:block/title status)})))
       (sort-by :block/created-at)))

(defn- task-spent-time
  [db block-id now-ms]
  (let [status-history (block-status-history db block-id)]
    (when (seq status-history)
      (let [time (loop [[last-item item & others] status-history
                        time 0]
                   (if item
                     (let [last-status (:logseq.property.history/ref-value-ident last-item)
                           this-status (:logseq.property.history/ref-value-ident item)]
                       (if (and (= this-status :logseq.property/status.doing)
                                (empty? others))
                         (-> (+ time (- now-ms (:block/created-at item)))
                             (quot 1000))
                         (let [time' (if (or
                                          (= last-status :logseq.property/status.doing)
                                          (and
                                           (not (contains? #{:logseq.property/status.canceled
                                                             :logseq.property/status.backlog
                                                             :logseq.property/status.done} last-status))
                                           (= this-status :logseq.property/status.done)))
                                       (+ time (- (:block/created-at item) (:block/created-at last-item)))
                                       time)]
                           (recur (cons item others) time'))))
                     (quot time 1000)))]
        [(vec status-history) time]))))

(def-thread-api :thread-api/task-spent-time
  [repo block-id]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (task-spent-time @conn block-id (common-util/time-ms))))

(defn- first-url-property-value
  [db block-id]
  (when-let [block (d/entity db block-id)]
    (some (fn [datom]
            (let [property-id (:a datom)]
              (when (db-property/property? property-id)
                (when-let [property (d/entity db property-id)]
                  (when (= :url (:logseq.property/type property))
                    (let [value (:v datom)
                          value (if (number? value) (d/entity db value) value)]
                      (or (:block/title value)
                          (when (string? value) value))))))))
          (d/datoms db :eavt (:db/id block)))))

(def-thread-api :thread-api/get-first-url-property-value
  [repo block-id]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (first-url-property-value @conn block-id)))

(defn- page-route-info
  [db page-id-name-or-uuid]
  (when-let [page (ldb/get-page db page-id-name-or-uuid)]
    (let [alias-source (ldb/get-alias-source-page db (:db/id page))]
      (cond-> {:page-id (:db/id page)
               :page-uuid (:block/uuid page)
               :page-title (:block/title page)
               :hidden? (boolean (ldb/hidden? page))
               :property? (boolean (ldb/property? page))
               :built-in? (boolean (ldb/built-in? page))
               :private-built-in? (boolean (and (ldb/built-in? page)
                                                (ldb/private-built-in-page? page)))}
        (:logseq.property/heading page)
        (assoc :block-page-name (get-in page [:block/page :block/name])
               :block-route-name (some->> (:block/title page)
                                           (re-find #"^#{0,}\s*(.*)(?:\n|$)")
                                           second
                                           string/lower-case))

        (:block/uuid alias-source)
        (assoc :alias-source-id (:db/id alias-source)
               :alias-source-uuid (:block/uuid alias-source))))))

(def-thread-api :thread-api/get-page-route-info
  [repo page-id-name-or-uuid]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (page-route-info @conn page-id-name-or-uuid)))

(defn- heading-content->route-name
  [block-content]
  (some->> block-content
           (re-find #"^#{0,}\s*(.*)(?:\n|$)")
           second
           string/lower-case))

(defn- block-by-page-name-and-block-route-name
  [db page-id-name-or-uuid route-name]
  (when-let [page (ldb/get-page db page-id-name-or-uuid)]
    (->> (d/q '[:find (pull ?b [:block/uuid])
                :in $ ?page-id ?route-name ?content-matches
                :where
                [?b :block/page ?page-id]
                [?b :logseq.property/heading]
                [?b :block/title ?content]
                [(?content-matches ?content ?route-name ?b)]]
              db
              (:db/id page)
              route-name
              (fn content-matches? [block-content external-content block-id]
                (let [block (d/entity db block-id)
                      ref-tags (distinct (concat (:block/tags block) (:block/refs block)))]
                  (= (-> (db-content/id-ref->title-ref block-content ref-tags)
                         (db-content/content-id-ref->page ref-tags)
                         heading-content->route-name)
                     (string/lower-case external-content)))))
         ffirst)))

(def-thread-api :thread-api/get-block-by-page-name-and-block-route-name
  [repo page-id-name-or-uuid route-name]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (block-by-page-name-and-block-route-name @conn page-id-name-or-uuid route-name)))

(def-thread-api :thread-api/get-today-journal-title
  [repo today-journal-day fallback-title]
  (if-let [conn (worker-state/get-datascript-conn repo)]
    (or (:block/title (ldb/get-journal-page-by-day @conn today-journal-day))
        fallback-title)
    fallback-title))

(def-thread-api :thread-api/get-date-formatter
  [repo fallback-formatter]
  (if-let [conn (worker-state/get-datascript-conn repo)]
    (or (:logseq.property.journal/title-format (d/entity @conn :logseq.class/Journal))
        fallback-formatter)
    fallback-formatter))

(def-thread-api :thread-api/get-journal-page-title
  [repo journal-day fallback-title]
  (if-let [conn (worker-state/get-datascript-conn repo)]
    (or (:block/title (ldb/get-journal-page-by-day @conn journal-day))
        fallback-title)
    fallback-title))

(defn- page-entity->summary
  [page]
  (when page
    {:db/id (:db/id page)
     :block/uuid (:block/uuid page)
     :block/title (:block/title page)
     :block/raw-title (:block/raw-title page)
     :block/name (:block/name page)
     :block/journal-day (:block/journal-day page)}))

(def-thread-api :thread-api/get-journal-page-by-day
  [repo journal-day]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (some-> (ldb/get-journal-page-by-day @conn journal-day)
            page-entity->summary)))

(def-thread-api :thread-api/get-latest-journals
  [repo n]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (mapv page-entity->summary
          (take n (ldb/get-latest-journals @conn)))))

(def-thread-api :thread-api/page-exists?
  [repo page-name tags]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (boolean (seq (ldb/page-exists? @conn page-name tags)))))

(def-thread-api :thread-api/get-case-page
  [repo page-name-or-uuid]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (some-> (ldb/get-case-page @conn page-name-or-uuid)
            entity-util/entity->map)))

(def-thread-api :thread-api/get-tags-by-name
  [repo name]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (->> (entity-util/get-pages-by-name @conn name)
         (keep (fn [datom]
                 (some-> (d/entity @conn (:e datom))
                         entity-util/entity->map)))
         (filter ldb/class?)
         vec)))

(defn- query-input-value
  [input]
  (if (and (string? input)
           (not (page-ref/page-ref? input)))
    (try
      (let [value (cljs.reader/read-string input)]
        (if (symbol? value)
          input
          value))
      (catch :default _
        input))
    input))

(def-thread-api :thread-api/resolve-query-inputs
  [repo inputs {:keys [current-page current-page-title today-title]}]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [current-page-title (or current-page-title
                                 (some-> (when current-page
                                           (ldb/get-page @conn current-page))
                                         :block/title))]
      (mapv (fn [input]
              (db-inputs/resolve-input @conn
                                       (query-input-value input)
                                       {:current-page-fn (fn []
                                                           (or current-page-title
                                                               today-title))}))
            inputs))))

(def-thread-api :thread-api/get-block-parent
  [repo block-uuid]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (some-> (d/entity @conn [:block/uuid block-uuid])
            :block/parent
            entity-util/entity->map)))

(defn- block-ref-entity
  [db block-ref]
  (cond
    (uuid? block-ref)
    (d/entity db [:block/uuid block-ref])

    (and (string? block-ref) (common-util/uuid-string? block-ref))
    (d/entity db [:block/uuid (uuid block-ref)])

    :else
    (d/entity db block-ref)))

(defn- block-page-info
  [db block-ref]
  (when-let [block (block-ref-entity db block-ref)]
    (when-let [page (:block/page block)]
      {:db/id (:db/id page)
       :block/uuid (:block/uuid page)
       :block/title (:block/title page)
       :block/name (:block/name page)})))

(def-thread-api :thread-api/get-block-page-info
  [repo block-ref]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (block-page-info @conn block-ref)))

(def-thread-api :thread-api/get-block-immediate-children
  [repo block-uuid]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (mapv entity-util/entity->map (ldb/get-children @conn block-uuid))))

(def-thread-api :thread-api/get-block-sibling
  [repo block-id direction]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (when-let [block (d/entity @conn block-id)]
      (some-> (case direction
                :left (ldb/get-left-sibling block)
                :right (ldb/get-right-sibling block)
                nil)
              entity-util/entity->map))))

(def-thread-api :thread-api/get-page-blocks-tree
  [repo page-id-name-or-uuid]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [db @conn]
      (when-let [page (ldb/get-page db page-id-name-or-uuid)]
        (otree/blocks->vec-tree db (ldb/get-page-blocks db (:db/id page)) (:db/id page))))))

(def-thread-api :thread-api/get-block-class-default-properties
  [repo block-id]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [db @conn]
      (when-let [classes-properties (some-> (outliner-property/get-block-classes-properties db block-id)
                                            :classes-properties)]
        (->> classes-properties
             (keep (fn [property]
                     (when-let [default-value (:logseq.property/default-value property)]
                       [(:db/ident property)
                        (if (:db/id default-value)
                          (entity-util/entity->map default-value)
                          default-value)])))
             (into {}))))))

(def-thread-api :thread-api/get-class-properties
  [repo class-id]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [db @conn]
      (when-let [class (d/entity db class-id)]
        (mapv #(worker-plain/entity-forward-map db % {})
              (outliner-property/get-class-properties class))))))

(defn- route-title-info
  [db route-name]
  (let [page (ldb/get-page db route-name)]
    (if (and page (ldb/page? page))
      {:page-title (:block/title page)}
      (when (common-util/uuid-string? route-name)
        (when-let [block (d/entity db [:block/uuid (uuid route-name)])]
          {:block-title (:block/title block)})))))

(def-thread-api :thread-api/get-route-title
  [repo route-name]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (route-title-info @conn route-name)))

(def-thread-api :thread-api/get-file-content
  [repo path]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (:file/content (d/entity @conn [:file/path path]))))

(defn- ui-non-suitable-property?
  [block property {:keys [class-schema?]}]
  (when block
    (let [block-page? (entity-util/page? block)
          block-types (let [types (entity-util/get-entity-types block)]
                        (cond-> types
                          (and block-page? (not (contains? types :page)))
                          (conj :page)
                          (empty? types)
                          (conj :block)))
          view-context (get property :logseq.property/view-context :all)]
      (or (contains? #{:logseq.property/query} (:db/ident property))
          (and (not block-page?) (contains? #{:block/alias} (:db/ident property)))
          (and (not= view-context :all) (not (contains? block-types view-context)))
          (and (entity-util/built-in? block) (contains? #{:logseq.property.class/extends} (:db/ident property)))
          (and class-schema? (db-property/public-built-in-property? property) (:logseq.property/view-context property))))))

(defn- get-all-properties
  [db {:keys [remove-built-in-property? remove-non-queryable-built-in-property? remove-ui-non-suitable-properties?
              class-schema? block]
       :or {remove-built-in-property? true
            remove-non-queryable-built-in-property? false
            remove-ui-non-suitable-properties? false}
       :as _opts}]
  (let [result (sort-by (juxt (fn [property]
                                (some-> (:db/ident property)
                                        (db-property/plugin-property?)))
                              entity-util/built-in?
                              :block/title)
                        (remove entity-util/recycled? (ldb/get-all-properties db)))]
    (cond->> result
      remove-built-in-property?
      (remove (fn [property]
                (let [ident (:db/ident property)]
                  (and (entity-util/built-in? property)
                       (not (db-property/public-built-in-property? property))
                       (not= ident :logseq.property/icon)))))
      remove-non-queryable-built-in-property?
      (remove (fn [property]
                (let [ident (:db/ident property)]
                  (and (entity-util/built-in? property)
                       (not (:queryable? (db-property/built-in-properties ident)))))))
      remove-ui-non-suitable-properties?
      (remove (fn [property]
                (ui-non-suitable-property? block property {:class-schema? class-schema?})))
      true
      (map entity-util/entity->map))))

(def-thread-api :thread-api/get-all-properties
  [repo opts]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (get-all-properties @conn opts)))

(def ^:private display-property-keys
  [:db/id
   :db/ident
   :block/title
   :block/uuid
   :block/name
   :block/order
   :db/cardinality
   :logseq.property/type
   :logseq.property/public?
   :logseq.property/built-in?
   :logseq.property/hide?
   :logseq.property/hide-empty-value
   :logseq.property/ui-position
   :logseq.property/view-context
   :logseq.property/scalar-default-value
   :logseq.property/default-value])

(def ^:private display-property-value-keys
  [:db/id
   :db/ident
   :block/title
   :block/uuid
   :logseq.property/value
   :logseq.property/icon
   :logseq.property/deleted-at])

(defn- entity-direct-values
  [db entity-or-id attr]
  (let [eid (cond
              (number? entity-or-id) entity-or-id
              (map? entity-or-id) (:db/id entity-or-id)
              :else (:db/id (d/entity db entity-or-id)))]
    (map :v (d/datoms db :eavt eid attr))))

(defn- entity-direct-value
  [db entity-or-id attr]
  (first (entity-direct-values db entity-or-id attr)))

(defn- entity-direct-map
  [db entity keys]
  (select-keys (worker-plain/entity-forward-map db entity {}) keys))

(defn- display-property-description
  [db property]
  (when-let [description-id (entity-direct-value db property :logseq.property/description)]
    (when-let [description (d/entity db description-id)]
      (entity-direct-map db description [:db/id :block/title :block/uuid]))))

(defn- display-property-closed-values
  [db property]
  (->> (d/datoms db :avet :block/closed-value-property (:db/id property))
       (keep (fn [datom]
               (when-let [value (d/entity db (:e datom))]
                 (when-not (ldb/recycled? value)
                   value))))
       (sort-by :block/order)
       (mapv #(entity-direct-map db % display-property-value-keys))))

(defn- display-property-map
  [db property-id]
  (when-let [entity (d/entity db property-id)]
    (let [description (display-property-description db entity)
          closed-values (display-property-closed-values db entity)]
      (cond-> (entity-direct-map db entity display-property-keys)
        description
        (assoc :logseq.property/description description)

        (seq closed-values)
        (assoc :property/closed-values closed-values)))))

(defn- display-property-value
  [db property-id value]
  (worker-plain/attribute-value->plain db property-id value))

(defn- entity-tagged-with?
  [db entity tag-ident]
  (some (fn [datom]
          (= tag-ident (:db/ident (d/entity db (:v datom)))))
        (d/datoms db :eavt (:db/id entity) :block/tags)))

(defn- display-properties-for-block
  [db block]
  (let [properties (if (de/entity? block)
                     (->> (d/datoms db :eavt (:db/id block))
                          (keep (fn [{:keys [a v]}]
                                  (when (db-property/property? a)
                                    [a (display-property-value db a v)])))
                          (reduce (fn [result [property-id value]]
                                    (if (= :db.cardinality/many
                                           (or (get-in (d/schema db) [property-id :db/cardinality])
                                               (entity-direct-value db property-id :db/cardinality)))
                                      (update result property-id (fnil conj #{}) value)
                                      (assoc result property-id value)))
                                  {}))
                     (:block/properties block))]
    (cond-> properties
      (and (entity-tagged-with? db block :logseq.class/Tag)
           (not (ldb/built-in? block)))
      (update :logseq.property.class/enable-bidirectional? #(if (nil? %) false %)))))

(defn- entity-ref-value?
  [value]
  (and (map? value)
       (or (contains? value :db/id)
           (contains? value :block/uuid))))

(defn- contains-recycled-entity-value?
  [value]
  (cond
    (entity-ref-value? value)
    (ldb/recycled? value)

    (and (coll? value) (not (map? value)))
    (some (fn [item]
            (and (entity-ref-value? item)
                 (ldb/recycled? item)))
          value)

    :else
    false))

(defn- filter-recycled-entity-values
  [value]
  (let [active-entity-value? (fn [item]
                               (or (not (entity-ref-value? item))
                                   (not (ldb/recycled? item))))]
    (cond
      (and (entity-ref-value? value) (ldb/recycled? value))
      nil

      (set? value)
      (let [value' (set (filter active-entity-value? value))]
        (when (seq value') value'))

      (vector? value)
      (let [value' (vec (filter active-entity-value? value))]
        (when (seq value') value'))

      (and (coll? value) (not (map? value)))
      (let [value' (vec (filter active-entity-value? value))]
        (when (seq value') value'))

      :else
      value)))

(defn- sanitize-property-values-for-display
  [properties]
  (reduce-kv
   (fn [{:keys [properties recycled-only-property-ids] :as result} property-id property-value]
     (let [property-value' (filter-recycled-entity-values property-value)]
       (if (and (nil? property-value')
                (contains-recycled-entity-value? property-value))
         (assoc result
                :properties (assoc properties property-id nil)
                :recycled-only-property-ids (conj recycled-only-property-ids property-id))
         (assoc result :properties (assoc properties property-id property-value')))))
   {:properties {}
    :recycled-only-property-ids #{}}
   properties))

(defn- display-property-row
  [db property-id value]
  (when-let [property (display-property-map db property-id)]
    {:property-id property-id
     :property property
     :value value}))

(defn- sort-display-property-pairs
  [db property-pairs]
  (let [property-pair-map (into {} property-pairs)
        sorted-properties (db-property/sort-properties
                           (keep (fn [[property-id _]]
                                   (d/entity db property-id))
                                 property-pairs))]
    (keep (fn [property]
            (when-let [[property-id value] (find property-pair-map (:db/ident property))]
              (display-property-row db property-id value)))
          sorted-properties)))

(defn- display-properties
  [db block {:keys [gallery-view? page-title? sidebar-properties? tag-dialog?
                    publishing? state-hide-empty-properties?]} show-empty-and-hidden-properties?]
  (let [block-entity (or (some->> (:db/id block) (d/entity db)) block)
        page-properties-area? (and (or page-title?
                                       sidebar-properties?
                                       tag-dialog?)
                                   (or (entity-tagged-with? db block-entity :logseq.class/Page)
                                       (entity-tagged-with? db block-entity :logseq.class/Tag)
                                       (entity-tagged-with? db block-entity :logseq.class/Property)
                                       (entity-tagged-with? db block-entity :logseq.class/Journal)))
        properties* (display-properties-for-block db block-entity)
        {:keys [properties recycled-only-property-ids]}
        (sanitize-property-values-for-display properties*)
        remove-built-in-or-other-position-properties
        (fn [property-pairs show-in-hidden-properties?]
          (remove (fn [property]
                    (let [id (if (vector? property) (first property) property)]
                      (or
                       (= id :block/tags)
                       (when-let [ent (d/entity db id)]
                         (or
                          (and (not (ldb/public-built-in-property? ent))
                               (ldb/built-in? ent))
                          (when-not (or page-properties-area?
                                        show-empty-and-hidden-properties?
                                        show-in-hidden-properties?)
                            (outliner-property/property-with-other-position? db block-entity ent))
                          (and gallery-view?
                               (contains? #{:logseq.property.class/properties} (:db/ident ent))))))))
                  property-pairs))
        {:keys [all-classes classes-properties]} (outliner-property/get-block-classes-properties db (:db/id block-entity))
        classes-properties-set (set (map :db/ident classes-properties))
        block-own-properties (->> properties
                                  (remove (fn [[id _]] (contains? recycled-only-property-ids id)))
                                  (remove (fn [[id _]] (classes-properties-set id))))
        hide-with-property-id (fn [property-id]
                                (let [property (d/entity db property-id)]
                                  (boolean
                                   (cond
                                     show-empty-and-hidden-properties?
                                     false
                                     state-hide-empty-properties?
                                     (nil? (get properties property-id))
                                     (and (:logseq.property/hide-empty-value property)
                                          (nil? (get properties property-id)))
                                     true
                                     :else
                                     (boolean (:logseq.property/hide? property))))))
        property-hide-f (cond
                          publishing?
                          (fn [[property-id property-value]]
                            (or (nil? property-value)
                                (hide-with-property-id property-id)))
                          state-hide-empty-properties?
                          (fn [[property-id property-value]]
                            (if (:logseq.property/hide? (d/entity db property-id))
                              (hide-with-property-id property-id)
                              (nil? property-value)))
                          :else
                          (comp hide-with-property-id first))
        {block-hidden-properties true
         block-own-properties' false} (group-by property-hide-f block-own-properties)
        class-properties (loop [classes all-classes
                                existing-properties (set (map first block-own-properties'))
                                result []]
                           (if-let [class (first classes)]
                             (let [cur-properties (->> (db-property/get-class-ordered-properties class)
                                                       (map :db/ident)
                                                       (remove existing-properties))]
                               (recur (rest classes)
                                      (into existing-properties cur-properties)
                                      (if (seq cur-properties)
                                        (into result cur-properties)
                                        result)))
                             result))
        class-property-pairs (->> class-properties
                                  (map (fn [p] [p (get properties p)]))
                                  (remove (fn [[property-id _]]
                                            (contains? recycled-only-property-ids property-id))))
        full-properties (-> (concat block-own-properties'
                                    (remove property-hide-f class-property-pairs))
                            (remove-built-in-or-other-position-properties false))
        hidden-properties (remove (fn [[property-id _]]
                                    (= property-id :logseq.property/query))
                                  (remove-built-in-or-other-position-properties
                                   (concat block-hidden-properties
                                           (filter property-hide-f class-property-pairs))
                                   true))]
    {:full-properties (vec (sort-display-property-pairs db full-properties))
     :hidden-properties (vec (sort-display-property-pairs db hidden-properties))
     :description-property (display-property-map db :logseq.property/description)
     :class-properties-property (display-property-map db :logseq.property.class/properties)}))

(def-thread-api :thread-api/get-display-properties
  [repo {:keys [block opts show-empty-and-hidden-properties?]}]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (display-properties @conn block opts show-empty-and-hidden-properties?)))

(def ^:private render-property-positions
  [:block-left :block-right :block-below])

(defn- render-schema-or-tag-related-property?
  [property-id]
  (let [property-ns (some-> property-id namespace)]
    (or (= :block/tags property-id)
        (= "logseq.property.class" property-ns)
        (contains? db-property/schema-properties property-id))))

(defn- render-tag-class-page?
  [db block]
  (or (= :logseq.class/Tag (:db/ident block))
      (ldb/class-instance? (entity-plus/entity-memoized db :logseq.class/Tag) block)))

(defn- direct-block-property-ids
  [db block-id]
  (->> (d/datoms db :eavt block-id)
       (keep (fn [datom]
               (let [property-id (:a datom)]
                 (when (db-property/property? property-id)
                   property-id))))
       distinct))

(defn- property-has-closed-values?
  [db property]
  (boolean (seq (d/datoms db :avet :block/closed-value-property (:db/id property)))))

(defn- render-bottom-position-property?
  [db property]
  (let [property-id (:db/ident property)
        property-type (:logseq.property/type property)
        node-many? (and (= :node property-type)
                        (= :db.cardinality/many (:db/cardinality property)))]
    (and (not (contains? #{:url :asset} property-type))
         (or node-many?
             (not= :default property-type)
             (property-has-closed-values? db property))
         (not (render-schema-or-tag-related-property? property-id)))))

(defn- render-property-position
  [db property]
  (let [ui-position (:logseq.property/ui-position property)]
    (cond
      (contains? #{:properties :block-left :block-right :block-below} ui-position)
      ui-position

      (render-bottom-position-property? db property)
      :block-below

      :else
      :properties)))

(defn- block-direct-property-value
  [db block-id property-id]
  (entity-direct-value db block-id property-id))

(defn- render-positioned-property?
  [db block-id property-id position {:keys [allow-empty-block-below?]}]
  (when-let [property (d/entity db property-id)]
    (let [property-position (render-property-position db property)
          property-value (block-direct-property-value db block-id property-id)]
      (and
       (not (false? (:logseq.property/public? property)))
       (= property-position position)
       (not (and (:logseq.property/hide-empty-value property)
                 (nil? property-value)))
       (not (:logseq.property/hide? property))
       (not (and
             (= property-position :block-below)
             (nil? property-value)
             (not allow-empty-block-below?)
             (not (render-tag-class-page? db (d/entity db block-id)))))))))

(defn- block-positioned-property-ids
  [db block-id position]
  (let [block (d/entity db block-id)
        own-property-ids (direct-block-property-ids db block-id)
        classes-properties (when-not (render-tag-class-page? db block)
                             (some-> (outliner-property/get-block-classes-properties db block-id)
                                     :classes-properties))
        classes-property-ids-set (set (map :db/ident classes-properties))
        property-ids (if (render-tag-class-page? db block)
                       own-property-ids
                       (->> classes-properties
                            (map :db/ident)
                            (concat own-property-ids)
                            distinct))]
    (->> property-ids
         (filter (fn [property-id]
                   (render-positioned-property? db block-id property-id position
                                                {:allow-empty-block-below?
                                                 (contains? classes-property-ids-set property-id)})))
         (keep #(d/entity db %))
         db-property/sort-properties
         (map :db/ident))))

(defn- block-positioned-properties
  [db block-id position]
  (->> (block-positioned-property-ids db block-id position)
       (keep #(display-property-map db %))
       vec))

(def-thread-api :thread-api/get-block-positioned-properties
  [repo {:keys [block-id position]}]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [db @conn]
      (block-positioned-properties db block-id position))))

(def-thread-api :thread-api/validate-property-value
  [repo {:keys [property value]}]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (outliner-property/validate-property-value @conn property value)))

(def-thread-api :thread-api/reorder-display-property
  [repo {:keys [block-id active-ident over-ident direction property-idents]}]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [db @conn
          sorted-properties (db-property/sort-properties
                             (keep #(d/entity db %) property-idents))
          normalize-tx-data (db-property/normalize-sorted-entities-block-order sorted-properties)
          move-down? (= direction :down)
          over (d/entity db over-ident)
          active (d/entity db active-ident)
          over-order (:block/order over)
          new-order (if move-down?
                      (let [next-order (db-order/get-next-order db nil (:db/id over))]
                        (db-order/gen-key over-order next-order))
                      (let [prev-order (db-order/get-prev-order db nil (:db/id over))]
                        (db-order/gen-key prev-order over-order)))]
      (ldb/transact! conn
                     (conj (vec normalize-tx-data)
                           {:block/uuid (:block/uuid active)
                            :block/order new-order}
                           (outliner-core/block-with-updated-at
                            {:db/id block-id}))
                     {:outliner-op :save-block}))))

(defn- sort-by-order-recursive
  [form]
  (walk/postwalk (fn [f]
                   (if (and (map? f)
                            (:block/_parent f))
                     (let [children (:block/_parent f)]
                       (-> f
                           (dissoc :block/_parent)
                           (assoc :block/children (ldb/sort-by-order children))))
                     f))
                 form))

(defn- group-by-page
  [blocks]
  (if (:block/page (first blocks))
    (some->> blocks
             (group-by :block/page))
    blocks))

(def ^:private scheduled-deadline-pull-selector
  '[:*
    {:block/page [:db/id :block/title :block/uuid]}])

(defn- get-date-scheduled-or-deadlines
  [db start-time end-time]
  (->> (d/q '[:find [(pull ?block ?block-attrs) ...]
              :in $ ?start-time ?end-time ?block-attrs
              :where
              (or [?block :logseq.property/scheduled ?n]
                  [?block :logseq.property/deadline ?n])
              [(>= ?n ?start-time)]
              [(<= ?n ?end-time)]
              [?block :logseq.property/status ?status]
              [?status :db/ident ?status-ident]
              [(not= ?status-ident :logseq.property/status.done)]
              [(not= ?status-ident :logseq.property/status.canceled)]]
            db
            start-time
            end-time
            scheduled-deadline-pull-selector)
       sort-by-order-recursive
       group-by-page))

(def-thread-api :thread-api/get-date-scheduled-or-deadlines
  [repo start-time end-time]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (get-date-scheduled-or-deadlines @conn start-time end-time)))

(defn- resolve-block-entity
  [db id-or-page-name]
  (let [eid (cond
              (uuid? id-or-page-name)
              [:block/uuid id-or-page-name]

              (integer? id-or-page-name)
              id-or-page-name

              (keyword? id-or-page-name)
              id-or-page-name

              :else
              nil)]
    (cond
      eid
      (d/entity db eid)

      (string? id-or-page-name)
      (if (common-util/uuid-string? id-or-page-name)
        (d/entity db [:block/uuid (uuid id-or-page-name)])
        (d/entity db (common-initial-data/get-first-page-by-name db (name id-or-page-name))))

      :else
      nil)))

(defn- block-has-children?
  [db block-id]
  (some? (first (d/datoms db :avet :block/parent block-id))))

(defn- direct-child-blocks
  ([db block-id]
   (direct-child-blocks db block-id false))
  ([db block-id reverse?]
   (let [child-ids (->> (d/datoms db :avet :block/parent block-id)
                        (map :e)
                        set)
         blocks (if (>= (count child-ids) 100)
                  (->> ((if reverse? d/rseek-datoms d/datoms) db :avet :block/order)
                       (keep (fn [datom]
                               (when (contains? child-ids (:e datom))
                                 (d/entity db (:e datom))))))
                  (cond->> child-ids
                    true (keep #(d/entity db %))
                    true ldb/sort-by-order
                    reverse? reverse))]
     (remove :block/closed-value-property blocks))))

(defn- get-block-children
  [db block {:keys [include-collapsed-children?]}]
  (let [children-blocks (loop [pending [block]
                               seen #{(:db/id block)}
                               result []]
                          (if-let [parent (peek pending)]
                            (let [pending (pop pending)
                                  expand? (or include-collapsed-children?
                                              (not (true? (entity-direct-value db parent :block/collapsed?)))
                                              (some? (entity-direct-value db parent :block/name)))
                                  children (if expand?
                                             (remove #(contains? seen (:db/id %))
                                                     (direct-child-blocks db (:db/id parent)))
                                             [])]
                              (recur (into pending children)
                                     (into seen (map :db/id) children)
                                     (into result children)))
                            result))
        children-blocks (remove ldb/recycled? children-blocks)
        large-page? (>= (count children-blocks) 100)
        children (if large-page?
                   (remove ldb/recycled? (direct-child-blocks db (:db/id block)))
                   children-blocks)]
    {:large-page? large-page?
     :children (->> children
                    (remove :block/closed-value-property))}))

(defn- plain-render-block?
  [db block]
  (empty? (remove #{:block/tags}
                  (direct-block-property-ids db (:db/id block)))))

(defn- block-positioned-properties-map
  [db block]
  (->> render-property-positions
       (keep (fn [position]
               (let [properties (block-positioned-properties db (:db/id block) position)]
                 (when (seq properties)
                   [position properties]))))
       (into {})))

(defn- block-reactions
  [db block-id]
  (mapv #(d/pull db
                 '[:db/id :block/uuid :logseq.property.reaction/emoji-id
                   {:logseq.property/created-by-ref [:db/id :block/title]}]
                 (:e %))
        (d/datoms db :avet :logseq.property.reaction/target block-id)))

(def ^:private empty-render-display-properties
  {:full-properties []
   :hidden-properties []
   :description-property nil
   :class-properties-property nil})

(defn- assoc-render-property-data
  ([db block block-map]
   (assoc-render-property-data db block block-map false))
  ([db block block-map refs-count?]
   (let [plain? (plain-render-block? db block)]
     (cond-> (assoc block-map
                    :block.temp/positioned-properties
                    (if plain?
                      {}
                      (block-positioned-properties-map db block))
                    :block.temp/display-properties
                    (if plain?
                      empty-render-display-properties
                      (display-properties db block {} false))
                    :block.temp/reactions
                    (block-reactions db (:db/id block)))
       refs-count?
       (assoc :block.temp/refs-count
              (common-initial-data/get-block-refs-count db (:db/id block)))))))

(defn- get-block-and-children
  [db id-or-page-name {:keys [children? properties include-collapsed-children?]
                       :or {include-collapsed-children? false}}]
  (when-let [block (resolve-block-entity db id-or-page-name)]
    (let [block-refs-count? (some #{:block.temp/refs-count} properties)
          {:keys [large-page? children]} (when children?
                                           (get-block-children db block {:include-collapsed-children? include-collapsed-children?}))
          children-ids (set (map :db/id children))
          children' (when children?
                      (map (fn [child]
                             (let [collapsed? (:block/collapsed? child)]
                               (-> (assoc-render-property-data db child
                                                               (worker-plain/entity-forward-map db child {}))
                                   (assoc :block.temp/has-children? (block-has-children? db (:db/id child))
                                          :block.temp/load-status (if (and (not collapsed?)
                                                                           (or (and large-page?
                                                                                    (every? children-ids (map :db/id (direct-child-blocks db (:db/id child)))))
                                                                               (not large-page?)))
                                                                    :full
                                                                    :self)))))
                           children))
          block-map (assoc-render-property-data
                     db
                     block
                     (merge {:block/properties (display-properties-for-block db block)}
                            (entity-direct-map db block [:db/id :db/ident :block/uuid :block/name :block/tags])
                            (worker-plain/entity-forward-map db block {:properties properties})))
          block' (cond-> (assoc block-map
                                :block/tags (or (:block/tags block-map) [])
                                :block/collapsed? (boolean (:block/collapsed? block-map)))

                   block-refs-count?
                   (assoc :block.temp/refs-count (common-initial-data/get-block-refs-count db (:db/id block)))
                   true
                   (assoc :block.temp/load-status (cond
                                                    (and children? include-collapsed-children? (empty? properties))
                                                    :full
                                                    (and children? (empty? properties))
                                                    :children
                                                    :else
                                                    :self)
                          :block.temp/has-children? (block-has-children? db (:db/id block))))]
      (cond-> {:block block'}
        children?
        (assoc :children children')))))

(def ^:private page-block-window-default-limit 150)
(def ^:private page-block-window-max-limit 500)

(defn- clamp-page-block-window-limit
  [limit]
  (-> (or limit page-block-window-default-limit)
      (max 1)
      (min page-block-window-max-limit)))

(defn- page-block-window-offset
  [total-count {:keys [offset limit anchor]}]
  (let [limit (clamp-page-block-window-limit limit)
        requested-offset (case anchor
                           :bottom (- total-count limit)
                           :top 0
                           (or offset 0))]
    (-> requested-offset
        (max 0)
        (min (max 0 (- total-count limit))))))

(defn- page-block-layout
  [db root]
  (let [page-id (or (entity-direct-value db root :block/page) (:db/id root))
        block-ids (js/Set.)
        pending (array)
        parent-by-block (js/Map.)
        collapsed-blocks (js/Set.)
        property-derived-blocks (js/Set.)
        !block-count (volatile! 0)
        !collapsed? (volatile! false)
        children-by-parent (js/Map.)]
    (doseq [{:keys [e]} (d/datoms db :avet :block/page page-id)]
      (.add block-ids e))
    (doseq [{:keys [e]} (d/datoms db :avet :block/parent (:db/id root))
            :when (not (.has block-ids e))]
      (.push pending e))
    (loop []
      (when-let [block-id (.pop pending)]
        (when-not (.has block-ids block-id)
          (.add block-ids block-id)
          (doseq [{:keys [e]} (d/datoms db :avet :block/parent block-id)]
            (.push pending e)))
        (recur)))
    (doseq [{:keys [e v]} (d/datoms db :aevt :block/parent)
            :when (.has block-ids e)]
      (.set parent-by-block e v))
    (doseq [{:keys [e v]} (d/datoms db :aevt :block/collapsed?)
            :when (and v (.has block-ids e))]
      (.add collapsed-blocks e))
    (doseq [attr [:block/closed-value-property :logseq.property/created-from-property]
            {:keys [e]} (d/datoms db :aevt attr)
            :when (.has block-ids e)]
      (.add property-derived-blocks e))
    (doseq [{:keys [e]} (d/datoms db :avet :block/order)
            :when (and (.has block-ids e)
                       (not (.has property-derived-blocks e)))]
      (let [parent-id (.get parent-by-block e)
            collapsed? (.has collapsed-blocks e)
            children (or (.get children-by-parent parent-id)
                         (let [result (array)]
                           (.set children-by-parent parent-id result)
                           result))]
        (vswap! !block-count inc)
        (when collapsed?
          (vreset! !collapsed? true))
        (.push children #js [e parent-id collapsed?])))
    {:block-count @!block-count
     :collapsed? @!collapsed?
     :children-by-parent children-by-parent}))

(defn- flat-child-block-window
  [db root opts]
  (let [limit (clamp-page-block-window-limit (:limit opts))
        {:keys [block-count collapsed? children-by-parent]} (page-block-layout db root)
        known-total-count (or (:total-count opts)
                              (when-not collapsed? block-count))
        known-total-count? (nat-int? known-total-count)
        known-offset (when known-total-count?
                       (page-block-window-offset known-total-count (assoc opts :limit limit)))
        skip-count (or known-offset 0)
        requested-offset (case (:anchor opts)
                           :bottom nil
                           :top 0
                           (max 0 (or (:offset opts) 0)))
        requested-end (some-> requested-offset (+ limit))
        tail-entries (object-array limit)
        !tail-start (volatile! 0)
        !tail-count (volatile! 0)
        !idx (volatile! 0)
        !entries (volatile! [])]
    (letfn [(done? []
              (and known-total-count?
                   (= limit (count @!entries))))
            (visit! [entry]
              (let [idx @!idx]
                (vswap! !idx inc)
                (if known-total-count?
                  (when (and (>= idx skip-count)
                             (< (count @!entries) limit))
                    (vswap! !entries conj entry))
                  (do
                    (let [tail-count @!tail-count
                          tail-start @!tail-start
                          tail-idx (if (< tail-count limit)
                                     tail-count
                                     tail-start)]
                      (aset tail-entries tail-idx entry)
                      (if (< tail-count limit)
                        (vswap! !tail-count inc)
                        (vreset! !tail-start (mod (inc tail-start) limit))))
                    (when (and requested-offset
                               (>= idx requested-offset)
                               (< idx requested-end))
                      (vswap! !entries conj entry))))))
            (push-children! [stack parent-id level]
              (when-let [children (.get children-by-parent parent-id)]
                (loop [idx (dec (alength children))]
                  (when-not (neg? idx)
                    (let [child (aget children idx)]
                      (.push stack #js [(aget child 0)
                                        (aget child 1)
                                        (aget child 2)
                                        level])
                      (recur (dec idx)))))))]
      (let [stack (array)]
        (push-children! stack (:db/id root) 1)
        (loop []
          (when (and (pos? (alength stack)) (not (done?)))
            (let [current (.pop stack)
                  block-id (aget current 0)
                  parent-id (aget current 1)
                  collapsed? (aget current 2)
                  level (aget current 3)
                  entry {:block-id block-id
                         :level level
                         :parent-id parent-id
                         :has-children? (contains? children-by-parent block-id)}
                  _ (visit! entry)]
              (when-not collapsed?
                (push-children! stack block-id (inc level)))
              (recur)))))
      (let [total-count (or known-total-count @!idx)
            offset (or known-offset
                       (page-block-window-offset total-count (assoc opts :limit limit)))
            entries (cond
                      known-total-count?
                      @!entries

                      (= requested-offset offset)
                      @!entries

                      :else
                      (mapv (fn [idx]
                              (aget tail-entries (mod (+ @!tail-start idx) limit)))
                            (range @!tail-count)))
            entries (mapv (fn [{:keys [block-id] :as entry}]
                            (-> entry
                                (dissoc :block-id)
                                (assoc :block (d/entity db block-id))))
                          entries)]
        {:entries entries
         :offset offset
         :limit limit
         :total-count total-count}))))

(defn- flat-child-block-row
  [db page-summary {:keys [block level parent-id has-children?]}]
  (let [forward-map (worker-plain/entity-forward-map db block {:exclude-attrs #{:block/page :block/parent}})
        block-map (assoc-render-property-data db block forward-map true)]
    (-> block-map
        (assoc :block/level level
               :block/page page-summary
               :block/parent {:db/id parent-id}
               :block.temp/load-status :self
               :block.temp/has-children? has-children?)
        (dissoc :block/children))))

(defn- flat-child-block-layout-row
  [_db {:keys [block level parent-id has-children?]}]
  {:db/id (:db/id block)
   :block/uuid (:block/uuid block)
   :block/order (:block/order block)
   :block/collapsed? (:block/collapsed? block)
   :block/level level
   :block/parent {:db/id parent-id}
   :block.temp/load-status :self
   :block.temp/has-children? has-children?})

(defn- get-page-blocks-window-response
  ([repo id-or-page-name opts]
   (get-page-blocks-window-response repo id-or-page-name opts nil))
  ([repo id-or-page-name opts render-block-uuids]
   (when-let [db (some-> (worker-state/get-datascript-conn repo) deref)]
     (when-let [root (resolve-block-entity db id-or-page-name)]
       (let [{:keys [entries offset limit total-count]} (flat-child-block-window db root opts)
             page-summary (worker-plain/attribute-value->plain db :block/page (:db/id root))
             rows (mapv (fn [{:keys [block] :as entry}]
                          (if (or (nil? render-block-uuids)
                                  (contains? render-block-uuids (:block/uuid block)))
                            (flat-child-block-row db page-summary entry)
                            (flat-child-block-layout-row db entry)))
                        entries)
             commented-block-uuids (->> (mapv :block/uuid rows)
                                        (comments/get-comment-thread-block-uuids db)
                                        set)
             rows (->> rows
                       (mapv (fn [row]
                               (cond-> row
                                 (or (nil? render-block-uuids)
                                     (contains? render-block-uuids (:block/uuid row)))
                                 (assoc :block.temp/sync-conflicts
                                        (or (client-op/get-sync-conflicts repo (:block/uuid row)) [])
                                        :block.temp/comment-thread-present?
                                        (contains? commented-block-uuids (str (:block/uuid row)))))))
                       worker-plain/with-explicit-ref-fields-recursive)
             root-row (->> (assoc-render-property-data db
                                                       root
                                                       (worker-plain/entity-forward-map db root {})
                                                       true)
                           worker-plain/with-explicit-ref-fields-recursive)]
         {:root root-row
          :rows rows
          :offset offset
          :limit limit
          :total-count total-count})))))

(defn- get-blocks-response
  [repo requests]
  (when-let [db (some-> (worker-state/get-datascript-conn repo) deref)]
    (->> requests
         (mapv (fn [{:keys [id opts]}]
                 (let [id' (if (and (string? id) (common-util/uuid-string? id)) (uuid id) id)]
                   (-> (get-block-and-children db id' opts)
                       worker-plain/with-explicit-ref-fields-recursive
                       (assoc :id id)))))
         ldb/write-transit-str)))

(def-thread-api :thread-api/get-blocks
  [repo requests]
  (let [requests (ldb/read-transit-str requests)]
    (get-blocks-response repo requests)))

(def-thread-api :thread-api/get-page-blocks-window
  [repo id-or-page-name opts]
  (get-page-blocks-window-response repo id-or-page-name opts))

(def-thread-api :thread-api/get-block-refs
  [repo id]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (->> (db-reference/get-linked-references @conn id)
         :ref-blocks
         (keep (fn [block]
                 (some-> (worker-plain/entity-forward-map @conn block {})
                         worker-plain/with-explicit-ref-fields-recursive))))))

(def-thread-api :thread-api/get-block-refs-count
  [repo id]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (ldb/get-block-refs-count @conn id)))

(def-thread-api :thread-api/get-block-source
  [repo id]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (:db/id (first (:block/_alias (d/entity @conn id))))))

(defn- search-blocks
  [repo q option]
  (let [search-db (get-search-db repo)
        conn (worker-state/get-datascript-conn repo)
        vector-index (worker-state/get-vector-index repo)]
    (search/search-blocks conn search-db vector-index q option)))

(defn- validate-embedding-count!
  [blocks embeddings]
  (when-not (= (count blocks) (count embeddings))
    (throw (ex-info "embedding result count mismatch"
                    {:block-count (count blocks)
                     :embedding-count (count embeddings)
                     :model-id (platform/embedding-model-id (platform/current))}))))

(defn- embeddable-index-block?
  [{:keys [id page title]}]
  (and id page (not (string/blank? (str title)))))

(defn- vector-embedding-title
  [block-or-title]
  (let [title (if (map? block-or-title)
                (or (:vector-title block-or-title)
                    (:title block-or-title))
                block-or-title)
        title (str title)]
    (if (> (count title) vector-embedding-max-title-length)
      (subs title 0 vector-embedding-max-title-length)
      title)))

(defn- vector-embedding-batches
  [blocks]
  (loop [remaining (seq blocks)
         batch []
         batch-chars 0
         result []]
    (if-let [block (first remaining)]
      (let [text (vector-embedding-title block)
            text-chars (count text)
            full? (or (>= (count batch) vector-embedding-batch-size)
                      (and (seq batch)
                           (> (+ batch-chars text-chars)
                              vector-embedding-max-batch-chars)))]
        (if full?
          (recur remaining [] 0 (conj result batch))
          (recur (next remaining)
                 (conj batch block)
                 (+ batch-chars text-chars)
                 result)))
      (cond-> result
        (seq batch) (conj batch)))))

(defn- <embed-index-batch
  ([batch]
   (<embed-index-batch #(platform/embed-texts (platform/current) %) batch))
  ([embed-texts-fn batch]
   (p/let [embeddings (embed-texts-fn (mapv vector-embedding-title batch))
           _ (validate-embedding-count! batch embeddings)]
     (mapv (fn [block embedding]
             (assoc block :embedding embedding))
           batch
           embeddings))))

(defn- <embed-index-batch-with-fallback
  ([batch]
   (<embed-index-batch-with-fallback #(platform/embed-texts (platform/current) %) batch))
  ([embed-texts-fn batch]
   (-> (<embed-index-batch embed-texts-fn batch)
       (p/catch
        (fn [error]
          (if (= 1 (count batch))
            (throw error)
            (let [split-index (quot (count batch) 2)
                  left (subvec (vec batch) 0 split-index)
                  right (subvec (vec batch) split-index)]
              (p/let [left-embedded (<embed-index-batch-with-fallback embed-texts-fn left)
                      right-embedded (<embed-index-batch-with-fallback embed-texts-fn right)]
                (into left-embedded right-embedded)))))))))

(defn- pop-embedding-batch!
  [queue]
  (let [selected (atom nil)]
    (swap! queue
           (fn [items]
             (if (seq items)
               (do
                 (reset! selected (first items))
                 (subvec items 1))
               items)))
    @selected))

(defn- <embed-index-batches
  ([batches]
   (<embed-index-batches batches nil))
  ([batches on-batch-embedded]
   (let [batches (vec batches)]
     (if (empty? batches)
       (p/resolved [])
       (let [queue (atom (mapv vector (range (count batches)) batches))
             results (atom {})
             worker-count (min vector-embedding-parallelism (count batches))]
         (letfn [(worker []
                   (if-let [[idx batch] (pop-embedding-batch! queue)]
                     (-> (<embed-index-batch-with-fallback batch)
                         (p/then (fn [embedded]
                                   (swap! results assoc idx embedded)
                                   (when on-batch-embedded
                                     (on-batch-embedded (count embedded)))
                                   (worker))))
                     (p/resolved nil)))]
           (p/let [_ (p/all (mapv (fn [_] (worker)) (range worker-count)))]
             (into [] (mapcat (fn [idx]
                                (get @results idx))
                              (range (count batches)))))))))))

(defn- <embed-index-blocks
  [repo blocks]
  (let [blocks (vec (filter embeddable-index-block? blocks))]
    (if (and (seq blocks) (worker-state/get-vector-index repo))
      (<embed-index-batches (vector-embedding-batches blocks))
      (p/resolved []))))

(defn- schedule-vector-index-upsert!
  [repo blocks]
  (when (and (seq blocks) (worker-state/get-vector-index repo))
    (-> (<embed-index-blocks repo blocks)
        (p/then (fn [vector-blocks]
                  (when (seq vector-blocks)
                    (search/upsert-vector-blocks! (worker-state/get-vector-index repo) vector-blocks))))
        (p/catch (fn [error]
                   (log/error :search/vector-index-upsert-failed {:repo repo
                                                                  :error error})))))
  nil)

(defn- <search-blocks
  [repo q option]
  (let [vector-index (worker-state/get-vector-index repo)]
    (if (and vector-index
             (:feature/enable-semantic-search? option)
             (not (:page-only? option))
             (not (:query-embedding option))
             (not (string/blank? q)))
      (-> (p/let [embeddings (-> (platform/embed-texts (platform/current) [q])
                                  (p/timeout query-embedding-timeout-ms))
                  _ (validate-embedding-count! [{:title q}] embeddings)]
            (search-blocks repo q (assoc option :query-embedding (first embeddings))))
          (p/catch (fn [error]
                     (log/warn :search/query-embedding-failed {:repo repo
                                                               :error error})
                     (search-blocks repo q option))))
      (p/resolved (search-blocks repo q option)))))

(def-thread-api :thread-api/block-refs-check
  [repo id {:keys [unlinked?]}]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [db @conn
          block (d/entity db id)]
      (if unlinked?
        (let [title (string/lower-case (:block/title block))
              result (search-blocks repo title {:limit 100})]
          (boolean (some (fn [b]
                           (let [block (d/entity db (:db/id b))]
                             (and (not= id (:db/id block))
                                  (not ((set (map :db/id (:block/refs block))) id))
                                  (string/includes? (string/lower-case (:block/title block)) title)))) result)))
        (some? (first (common-initial-data/get-block-refs db (:db/id block))))))))

(def-thread-api :thread-api/get-block-parents
  [repo id depth]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [block-id (:block/uuid (d/entity @conn id))]
      (->> (ldb/get-block-parents @conn block-id {:depth (or depth 3)})
           (map (fn [b]
                  (-> (into {} b)
                      (assoc :db/id (:db/id b)
                             :block/title (:block/title b)))))))))

(def-thread-api :thread-api/set-context
  [context]
  (when context (worker-state/update-context! context))
  nil)

(def-thread-api :thread-api/transact
  [repo tx-data tx-meta context]
  (assert (some? repo))
  (worker-state/set-db-latest-tx-time! repo)
  (let [conn (worker-state/get-datascript-conn repo)]
    (assert (some? conn) {:repo repo})
    (try
      (let [tx-data' (if (contains? #{:insert-blocks} (:outliner-op tx-meta))
                       (map (fn [m]
                              (if (and (map? m) (nil? (:block/order m)))
                                (assoc m :block/order (db-order/gen-key nil))
                                m)) tx-data)
                       tx-data)
            _ (when context (worker-state/set-context! context))
            tx-meta' (cond-> tx-meta
                       true
                       (dissoc :insert-blocks?))]
        (when-not (and (:create-today-journal? tx-meta)
                       (:today-journal-name tx-meta)
                       (seq tx-data')
                       (ldb/get-page @conn (:today-journal-name tx-meta))) ; today journal created already

          ;; (prn :debug :transact :tx-data tx-data' :tx-meta tx-meta')

          (worker-util/profile "Worker db transact"
                               (ldb/transact! conn tx-data' tx-meta')))
        (maybe-run-recycle-gc! conn)
        nil)
      (catch :default e
        (prn :debug :worker-transact-failed :tx-meta tx-meta :tx-data tx-data)
        (log/error ::worker-transact-failed e)
        (throw e)))))

(def-thread-api :thread-api/undo-redo-set-pending-editor-info
  [repo editor-info]
  (worker-undo-redo/set-pending-editor-info! repo editor-info)
  nil)

(def-thread-api :thread-api/undo-redo-record-editor-info
  [repo editor-info]
  (worker-undo-redo/record-editor-info! repo editor-info)
  nil)

(def-thread-api :thread-api/undo-redo-record-ui-state
  [repo ui-state-str]
  (worker-undo-redo/record-ui-state! repo ui-state-str)
  nil)

(def-thread-api :thread-api/undo-redo-undo
  [repo]
  (worker-undo-redo/undo repo))

(def-thread-api :thread-api/undo-redo-redo
  [repo]
  (worker-undo-redo/redo repo))

(def-thread-api :thread-api/undo-redo-clear-history
  [repo]
  (worker-undo-redo/clear-history! repo)
  nil)

(def-thread-api :thread-api/undo-redo-get-debug-state
  [repo]
  (worker-undo-redo/get-debug-state repo))

(def-thread-api :thread-api/get-db-schema
  [repo]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    {:schema (:schema @conn)}))

(def-thread-api :thread-api/build-publishing-html
  [repo options]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (publish-html/build-html @conn options)))

(def-thread-api :thread-api/reset-db
  [repo db-transit]
  (reset-db! repo db-transit)
  nil)

(def-thread-api :thread-api/unsafe-unlink-db
  [repo]
  (p/let [pool (<get-opfs-pool repo)
          _ (sync-crypt/cancel-ui-requests! {:reason :unsafe-unlink-db
                                             :repo repo})
          _ (close-db! repo)
          _result (remove-vfs! pool)]
    nil))

(def-thread-api :thread-api/close-db
  [repo]
  (sync-crypt/cancel-ui-requests! {:reason :close-db
                                   :repo repo})
  (close-db! repo)
  nil)

(def-thread-api :thread-api/db-sync-close-db
  [repo]
  (sync-crypt/cancel-ui-requests! {:reason :db-sync-close-db
                                   :repo repo})
  (close-db! repo))

(def-thread-api :thread-api/db-sync-invalidate-search-db
  [repo]
  (<invalidate-search-db! repo))

(def-thread-api :thread-api/db-sync-recreate-lock
  [repo]
  (if-let [recreate-lock-fn (get-in (platform/current) [:env :recreate-lock-fn])]
    (recreate-lock-fn repo)
    nil))

(def-thread-api :thread-api/db-sync-rehydrate-large-titles
  [repo graph-id]
  (db-sync/rehydrate-large-titles-from-db! repo graph-id))

(def-thread-api :thread-api/db-sync-import-prepare
  [repo reset? graph-id graph-e2ee? & [total-datoms]]
  (sync-download/prepare-import! repo reset? graph-id graph-e2ee? total-datoms))

(def-thread-api :thread-api/db-sync-import-rows-chunk
  [rows graph-id import-id]
  (sync-download/import-rows-chunk! rows graph-id import-id))

(def-thread-api :thread-api/db-sync-import-finalize
  [repo graph-id remote-tx import-id]
  (sync-download/finalize-import! repo graph-id remote-tx import-id))

(def-thread-api :thread-api/release-access-handles
  [repo]
  (sync-download/close-import-state-for-repo! repo)
  (when-let [^js pool (get-storage-pool repo)]
    (when (exists? (.-pauseVfs pool))
      (.pauseVfs pool))
    nil))

(def-thread-api :thread-api/db-exists
  [repo]
  (<db-exists? repo))

(def-thread-api :thread-api/export-db-binary
  [repo]
  (when-let [^js db (worker-state/get-sqlite-conn repo :db)]
    (checkpoint-db! repo db))
  (p/let [data (<export-db-file repo)]
    (->uint8array data)))

(def-thread-api :thread-api/export-client-ops-db-binary
  [repo]
  (when-let [^js db (worker-state/get-sqlite-conn repo :client-ops)]
    (checkpoint-db! repo db))
  (let [^js client-ops-db (worker-state/get-sqlite-conn repo :client-ops)
        ^js pool (get-storage-pool repo)
        db-filename (some-> client-ops-db .-filename)
        db-file-name (subs repo-path 1)
        flat-client-ops-path (str "client-ops-" db-file-name)
        resolved-client-ops-path (when pool
                                   (resolve-db-path repo pool (str "client-ops-" repo-path)))
        export-paths [db-filename
                      resolved-client-ops-path
                      flat-client-ops-path
                      (str "/" flat-client-ops-path)
                      client-ops-repo-path
                      (str "/" client-ops-repo-path)
                      (str "client-ops" repo-path)
                      (str "/client-ops" repo-path)
                      (str "client-ops-" repo-path)
                      (str "/client-ops-" repo-path)]]
    (<export-db-file-with-paths repo export-paths)))

(def-thread-api :thread-api/backup-db-sqlite
  [repo dst-path]
  (when-not (string/blank? repo)
    (let [db (worker-state/get-sqlite-conn repo :db)
          backup-db-fn (get-in (platform/current) [:sqlite :backup-db])]
      (when-not db
        (throw (ex-info "graph not opened" {:code :graph-not-opened
                                            :repo repo})))
      (when-not (fn? backup-db-fn)
        (throw (ex-info "platform sqlite backup not supported"
                        {:code :backup-not-supported
                         :repo repo})))
      (checkpoint-db! repo db)
      (p/let [_ (backup-db-fn db dst-path)]
        {:path dst-path}))))

(def-thread-api :thread-api/import-db-binary
  [repo data]
  (when-not (string/blank? repo)
    (p/let [_ (close-db! repo)
            pool (<get-opfs-pool repo)
            _ (<import-db pool data)
            _ (start-db! repo {:import-type :sqlite-db})]
      nil)))

(def-thread-api :thread-api/import-file-graph
  [repo config-file files opts]
  (<import-file-graph! repo config-file files opts))

(def-thread-api :thread-api/search-blocks
  [repo q option]
  (<search-blocks repo q option))

(def-thread-api :thread-api/search-upsert-blocks
  [repo blocks]
  (when-let [db (get-search-db repo)]
    (search/upsert-blocks! db (bean/->js blocks))
    (schedule-vector-index-upsert! repo blocks)
    nil))

(def-thread-api :thread-api/search-delete-blocks
  [repo ids]
  (when-let [db (get-search-db repo)]
    (search/delete-vector-blocks! (worker-state/get-vector-index repo) ids)
    (search/delete-blocks! db ids)
    nil))

(def-thread-api :thread-api/search-truncate-tables
  [repo]
  (when-let [db (get-search-db repo)]
    (search/truncate-vector-index! (worker-state/get-vector-index repo))
    (search/truncate-table! db)
    nil))

(def-thread-api :thread-api/search-build-blocks-indice
  [repo]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (search/build-blocks-indice @conn)))

(defn- take-search-index-batch
  [items batch-size time-budget-ms]
  (let [deadline (+ (common-util/time-ms) time-budget-ms)]
    (loop [batch (transient [])
           remaining (seq items)
           n 0]
      (if (or (nil? remaining)
              (>= n batch-size)
              (and (pos? n) (>= (common-util/time-ms) deadline)))
        [(persistent! batch) remaining]
        (recur (conj! batch (first remaining))
               (next remaining)
               (inc n))))))

(defn- search-index-input-idle?
  [repo]
  (if (node-runtime?)
    true
    (let [status-map @(:thread-atom/search-input-idle-status @worker-state/*state)
          {:keys [idle? ts]} (get status-map repo)
          fresh? (and (number? ts)
                      (<= (- (common-util/time-ms) ts)
                          search-index-build-idle-status-ttl-ms))]
      (if (and fresh? (boolean? idle?))
        idle?
        true))))

(defn- <wait-for-search-index-idle!
  [repo build-id]
  (p/loop []
    (ensure-active-search-index-build! repo build-id)
    (if (search-index-input-idle? repo)
      nil
      (p/let [_ (js/Promise. (fn [resolve] (js/setTimeout resolve search-index-build-pause-ms)))]
        (p/recur)))))

(defn- <build-blocks-index!
  "Build FTS/vector index in batches with yielding. Sets user_version to search-db-version on completion."
  [repo search-db conn build-id]
  (ensure-active-search-index-build! repo build-id)
  (let [db @conn
        blocks (->> (d/datoms db :avet :block/uuid)
                    (keep #(d/entity db (:e %)))
                    (remove search/hidden-entity?)
                    vec)
        total (count blocks)
        vector-index (worker-state/get-vector-index repo)
        index-opts {:include-vector-title? (some? vector-index)}
        progress-for-fts (fn [processed]
                           (if (zero? total)
                             100
                             (min 100 (int (* 100 (/ processed total))))))
        report-progress! (fn [progress processed total]
                           (report-search-index-progress! repo {:build-id build-id
                                                                :status :running
                                                                :stage :search-index
                                                                :progress progress
                                                                :processed processed
                                                                :total total}))]
    (p/do!
     (report-search-index-progress! repo {:build-id build-id
                                          :status :running
                                          :stage :search-index
                                          :progress 0
                                          :processed 0
                                          :total total})
     (<wait-for-search-index-idle! repo build-id)
     (ensure-active-search-index-build! repo build-id)
     (search/truncate-table! search-db)
     (search/truncate-vector-index! vector-index)
     (p/loop [remaining (seq blocks)
              processed 0
              last-progress 0
              indexed-blocks []]
       (ensure-active-search-index-build! repo build-id)
       (if (seq remaining)
         (let [[batch remaining'] (take-search-index-batch remaining
                                                           search-index-build-batch-size
                                                           search-index-build-time-budget-ms)
               processed' (+ processed (count batch))
               indexed (vec (keep #(search/block->index % index-opts) batch))
               indexed-blocks' (into indexed-blocks indexed)
               progress (progress-for-fts processed')
               should-report? (> progress last-progress)]
           (p/let [_ (when (seq indexed)
                       (search/upsert-blocks! search-db (bean/->js indexed)))
                   _ (when should-report?
                       (report-progress! progress processed' total))
                   _ (js/Promise. (fn [resolve] (js/setTimeout resolve 0)))]
             (p/recur remaining' processed' (if should-report? progress last-progress) indexed-blocks')))
         (do
           (ensure-active-search-index-build! repo build-id)
           (schedule-vector-index-rebuild! repo build-id indexed-blocks)
           (p/let [_ (do
                       (.exec search-db (str "PRAGMA user_version = " search-db-version))
                       (report-search-index-progress! repo {:build-id build-id
                                                            :status :completed
                                                            :stage :search-index
                                                            :progress 100
                                                            :processed total
                                                            :total total}))]
             nil)))))))

(def-thread-api :thread-api/search-build-blocks-indice-in-worker
  [repo & [force?]]
  (p/let [search-db (get-search-db repo)]
    (when search-db
      (let [version (search-index-version search-db)]
        (if (and (= version search-db-version)
                 (not force?))
          version
          (when-let [conn (worker-state/get-datascript-conn repo)]
            (let [build-id (start-search-index-build! repo)]
              (-> (report-search-index-progress! repo {:build-id build-id
                                                       :status :running
                                                       :stage :search-index
                                                       :progress 0
                                                       :processed 0
                                                       :total 0})
                  (p/then (fn [_]
                            (js/Promise. (fn [resolve] (js/setTimeout resolve 0)))))
                  (p/then (fn [_]
                            (<build-blocks-index! repo search-db conn build-id)))
                  (p/catch (fn [error]
                             (when-not (= :search/stale-index-build (:type (ex-data error)))
                               (log/error :search/index-build-failed {:repo repo
                                                                      :error error}))))
                  (p/finally (fn []
                               (when (= build-id (get @*search-index-build-ids repo))
                                 (report-search-index-progress! repo {:build-id build-id
                                                                      :status :idle}))
                               (clear-search-index-build! repo build-id))))
              :started)))))))

(def-thread-api :thread-api/search-build-pages-indice
  [_repo]
  nil)

(defn- perf-time-ms []
  (if (and (exists? js/performance)
           (.-now js/performance))
    (.now js/performance)
    (js/Date.now)))

(defn- log-outliner-op-perf!
  [data]
  (when (and goog.DEBUG (:perf-id data))
    (log/info :db-worker/outliner-op-perf data)))

(def-thread-api :thread-api/apply-outliner-ops
  [repo ops opts]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (try
      (let [started-at (perf-time-ms)
            perf-id (:ui/perf-id opts)
            editor-info (:ui/editor-info opts)
            page-id (:ui/page-id opts)
            page-window-offset (:virtual/offset opts)
            render-block-uuids (:ui/render-block-uuids opts)
            row-data-block-ids (:ui/row-data-block-ids opts)
            opts (dissoc opts :ui/page-id :ui/include-page-tree? :ui/editor-info
                         :ui/render-block-uuids :ui/row-data-block-ids :virtual/offset)
            _ (worker-undo-redo/set-pending-editor-info! repo editor-info)
            apply-started-at (perf-time-ms)
            result (worker-util/profile
                    "apply outliner ops"
                    (outliner-op/apply-ops! conn ops opts))
            applied-at (perf-time-ms)
            listener-perf (db-listener/take-outliner-op-perf! perf-id)
            affected-page-uuids (into #{}
                                      (keep (fn [block-uuid]
                                              (some-> (d/entity @conn [:block/uuid block-uuid])
                                                      :block/page
                                                      :block/uuid)))
                                      render-block-uuids)
            updated-blocks (when (seq row-data-block-ids)
                             (into []
                                   (keep (fn [block-id]
                                           (:block (get-block-and-children @conn block-id {:children? false}))))
                                   row-data-block-ids))
            page-window (when page-id
                          (get-page-blocks-window-response repo page-id
                                                           {:offset page-window-offset
                                                            :limit (inc page-block-window-default-limit)}
                                                           (not-empty render-block-uuids)))
            page-window-at (perf-time-ms)
            response (worker-plain/worker-plain-value @conn
                                                     (cond-> {:result result}
                                                       page-window
                                                       (assoc :page-window page-window)

                                                       (seq updated-blocks)
                                                       (assoc :updated-blocks updated-blocks)

                                                       (seq affected-page-uuids)
                                                       (assoc :affected-page-uuids affected-page-uuids)

                                                       goog.DEBUG
                                                       (assoc :perf {:apply-ms (- applied-at apply-started-at)
                                                                     :page-window-ms (- page-window-at applied-at)
                                                                     :listener listener-perf})))
            plain-at (perf-time-ms)]
        (log-outliner-op-perf!
         {:perf-id perf-id
          :op-names (mapv first ops)
          :op-count (count ops)
          :apply-ms (- applied-at apply-started-at)
          :plain-ms (- plain-at page-window-at)
          :total-ms (- plain-at started-at)})
        response)
      (catch :default e
        (let [data (ex-data e)
              {:keys [type payload]} (when (map? data) data)]
          (case type
            :notification
            (do
              (log/error ::apply-outliner-ops-failed e)
              (shared-service/broadcast-to-clients! :notification [(:message payload) (:type payload) (:clear? payload) (:uid payload) (:timeout payload)
                                                                   (select-keys payload [:i18n-key :i18n-args])])
              ;; re-throw as CLI needs to see notification
              (throw e))
            (throw e)))))))

(def-thread-api :thread-api/sync-app-state
  [new-state]
  (when (and (contains? new-state :git/current-repo)
             (nil? (:git/current-repo new-state)))
    (log/error :thread-api/sync-app-state new-state))
  (worker-state/set-new-state! new-state)
  nil)

(def-thread-api :thread-api/markdown-mirror-set-enabled
  [repo enabled?]
  (markdown-mirror/set-enabled! repo enabled?)
  nil)

(def-thread-api :thread-api/markdown-mirror-flush
  [repo]
  (markdown-mirror/<flush-repo! repo {}))

(def-thread-api :thread-api/markdown-mirror-regenerate
  [repo]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (markdown-mirror/<mirror-repo! repo @conn {})))

(def-thread-api :thread-api/export-get-debug-datoms
  [repo]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (worker-export/get-debug-datoms conn)))

(def-thread-api :thread-api/export-get-all-page->content
  [repo options]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (worker-export/get-all-page->content @conn options)))

(def-thread-api :thread-api/export-get-blocks-data
  [repo root-block-uuids-or-page-uuid opts content-config]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (worker-export/get-blocks-export-data @conn root-block-uuids-or-page-uuid opts content-config)))

(def-thread-api :thread-api/export-blocks-as-format
  [repo root-block-uuids-or-page-uuid format-type options content-config]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (worker-export/export-blocks-as-format
     @conn
     root-block-uuids-or-page-uuid
     format-type
     options
     content-config)))

(def-thread-api :thread-api/validate-db
  [repo & [opts]]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (worker-db-validate/validate-db conn opts)))

(defn- checksum-diagnostics
  [repo]
  {:local-checksum (client-op/get-local-checksum repo)
   :remote-checksum (get @db-sync/*repo->latest-remote-checksum repo)})

(def-thread-api :thread-api/recompute-checksum-diagnostics
  [repo]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [result (worker-db-validate/recompute-checksum-diagnostics repo conn (checksum-diagnostics repo))
          recomputed-checksum (:recomputed-checksum result)]
      (when (and (some? recomputed-checksum)
                 (worker-state/get-client-ops-conn repo))
        (client-op/update-local-checksum repo recomputed-checksum))
      (cond-> result
        (some? recomputed-checksum)
        (assoc :local-checksum recomputed-checksum)))))

;; Returns an export-edn map for given repo. When there's an unexpected error, a map
;; with key :export-edn-error is returned
(def-thread-api :thread-api/export-edn
  [repo options]
  (let [conn (worker-state/get-datascript-conn repo)]
    (try
      (sqlite-export/build-export @conn options)
      (catch :default e
        (js/console.error "export-edn error: " e)
        (js/console.error "Stack:\n" (.-stack e))
        (platform/post-message! (platform/current)
                                :notification
                                [nil :error nil nil nil
                                 {:i18n-key :export/error-unexpected}])
        {:export-edn-error (.-message e)}))))

(def-thread-api :thread-api/import-edn
  [repo export-edn]
  (let [conn (worker-state/get-datascript-conn repo)]
    (when-not conn
      (throw (ex-info "graph not opened" {:code :graph-not-opened :repo repo})))
    (let [txs (sqlite-export/build-import export-edn @conn {})
          validation (sqlite-export/validate-import-txs txs @conn)]
      (if-let [error (:error validation)]
        {:error error}
        (let [tx-data (:tx-data validation)
              tx-meta (cond-> {::sqlite-export/imported-data? true}
                        ;; :datoms format imports all datoms including built-in ones. Add :initial-db?
                        ;; to keep pipeline from reverting their import
                        (= :datoms (::sqlite-export/graph-format export-edn))
                        (assoc :initial-db? true))]
          (ldb/transact! conn tx-data tx-meta)
          {:tx-count (count tx-data)})))))

(defn- fsrs-due-card-block-ids
  [db cards-id]
  (let [now-inst-ms (inst-ms (js/Date.))
        cards (when (and cards-id (not (contains? #{:global "global"} cards-id)))
                (d/entity db cards-id))
        query (when cards
                (when-let [query (:logseq.property/query cards)]
                  (when-not (string/blank? (:block/title query))
                    (:block/title query))))
        result (query-dsl/parse query db {})
        card-tag-id (:db/id (d/entity db :logseq.class/Card))
        card-tag-children-ids (db-class/get-structured-children db card-tag-id)
        card-ids (cons card-tag-id card-tag-children-ids)
        q '[:find [?b ...]
            :in $ [?t ...] ?now-inst-ms %
            :where
            [?b :block/tags ?t]
            (or-join [?b ?now-inst-ms]
                     (and
                      [?b :logseq.property.fsrs/due ?due]
                      [(>= ?now-inst-ms ?due)])
                     [(missing? $ ?b :logseq.property.fsrs/due)])
            [?b :block/uuid]]
        q' (if query
             (let [query* (:query result)]
               (concat q (if (coll? (first query*)) query* [query*])))
             q)]
    (d/q q' db card-ids now-inst-ms (:rules result))))

(def-thread-api :thread-api/get-fsrs-due-card-block-ids
  [repo cards-id]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (fsrs-due-card-block-ids @conn cards-id)))

(def-thread-api :thread-api/get-class-objects
  [repo class-id]
  (let [db @(worker-state/get-datascript-conn repo)]
    (->> (db-class/get-class-objects db class-id)
         (map #(worker-plain/worker-plain-value db %))
         worker-plain/with-explicit-ref-fields-recursive)))

(def-thread-api :thread-api/validate-block-tag
  [repo block-id tag-id]
  (let [db @(worker-state/get-datascript-conn repo)
        block (d/entity db [:block/uuid block-id])
        tag (d/entity db tag-id)]
    (try
      (outliner-validate/validate-unique-by-name-and-tags
       db
       (:block/title block)
       (update block :block/tags (fnil conj #{}) tag))
      {:valid? true}
      (catch :default e
        (if (= :notification (:type (ex-data e)))
          {:valid? false
           :payload (:payload (ex-data e))}
          (throw e))))))

(def-thread-api :thread-api/build-convert-tag-to-page-tx
  [repo class-id]
  (let [db @(worker-state/get-datascript-conn repo)
        objects (db-class/get-class-objects db class-id)
        page-txs [[:db/retract class-id :db/ident]
                  [:db/retract class-id :block/tags :logseq.class/Tag]
                  [:db/retract class-id :logseq.property.class/extends]
                  [:db/retract class-id :logseq.property.class/properties]
                  [:db/add class-id :block/tags :logseq.class/Page]]
        object-txs (mapcat (fn [obj]
                             [{:db/id (:db/id obj)
                               :block/title (db-content/replace-tag-refs-with-page-refs
                                             (:block/title obj)
                                             (:block/tags obj))}
                              [:db/retract (:db/id obj) :block/tags class-id]])
                           objects)]
    (vec (concat page-txs object-txs))))

(def-thread-api :thread-api/build-convert-page-to-tag-tx
  [repo page-id]
  (let [db @(worker-state/get-datascript-conn repo)
        page (d/entity db page-id)
        class-tx (db-class/build-new-class db
                                           {:block/uuid (:block/uuid page)
                                            :block/title (:block/title page)
                                            :block/created-at (:block/created-at page)})]
    [class-tx
     [:db/retract page-id :block/tags :logseq.class/Page]]))

(defn- favorite-page
  [db]
  (ldb/get-page db common-config/favorites-page-name))

(defn- favorite-block
  [db page-block-uuid]
  (let [page-block-id (:db/id (d/entity db [:block/uuid page-block-uuid]))]
    (when-let [page (and page-block-id (favorite-page db))]
      (some (fn [block]
              (when (= page-block-id (:db/id (:block/link block)))
                block))
            (ldb/get-page-blocks db (:db/id page))))))

(defn- entity->plain-map
  [db entity]
  (some-> (worker-plain/entity-forward-map db entity {})
          worker-plain/with-explicit-ref-fields-recursive))

(def-thread-api :thread-api/get-favorite-pages
  [repo]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [db @conn]
      (when-let [page (favorite-page db)]
        (->> (ldb/sort-by-order (:block/_parent page))
             (keep (fn [block]
                     (some->> (:block/link block)
                              (entity->plain-map db))))
             (remove ldb/recycled?)
             vec)))))

(def-thread-api :thread-api/favorited-page?
  [repo page-block-uuid]
  (let [db @(worker-state/get-datascript-conn repo)]
    (boolean (favorite-block db page-block-uuid))))

(def-thread-api :thread-api/get-recent-pages
  [repo page-ids]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [db @conn]
      (->> page-ids
           distinct
           (take 20)
           (keep #(some->> (d/entity db %)
                           (entity->plain-map db)))
           (filter ldb/page?)
           (remove ldb/hidden?)
           (remove (fn [e]
                     (or (and (ldb/property? e)
                              (true? (:logseq.property/hide? e)))
                         (string/blank? (:block/title e)))))
           vec))))

(def-thread-api :thread-api/build-favorite-page-ops
  [repo page-block-uuid]
  (let [db @(worker-state/get-datascript-conn repo)]
    (when-let [page (and (d/entity db [:block/uuid page-block-uuid])
                         (favorite-page db))]
      [[:insert-blocks [[(ldb/build-favorite-tx page-block-uuid)]
                        (:block/uuid page)
                        {}]]])))

(def-thread-api :thread-api/build-unfavorite-page-ops
  [repo page-block-uuid]
  (let [db @(worker-state/get-datascript-conn repo)]
    (when-let [block (favorite-block db page-block-uuid)]
      [[:delete-blocks [[(:block/uuid block)] {}]]])))

(defn- page-block-db-id
  [db page-block-uuid]
  (let [page-block-uuid' (if (string? page-block-uuid)
                           (parse-uuid page-block-uuid)
                           page-block-uuid)]
    (:db/id (d/entity db [:block/uuid page-block-uuid']))))

(def-thread-api :thread-api/build-reorder-favorites-ops
  [repo favorite-page-uuids]
  (let [db @(worker-state/get-datascript-conn repo)]
    (when-let [page (favorite-page db)]
      (let [page-block-ids (keep #(page-block-db-id db %) favorite-page-uuids)
            current-blocks (ldb/sort-by-order (ldb/get-page-blocks db (:db/id page)))]
        (->> (map vector page-block-ids current-blocks)
             (keep (fn [[page-block-id block]]
                     (when (not= page-block-id (:db/id (:block/link block)))
                       [:save-block [(assoc block :block/link page-block-id) nil]])))
             vec)))))

(def-thread-api :thread-api/get-property-values
  [repo {:keys [property-ident] :as option}]
  (let [conn (worker-state/get-datascript-conn repo)]
    (db-view/get-property-values @conn property-ident option)))

(def-thread-api :thread-api/get-bidirectional-properties
  [repo {:keys [target-id]}]
  (let [conn (worker-state/get-datascript-conn repo)]
    (worker-util/profile "get-bidirectional-properties"
                         (ldb/get-bidirectional-properties @conn target-id))))

(def-thread-api :thread-api/build-graph
  [repo option]
  (let [conn (worker-state/get-datascript-conn repo)]
    (graph-view/build-graph @conn option)))

(def ^:private *get-all-page-titles-cache (volatile! (cache/lru-cache-factory {})))
(defn- get-all-page-titles
  [db]
  (let [pages (ldb/get-all-pages db)]
    (sort (map :block/title pages))))

(def ^:private get-all-page-titles-with-cache
  (common.cache/cache-fn
   *get-all-page-titles-cache
   (fn [repo]
     (let [db @(worker-state/get-datascript-conn repo)]
       [[repo (:max-tx db)] ;cache-key
        [db]             ;f-args
        ]))
   get-all-page-titles))

(def-thread-api :thread-api/get-all-page-titles
  [repo]
  (get-all-page-titles-with-cache repo))

(def-thread-api :thread-api/gc-graph
  [repo]
  (let [{:keys [db]} (get @*sqlite-conns repo)
        conn (get @*datascript-conns repo)]
    (when (and db conn)
      (gc-sqlite-dbs! db conn)
      nil)))

(def-thread-api :thread-api/mobile-logs
  []
  @worker-state/*log)

(def-thread-api :thread-api/get-key-value
  [repo key]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (ldb/get-key-value @conn key)))

(def-thread-api :thread-api/get-rtc-graph-uuid
  [repo]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (ldb/get-graph-rtc-uuid @conn)))

(def-thread-api :thread-api/get-graph-uuid
  [repo]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (or (ldb/get-graph-rtc-uuid @conn)
        (ldb/get-graph-local-uuid @conn))))

(defn- new-local-graph-uuid
  []
  (uuid (str "00000000" (subs (str (common-uuid/gen-uuid)) 8))))

(def-thread-api :thread-api/ensure-local-graph-uuid
  [repo]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (or (ldb/get-graph-local-uuid @conn)
        (let [local-graph-uuid (new-local-graph-uuid)]
          (d/transact! conn
                       [(ldb/kv :logseq.kv/local-graph-uuid local-graph-uuid)]
                       {:graph-open/ensure-local-graph-uuid? true})
          local-graph-uuid))))

(def-thread-api :thread-api/get-rtc-graph-e2ee?
  [repo]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (ldb/get-graph-rtc-e2ee? @conn)))

(def-thread-api :thread-api/get-graph-schema-version
  [repo]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (ldb/get-graph-schema-version @conn)))

;; Cli specific fns start with 'cli-'
(def-thread-api :thread-api/cli-list-properties
  [repo options]
  (let [conn (worker-state/get-datascript-conn repo)]
    (cli-db-worker/list-properties @conn options)))

(def-thread-api :thread-api/cli-list-tags
  [repo options]
  (let [conn (worker-state/get-datascript-conn repo)]
    (cli-db-worker/list-tags @conn options)))

(def-thread-api :thread-api/cli-list-pages
  [repo options]
  (let [conn (worker-state/get-datascript-conn repo)]
    (cli-db-worker/list-pages @conn options)))

(def-thread-api :thread-api/cli-list-tasks
  [repo options]
  (let [conn (worker-state/get-datascript-conn repo)]
    (cli-db-worker/list-tasks @conn options)))

(def-thread-api :thread-api/cli-list-nodes
  [repo options]
  (let [conn (worker-state/get-datascript-conn repo)]
    (cli-db-worker/list-nodes @conn options)))

;; API server specific fns start with 'api-'
(def-thread-api :thread-api/api-get-page-data
  [repo page-title]
  (let [conn (worker-state/get-datascript-conn repo)]
    (api-tools/get-page-data @conn page-title)))

(def-thread-api :thread-api/api-list-properties
  [repo options]
  (let [conn (worker-state/get-datascript-conn repo)]
    (api-tools/list-properties @conn options)))

(def-thread-api :thread-api/api-list-tags
  [repo options]
  (let [conn (worker-state/get-datascript-conn repo)]
    (api-tools/list-tags @conn options)))

(def-thread-api :thread-api/api-list-pages
  [repo options]
  (let [conn (worker-state/get-datascript-conn repo)]
    (api-tools/list-pages @conn options)))

(def-thread-api :thread-api/api-build-upsert-nodes-edn
  [repo ops]
  (let [conn (worker-state/get-datascript-conn repo)]
    (api-tools/build-upsert-nodes-edn @conn ops)))

(comment
  (def-thread-api :general/dangerousRemoveAllDbs
    []
    (p/let [r (<list-all-dbs)
            dbs (ldb/read-transit-str r)]
      (p/all (map #(.unsafeUnlinkDB this (:name %)) dbs)))))

(defn- on-become-master
  [repo start-opts]
  (log/info :db-worker/on-become-master-start {:repo repo
                                               :import-type (:import-type start-opts)})
  (p/let [_ (init-sqlite-module!)
          _ (when-not (:import-type start-opts)
              (start-db! repo start-opts))]
    (when-not (:import-type start-opts)
      (assert (some? (worker-state/get-datascript-conn repo))))
    nil))

(def broadcast-data-types
  (set (map
        common-util/keyword->string
        [:sync-db-changes
         :sync-conflicts-updated
         :notification
         :log
         :add-repo
         :rtc-log
         :rtc-sync-state])))

(defn- <init-service!
  [graph start-opts]
  (let [[prev-graph service] @*service]
    (cond
      (nil? graph)
      (do
        (some-> prev-graph close-db!)
        nil)

      (and (= graph prev-graph) service)
      service

      :else
      (do
        (when (and prev-graph (not= graph prev-graph))
          (close-db! prev-graph))
        (log/info :db-worker/init-service {:graph graph
                                           :prev-graph prev-graph
                                           :import-type (:import-type start-opts)})
        (p/let [service (shared-service/<create-service graph
                                                        (bean/->js fns)
                                                        #(on-become-master graph start-opts)
                                                        broadcast-data-types
                                                        {:import? (:import-type? start-opts)})]
          (assert (p/promise? (get-in service [:status :ready])))
          (reset! *service [graph service])
          service)))))

(defn- notify-invalid-data
  [{:keys [tx-meta]} errors]
  ;; don't notify on production when undo/redo failed
  (when-not (and (or (:undo? tx-meta) (:redo? tx-meta))
                 (not worker-util/dev?))
    (shared-service/broadcast-to-clients! :notification
                                          [nil :error nil nil nil
                                           {:i18n-key :storage/invalid-data-writing}])
    (platform/post-message! (platform/current)
                            :capture-error
                            {:error (ex-info "Invalid data writing to db" tx-meta)
                             :payload {}
                             :extra {:errors (str errors)
                                     :tx-meta tx-meta}})))

(defn- build-proxy-object
  []
  (->>
   fns
   (map
    (fn [[k f]]
      [k
       (fn [& args]
         (let [[_graph service] @*service
               method-k (keyword (first args))]
           (cond
             (= k "remoteInvokeBinary")
             (apply f args)

             (= :thread-api/create-or-open-db method-k)
             ;; because shared-service operates at the graph level,
             ;; creating a new database or switching to another one requires re-initializing the service.
             (let [payload (last args)
                   payload' (cond
                              (string? payload) (ldb/read-transit-str payload)
                              (array? payload) (js->clj payload :keywordize-keys true)
                              :else payload)
                   [graph opts] payload']
               (p/let [service (<init-service! graph opts)
                       client-id (:client-id service)]
                 (when client-id
                   (platform/post-message! (platform/current)
                                           :record-worker-client-id
                                           {:client-id client-id}))
                 (get-in service [:status :ready])
                 ;; wait for service ready
                 (js-invoke (:proxy service) k args)))

             (or (= :thread-api/sync-app-state method-k)
                 (nil? service))
             ;; only proceed down this branch before shared-service is initialized
             (apply f args)

             :else
             ;; ensure service is ready
             (p/let [_ready-value (get-in service [:status :ready])]
               (js-invoke (:proxy service) k args)))))]))
   (into {})
   bean/->js))

(defn init-core!
  [platform']
  (platform/set-platform! platform')
  (ldb/register-transact-invalid-callback-fn! notify-invalid-data)
  (build-proxy-object))

(comment
  (defn <remove-all-files!
    "!! Dangerous: use it only for development."
    []
    (p/let [all-files (<list-all-files)
            files (filter #(= (.-kind %) "file") all-files)
            dirs (filter #(= (.-kind %) "directory") all-files)
            _ (p/all (map (fn [file] (.remove file)) files))]
      (p/all (map (fn [dir] (.remove dir)) dirs)))))
