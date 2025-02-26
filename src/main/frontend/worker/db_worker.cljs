(ns frontend.worker.db-worker
  "Worker used for browser DB implementation"
  (:require ["@logseq/sqlite-wasm" :default sqlite3InitModule]
            ["comlink" :as Comlink]
            [cljs-bean.core :as bean]
            [clojure.edn :as edn]
            [clojure.set]
            [clojure.string :as string]
            [datascript.core :as d]
            [datascript.storage :refer [IStorage] :as storage]
            [frontend.common.file.core :as common-file]
            [frontend.worker.crypt :as worker-crypt]
            [frontend.worker.db-listener :as db-listener]
            [frontend.worker.db-metadata :as worker-db-metadata]
            [frontend.worker.db.migrate :as db-migrate]
            [frontend.worker.db.validate :as worker-db-validate]
            [frontend.worker.device :as worker-device]
            [frontend.worker.export :as worker-export]
            [frontend.worker.file :as file]
            [frontend.worker.handler.page :as worker-page]
            [frontend.worker.handler.page.file-based.rename :as file-worker-page-rename]
            [frontend.worker.rtc.asset-db-listener]
            [frontend.worker.rtc.client-op :as client-op]
            [frontend.worker.rtc.core :as rtc-core]
            [frontend.worker.rtc.db-listener]
            [frontend.worker.search :as search]
            [frontend.worker.state :as worker-state] ;; [frontend.worker.undo-redo :as undo-redo]
            [frontend.worker.undo-redo2 :as undo-redo]
            [frontend.worker.util :as worker-util]
            [goog.object :as gobj]
            [lambdaisland.glogi.console :as glogi-console]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.common.order :as db-order]
            [logseq.db.common.sqlite :as sqlite-common-db]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.sqlite.export :as sqlite-export]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.outliner.op :as outliner-op]
            [me.tonsky.persistent-sorted-set :as set :refer [BTSet]]
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
  [datascript-conn sqlite-db import-type]
  (let [datoms (get-all-datoms-from-sqlite-db sqlite-db)
        db (d/init-db [] db-schema/schema
                      {:storage (storage/storage @datascript-conn)})
        db (d/db-with db
                      (map (fn [d]
                             [:db/add (:e d) (:a d) (:v d) (:t d)]) datoms))]
    (prn :debug :rebuild-db-from-datoms :datoms-count (count datoms))
    ;; export db first
    (when-not import-type
      (worker-util/post-message :notification ["The SQLite db will be exported to avoid any data-loss." :warning false])
      (worker-util/post-message :export-current-db []))
    (.exec sqlite-db #js {:sql "delete from kvs"})
    (d/reset-conn! datascript-conn db)
    (db-migrate/fix-db! datascript-conn)))

(comment
  (defn- gc-kvs-table!
    [^Object db]
    (let [schema (some->> (.exec db #js {:sql "select content from kvs where addr = 0"
                                         :rowMode "array"})
                          bean/->clj
                          ffirst
                          sqlite-util/transit-read)
          result (->> (.exec db #js {:sql "select addr, addresses from kvs"
                                     :rowMode "array"})
                      bean/->clj
                      (map (fn [[addr addresses]]
                             [addr (bean/->clj (js/JSON.parse addresses))])))
          used-addresses (set (concat (mapcat second result)
                                      [0 1 (:eavt schema) (:avet schema) (:aevt schema)]))
          unused-addresses (clojure.set/difference (set (map first result)) used-addresses)]
      (when unused-addresses
        (prn :debug :db-gc :unused-addresses unused-addresses)
        (.transaction db (fn [tx]
                           (doseq [addr unused-addresses]
                             (.exec tx #js {:sql "Delete from kvs where addr = ?"
                                            :bind #js [addr]}))))))))

(defn- find-missing-addresses
  [^Object db]
  (let [schema (some->> (.exec db #js {:sql "select content from kvs where addr = 0"
                                       :rowMode "array"})
                        bean/->clj
                        ffirst
                        sqlite-util/transit-read)
        result (->> (.exec db #js {:sql "select addr, addresses from kvs"
                                   :rowMode "array"})
                    bean/->clj
                    (map (fn [[addr addresses]]
                           [addr (bean/->clj (js/JSON.parse addresses))])))
        used-addresses (set (concat (mapcat second result)
                                    [0 1 (:eavt schema) (:avet schema) (:aevt schema)]))
        missing-addresses (clojure.set/difference used-addresses (set (map first result)))]
    (when (seq missing-addresses)
      (worker-util/post-message :capture-error
                                {:error "db-missing-addresses"
                                 :payload {:missing-addresses missing-addresses}})
      (prn :error :missing-addresses missing-addresses))))

(defn upsert-addr-content!
  "Upsert addr+data-seq. Update sqlite-cli/upsert-addr-content! when making changes"
  [repo data delete-addrs & {:keys [client-ops-db?] :or {client-ops-db? false}}]
  (let [^Object db (worker-state/get-sqlite-conn repo (if client-ops-db? :client-ops :db))]
    (assert (some? db) "sqlite db not exists")
    (.transaction db (fn [tx]
                       (doseq [item data]
                         (.exec tx #js {:sql "INSERT INTO kvs (addr, content, addresses) values ($addr, $content, $addresses) on conflict(addr) do update set content = $content, addresses = $addresses"
                                        :bind item}))))
    (when (seq delete-addrs)
      (.transaction db (fn [tx]
                         ;; (prn :debug :delete-addrs delete-addrs)
                         (doseq [addr delete-addrs]
                           (.exec tx #js {:sql "Delete from kvs WHERE addr = ? AND NOT EXISTS (SELECT 1 FROM json_each(addresses) WHERE value = ?);"
                                          :bind #js [addr]})))))))

(defn restore-data-from-addr
  "Update sqlite-cli/restore-data-from-addr when making changes"
  [repo addr & {:keys [client-ops-db?] :or {client-ops-db? false}}]
  (let [^Object db (worker-state/get-sqlite-conn repo (if client-ops-db? :client-ops :db))]
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
          data)))))

(defn new-sqlite-storage
  "Update sqlite-cli/new-sqlite-storage when making changes"
  [repo _opts]
  (reify IStorage
    (-store [_ addr+data-seq delete-addrs]
      (let [used-addrs (set (mapcat
                             (fn [[addr data]]
                               (cons addr
                                     (when (map? data)
                                       (:addresses data))))
                             addr+data-seq))
            delete-addrs (remove used-addrs delete-addrs)
            data (map
                  (fn [[addr data]]
                    (let [data' (if (map? data) (dissoc data :addresses) data)
                          addresses (when (map? data)
                                      (when-let [addresses (:addresses data)]
                                        (js/JSON.stringify (bean/->js addresses))))]
                      #js {:$addr addr
                           :$content (sqlite-util/transit-write data')
                           :$addresses addresses}))
                  addr+data-seq)]
        (upsert-addr-content! repo data delete-addrs)))

    (-restore [_ addr]
      (restore-data-from-addr repo addr))))

(defn new-sqlite-client-ops-storage
  [repo]
  (reify IStorage
    (-store [_ addr+data-seq delete-addrs]
      (let [used-addrs (set (mapcat
                             (fn [[addr data]]
                               (cons addr
                                     (when (map? data)
                                       (:addresses data))))
                             addr+data-seq))
            delete-addrs (remove used-addrs delete-addrs)
            data (map
                  (fn [[addr data]]
                    (let [data' (if (map? data) (dissoc data :addresses) data)
                          addresses (when (map? data)
                                      (when-let [addresses (:addresses data)]
                                        (js/JSON.stringify (bean/->js addresses))))]
                      #js {:$addr addr
                           :$content (sqlite-util/transit-write data')
                           :$addresses addresses}))
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
      (d/reset-schema! conn (:schema new-db))
      nil)))

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
                (.acquireAccessHandles pool))
            db (new (.-OpfsSAHPoolDb pool) repo-path)
            search-db (new (.-OpfsSAHPoolDb pool) (str "search" repo-path))
            client-ops-db (new (.-OpfsSAHPoolDb pool) (str "client-ops-" repo-path))]
      [db search-db client-ops-db])))

(defn- enable-sqlite-wal-mode!
  [^Object db]
  (.exec db "PRAGMA locking_mode=exclusive")
  (.exec db "PRAGMA journal_mode=WAL"))

(defn- create-or-open-db!
  [repo {:keys [config import-type datoms]}]
  (when-not (worker-state/get-sqlite-conn repo)
    (p/let [[db search-db client-ops-db :as dbs] (get-dbs repo)
            storage (new-sqlite-storage repo {})
            client-ops-storage (when-not @*publishing? (new-sqlite-client-ops-storage repo))
            db-based? (sqlite-util/db-based-graph? repo)]
      (swap! *sqlite-conns assoc repo {:db db
                                       :search search-db
                                       :client-ops client-ops-db})
      (doseq [db' dbs]
        (enable-sqlite-wal-mode! db'))
      (sqlite-common-db/create-kvs-table! db)
      (when-not @*publishing? (sqlite-common-db/create-kvs-table! client-ops-db))
      (db-migrate/migrate-sqlite-db db)
      (when-not @*publishing? (db-migrate/migrate-sqlite-db client-ops-db))
      (search/create-tables-and-triggers! search-db)
      (let [schema (sqlite-util/get-schema repo)
            conn (sqlite-common-db/get-storage-conn storage schema)
            _ (when datoms
                (let [data (map (fn [datom]
                                  [:db/add (:e datom) (:a datom) (:v datom)]) datoms)]
                  (d/transact! conn data {:initial-db? true})))
            client-ops-conn (when-not @*publishing? (sqlite-common-db/get-storage-conn
                                                     client-ops-storage
                                                     client-op/schema-in-db))
            initial-data-exists? (when (nil? datoms)
                                   (and (d/entity @conn :logseq.class/Root)
                                        (= "db" (:kv/value (d/entity @conn :logseq.kv/db-type)))))]
        (swap! *datascript-conns assoc repo conn)
        (swap! *client-ops-conns assoc repo client-ops-conn)
        (when (not= client-op/schema-in-db (d/schema client-ops-conn))
          (d/reset-schema! client-ops-conn client-op/schema-in-db))
        (when (and db-based? (not initial-data-exists?) (not datoms))
          (let [config (or config "")
                initial-data (sqlite-create-graph/build-db-initial-data config
                                                                        (when import-type {:import-type import-type}))]
            (d/transact! conn initial-data {:initial-db? true})))

        (when-not db-based?
          (try
            (when-not (ldb/page-exists? @conn common-config/views-page-name #{:logseq.class/Page})
              (ldb/transact! conn (sqlite-create-graph/build-initial-views)))
            (catch :default _e)))

        (find-missing-addresses db)
        ;; (gc-kvs-table! db)

        (try
          (db-migrate/migrate conn search-db)
          (catch :default _e
            (when db-based?
              (rebuild-db-from-datoms! conn db import-type)
              (db-migrate/migrate conn search-db))))

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
  (let [dir? #(= (.-kind %) "directory")]
    (p/let [^js root (.getDirectory js/navigator.storage)
            values-iter (when (dir? root) (.values root))
            values (when values-iter (iter->vec values-iter))
            current-dir-dirs (filter dir? values)
            db-dirs (filter (fn [file]
                              (string/starts-with? (.-name file) ".logseq-pool-"))
                            current-dir-dirs)]
      (prn :debug
           :db-dirs (map #(.-name %) db-dirs)
           :all-dirs (map #(.-name %) current-dir-dirs))
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
  [task]
  (p/chain
   (js/Promise. task)
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
     (ldb/write-transit-str dbs)))

  (createOrOpenDB
   [_this repo opts-str]
   (let [{:keys [close-other-db?] :or {close-other-db? true} :as opts} (ldb/read-transit-str opts-str)]
     (p/do!
      (when close-other-db?
        (close-other-dbs! repo))
      (create-or-open-db! repo (dissoc opts :close-other-db?)))))

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

  (resetDB
   [_this repo db-transit]
   (reset-db! repo db-transit))

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
   (when-let [^js db (worker-state/get-sqlite-conn repo :db)]
     (.exec db "PRAGMA wal_checkpoint(2)"))
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
        (let [ops (ldb/read-transit-str ops-str)
              opts (ldb/read-transit-str opts-str)
              result (outliner-op/apply-ops! repo conn ops (worker-state/get-date-formatter repo) opts)]
          (ldb/write-transit-str result)))
       (catch :default e
         (let [data (ex-data e)
               {:keys [type payload]} (when (map? data) data)]
           (case type
             :notification
             (worker-util/post-message type [(:message payload) (:type payload)])
             (throw e)))))))

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

  (get-debug-datoms
   [this repo]
   (when-let [db (worker-state/get-sqlite-conn repo)]
     (let [conn (worker-state/get-datascript-conn repo)]
       (ldb/write-transit-str (worker-export/get-debug-datoms conn db)))))

  (get-all-pages
   [this repo]
   (when-let [conn (worker-state/get-datascript-conn repo)]
     (ldb/write-transit-str (worker-export/get-all-pages repo @conn))))

  (get-all-page->content
   [this repo]
   (when-let [conn (worker-state/get-datascript-conn repo)]
     (ldb/write-transit-str (worker-export/get-all-page->content repo @conn))))

  ;; RTC
  (rtc-start
   [this repo token]
   (with-write-transit-str
     (rtc-core/new-task--rtc-start repo token)))

  (rtc-stop
   [this]
   (rtc-core/rtc-stop))

  (rtc-toggle-auto-push
   [this]
   (rtc-core/rtc-toggle-auto-push))

  (rtc-toggle-remote-profile
   [this]
   (rtc-core/rtc-toggle-remote-profile))

  (rtc-grant-graph-access
   [this token graph-uuid target-user-uuids-str target-user-emails-str]
   (let [target-user-uuids (ldb/read-transit-str target-user-uuids-str)
         target-user-emails (ldb/read-transit-str target-user-emails-str)]
     (with-write-transit-str
       (rtc-core/new-task--grant-access-to-others token graph-uuid
                                                  :target-user-uuids target-user-uuids
                                                  :target-user-emails target-user-emails))))

  (rtc-get-graphs
   [this token]
   (with-write-transit-str
     (rtc-core/new-task--get-graphs token)))

  (rtc-delete-graph
   [this token graph-uuid schema-version]
   (with-write-transit-str
     (rtc-core/new-task--delete-graph token graph-uuid schema-version)))

  (rtc-get-users-info
   [this token graph-uuid]
   (with-write-transit-str
     (rtc-core/new-task--get-users-info token graph-uuid)))

  (rtc-get-block-content-versions
   [this token graph-uuid block-uuid]
   (with-write-transit-str
     (rtc-core/new-task--get-block-content-versions token graph-uuid block-uuid)))

  (rtc-get-debug-state
   [this]
   (with-write-transit-str
     (rtc-core/new-task--get-debug-state)))

  (rtc-async-upload-graph
   [this repo token remote-graph-name]
   (with-write-transit-str
     (rtc-core/new-task--upload-graph token repo remote-graph-name)))

  (rtc-async-branch-graph
   [this repo token]
   (with-write-transit-str
     (rtc-core/new-task--branch-graph token repo)))

  (rtc-request-download-graph
   [this token graph-uuid schema-version]
   (with-write-transit-str
     (rtc-core/new-task--request-download-graph token graph-uuid schema-version)))

  (rtc-wait-download-graph-info-ready
   [this token download-info-uuid graph-uuid schema-version timeout-ms]
   (with-write-transit-str
     (rtc-core/new-task--wait-download-info-ready token download-info-uuid graph-uuid schema-version timeout-ms)))

  (rtc-download-graph-from-s3
   [this graph-uuid graph-name s3-url]
   (with-write-transit-str
     (rtc-core/new-task--download-graph-from-s3 graph-uuid graph-name s3-url)))

  (rtc-download-info-list
   [this token graph-uuid schema-version]
   (with-write-transit-str
     (rtc-core/new-task--download-info-list token graph-uuid schema-version)))

  (rtc-get-graph-keys
   [this repo]
   (with-write-transit-str
     (worker-crypt/get-graph-keys-jwk repo)))

  (rtc-sync-current-graph-encrypted-aes-key
   [this token device-uuids-transit-str]
   (with-write-transit-str
     (worker-device/new-task--sync-current-graph-encrypted-aes-key
      token device-uuids-transit-str)))

  (device-list-devices
   [this token]
   (with-write-transit-str
     (worker-device/new-task--list-devices token)))

  (device-remove-device-public-key
   [this token device-uuid key-name]
   (with-write-transit-str
     (worker-device/new-task--remove-device-public-key token device-uuid key-name)))

  (device-remove-device
   [this token device-uuid]
   (with-write-transit-str
     (worker-device/new-task--remove-device token device-uuid)))

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

  (validate-db
   [_this repo]
   (when-let [conn (worker-state/get-datascript-conn repo)]
     (let [result (worker-db-validate/validate-db @conn)]
       (db-migrate/fix-db! conn {:invalid-entity-ids (:invalid-entity-ids result)})
       result)))

  (export-edn
   [_this repo options]
   (let [conn (worker-state/get-datascript-conn repo)]
     (try
       (->> (ldb/read-transit-str options)
            (sqlite-export/build-export @conn)
            ldb/write-transit-str)
       (catch :default e
         (js/console.error "export-edn error: " e)
         (worker-util/post-message :notification
                                   ["An unexpected error occurred during export. See the javascript console for details."
                                    :error])))))

  (dangerousRemoveAllDbs
   [this repo]
   (p/let [r (.listDB this)
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

(defn init
  "web worker entry"
  []
  (glogi-console/install!)
  (check-worker-scope!)
  (let [^js obj (DBWorker.)]
    (outliner-register-op-handlers!)
    (worker-state/set-worker-object! obj)
    (<ratelimit-file-writes!)
    (js/setInterval #(.postMessage js/self "keepAliveResponse") (* 1000 25))
    (Comlink/expose obj)
    (reset! worker-state/*main-thread (Comlink/wrap js/self))))

(comment
  (defn <remove-all-files!
    "!! Dangerous: use it only for development."
    []
    (p/let [all-files (<list-all-files)
            files (filter #(= (.-kind %) "file") all-files)
            dirs (filter #(= (.-kind %) "directory") all-files)
            _ (p/all (map (fn [file] (.remove file)) files))]
      (p/all (map (fn [dir] (.remove dir)) dirs)))))
