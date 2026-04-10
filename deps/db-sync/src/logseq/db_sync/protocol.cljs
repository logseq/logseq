(ns logseq.db-sync.protocol
  (:require [clojure.walk :as walk]
            [logseq.db-sync.common :as common]))

(defn- stringify-uuid
  [value]
  (if (uuid? value)
    (str value)
    value))

(defn parse-message [raw]
  (try
    (let [data (js->clj (js/JSON.parse raw) :keywordize-keys true)]
      (when (map? data)
        data))
    (catch :default _
      nil)))

(defn encode-message [m]
  (js/JSON.stringify
   (clj->js (walk/postwalk stringify-uuid m))))

(defn transit->tx [value]
  (common/read-transit value))

(defn tx->transit [tx-data]
  (common/write-transit tx-data))
