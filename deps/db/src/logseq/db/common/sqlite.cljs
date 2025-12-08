(ns logseq.db.common.sqlite
  "Provides common sqlite util fns for file and DB graphs. These fns work on
  browser and node"
  (:require ["path" :as node-path]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.common.config :as common-config]))

(defn create-kvs-table!
  "Creates a sqlite table for use with datascript.storage if one doesn't exist"
  [sqlite-db]
  (.exec sqlite-db "create table if not exists kvs (addr INTEGER primary key, content TEXT, addresses JSON)"))

(defn get-storage-conn
  "Given a datascript storage, returns a datascript connection for it"
  [storage schema]
  (or (d/restore-conn storage)
      (d/create-conn schema {:storage storage})))

(defn local-file-based-graph?
  [s]
  (and (string? s)
       (string/starts-with? s common-config/file-version-prefix)))

(defn sanitize-db-name
  [db-name]
  (if (string/starts-with? db-name common-config/file-version-prefix)
    (-> db-name
        (string/replace ":" "+3A+")
        (string/replace "/" "++"))
    (-> db-name
        (string/replace sqlite-util/db-version-prefix "")
        (string/replace "/" "_")
        (string/replace "\\" "_")
        (string/replace ":" "_"))));; windows

(defn get-db-full-path
  [graphs-dir db-name]
  (let [db-name' (sanitize-db-name db-name)
        graph-dir (node-path/join graphs-dir db-name')]
    [db-name' (node-path/join graph-dir "db.sqlite")]))
