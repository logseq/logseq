(ns ^:node-only logseq.db.sqlite.db
  "Sqlite fns for db graphs"
  (:require ["fs" :as fs]
            ["fs-extra" :as fs-extra*]
            ["path" :as node-path]
            [logseq.db.sqlite.common-db :as sqlite-common-db]
            ;; FIXME: datascript.core has to come before datascript.storage or else nbb fails
            #_:clj-kondo/ignore
            [datascript.core :as d]
            [datascript.storage :refer [IStorage]]
            [clojure.edn :as edn]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.util :as sqlite-util]))

;; Reference same sqlite default class in cljs + nbb without needing .cljc
(def fs-extra (if (find-ns 'nbb.core) (aget fs-extra* "default") fs-extra*))

;; datascript conns
(defonce conns (atom nil))

(def sanitize-db-name sqlite-common-db/sanitize-db-name)

(defn get-db-full-path
  [graphs-dir db-name]
  (let [db-name' (sanitize-db-name db-name)
        graph-dir (node-path/join graphs-dir db-name')
        graph-db-dir (node-path/join graph-dir "db")]
    (when-not (fs/existsSync graph-db-dir)
      ((aget fs-extra "mkdirSync") graph-db-dir))
    [db-name' graph-db-dir]))

(defn get-conn
  [repo]
  (get @conns (sanitize-db-name repo)))

(defn upsert-addr-content!
  "Upsert addr+data-seq"
  [graph-dir data delete-addrs]
  (doseq [addr delete-addrs]
    (let [path (node-path/join graph-dir (str addr))]
      (when (fs/existsSync path)
        ((aget fs-extra "removeSync") path))))
  (doseq [[addr content] data]
    (let [path (node-path/join graph-dir (str addr))]
      (fs/writeFileSync path content))))

(defn restore-data-from-addr
  [graph-dir addr]
  (let [addr-path (node-path/join graph-dir (str addr))]
    (when-let [content (and (fs/existsSync addr-path) (.toString (fs/readFileSync addr-path)))]
      (try
        (let [data (sqlite-util/transit-read content)]
          (if-let [addresses (:addresses data)]
            (assoc data :addresses (clj->js addresses))
            data))
        (catch :default _e              ; TODO: remove this once db goes to test
          (edn/read-string content))))))

(defn new-file-storage
  "Creates a datascript storage for files."
  [graph-dir]
  (reify IStorage
    (-store [_ addr+data-seq delete-addrs]
      (let [data (->>
                  (map
                   (fn [[addr data]]
                     [addr (sqlite-util/transit-write data)])
                   addr+data-seq))]
        (upsert-addr-content! graph-dir data delete-addrs)))
    (-restore [_ addr]
      (restore-data-from-addr graph-dir addr))))

(defn open-db!
  "For a given database name, returns a datascript connection that's backed by files."
  [graphs-dir db-name]
  (let [[db-sanitized-name db-full-path] (get-db-full-path graphs-dir db-name)
        ;; For both desktop and CLI, only file graphs have db-name that indicate their db type
        schema (if (sqlite-util/local-file-based-graph? db-name)
                 db-schema/schema
                 db-schema/schema-for-db-based-graph)
        storage (new-file-storage db-full-path)
        conn (sqlite-common-db/get-storage-conn storage schema)]
    (swap! conns assoc db-sanitized-name conn)
    conn))

(defn transact!
  [repo tx-data tx-meta]
  (if-let [conn (get-conn repo)]
    (d/transact! conn tx-data tx-meta)
    (throw (ex-info (str "Failed to transact! No db connection found for " repo) {}))))
