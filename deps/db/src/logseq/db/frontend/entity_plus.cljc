(ns logseq.db.frontend.entity-plus
  "Add map ops such as assoc/dissoc to datascript Entity.

   NOTE: This doesn't work for nbb/sci yet because of https://github.com/babashka/sci/issues/639"
  ;; Disable clj linters since we don't support clj
  #?(:clj {:clj-kondo/config {:linters {:unresolved-namespace {:level :off}
                                        :unresolved-symbol {:level :off}}}})
  (:require [cljs.core]
            [datascript.impl.entity :as entity :refer [Entity]]
            [logseq.db.frontend.content :as db-content]))

(def lookup-entity @#'entity/lookup-entity)
(defn lookup-kv-then-entity
  ([e k] (lookup-kv-then-entity e k nil))
  ([^Entity e k default-value]
   (cond
     (= k :block/raw-content)
     (lookup-entity e :block/content default-value)

     (= k :block/content)
     (let [result (lookup-entity e k default-value)
           refs (:block/refs e)
           tags (:block/tags e)]
       (or
        (when (string? result)
          (db-content/special-id->page result (distinct (concat refs tags))))
        default-value))

     :else
     (or (get (.-kv e) k)
         (lookup-entity e k default-value)))))

#?(:org.babashka/nbb
   nil
   :default
   (extend-type Entity
     cljs.core/IEncodeJS
     (-clj->js [_this] nil)                 ; avoid `clj->js` overhead when entity was passed to rum components

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
     (-conj [this entry]
       (if (vector? entry)
         (let [[k v] entry]
           (-assoc this k v))
         (reduce (fn [this [k v]]
                   (-assoc this k v)) this entry)))

     ILookup
     (-lookup
       ([this attr] (lookup-kv-then-entity this attr))
       ([this attr not-found] (lookup-kv-then-entity this attr not-found)))))
