(ns logseq.db-sync.protocol
  (:require [logseq.db-sync.common :as common]))

(defn parse-message [raw]
  (try
    (let [data (js->clj (js/JSON.parse raw) :keywordize-keys true)]
      (when (map? data)
        data))
    (catch :default _
      nil)))

(defn encode-message [m]
  (js/JSON.stringify (clj->js m)))

(defn transit->tx [value]
  (common/read-transit value))

(defn tx->transit [tx-data]
  (common/write-transit tx-data))

(defn datoms->wire [datoms]
  (->> datoms
       (map (fn [d]
              {:e (:e d)
               :a (:a d)
               :v (:v d)
               :tx (:tx d)
               :added (:added d)}))
       (vec)))
