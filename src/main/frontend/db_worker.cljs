(ns frontend.db-worker
  "Worker used for browser DB implementation"
  (:require [promesa.core :as p]
            [datascript.storage :refer [IStorage]]
            [cljs.cache :as cache]
            [clojure.edn :as edn]
            [datascript.core :as d]
            [logseq.db.frontend.schema :as db-schema]
            [shadow.cljs.modern :refer [defclass]]
            [datascript.transit :as dt]
            ["@logseq/sqlite-wasm" :default sqlite3InitModule]
            ["comlink" :as Comlink]
            [clojure.string :as string]
            [cljs-bean.core :as bean]))

(defonce *sqlite (atom nil))
(defonce *sqlite-conns (atom nil))
(defonce *datascript-conn (atom nil))
(defonce *opfs-pool (atom nil))

(defn- get-sqlite-conn
  [repo]
  (get @*sqlite-conns repo))

(defn- <get-opfs-pool
  [graph]
  (or @*opfs-pool
      (p/let [^js pool (.installOpfsSAHPoolVfs @*sqlite #js {:name (str "logseq-pool-" graph)
                                                             :initialCapacity 10})]
        (reset! *opfs-pool pool)
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

(defn- get-repo-path
  [repo]
  (str "/" repo ".sqlite"))

(comment
  (defn- export-db-file
    [repo]
  ;; TODO: get file name by repo
    (p/let [^js pool (<get-opfs-pool repo)
            path (get-repo-path repo)]
      (when pool
        (.exportFile ^js pool path)))))

(defn upsert-addr-content!
  "Upsert addr+data-seq"
  [repo data]
  (let [^Object db (get-sqlite-conn repo)]
    (assert (some? db) "sqlite db not exists")
    (.transaction db (fn [tx]
                       (doseq [item data]
                         (.exec tx #js {:sql "INSERT INTO kvs (addr, content) values ($addr, $content) on conflict(addr) do update set content = $content"
                                        :bind item}))))))

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
  [repo {:keys [threshold]
         :or {threshold 4096}}]
  (let [_cache (cache/lru-cache-factory {} :threshold threshold)]
    (reify IStorage
      (-store [_ addr+data-seq]
        (let [data (map
                    (fn [[addr data]]
                      #js {:$addr addr
                           :$content (pr-str data)})
                    addr+data-seq)]
          (upsert-addr-content! repo data)))

      (-restore [_ addr]
        (restore-data-from-addr repo addr)))))

(defn- close-other-dbs!
  [repo]
  (doseq [[r db] @*sqlite-conns]
    (when-not (= repo r)
      (swap! *sqlite-conns dissoc r)
      (.close ^Object db))))

(defn- close-db!
  [repo]
  (when-let [db (@*sqlite-conns repo)]
    (swap! *sqlite-conns dissoc repo)
    (.close ^Object db)))

(defn- create-or-open-db!
  [repo]
  (when-not (get-sqlite-conn repo)
    (p/let [pool (<get-opfs-pool repo)
            db (new (.-OpfsSAHPoolDb pool) (get-repo-path repo))
            storage (new-sqlite-storage repo {})]
      (swap! *sqlite-conns assoc repo db)
      (.exec db "PRAGMA locking_mode=exclusive")
      (.exec db "create table if not exists kvs (addr INTEGER primary key, content TEXT)")
      (let [conn (or (d/restore-conn storage)
                     (d/create-conn db-schema/schema-for-db-based-graph {:storage storage}))]
        (reset! *datascript-conn conn)
        nil))))

(defn iter->vec [iter]
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

(comment
  (defn <remove-all-files!
    "!! Dangerous: use it only for development."
    []
    (p/let [all-files (<list-all-files)
            files (filter #(= (.-kind %) "file") all-files)
            dirs (filter #(= (.-kind %) "directory") all-files)
            _ (p/all (map (fn [file] (.remove file)) files))]
      (p/all (map (fn [dir] (.remove dir)) dirs)))))

(defn- <get-pool-files
  [^js pool]
  (.getFileNames pool))

(defn- remove-vfs!
  [repo]
  (p/let [^js pool (<get-opfs-pool repo)]
    (when pool
      (p/let [files (<get-pool-files pool)
              _ (p/all (map (fn [file] (.unlink pool file)) files))
              _ (.wipeFiles pool)]
        (.removeVfs ^js pool)))))

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

  ;; FIXME:
  (supportOPFS
   [_this]
   (some? (.-createSyncAccessHandle (.-prototype js/FileSystemFileHandle))))

  (init
   [_this]
   (init-sqlite-module!))

  (inited
   [_this]
   (some? @*sqlite))

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
     (prn :debug :all-files-count (count (filter
                                          #(= (.-kind %) "file")
                                          all-files)))
     (prn :dbs dbs)
     (bean/->js dbs)))

  (createOrOpenDB
   [_this repo]
   (close-other-dbs! repo)
   (create-or-open-db! repo))

  (transact
   [_this repo tx-data tx-meta]
   (when-let [conn @*datascript-conn]
     (try
       (let [tx-data (edn/read-string tx-data)
             tx-meta (edn/read-string tx-meta)]
         (d/transact! conn tx-data tx-meta)
         nil)
       (catch :default e
         (prn :debug :error)
         (js/console.error e)))))

  (getInitialData
   [_this repo]
   (when-let [conn @*datascript-conn]
     (let [db @conn]
       (->> (d/datoms db :eavt)
            vec
            dt/write-transit-str))))

  (unsafeUnlinkDB
   [_this repo]
   (p/let [_ (close-db! repo)]
     (remove-vfs! repo)
     nil)))

(defn init
  "web worker entry"
  []
  (let [^js obj (SQLiteDB.)]
    (Comlink/expose obj)))
