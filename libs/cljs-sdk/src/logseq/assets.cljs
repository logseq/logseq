;; Auto-generated via `bb libs:generate-cljs-sdk`
(ns logseq.assets
  (:require [logseq.core :as core]))

(defn- list-files-of-current-graph-impl
  [exts]
  (let [method (aget (aget js/logseq "Assets") "listFilesOfCurrentGraph")
        arg-exts exts
        args [arg-exts]]
    (core/call-method method args)))

(defn list-files-of-current-graph
  ([]
   (list-files-of-current-graph-impl nil))
  ([exts]
   (list-files-of-current-graph-impl exts)))

(defn make-sandbox-storage
  []
  (let [method (aget (aget js/logseq "Assets") "makeSandboxStorage")
        args []]
    (core/call-method method args)))

(defn make-url
  "make assets scheme url based on current graph"
  [path]
  (let [method (aget (aget js/logseq "Assets") "makeUrl")
        arg-path path
        args [arg-path]]
    (core/call-method method args)))

(defn built-in-open
  "try to open asset type file in Logseq app"
  [path]
  (let [method (aget (aget js/logseq "Assets") "builtInOpen")
        arg-path path
        args [arg-path]]
    (core/call-method method args)))
