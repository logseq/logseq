(ns frontend.worker.db-core
  "Core db-worker logic without host-specific bootstrap."
  (:require [cljs-bean.core :as bean]
            [cljs.cache :as cache]
            [clojure.edn :as edn]
            [clojure.set]
            [clojure.string :as string]
            [datascript.core :as d]
            [datascript.storage :refer [IStorage] :as storage]
            [frontend.common.cache :as common.cache]
            [frontend.common.graph-view :as graph-view]
            [frontend.common.missionary :as c.m]
            [frontend.common.thread-api :as thread-api :refer [def-thread-api]]
            [frontend.worker.platform :as platform]
            [frontend.worker-common.util :as worker-util]
            [frontend.worker.db-listener :as db-listener]
            [frontend.worker.db-metadata :as worker-db-metadata]
            [frontend.worker.db.fix :as db-fix]
            [frontend.worker.db.migrate :as db-migrate]
            [frontend.worker.db.validate :as worker-db-validate]
            [frontend.worker.embedding :as embedding]
            [frontend.worker.export :as worker-export]
            [frontend.worker.handler.page :as worker-page]
            [frontend.worker.pipeline :as worker-pipeline]
            [frontend.worker.publish]
            [frontend.worker.rtc.asset-db-listener]
            [frontend.worker.rtc.client-op :as client-op]
            [frontend.worker.rtc.core :as rtc.core]
            [frontend.worker.rtc.db-listener]
            [frontend.worker.rtc.debug-log :as rtc-debug-log]
            [frontend.worker.rtc.migrate :as rtc-migrate]
            [frontend.worker.search :as search]
            [frontend.worker.shared-service :as shared-service]
            [frontend.worker.state :as worker-state]
            [frontend.worker.thread-atom]
            [lambdaisland.glogi :as log]
            [logseq.cli.common.mcp.tools :as cli-common-mcp-tools]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.common.entity-plus :as entity-plus]
            [logseq.db.common.entity-util :as common-entity-util]
            [logseq.db.common.initial-data :as common-initial-data]
            [logseq.db.common.order :as db-order]
            [logseq.db.common.reference :as db-reference]
            [logseq.db.common.sqlite :as common-sqlite]
            [logseq.db.common.view :as db-view]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.sqlite.export :as sqlite-export]
            [logseq.db.sqlite.gc :as sqlite-gc]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.op :as outliner-op]
            [me.tonsky.persistent-sorted-set :as set :refer [BTSet]]
            [missionary.core :as m]
            [promesa.core :as p]))

(defonce *sqlite worker-state/*sqlite)
(defonce *sqlite-conns worker-state/*sqlite-conns)
(defonce *datascript-conns worker-state/*datascript-conns)
(defonce *client-ops-conns worker-state/*client-ops-conns)
(defonce *opfs-pools worker-state/*opfs-pools)
(defonce *publishing? (atom false))
(defonce ^:private *node-pools (atom {}))

(defn- node-runtime?
  []
  (= :node (platform/env-flag (platform/current) :runtime)))

(defn- get-storage-pool
  [graph]
  (if (node-runtime?)
    (get @*node-pools graph)
    (worker-state/get-opfs-pool graph)))

(defn- remember-storage-pool!
  [graph pool]
  (if (node-runtime?)
    (swap! *node-pools assoc graph pool)
    (swap! *opfs-pools assoc graph pool)))

(defn- forget-storage-pool!
  [graph]
  (if (node-runtime?)
    (swap! *node-pools dissoc graph)
    (swap! *opfs-pools dissoc graph)))

(defn- <get-opfs-pool
  [graph]
  (when-not @*publishing?
    (or (get-storage-pool graph)
        (p/let [storage (platform/storage (platform/current))
                ^js pool ((:install-opfs-pool storage) @*sqlite (worker-util/get-pool-name graph))]
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
(def debug-log-path "/debug-log/db.sqlite")

(defn- resolve-db-path
  [repo pool path]
  (let [storage (platform/storage (platform/current))]
    (if-let [f (:resolve-db-path storage)]
      (f repo pool path)
      path)))

(defn- <export-db-file
  ([repo]
   (<export-db-file repo repo-path))
  ([repo path]
    (p/let [^js pool (<get-opfs-pool repo)]
      (when pool
        (let [storage (platform/storage (platform/current))]
          ((:export-file storage) pool path))))))

(defn- <import-db
  [^js pool data]
  (let [storage (platform/storage (platform/current))]
    ((:import-db storage) pool repo-path data)))

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
          data (sqlite-util/transit-read content)]
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
                           :$content (sqlite-util/transit-write data')
                           :$addresses addresses}))
                  addr+data-seq)]
        (upsert-addr-content! db data)))

    (-restore [_ addr]
      (restore-data-from-addr db addr))))

(defn- close-db-aux!
  [repo ^Object db ^Object search ^Object client-ops ^Object debug-log]
  (swap! *sqlite-conns dissoc repo)
  (swap! *datascript-conns dissoc repo)
  (swap! *client-ops-conns dissoc repo)
  (when db (.close db))
  (when search (.close search))
  (when client-ops (.close client-ops))
  (when debug-log (.close debug-log))
  (when-let [^js pool (get-storage-pool repo)]
    (when (exists? (.-pauseVfs pool))
      (.pauseVfs pool)))
  (forget-storage-pool! repo))

(defn- close-other-dbs!
  [repo]
  (doseq [[r {:keys [db search client-ops debug-log]}] @*sqlite-conns]
    (when-not (= repo r)
      (close-db-aux! r db search client-ops debug-log))))

(defn close-db!
  [repo]
  (let [{:keys [db search client-ops debug-log]} (get @*sqlite-conns repo)]
    (close-db-aux! repo db search client-ops debug-log)))

(defn reset-db!
  [repo db-transit-str]
  (when-let [conn (get @*datascript-conns repo)]
    (let [new-db (ldb/read-transit-str db-transit-str)
          new-db' (update new-db :eavt (fn [^BTSet s]
                                         (set! (.-storage s) (.-storage (:eavt @conn)))
                                         s))]
      (d/reset-conn! conn new-db' {:reset-conn! true})
      (d/reset-schema! conn (:schema new-db)))))

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
      [db search-db])
    (p/let [^js pool (<get-opfs-pool repo)
            capacity (when (exists? (.-getCapacity pool))
                       (.getCapacity pool))
            _ (when (and (some? capacity) (zero? capacity))
                (.unpauseVfs pool))
            db-path (resolve-db-path repo pool repo-path)
            search-path (resolve-db-path repo pool (str "search" repo-path))
            client-ops-path (resolve-db-path repo pool (str "client-ops-" repo-path))
            debug-log-db-path (resolve-db-path repo pool (str "debug-log" repo-path))
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
            _ (log/info :db-worker/get-dbs-open {:repo repo :client-ops-path client-ops-path})
            client-ops-db (platform/sqlite-open (platform/current)
                                                {:sqlite @*sqlite
                                                 :pool pool
                                                 :path client-ops-path})
            _ (log/info :db-worker/get-dbs-open {:repo repo :debug-log-db-path debug-log-db-path})
            debug-log-db (platform/sqlite-open (platform/current)
                                               {:sqlite @*sqlite
                                                :pool pool
                                                :path debug-log-db-path})]
      [db search-db client-ops-db debug-log-db])))

(defn- enable-sqlite-wal-mode!
  [^Object db]
  (.exec db "PRAGMA locking_mode=exclusive")
  (.exec db "PRAGMA journal_mode=WAL"))

(defn- gc-sqlite-dbs!
  "Gc main db weekly and rtc ops db each time when opening it"
  [sqlite-db client-ops-db debug-log-db datascript-conn {:keys [full-gc?]}]
  (let [last-gc-at (:kv/value (d/entity @datascript-conn :logseq.kv/graph-last-gc-at))]
    (when (or full-gc?
              (nil? last-gc-at)
              (not (number? last-gc-at))
              (> (- (common-util/time-ms) last-gc-at) (* 3 24 3600 1000))) ; 3 days ago
      (log/info :gc-sqlite-dbs "gc current graph")
      (doseq [db (if @*publishing? [sqlite-db] [sqlite-db client-ops-db])]
        (sqlite-gc/gc-kvs-table! db {:full-gc? full-gc?})
        (.exec db "VACUUM"))
      (rtc-debug-log/gc! debug-log-db)
      (ldb/transact! datascript-conn [{:db/ident :logseq.kv/graph-last-gc-at
                                       :kv/value (common-util/time-ms)}]))))

(defn- <create-or-open-db!
  [repo {:keys [config datoms] :as opts}]
  (when-not (worker-state/get-sqlite-conn repo)
    (log/info :db-worker/create-or-open-start {:repo repo
                                               :has-datoms? (boolean datoms)
                                               :import-type (:import-type opts)})
    (p/let [[db search-db client-ops-db debug-log-db :as dbs] (get-dbs repo)
            storage (new-sqlite-storage db)
            client-ops-storage (when-not @*publishing?
                                 (new-sqlite-storage client-ops-db))
            db-based? true]
      (swap! *sqlite-conns assoc repo {:db db
                                       :search search-db
                                       :client-ops client-ops-db
                                       :debug-log debug-log-db})
      (doseq [db' dbs]
        (enable-sqlite-wal-mode! db'))
      (common-sqlite/create-kvs-table! db)
      (when-not @*publishing? (common-sqlite/create-kvs-table! client-ops-db))
      (rtc-debug-log/create-tables! debug-log-db)
      (search/create-tables-and-triggers! search-db)
      (ldb/register-transact-pipeline-fn!
       (fn [tx-report]
         (worker-pipeline/transact-pipeline repo tx-report)))
      (let [schema (ldb/get-schema repo)
            conn (common-sqlite/get-storage-conn storage schema)
            _ (db-fix/check-and-fix-schema! repo conn)
            _ (when datoms
                (let [eid->datoms (group-by :e datoms)
                      {properties true non-properties false} (group-by
                                                              (fn [[_eid datoms]]
                                                                (boolean
                                                                 (some (fn [datom] (and (= (:a datom) :db/ident)
                                                                                        (db-property/property? (:v datom))))
                                                                       datoms)))
                                                              eid->datoms)
                      datoms (concat (mapcat second properties)
                                     (mapcat second non-properties))
                      data (map (fn [datom]
                                  [:db/add (:e datom) (:a datom) (:v datom)])
                                datoms)]
                  (d/transact! conn data {:initial-db? true})))
            client-ops-conn (when-not @*publishing? (common-sqlite/get-storage-conn
                                                     client-ops-storage
                                                     client-op/schema-in-db))
            initial-data-exists? (when (nil? datoms)
                                   (and (d/entity @conn :logseq.class/Root)
                                        (= "db" (:kv/value (d/entity @conn :logseq.kv/db-type)))))]
        (swap! *datascript-conns assoc repo conn)
        (swap! *client-ops-conns assoc repo client-ops-conn)
        (when (and (not @*publishing?) (not= client-op/schema-in-db (d/schema @client-ops-conn)))
          (d/reset-schema! client-ops-conn client-op/schema-in-db))
        (when (and db-based? (not initial-data-exists?) (not datoms))
          (let [config (or config "")
                initial-data (sqlite-create-graph/build-db-initial-data
                              config (select-keys opts [:import-type :graph-git-sha]))]
            (ldb/transact! conn initial-data {:initial-db? true})))

        (gc-sqlite-dbs! db client-ops-db debug-log-db conn {})

        (let [migration-result (db-migrate/migrate conn)]
          (when (client-op/rtc-db-graph? repo)
            (let [client-ops (rtc-migrate/migration-results=>client-ops migration-result)]
              (client-op/add-ops! repo client-ops))))

        (db-listener/listen-db-changes! repo (get @*datascript-conns repo))))))

(defn- <list-all-dbs
  []
  (p/let [storage (platform/storage (platform/current))
          graph-names ((:list-graphs storage))]
    (p/all (map (fn [graph-name]
                  (p/let [repo (str sqlite-util/db-version-prefix graph-name)
                          metadata (worker-db-metadata/<get repo)]
                    {:name graph-name
                     :metadata (edn/read-string metadata)}))
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

(comment
  (def-thread-api :thread-api/get-version
    []
    (when-let [sqlite @*sqlite]
      (.-version sqlite))))

(def-thread-api :thread-api/init
  [rtc-ws-url]
  (reset! worker-state/*rtc-ws-url rtc-ws-url)
  (init-sqlite-module!))

(def-thread-api :thread-api/set-infer-worker-proxy
  [infer-worker-proxy]
  (reset! worker-state/*infer-worker infer-worker-proxy)
  nil)

;; [graph service]
(defonce *service (atom []))

(defonce fns {"remoteInvoke" thread-api/remote-function})

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
  (when-not (= repo (worker-state/get-current-repo)) ; graph switched
    (reset! worker-state/*deleted-block-uuid->db-id {}))
  (start-db! repo opts))

(def-thread-api :thread-api/q
  [repo inputs]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (worker-util/profile
     (str "Datalog query: " inputs)
     (apply d/q (first inputs) @conn (rest inputs)))))

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

(def ^:private *get-blocks-cache (volatile! (cache/lru-cache-factory {} :threshold 1000)))
(def ^:private get-blocks-with-cache
  (common.cache/cache-fn
   *get-blocks-cache
   (fn [repo requests]
     (let [db (some-> (worker-state/get-datascript-conn repo) deref)]
       [[repo (:max-tx db) requests]
        [db requests]]))
   (fn [db requests]
     (when db
       (->> requests
            (mapv (fn [{:keys [id opts]}]
                    (let [id' (if (and (string? id) (common-util/uuid-string? id)) (uuid id) id)]
                      (-> (common-initial-data/get-block-and-children db id' opts)
                          (assoc :id id)))))
            ldb/write-transit-str)))))

(def-thread-api :thread-api/get-blocks
  [repo requests]
  (let [requests (ldb/read-transit-str requests)]
    (get-blocks-with-cache repo requests)))

(def-thread-api :thread-api/get-block-refs
  [repo id]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (->> (db-reference/get-linked-references @conn id)
         :ref-blocks
         (map (fn [b] (assoc (into {} b) :db/id (:db/id b)))))))

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
        conn (worker-state/get-datascript-conn repo)]
    (search/search-blocks repo conn search-db q option)))

(def-thread-api :thread-api/block-refs-check
  [repo id {:keys [unlinked?]}]
  (m/sp
    (when-let [conn (worker-state/get-datascript-conn repo)]
      (let [db @conn
            block (d/entity db id)]
        (if unlinked?
          (let [title (string/lower-case (:block/title block))
                result (m/? (search-blocks repo title {:limit 100}))]
            (boolean (some (fn [b]
                             (let [block (d/entity db (:db/id b))]
                               (and (not= id (:db/id block))
                                    (not ((set (map :db/id (:block/refs block))) id))
                                    (string/includes? (string/lower-case (:block/title block)) title)))) result)))
          (some? (first (common-initial-data/get-block-refs db (:db/id block)))))))))

(def-thread-api :thread-api/get-block-parents
  [repo id depth]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [block-id (:block/uuid (d/entity @conn id))]
      (->> (ldb/get-block-parents @conn block-id {:depth (or depth 3)})
           (map (fn [b] (d/pull @conn '[*] (:db/id b))))))))

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
                       (and (not (:whiteboard/transact? tx-meta))
                            (not (:rtc-download-graph? tx-meta))) ; delay writes to the disk
                       (assoc :skip-store? true)

                       true
                       (dissoc :insert-blocks?))]
        (when-not (and (:create-today-journal? tx-meta)
                       (:today-journal-name tx-meta)
                       (seq tx-data')
                       (ldb/get-page @conn (:today-journal-name tx-meta))) ; today journal created already

          ;; (prn :debug :transact :tx-data tx-data' :tx-meta tx-meta')

          (worker-util/profile "Worker db transact"
                               (ldb/transact! conn tx-data' tx-meta')))
        nil)
      (catch :default e
        (prn :debug :worker-transact-failed :tx-meta tx-meta :tx-data tx-data)
        (log/error ::worker-transact-failed e)
        (throw e)))))

(def-thread-api :thread-api/get-initial-data
  [repo opts]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (if (:file-graph-import? opts)
      {:schema (:schema @conn)
       :initial-data (vec (d/datoms @conn :eavt))}
      (common-initial-data/get-initial-data @conn))))

(def-thread-api :thread-api/reset-db
  [repo db-transit]
  (reset-db! repo db-transit)
  nil)

(def-thread-api :thread-api/unsafe-unlink-db
  [repo]
  (p/let [pool (<get-opfs-pool repo)
          _ (close-db! repo)
          _result (remove-vfs! pool)]
    nil))

(def-thread-api :thread-api/release-access-handles
  [repo]
  (when-let [^js pool (get-storage-pool repo)]
    (when (exists? (.-pauseVfs pool))
      (.pauseVfs pool))
    nil))

(def-thread-api :thread-api/db-exists
  [repo]
  (<db-exists? repo))

(def-thread-api :thread-api/export-db
  [repo]
  (when-let [^js db (worker-state/get-sqlite-conn repo :db)]
    (.exec db "PRAGMA wal_checkpoint(2)"))
  (p/let [data (<export-db-file repo)]
    (platform/transfer (platform/current) data #js [(.-buffer data)])))

(def-thread-api :thread-api/export-db-base64
  [repo]
  (when-let [^js db (worker-state/get-sqlite-conn repo :db)]
    (.exec db "PRAGMA wal_checkpoint(2)"))
  (p/let [data (<export-db-file repo)]
    (when data
      (let [buffer (if (instance? js/Buffer data)
                     data
                     (js/Buffer.from data))]
        (.toString buffer "base64")))))

(def-thread-api :thread-api/export-debug-log-db
  [repo]
  (when-let [^js db (worker-state/get-sqlite-conn repo :debug-log)]
    (.exec db "PRAGMA wal_checkpoint(2)"))
  (-> (p/let [data (<export-db-file
                    repo
                    debug-log-path)]
        (when data
          (platform/transfer (platform/current) data #js [(.-buffer data)])))
      (p/catch (fn [error]
                 (throw error)))))

(def-thread-api :thread-api/reset-debug-log-db
  [repo]
  (when-let [^js db (worker-state/get-sqlite-conn repo :debug-log)]
    (rtc-debug-log/reset-tables! db)))

(def-thread-api :thread-api/import-db
  [repo data]
  (when-not (string/blank? repo)
    (p/let [pool (<get-opfs-pool repo)]
      (<import-db pool data)
      nil)))

(def-thread-api :thread-api/import-db-base64
  [repo base64]
  (when-not (string/blank? repo)
    (p/let [pool (<get-opfs-pool repo)
            data (js/Buffer.from base64 "base64")
            _ (close-db! repo)
            _ (<import-db pool data)
            _ (start-db! repo {:import-type :sqlite-db})]
      nil)))

(def-thread-api :thread-api/search-blocks
  [repo q option]
  (search-blocks repo q option))

(def-thread-api :thread-api/search-upsert-blocks
  [repo blocks]
  (when-let [db (get-search-db repo)]
    (search/upsert-blocks! db (bean/->js blocks))
    nil))

(def-thread-api :thread-api/search-delete-blocks
  [repo ids]
  (when-let [db (get-search-db repo)]
    (search/delete-blocks! db ids)
    nil))

(def-thread-api :thread-api/search-truncate-tables
  [repo]
  (when-let [db (get-search-db repo)]
    (search/truncate-table! db)
    nil))

(def-thread-api :thread-api/search-build-blocks-indice
  [repo]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (search/build-blocks-indice repo @conn)))

(def-thread-api :thread-api/search-build-pages-indice
  [_repo]
  nil)

(def-thread-api :thread-api/apply-outliner-ops
  [repo ops opts]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (try
      (worker-util/profile
       "apply outliner ops"
       (outliner-op/apply-ops! conn ops opts))
      (catch :default e
        (let [data (ex-data e)
              {:keys [type payload]} (when (map? data) data)]
          (case type
            :notification
            (do
              (log/error ::apply-outliner-ops-failed e)
              (shared-service/broadcast-to-clients! :notification [(:message payload) (:type payload) (:clear? payload) (:uid payload) (:timeout payload)]))
            (throw e)))))))

(def-thread-api :thread-api/sync-app-state
  [new-state]
  (when (and (contains? new-state :git/current-repo)
             (nil? (:git/current-repo new-state)))
    (log/error :thread-api/sync-app-state new-state))
  (worker-state/set-new-state! new-state)
  nil)

(def-thread-api :thread-api/export-get-debug-datoms
  [repo]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (worker-export/get-debug-datoms conn)))

(def-thread-api :thread-api/export-get-all-pages
  [repo]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (worker-export/get-all-pages repo @conn)))

(def-thread-api :thread-api/export-get-all-page->content
  [repo options]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (worker-export/get-all-page->content repo @conn options)))

(def-thread-api :thread-api/validate-db
  [repo]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (worker-db-validate/validate-db conn)))

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
                                ["An unexpected error occurred during export. See the javascript console for details."
                                 :error])
        {:export-edn-error (.-message e)}))))

(def-thread-api :thread-api/import-edn
  [repo export-edn]
  (let [conn (worker-state/get-datascript-conn repo)]
    (when-not conn
      (throw (ex-info "graph not opened" {:code :graph-not-opened :repo repo})))
    (let [{:keys [init-tx block-props-tx misc-tx]} (sqlite-export/build-import export-edn @conn {})
          tx-data (vec (concat init-tx block-props-tx misc-tx))
          tx-meta {::sqlite-export/imported-data? true}]
      (ldb/transact! conn tx-data tx-meta)
      {:tx-count (count tx-data)})))

(def-thread-api :thread-api/get-view-data
  [repo view-id option]
  (let [db @(worker-state/get-datascript-conn repo)]
    (db-view/get-view-data db view-id option)))

(def-thread-api :thread-api/get-class-objects
  [repo class-id]
  (let [db @(worker-state/get-datascript-conn repo)]
    (->> (db-class/get-class-objects db class-id)
         (map common-entity-util/entity->map))))

(def-thread-api :thread-api/get-property-values
  [repo {:keys [property-ident] :as option}]
  (let [conn (worker-state/get-datascript-conn repo)]
    (db-view/get-property-values @conn property-ident option)))

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
  (let [{:keys [db client-ops debug-log]} (get @*sqlite-conns repo)
        conn (get @*datascript-conns repo)]
    (when (and db conn)
      (gc-sqlite-dbs! db client-ops debug-log conn {:full-gc? true})
      nil)))

(def-thread-api :thread-api/vec-search-embedding-model-info
  [repo]
  (embedding/task--embedding-model-info repo))

(def-thread-api :thread-api/vec-search-init-embedding-model
  [repo]
  (js/Promise. (embedding/task--init-embedding-model repo)))

(def-thread-api :thread-api/vec-search-load-model
  [repo model-name]
  (js/Promise. (embedding/task--load-model repo model-name)))

(def-thread-api :thread-api/vec-search-embedding-graph
  [repo opts]
  (embedding/embedding-graph! repo opts))

(def-thread-api :thread-api/vec-search-search
  [repo query-string nums-neighbors]
  (embedding/task--search repo query-string nums-neighbors))

(def-thread-api :thread-api/vec-search-cancel-indexing
  [repo]
  (embedding/cancel-indexing repo))

(def-thread-api :thread-api/vec-search-update-index-info
  [repo]
  (js/Promise. (embedding/task--update-index-info! repo)))

(def-thread-api :thread-api/mobile-logs
  []
  @worker-state/*log)

(def-thread-api :thread-api/get-rtc-graph-uuid
  [repo]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (ldb/get-graph-rtc-uuid @conn)))

(def-thread-api :thread-api/api-get-page-data
  [repo page-title]
  (let [conn (worker-state/get-datascript-conn repo)]
    (cli-common-mcp-tools/get-page-data @conn page-title)))

(def-thread-api :thread-api/api-list-properties
  [repo options]
  (let [conn (worker-state/get-datascript-conn repo)]
    (cli-common-mcp-tools/list-properties @conn options)))

(def-thread-api :thread-api/api-list-tags
  [repo options]
  (let [conn (worker-state/get-datascript-conn repo)]
    (cli-common-mcp-tools/list-tags @conn options)))

(def-thread-api :thread-api/api-list-pages
  [repo options]
  (let [conn (worker-state/get-datascript-conn repo)]
    (cli-common-mcp-tools/list-pages @conn options)))

(def-thread-api :thread-api/api-build-upsert-nodes-edn
  [repo ops]
  (let [conn (worker-state/get-datascript-conn repo)]
    (cli-common-mcp-tools/build-upsert-nodes-edn @conn ops)))

(comment
  (def-thread-api :general/dangerousRemoveAllDbs
    []
    (p/let [r (<list-all-dbs)
            dbs (ldb/read-transit-str r)]
      (p/all (map #(.unsafeUnlinkDB this (:name %)) dbs)))))

(defn- delete-page!
  [conn page-uuid]
  (let [error-handler (fn [{:keys [msg]}]
                        (platform/post-message! (platform/current)
                                                :notification
                                                [[:div [:p msg]] :error]))]
    (worker-page/delete! conn page-uuid {:error-handler error-handler})))

(defn- create-page!
  [conn title options]
  (try
    (worker-page/create! conn title options)
    (catch :default e
      (js/console.error e)
      (throw e))))

(defn- outliner-register-op-handlers!
  []
  (outliner-op/register-op-handlers!
   {:create-page (fn [conn [title options]]
                   (create-page! conn title options))
    :rename-page (fn [conn [page-uuid new-title]]
                   (if (string/blank? new-title)
                     (throw (ex-info "Page name shouldn't be blank" {:block/uuid page-uuid
                                                                     :block/title new-title}))
                     (outliner-core/save-block! conn
                                                {:block/uuid page-uuid
                                                 :block/title new-title})))
    :delete-page (fn [conn [page-uuid]]
                   (delete-page! conn page-uuid))}))

(defn- on-become-master
  [repo start-opts]
  (js/Promise.
   (m/sp
     (log/info :db-worker/on-become-master-start {:repo repo
                                                  :import-type (:import-type start-opts)})
     (c.m/<? (init-sqlite-module!))
     (when-not (:import-type start-opts)
       (c.m/<? (start-db! repo start-opts))
       (assert (some? (worker-state/get-datascript-conn repo))))
     ;; Don't wait for rtc started because the app will be slow to be ready
     ;; for users.
     (when @worker-state/*rtc-ws-url
       (rtc.core/new-task--rtc-start true)))))

(def broadcast-data-types
  (set (map
        common-util/keyword->string
        [:sync-db-changes
         :notification
         :log
         :add-repo
         :rtc-log
         :rtc-sync-state])))

(defn- <init-service!
  [graph start-opts]
  (let [[prev-graph service] @*service]
    (some-> prev-graph close-db!)
    (when graph
      (if (= graph prev-graph)
        service
        (do
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
          service))))))

(defn- notify-invalid-data
  [{:keys [tx-meta]} errors]
  ;; don't notify on production when undo/redo failed
  (when-not (and (or (:undo? tx-meta) (:redo? tx-meta))
                 (not worker-util/dev?))
    (shared-service/broadcast-to-clients! :notification
                                          [["Invalid data writing to db!"] :error])
    (platform/post-message! (platform/current)
                            :capture-error
                            {:error (ex-info "Invalid data writing to db" {})
                             :payload {}
                             :extra {:errors (str errors)}})))

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

             (or
              (contains? #{:thread-api/set-infer-worker-proxy :thread-api/sync-app-state} method-k)
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
  (outliner-register-op-handlers!)
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
