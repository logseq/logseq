(ns logseq.db.frontend.entity-plus
  "Add map ops such as assoc/dissoc to datascript Entity.

   NOTE: This doesn't work for nbb/sci yet because of https://github.com/babashka/sci/issues/639"
  ;; Disable clj linters since we don't support clj
  #?(:clj {:clj-kondo/config {:linters {:unresolved-namespace {:level :off}
                                        :unresolved-symbol {:level :off}}}})
  (:require #?(:org.babashka/nbb [datascript.db])
            [cljs.core]
            [clojure.data :as data]
            [datascript.core :as d]
            [datascript.impl.entity :as entity :refer [Entity]]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.frontend.property :as db-property]))

(def nil-db-ident-entities
  "No such entities with these :db/ident, but `(d/entity <db> <ident>)` has been called somewhere."
  #{:block/tx-id :block/warning :block/pre-block? :block/uuid :block/scheduled
    :block/deadline :block/journal-day :block/level :block/heading-level
    :block/type :block/name :block/marker :block/_refs

    :block.temp/ast-title :block.temp/top? :block.temp/bottom? :block.temp/search?
    :block.temp/fully-loaded? :block.temp/ast-body

    :db/valueType :db/cardinality :db/ident :db/index

    :logseq.property/_query})

(def immutable-db-ident-entities
  "These db-ident entities are immutable,
  it means `(db/entity :block/title)` always return same result"
  #{:block/link :block/updated-at :block/refs :block/closed-value-property
    :block/created-at :block/collapsed? :block/tags :block/title
    :block/path-refs :block/parent :block/order :block/page

    :logseq.property/created-from-property
    :logseq.property/icon
    :logseq.property.asset/type
    :logseq.property.asset/checksum
    :logseq.property.node/display-type

    :logseq.kv/db-type})

(assert (empty? (last (data/diff immutable-db-ident-entities nil-db-ident-entities))))

(def ^:private lookup-entity @#'entity/lookup-entity)

(def ^:private *seen-immutable-entities (volatile! {}))

(defn reset-immutable-entities-cache!
  []
  (vreset! *seen-immutable-entities {}))

(def ^:private *reset-cache-background-task-running?
  ;; missionary is not compatible with nbb, so entity-memoized is disabled in nbb
  (delay
    ;; FIXME: Correct dependency ordering instead of resolve workaround
    #?(:org.babashka/nbb false
       :cljs (when-let [f (resolve 'frontend.common.missionary/background-task-running?)]
               (f :logseq.db.frontend.entity-plus/reset-immutable-entities-cache!)))))

(defn entity-memoized
  [db eid]
  (if (qualified-keyword? eid)
    (when-not (contains? nil-db-ident-entities eid) ;fast return nil
      (if (and @*reset-cache-background-task-running?
               (contains? immutable-db-ident-entities eid)) ;return cache entity if possible which isn't nil
        (or (get @*seen-immutable-entities eid)
            (let [r (d/entity db eid)]
              (when r (vswap! *seen-immutable-entities assoc eid r))
              r))
        (d/entity db eid)))
    (d/entity db eid)))

(defn db-based-graph?
  "Whether the current graph is db-only"
  [db]
  (when db
    (= "db" (:kv/value (entity-memoized db :logseq.kv/db-type)))))

(defn- get-journal-title
  [db e]
  (date-time-util/int->journal-title (:block/journal-day e)
                                     (:logseq.property.journal/title-format (entity-memoized db :logseq.class/Journal))))

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
                         ;; FIXME: Correct namespace dependencies instead of resolve workaround
                         ((resolve 'logseq.db.frontend.content/id-ref->title-ref) result refs search?)
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
         (when-let [property (entity-memoized db k)]
           (let [property-type (lookup-entity property :logseq.property/type nil)]
             (if (= :checkbox property-type)
               (lookup-entity property :logseq.property/scalar-default-value nil)
               (lookup-entity property :logseq.property/default-value nil)))))))))

(defn- get-property-keys
  [^Entity e]
  (let [db (.-db e)]
    (if (db-based-graph? db)
      (->> (map :a (d/datoms db :eavt (.-eid e)))
           distinct
           (filter db-property/property?))
      (keys (lookup-entity e :block/properties nil)))))

(defn- get-properties
  [^Entity e]
  (let [db (.-db e)]
    (if (db-based-graph? db)
      (lookup-entity e :block/properties
                     (->> (into {} e)
                          (filter (fn [[k _]] (db-property/property? k)))
                          (into {})))
      (lookup-entity e :block/properties nil))))

;; (defonce *id->k-frequency (atom {}))
(defn lookup-kv-then-entity
  ([e k] (lookup-kv-then-entity e k nil))
  ([^Entity e k default-value]
   (try
     (when k
       ;; (swap! *id->k-frequency update-in [(.-eid e) k] inc)
       (let [db (.-db e)]
         (case k
           :block/raw-title
           (if (and (db-based-graph? db) (entity-util/journal? e))
             (get-journal-title db e)
             (lookup-entity e :block/title default-value))

           :block/properties
           (get-properties e)

           :block.temp/property-keys
           (get-property-keys e)

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
             (assoc v :block/title
                    ((resolve 'logseq.db.frontend.content/id-ref->title-ref)
                     (:block/title v) (:block/refs this) (:block.temp/search? this)))
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
