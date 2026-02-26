(ns logseq.db-sync.node.routes
  (:require [clojure.string :as string]))

(defn parse-sync-path [path]
  (when (string/starts-with? path "/sync/")
    (let [rest-path (subs path (count "/sync/"))
          rest-path (if (string/starts-with? rest-path "/")
                      (subs rest-path 1)
                      rest-path)
          slash-idx (or (string/index-of rest-path "/") -1)
          graph-id (if (neg? slash-idx) rest-path (subs rest-path 0 slash-idx))
          tail (if (neg? slash-idx)
                 "/"
                 (subs rest-path slash-idx))]
      {:graph-id graph-id
       :tail tail})))
