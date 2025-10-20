;; Auto-generated via `bb libs:generate-cljs-sdk`
(ns logseq.db
  (:require [logseq.core :as core]))

(defn q
  "Run a DSL query"
  [dsl]
  (let [method (aget (aget js/logseq "DB") "q")
        arg-dsl dsl
        args [arg-dsl]]
    (core/call-method method args)))

(defn datascript-query
  "Run a datascript query"
  [query & inputs]
  (let [method (aget (aget js/logseq "DB") "datascriptQuery")
        arg-query query
        rest-inputs (map #(core/convert-arg {:bean-to-js true} %) inputs)
        args (into [arg-query] rest-inputs)]
    (core/call-method method args)))

(defn on-changed
  "Hook all transaction data of DB"
  [callback]
  (let [method (aget (aget js/logseq "DB") "onChanged")
        arg-callback (core/convert-arg {:bean-to-js true} callback)
        args [arg-callback]]
    (core/call-method method args)))

(defn on-block-changed
  "Subscribe a specific block changed event"
  [uuid callback]
  (let [method (aget (aget js/logseq "DB") "onBlockChanged")
        arg-uuid uuid
        arg-callback (core/convert-arg {:bean-to-js true} callback)
        args [arg-uuid arg-callback]]
    (core/call-method method args)))
