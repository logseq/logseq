(ns logseq.db.common.view-order
  "Persistent row positions for table views. All stored identities are UUIDs."
  (:require [datascript.impl.entity :as de]))

(defn group-value
  "Use the same group identity in storage, worker responses, and drag targets."
  [value]
  (cond
    (nil? value) {:kind :empty}
    (and (or (map? value) (de/entity? value)) (:block/uuid value))
    {:kind :entity :uuid (:block/uuid value)}
    (coll? value) (throw (ex-info "Invalid table group value" {:value value}))
    :else {:kind :scalar :value value}))

(defn- uuid-order?
  [order]
  (and (vector? order) (every? uuid? order)
       (= (count order) (count (set order)))))

(defn require-order!
  [order]
  (when-not (and (map? order)
                (= #{:flat :groups} (set (keys order)))
                (uuid-order? (:flat order))
                (map? (:groups order))
                (every? (fn [[property groups]]
                          (and (qualified-keyword? property) (map? groups)
                               (every? uuid-order? (vals groups))))
                        (:groups order)))
    (throw (ex-info "Invalid table sort order" {:sort-order order})))
  order)

(defn table-order
  [view]
  (when-some [order (:logseq.property.table/sort-order view)]
    (when (contains? #{nil :logseq.property.view/type.table}
                     (:db/ident (:logseq.property.view/type view)))
      (require-order! order))))

(defn positions
  [order group-property value]
  (if group-property
    (get-in order [:groups group-property (group-value value)] (:flat order))
    (:flat order)))

(defn order-entities
  "Keep saved positions and append new rows in stable creation order."
  [entities order]
  (let [by-uuid (into {} (map (juxt :block/uuid identity)) entities)
        saved (set order)
        added (sort-by (juxt :block/created-at (comp str :block/uuid))
                       (remove #(saved (:block/uuid %)) entities))]
    (into (into [] (keep by-uuid) order) added)))

(defn insert-row
  [rows row-uuid anchor-uuid placement]
  (let [remaining (into [] (remove #{row-uuid}) rows)
        index (if anchor-uuid
                (.indexOf remaining anchor-uuid)
                (count remaining))]
    (when (or (neg? index) (not (contains? #{:before :after :end} placement)))
      (throw (ex-info "Invalid table drop anchor" {:anchor anchor-uuid :placement placement})))
    (let [index (if (and anchor-uuid (= :after placement)) (inc index) index)]
      (into (conj (subvec remaining 0 index) row-uuid) (subvec remaining index)))))

(defn replace-visible-slots
  "Reorder a filtered subset without moving any hidden row."
  [all-rows visible reordered]
  (let [visible-set (set visible)
        remaining (volatile! (seq reordered))]
    (mapv (fn [row]
            (if (visible-set row)
              (let [next-row (first @remaining)]
                (vswap! remaining next)
                next-row)
              row))
          all-rows)))
