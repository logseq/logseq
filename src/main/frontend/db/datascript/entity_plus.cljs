(ns frontend.db.datascript.entity-plus
  "Add map ops such as assoc/dissoc to datascript Entity"
  (:require [datascript.impl.entity :as entity :refer [Entity]]
            [datascript.core :as d]
            [cljs.core]))

(def lookup-entity @#'entity/lookup-entity)
(defn lookup-kv-then-entity
  ([e k] (lookup-kv-then-entity e k nil))
  ([^Entity e k default-value]
   (or (get (.-kv e) k)
       (lookup-entity e k default-value))))

(extend-type Entity
  cljs.core/IEncodeJS
  (-clj->js [this] nil)                 ; avoid `clj->js` overhead when entity was passed to rum components

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
      this))

  ILookup
  (-lookup
    ([this attr] (lookup-kv-then-entity this attr))
    ([this attr not-found] (lookup-kv-then-entity this attr not-found))))
