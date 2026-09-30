(ns logseq.db.common.sqlite
  "Provides common sqlite util fns that work on browser and node"
  (:require ["path" :as node-path]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.common.graph-dir :as graph-dir]
            [logseq.common.path :as path]
            [logseq.db.sqlite.util :as sqlite-util]))

(defn create-kvs-table!
  "Creates a sqlite table for use with datascript.storage if one doesn't exist"
  [sqlite-db]
  (.exec sqlite-db "create table if not exists kvs (addr INTEGER primary key, content TEXT, addresses JSON)"))

(defn- tail-max-tx
  "The largest tx among the datoms of the stored tail restore-conn replayed."
  [conn]
  (reduce (fn [max-tx datoms]
            (reduce (fn [max-tx datom] (max max-tx (:tx datom))) max-tx datoms))
          0
          (:tx-tail @(:atom conn))))

(defn get-storage-conn
  "Given a datascript storage, returns a datascript connection for it.
  A restore replays each stored tail entry (the datoms of 1 transact!) and
  sets :max-tx to the tx of its first datom. A transaction the worker
  pipeline extends spans several tx ids (1 d/with each) in 1 entry, and the
  replayed datoms keep their own tx ids, so the restored :max-tx fell short
  of the one the graph had: the next transaction took a tx id the graph's
  datoms already carried, and the checksum, stored with the :max-tx it
  covers, was recomputed on every such reopen. Take the largest tx of the
  tail's datoms."
  [storage schema]
  (if-let [conn (d/restore-conn storage)]
    (let [max-tx (tail-max-tx conn)]
      (when (> max-tx (:max-tx @conn))
        (swap! conn assoc :max-tx max-tx))
      conn)
    (d/create-conn schema {:storage storage})))

(defn sanitize-db-name
  [db-name]
  (-> db-name
      (string/replace sqlite-util/db-version-prefix "")
      (string/replace "/" "_")
      (string/replace "\\" "_")
      (string/replace ":" "_")));; windows

(defn get-db-full-path
  [graphs-dir db-name]
  (let [graph-dir-name (graph-dir/repo->encoded-graph-dir-name db-name)
        graph-dir (node-path/join graphs-dir graph-dir-name)]
    [graph-dir-name (path/path-join graph-dir "db.sqlite")]))

(defn get-db-backups-path
  [graphs-dir db-name]
  (let [graph-dir-name (graph-dir/repo->encoded-graph-dir-name db-name)]
    (path/path-join graphs-dir graph-dir-name "backups")))
