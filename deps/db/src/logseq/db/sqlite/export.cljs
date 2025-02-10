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

(defn- buildable-property-value-entity
  "Converts property value to a buildable version"
  [property-ent pvalue]
  (cond (ldb/internal-page? pvalue)
        ;; Should page properties be pulled here?
        [:build/page (cond-> (select-keys pvalue [:block/title])
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
  [class-ent {:keys [include-parents?]}]
  (cond-> (select-keys class-ent [:block/title])
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
  [db entity {:keys [properties include-uuid-fn] :or {include-uuid-fn (constantly false)}}]
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
        build-block (cond-> (select-keys entity
                                         (cond-> [:block/title]
                                           (include-uuid-fn (:block/uuid entity)) (conj :block/uuid)))
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

(defn build-block-export
  [db eid]
  (let [export-map (build-entity-export db (d/entity db eid) {})
        pvalue-uuids (get-pvalue-uuids (:build/block export-map))]
    ;; Maybe add support for this later
    (when (seq pvalue-uuids)
      (throw (ex-info "Exporting a block with :node block objects is not supported" {})))
    export-map))

(defn- build-blocks-tree
  "Given a page's block entities, returns the blocks in a sqlite.build EDN format
   and all properties and classes used in these blocks"
  [db blocks {:keys [include-uuid-fn]}]
  (let [*properties (atom {})
        *classes (atom {})
        *pvalue-uuids (atom #{})
        id-map (into {} (map (juxt :db/id identity)) blocks)
        children (group-by #(get-in % [:block/parent :db/id]) blocks)
        build-block (fn build-block [block*]
                      (let [child-nodes (mapv build-block (get children (:db/id block*) []))
                            {:build/keys [block] :keys [properties classes]}
                            (build-entity-export db block* {:properties @*properties :include-uuid-fn include-uuid-fn})
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

(defn- get-uuid-block-pages [db pvalue-uuids content-ref-ents page-entity]
  (let [uuid-block-ents-to-export (concat (map #(d/entity db [:block/uuid %]) pvalue-uuids)
                                          (remove ldb/page? content-ref-ents))]
    (when (seq uuid-block-ents-to-export)
      (->> uuid-block-ents-to-export
           (group-by :block/parent)
           (map (fn [[parent-page-ent blocks]]
                  ;; Not a common case but can support later if needed
                  (when (= parent-page-ent page-entity)
                    (throw (ex-info "Can't export a uuid block from exported page" {})))
                  ;; Don't export pvalue-uuids of pvalue blocks as it's too excessive for now
                  (merge (build-blocks-tree db (sort-by :block/order blocks) {:include-uuid-fn (constantly true)})
                         {:page (select-keys parent-page-ent [:block/title])})))))))

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
        content-ref-uuids (set (mapcat (comp db-content/get-matched-ids :block/title) page-blocks))
        content-ref-ents (map #(d/entity db [:block/uuid %]) content-ref-uuids)
        content-ref-pages (filter ldb/internal-page? content-ref-ents)
        content-ref-properties* (map :db/ident (filter ldb/property? content-ref-ents))
        content-ref-properties (when content-ref-properties*
                                 (update-vals (build-export-properties db content-ref-properties* {:include-uuid? true})
                                              #(merge % {:build/new-property? true})))
        {:keys [blocks properties classes pvalue-uuids]}
        (build-blocks-tree db page-blocks {:include-uuid-fn content-ref-uuids})
        uuid-block-pages (get-uuid-block-pages db pvalue-uuids content-ref-ents page-entity)
        page-ent-export (build-entity-export db page-entity {:properties properties})
        page (merge (dissoc (:build/block page-ent-export) :block/title)
                    (if (ldb/journal? page-entity)
                      {:build/journal (:block/journal-day page-entity)}
                      (select-keys page-entity [:block/title])))
        pages-and-blocks
        (cond-> [{:page page :blocks blocks}]
          ;; pages from uuid blocks or content-ref-pages are shallow copies e.g. only :block/title
          (seq uuid-block-pages)
          (into (map #(select-keys % [:page :blocks]) uuid-block-pages))
          (seq content-ref-pages)
          (into (map #(hash-map :page (select-keys % [:block/title :block/uuid])) content-ref-pages)))
        ;; Use merge-with to preserve new-property?
        properties' (apply merge-with merge properties
                           (:properties page-ent-export)
                           content-ref-properties
                           (map :properties uuid-block-pages))
        classes' (apply merge classes (:classes page-ent-export) (map :classes uuid-block-pages))
        page-export
        (cond-> {:pages-and-blocks pages-and-blocks}
          (seq properties')
          (assoc :properties properties')
          (seq classes')
          (assoc :classes classes'))]
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