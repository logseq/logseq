(ns logseq.db.common.order
  "Use fractional-indexing order for blocks/properties/closed values/etc.
   Used by DB and file graphs"
  (:require [datascript.core :as d]
            [logseq.clj-fractional-indexing :as index]
            [logseq.db.frontend.entity-util :as entity-util]))

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

(defn missing-internal-page-parent-order-tx
  "Namespace import and older graphs can set :block/parent without :block/order.
  Only repair internal pages so class pages that share the same rewrite stay unordered.
  Insertion boundary uses every direct child so repaired page orders do not
  collide with content-block siblings."
  [db]
  (->> (d/datoms db :avet :block/parent)
       (map (fn [d] (d/entity db (:e d))))
       (group-by :block/parent)
       (mapcat
        (fn [[_parent children]]
          (let [missing (->> children
                             (filter entity-util/internal-page?)
                             (remove #(string? (:block/order %)))
                             vec)
                max-order (->> children
                               (keep :block/order)
                               (filter string?)
                               sort
                               last)]
            (when (seq missing)
              (map (fn [child order]
                     {:db/id (:db/id child)
                      :block/order order})
                   missing
                   (gen-n-keys (count missing) max-order nil))))))))

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
      (let [properties (->> (d/datoms db :avet :block/tags :logseq.class/Property)
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
      (let [properties (->> (d/datoms db :avet :block/tags :logseq.class/Property)
                            (map (fn [d] (d/entity db (:e d))))
                            (sort-by :block/order))]
        (some (fn [property]
                (when (and (> (compare (:block/order property) (:block/order value)) 0)
                           (not= (:db/id property) (:db/id value)))
                  (:block/order property))) properties)))))
