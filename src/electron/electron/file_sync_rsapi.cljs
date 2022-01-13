(ns electron.file-sync-rsapi
  (:require ["rsapi" :as rsapi]))

(defn get-local-files-meta [graph-uuid base-path file-paths]
  (rsapi/getLocalFilesMeta graph-uuid base-path (clj->js file-paths)))

(defn get-local-all-files-meta [graph-uuid base-path]
  (rsapi/getLocalAllFilesMeta graph-uuid base-path))

(defn rename-local-file [graph-uuid base-path from to]
  (rsapi/renameLocalFile graph-uuid base-path from to))

(defn delete-local-files [graph-uuid base-path file-paths]
  (rsapi/deleteLocalFiles graph-uuid base-path (clj->js file-paths)))

(defn update-local-files [graph-uuid base-path file-paths token]
  (rsapi/updateLocalFiles graph-uuid base-path (clj->js file-paths) token))

(defn delete-remote-files [graph-uuid base-path file-paths txid token]
  (rsapi/deleteRemoteFiles graph-uuid base-path (clj->js file-paths) txid token))

(defn update-remote-file [graph-uuid base-path file-path txid token]
  (rsapi/updateRemoteFile graph-uuid base-path file-path txid token))

(defn update-remote-files [graph-uuid base-path file-paths txid token]
  (rsapi/updateRemoteFiles graph-uuid base-path (clj->js file-paths) txid token))
