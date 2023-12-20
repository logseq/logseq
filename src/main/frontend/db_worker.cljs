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
            [frontend.util :as util]))

(defonce *sqlite (atom nil))
(defonce *sqlite-conns (atom nil))
(defonce *datascript-conns (atom nil))
(defonce *opfs-pools (atom nil))

(defn- get-sqlite-conn
  [repo]
  (get @*sqlite-conns repo))

(defn get-datascript-conn
  [repo]
  (get @*datascript-conns repo))

(defn get-opfs-pool
  [repo]
  (get @*opfs-pools repo))

(defn- <get-opfs-pool
  [graph]
  (or (get-opfs-pool graph)
      (p/let [^js pool (.installOpfsSAHPoolVfs @*sqlite #js {:name (str "logseq-pool-" graph)
                                                             :initialCapacity 10})]
        (swap! *opfs-pools assoc graph pool)
        pool)))

(defn- init-sqlite-module!
  []
  (when-not @*sqlite
    (p/let [electron? (string/includes? (.. js/location -href) "electron=true")
            base-url (str js/self.location.protocol "//" js/self.location.host)
            sqlite-wasm-url (if electron?
                              (js/URL. "sqlite3.wasm" (.. js/location -href))
                              (str base-url "/js/"))
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
  (let [^Object db (get-sqlite-conn repo)]
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
  (let [^Object db (get-sqlite-conn repo)]
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
      (util/profile
       (str "SQLite store addr+data count: " (count addr+data-seq))
       (let [data (map
                   (fn [[addr data]]
                     #js {:$addr addr
                          :$content (pr-str data)})
                   addr+data-seq)]
         (upsert-addr-content! repo data delete-addrs))))

    (-restore [_ addr]
      (restore-data-from-addr repo addr))))

(defn- close-db!
  [repo ^js db]
  (swap! *sqlite-conns dissoc repo)
  (swap! *datascript-conns dissoc repo)

  (when db (.close db))
  (when-let [^js pool (get-opfs-pool repo)]
    (.releaseAccessHandles pool))

  (swap! *opfs-pools dissoc repo))

(defn- close-other-dbs!
  [repo]
  (doseq [[r db] @*sqlite-conns]
    (when-not (= repo r)
      (close-db! r db))))

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

(defn- create-or-open-db!
  [repo]
  (when-not (get-sqlite-conn repo)
    (p/let [^js pool (<get-opfs-pool repo)
            capacity (.getCapacity pool)
            _ (when (zero? capacity)   ; file handle already releases since pool will be initialized only once
                (.acquireAccessHandles pool))
            db (new (.-OpfsSAHPoolDb pool) repo-path)
            storage (new-sqlite-storage repo {})]
      (swap! *sqlite-conns assoc repo db)
      (.exec db "PRAGMA locking_mode=exclusive")
      (sqlite-common-db/create-kvs-table! db)
      (let [conn (sqlite-common-db/get-storage-conn storage)]
        (swap! *datascript-conns assoc repo conn)
        nil))))

(comment
  (defn <remove-all-files!
   "!! Dangerous: use it only for development."
   []
   (p/let [all-files (<list-all-files)
           files (filter #(= (.-kind %) "file") all-files)
           dirs (filter #(= (.-kind %) "directory") all-files)
           _ (p/all (map (fn [file] (.remove file)) files))]
     (p/all (map (fn [dir] (.remove dir)) dirs)))))

(defn- remove-vfs!
  [^js pool]
  (when pool
    (.removeVfs ^js pool)))

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
                          (string/replace-first (.-name file) ".logseq-pool-" "")))
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
   (when-let [conn (get-datascript-conn repo)]
     (:max-tx @conn)))

  (transact
   [_this repo tx-data tx-meta]
   (when-let [conn (get-datascript-conn repo)]
     (util/profile
      "DB transact!"
      (try
        (let [tx-data (edn/read-string tx-data)
              tx-meta (edn/read-string tx-meta)]
          (d/transact! conn tx-data tx-meta)
          nil)
        (catch :default e
          (prn :debug :error)
          (js/console.error e))))))

  (getInitialData
   [_this repo]
   (when-let [conn (get-datascript-conn repo)]
     (->> (sqlite-common-db/get-initial-data @conn)
          dt/write-transit-str)))

  (unsafeUnlinkDB
   [_this repo]
   (p/let [db (get-sqlite-conn repo)
           pool (<get-opfs-pool repo)
           _ (when db (close-db! repo db))
           result (remove-vfs! pool)]
     nil))

  (releaseAccessHandles
   [_this repo]
   (when-let [^js pool (get-opfs-pool repo)]
     (.releaseAccessHandles pool)))

  (exportDB
   [_this repo]
   (<export-db-file repo))

  (importDb
   [this repo data]
   (when-not (string/blank? repo)
     (p/let [pool (<get-opfs-pool repo)]
       (<import-db pool data)))))

(defn init
  "web worker entry"
  []
  (let [^js obj (SQLiteDB.)]
    (Comlink/expose obj)))
