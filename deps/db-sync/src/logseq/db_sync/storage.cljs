(ns logseq.db-sync.storage
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [datascript.core :as d]
            [datascript.storage :refer [IStorage]]
            [logseq.db-sync.common :as common]
            [logseq.db.common.normalize :as db-normalize]
            [logseq.db.common.sqlite :as common-sqlite]
            [logseq.db.frontend.schema :as db-schema]))

(defn init-schema! [sql]
  (common/sql-exec sql "create table if not exists kvs (addr INTEGER primary key, content TEXT, addresses JSON)")
  (common/sql-exec sql
                   (str "create table if not exists tx_log ("
                        "t INTEGER primary key,"
                        "tx TEXT not null,"
                        "created_at INTEGER"
                        ");"))
  (common/sql-exec sql
                   (str "create table if not exists sync_meta ("
                        "key TEXT primary key,"
                        "value TEXT"
                        ");")))

(defn- select-one [sql sql-str & args]
  (first (common/get-sql-rows (apply common/sql-exec sql sql-str args))))

(defn get-meta [sql k]
  (when-let [row (select-one sql "select value from sync_meta where key = ?" (name k))]
    (aget row "value")))

(defn set-meta! [sql k v]
  (common/sql-exec sql
                   (str "insert into sync_meta (key, value) values (?, ?)"
                        " on conflict(key) do update set value = excluded.value")
                   (name k)
                   (str v)))

(defn get-t [sql]
  (let [value (get-meta sql :t)]
    (if (string? value)
      (js/parseInt value 10)
      0)))

(defn set-t! [sql t]
  (set-meta! sql :t t))

(defn next-t! [sql]
  (let [t (inc (get-t sql))]
    (set-t! sql t)
    t))

(defn append-tx! [sql t tx-str created-at]
  (common/sql-exec sql
                   (str "insert into tx_log (t, tx, created_at) values (?, ?, ?)"
                        " on conflict(t) do update set tx = excluded.tx, created_at = excluded.created_at")
                   t
                   tx-str
                   created-at))

(defn fetch-tx-since [sql since-t]
  (let [rows (common/get-sql-rows
              (common/sql-exec sql
                               "select t, tx from tx_log where t > ? order by t asc"
                               since-t))]
    (mapv (fn [row]
            {:t (aget row "t")
             :tx (aget row "tx")})
          rows)))

(defn- delete-addrs! [sql addrs]
  (when (seq addrs)
    (let [placeholders (->> addrs (map (constantly "?")) (string/join ","))]
      (apply common/sql-exec sql
             (str "delete from kvs where addr in (" placeholders ")")
             addrs))))

(defn- upsert-addr-content! [sql data]
  (doseq [item data]
    (common/sql-exec sql
                     (str "insert into kvs (addr, content, addresses) values (?, ?, ?)"
                          " on conflict(addr) do update set content = excluded.content, addresses = excluded.addresses")
                     (aget item "addr")
                     (aget item "content")
                     (aget item "addresses"))))

(defn- restore-data-from-addr [sql addr]
  (when-let [row (select-one sql "select content, addresses from kvs where addr = ?" addr)]
    (let [{:keys [content addresses]} (bean/->clj row)
          addresses (when addresses (js/JSON.parse addresses))
          data (common/read-transit content)]
      (if (and addresses (map? data))
        (assoc data :addresses addresses)
        data))))

(defn new-sqlite-storage [sql]
  (reify IStorage
    (-store [_ addr+data-seq delete-addrs]
      (let [data (map
                  (fn [[addr data]]
                    (let [data' (if (map? data) (dissoc data :addresses) data)
                          addresses (when (map? data)
                                      (when-let [addresses (:addresses data)]
                                        (js/JSON.stringify (bean/->js addresses))))]
                      #js {"addr" addr
                           "content" (common/write-transit data')
                           "addresses" addresses}))
                  addr+data-seq)]
        (delete-addrs! sql delete-addrs)
        (upsert-addr-content! sql data)))
    (-restore [_ addr]
      (restore-data-from-addr sql addr))))

(defn- append-tx-for-tx-report
  [sql {:keys [db-after db-before tx-data]}]
  (let [new-t (next-t! sql)
        created-at (common/now-ms)
        normalized-data (db-normalize/normalize-tx-data db-after db-before tx-data)
        tx-str (common/write-transit normalized-data)]
    (append-tx! sql new-t tx-str created-at)))

(defn- listen-db-updates!
  [sql conn]
  (d/listen! conn ::listen-db-updates
             (fn [tx-report]
               (append-tx-for-tx-report sql tx-report))))

(defn open-conn [sql]
  (init-schema! sql)
  (let [storage (new-sqlite-storage sql)
        schema db-schema/schema
        conn (common-sqlite/get-storage-conn storage schema)]
    (listen-db-updates! sql conn)
    conn))
