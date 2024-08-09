(ns logseq.db.frontend.order
  "Use fractional-indexing order for blocks/properties/closed values/etc."
  (:require [logseq.clj-fractional-indexing :as index]
            [datascript.core :as d]))

(defonce *max-key (atom nil))

(defn reset-max-key!
  ([key]
   (reset-max-key! *max-key key))
  ([max-key-atom key]
   (when (and key (or (nil? @max-key-atom)
                     (> (compare key @max-key-atom) 0)))
    (reset! max-key-atom key))))

(defn gen-key
  ([]
   (gen-key @*max-key nil))
  ([end]
   (gen-key @*max-key end))
  ([start end & {:keys [max-key-atom]
                 :or {max-key-atom *max-key}}]
   (let [k (index/generate-key-between start end)]
     (reset-max-key! max-key-atom k)
     k)))

(defn get-max-order
  [db]
  (:v (first (d/rseek-datoms db :avet :block/order))))

(defn gen-n-keys
  [n start end & {:keys [max-key-atom]
                  :or {max-key-atom *max-key}}]
  (let [ks (index/generate-n-keys-between start end n)]
    (reset-max-key! max-key-atom (last ks))
    ks))

(defn validate-order-key?
  [key]
  (index/validate-order-key key index/base-62-digits)
  true)

(defn get-prev-order
  [db property value-id]
  (let [value (d/entity db value-id)]
    (if property
      (let [values (->> (:property/closed-values property)
                        reverse)]
        (some (fn [e]
                (when (and (< (compare (:block/order e) (:block/order value)) 0)
                           (not= (:db/id e) (:db/id value)))
                  (:block/order e))) values))
      (let [properties (->> (d/datoms db :avet :block/type "property")
                            (map (fn [d] (d/entity db (:e d))))
                            (sort-by :block/order)
                            reverse)]
        (some (fn [property]
                (when (and (< (compare (:block/order property) (:block/order value)) 0)
                           (not= (:db/id property) (:db/id value)))
                  (:block/order property))) properties)))))

(defn get-next-order
  [db property value-id]
  (let [value (d/entity db value-id)]
    (if property
      (let [values (:property/closed-values property)]
        (some (fn [e]
                (when (and (> (compare (:block/order e) (:block/order value)) 0)
                           (not= (:db/id e) (:db/id value)))
                  (:block/order e))) values))
      (let [properties (->> (d/datoms db :avet :block/type "property")
                            (map (fn [d] (d/entity db (:e d))))
                            (sort-by :block/order))]
        (some (fn [property]
                (when (and (> (compare (:block/order property) (:block/order value)) 0)
                           (not= (:db/id property) (:db/id value)))
                  (:block/order property))) properties)))))
