(ns logseq.db.frontend.order
  "Use fractional-indexing order for blocks/properties/closed values/etc."
  (:require [logseq.common.fractional-index :as index]
            [datascript.core :as d]))

(defonce *max-key (atom nil))

(defn reset-max-key!
  [key]
  (when (and key (or (nil? @*max-key)
                     (> (compare key @*max-key) 0)))
    (reset! *max-key key)))

(defn gen-key
  ([]
   (gen-key @*max-key nil))
  ([end]
   (gen-key @*max-key end))
  ([start end]
   (let [k (index/generate-key-between start end)]
     (reset-max-key! k)
     k)))

(defn get-max-order
  [db]
  (:v (first (d/rseek-datoms db :avet :block/order))))

(defn get-prev-order
  [db current-key]
  (:v (second (d/rseek-datoms db :avet :block/order current-key))))

(defn get-next-order
  [db current-key]
  (:v (second (d/seek-datoms db :avet :block/order current-key))))

(defn gen-n-keys
  [n start end]
  (let [ks (index/generate-n-keys-between start end n)]
    (reset! *max-key (last ks))
    ks))
