;; Auto-generated via `bb libs:generate-cljs-sdk`
(ns com.logseq.net
  (:require [com.logseq.core :as core]))

(def api-proxy (aget js/logseq "Net"))

(defn request
  [options]
  (let [method (aget api-proxy "request")
        args [options]]
    (core/call-method api-proxy method args)))
