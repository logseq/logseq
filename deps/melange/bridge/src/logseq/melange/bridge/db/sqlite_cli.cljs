(ns ^:node-only logseq.melange.bridge.db.sqlite-cli
  "Node SQLite CLI boundary."
  (:require ["@logseq/melange-js-api/db" :as melange-db]
            [logseq.melange.bridge.db.schema :as db-schema]
            [logseq.melange.bridge.db.sqlite :as common-sqlite]
            [logseq.melange.bridge.db.sqlite.util :as sqlite-util]
            [logseq.melange.bridge.platform.sqlite-cli :as platform]
            [logseq.melange.bridge.runtime :as runtime]))

(def ^:private sqlite-cli-workflow-api (.-SqliteCliWorkflow melange-db))

(def sqlite platform/sqlite-constructor)
(def query platform/query)

(defn- workflow-adapter
  []
  #js {:isAbsolute platform/absolute?
       :dirname platform/dirname
       :basename platform/basename
       :join platform/join
       :originalPwd platform/original-pwd
       :defaultGraphsDir platform/default-graphs-dir
       :expandHome platform/expand-home
       :openSqlite platform/open-sqlite
       :createTable platform/create-kvs-table!
       :storageConnection #(common-sqlite/get-storage-conn % db-schema/schema)
       :writeTransit sqlite-util/write-transit-str
       :readTransit sqlite-util/read-transit-str
       :stringifyJson platform/stringify-json
       :parseJson platform/parse-json
       :makeRow platform/make-row
       :upsertRows platform/upsert-rows!
       :loadRow platform/load-row
       :rowContent platform/row-content
       :rowAddresses platform/row-addresses
       :createDatascriptStorage platform/create-storage})

(defn new-sqlite-storage
  "Creates a DataScript storage backed by better-sqlite3."
  [sqlite]
  ((.-newStorageWith sqlite-cli-workflow-api)
   (runtime/runtime-adapter)
   (workflow-adapter)
   sqlite))

(defn open-sqlite-datascript!
  "Opens SQLite and returns its SQLite and DataScript connection handles."
  ([db-full-path]
   (open-sqlite-datascript! nil db-full-path))
  ([graphs-dir db-name]
   (let [result ((.-openStorageWith sqlite-cli-workflow-api)
                 (runtime/runtime-adapter)
                 (workflow-adapter)
                 graphs-dir
                 db-name)]
     {:sqlite (.-sqlite result)
      :conn (.-conn result)})))

(defn open-db!
  "Opens a SQLite-backed DataScript connection."
  ([db-full-path]
   (open-db! nil db-full-path))
  ([graphs-dir db-name]
   ((.-openStorageConnectionWith sqlite-cli-workflow-api)
    (runtime/runtime-adapter)
    (workflow-adapter)
    graphs-dir
    db-name)))

(defn ->open-db-args
  "Resolves an absolute path, relative path, or graph name into open arguments."
  [graph-dir-or-path]
  (vec
   (array-seq
    ((.-openArgsWith sqlite-cli-workflow-api)
     (workflow-adapter)
     graph-dir-or-path))))
