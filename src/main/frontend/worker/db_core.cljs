(ns frontend.worker.db-core
  "Core db-worker logic without host-specific bootstrap."
  (:require
   [cljs-bean.core :as bean]
   [clojure.set]
   [clojure.string :as string]
   [datascript.core :as d]
   [datascript.storage :refer [IStorage] :as storage]
   [frontend.common.thread-api :as thread-api :refer [def-thread-api]]
   [frontend.worker-common.util :as worker-util]
   [frontend.worker.db-listener :as db-listener]
   [frontend.worker.db.fix :as db-fix]
   [frontend.worker.db.migrate :as db-migrate]
   [frontend.worker.db.validate :as worker-db-validate]
   [frontend.worker.handler.cli]
   [frontend.worker.handler.comments]
   [frontend.worker.handler.export]
   [frontend.worker.handler.flashcard]
   [frontend.worker.handler.graph]
   [frontend.worker.handler.markdown]
   [frontend.worker.handler.maintenance]
   [frontend.worker.handler.page]
   [frontend.worker.handler.property]
   [frontend.worker.handler.query]
   [frontend.worker.handler.render-resource]
   [frontend.worker.handler.search :as search-handler]
   [frontend.worker.handler.sync]
   [frontend.worker.handler.transaction :as transaction-handler]
   [frontend.worker.handler.undo-redo]
   [frontend.worker.handler.view]
   [frontend.worker.pipeline :as worker-pipeline]
   [frontend.worker.platform :as platform]
   [frontend.worker.publish]
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
   [logseq.common.graph-dir :as graph-dir]
   [logseq.common.util :as common-util]
   [logseq.db :as ldb]
   [logseq.db.common.entity-plus :as entity-plus]
   [logseq.db.common.order :as db-order]
   [logseq.db.common.sqlite :as common-sqlite]
   [logseq.db.frontend.asset :as db-asset]
   [logseq.db.frontend.class :as db-class]
   [logseq.db.frontend.property :as db-property]
   [logseq.db.frontend.schema :as db-schema]
   [logseq.db.sqlite.create-graph :as sqlite-create-graph]
   [logseq.db.sqlite.util :as sqlite-util]
   [logseq.graph-parser.exporter :as gp-exporter]
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

(defn- finalize-import-render-revisions!
  [conn]
  (let [db @conn
        entity-ids (d/q '[:find [?e ...]
                          :where
                          [?e :block/uuid]
                          [?e :block/title]
                          [(missing? $ ?e :block/tx-id)]]
                        db)]
    (when (seq entity-ids)
      (let [tx-id (inc (:max-tx db))]
        (ldb/transact! conn
                       (mapv (fn [entity-id]
                               {:db/id entity-id
                                :block/tx-id tx-id})
                             entity-ids)
                       {::gp-exporter/imported-data? true})))))

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
              _ (finalize-import-render-revisions! conn)
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
  (search-handler/clear-search-index-builds! repo)
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

(defn- bootstrap-transact!
  [conn tx-data]
  (when (seq tx-data)
    (d/transact! conn tx-data {:initial-db? true})))

(defn- ensure-canonical-revisions!
  [conn]
  (let [db @conn
        tx-id (inc (:max-tx db))
        tx-data (keep (fn [datom]
                        (let [entity (d/entity db (:e datom))]
                          (when-not (nat-int? (:block/tx-id entity))
                            {:db/id (:db/id entity)
                             :block/tx-id tx-id})))
                      (d/datoms db :avet :block/uuid))]
    (bootstrap-transact! conn tx-data)))

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
                            (bootstrap-transact! conn batch))
                        non-ident-batches (->> datoms
                                               (remove #(contains? ident-eids (:e %)))
                                               (map to-tx)
                                               (partition-all batch-size))]
                    (doseq [batch non-ident-batches]
                      (bootstrap-transact! conn batch))))
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
                                      (bootstrap-transact! conn initial-data)))]
            (when-not sync-download-graph?
              (let [migrate-result (db-migrate/migrate conn)]
                (if migrate-result
                  (handle-migrate-result-local-txs! repo migrate-result)
                  (maybe-enqueue-built-in-sync-repair! repo conn migrate-result initial-data-exists?)))
              (transaction-handler/maybe-run-recycle-gc! conn))

            (ensure-canonical-revisions! conn)

            (when initial-tx-report
              (db-sync/handle-local-tx! repo initial-tx-report))

            (db-listener/listen-db-changes! repo conn)

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

(def-thread-api :thread-api/init
  []
  (init-sqlite-module!))

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
  (p/let [_ (start-db! repo opts)
          conn (or (worker-state/get-datascript-conn repo)
                   (throw (ex-info "Missing worker graph connection"
                                   {:type :db/missing-connection
                                    :repo repo})))]
    {:schema (:schema @conn)}))

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
        (let [service-promise (shared-service/<create-service
                               graph
                               (bean/->js fns)
                               #(on-become-master graph start-opts)
                               broadcast-data-types
                               {:import? (:import-type? start-opts)})]
          (reset! *service [graph service-promise])
          (p/let [service service-promise]
            (assert (p/promise? (get-in service [:status :ready])))
            (when (identical? service-promise (second @*service))
              (reset! *service [graph service]))
            service))))))

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
                   [graph opts] payload'
                   service-promise (<init-service! graph opts)]
               (p/let [service service-promise
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
             (p/let [service service
                     _ready-value (get-in service [:status :ready])]
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
