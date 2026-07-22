(ns logseq.melange.bridge.platform.node
  "Primitive Node.js adapters for Melange Common and DB consumers."
  (:require ["@logseq/melange-js-api/node" :as node-api]))

(def ^:private graph-fs (.-GraphFs node-api))

(defn readdir
  [root-dir]
  (.readdir graph-fs root-dir))

(defn read-directories
  [root-dir]
  (.readDirectories graph-fs root-dir))

(defn get-files
  [graph-dir]
  (.getFiles graph-fs graph-dir))

(defn get-default-graphs-dir
  []
  (.getDefaultGraphsDir graph-fs))

(defn expand-home
  [path]
  (.expandHome graph-fs path))

(defn get-db-graphs-dir
  []
  (.getDbGraphsDir graph-fs))

(defn get-db-based-graphs
  []
  (.getDbBasedGraphs graph-fs))

(defn get-db-based-graphs-in-dir
  [directory]
  (.getDbBasedGraphsInDir graph-fs directory))

(defn node-platform
  [options]
  (.node_platform (.-Platform node-api) options))
