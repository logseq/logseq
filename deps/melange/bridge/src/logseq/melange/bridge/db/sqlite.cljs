(ns logseq.melange.bridge.db.sqlite
  "Provides common sqlite util fns that work on browser and node"
  (:require ["path" :as node-path]
            ["@logseq/melange-js-api/common" :as melange-common]
            ["@logseq/melange-js-api/db" :as melange-db]
            [logseq.melange.bridge.db.sqlite.util :as sqlite-util]
            [logseq.melange.bridge.platform.datascript :as d]))

(def ^:private sqlite-policy-api (.-SqlitePolicy melange-db))
(def ^:private sqlite-lifecycle-api (.-SqliteLifecycle melange-db))

(defn create-kvs-table!
  "Creates a sqlite table for use with datascript.storage if one doesn't exist"
  [sqlite-db]
  (.exec sqlite-db "create table if not exists kvs (addr INTEGER primary key, content TEXT, addresses JSON)"))

(defn get-storage-conn
  "Given a datascript storage, returns a datascript connection for it"
  [storage schema]
  ((.-storageConnection sqlite-lifecycle-api) (d/adapter) storage schema))

(defn sanitize-db-name
  [db-name]
  ((.-sanitizeDbName sqlite-policy-api) sqlite-util/db-version-prefix db-name))

(defn get-db-full-path
  [graphs-dir db-name]
  (let [graph-dir-name ((.-repoToEncodedGraphDirName (.-GraphDir melange-common)) db-name)
        graph-dir (node-path/join graphs-dir graph-dir-name)]
    [graph-dir-name (.pathJoin (.-Path melange-common) graph-dir (to-array ["db.sqlite"]))]))

(defn get-db-backups-path
  [graphs-dir db-name]
  (let [graph-dir-name ((.-repoToEncodedGraphDirName (.-GraphDir melange-common)) db-name)]
    (.pathJoin (.-Path melange-common) graphs-dir (to-array [graph-dir-name "backups"]))))
