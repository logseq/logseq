(ns frontend.worker.plain-value
  "Plain value conversion helpers for db worker responses."
  (:require [clojure.string :as string]
            [clojure.walk :as walk]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.db :as ldb]))

(defn- ref-value->summary
  [db value]
  (if-let [entity (d/entity db value)]
    (let [raw-title (or (:block/raw-title entity) (:block/title entity))
          tag-idents (into []
                           (keep (fn [datom]
                                   (:db/ident (d/entity db (:v datom)))))
                           (d/datoms db :eavt (:db/id entity) :block/tags))]
      (cond-> {:db/id (:db/id entity)}
        (seq tag-idents)
        (assoc :block/tags tag-idents)
        (:block/uuid entity)
        (assoc :block/uuid (:block/uuid entity))
        raw-title
        (assoc :block/title raw-title
               :block/raw-title raw-title)
        (:block/name entity)
        (assoc :block/name (:block/name entity))
        (:block/journal-day entity)
        (assoc :block/journal-day (:block/journal-day entity))
        (:logseq.property/icon entity)
        (assoc :logseq.property/icon (:logseq.property/icon entity))
        (:logseq.property/choice-checkbox-state entity)
        (assoc :logseq.property/choice-checkbox-state (:logseq.property/choice-checkbox-state entity))
        (:db/ident entity)
        (assoc :db/ident (:db/ident entity))))
    {:db/id value}))

(defn- ref-attr?
  [db attr]
  (= :db.type/ref
     (or (get-in (d/schema db) [attr :db/valueType])
         (:db/valueType (d/entity db attr)))))

(defn- many-attr?
  [db attr]
  (= :db.cardinality/many
     (or (get-in (d/schema db) [attr :db/cardinality])
         (:db/cardinality (d/entity db attr)))))

(defn- datom-value->plain
  [db attr value]
  (if (ref-attr? db attr)
    (ref-value->summary db value)
    value))

(defn- number->letters
  [n]
  (when (pos? n)
    (loop [n n
           result ""]
      (if (pos? n)
        (let [offset (mod (dec n) 26)
              ch (.fromCharCode js/String (+ 65 offset))]
          (recur (quot (- n offset) 26) (str ch result)))
        result))))

(defn- number->roman
  [n]
  (when (pos? n)
    (let [pairs [[1000 "M"] [900 "CM"] [500 "D"] [400 "CD"]
                 [100 "C"] [90 "XC"] [50 "L"] [40 "XL"]
                 [10 "X"] [9 "IX"] [5 "V"] [4 "IV"] [1 "I"]]]
      (loop [n n
             [[value numeral] & more] pairs
             result ""]
        (cond
          (zero? n) result
          (>= n value) (recur (- n value) pairs (str result numeral))
          :else (recur n more result))))))

(defn- order-list-type
  [block]
  (some-> (:logseq.property/order-list-type block)
          str
          string/lower-case))

(def ^:private unsafe-plain-attrs
  #{:block/properties
    :block/properties-text-values})

(defn- order-list-index
  [block target-order-list-type]
  (let [order-block? (fn [block]
                       (= target-order-list-type (order-list-type block)))
        prev-block-fn ldb/get-left-sibling
        prev-block (prev-block-fn block)]
    (letfn [(order-sibling-list [b]
              (lazy-seq
               (when (order-block? b)
                 (cons b (order-sibling-list (prev-block-fn b))))))
            (order-parent-list [b]
              (lazy-seq
               (when (order-block? b)
                 (cons b (order-parent-list (:block/parent b))))))]
      (let [idx (if prev-block
                  (count (order-sibling-list block))
                  1)
            order-parents-count (dec (count (order-parent-list block)))
            delta (if (neg? order-parents-count) 0 (mod order-parents-count 3))]
        (cond
          (zero? delta) idx
          (= delta 1) (some-> (number->letters idx) string/lower-case)
          :else (number->roman idx))))))

(defn entity-forward-map
  [db entity {:keys [properties]}]
  (when entity
    (let [property-set (some-> properties set)
          raw-title (or (:block/raw-title entity)
                        (:block/title entity)
                        (:block/name entity))
          list-type (order-list-type entity)
          datoms (cond->> (d/datoms db :eavt (:db/id entity))
                   true
                   (remove #(contains? unsafe-plain-attrs (:a %)))

                   (seq property-set)
                   (filter #(contains? property-set (:a %))))
          result (reduce
                  (fn [m {:keys [a v]}]
                    (let [v' (datom-value->plain db a v)]
                      (if (many-attr? db a)
                        (update m a (fnil conj []) v')
                        (assoc m a v'))))
                  {:db/id (:db/id entity)}
                  datoms)]
      (cond-> result
        raw-title
        (assoc :block/title raw-title
               :block/raw-title raw-title)

        list-type
        (assoc :block.temp/order-list-index
               (order-list-index entity list-type))))))

(defn- ref-db-id
  [value]
  (cond
    (map? value) (:db/id value)
    (integer? value) value
    :else nil))

(defn- ref-uuid
  [value]
  (when (map? value)
    (:block/uuid value)))

(defn- ref-ident
  [value]
  (when (map? value)
    (:db/ident value)))

(defn- with-explicit-ref-fields
  [m]
  (let [alias-source (first (:block/_alias m))]
    (cond-> m
      (contains? m :block/parent)
      (assoc :block/parent-id (ref-db-id (:block/parent m))
             :block/parent-uuid (ref-uuid (:block/parent m)))

      (contains? m :block/page)
      (assoc :block/page-id (ref-db-id (:block/page m))
             :block/page-uuid (ref-uuid (:block/page m))
             :block/page-name (when (map? (:block/page m))
                                (:block/name (:block/page m))))

      (contains? m :block/link)
      (assoc :block/link-id (ref-db-id (:block/link m)))

      (contains? m :logseq.property/query)
      (assoc :logseq.property/query-id (ref-db-id (:logseq.property/query m)))

      (contains? m :logseq.property/view-for)
      (assoc :logseq.property/view-for-id (ref-db-id (:logseq.property/view-for m)))

      (contains? m :logseq.property.view/type)
      (assoc :logseq.property.view/type-id (ref-db-id (:logseq.property.view/type m))
             :logseq.property.view/type-ident (ref-ident (:logseq.property.view/type m)))

      (contains? m :logseq.property.view/gallery-asset-property)
      (assoc :logseq.property.view/gallery-asset-property-ident
             (ref-ident (:logseq.property.view/gallery-asset-property m)))

      (contains? m :logseq.property/_view-for)
      (assoc :logseq.property/views (:logseq.property/_view-for m))

      (contains? m :block/_alias)
      (assoc :block/alias-source-page-id (ref-db-id alias-source)
             :block/alias-source-page-uuid (ref-uuid alias-source)
             :block/alias-source-page-class? (boolean (and alias-source
                                                           (ldb/class? alias-source))))

      (contains? m :logseq.property/_query)
      (assoc :logseq.property/query-block? (seq (:logseq.property/_query m)))

      (contains? m :logseq.property.comments/_blocks)
      (assoc :block/comment-threads (:logseq.property.comments/_blocks m))

      (contains? m :logseq.property/description)
      (assoc :logseq.property/description-title
             (when (map? (:logseq.property/description m))
               (:block/title (:logseq.property/description m))))

      (contains? m :logseq.property.recycle/original-page)
      (assoc :logseq.property.recycle/original-page-title
             (when (map? (:logseq.property.recycle/original-page m))
               (:block/title (:logseq.property.recycle/original-page m)))))))

(defn with-explicit-ref-fields-recursive
  [form]
  (walk/postwalk
   (fn [value]
     (if (map? value)
       (with-explicit-ref-fields value)
       value))
   form))

(declare worker-plain-value)

(defn- worker-plain-map
  [db m]
  (with-explicit-ref-fields
    (persistent!
     (reduce-kv
      (fn [result k v]
        (assoc! result k (worker-plain-value db v)))
      (transient {})
      m))))

(defn worker-plain-value
  [db value]
  (cond
    (de/entity? value)
    (worker-plain-map db (entity-forward-map db value {}))

    (map? value)
    (worker-plain-map db value)

    (vector? value)
    (mapv #(worker-plain-value db %) value)

    (set? value)
    (set (map #(worker-plain-value db %) value))

    (sequential? value)
    (mapv #(worker-plain-value db %) value)

    :else
    value))
