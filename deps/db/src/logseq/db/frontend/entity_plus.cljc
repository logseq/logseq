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
    (if (and db-based? (= "journal" (:block/type e)))
      (get-journal-title db e)
      (or
       (get (.-kv e) k)
       (let [result (lookup-entity e k default-value)
             parent-title? (:block.temp/parent-title? e)]
         (or
          (let [result' (if (string? result)
                          (db-content/special-id-ref->page-ref result
                                                               (:block/refs e))
                          result)
                parent (when (= (:block/type e) "page")
                         (:logseq.property/parent e))]
            (if (and db-based? parent parent-title?)
              (str (:block/title parent) "/" result')
              result'))
          default-value))))))

(defn- get-block-title-parent-refs
  "Add parent to block ref titles"
  [^Entity e k default-value]
  (let [db (.-db e)
        db-based? (db-based-graph? db)]
    (if (and db-based? (= "journal" (:block/type e)))
      (get-journal-title db e)
      (or
       (get (.-kv e) k)
       (let [result (lookup-entity e :block/title default-value)]
         (or
          (if (string? result)
            (db-content/special-id-ref->page-ref result
                                                 (map (fn [e] (assoc e :block.temp/parent-title? true)) (:block/refs e)))
            result)
          default-value))))))

(defn lookup-kv-then-entity
  ([e k] (lookup-kv-then-entity e k nil))
  ([^Entity e k default-value]
   (try
     (when k
       (case k
         :block/raw-title
         (let [db (.-db e)]
           (if (and (db-based-graph? db) (= "journal" (:block/type e)))
             (get-journal-title db e)
             (lookup-entity e :block/title default-value)))

         :block/properties
         (let [db (.-db e)]
           (if (db-based-graph? db)
             (lookup-entity e :block/properties
                            (->> (into {} e)
                                 (filter (fn [[k _]] (db-property/property? k)))
                                 (into {})))
             (lookup-entity e :block/properties nil)))

         :block/title
         (get-block-title e k default-value)

         :block/title-with-refs-parent
         (get-block-title-parent-refs e k default-value)

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

         (or (get (.-kv e) k)
             (lookup-entity e k default-value))))
     (catch :default e
       (js/console.error e)))))

(defn- cache-with-kv
  [^js this]
  (let [v @(.-cache this)
        v' (if (:block/title v)
             (assoc v :block/title (db-content/special-id-ref->page-ref (:block/title v) (:block/refs this)))
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
