;; Auto-generated via `bb libs:generate-cljs-sdk`
(ns logseq.git
  (:require ["@logseq/libs" :as logseq]
            [logseq.core :as core]))

(defn exec-command
  [args]
  (let [method (aget (aget logseq "Git") "execCommand")
        arg-args args
        args [arg-args]]
    (core/call-method method args)))

(defn load-ignore-file
  []
  (let [method (aget (aget logseq "Git") "loadIgnoreFile")
        args []]
    (core/call-method method args)))

(defn save-ignore-file
  [content]
  (let [method (aget (aget logseq "Git") "saveIgnoreFile")
        arg-content content
        args [arg-content]]
    (core/call-method method args)))
