(ns logseq.melange.bridge.platform.datascript-entity
  "Primitive DataScript Entity construction and CLJS protocol adapter."
  (:require #?(:org.babashka/nbb [datascript.db])
            [cljs.core]
            [datascript.core :as d]
            [datascript.impl.entity :as entity :refer [Entity]]))

(def entity d/entity)
(def datoms d/datoms)
(def lookup-entity @#'entity/lookup-entity)

(defn unsafe-entity
  [db entity-id]
  {:pre [(pos-int? entity-id)]}
  (Entity. db entity-id (volatile! false) (volatile! {})))

(defn entity?
  [value]
  (instance? Entity value))

(defn- cache-with-kv
  [^js this]
  (let [value @(.-cache this)]
    (concat (seq value) (seq (.-kv this)))))

(defn- ->printable
  [value]
  (cond
    (entity? value)
    {:db/id (.-eid ^js value)}

    (map? value)
    (reduce-kv (fn [result key nested]
                 (assoc result key (->printable nested)))
               {} value)

    (sequential? value)
    (map ->printable value)

    (set? value)
    (into #{} (map ->printable value))

    :else value))

#?(:org.babashka/nbb
   (defn install-protocols! [_lookup])
   :default
   (do
     (defn- configured-lookup
       [entity attribute not-found]
       ((.-logseqLookup (.-prototype ^js Entity)) entity attribute not-found))

     (extend-type Entity
       cljs.core/IEncodeJS
       (-clj->js [_this] nil)
       (-key->js [_this] nil)

       IAssociative
       (-assoc [this key value]
         (assert (keyword? key) "attribute must be keyword")
         (set! (.-kv this) (assoc (.-kv this) key value))
         this)
       (-contains-key? [value key]
         (not= ::not-found (configured-lookup value key ::not-found)))

       IMap
       (-dissoc [this key]
         (assert (keyword? key) (str "attribute must be keyword: " key))
         (set! (.-kv this) (dissoc (.-kv this) key))
         this)

       ISeqable
       (-seq [this]
         (entity/touch this)
         (cache-with-kv this))

       IPrintWithWriter
       (-pr-writer [this writer opts]
         (entity/touch this)
         (let [base (into {} (cache-with-kv this))
               printable (-> (reduce-kv (fn [result key value]
                                          (assoc result key (->printable value)))
                                        {} base)
                             (assoc :db/id (.-eid this)))]
           (-pr-writer printable writer opts)))

       ICollection
       (-conj [this entry]
         (if (vector? entry)
           (let [[key value] entry]
             (-assoc this key value))
           (reduce (fn [result [key value]]
                     (-assoc result key value))
                   this entry)))

       ILookup
       (-lookup
         ([this attribute]
          (configured-lookup this attribute nil))
         ([this attribute not-found]
          (configured-lookup this attribute not-found))))

     (defn install-protocols!
       [lookup]
       (set! (.-logseqLookup (.-prototype ^js Entity)) lookup))))
