(ns logseq.publish.model)

(defn merge-attr
  [entity attr value]
  (let [existing (get entity attr ::none)]
    (cond
      (= existing ::none) (assoc entity attr value)
      (vector? existing) (assoc entity attr (conj existing value))
      (set? existing) (assoc entity attr (conj existing value))
      :else (assoc entity attr [existing value]))))

(defn datoms->entities
  [datoms]
  (reduce
   (fn [acc datom]
     (let [[e a v _tx added?] datom]
       (if added?
         (update acc e (fn [entity]
                         (merge-attr (or entity {:db/id e}) a v)))
         acc)))
   {}
   datoms))

(defn entity->title
  [entity]
  (or (:block/title entity)
      (:block/name entity)
      (str (:logseq.property/value entity))
      "Untitled"))

(defn page-entity?
  [entity]
  (and (nil? (:block/page entity))
       (or (:block/name entity)
           (:block/title entity))))

(defn ref-eid [value]
  (cond
    (number? value) value
    (map? value) (:db/id value)
    :else nil))
