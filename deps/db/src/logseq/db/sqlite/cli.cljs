(ns ^:node-only logseq.db.sqlite.cli
  "Primary ns to interact with DB graphs with node.js based CLIs"
  (:require ["better-sqlite3" :as sqlite3]
            [logseq.db.sqlite.common-db :as sqlite-common-db]
            ;; FIXME: datascript.core has to come before datascript.storage or else nbb fails
            #_:clj-kondo/ignore
            [datascript.core :as d]
            [datascript.storage :refer [IStorage]]
            [goog.object :as gobj]
            [clojure.edn :as edn]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.util :as sqlite-util]
            ["fs" :as fs]
            ["path" :as node-path]))

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
  "Upsert addr+data-seq"
  [db data delete-addrs]
  (let [insert (.prepare db "INSERT INTO kvs (addr, content) values (@addr, @content) on conflict(addr) do update set content = @content")
        delete (.prepare db "DELETE from kvs where addr = ?")
        insert-many (.transaction ^object db
                                  (fn [data]
                                    (doseq [item data]
                                      (.run ^object insert item))
                                    (doseq [addr delete-addrs]
                                      (when addr
                                        (.run ^object delete addr)))))]
    (insert-many data)))

(defn- restore-data-from-addr
  [db addr]
  (when-let [content (-> (query db (str "select content from kvs where addr = " addr))
                         first
                         (gobj/get "content"))]
    (try
      (let [data (sqlite-util/transit-read content)]
        (if-let [addresses (:addresses data)]
          (assoc data :addresses (clj->js addresses))
          data))
      (catch :default _e              ; TODO: remove this once db goes to test
        (edn/read-string content)))))

(defn new-sqlite-storage
  "Creates a datascript storage for sqlite. Should be functionally equivalent to db-worker/new-sqlite-storage"
  [db]
  (reify IStorage
    (-store [_ addr+data-seq delete-addrs]
      (let [data (->>
                  (map
                   (fn [[addr data]]
                     #js {:addr addr
                          :content (sqlite-util/transit-write data)})
                   addr+data-seq)
                  (to-array))]
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
                 db-schema/schema
                 db-schema/schema-for-db-based-graph)]
    (sqlite-common-db/create-kvs-table! db)
    (let [storage (new-sqlite-storage db)
          conn (sqlite-common-db/get-storage-conn storage schema)]
      conn)))