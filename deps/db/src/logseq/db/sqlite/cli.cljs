(ns ^:node-only logseq.db.sqlite.cli
  "Primary ns to interact with DB files for DB and file graphs with node.js based CLIs"
  (:require ["better-sqlite3" :as sqlite3]
            ["fs" :as fs]
            ["path" :as node-path]
            [cljs-bean.core :as bean]
            ;; FIXME: datascript.core has to come before datascript.storage or else nbb fails
            [datascript.core]
            [datascript.storage :refer [IStorage]]
            [logseq.db.common.sqlite :as sqlite-common-db]
            [logseq.db.file-based.schema :as file-schema]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.util :as sqlite-util]))

;; Should this check directory name instead if file graphs also
;; have this file?
(defn db-graph-directory?
  "Returns boolean indicating if the given directory is a DB graph"
  [graph-dir]
  (fs/existsSync (node-path/join graph-dir "db.sqlite")))

;; Reference same sqlite default class in cljs + nbb without needing .cljc
(def sqlite (if (find-ns 'nbb.core) (aget sqlite3 "default") sqlite3))

(defn query
  "Run a sql query against the given better-sqlite3 db"
  [db sql]
  (let [stmt (.prepare db sql)]
    (.all ^object stmt)))

(defn- upsert-addr-content!
  "Upsert addr+data-seq. Should be functionally equivalent to db-worker/upsert-addr-content!"
  [db data delete-addrs]
  (let [insert (.prepare db "INSERT INTO kvs (addr, content, addresses) values ($addr, $content, $addresses) on conflict(addr) do update set content = $content, addresses = $addresses")
        delete (.prepare db "Delete from kvs WHERE addr = ? AND NOT EXISTS (SELECT 1 FROM json_each(addresses) WHERE value = ?);")
        insert-many (.transaction ^object db
                                  (fn [data]
                                    (doseq [item data]
                                      (.run ^object insert item))
                                    (doseq [addr delete-addrs]
                                      (when addr
                                        (.run ^object delete addr)))))]
    (insert-many data)))

(defn- restore-data-from-addr
  "Should be functionally equivalent to db-worker/restore-data-from-addr"
  [db addr]
  (when-let [result (-> (query db (str "select content, addresses from kvs where addr = " addr))
                        first)]
    (let [{:keys [content addresses]} (bean/->clj result)
          addresses (when addresses
                      (js/JSON.parse addresses))
          data (sqlite-util/transit-read content)]
      (if (and addresses (map? data))
        (assoc data :addresses addresses)
        data))))

(defn new-sqlite-storage
  "Creates a datascript storage for sqlite. Should be functionally equivalent to db-worker/new-sqlite-storage"
  [db]
  (reify IStorage
    (-store [_ addr+data-seq delete-addrs]
            ;; Only difference from db-worker impl is that js data maps don't start with '$' e.g. :$addr -> :addr
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
                      #js {:addr addr
                           :content (sqlite-util/transit-write data')
                           :addresses addresses}))
                  addr+data-seq)]
        (upsert-addr-content! db data delete-addrs)))
    (-restore [_ addr]
      (restore-data-from-addr db addr))))

(defn open-db!
  "For a given database name, opens a sqlite db connection for it, creates
  needed sqlite tables if not created and returns a datascript connection that's
  connected to the sqlite db"
  [graphs-dir db-name]
  (let [[_db-sanitized-name db-full-path] (sqlite-common-db/get-db-full-path graphs-dir db-name)
        db (new sqlite db-full-path nil)
        ;; For both desktop and CLI, only file graphs have db-name that indicate their db type
        schema (if (sqlite-util/local-file-based-graph? db-name)
                 file-schema/schema
                 db-schema/schema)]
    (sqlite-common-db/create-kvs-table! db)
    (let [storage (new-sqlite-storage db)
          conn (sqlite-common-db/get-storage-conn storage schema)]
      conn)))
