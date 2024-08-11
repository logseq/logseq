(ns frontend.worker.db-worker
  "Worker used for browser DB implementation"
  (:require ["@logseq/sqlite-wasm" :default sqlite3InitModule]
            ["comlink" :as Comlink]
            [cljs-bean.core :as bean]
            [cljs.core.async :as async]
            [clojure.edn :as edn]
            [clojure.string :as string]
            [datascript.core :as d]
            [datascript.storage :refer [IStorage]]
            [frontend.common.file.core :as common-file]
            [frontend.worker.db-listener :as db-listener]
            [frontend.worker.db-metadata :as worker-db-metadata]
            [frontend.worker.db.migrate :as db-migrate]
            [frontend.worker.export :as worker-export]
            [frontend.worker.file :as file]
            [frontend.worker.handler.page :as worker-page]
            [frontend.worker.handler.page.db-based.rename :as db-worker-page-rename]
            [frontend.worker.handler.page.file-based.rename :as file-worker-page-rename]
            [frontend.worker.rtc.asset-db-listener]
            [frontend.worker.rtc.client-op :as client-op]
            [frontend.worker.rtc.core :as rtc-core]
            [frontend.worker.rtc.db-listener]
            [frontend.worker.search :as search]
            [frontend.worker.state :as worker-state] ;; [frontend.worker.undo-redo :as undo-redo]
            [frontend.worker.undo-redo2 :as undo-redo]
            [frontend.worker.util :as worker-util]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.order :as db-order]
            [logseq.db.sqlite.common-db :as sqlite-common-db]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.outliner.op :as outliner-op]
            [goog.object :as gobj]
            [promesa.core :as p]
            [shadow.cljs.modern :refer [defclass]]))

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
        (p/let [^js pool (.installOpfsSAHPoolVfs @*sqlite #js {:name (worker-util/get-pool-name graph)
                                                               :initialCapacity 20})]
          (swap! *opfs-pools assoc graph pool)
          pool))))

(defn- init-sqlite-module!
  []
  (when-not @*sqlite
    (p/let [href (.. js/location -href)
            electron? (string/includes? href "electron=true")
            publishing? (string/includes? href "publishing=true")

            _ (reset! *publishing? publishing?)
            base-url (str js/self.location.protocol "//" js/self.location.host)
            sqlite-wasm-url (if electron?
                              (js/URL. "sqlite3.wasm" (.. js/location -href))
                              (str base-url (string/replace js/self.location.pathname "db-worker.js" "")))
            sqlite (sqlite3InitModule (clj->js {:url sqlite-wasm-url
                                                :print js/console.log
                                                :printErr js/console.error}))]
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

(defn upsert-addr-content!
  "Upsert addr+data-seq"
  [repo data delete-addrs & {:keys [client-ops-db?] :or {client-ops-db? false}}]
  (let [^Object db (worker-state/get-sqlite-conn repo (if client-ops-db? :client-ops :db))]
    (assert (some? db) "sqlite db not exists")
    (.transaction db (fn [tx]
                       (doseq [item data]
                         (.exec tx #js {:sql "INSERT INTO kvs (addr, content) values ($addr, $content) on conflict(addr) do update set content = $content"
                                        :bind item}))

                       (doseq [addr delete-addrs]
                         (.exec db #js {:sql "Delete from kvs where addr = ?"
                                        :bind #js [addr]}))))))

(defn restore-data-from-addr
  [repo addr & {:keys [client-ops-db?] :or {client-ops-db? false}}]
  (let [^Object db (worker-state/get-sqlite-conn repo (if client-ops-db? :client-ops :db))]
    (assert (some? db) "sqlite db not exists")
    (when-let [content (-> (.exec db #js {:sql "select content from kvs where addr = ?"
                                          :bind #js [addr]
                                          :rowMode "array"})
                           ffirst)]
      (try
        (let [data (sqlite-util/transit-read content)]
          (if-let [addresses (:addresses data)]
            (assoc data :addresses (bean/->js addresses))
            data))
        (catch :default _e              ; TODO: remove this once db goes to test
          (edn/read-string content))))))

(defn new-sqlite-storage
  [repo _opts]
  (reify IStorage
    (-store [_ addr+data-seq delete-addrs]
      (let [data (map
                  (fn [[addr data]]
                    #js {:$addr addr
                         :$content (sqlite-util/transit-write data)})
                  addr+data-seq)]
        (if (worker-state/rtc-downloading-graph?)
          (upsert-addr-content! repo data delete-addrs) ; sync writes when downloading whole graph
          (async/go (upsert-addr-content! repo data delete-addrs)))))

    (-restore [_ addr]
      (restore-data-from-addr repo addr))))

(defn new-sqlite-client-ops-storage
  [repo]
  (reify IStorage
    (-store [_ addr+data-seq delete-addrs]
      (let [data (map
                  (fn [[addr data]]
                    #js {:$addr addr
                         :$content (sqlite-util/transit-write data)})
                  addr+data-seq)]
        (upsert-addr-content! repo data delete-addrs :client-ops-db? true)))

    (-restore [_ addr]
      (restore-data-from-addr repo addr :client-ops-db? true))))

(defn- close-db-aux!
  [repo ^Object db ^Object search ^Object client-ops]
  (swap! *sqlite-conns dissoc repo)
  (swap! *datascript-conns dissoc repo)
  (swap! *client-ops-conns dissoc repo)
  (when db (.close db))
  (when search (.close search))
  (when client-ops (.close client-ops))
  (when-let [^js pool (worker-state/get-opfs-pool repo)]
    (.releaseAccessHandles pool))
  (swap! *opfs-pools dissoc repo))

(defn- close-other-dbs!
  [repo]
  (doseq [[r {:keys [db search client-ops]}] @*sqlite-conns]
    (when-not (= repo r)
      (close-db-aux! r db search client-ops))))

(defn close-db!
  [repo]
  (let [{:keys [db search client-ops]} (@*sqlite-conns repo)]
    (close-db-aux! repo db search client-ops)))

(defn- get-dbs
  [repo]
  (if @*publishing?
    (p/let [^object DB (.-DB ^object (.-oo1 ^object @*sqlite))
            db (new DB "/db.sqlite" "c")
            search-db (new DB "/search-db.sqlite" "c")]
      [db search-db nil])
    (p/let [^js pool (<get-opfs-pool repo)
            capacity (.getCapacity pool)
            _ (when (zero? capacity)   ; file handle already releases since pool will be initialized only once
                (.acquireAccessHandles pool))
            db (new (.-OpfsSAHPoolDb pool) repo-path)
            search-db (new (.-OpfsSAHPoolDb pool) (str "search" repo-path))
            client-ops-db (new (.-OpfsSAHPoolDb pool) (str "client-ops-" repo-path))]
      [db search-db client-ops-db])))

(defn- create-or-open-db!
  [repo {:keys [config]}]
  (when-not (worker-state/get-sqlite-conn repo)
    (p/let [[db search-db client-ops-db] (get-dbs repo)
            storage (new-sqlite-storage repo {})
            client-ops-storage (new-sqlite-client-ops-storage repo)]
      (swap! *sqlite-conns assoc repo {:db db
                                       :search search-db
                                       :client-ops client-ops-db})
      (.exec db "PRAGMA locking_mode=exclusive")
      (sqlite-common-db/create-kvs-table! db)
      (sqlite-common-db/create-kvs-table! client-ops-db)
      (search/create-tables-and-triggers! search-db)
      (let [schema (sqlite-util/get-schema repo)
            conn (sqlite-common-db/get-storage-conn storage schema)
            client-ops-conn (sqlite-common-db/get-storage-conn client-ops-storage client-op/schema-in-db)
            initial-data-exists? (d/entity @conn :logseq.class/Root)]
        (swap! *datascript-conns assoc repo conn)
        (swap! *client-ops-conns assoc repo client-ops-conn)
        (when (and (sqlite-util/db-based-graph? repo) (not initial-data-exists?))
          (let [config (or config {})
                initial-data (sqlite-create-graph/build-db-initial-data config)]
            (d/transact! conn initial-data {:initial-db? true})))

        (when-not (ldb/page-exists? @conn common-config/views-page-name "hidden")
          (ldb/create-views-page! conn))

        (db-migrate/migrate conn search-db)

        (db-listener/listen-db-changes! repo conn)))))

(defn- iter->vec [iter]
  (when iter
    (p/loop [acc []]
      (p/let [elem (.next iter)]
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
  (let [dir? #(= (.-kind %) "directory")]
    (p/let [^js root (.getDirectory js/navigator.storage)
            values-iter (when (dir? root) (.values root))
            values (when values-iter (iter->vec values-iter))
            current-dir-dirs (filter dir? values)
            db-dirs (filter (fn [file]
                              (string/starts-with? (.-name file) ".logseq-pool-"))
                            current-dir-dirs)]
      (p/all (map (fn [dir]
                    (p/let [graph-name (-> (.-name dir)
                                           (string/replace-first ".logseq-pool-" "")
                                         ;; TODO: DRY
                                           (string/replace "+3A+" ":")
                                           (string/replace "++" "/"))
                            metadata-file-handle (.getFileHandle dir "metadata.edn" #js {:create true})
                            metadata-file (.getFile metadata-file-handle)
                            metadata (.text metadata-file)]
                      {:name graph-name
                       :metadata (edn/read-string metadata)})) db-dirs)))))

(defn- <db-exists?
  [graph]
  (->
   (p/let [^js root (.getDirectory js/navigator.storage)
           _dir-handle (.getDirectoryHandle root (str "." (worker-util/get-pool-name graph)))]
     true)
   (p/catch
    (fn [_e]                           ; not found
      false))))

(defn- remove-vfs!
  [^js pool]
  (when pool
    (.removeVfs ^js pool)))

(defn- get-search-db
  [repo]
  (worker-state/get-sqlite-conn repo :search))

(defn- with-write-transit-str
  [p]
  (p/chain p
           (fn [result]
             (let [result (when-not (= result @worker-state/*state) result)]
               (ldb/write-transit-str result)))))

#_:clj-kondo/ignore
(defclass DBWorker
  (extends js/Object)

  (constructor
   [this]
   (super))

  Object

  (getVersion
   [_this]
   (when-let [sqlite @*sqlite]
     (.-version sqlite)))

  (init
   [_this rtc-ws-url]
   (reset! worker-state/*rtc-ws-url rtc-ws-url)
   (init-sqlite-module!))

  (storeMetadata
   [_this repo metadata-str]
   (worker-db-metadata/<store repo metadata-str))

  (listDB
   [_this]
   (p/let [dbs (<list-all-dbs)]
     (bean/->js dbs)))

  (createOrOpenDB
   [_this repo opts-str]
   (let [{:keys [close-other-db? config]
          :or {close-other-db? true}} (ldb/read-transit-str opts-str)]
     (p/do!
      (when close-other-db?
        (close-other-dbs! repo))
      (create-or-open-db! repo {:config config}))))

  (getMaxTx
   [_this repo]
   (when-let [conn (worker-state/get-datascript-conn repo)]
     (:max-tx @conn)))

  (q [_this repo inputs-str]
     "Datascript q"
     (when-let [conn (worker-state/get-datascript-conn repo)]
       (let [inputs (ldb/read-transit-str inputs-str)
             result (apply d/q (first inputs) @conn (rest inputs))]
         (ldb/write-transit-str result))))

  (pull
   [_this repo selector-str id-str]
   (when-let [conn (worker-state/get-datascript-conn repo)]
     (let [selector (ldb/read-transit-str selector-str)
           id (ldb/read-transit-str id-str)
           eid (if (and (vector? id) (= :block/name (first id)))
                 (:db/id (ldb/get-page @conn (second id)))
                 id)
           result (some->> eid
                           (d/pull @conn selector)
                           (sqlite-common-db/with-parent @conn))]
       (ldb/write-transit-str result))))

  (pull-many
   [_this repo selector-str ids-str]
   (when-let [conn (worker-state/get-datascript-conn repo)]
     (let [selector (ldb/read-transit-str selector-str)
           ids (ldb/read-transit-str ids-str)
           result (d/pull-many @conn selector ids)]
       (ldb/write-transit-str result))))

  (get-right-sibling
   [_this repo db-id]
   (when-let [conn (worker-state/get-datascript-conn repo)]
     (let [result (ldb/get-right-sibling (d/entity @conn db-id))]
       (ldb/write-transit-str result))))

  (get-block-and-children
   [_this repo id opts]
   (when-let [conn (worker-state/get-datascript-conn repo)]
     (let [id (if (and (string? id) (common-util/uuid-string? id)) (uuid id) id)]
       (ldb/write-transit-str (sqlite-common-db/get-block-and-children @conn id (ldb/read-transit-str opts))))))

  (get-block-refs
   [_this repo id]
   (when-let [conn (worker-state/get-datascript-conn repo)]
     (ldb/write-transit-str (ldb/get-block-refs @conn id))))

  (get-block-refs-count
   [_this repo id]
   (when-let [conn (worker-state/get-datascript-conn repo)]
     (ldb/get-block-refs-count @conn id)))

  (get-block-parents
   [_this repo id depth]
   (when-let [conn (worker-state/get-datascript-conn repo)]
     (let [block-id (:block/uuid (d/entity @conn id))
           parents (->> (ldb/get-block-parents @conn block-id {:depth (or depth 3)})
                        (map (fn [b] (d/pull @conn '[*] (:db/id b)))))]
       (ldb/write-transit-str parents))))

  (get-page-unlinked-refs
   [_this repo page-id search-result-eids-str]
   (when-let [conn (worker-state/get-datascript-conn repo)]
     (let [search-result-eids (ldb/read-transit-str search-result-eids-str)]
       (ldb/write-transit-str (ldb/get-page-unlinked-refs @conn page-id search-result-eids)))))

  (set-context
   [_this context]
   (let [context (if (string? context)
                   (ldb/read-transit-str context)
                   context)]
     (when context (worker-state/update-context! context))
     nil))

  (transact
   [_this repo tx-data tx-meta context]
   (when repo (worker-state/set-db-latest-tx-time! repo))
   (when-let [conn (worker-state/get-datascript-conn repo)]
     (try
       (let [tx-data' (if (string? tx-data)
                        (ldb/read-transit-str tx-data)
                        tx-data)
             tx-meta (if (string? tx-meta)
                       (ldb/read-transit-str tx-meta)
                       tx-meta)
             tx-data' (if (contains? #{:insert-blocks} (:outliner-op tx-meta))
                        (map (fn [m]
                               (if (and (map? m) (nil? (:block/order m)))
                                 (assoc m :block/order (db-order/gen-key nil))
                                 m)) tx-data')
                        tx-data')
             context (if (string? context)
                       (ldb/read-transit-str context)
                       context)
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
         (prn :debug :error)
         (let [tx-data (if (string? tx-data)
                         (ldb/read-transit-str tx-data)
                         tx-data)]
           (js/console.error e)
           (prn :debug :tx-data @conn tx-data))))))

  (getInitialData
   [_this repo]
   (when-let [conn (worker-state/get-datascript-conn repo)]
     (ldb/write-transit-str (sqlite-common-db/get-initial-data @conn))))

  (get-page-refs-count
   [_this repo]
   (when-let [conn (worker-state/get-datascript-conn repo)]
     (ldb/write-transit-str (sqlite-common-db/get-page->refs-count @conn))))

  (fetch-all-pages
   [_this repo exclude-page-ids-str]
   ;; (when-let [conn (worker-state/get-datascript-conn repo)]
   ;;   (async/go
   ;;     (let [all-pages (sqlite-common-db/get-all-pages @conn (ldb/read-transit-str exclude-page-ids-str))
   ;;           partitioned-data (map-indexed (fn [idx p] [idx p]) (partition-all 2000 all-pages))]
   ;;       (doseq [[idx tx-data] partitioned-data]
   ;;         (worker-util/post-message :sync-db-changes {:repo repo
   ;;                                                     :tx-data tx-data
   ;;                                                     :tx-meta {:initial-pages? true
   ;;                                                               :end? (= idx (dec (count partitioned-data)))}})
   ;;         (async/<! (async/timeout 100)))))
   ;;   nil)
   )

  (closeDB
   [_this repo]
   (close-db! repo))

  (unsafeUnlinkDB
   [_this repo]
   (p/let [pool (<get-opfs-pool repo)
           _ (close-db! repo)
           result (remove-vfs! pool)]
     nil))

  (releaseAccessHandles
   [_this repo]
   (when-let [^js pool (worker-state/get-opfs-pool repo)]
     (.releaseAccessHandles pool)))

  (dbExists
   [_this repo]
   (<db-exists? repo))

  (exportDB
   [_this repo]
   (<export-db-file repo))

  (importDb
   [this repo data]
   (when-not (string/blank? repo)
     (p/let [pool (<get-opfs-pool repo)]
       (<import-db pool data))))

  ;; Search
  (search-blocks
   [this repo q option]
   (p/let [search-db (get-search-db repo)
           conn (worker-state/get-datascript-conn repo)
           result (search/search-blocks repo conn search-db q (bean/->clj option))]
     (ldb/write-transit-str result)))

  (search-upsert-blocks
   [this repo blocks]
   (p/let [db (get-search-db repo)]
     (search/upsert-blocks! db blocks)
     nil))

  (search-delete-blocks
   [this repo ids]
   (p/let [db (get-search-db repo)]
     (search/delete-blocks! db ids)
     nil))

  (search-truncate-tables
   [this repo]
   (p/let [db (get-search-db repo)]
     (search/truncate-table! db)
     nil))

  (search-build-blocks-indice
   [this repo]
   (when-let [conn (worker-state/get-datascript-conn repo)]
     (search/build-blocks-indice repo @conn)))

  (search-build-pages-indice
   [this repo]
   nil)

  (apply-outliner-ops
   [this repo ops-str opts-str]
   (when-let [conn (worker-state/get-datascript-conn repo)]
     (try
       (worker-util/profile
        "apply outliner ops"
        (let [ops (edn/read-string ops-str)
              opts (edn/read-string opts-str)
              result (outliner-op/apply-ops! repo conn ops (worker-state/get-date-formatter repo) opts)]
          (ldb/write-transit-str result)))
       (catch :default e
         (let [data (ex-data e)
               {:keys [type payload]} (when (map? data) data)]
           (case type
             :notification
             (worker-util/post-message type [[:div [:p (:message payload)]] (:type payload)])
             nil))
         (throw e)))))

  (file-writes-finished?
   [this repo]
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

  (page-file-saved
   [this request-id page-id]
   (file/dissoc-request! request-id)
   nil)

  (sync-app-state
   [this new-state-str]
   (let [new-state (ldb/read-transit-str new-state-str)]
     (worker-state/set-new-state! new-state)
     nil))

  (sync-ui-state
   [_this repo state-str]
   (undo-redo/record-ui-state! repo state-str)
   nil)

  ;; Export
  (block->content
   [this repo block-uuid-str tree->file-opts context]
   (assert (common-util/uuid-string? block-uuid-str))
   (let [block-uuid (uuid block-uuid-str)]
     (when-let [conn (worker-state/get-datascript-conn repo)]
       (common-file/block->content repo @conn block-uuid
                                   (ldb/read-transit-str tree->file-opts)
                                   (ldb/read-transit-str context)))))

  (get-all-pages
   [this repo]
   (when-let [conn (worker-state/get-datascript-conn repo)]
     (ldb/write-transit-str (worker-export/get-all-pages repo @conn))))

  (get-all-page->content
   [this repo]
   (when-let [conn (worker-state/get-datascript-conn repo)]
     (ldb/write-transit-str (worker-export/get-all-page->content repo @conn))))

  ;; RTC
  (rtc-start2
   [this repo token]
   (with-write-transit-str
     (js/Promise. (rtc-core/new-task--rtc-start repo token))))

  (rtc-stop2
   [this]
   (rtc-core/rtc-stop))

  (rtc-toggle-auto-push
   [this]
   (rtc-core/rtc-toggle-auto-push))

  (rtc-grant-graph-access2
   [this token graph-uuid target-user-uuids-str target-user-emails-str]
   (let [target-user-uuids (ldb/read-transit-str target-user-uuids-str)
         target-user-emails (ldb/read-transit-str target-user-emails-str)]
     (with-write-transit-str
       (js/Promise.
        (rtc-core/new-task--grant-access-to-others token graph-uuid
                                                   :target-user-uuids target-user-uuids
                                                   :target-user-emails target-user-emails)))))

  (rtc-get-graphs2
   [this token]
   (with-write-transit-str
     (js/Promise. (rtc-core/new-task--get-graphs token))))

  (rtc-delete-graph2
   [this token graph-uuid]
   (with-write-transit-str
     (js/Promise. (rtc-core/new-task--delete-graph token graph-uuid))))

  (rtc-get-users-info2
   [this token graph-uuid]
   (with-write-transit-str
     (js/Promise. (rtc-core/new-task--get-user-info token graph-uuid))))

  (rtc-get-block-content-versions2
   [this token graph-uuid block-uuid]
   (with-write-transit-str
     (js/Promise. (rtc-core/new-task--get-block-content-versions token graph-uuid block-uuid))))

  (rtc-get-debug-state2
   [this]
   (with-write-transit-str
     (js/Promise. (rtc-core/new-task--get-debug-state))))

  (rtc-async-upload-graph2
   [this repo token remote-graph-name]
   (with-write-transit-str
     (js/Promise. (rtc-core/new-task--upload-graph token repo remote-graph-name))))

  ;; ================================================================
  (rtc-request-download-graph
   [this token graph-uuid]
   (with-write-transit-str
     (js/Promise. (rtc-core/new-task--request-download-graph token graph-uuid))))

  (rtc-wait-download-graph-info-ready
   [this token download-info-uuid graph-uuid timeout-ms]
   (with-write-transit-str
     (js/Promise.
      (rtc-core/new-task--wait-download-info-ready token download-info-uuid graph-uuid timeout-ms))))

  (rtc-download-graph-from-s3
   [this graph-uuid graph-name s3-url]
   (with-write-transit-str
     (js/Promise. (rtc-core/new-task--download-graph-from-s3 graph-uuid graph-name s3-url))))

  (rtc-download-info-list
   [this token graph-uuid]
   (with-write-transit-str
     (js/Promise. (rtc-core/new-task--download-info-list token graph-uuid))))

  (rtc-snapshot-graph
   [this token graph-uuid]
   (with-write-transit-str
     (js/Promise. (rtc-core/new-task--snapshot-graph token graph-uuid))))

  (rtc-snapshot-list
   [this token graph-uuid]
   (with-write-transit-str
     (js/Promise. (rtc-core/new-task--snapshot-list token graph-uuid))))

  (undo
   [_this repo _page-block-uuid-str]
   (when-let [conn (worker-state/get-datascript-conn repo)]
     (ldb/write-transit-str (undo-redo/undo repo conn))))

  (redo
   [_this repo _page-block-uuid-str]
   (when-let [conn (worker-state/get-datascript-conn repo)]
     (ldb/write-transit-str (undo-redo/redo repo conn))))

  (record-editor-info
   [_this repo _page-block-uuid-str editor-info-str]
   (undo-redo/record-editor-info! repo (ldb/read-transit-str editor-info-str))
   nil)

  (dangerousRemoveAllDbs
   [this repo]
   (p/let [dbs (.listDB this)]
     (p/all (map #(.unsafeUnlinkDB this (:name %)) dbs)))))

(defn- rename-page!
  [repo conn page-uuid new-name]
  (let [config (worker-state/get-config repo)
        f (if (sqlite-util/db-based-graph? repo)
            db-worker-page-rename/rename!
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

(defn init
  "web worker entry"
  []
  (check-worker-scope!)
  (let [^js obj (DBWorker.)]
    (outliner-register-op-handlers!)
    (worker-state/set-worker-object! obj)
    (file/<ratelimit-file-writes!)
    (js/setInterval #(.postMessage js/self "keepAliveResponse") (* 1000 25))
    (Comlink/expose obj)))

(comment
  (defn <remove-all-files!
    "!! Dangerous: use it only for development."
    []
    (p/let [all-files (<list-all-files)
            files (filter #(= (.-kind %) "file") all-files)
            dirs (filter #(= (.-kind %) "directory") all-files)
            _ (p/all (map (fn [file] (.remove file)) files))]
      (p/all (map (fn [dir] (.remove dir)) dirs)))))
