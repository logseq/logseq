(ns frontend.db-worker
  "Worker used for browser DB implementation"
  (:require [promesa.core :as p]
            [datascript.storage :refer [IStorage]]
            [clojure.edn :as edn]
            [datascript.core :as d]
            [logseq.db.sqlite.common-db :as sqlite-common-db]
            [shadow.cljs.modern :refer [defclass]]
            ["@logseq/sqlite-wasm" :default sqlite3InitModule]
            ["comlink" :as Comlink]
            [clojure.string :as string]
            [cljs-bean.core :as bean]
            [frontend.worker.search :as search]
            [logseq.db.sqlite.util :as sqlite-util]
            [frontend.worker.state :as worker-state]
            [frontend.worker.file :as file]
            [frontend.worker.export :as worker-export]
            [logseq.db :as ldb]
            [frontend.worker.rtc.op-mem-layer :as op-mem-layer]
            [frontend.worker.rtc.db-listener :as rtc-db-listener]
            [frontend.worker.rtc.full-upload-download-graph :as rtc-updown]
            [frontend.worker.rtc.core :as rtc-core]
            [clojure.core.async :as async]
            [frontend.worker.async-util :include-macros true :refer [<?]]
            [frontend.worker.util :as worker-util]
            [frontend.worker.handler.page.rename :as worker-page-rename]
            [frontend.worker.handler.page :as worker-page]
            [logseq.outliner.op :as outliner-op]))

(defonce *sqlite worker-state/*sqlite)
(defonce *sqlite-conns worker-state/*sqlite-conns)
(defonce *datascript-conns worker-state/*datascript-conns)
(defonce *opfs-pools worker-state/*opfs-pools)
(defonce *publishing? (atom false))

(defn- get-pool-name
  [graph-name]
  (str "logseq-pool-" (sqlite-common-db/sanitize-db-name graph-name)))

(defn- <get-opfs-pool
  [graph]
  (when-not @*publishing?
    (or (worker-state/get-opfs-pool graph)
        (p/let [^js pool (.installOpfsSAHPoolVfs @*sqlite #js {:name (get-pool-name graph)
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
  [repo data delete-addrs]
  (let [^Object db (worker-state/get-sqlite-conn repo)]
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
  (let [^Object db (worker-state/get-sqlite-conn repo)]
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

(defn- close-db-aux!
  [repo ^Object db ^Object search]
  (swap! *sqlite-conns dissoc repo)
  (swap! *datascript-conns dissoc repo)
  (when db (.close db))
  (when search (.close search))
  (when-let [^js pool (worker-state/get-opfs-pool repo)]
    (.releaseAccessHandles pool))
  (swap! *opfs-pools dissoc repo))

(defn- close-other-dbs!
  [repo]
  (doseq [[r {:keys [db search]}] @*sqlite-conns]
    (when-not (= repo r)
      (close-db-aux! r db search))))

(defn close-db!
  [repo]
  (let [{:keys [db search]} (@*sqlite-conns repo)]
    (close-db-aux! repo db search)))

(defn- get-db-and-search-db
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
            search-db (new (.-OpfsSAHPoolDb pool) (str "search" repo-path))]
      [db search-db])))

(defn- create-or-open-db!
  [repo]
  (when-not (worker-state/get-sqlite-conn repo)
    (p/let [[db search-db] (get-db-and-search-db repo)
            storage (new-sqlite-storage repo {})]
      (swap! *sqlite-conns assoc repo {:db db
                                       :search search-db})
      (.exec db "PRAGMA locking_mode=exclusive")
      (sqlite-common-db/create-kvs-table! db)
      (search/create-tables-and-triggers! search-db)
      (let [schema (sqlite-util/get-schema repo)
            conn (sqlite-common-db/get-storage-conn storage schema)]
        (swap! *datascript-conns assoc repo conn)
        (p/let [_ (op-mem-layer/<init-load-from-indexeddb! repo)]
          (rtc-db-listener/listen-to-db-changes! repo conn))
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
  (worker-state/get-sqlite-conn repo {:search? true}))


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
   [_this repo & {:keys [close-other-db?]
                  :or {close-other-db? true}}]
   (p/do!
    (when close-other-db?
      (close-other-dbs! repo))
    (create-or-open-db! repo)))

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
           result (->> (d/pull @conn selector id)
                       (sqlite-common-db/with-parent-and-left @conn))]
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
     (let [result (ldb/get-right-sibling @conn db-id)]
       (ldb/write-transit-str result))))

  (get-block-and-children
   [_this repo name children?]
   (assert (string? name))
   (when-let [conn (worker-state/get-datascript-conn repo)]
     (ldb/write-transit-str (sqlite-common-db/get-block-and-children @conn name children?))))

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

  (transact
   [_this repo tx-data tx-meta context]
   (when repo (worker-state/set-db-latest-tx-time! repo))
   (when-let [conn (worker-state/get-datascript-conn repo)]
     (try
       (let [tx-data (if (string? tx-data)
                       (ldb/read-transit-str tx-data)
                       tx-data)
             tx-meta (if (string? tx-meta)
                       (ldb/read-transit-str tx-meta)
                       tx-meta)
             context (if (string? context)
                       (ldb/read-transit-str context)
                       context)
             _ (when context (worker-state/set-context! context))
             tx-meta' (if (:new-graph? tx-meta)
                        tx-meta
                        (cond-> tx-meta
                          (and (not (:whiteboard/transact? tx-meta))
                               (not (:rtc-download-graph? tx-meta))) ; delay writes to the disk
                          (assoc :skip-store? true)

                          true
                          (dissoc :insert-blocks?)))]
         (when-not (and (:create-today-journal? tx-meta)
                        (:today-journal-name tx-meta)
                        (seq tx-data)
                        (d/entity @conn [:block/name (:today-journal-name tx-meta)])) ; today journal created already

           ;; (prn :debug :transact :tx-data tx-data :tx-meta tx-meta')
           (worker-util/profile "Worker db transact"
                                (ldb/transact! conn tx-data tx-meta')))
         nil)
       (catch :default e
         (prn :debug :error)
         (let [tx-data (if (string? tx-data)
                         (ldb/read-transit-str tx-data)
                         tx-data)]
           (js/console.error e)
           (prn :debug :tx-data tx-data))))))

  (getInitialData
   [_this repo]
   (when-let [conn (worker-state/get-datascript-conn repo)]
     (ldb/write-transit-str (sqlite-common-db/get-initial-data @conn))))

  (fetch-all-pages
   [_this repo]
   (when-let [conn (worker-state/get-datascript-conn repo)]
     (async/go
       (let [all-pages (sqlite-common-db/get-all-pages @conn)
             partitioned-data (map-indexed (fn [idx p] [idx p]) (partition-all 2000 all-pages))]
         (doseq [[idx tx-data] partitioned-data]
           (worker-util/post-message :sync-db-changes {:repo repo
                                                       :tx-data tx-data
                                                       :tx-meta {:initial-pages? true
                                                                 :end? (= idx (dec (count partitioned-data)))}})
           (async/<! (async/timeout 100)))))
     nil))

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
   (when-let [conn (worker-state/get-datascript-conn repo)]
     (search/build-blocks-indice repo @conn)))

  (search-build-pages-indice
   [this repo]
   (when-let [conn (worker-state/get-datascript-conn repo)]
     (search/build-blocks-indice repo @conn)))

  ;; page ops
  (page-search
   [this repo q limit]
   (when-let [conn (worker-state/get-datascript-conn repo)]
     (search/page-search repo @conn q limit)))

  (page-rename
   [this repo old-name new-name]
   (when-let [conn (worker-state/get-datascript-conn repo)]
     (let [config (worker-state/get-config repo)
           result (worker-page-rename/rename! repo conn config old-name new-name)]
       (bean/->js {:result result}))))

  (page-delete
   [this repo page-name]
   (when-let [conn (worker-state/get-datascript-conn repo)]
     (let [error-handler (fn [{:keys [msg]}]
                           (worker-util/post-message :notification
                                                     [[:div [:p msg]] :error]))
           result (worker-page/delete! repo conn page-name {:error-handler error-handler})]
       (bean/->js {:result result}))))

  (apply-outliner-ops
   [this repo ops-str opts-str]
   (when-let [conn (worker-state/get-datascript-conn repo)]
     (let [ops (edn/read-string ops-str)
           opts (edn/read-string opts-str)
           result (outliner-op/apply-ops! repo conn ops (worker-state/get-date-formatter repo) opts)]
       (ldb/write-transit-str result))))

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

  ;; Export
  (block->content
   [this repo block-uuid-or-page-name tree->file-opts context]
   (when-let [conn (worker-state/get-datascript-conn repo)]
     (worker-export/block->content repo @conn block-uuid-or-page-name
                                   (ldb/read-transit-str tree->file-opts)
                                   (ldb/read-transit-str context))))

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
   (when-let [conn (worker-state/get-datascript-conn repo)]
     (rtc-core/<start-rtc repo conn token)
     nil))

  (rtc-stop
   [this]
   (rtc-core/<stop-rtc)
   nil)

  (rtc-toggle-sync
   [this repo]
   (let [d (p/deferred)]
     (async/go
       (let [result (<! (rtc-core/<toggle-sync))]
         (p/resolve! d result)))
     d))

  (rtc-grant-graph-access
   [this graph-uuid target-user-uuids target-user-emails]
   (when-let [state @rtc-core/*state]
     (rtc-core/<grant-graph-access-to-others
      state graph-uuid
      :target-user-uuids target-user-uuids
      :target-user-emails target-user-emails))
   nil)

  (rtc-upload-graph
   [this repo token]
   (when-let [conn (worker-state/get-datascript-conn repo)]
     (async/go
       (try
         (let [state (<! (rtc-core/<init-state repo token false))]
           (<! (rtc-updown/<upload-graph state repo conn))
           (rtc-db-listener/listen-db-to-generate-ops repo conn))
         (worker-util/post-message :notification
                                   [[:div
                                     [:p "Upload graph successfully"]]])
         (catch :default e
           (worker-util/post-message :notification
                                     [[:div
                                       [:p "upload graph failed"]]
                                      :error])
           (prn ::download-graph-failed e))))
     nil))

  (rtc-download-graph
   [this repo token graph-uuid]
   (async/go
     (let [state (<! (rtc-core/<init-state repo token false))]
       (try
         (<? (rtc-updown/<download-graph state repo graph-uuid))
         (worker-util/post-message :notification
                                   [[:div
                                     [:p "download graph successfully"]]])
         (catch :default e
           (worker-util/post-message :notification
                                     [[:div
                                       [:p "download graph failed"]]
                                      :error])
           (prn ::download-graph-failed e)))))
   nil)

  (rtc-push-pending-ops
   [_this]
   (async/put! (:force-push-client-ops-chan @rtc-core/*state) true)
   nil)

  (rtc-get-graphs
   [_this repo token]
   (rtc-core/<get-graphs repo token))

  (rtc-get-block-content-versions
   [_this block-id]
   (rtc-core/<get-block-content-versions @rtc-core/*state block-id))

  (rtc-get-debug-state
   [_this repo]
   (bean/->js (rtc-core/get-debug-state repo)))

  (keep-alive
   [_this]
   "alive")

  (dangerousRemoveAllDbs
   [this repo]
   (p/let [dbs (.listDB this)]
     (p/all (map #(.unsafeUnlinkDB this %) dbs)))))

(defn init
  "web worker entry"
  []
  (let [^js obj (DBWorker.)]
    (worker-state/set-worker-object! obj)
    (file/<ratelimit-file-writes!)
    (js/setInterval #(.postMessage js/self "keepAlive") (* 1000 25))
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
