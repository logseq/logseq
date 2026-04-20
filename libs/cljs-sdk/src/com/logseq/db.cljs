;; Auto-generated via `bb libs:generate-cljs-sdk`
(ns com.logseq.db
  (:require [com.logseq.core :as core]))

(def api-proxy (aget js/logseq "DB"))

(defn q
  "Run a DSL query. https://docs.logseq.com/#/page/queries"
  [dsl]
  (let [method (aget api-proxy "q")
        args [dsl]]
    (core/call-method api-proxy method args)))

(defn custom-query
  "Executes a datalog query through query-react,\ngiven either a regular datalog query or a simple query."
  [query]
  (let [method (aget api-proxy "customQuery")
        args [query]]
    (core/call-method api-proxy method args)))

(defn datascript-query
  "Run a datascript query with parameters."
  [query & inputs]
  (let [method (aget api-proxy "datascriptQuery")
        rest-inputs (vec inputs)
        args (into [query] rest-inputs)]
    (core/call-method api-proxy method args)))

(defn on-changed
  "Hook all transaction data of DB."
  [callback]
  (let [method (aget api-proxy "onChanged")
        args [callback]]
    (core/call-method api-proxy method args)))

(defn on-block-changed
  "Subscribe a specific block changed event"
  [uuid callback]
  (let [method (aget api-proxy "onBlockChanged")
        args [uuid callback]]
    (core/call-method api-proxy method args)))

(defn set-file-content
  "For built-in files path `logseq/custom.js`, `logseq/custom.css`, `logseq/publish.js`, `logseq/publish.css` etc."
  [path content]
  (let [method (aget api-proxy "setFileContent")
        args [path content]]
    (core/call-method api-proxy method args)))

(defn get-file-content
  [path]
  (let [method (aget api-proxy "getFileContent")
        args [path]]
    (core/call-method api-proxy method args)))
