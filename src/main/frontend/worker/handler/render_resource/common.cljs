(ns frontend.worker.handler.render-resource.common
  "Shared validation and serialization helpers for renderer resources."
  (:require [datascript.core :as d]
            [datascript.impl.entity :as de]))

(defn fail!
  [message data]
  (throw (ex-info message data)))

(defn function-bearing?
  [value]
  (cond
    (fn? value)
    true

    (de/entity? value)
    false

    (map? value)
    (or (some function-bearing? (keys value))
        (some function-bearing? (vals value)))

    (coll? value)
    (some function-bearing? value)

    :else
    false))

(defn entity-bearing?
  [value]
  (cond
    (de/entity? value)
    true

    (map? value)
    (or (some entity-bearing? (keys value))
        (some entity-bearing? (vals value)))

    (coll? value)
    (some entity-bearing? value)

    :else
    false))

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

(defn envelope
  [db resource-key watch-keys value]
  {:basis-rev (basis-rev db)
   :key resource-key
   :watch-keys watch-keys
   :value value})
