(ns logseq.db.sqlite.common-db
  "Common sqlite db fns for browser and node"
  (:require [datascript.core :as d]
            [logseq.db.frontend.schema :as db-schema]
            ["path" :as node-path]
            [clojure.string :as string]
            [logseq.db.sqlite.util :as sqlite-util]))

(defn get-initial-data
  "Returns initial data as vec of datoms"
  [db]
  (->> (d/datoms db :eavt)
       vec))

(defn restore-initial-data
  "Given initial sqlite data, returns a datascript connection"
  [datoms]
  (d/conn-from-datoms datoms db-schema/schema-for-db-based-graph))

(defn create-kvs-table!
  "Creates a sqlite table for use with datascript.storage if one doesn't exist"
  [sqlite-db]
  (.exec sqlite-db "create table if not exists kvs (addr INTEGER primary key, content TEXT)"))

(defn get-storage-conn
  "Given a datascript storage, returns a datascript connection for it"
  [storage]
  (or (d/restore-conn storage)
      (d/create-conn db-schema/schema-for-db-based-graph {:storage storage})))

(defn sanitize-db-name
  [db-name]
  (-> db-name
      (string/replace sqlite-util/db-version-prefix "")
      (string/replace "/" "_")
      (string/replace "\\" "_")
      (string/replace ":" "_")))  ;; windows

(defn get-db-full-path
  [graphs-dir db-name]
  (let [db-name' (sanitize-db-name db-name)
        graph-dir (node-path/join graphs-dir db-name')]
    [db-name' (node-path/join graph-dir "db.sqlite")]))
