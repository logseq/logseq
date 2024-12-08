(ns logseq.db.frontend.entity-plus
  "Add map ops such as assoc/dissoc to datascript Entity.

   NOTE: This doesn't work for nbb/sci yet because of https://github.com/babashka/sci/issues/639"
  ;; Disable clj linters since we don't support clj
  #?(:clj {:clj-kondo/config {:linters {:unresolved-namespace {:level :off}
                                        :unresolved-symbol {:level :off}}}})
  (:require [cljs.core]
            #?(:org.babashka/nbb [datascript.db])
            [datascript.impl.entity :as entity :refer [Entity]]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.common.util.date-time :as date-time-util]
            [datascript.core :as d]))

(def db-based-graph? entity-util/db-based-graph?)

(def lookup-entity @#'entity/lookup-entity)

(defn- get-journal-title
  [db e]
  (date-time-util/int->journal-title (:block/journal-day e)
                                     (:logseq.property.journal/title-format (d/entity db :logseq.class/Journal))))

(defn- get-block-title
  [^Entity e k default-value]
  (let [db (.-db e)
        db-based? (db-based-graph? db)]
    (if (and db-based? (entity-util/journal? e))
      (get-journal-title db e)
      (let [search? (get (.-kv e) :block.temp/search?)]
        (or
         (when-not (and search? (= k :block/title))
           (get (.-kv e) k))
         (let [result (lookup-entity e k default-value)
               refs (:block/refs e)
               result' (if (and (string? result) refs)
                         (db-content/id-ref->title-ref result refs search?)
                         result)]
           (or result' default-value)))))))

(defn- lookup-kv-with-default-value
  [db ^Entity e k default-value]
  (or
   ;; from kv
   (get (.-kv e) k)
   ;; from db
   (let [result (lookup-entity e k default-value)]
     (if (some? result)
       result
       ;; property default value
       (when (qualified-keyword? k)
         (when-let [property (d/entity db k)]
           (let [schema (lookup-entity property :block/schema nil)]
             (if (= :checkbox (:type schema))
               (lookup-entity property :logseq.property/scalar-default-value nil)
               (lookup-entity property :logseq.property/default-value nil)))))))))

(defn lookup-kv-then-entity
  ([e k] (lookup-kv-then-entity e k nil))
  ([^Entity e k default-value]
   (try
     (when k
       (let [db (.-db e)]
         (case k
           :block/raw-title
           (if (and (db-based-graph? db) (entity-util/journal? e))
             (get-journal-title db e)
             (lookup-entity e :block/title default-value))

           :block/properties
           (if (db-based-graph? db)
             (lookup-entity e :block/properties
                            (->> (into {} e)
                                 (filter (fn [[k _]] (db-property/property? k)))
                                 (into {})))
             (lookup-entity e :block/properties nil))

           ;; cache :block/title
           :block/title
           (or (when-not (get (.-kv e) :block.temp/search?)
                 (:block.temp/cached-title @(.-cache e)))
               (let [title (get-block-title e k default-value)]
                 (vreset! (.-cache e) (assoc @(.-cache e)
                                             :block.temp/cached-title title))
                 title))

           :block/_parent
           (->> (lookup-entity e k default-value)
                (remove (fn [e] (or (:logseq.property/created-from-property e)
                                    (:block/closed-value-property e))))
                seq)

           :block/_raw-parent
           (lookup-entity e :block/_parent default-value)

           :property/closed-values
           (->> (lookup-entity e :block/_closed-value-property default-value)
                (sort-by :block/order))

           (lookup-kv-with-default-value db e k default-value))))
     (catch :default e
       (js/console.error e)))))

(defn- cache-with-kv
  [^js this]
  (let [v @(.-cache this)
        v' (if (:block/title v)
             (assoc v :block/title (db-content/id-ref->title-ref (:block/title v) (:block/refs this) (:block.temp/search? this)))
             v)]
    (concat (seq v')
            (seq (.-kv this)))))

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
       (assert (keyword? k) (str "attribute must be keyword: " k))
       (set! (.-kv this) (dissoc (.-kv this) k))
       this)

     ISeqable
     (-seq [this]
       (entity/touch this)
       (cache-with-kv this))

     IPrintWithWriter
     (-pr-writer [this writer opts]
       (let [m (-> (into {} (cache-with-kv this))
                   (assoc :db/id (.-eid this)))]
         (-pr-writer m writer opts)))

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
