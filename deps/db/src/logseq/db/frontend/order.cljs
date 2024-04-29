(ns logseq.db.frontend.order
  "Use fractional-indexing order for blocks/properties/closed values/etc."
  (:require ["fractional-indexing" :as index]
            [goog.object :as gobj]
            [datascript.core :as d]))

(defonce *max-key (atom nil))

(defn reset-max-key!
  [key]
  (when (and key (or (nil? @*max-key)
                     (> (compare key @*max-key) 0)))
    (reset! *max-key key)))

(defn gen-key
  ([end]
   (gen-key @*max-key end))
  ([start end]
   (let [k ((gobj/get index "generateKeyBetween") start end)]
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

(comment
  (defn gen-n-keys
    [n start end]
    (let [ks (js->clj ((gobj/get index "generateNKeysBetween") start end n))]
      (reset! *max-key (last ks))
      ks))

  )
