(ns frontend.worker.db-worker
  "Worker used for browser DB implementation"
  (:require ["@sqlite.org/sqlite-wasm" :default sqlite3InitModule]
            ["comlink" :as Comlink]
            [cljs-bean.core :as bean]
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
            [frontend.worker-common.util :as worker-util]
            [frontend.worker.db-listener :as db-listener]
            [frontend.worker.db-metadata :as worker-db-metadata]
            [frontend.worker.db.fix :as db-fix]
            [frontend.worker.db.migrate :as db-migrate]
            [frontend.worker.db.validate :as worker-db-validate]
            [frontend.worker.embedding :as embedding]
            [frontend.worker.export :as worker-export]
            [frontend.worker.file :as file]
            [frontend.worker.file.reset :as file-reset]
            [frontend.worker.handler.page :as worker-page]
            [frontend.worker.handler.page.file-based.rename :as file-worker-page-rename]
            [frontend.worker.rtc.asset-db-listener]
            [frontend.worker.rtc.client-op :as client-op]
            [frontend.worker.rtc.core :as rtc.core]
            [frontend.worker.rtc.db-listener]
            [frontend.worker.rtc.migrate :as rtc-migrate]
            [frontend.worker.search :as search]
            [frontend.worker.shared-service :as shared-service]
            [frontend.worker.state :as worker-state]
            [frontend.worker.thread-atom]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]
            [lambdaisland.glogi.console :as glogi-console]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.common.entity-plus :as entity-plus]
            [logseq.db.common.initial-data :as common-initial-data]
            [logseq.db.common.order :as db-order]
            [logseq.db.common.sqlite :as common-sqlite]
            [logseq.db.common.view :as db-view]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.sqlite.export :as sqlite-export]
            [logseq.db.sqlite.gc :as sqlite-gc]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.outliner.op :as outliner-op]
            [me.tonsky.persistent-sorted-set :as set :refer [BTSet]]
            [missionary.core :as m]
            [promesa.core :as p]))

(.importScripts js/self "worker.js")

(defonce *sqlite worker-state/*sqlite)
(defonce *sqlite-conns worker-state/*sqlite-conns)
(defonce *datascript-conns worker-state/*datascript-conns)
(defonce *client-ops-conns worker-state/*client-ops-conns)
(defonce *opfs-pools worker-state/*opfs-pools)
(defonce *publishing? (atom false))

(defn- check-worker-scope!
  []
  (when (or (gobj/get js/self "React")
            (gobj/get js/self "module$react"))
    (throw (js/Error. "[db-worker] React is forbidden in worker scope!"))))

(defn- <get-opfs-pool
  [graph]
  (when-not @*publishing?
    (or (worker-state/get-opfs-pool graph)
        (p/let [^js pool (.installOpfsSAHPoolVfs ^js @*sqlite #js {:name (worker-util/get-pool-name graph)
                                                                   :initialCapacity 20})]
          (swap! *opfs-pools assoc graph pool)
          pool))))

(defn- init-sqlite-module!
  []
  (when-not @*sqlite
    (p/let [href (.. js/location -href)
            publishing? (string/includes? href "publishing=true")
            sqlite (sqlite3InitModule (clj->js {:print #(log/info :init-sqlite-module! %)
                                                :printErr #(log/error :init-sqlite-module! %)}))]
      (reset! *publishing? publishing?)
      (reset! *sqlite sqlite)
      nil)))

(def repo-path "/db.sqlite")

(defn- <export-db-file
  [repo]
  (p/let [^js pool (<get-opfs-pool repo)]
    (when pool
      (.exportFile ^js pool repo-path))))

(defn- <import-db
  [^js pool data]
  (.importDb ^js pool repo-path data))

(defn- get-all-datoms-from-sqlite-db
  [db]
  (some->> (.exec db #js {:sql "select * from kvs"
                          :rowMode "array"})
           bean/->clj
           (mapcat
            (fn [[_addr content _addresses]]
              (let [content' (sqlite-util/transit-read content)
                    datoms (when (map? content')
                             (:keys content'))]
                datoms)))
           distinct
           (map (fn [[e a v t]]
                  (d/datom e a v t)))))

(defn- rebuild-db-from-datoms!
  "Persistent-sorted-set has been broken, used addresses can't be found"
  [datascript-conn sqlite-db]
  (let [datoms (get-all-datoms-from-sqlite-db sqlite-db)
        db (d/init-db [] db-schema/schema
                      {:storage (storage/storage @datascript-conn)})
        db (d/db-with db
                      (map (fn [d]
                             [:db/add (:e d) (:a d) (:v d) (:t d)]) datoms))]
    (prn :debug :rebuild-db-from-datoms :datoms-count (count datoms))
    (worker-util/post-message :notification ["The SQLite db will be exported to avoid any data-loss." :warning false])
    (worker-util/post-message :export-current-db [])
    (.exec sqlite-db #js {:sql "delete from kvs"})
    (d/reset-conn! datascript-conn db)))

(defn- fix-broken-graph
  [graph]
  (let [conn (worker-state/get-datascript-conn graph)
        sqlite-db (worker-state/get-sqlite-conn graph)]
    (when (and conn sqlite-db)
      (rebuild-db-from-datoms! conn sqlite-db)
      (worker-util/post-message :notification ["The graph has been successfully rebuilt." :success false]))))

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
  [repo ^Object db ^Object search ^Object client-ops]
  (swap! *sqlite-conns dissoc repo)
  (swap! *datascript-conns dissoc repo)
  (swap! *client-ops-conns dissoc repo)
  (when db (.close db))
  (when search (.close search))
  (when client-ops (.close client-ops))
  (when-let [^js pool (worker-state/get-opfs-pool repo)]
    (.pauseVfs pool))
  (swap! *opfs-pools dissoc repo))

(defn- close-other-dbs!
  [repo]
  (doseq [[r {:keys [db search client-ops]}] @*sqlite-conns]
    (when-not (= repo r)
      (close-db-aux! r db search client-ops))))

(defn close-db!
  [repo]
  (let [{:keys [db search client-ops]} (get @*sqlite-conns repo)]
    (close-db-aux! repo db search client-ops)))

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
    (p/let [^object DB (.-DB ^object (.-oo1 ^object @*sqlite))
            db (new DB "/db.sqlite" "c")
            search-db (new DB "/search-db.sqlite" "c")]
      [db search-db])
    (p/let [^js pool (<get-opfs-pool repo)
            capacity (.getCapacity pool)
            _ (when (zero? capacity)   ; file handle already releases since pool will be initialized only once
                (.unpauseVfs pool))
            db (new (.-OpfsSAHPoolDb pool) repo-path)
            search-db (new (.-OpfsSAHPoolDb pool) (str "search" repo-path))
            client-ops-db (new (.-OpfsSAHPoolDb pool) (str "client-ops-" repo-path))]
      [db search-db client-ops-db])))

(defn- enable-sqlite-wal-mode!
  [^Object db]
  (.exec db "PRAGMA locking_mode=exclusive")
  (.exec db "PRAGMA journal_mode=WAL"))

(defn- gc-sqlite-dbs!
  "Gc main db weekly and rtc ops db each time when opening it"
  [sqlite-db client-ops-db datascript-conn {:keys [full-gc?]}]
  (let [last-gc-at (:kv/value (d/entity @datascript-conn :logseq.kv/graph-last-gc-at))]
    (when (or full-gc?
              (nil? last-gc-at)
              (not (number? last-gc-at))
              (> (- (common-util/time-ms) last-gc-at) (* 3 24 3600 1000))) ; 3 days ago
      (println :debug "gc current graph")
      (doseq [db (if @*publishing? [sqlite-db] [sqlite-db client-ops-db])]
        (sqlite-gc/gc-kvs-table! db {:full-gc? full-gc?})
        (.exec db "VACUUM"))
      (d/transact! datascript-conn [{:db/ident :logseq.kv/graph-last-gc-at
                                     :kv/value (common-util/time-ms)}]))))

(defn- create-or-open-db!
  [repo {:keys [config datoms] :as opts}]
  (when-not (worker-state/get-sqlite-conn repo)
    (p/let [[db search-db client-ops-db :as dbs] (get-dbs repo)
            storage (new-sqlite-storage db)
            client-ops-storage (when-not @*publishing?
                                 (new-sqlite-storage client-ops-db))
            db-based? (sqlite-util/db-based-graph? repo)]
      (swap! *sqlite-conns assoc repo {:db db
                                       :search search-db
                                       :client-ops client-ops-db})
      (doseq [db' dbs]
        (enable-sqlite-wal-mode! db'))
      (common-sqlite/create-kvs-table! db)
      (when-not @*publishing? (common-sqlite/create-kvs-table! client-ops-db))
      (search/create-tables-and-triggers! search-db)
      (let [schema (ldb/get-schema repo)
            conn (common-sqlite/get-storage-conn storage schema)
            _ (db-fix/check-and-fix-schema! repo conn)
            _ (when datoms
                (let [data (map (fn [datom]
                                  [:db/add (:e datom) (:a datom) (:v datom)]) datoms)]
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
            (d/transact! conn initial-data {:initial-db? true})))

        (gc-sqlite-dbs! db client-ops-db conn {})

        (let [migration-result (db-migrate/migrate conn)]
          (when (client-op/rtc-db-graph? repo)
            (let [client-ops (rtc-migrate/migration-results=>client-ops migration-result)]
              (client-op/add-ops! repo client-ops))))

        (db-listener/listen-db-changes! repo (get @*datascript-conns repo))))))

(defn- iter->vec [iter']
  (when iter'
    (p/loop [acc []]
      (p/let [elem (.next iter')]
        (if (.-done elem)
          acc
          (p/recur (conj acc (.-value elem))))))))

(comment
  (defn- <list-all-files
    []
    (let [dir? #(= (.-kind %) "directory")]
      (p/let [^js root (.getDirectory js/navigator.storage)]
        (p/loop [result []
                 dirs [root]]
          (if (empty? dirs)
            result
            (p/let [dir (first dirs)
                    result (conj result dir)
                    values-iter (when (dir? dir) (.values dir))
                    values (when values-iter (iter->vec values-iter))
                    current-dir-dirs (filter dir? values)
                    result (concat result values)
                    dirs (concat
                          current-dir-dirs
                          (rest dirs))]
              (p/recur result dirs))))))))

(defn- <list-all-dbs
  []
  (let [dir? #(= (.-kind %) "directory")
        db-dir-prefix ".logseq-pool-"]
    (p/let [^js root (.getDirectory js/navigator.storage)
            values-iter (when (dir? root) (.values root))
            values (when values-iter (iter->vec values-iter))
            current-dir-dirs (filter dir? values)
            db-dirs (filter (fn [file]
                              (string/starts-with? (.-name file) db-dir-prefix))
                            current-dir-dirs)]
      (log/info :db-dirs (map #(.-name %) db-dirs) :all-dirs (map #(.-name %) current-dir-dirs))
      (p/all (map (fn [dir]
                    (p/let [graph-name (-> (.-name dir)
                                           (string/replace-first ".logseq-pool-" "")
                                           ;; TODO: DRY
                                           (string/replace "+3A+" ":")
                                           (string/replace "++" "/"))
                            repo (str sqlite-util/db-version-prefix graph-name)
                            metadata (worker-db-metadata/<get repo)]
                      {:name graph-name
                       :metadata (edn/read-string metadata)})) db-dirs)))))

(def-thread-api :thread-api/list-db
  []
  (<list-all-dbs))

(defn- <db-exists?
  [graph]
  (->
   (p/let [^js root (.getDirectory js/navigator.storage)
           _dir-handle (.getDirectoryHandle root (str "." (worker-util/get-pool-name graph)))]
     true)
   (p/catch
    (fn [_e]                         ; not found
      false))))

(defn- remove-vfs!
  [^js pool]
  (when pool
    (.removeVfs ^js pool)))

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
     (create-or-open-db! repo (dissoc opts :close-other-db?)))
   nil))

(def-thread-api :thread-api/create-or-open-db
  [repo opts]
  (when-not (= repo (worker-state/get-current-repo)) ; graph switched
    (reset! worker-state/*deleted-block-uuid->db-id {}))
  (start-db! repo opts))

(def-thread-api :thread-api/q
  [repo inputs]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (apply d/q (first inputs) @conn (rest inputs))))

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
    (ldb/get-block-refs @conn id)))

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
  [repo]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (common-initial-data/get-initial-data @conn)))

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
  (when-let [^js pool (worker-state/get-opfs-pool repo)]
    (.pauseVfs pool)
    nil))

(def-thread-api :thread-api/db-exists
  [repo]
  (<db-exists? repo))

(def-thread-api :thread-api/export-db
  [repo]
  (when-let [^js db (worker-state/get-sqlite-conn repo :db)]
    (.exec db "PRAGMA wal_checkpoint(2)"))
  (p/let [data (<export-db-file repo)]
    (Comlink/transfer data #js [(.-buffer data)])))

(def-thread-api :thread-api/import-db
  [repo data]
  (when-not (string/blank? repo)
    (p/let [pool (<get-opfs-pool repo)]
      (<import-db pool data)
      nil)))

(def-thread-api :thread-api/search-blocks
  [repo q option]
  (search-blocks repo q option))

(def-thread-api :thread-api/search-upsert-blocks
  [repo blocks]
  (p/let [db (get-search-db repo)]
    (search/upsert-blocks! db (bean/->js blocks))
    nil))

(def-thread-api :thread-api/search-delete-blocks
  [repo ids]
  (p/let [db (get-search-db repo)]
    (search/delete-blocks! db ids)
    nil))

(def-thread-api :thread-api/search-truncate-tables
  [repo]
  (p/let [db (get-search-db repo)]
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
       (outliner-op/apply-ops! repo conn ops (worker-state/get-date-formatter repo) opts))
      (catch :default e
        (let [data (ex-data e)
              {:keys [type payload]} (when (map? data) data)]
          (case type
            :notification
            (shared-service/broadcast-to-clients! :notification [(:message payload) (:type payload)])
            (throw e)))))))

(def-thread-api :thread-api/file-writes-finished?
  [repo]
  (let [conn (worker-state/get-datascript-conn repo)
        writes @file/*writes]
    ;; Clean pages that have been deleted
    (when conn
      (swap! file/*writes (fn [writes]
                            (->> writes
                                 (remove (fn [[_ pid]] (d/entity @conn pid)))
                                 (into {})))))
    (if (empty? writes)
      true
      (do
        (prn "Unfinished file writes:" @file/*writes)
        false))))

(def-thread-api :thread-api/page-file-saved
  [request-id _page-id]
  (file/dissoc-request! request-id)
  nil)

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

(def-thread-api :thread-api/export-edn
  [repo options]
  (let [conn (worker-state/get-datascript-conn repo)]
    (try
      (sqlite-export/build-export @conn options)
      (catch :default e
        (js/console.error "export-edn error: " e)
        (js/console.error "Stack:\n" (.-stack e))
        (worker-util/post-message :notification
                                  ["An unexpected error occurred during export. See the javascript console for details."
                                   :error])
        :export-edn-error))))

(def-thread-api :thread-api/get-view-data
  [repo view-id option]
  (let [db @(worker-state/get-datascript-conn repo)]
    (db-view/get-view-data db view-id option)))

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

(def-thread-api :thread-api/fix-broken-graph
  [graph]
  (fix-broken-graph graph))

(def-thread-api :thread-api/reset-file
  [repo file-path content opts]
  ;; (prn :debug :reset-file :file-path file-path :opts opts)
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (file-reset/reset-file! repo conn file-path content opts)))

(def-thread-api :thread-api/gc-graph
  [repo]
  (let [{:keys [db client-ops]} (get @*sqlite-conns repo)
        conn (get @*datascript-conns repo)]
    (when (and db conn)
      (gc-sqlite-dbs! db client-ops conn {:full-gc? true})
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

(comment
  (def-thread-api :general/dangerousRemoveAllDbs
    []
    (p/let [r (<list-all-dbs)
            dbs (ldb/read-transit-str r)]
      (p/all (map #(.unsafeUnlinkDB this (:name %)) dbs)))))

(defn- rename-page!
  [repo conn page-uuid new-name]
  (let [config (worker-state/get-config repo)
        f (if (sqlite-util/db-based-graph? repo)
            (throw (ex-info "Rename page is a file graph only operation" {}))
            file-worker-page-rename/rename!)]
    (f repo conn config page-uuid new-name)))

(defn- delete-page!
  [repo conn page-uuid]
  (let [error-handler (fn [{:keys [msg]}]
                        (worker-util/post-message :notification
                                                  [[:div [:p msg]] :error]))]
    (worker-page/delete! repo conn page-uuid {:error-handler error-handler})))

(defn- create-page!
  [repo conn title options]
  (let [config (worker-state/get-config repo)]
    (worker-page/create! repo conn config title options)))

(defn- outliner-register-op-handlers!
  []
  (outliner-op/register-op-handlers!
   {:create-page (fn [repo conn [title options]]
                   (create-page! repo conn title options))
    :rename-page (fn [repo conn [page-uuid new-name]]
                   (rename-page! repo conn page-uuid new-name))
    :delete-page (fn [repo conn [page-uuid]]
                   (delete-page! repo conn page-uuid))}))

(defn- <ratelimit-file-writes!
  []
  (file/<ratelimit-file-writes!
   (fn [col]
     (when (seq col)
       (let [repo (ffirst col)
             conn (worker-state/get-datascript-conn repo)]
         (if conn
           (when-not (ldb/db-based-graph? @conn)
             (file/write-files! conn col (worker-state/get-context)))
           (js/console.error (str "DB is not found for " repo))))))))

(defn- on-become-master
  [repo start-opts]
  (js/Promise.
   (m/sp
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
        (p/let [service (shared-service/<create-service graph
                                                        (bean/->js fns)
                                                        #(on-become-master graph start-opts)
                                                        broadcast-data-types
                                                        {:import? (:import-type? start-opts)})]
          (assert (p/promise? (get-in service [:status :ready])))
          (reset! *service [graph service])
          service)))))

(defn init
  "web worker entry"
  []
  (let [proxy-object (->>
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
                                (let [[graph opts] (ldb/read-transit-str (last args))]
                                  (p/let [service (<init-service! graph opts)
                                          client-id (:client-id service)]
                                    (when client-id
                                      (worker-util/post-message :record-worker-client-id {:client-id client-id}))
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
                      bean/->js)]
    (glogi-console/install!)
    (log/set-levels {:glogi/root :info})
    (log/add-handler worker-state/log-append!)
    (check-worker-scope!)
    (outliner-register-op-handlers!)
    (<ratelimit-file-writes!)
    (js/setInterval #(.postMessage js/self "keepAliveResponse") (* 1000 25))
    (Comlink/expose proxy-object)
    (let [^js wrapped-main-thread* (Comlink/wrap js/self)
          wrapped-main-thread (fn [qkw direct-pass? & args]
                                (p/let [result (.remoteInvoke wrapped-main-thread*
                                                              (str (namespace qkw) "/" (name qkw))
                                                              direct-pass?
                                                              (if direct-pass?
                                                                (into-array args)
                                                                (ldb/write-transit-str args)))]
                                  (if direct-pass?
                                    result
                                    (ldb/read-transit-str result))))]
      (reset! worker-state/*main-thread wrapped-main-thread))))

(comment
  (defn <remove-all-files!
    "!! Dangerous: use it only for development."
    []
    (p/let [all-files (<list-all-files)
            files (filter #(= (.-kind %) "file") all-files)
            dirs (filter #(= (.-kind %) "directory") all-files)
            _ (p/all (map (fn [file] (.remove file)) files))]
      (p/all (map (fn [dir] (.remove dir)) dirs)))))
