(ns frontend.db.datascript.entity-plus
  "Add map ops such as assoc/dissoc to datascript Entity"
  (:require [datascript.impl.entity :as entity :refer [Entity]]
            [datascript.core :as d]))

(defn lookup-kv-then-entity
  ([e k] (lookup-kv-then-entity e k nil))
  ([^Entity e k default-value]
   (if-let [[_ v] (get (.-kv e) k)]
     v
     (get e k default-value))))

(extend-type Entity
  IAssociative
  (-assoc [this k v]
    (assert (keyword? k) "attribute must be keyword")
    (set! (.-kv this) (assoc (.-kv this) k v))
    this)
  (-contains-key? [e k] (not= ::nf (lookup-kv-then-entity e k ::nf)))

  IMap
  (-dissoc [this k]
    (assert (keyword? k) "attribute must be keyword")
    (set! (.-kv this) (dissoc (.-kv this) k))
    this)

  ICollection
  (-conj [this kv]
    (if (map? kv)
      (reduce (fn [this [k v]]
                (assoc this k v)) this kv)
      this)))
