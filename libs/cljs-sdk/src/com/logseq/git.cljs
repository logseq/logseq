;; Auto-generated via `bb libs:generate-cljs-sdk`
(ns com.logseq.git
  (:require [com.logseq.core :as core]))

(def api-proxy (aget js/logseq "Git"))

(defn exec-command
  [args]
  (let [method (aget api-proxy "execCommand")
        args [args]]
    (core/call-method api-proxy method args)))

(defn load-ignore-file
  []
  (let [method (aget api-proxy "loadIgnoreFile")
        args []]
    (core/call-method api-proxy method args)))

(defn save-ignore-file
  [content]
  (let [method (aget api-proxy "saveIgnoreFile")
        args [content]]
    (core/call-method api-proxy method args)))
