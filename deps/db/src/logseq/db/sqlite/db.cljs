(ns logseq.db.sqlite.db
  "Main entry point for using sqlite with db graphs"
  (:require ["path" :as node-path]
            ["better-sqlite3" :as sqlite3]
            [clojure.string :as string]
            [cljs-bean.core :as bean]
            [datascript.storage :refer [IStorage]]
            [cognitect.transit :as t]
            [cljs-bean.core :as bean]
            [cljs.cache :as cache]
            [datascript.core :as d]
            [goog.object :as gobj]
            [logseq.db.frontend.schema :as db-schema]
            [datascript.transit :as dt]
            [clojure.edn :as edn]))

;; Notice: this works only on Node.js environment, it doesn't support browser yet.

;; use built-in blocks to represent db schema, config, custom css, custom js, etc.

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

(defn sanitize-db-name
  [db-name]
  (-> db-name
      (string/replace "logseq_db_" "")
      (string/replace "/" "_")
      (string/replace "\\" "_")
      (string/replace ":" "_"))) ;; windows

(defn get-db
  [repo]
  (get @databases (sanitize-db-name repo)))

(defn get-conn
  [repo]
  (get @conns (sanitize-db-name repo)))

(defn prepare
  [^object db sql db-name]
  (when db
    (try
      (.prepare db sql)
      (catch :default e
        (js/console.error (str "SQLite prepare failed: " e ": " db-name))
        (throw e)))))

(defn create-kvs-table!
  [db db-name]
  (let [stmt (prepare db "create table if not exists kvs (addr INTEGER primary key, content TEXT)"
                      db-name)]
    (.run ^object stmt)))

(defn get-db-full-path
  [graphs-dir db-name]
  (let [db-name' (sanitize-db-name db-name)
        graph-dir (node-path/join graphs-dir db-name')]
    [db-name' (node-path/join graph-dir "db.sqlite")]))

(defn query
  [repo db sql]
  (let [stmt (prepare db sql repo)]
    (.all ^object stmt)))

(defn upsert-addr-content!
  "Upsert addr+data-seq"
  [repo data]
  (when-let [db (get-db repo)]
    (let [insert (prepare db "INSERT INTO kvs (addr, content) values (@addr, @content) on conflict(addr) do update set content = @content"
                          repo)
          insert-many (.transaction ^object db
                                    (fn [data]
                                      (doseq [item data]
                                        (.run ^object insert item))))]
      (insert-many data))))

(defn restore-data-from-addr
  [repo addr]
  (when addr
    (when-let [db (get-db repo)]
     (-> (query repo db
                (str "select content from kvs where addr = " addr))
         first
         (gobj/get "content")))))

(defn sqlite-storage
  [repo {:keys [threshold]
         :or {threshold 4096}}]
  (let [_cache (cache/lru-cache-factory {} :threshold threshold)]
    (reify IStorage
      (-store [_ addr+data-seq]
        (let [data (->>
                    (map
                     (fn [[addr data]]
                       #js {:addr addr
                            :content (pr-str data)})
                     addr+data-seq)
                    (to-array))]
          (upsert-addr-content! repo data)))
      (-restore [_ addr]
        (let [content (restore-data-from-addr repo addr)]
          (assert (nil? content) (str "Restore address data not exists, addr: " addr))
          (edn/read-string content))
        ;; disable cache for now
        ;; (when-let [content (if (cache/has? cache addr)
        ;;                      (do
        ;;                        (cache/hit cache addr)
        ;;                        (cache/lookup cache addr))
        ;;                      (when-let [result (restore-data-from-addr repo addr)]
        ;;                        (cache/miss cache addr result)
        ;;                        result))]
        ;;   (edn/read-string content))
        ))))

(defn open-db!
  [graphs-dir db-name]
  (let [[db-sanitized-name db-full-path] (get-db-full-path graphs-dir db-name)
        db (new sqlite db-full-path nil)]
    (create-kvs-table! db db-name)
    (swap! databases assoc db-sanitized-name db)
    (let [storage (sqlite-storage db-name {})
          conn (or (d/restore-conn storage)
                   (d/create-conn db-schema/schema-for-db-based-graph {:storage storage}))]
      (swap! conns assoc db-sanitized-name conn)))
  nil)

(defn transact!
  [repo tx-data tx-meta]
  (when-let [conn (get-conn repo)]
    (try
      (d/transact! conn tx-data tx-meta)
      (catch :default e
        (prn :debug :error)
        (js/console.error e)))))

(defn get-initial-data
  "Get all datoms remove :block/content"
  [repo]
  (when-let [conn (get-conn repo)]
    (let [db @conn]
      (->> (d/datoms db :eavt)
           ;; (remove (fn [e] (= :block/content (:a e))))
           vec))))
