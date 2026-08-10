(ns frontend.worker.handler.render-resource.common
  "Shared validation and serialization helpers for renderer resources."
  (:require [datascript.core :as d]
            [datascript.impl.entity :as de]))

(def watch-all ::watch-all)

(defn fail!
  [message data]
  (throw (ex-info message data)))

(defn renderer
  "Describe a renderer and its fixed resource-key arity."
  [shape render]
  {:shape shape
   :render render})

(defn invalid-resource-key-value
  [value]
  (cond
    (fn? value) :function
    (de/entity? value) :entity
    (map? value) (or (some invalid-resource-key-value (keys value))
                     (some invalid-resource-key-value (vals value)))
    (coll? value) (some invalid-resource-key-value value)
    :else false))

(defn require-shape!
  [resource-key tag size]
  (when-not (and (vector? resource-key)
                 (= tag (first resource-key))
                 (= size (count resource-key)))
    (fail! "Invalid renderer resource key"
           {:resource-key resource-key
            :expected-tag tag
            :expected-size size})))

(defn require-uuid!
  [label value]
  (when-not (uuid? value)
    (fail! "Invalid renderer resource UUID" {label value}))
  value)

(defn entity-by-uuid!
  [db label value]
  (require-uuid! label value)
  (or (d/entity db [:block/uuid value])
      (fail! "Missing renderer resource entity" {label value})))

(defn entity-uuid!
  [db eid]
  (let [block-uuid (:block/uuid (d/entity db eid))]
    (when-not (uuid? block-uuid)
      (fail! "Renderer resource row has no UUID" {:db-id eid}))
    block-uuid))

(defn basis-rev
  [db]
  (let [rev (:max-tx db)]
    (when-not (and (integer? rev) (not (neg? rev)))
      (fail! "Invalid renderer resource revision" {:basis-rev rev}))
    rev))

(defn block-slots
  [blocks]
  (into {}
        (map (fn [[block-uuid block]]
               [[:block block-uuid]
                {:value block}]))
        blocks))

(defn block-bundle-slots
  [{:keys [blocks children]}]
  (into (block-slots blocks)
        (map (fn [[parent-uuid membership]]
               [[:children parent-uuid]
                {:tx-id (:parent-tx-id membership)
                 :items (:items membership)}]))
        children))
