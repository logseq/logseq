(ns ^:node-only logseq.db.common.sqlite-cli
  "Primary ns to interact with DB files for DB and file graphs with node.js based CLIs"
  (:require ["better-sqlite3" :as sqlite3]
            ["fs" :as fs]
            ["os" :as os]
            ["path" :as node-path]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            ;; FIXME: datascript.core has to come before datascript.storage or else nbb fails
            [datascript.core]
            [datascript.storage :refer [IStorage]]
            [logseq.db.common.sqlite :as common-sqlite]
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
  [db data]
  (let [insert (.prepare db "INSERT INTO kvs (addr, content, addresses) values ($addr, $content, $addresses) on conflict(addr) do update set content = $content, addresses = $addresses")
        insert-many (.transaction ^object db
                                  (fn [data]
                                    (doseq [item data]
                                      (.run ^object insert item))))]
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
    (-store [_ addr+data-seq _delete-addrs]
      ;; Only difference from db-worker impl is that js data maps don't start with '$' e.g. :$addr -> :addr
      (let [data (map
                  (fn [[addr data]]
                    (let [data' (if (map? data) (dissoc data :addresses) data)
                          addresses (when (map? data)
                                      (when-let [addresses (:addresses data)]
                                        (js/JSON.stringify (bean/->js addresses))))]
                      #js {:addr addr
                           :content (sqlite-util/transit-write data')
                           :addresses addresses}))
                  addr+data-seq)]
        (upsert-addr-content! db data)))
    (-restore [_ addr]
      (restore-data-from-addr db addr))))

(defn open-sqlite-datascript!
  "Returns a map including `conn` for datascript connection and `sqlite` for sqlite connection"
  ([db-full-path]
   (open-sqlite-datascript! nil db-full-path))
  ([graphs-dir db-name]
   (let [[base-name db-full-path]
         (if (nil? graphs-dir)
           [(node-path/basename db-name) db-name]
           [db-name (second (common-sqlite/get-db-full-path graphs-dir db-name))])
         db (new sqlite db-full-path nil)
        ;; For both desktop and CLI, only file graphs have db-name that indicate their db type
         schema (if (common-sqlite/local-file-based-graph? base-name)
                  file-schema/schema
                  db-schema/schema)]
     (common-sqlite/create-kvs-table! db)
     (let [storage (new-sqlite-storage db)
           conn (common-sqlite/get-storage-conn storage schema)]
       {:sqlite db
        :conn conn}))))

(defn open-db!
  "For a given database name, opens a sqlite db connection for it, creates
  needed sqlite tables if not created and returns a datascript connection that's
  connected to the sqlite db"
  ([db-full-path]
   (open-db! nil db-full-path))
  ([graphs-dir db-name]
   (:conn (open-sqlite-datascript! graphs-dir db-name))))

(defn ->open-db-args
  "Creates args for open-db from a graph arg. Works for relative and absolute paths and
   defaults to ~/logseq/graphs/ when no '/' present in name"
  [graph-dir-or-path]
  ;; Pass full path directly to allow for paths that don't have standard graph naming convention
  (if (node-path/isAbsolute graph-dir-or-path)
    [graph-dir-or-path]
    (if (string/includes? graph-dir-or-path "/")
      (let [resolve-path' #(if (node-path/isAbsolute %) %
                             ;; $ORIGINAL_PWD used by bb tasks to correct current dir
                               (node-path/join (or js/process.env.ORIGINAL_PWD ".") %))]
        ((juxt node-path/dirname node-path/basename) (resolve-path' graph-dir-or-path)))
      ;; TODO: Reuse with get-db-graphs-dir when there is a db ns that is usable by electron i.e. no better-sqlite3
      [(node-path/join (os/homedir) "logseq" "graphs") graph-dir-or-path])))
