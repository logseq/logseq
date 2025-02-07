(ns logseq.db.sqlite.export
  "Builds sqlite.build EDN to represent nodes in a graph-agnostic way.
   Useful for exporting and importing across DB graphs"
  (:require [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.db :as ldb]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.frontend.entity-plus :as entity-plus]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.sqlite.build :as sqlite-build]))

;; Export fns
;; ==========
(defn- ->build-tags [block-tags]
  (->> (map :db/ident block-tags)
       (remove #(= % :logseq.class/Page))
       vec))

(defn- block-title
  "Get an entity's original title"
  [ent]
  (or (:block/raw-title ent) (:block/title ent)))

(defn- shallow-copy-page
  "Given a page or journal entity, shallow copies it e.g. no properties or tags info included.
   Pages that are shallow copied are at the edges of export and help keep the export size reasonable and
   avoid exporting unexpected info"
  [page-entity]
  (if (ldb/journal? page-entity)
    {:build/journal (:block/journal-day page-entity)}
    {:block/title (block-title page-entity)}))

(defn- buildable-property-value-entity
  "Converts property value to a buildable version"
  [property-ent pvalue]
  (cond (ldb/internal-page? pvalue)
        ;; Should page properties be pulled here?
        [:build/page (cond-> (shallow-copy-page pvalue)
                       (seq (:block/tags pvalue))
                       (assoc :build/tags (->build-tags (:block/tags pvalue))))]
        (ldb/journal? pvalue)
        [:build/page {:build/journal (:block/journal-day pvalue)}]
        :else
        (if (= :node (:logseq.property/type property-ent))
          ;; Have to distinguish from block references that don't exist like closed values
          ^::existing-property-value? [:block/uuid (:block/uuid pvalue)]
          (or (:db/ident pvalue) (db-property/property-value-content pvalue)))))

(defn- buildable-properties
  "Originally copied from db-test/readable-properties. Modified so that property values are
   valid sqlite.build EDN"
  [db ent-properties properties-config]
  (->> ent-properties
       (map (fn [[k v]]
              [k
               (if (and (:block/closed-value-property v) (not (db-property/logseq-property? k)))
                 (if-let [closed-uuid (some #(when (= (:value %) (db-property/property-value-content v))
                                               (:uuid %))
                                            (get-in properties-config [k :build/closed-values]))]
                   [:block/uuid closed-uuid]
                   (throw (ex-info (str "No closed value found for content: " (pr-str (db-property/property-value-content v))) {:properties properties-config})))
                 (cond
                   (de/entity? v)
                   (buildable-property-value-entity (d/entity db k) v)
                   (and (set? v) (every? de/entity? v))
                   (let [property-ent (d/entity db k)]
                     (set (map (partial buildable-property-value-entity property-ent) v)))
                   :else
                   v))]))
       (into {})))

(defn- build-export-properties
  [db user-property-idents {:keys [include-properties? include-uuid?]}]
  (let [properties-config-by-ent
        (->> user-property-idents
             (map (fn [ident]
                    (let [property (d/entity db ident)
                          closed-values (entity-plus/lookup-kv-then-entity property :property/closed-values)]
                      [property
                       (cond-> (select-keys property
                                            (-> (disj db-property/schema-properties :logseq.property/classes)
                                                (conj :block/title)))
                         include-uuid?
                         (assoc :block/uuid (:block/uuid property))
                         (:logseq.property/classes property)
                         (assoc :build/property-classes (mapv :db/ident (:logseq.property/classes property)))
                         (seq closed-values)
                         (assoc :build/closed-values
                                (mapv #(cond-> {:value (db-property/property-value-content %) :uuid (random-uuid)}
                                         (:logseq.property/icon %)
                                         (assoc :icon (:logseq.property/icon %)))
                                      closed-values)))])))

             (into {}))
        properties-config (update-keys properties-config-by-ent :db/ident)]
    ;; By default properties aren't included as build and page exports do not include all user-defined-properties
    ;; e.g. properties that are on property pages
    (if include-properties?
      (->> properties-config-by-ent
           (map (fn [[ent build-property]]
                  (let [ent-properties (apply dissoc (db-property/properties ent) :block/tags db-property/schema-properties)]
                    [(:db/ident ent)
                     (cond-> build-property
                       (seq ent-properties)
                       (assoc :build/properties (buildable-properties db ent-properties properties-config)))])))
           (into {}))
      properties-config)))

(defn- build-export-class
  [class-ent {:keys [include-parents? include-uuid?]}]
  (cond-> (select-keys class-ent [:block/title])
    include-uuid?
    (assoc :block/uuid (:block/uuid class-ent))
    (:logseq.property.class/properties class-ent)
    (assoc :build/class-properties
           (mapv :db/ident (:logseq.property.class/properties class-ent)))
    (and include-parents?
         (:logseq.property/parent class-ent)
         (not= :logseq.class/Root (:db/ident (:logseq.property/parent class-ent))))
    (assoc :build/class-parent
           (:db/ident (:logseq.property/parent class-ent)))))

(defn- build-export-block-classes
  [db build-block block-tags]
  (let [pvalue-class-ents (->> (:build/properties build-block)
                               vals
                               (mapcat (fn [val-or-vals]
                                         (mapcat #(when (sqlite-build/page-prop-value? %) (:build/tags (second %)))
                                                 (if (set? val-or-vals) val-or-vals [val-or-vals]))))
                               (remove db-class/logseq-class?)
                               (map #(d/entity db %)))
        new-class-ents (concat (remove #(db-class/logseq-class? (:db/ident %)) block-tags)
                               pvalue-class-ents)]
    (->> new-class-ents
         ;; TODO: Export class parents when there's ability to control granularity of export
         (map #(vector (:db/ident %) (build-export-class % {:include-parents? false})))
         (into {}))))

(defn- build-entity-export
  "Given entity and optional existing properties, build an EDN export map"
  [db entity {:keys [properties include-uuid-fn keep-uuid?] :or {include-uuid-fn (constantly false)}}]
  (let [ent-properties (dissoc (db-property/properties entity) :block/tags)
        new-user-property-ids (->> (keys ent-properties)
                                   (concat (->> (:block/tags entity)
                                                (mapcat :logseq.property.class/properties)
                                                (map :db/ident)))
                                   ;; Built-in properties and any possible modifications are not exported
                                   (remove db-property/logseq-property?)
                                   (remove #(get properties %)))
        new-properties (build-export-properties db new-user-property-ids {})
        build-tags (when (seq (:block/tags entity)) (->build-tags (:block/tags entity)))
        build-block (cond-> {:block/title (block-title entity)}
                      (include-uuid-fn (:block/uuid entity))
                      (assoc :block/uuid (:block/uuid entity))
                      keep-uuid?
                      (assoc :build/keep-uuid? true)
                      (seq build-tags)
                      (assoc :build/tags build-tags)
                      (seq ent-properties)
                      (assoc :build/properties
                             (buildable-properties db ent-properties (merge properties new-properties))))
        new-classes (build-export-block-classes db build-block (:block/tags entity))]
    (cond-> {:build/block build-block}
      (seq new-classes)
      (assoc :classes new-classes)
      (seq new-properties)
      (assoc :properties new-properties))))

(defn- get-pvalue-uuids
  "Extracts block reference uuids from a block's property values"
  [build-block]
  (->> (:build/properties build-block)
       vals
       (mapcat (fn [val-or-vals]
                 (keep #(when (and (vector? %)
                                   (= :block/uuid (first %))
                                   (::existing-property-value? (meta %))) (second %))
                       (if (set? val-or-vals) val-or-vals [val-or-vals]))))
       set))

(defn- merge-export-maps [& export-maps]
  (let [pages-and-blocks (reduce into [] (keep :pages-and-blocks export-maps))
        ;; Use merge-with to preserve new-property?
        properties (apply merge-with merge (keep :properties export-maps))
        classes (apply merge-with merge (keep :classes export-maps))]
    (cond-> {:pages-and-blocks pages-and-blocks}
      (seq properties)
      (assoc :properties properties)
      (seq classes)
      (assoc :classes classes))))

(defn- build-content-ref-export
  "Builds an export config (and additional info) for refs in the given blocks. All the exported
   entities found in block refs include their uuid in order to preserve the relationship to the blocks"
  [db page-blocks]
  (let [content-ref-uuids (set (mapcat (comp db-content/get-matched-ids block-title) page-blocks))
        content-ref-ents (map #(d/entity db [:block/uuid %]) content-ref-uuids)
        content-ref-pages (filter #(or (ldb/internal-page? %) (ldb/journal? %)) content-ref-ents)
        content-ref-properties (when-let [prop-ids (seq (map :db/ident (filter ldb/property? content-ref-ents)))]
                                 (update-vals (build-export-properties db prop-ids {:include-uuid? true})
                                              #(merge % {:build/keep-uuid? true})))
        content-ref-classes (when-let [class-ents (seq (filter ldb/class? content-ref-ents))]
                              (->> class-ents
                                   ;; TODO: Export class parents when there's ability to control granularity of export
                                   (map #(vector (:db/ident %)
                                                 (assoc (build-export-class % {:include-parents? false :include-uuid? true})
                                                        :build/keep-uuid? true)))
                                   (into {})))]
    {:content-ref-uuids content-ref-uuids
     :content-ref-ents content-ref-ents
     :properties content-ref-properties
     :classes content-ref-classes
     :pages-and-blocks (mapv #(hash-map :page (merge (shallow-copy-page %)
                                                     {:block/uuid (:block/uuid %) :build/keep-uuid? true}))
                             content-ref-pages)}))

(defn build-block-export
  [db eid]
  (let [block-entity (d/entity db eid)
        {:keys [content-ref-uuids _content-ref-ents] :as content-ref-export} (build-content-ref-export db [block-entity])
        block-export* (build-entity-export db block-entity {:include-uuid-fn content-ref-uuids})
        pvalue-uuids (get-pvalue-uuids (:build/block block-export*))
        block-export (assoc (merge-export-maps block-export* content-ref-export)
                            :build/block (:build/block block-export*))]
    ;; Maybe add support for this later
    (when (seq pvalue-uuids)
      (throw (ex-info "Exporting a block with :node block objects is not supported" {})))
    block-export))

(defn- build-blocks-tree
  "Given a page's block entities, returns the blocks in a sqlite.build EDN format
   and all properties and classes used in these blocks"
  [db blocks opts]
  (let [*properties (atom {})
        *classes (atom {})
        *pvalue-uuids (atom #{})
        id-map (into {} (map (juxt :db/id identity)) blocks)
        children (group-by #(get-in % [:block/parent :db/id]) blocks)
        build-block (fn build-block [block*]
                      (let [child-nodes (mapv build-block (get children (:db/id block*) []))
                            {:build/keys [block] :keys [properties classes]}
                            (build-entity-export db block* (assoc opts :properties @*properties))
                            new-pvalue-uuids (get-pvalue-uuids block)]
                        (when (seq properties) (swap! *properties merge properties))
                        (when (seq classes) (swap! *classes merge classes))
                        (when (seq new-pvalue-uuids) (swap! *pvalue-uuids into new-pvalue-uuids))
                        (cond-> block
                          (seq child-nodes) (assoc :build/children child-nodes))))
        roots (remove #(contains? id-map (get-in % [:block/parent :db/id])) blocks)
        exported-blocks (mapv build-block roots)]
    {:blocks exported-blocks
     :properties @*properties
     :classes @*classes
     :pvalue-uuids @*pvalue-uuids}))

(defn- build-uuid-block-export [db pvalue-uuids content-ref-ents page-entity]
  (let [uuid-block-ents-to-export (concat (map #(d/entity db [:block/uuid %]) pvalue-uuids)
                                          (remove ldb/page? content-ref-ents))
        uuid-block-pages
        (when (seq uuid-block-ents-to-export)
          (->> uuid-block-ents-to-export
               (group-by :block/parent)
               ;; Remove page-entity because it's already been built for content-ref-ents
               ;; and it's unlikely and complex to handle for pvalue-uuids
               ((fn [m] (dissoc m page-entity)))
               (map (fn [[parent-page-ent blocks]]
                      ;; Don't export pvalue-uuids of uuid blocks to keep export shallower
                      (merge (build-blocks-tree db
                                                (sort-by :block/order blocks)
                                                {:include-uuid-fn (constantly true) :keep-uuid? true})
                             {:page (shallow-copy-page parent-page-ent)})))))]
    {:properties (apply merge (map :properties uuid-block-pages))
     :classes (apply merge (map :classes uuid-block-pages))
     :pages-and-blocks (mapv #(select-keys % [:page :blocks]) uuid-block-pages)}))

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
        {:keys [content-ref-uuids content-ref-ents] :as content-ref-export} (build-content-ref-export db page-blocks)
        {:keys [blocks properties classes pvalue-uuids]}
        (build-blocks-tree db page-blocks {:include-uuid-fn content-ref-uuids})
        uuid-block-export (build-uuid-block-export db pvalue-uuids content-ref-ents page-entity)
        page-ent-export (build-entity-export db page-entity {:properties properties})
        page (merge (dissoc (:build/block page-ent-export) :block/title)
                    (shallow-copy-page page-entity))
        page-blocks-export {:pages-and-blocks [{:page page :blocks blocks}]
                            :properties properties
                            :classes classes}
        page-export (merge-export-maps page-blocks-export page-ent-export uuid-block-export content-ref-export)]
    page-export))

(defn build-graph-ontology-export
  [db]
  (let [user-property-idents (d/q '[:find [?db-ident ...]
                                    :where [?p :db/ident ?db-ident]
                                    [?p :block/tags :logseq.class/Property]
                                    (not [?p :logseq.property/built-in?])]
                                  db)
        properties (build-export-properties db user-property-idents {:include-properties? true})
        class-ents (->> (d/q '[:find [?class ...]
                               :where [?class :block/tags :logseq.class/Tag]
                               (not [?class :logseq.property/built-in?])]
                             db)
                        (map #(d/entity db %)))
        classes
        (->> class-ents
             (map (fn [ent]
                    (let [ent-properties (dissoc (db-property/properties ent) :block/tags :logseq.property/parent)]
                      (vector (:db/ident ent)
                              (cond-> (build-export-class ent {:include-parents? true})
                                (seq ent-properties)
                                (assoc :build/properties (buildable-properties db ent-properties properties)))))))
             (into {}))]
    (cond-> {}
      (seq properties)
      (assoc :properties properties)
      (seq classes)
      (assoc :classes classes))))

;; Import fns
;; ==========
(defn- ->sqlite-build-options
  [db {:keys [pages-and-blocks classes properties]} property-conflicts]
  (cond-> {:build-existing-tx? true}
    (seq pages-and-blocks)
    (assoc :pages-and-blocks pages-and-blocks)
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
  (let [block (merge (:build/block export-map)
                     {:block/uuid (:block/uuid current-block)
                      :block/page (select-keys (:block/page current-block) [:block/uuid])})
        pages-and-blocks
        [{:page (select-keys (:block/page block) [:block/uuid])
          :blocks [(dissoc block :block/page)]}]]
    (merge-export-maps export-map {:pages-and-blocks pages-and-blocks})))

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
  (let [export-map (cond current-block
                         (build-block-import-options current-block export-map*)
                         (:pages-and-blocks export-map*)
                         (build-page-import-options db export-map*)
                         :else
                         export-map*)
        property-conflicts (atom [])
        opts (->sqlite-build-options db export-map property-conflicts)]
    (if (seq @property-conflicts)
      (do
        (js/console.error :property-conflicts @property-conflicts)
        {:error (str "The following imported properties conflict with the current graph: "
                     (pr-str (mapv :property-id @property-conflicts)))})
      (sqlite-build/build-blocks-tx opts))))