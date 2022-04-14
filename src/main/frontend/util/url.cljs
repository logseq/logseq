(ns frontend.util.url
  (:require [frontend.db.conn :as db-conn]))

;; Keep same as electron/electron.core
(def LSP_SCHEME "logseq")

;; Keep same as electron/electron.url
(def encode js/encodeURI)
(def encode-param js/encodeURIComponent)

(defn get-repo-identifier
  "repo-path: output of `get-repo-name`"
  [repo]
  (let [repo-path (db-conn/get-repo-name repo)]
    (db-conn/get-short-repo-name repo-path)))

(defn get-logseq-repo-url
  "Get Logseq protocol URL, w/o param (v0.1).
   host: set to `nil` for local graph
   protocol?: if true, returns with protocol prefix"
  ([host action repo-identifier]
   (get-logseq-repo-url host action repo-identifier true))
  ([host action repo-identifier protocol?]
   (str (when protocol? (str LSP_SCHEME "://")) 
        (when host (str host "/")) 
        action "/" 
        (encode repo-identifier)))
)

(defn get-local-logseq-entity-url-by-uuid
  "The URL represents an entity in graph.
   Ensure repo-identifier and uuid are valid string before hand.
   Only the name of repo is required (not full path)"
  [repo uuid]
  (str (get-logseq-repo-url nil "graph" (get-repo-identifier repo)) "?block-id=" uuid))
