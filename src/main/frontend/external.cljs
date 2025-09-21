(ns frontend.external
  "Handles importing from external services"
  (:require [frontend.external.roam :refer [->Roam]]
            [frontend.external.protocol :as protocol]))

(defonce roam-record (->Roam))

(defn get-record
  [type]
  (case type
    :roam
    roam-record
    nil))

(defn to-markdown-files
  [type content config]
  (when-let [record (get-record (keyword type))]
    (protocol/toMarkdownFiles record content config)))
