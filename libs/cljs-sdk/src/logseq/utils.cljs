;; Auto-generated via `bb libs:generate-cljs-sdk`
(ns logseq.utils
  (:require [logseq.core :as core]))

(defn to-js
  [obj]
  (let [method (aget (aget js/logseq "Utils") "toJs")
        arg-obj obj
        args [arg-obj]]
    (core/call-method method args)))
