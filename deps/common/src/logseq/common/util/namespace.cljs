(ns logseq.common.util.namespace
  "Util fns for namespace and parent features"
  (:require [clojure.string :as string]
            [logseq.common.util :as common-util]))

;; Only used by DB graphs
(defonce parent-char "/")
(defonce parent-re #"/")
;; Used by DB and file graphs
(defonce namespace-char "/")

(defn namespace-page?
  "Used by DB and file graphs"
  [page-name]
  (and (string? page-name)
       (string/includes? page-name namespace-char)
       (not= (string/trim page-name) namespace-char)
       (not (string/starts-with? page-name "../"))
       (not (string/starts-with? page-name "./"))
       (not (common-util/url? page-name))))