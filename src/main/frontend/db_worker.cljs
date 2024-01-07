(ns frontend.db-worker
  "Worker used for browser DB implementation"
  (:require [promesa.core :as p]
            [datascript.storage :refer [IStorage]]
            [clojure.edn :as edn]
            [datascript.core :as d]
            [logseq.db.sqlite.common-db :as sqlite-common-db]
            [shadow.cljs.modern :refer [defclass]]
            [datascript.transit :as dt]
            ["@logseq/sqlite-wasm" :default sqlite3InitModule]
            ["comlink" :as Comlink]
            [clojure.string :as string]
            [cljs-bean.core :as bean]
            [frontend.worker.search :as search]
            [logseq.db.sqlite.util :as sqlite-util]
            [frontend.worker.pipeline :as pipeline]
            [frontend.worker.state :as state]
            [frontend.worker.file :as file]
            [logseq.db :as ldb]
            [frontend.worker.rtc.op-mem-layer :as op-mem-layer]
            [frontend.worker.rtc.db-listener :as rtc-db-listener]))

(defonce *sqlite state/*sqlite)
(defonce *sqlite-conns state/*sqlite-conns)
(defonce *datascript-conns state/*datascript-conns)
(defonce *opfs-pools state/*opfs-pools)

(defn- get-pool-name
  [graph-name]
  (str "logseq-pool-" (sqlite-common-db/sanitize-db-name graph-name)))

(defn- <get-opfs-pool
  [graph]
  (or (state/get-opfs-pool graph)
      (p/let [^js pool (.installOpfsSAHPoolVfs @*sqlite #js {:name (get-pool-name graph)
                                                             :initialCapacity 20})]
        (swap! *opfs-pools assoc graph pool)
        pool)))

(defn- init-sqlite-module!
  []
  (when-not @*sqlite
    (p/let [electron? (string/includes? (.. js/location -href) "electron=true")
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
  [repo data delete-addrs]
  (let [^Object db (state/get-sqlite-conn repo)]
    (assert (some? db) "sqlite db not exists")
    (.transaction db (fn [tx]
                       (doseq [item data]
                         (.exec tx #js {:sql "INSERT INTO kvs (addr, content) values ($addr, $content) on conflict(addr) do update set content = $content"
                                        :bind item}))

                       (doseq [addr delete-addrs]
                         (.exec db #js {:sql "Delete from kvs where addr = ?"
                                        :bind #js [addr]}))))))

(defn restore-data-from-addr
  [repo addr]
  (let [^Object db (state/get-sqlite-conn repo)]
    (assert (some? db) "sqlite db not exists")
    (when-let [content (-> (.exec db #js {:sql "select content from kvs where addr = ?"
                                          :bind #js [addr]
                                          :rowMode "array"})
                           ffirst)]
      (edn/read-string content))))

(defn new-sqlite-storage
  [repo _opts]
  (reify IStorage
    (-store [_ addr+data-seq delete-addrs]
      (prn :debug (str "SQLite store addr+data count: " (count addr+data-seq)))
      (let [data (map
                  (fn [[addr data]]
                    #js {:$addr addr
                         :$content (pr-str data)})
                  addr+data-seq)]
        (upsert-addr-content! repo data delete-addrs)))

    (-restore [_ addr]
      (restore-data-from-addr repo addr))))

(defn- close-db-aux!
  [repo ^Object db ^Object search]
  (swap! *sqlite-conns dissoc repo)
  (swap! *datascript-conns dissoc repo)
  (when db (.close db))
  (when search (.close search))
  (when-let [^js pool (state/get-opfs-pool repo)]
    (.releaseAccessHandles pool))
  (swap! *opfs-pools dissoc repo))

(defn- close-other-dbs!
  [repo]
  (doseq [[r {:keys [db search]}] @*sqlite-conns]
    (when-not (= repo r)
      (close-db-aux! r db search))))

(defn- close-db!
  [repo]
  (let [{:keys [db search]} (@*sqlite-conns repo)]
    (close-db-aux! repo db search)))

(defn- listen-to-db!
  [repo conn]
  (d/unlisten! conn :gen-ops)
  (when (op-mem-layer/rtc-db-graph? repo)
      (rtc-db-listener/listen-db-to-generate-ops repo conn)))

(defn- create-or-open-db!
  [repo]
  (when-not (state/get-sqlite-conn repo)
    (p/let [^js pool (<get-opfs-pool repo)
            capacity (.getCapacity pool)
            _ (when (zero? capacity)   ; file handle already releases since pool will be initialized only once
                (.acquireAccessHandles pool))
            db (new (.-OpfsSAHPoolDb pool) repo-path)
            search-db (new (.-OpfsSAHPoolDb pool) (str "search-" repo-path))
            storage (new-sqlite-storage repo {})]
      (swap! *sqlite-conns assoc repo {:db db
                                       :search search-db})
      (.exec db "PRAGMA locking_mode=exclusive")
      (sqlite-common-db/create-kvs-table! db)
      (search/create-tables-and-triggers! search-db)
      (let [schema (sqlite-util/get-schema repo)
            conn (sqlite-common-db/get-storage-conn storage schema)]
        (swap! *datascript-conns assoc repo conn)
        (op-mem-layer/<init-load-from-indexeddb! repo)
        (listen-to-db! repo conn)
        nil))))

(defn- iter->vec [iter]
  (when iter
    (p/loop [acc []]
      (p/let [elem (.next iter)]
        (if (.-done elem)
          acc
          (p/recur (conj acc (.-value elem))))))))

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
            (p/recur result dirs)))))))

(defn- <db-exists?
  [graph]
  (->
   (p/let [^js root (.getDirectory js/navigator.storage)
           _dir-handle (.getDirectoryHandle root (str "." (get-pool-name graph)))]
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
  (state/get-sqlite-conn repo {:search? true}))


#_:clj-kondo/ignore
(defclass SQLiteDB
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
   [_this]
   (init-sqlite-module!))

  (listDB
   [_this]
   (p/let [all-files (<list-all-files)
           dbs (->>
                (keep (fn [file]
                        (when (and
                               (= (.-kind file) "directory")
                               (string/starts-with? (.-name file) ".logseq-pool-"))
                          (-> (.-name file)
                              (string/replace-first ".logseq-pool-" "")
                              ;; TODO: DRY
                              (string/replace "+3A+" ":")
                              (string/replace "++" "/"))))
                      all-files)
                distinct)]
     ;; (prn :debug :all-files (map #(.-name %) all-files))
     ;; (prn :debug :all-files-count (count (filter
     ;;                                      #(= (.-kind %) "file")
     ;;                                      all-files)))
     ;; (prn :dbs dbs)
     (bean/->js dbs)))

  (createOrOpenDB
   [_this repo]
   (p/let [_ (close-other-dbs! repo)]
     (create-or-open-db! repo)))

  (getMaxTx
   [_this repo]
   (when-let [conn (state/get-datascript-conn repo)]
     (:max-tx @conn)))

  (q [_this repo inputs-str]
     "Datascript q"
     (when-let [conn (state/get-datascript-conn repo)]
       (let [inputs (edn/read-string inputs-str)]
         (let [result (apply d/q (first inputs) @conn (rest inputs))]
           (bean/->js result)))))

  (transact
   [_this repo tx-data tx-meta context]
   (when repo (state/set-db-latest-tx-time! repo))
   (when-let [conn (state/get-datascript-conn repo)]
     (try
       (let [tx-data (if (string? tx-data)
                       (edn/read-string tx-data)
                       tx-data)
             tx-meta (if (string? tx-meta)
                       (edn/read-string tx-meta)
                       tx-meta)
             context (if (string? context)
                       (edn/read-string context)
                       context)
             _ (when context (state/set-context! context))
             tx-meta' (if (or (:from-disk? tx-meta) (:new-graph? tx-meta))
                        tx-meta
                        (assoc tx-meta :skip-store? true))
             tx-report (ldb/transact! conn tx-data tx-meta')
             result (pipeline/invoke-hooks repo conn tx-report context)
             ;; TODO: delay search indice so that UI can be refreshed earlier
             search-indice (search/sync-search-indice repo (:tx-report result))
             data (merge
                   {:repo repo
                    :search-indice search-indice
                    :tx-data tx-data
                    :tx-meta tx-meta}
                   (dissoc result :tx-report))]
         (pr-str data))
       (catch :default e
         (prn :debug :error)
         (js/console.error e)))))

  (getInitialData
   [_this repo]
   (when-let [conn (state/get-datascript-conn repo)]
     (->> (sqlite-common-db/get-initial-data @conn)
          dt/write-transit-str)))

  (unsafeUnlinkDB
   [_this repo]
   (p/let [pool (<get-opfs-pool repo)
           _ (close-db! repo)
           result (remove-vfs! pool)]
     nil))

  (releaseAccessHandles
   [_this repo]
   (when-let [^js pool (state/get-opfs-pool repo)]
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
   (p/let [db (get-search-db repo)
           result (search/search-blocks db q (bean/->clj option))]
     (bean/->js result)))

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
   (when-let [conn (state/get-datascript-conn repo)]
     (search/build-blocks-indice repo @conn)))

  (search-build-pages-indice
   [this repo]
   (when-let [conn (state/get-datascript-conn repo)]
     (search/build-blocks-indice repo @conn)))

  (page-search
   [this repo q limit]
   (when-let [conn (state/get-datascript-conn repo)]
     (search/page-search repo @conn q limit)))

  (file-writes-finished?
   [this]
   (empty? @file/*writes))

  (sync-app-state
   [this new-state-str]
   (let [new-state (edn/read-string new-state-str)]
     (state/set-new-state! new-state)
     nil))

  (dangerousRemoveAllDbs
   [this repo]
   (p/let [dbs (.listDB this)]
     (p/all (map #(.unsafeUnlinkDB this %) dbs)))))

(defn init
  "web worker entry"
  []
  (let [^js obj (SQLiteDB.)]
    (file/<ratelimit-file-writes!)
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
