(ns ^:node-only logseq.db.sqlite.db
  "Sqlite fns for db graphs"
  (:require ["path" :as node-path]
            ["better-sqlite3" :as sqlite3]
            [logseq.db.sqlite.common-db :as sqlite-common-db]
            ;; FIXME: datascript.core has to come before datascript.storage or else nbb fails
            [datascript.core :as d]
            [datascript.storage :refer [IStorage]]
            [goog.object :as gobj]
            [clojure.edn :as edn]))

;; sqlite databases
(defonce databases (atom nil))
;; datascript conns
(defonce conns (atom nil))

;; Reference same sqlite default class in cljs + nbb without needing .cljc
(def sqlite (if (find-ns 'nbb.core) (aget sqlite3 "default") sqlite3))

(defn close!
  []
  (when @databases
    (doseq [[_ database] @databases]
      (.close database))
    (reset! databases nil)))

(def sanitize-db-name sqlite-common-db/sanitize-db-name)

(def get-db-full-path sqlite-common-db/get-db-full-path)

(defn get-conn
  [repo]
  (get @conns (sanitize-db-name repo)))

(defn get-db-full-path
  [graphs-dir db-name]
  (let [db-name' (sanitize-db-name db-name)
        graph-dir (node-path/join graphs-dir db-name')]
    [db-name' (node-path/join graph-dir "db.sqlite")]))

(defn query
  [db sql]
  (let [stmt (.prepare db sql)]
    (.all ^object stmt)))

(defn upsert-addr-content!
  "Upsert addr+data-seq"
  [db data]
  (let [insert (.prepare db "INSERT INTO kvs (addr, content) values (@addr, @content) on conflict(addr) do update set content = @content")
        insert-many (.transaction ^object db
                                  (fn [data]
                                    (doseq [item data]
                                      (.run ^object insert item))))]
    (insert-many data)))

(defn restore-data-from-addr
  [db addr]
  (-> (query db (str "select content from kvs where addr = " addr))
      first
      (gobj/get "content")))

(defn new-sqlite-storage
  "Creates a datascript storage for sqlite. Should be functionally equivalent to db-worker/new-sqlite-storage"
  [db]
  (reify IStorage
    (-store [_ addr+data-seq]
      (let [data (->>
                  (map
                   (fn [[addr data]]
                     #js {:addr addr
                          :content (pr-str data)})
                   addr+data-seq)
                  (to-array))]
        (upsert-addr-content! db data)))
    (-restore [_ addr]
      (let [content (restore-data-from-addr db addr)]
        (edn/read-string content)))))

(defn open-db!
  [graphs-dir db-name]
  (let [[db-sanitized-name db-full-path] (get-db-full-path graphs-dir db-name)
        db (new sqlite db-full-path nil)]
    (sqlite-common-db/create-kvs-table! db)
    (swap! databases assoc db-sanitized-name db)
    (let [storage (new-sqlite-storage db)
          conn (sqlite-common-db/get-storage-conn storage)]
      (swap! conns assoc db-sanitized-name conn)))
  nil)

;; TODO: Remove as it looks unused
(defn transact!
  [repo tx-data tx-meta]
  (when-let [conn (get-conn repo)]
    (try
      (d/transact! conn tx-data tx-meta)
      (catch :default e
        (prn :debug :error)
        (js/console.error e)))))
