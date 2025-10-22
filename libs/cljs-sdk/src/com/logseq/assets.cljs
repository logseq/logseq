;; Auto-generated via `bb libs:generate-cljs-sdk`
(ns com.logseq.assets
  (:require [com.logseq.core :as core]))

(def api-proxy (aget js/logseq "Assets"))

(defn- list-files-of-current-graph-impl
  [exts]
  (let [method (aget api-proxy "listFilesOfCurrentGraph")
        args [exts]]
    (core/call-method api-proxy method args)))

(defn list-files-of-current-graph
  ([]
   (list-files-of-current-graph-impl nil))
  ([exts]
   (list-files-of-current-graph-impl exts)))

(defn make-sandbox-storage
  []
  (let [method (aget api-proxy "makeSandboxStorage")
        args []]
    (core/call-method api-proxy method args)))

(defn make-url
  "make assets scheme url based on current graph"
  [path]
  (let [method (aget api-proxy "makeUrl")
        args [path]]
    (core/call-method api-proxy method args)))

(defn built-in-open
  "try to open asset type file in Logseq app"
  [path]
  (let [method (aget api-proxy "builtInOpen")
        args [path]]
    (core/call-method api-proxy method args)))
