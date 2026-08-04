(ns frontend.worker.db.metadata-cache
  "Graph-scoped metadata cache for renderer property and class lookups."
  (:require [cljs.cache :as cache]
            [datascript.core :as d]
            [frontend.worker.plain-value :as worker-plain]))

(def ^:private cache-threshold 8)
(def ^:private property-keys
  [:db/id
   :db/ident
   :block/title
   :block/raw-title
   :block/uuid
   :block/name
   :block/order
   :block/tags
   :logseq.property/deleted-at
   :db/cardinality
   :logseq.property/type
   :logseq.property/public?
   :logseq.property/built-in?
   :logseq.property/hide?
   :logseq.property/hide-empty-value
   :logseq.property/ui-position
   :logseq.property/view-context
   :logseq.property/scalar-default-value
   :logseq.property/default-value])
(def ^:private class-keys
  [:db/id :db/ident :block/title :block/raw-title :block/uuid :block/name :block/order])
(def ^:private metadata-attributes
  #{:db/cardinality
    :logseq.property/type
    :logseq.property/public?
    :logseq.property/built-in?
    :logseq.property/hide?
    :logseq.property/hide-empty-value
    :logseq.property/ui-position
    :logseq.property/view-context
    :logseq.property/scalar-default-value
    :logseq.property/default-value
    :logseq.property/classes
    :logseq.property.class/extends
    :logseq.property.class/properties})

(defonce ^:private *cache
  (atom (cache/lru-cache-factory {} :threshold cache-threshold)))
(defonce ^:private *entries (atom {}))
(defonce ^:private *stats (atom {:builds 0 :hits 0 :misses 0 :refreshes 0}))

(defn- values
  [db eid attr]
  (map :v (d/datoms db :eavt eid attr)))

(defn- ident
  [db eid]
  (:db/ident (d/entity db eid)))

(defn- sort-property-idents
  [properties-by-ident property-idents]
  (->> property-idents
       (sort-by (fn [property-ident]
                  (let [property (get properties-by-ident property-ident)]
                    [(or (:block/order property) "")
                     (str (:block/uuid property))])))
       vec))

(defn- property-map
  [db eid]
  (when-let [entity (d/entity db eid)]
    (select-keys (worker-plain/entity-forward-map db entity {:properties property-keys})
                 property-keys)))

(defn- class-map
  [db properties-by-ident eid]
  (when-let [entity (d/entity db eid)]
    (let [extends (mapv #(ident db %) (values db eid :logseq.property.class/extends))
          property-idents (->> (values db eid :logseq.property.class/properties)
                               (map #(ident db %))
                               (remove nil?)
                               (sort-property-idents properties-by-ident))]
      (assoc (select-keys (worker-plain/entity-forward-map db entity {:properties class-keys})
                          class-keys)
             :extends extends
             :property-idents property-idents))))

(defn- all-property-eids
  [db]
  (when-let [property-class-id (d/entid db :logseq.class/Property)]
    (map :e (d/datoms db :avet :block/tags property-class-id))))

(defn- all-class-eids
  [db]
  (when-let [tag-class-id (d/entid db :logseq.class/Tag)]
    (map :e (d/datoms db :avet :block/tags tag-class-id))))

(defn- class-ancestors
  [classes-by-ident class-ident]
  (loop [parents (get-in classes-by-ident [class-ident :extends])
         seen #{class-ident}
         result []]
    (if-let [parent (first parents)]
      (if (contains? seen parent)
        (recur (rest parents) seen result)
        (recur (concat (rest parents)
                       (get-in classes-by-ident [parent :extends]))
               (conj seen parent)
               (conj result parent)))
      result)))

(defn build-metadata
  "Build immutable property and class metadata from a Datascript database value."
  [db]
  (let [properties-by-id (into {}
                               (keep (fn [eid]
                                       (when-let [property (property-map db eid)]
                                         [eid property])))
                               (all-property-eids db))
        properties-by-ident (into {}
                                  (keep (fn [[_ property]]
                                          (when-let [property-ident (:db/ident property)]
                                            [property-ident property])))
                                  properties-by-id)
        classes-by-id (into {}
                            (keep (fn [eid]
                                    (when-let [class (class-map db properties-by-ident eid)]
                                      [eid class])))
                            (all-class-eids db))
        classes-by-ident (into {}
                              (keep (fn [[_ class]]
                                      (when-let [class-ident (:db/ident class)]
                                        [class-ident class])))
                              classes-by-id)
        classes-by-id (reduce-kv
                       (fn [result class-id class]
                         (assoc result class-id
                                (assoc class :ancestors
                                       (class-ancestors classes-by-ident (:db/ident class)))))
                       {}
                       classes-by-id)
        classes-by-ident (into {}
                               (map (fn [[class-ident class]]
                                      [class-ident
                                       (assoc class :ancestors
                                              (class-ancestors classes-by-ident class-ident))]))
                               classes-by-ident)]
    {:properties-by-id properties-by-id
     :properties-by-ident properties-by-ident
     :classes-by-id classes-by-id
     :classes-by-ident classes-by-ident}))

(defn property
  [metadata property-id-or-ident]
  (if (integer? property-id-or-ident)
    (get-in metadata [:properties-by-id property-id-or-ident])
    (get-in metadata [:properties-by-ident property-id-or-ident])))

(defn class
  [metadata class-id-or-ident]
  (if (integer? class-id-or-ident)
    (get-in metadata [:classes-by-id class-id-or-ident])
    (get-in metadata [:classes-by-ident class-id-or-ident])))

(defn- class-id
  [metadata tag]
  (cond
    (map? tag) (:db/id tag)
    (integer? tag) tag
    (keyword? tag) (some-> (class metadata tag) :db/id)
    :else nil))

(defn block-class-properties
  "Return cached class metadata relevant to a block's direct class tags."
  [metadata block]
  (let [direct-class-idents (->> (:block/tags block)
                                 (keep #(some-> (class-id metadata %) (class metadata) :db/ident))
                                 (sort-by #(get-in metadata [:classes-by-ident % :block/name])))
        all-class-idents (->> (concat direct-class-idents
                                      (mapcat #(get-in metadata [:classes-by-ident % :ancestors])
                                              direct-class-idents))
                              distinct)
        all-classes (->> all-class-idents
                         (keep #(class metadata %))
                         (filter (comp seq :property-idents)))
        property-idents (->> all-classes
                             (mapcat :property-idents)
                             distinct)]
    {:all-classes (vec all-classes)
     :classes-properties (mapv #(property metadata %) property-idents)}))

(defn- cache-key
  [repo generation]
  [repo generation])

(defn- active-entry-for-db
  [db]
  (some (fn [[_ entry]]
          (when (or (identical? db (:db entry))
                    (= db (:db entry)))
            entry))
        @*entries))

(defn- store-entry!
  [repo generation db metadata]
  (let [key (cache-key repo generation)]
    (swap! *cache cache/miss key metadata)
    (swap! *entries assoc repo {:db db
                                :repo repo
                                :generation generation
                                :key key
                                :metadata metadata})
    metadata))

(defn- build-entry!
  [repo generation db]
  (swap! *stats update :builds inc)
  (store-entry! repo generation db (build-metadata db)))

(defn initialize!
  "Build and publish one metadata entry after a graph connection is ready."
  [repo db]
  (let [generation (inc (or (get-in @*entries [repo :generation]) 0))
        old-key (get-in @*entries [repo :key])]
    (when old-key
      (swap! *cache cache/evict old-key))
    (build-entry! repo generation db)
    generation))

(defn cached-metadata-for-db
  [db]
  (when-let [{:keys [key metadata]} (active-entry-for-db db)]
    (when (cache/has? @*cache key)
      metadata)))

(defn metadata-for-db
  "Return cached metadata for `db`, building a non-published fallback when needed."
  [db]
  (if-let [entry (active-entry-for-db db)]
    (if (cache/has? @*cache (:key entry))
      (do
        (swap! *cache cache/hit (:key entry))
        (swap! *stats update :hits inc)
        (:metadata entry))
      (do
        (swap! *stats update :misses inc)
        (build-entry! (:repo entry) (:generation entry) db)))
    (do
      (swap! *stats update :misses inc)
      (swap! *stats update :builds inc)
      (build-metadata db))))

(defn metadata-attribute?
  [attribute]
  (contains? metadata-attributes attribute))

(defn- definition-entity?
  [db eid]
  (when db
    (some (fn [datom]
            (contains? #{:logseq.class/Property :logseq.class/Tag}
                       (:db/ident (d/entity db (:v datom)))))
          (d/datoms db :eavt eid :block/tags))))

(defn- metadata-datom?
  [{:keys [db-before db-after]} {:keys [a e]}]
  (or (metadata-attribute? a)
      (and (= :block/tags a)
           (or (definition-entity? db-before e)
               (definition-entity? db-after e)))
      (and (contains? #{:block/title :block/raw-title :block/name :block/order
                        :block/uuid :db/ident}
                       a)
           (or (definition-entity? db-before e)
               (definition-entity? db-after e)))))

(defn refresh!
  "Refresh the active graph entry once when a transaction changes metadata."
  [repo db-after tx-report]
  (when-let [{:keys [generation]} (get @*entries repo)]
    (swap! *stats update :refreshes inc)
    (if (some #(metadata-datom? tx-report %) (:tx-data tx-report))
      (build-entry! repo generation db-after)
      (swap! *entries assoc-in [repo :db] db-after))))

(defn clear!
  [repo]
  (when-let [key (get-in @*entries [repo :key])]
    (swap! *cache cache/evict key))
  (swap! *entries dissoc repo)
  nil)

(defn stats
  []
  @*stats)

(defn reset-for-tests!
  []
  (reset! *cache (cache/lru-cache-factory {} :threshold cache-threshold))
  (reset! *entries {})
  (reset! *stats {:builds 0 :hits 0 :misses 0 :refreshes 0})
  nil)
