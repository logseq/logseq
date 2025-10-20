;; Auto-generated via `bb libs:generate-cljs-sdk`
(ns logseq.utils
  (:require ["@logseq/libs" :as logseq]
            [logseq.core :as core]))

(defn to-js
  [obj]
  (let [method (aget (aget logseq "Utils") "toJs")
        arg-obj obj
        args [arg-obj]]
    (core/call-method method args)))
