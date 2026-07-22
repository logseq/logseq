(ns logseq.melange.bridge.db.entity-plus
  "DataScript Entity lookup and protocol representation boundary."
  #?(:clj {:clj-kondo/config {:linters {:unresolved-namespace {:level :off}
                                        :unresolved-symbol {:level :off}}}})
  (:require #?(:org.babashka/nbb ["@logseq/melange-js-api/db" :as melange-db]
               :cljs ["@logseq/melange-js-api/db" :as melange-db])
            [logseq.melange.bridge.platform.datascript :as datascript]
            [logseq.melange.bridge.platform.datascript-entity :as d]
            [logseq.melange.bridge.runtime :as runtime]))

(def ^:private entity-lookup-api (.-EntityLookup melange-db))
(def ^:private entity-lookup-workflow-api (.-EntityLookupWorkflow melange-db))

(def nil-db-ident-entities
  "Idents known not to resolve to DataScript entities."
  (set (map keyword (seq (.-nilIdents entity-lookup-api)))))

(def immutable-db-ident-entities
  "Idents whose DataScript entities are immutable."
  (set (map keyword (seq (.-immutableIdents entity-lookup-api)))))

(def lookup-entity d/lookup-entity)

(defn- lookup-capabilities
  []
  #js {:node (exists? js/process)
       :entityDb (fn [^js entity] (.-db entity))
       :entityEid (fn [^js entity] (.-eid entity))
       :kvGet (fn [^js entity key] (get (.-kv entity) key))
       :lookup lookup-entity})

(defn entity-memoized
  [db eid]
  ((.-memoizedWith entity-lookup-workflow-api)
   (runtime/runtime-adapter)
   (datascript/adapter)
   db
   eid
   (exists? js/process)))

(defn unsafe->Entity
  "Constructs a DataScript Entity without checking whether its id exists."
  [db entity-id]
  (d/unsafe-entity db entity-id))

(defn db-based-graph?
  "Returns true when the immutable graph type entity stores `\"db\"`."
  [db]
  ((.-dbBasedNullableWith entity-lookup-workflow-api)
   (runtime/runtime-adapter)
   (datascript/adapter)
   (lookup-capabilities)
   db))

(defn lookup-kv-then-entity
  ([entity key] (lookup-kv-then-entity entity key nil))
  ([^js entity key default-value]
   ((.-lookupSafeWith entity-lookup-workflow-api)
    (runtime/runtime-adapter)
    (datascript/adapter)
    (lookup-capabilities)
    entity
    key
    default-value
    #(.error js/console %))))

(d/install-protocols! lookup-kv-then-entity)
