;; Auto-generated via `bb libs:generate-cljs-sdk`
(ns com.logseq.db
  (:require [com.logseq.core :as core]))

(def api-proxy (aget js/logseq "DB"))

(defn q
  "Run a DSL query"
  [dsl]
  (let [method (aget api-proxy "q")
        args [dsl]]
    (core/call-method api-proxy method args)))

(defn datascript-query
  "Run a datascript query"
  [query & inputs]
  (let [method (aget api-proxy "datascriptQuery")
        rest-inputs (vec inputs)
        args (into [query] rest-inputs)]
    (core/call-method api-proxy method args)))

(defn on-changed
  "Hook all transaction data of DB"
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
