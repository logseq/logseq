(ns logseq.db.sqlite.export
  "Builds sqlite.build EDN to represent nodes in a graph-agnostic way.
   Useful for exporting and importing across DB graphs"
  (:require [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.db :as ldb]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.entity-plus :as entity-plus]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.sqlite.build :as sqlite-build]))

(defn- build-export-properties
  [db user-defined-properties]
  (->> user-defined-properties
       (map (fn [ident]
              (let [property (d/entity db ident)
                    closed-values (entity-plus/lookup-kv-then-entity property :property/closed-values)]
                [ident
                 (cond-> (select-keys property
                                      (-> (disj db-property/schema-properties :logseq.property/classes)
                                          (conj :block/title)))
                   (seq closed-values)
                   (assoc :build/closed-values
                          (mapv #(cond-> {:value (db-property/property-value-content %) :uuid (random-uuid)}
                                   (:logseq.property/icon %)
                                   (assoc :icon (:logseq.property/icon %)))
                                closed-values)))])))
       (into {})))

(defn build-entity-export
  "Given entity id, build an EDN export map"
  [db entity-or-eid]
  (let [entity (if (de/entity? entity-or-eid) entity-or-eid (d/entity db entity-or-eid))
        properties (dissoc (db-property/properties entity) :block/tags)
        user-defined-properties (concat (remove db-property/logseq-property? (keys properties))
                                        (->> (:block/tags entity)
                                             (mapcat :logseq.property.class/properties)
                                             (map :db/ident)))
        properties-config (build-export-properties db user-defined-properties)
        result (cond-> (select-keys entity [:block/title])
                 (seq (:block/tags entity))
                 (assoc :build/tags
                        (mapv :db/ident (:block/tags entity)))
                 (seq properties)
                 (assoc :build/properties
                        (->> properties
                             (map (fn [[k v]]
                                    [k
                                     (if (:block/closed-value-property v)
                                       (if-let [closed-uuid (some #(when (= (:value %) (db-property/property-value-content v))
                                                                     (:uuid %))
                                                                  (get-in properties-config [k :build/closed-values]))]
                                         [:block/uuid closed-uuid]
                                         (throw (ex-info (str "No closed value found for content: " (pr-str (db-property/property-value-content v))) {:properties properties-config})))
                                       ;; Copied from readable-properties
                                       (cond
                                         (de/entity? v)
                                         (or (:db/ident v) (db-property/property-value-content v))
                                         (and (set? v) (every? de/entity? v))
                                         (set (map db-property/property-value-content v))
                                         :else
                                         v))]))
                             (into {}))))]
    (cond-> {:build/block result}
      (seq (:block/tags entity))
      (assoc :classes
             (->> (:block/tags entity)
                  (remove #(db-class/logseq-class? (:db/ident %)))
                  ;; TODO: Export class parents when there's ability to control granularity of export
                  (map #(vector (:db/ident %)
                                (cond-> (select-keys % [:block/title])
                                  (:logseq.property.class/properties %)
                                  (assoc :build/class-properties
                                         (mapv :db/ident (:logseq.property.class/properties %))))))
                  (into {})))
      (seq properties-config)
      (assoc :properties properties-config))))

(defn- build-blocks-tree
  "Given a page's block entities, returns the blocks in a sqlite.build EDN format
   and all properties and classes used in these blocks"
  [db blocks]
  (let [*properties (atom {})
        *classes (atom {})
        id-map (into {} (map (juxt :db/id identity)) blocks)
        children (group-by #(get-in % [:block/parent :db/id]) blocks)
        build-block (fn build-block [block*]
                      (let [child-nodes (mapv build-block (get children (:db/id block*) []))
                            {:build/keys [block] :keys [properties classes]}
                            (build-entity-export db block*)]
                        (when (seq properties) (swap! *properties merge properties))
                        (when (seq classes) (swap! *classes merge classes))
                        (cond-> block
                          (seq child-nodes) (assoc :build/children child-nodes))))
        roots (remove #(contains? id-map (get-in % [:block/parent :db/id])) blocks)
        exported-blocks (mapv build-block roots)]
    {:blocks exported-blocks
     :properties @*properties
     :classes @*classes}))

(defn build-page-export [db eid]
  (let [page-entity (d/entity db eid)
        ;; TODO: Fetch unloaded page datoms
        datoms (d/datoms db :avet :block/page eid)
        block-eids (mapv :e datoms)
        page-blocks (->> block-eids
                         (map #(d/entity db %))
                         (sort-by :block/order)
                         ;; Remove property value blocks as they are included in the block they belong to
                         (remove #(:logseq.property/created-from-property %)))
        {:keys [blocks properties classes]} (build-blocks-tree db page-blocks)
        page-export
        (cond-> {:pages-and-blocks [{:page (if (ldb/journal? page-entity)
                                             {:build/journal (:block/journal-day page-entity)}
                                             (select-keys page-entity [:block/title]))
                                     :blocks blocks}]}
          (seq properties)
          (assoc :properties properties)
          (seq classes)
          (assoc :classes classes))]
    page-export))

(defn- ->sqlite-build-options
  [db {:keys [pages-and-blocks classes properties]} property-conflicts]
  (cond-> {:pages-and-blocks pages-and-blocks
           :build-existing-tx? true}
    (seq classes)
    (assoc :classes
           (->> classes
                (map (fn [[k v]]
                       (if-let [ent (d/entity db k)]
                         [k (assoc v :block/uuid (:block/uuid ent))]
                         [k v])))
                (into {})))
    (seq properties)
    (assoc :properties
           (->> properties
                (map (fn [[k v]]
                       (if-let [ent (d/entity db k)]
                         (do
                           (when (not= (select-keys ent [:logseq.property/type :db/cardinality])
                                       (select-keys v [:logseq.property/type :db/cardinality]))
                             (swap! property-conflicts conj
                                    {:property-id k
                                     :actual (select-keys v [:logseq.property/type :db/cardinality])
                                     :expected (select-keys ent [:logseq.property/type :db/cardinality])}))
                           [k (assoc v :block/uuid (:block/uuid ent))])
                         [k v])))
                (into {})))))

(defn- build-block-import-options
  "Builds options for sqlite-build to import into current-block"
  [current-block export-map]
  (let [{:build/keys [block]}
        (merge-with merge
                    export-map
                    {:build/block
                     {:block/uuid (:block/uuid current-block)
                      :block/page (select-keys (:block/page current-block) [:block/uuid])}})
        pages-and-blocks
        [{:page (select-keys (:block/page block) [:block/uuid])
          :blocks [(dissoc block :block/page)]}]]
    (assoc export-map :pages-and-blocks pages-and-blocks)))

(defn- build-page-import-options
  [db export-map]
  (assert (map? (get-in export-map [:pages-and-blocks 0 :page])) "page export exists")
  (if-let [ent (some->> (get-in export-map [:pages-and-blocks 0 :page :build/journal])
                        (d/datoms db :avet :block/journal-day)
                        first
                        :e
                        (d/entity db))]
    (assoc-in export-map [:pages-and-blocks 0 :page] (select-keys ent [:block/uuid]))
    ;; FIXME: Find an existing page more reliably than :block/title, :block/uuid?
    (if-let [ent (some->> (get-in export-map [:pages-and-blocks 0 :page :block/title])
                          (ldb/get-case-page db))]
      (assoc-in export-map [:pages-and-blocks 0 :page] (select-keys ent [:block/uuid]))
      export-map)))

(defn build-import
  "Given an entity's export map, build the import tx to create it"
  [db {:keys [current-block]} export-map*]
  (let [export-map (if current-block
                     (build-block-import-options current-block export-map*)
                     (build-page-import-options db export-map*))
        property-conflicts (atom [])
        opts (->sqlite-build-options db export-map property-conflicts)]
    (if (seq @property-conflicts)
      (do
        (js/console.error :property-conflicts @property-conflicts)
        {:error (str "The following imported properties conflict with the current graph: "
                     (pr-str (mapv :property-id @property-conflicts)))})
      (sqlite-build/build-blocks-tx opts))))