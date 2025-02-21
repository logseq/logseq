(ns logseq.db.sqlite.export
  "Builds sqlite.build EDN to represent nodes in a graph-agnostic way.
   Useful for exporting and importing across DB graphs"
  (:require [clojure.set :as set]
            [clojure.walk :as walk]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.db :as ldb]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.frontend.entity-plus :as entity-plus]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.sqlite.build :as sqlite-build]))

;; Export fns
;; ==========
(defn- ->build-tags [block-tags]
  (->> (map :db/ident block-tags)
       ;; These classes are redundant as :build/journal is enough for Journal and Page
       ;; is implied by being in :pages-and-blocks
       (remove #{:logseq.class/Page :logseq.class/Journal})
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
  (if (entity-util/journal? page-entity)
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
        (entity-util/journal? pvalue)
        [:build/page {:build/journal (:block/journal-day pvalue)}]
        :else
        (if (= :node (:logseq.property/type property-ent))
          ;; Have to distinguish from block references that don't exist like closed values
          ^::existing-property-value? [:block/uuid (:block/uuid pvalue)]
          (or (:db/ident pvalue)
              ;; nbb-compatible version of db-property/property-value-content
              (or (block-title pvalue)
                  (:logseq.property/value pvalue))))))

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
  "The caller of this fn is responsible for building :build/:property-classes unless shallow-copy?"
  [db user-property-idents {:keys [include-properties? include-uuid? shallow-copy?]}]
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
                         (and (not shallow-copy?) (:logseq.property/classes property))
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
  "The caller of this fn is responsible for building any classes or properties from this fn
   unless shallow-copy?"
  [class-ent {:keys [include-parents? include-uuid? shallow-copy?]
              :or {include-parents? true}}]
  (cond-> (select-keys class-ent [:block/title])
    include-uuid?
    (assoc :block/uuid (:block/uuid class-ent))
    (and (:logseq.property.class/properties class-ent) (not shallow-copy?))
    (assoc :build/class-properties
           (mapv :db/ident (:logseq.property.class/properties class-ent)))
    ;; It's caller's responsibility to ensure parent is included in final export
    (and include-parents?
         (not shallow-copy?)
         (:logseq.property/parent class-ent)
         (not= :logseq.class/Root (:db/ident (:logseq.property/parent class-ent))))
    (assoc :build/class-parent
           (:db/ident (:logseq.property/parent class-ent)))))

(defn- build-node-classes
  [db build-block block-tags properties]
  (let [pvalue-classes (->> (:build/properties build-block)
                            vals
                            (mapcat (fn [val-or-vals]
                                      (mapcat #(when (sqlite-build/page-prop-value? %) (:build/tags (second %)))
                                              (if (set? val-or-vals) val-or-vals [val-or-vals]))))
                            (remove db-class/logseq-class?))
        property-classes (->> (mapcat :build/property-classes (vals properties))
                              (remove db-class/logseq-class?)
                              set)
        new-class-ents (remove #(db-class/logseq-class? (:db/ident %)) block-tags)
        shallow-classes (set/difference (into property-classes pvalue-classes)
                                        (set (map :db/ident new-class-ents)))]
    (merge
     ;; These are shallow b/c properties have already been built
     (when (seq shallow-classes)
       (->> shallow-classes
            (map #(d/entity db %))
            (map #(vector (:db/ident %) (build-export-class % {:shallow-copy? true})))
            (into {})))
     (->> new-class-ents
          ;; Properties from here are built in build-node-properties
          ;; Classes from here are built in build-class-parents-export
          (map #(vector (:db/ident %) (build-export-class % {})))
          (into {})))))

(defn- build-node-properties
  [db entity ent-properties properties]
  (let [new-user-property-ids (->> (keys ent-properties)
                                   (concat (->> (:block/tags entity)
                                                (mapcat :logseq.property.class/properties)
                                                (map :db/ident)))
                                   ;; Built-in properties and any possible modifications are not exported
                                   (remove db-property/logseq-property?)
                                   (remove #(get properties %)))]
    ;; Classes from hare are built in build-node-classes
    (build-export-properties db new-user-property-ids {})))

(defn- build-node-export
  "Given a block/page entity and optional existing properties, build an export map of its
   tags and properties"
  [db entity {:keys [properties include-uuid-fn keep-uuid? shallow-copy?]
              :or {include-uuid-fn (constantly false)}}]
  (let [ent-properties (dissoc (db-property/properties entity) :block/tags)
        build-tags (when (seq (:block/tags entity)) (->build-tags (:block/tags entity)))
        new-properties (when-not shallow-copy? (build-node-properties db entity ent-properties properties))
        build-node (cond-> {:block/title (block-title entity)}
                     (include-uuid-fn (:block/uuid entity))
                     (assoc :block/uuid (:block/uuid entity) :build/keep-uuid? true)
                     keep-uuid?
                     (assoc :build/keep-uuid? true)
                     (and (not shallow-copy?) (seq build-tags))
                     (assoc :build/tags build-tags)
                     (and (not shallow-copy?) (seq ent-properties))
                     (assoc :build/properties
                            (buildable-properties db ent-properties (merge properties new-properties))))
        new-classes (when-not shallow-copy? (build-node-classes db build-node (:block/tags entity) new-properties))]
    (cond-> {:node build-node}
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
  (let [pages-and-blocks
        (->> (mapcat :pages-and-blocks export-maps)
             ;; TODO: Group by more correct identity for title, same as check-for-existing-entities
             (group-by #(select-keys (:page %) [:block/title :build/journal]))
             (mapv #(apply merge-with (fn [e1 e2]
                                        ;; merge :page and add :blocks
                                        (if (and (map? e1) (map e2))
                                          (merge e1 e2)
                                          (into e1 e2)))
                           (second %))))
        ;; Use merge-with to preserve new-property? and to allow full copies to overwrite shallow ones
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
  [db blocks*]
  (let [;; Remove property value blocks that can't have content refs
        blocks (remove :logseq.property/value blocks*)
        content-ref-uuids (set (mapcat (comp db-content/get-matched-ids block-title) blocks))
        content-ref-ents (map #(d/entity db [:block/uuid %]) content-ref-uuids)
        content-ref-pages (filter #(or (ldb/internal-page? %) (entity-util/journal? %)) content-ref-ents)
        content-ref-properties (when-let [prop-ids (seq (map :db/ident (filter ldb/property? content-ref-ents)))]
                                 (update-vals (build-export-properties db prop-ids {:include-uuid? true :shallow-copy? true})
                                              #(merge % {:build/keep-uuid? true})))
        content-ref-classes (when-let [class-ents (seq (filter ldb/class? content-ref-ents))]
                              (->> class-ents
                                   (map #(vector (:db/ident %)
                                                 (assoc (build-export-class % {:include-uuid? true :shallow-copy? true})
                                                        :build/keep-uuid? true)))
                                   (into {})))]
    {:content-ref-uuids content-ref-uuids
     :content-ref-ents content-ref-ents
     :properties content-ref-properties
     :classes content-ref-classes
     :pages-and-blocks (mapv #(hash-map :page (merge (shallow-copy-page %)
                                                     {:block/uuid (:block/uuid %) :build/keep-uuid? true}))
                             content-ref-pages)}))

(defn- build-class-parents-export [db classes-config]
  (let [class-parent-ents (->> classes-config
                               (filter #(:build/class-parent (val %)))
                               (map #(d/entity db (key %)))
                               ldb/get-classes-parents)
        classes
        (->> class-parent-ents
             (remove #(db-class/logseq-class? (:db/ident %)))
             ;; No new parents come from here as they are found above
             (map #(vector (:db/ident %) (build-export-class % {})))
             (into {}))
        class-parent-properties
        (->> class-parent-ents
             (mapcat :logseq.property.class/properties)
             (map :db/ident)
             (remove db-property/logseq-property?))
        properties (build-export-properties db class-parent-properties {:shallow-copy? true})]
    {:classes classes
     :properties properties}))

(defn- build-blocks-export
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
                            {:keys [node properties classes]}
                            (build-node-export db block* (assoc opts :properties @*properties))
                            new-pvalue-uuids (get-pvalue-uuids node)]
                        (when (seq properties) (swap! *properties merge properties))
                        (when (seq classes) (swap! *classes merge classes))
                        (when (seq new-pvalue-uuids) (swap! *pvalue-uuids into new-pvalue-uuids))
                        (cond-> node
                          (seq child-nodes) (assoc :build/children child-nodes))))
        roots (remove #(contains? id-map (get-in % [:block/parent :db/id])) blocks)
        exported-blocks (mapv build-block roots)]
    {:blocks exported-blocks
     :properties @*properties
     :classes @*classes
     :pvalue-uuids @*pvalue-uuids}))

(defn- build-uuid-block-export [db pvalue-uuids content-ref-ents {:keys [page-entity]}]
  (let [content-ref-blocks (set (remove entity-util/page? content-ref-ents))
        uuid-block-ents-to-export (concat (map #(d/entity db [:block/uuid %]) pvalue-uuids)
                                          content-ref-blocks)
        uuid-block-pages
        (when (seq uuid-block-ents-to-export)
          (->> uuid-block-ents-to-export
               (group-by :block/parent)
               ;; Remove page-entity because it's already been built for content-ref-ents
               ;; and it's unlikely and complex to handle for pvalue-uuids
               ((fn [m] (dissoc m page-entity)))
               (map (fn [[parent-page-ent blocks]]
                      (merge (build-blocks-export db
                                                  (sort-by :block/order blocks)
                                                  {:include-uuid-fn (constantly true)
                                                   :keep-uuid? true
                                                   ;; shallow copy to disallow failing pvalues
                                                   :shallow-copy? true})
                             {:page (shallow-copy-page parent-page-ent)})))))]
    {:properties (apply merge (map :properties uuid-block-pages))
     :classes (apply merge (map :classes uuid-block-pages))
     :pages-and-blocks (mapv #(select-keys % [:page :blocks]) uuid-block-pages)}))

(defn- finalize-export-maps
  "Given final export maps, merges them, adds any missing class parents and merges those in"
  [db & export-maps]
  (let [final-export* (apply merge-export-maps export-maps)
        class-parents-export (some->> (:classes final-export*) (build-class-parents-export db))]
    (merge-export-maps final-export* class-parents-export)))

(defn- build-block-export
  "Exports block for given block eid"
  [db eid]
  (let [block-entity (d/entity db eid)
        property-value-ents (->> (dissoc (db-property/properties block-entity) :block/tags)
                                 vals
                                 (filter de/entity?))
        {:keys [content-ref-uuids content-ref-ents] :as content-ref-export}
        (build-content-ref-export db (into [block-entity] property-value-ents))
        node-export (build-node-export db block-entity {:include-uuid-fn content-ref-uuids})
        pvalue-uuids (get-pvalue-uuids (:node node-export))
        uuid-block-export (build-uuid-block-export db pvalue-uuids content-ref-ents {})
        block-export (finalize-export-maps db node-export uuid-block-export content-ref-export)]
    (merge {::block (:node node-export)}
           block-export)))

(defn- build-page-blocks-export [db page-entity {:keys [properties classes blocks]}]
  (let [page-ent-export (build-node-export db page-entity {:properties properties})
        page (merge (dissoc (:node page-ent-export) :block/title)
                    (shallow-copy-page page-entity))
        page-blocks-export {:pages-and-blocks [{:page page :blocks blocks}]
                            :properties properties
                            :classes classes}]
    (merge-export-maps page-blocks-export page-ent-export)))

(defn- build-page-export
  "Exports page for given page eid"
  [db eid]
  (let [page-entity (d/entity db eid)
        datoms (d/datoms db :avet :block/page eid)
        block-eids (mapv :e datoms)
        page-blocks* (map #(d/entity db %) block-eids)
        {:keys [content-ref-uuids content-ref-ents] :as content-ref-export} (build-content-ref-export db page-blocks*)
        page-blocks (->> page-blocks*
                         (sort-by :block/order)
                         ;; Remove property value blocks as they are exported in a block's :build/properties
                         (remove #(:logseq.property/created-from-property %)))
        {:keys [pvalue-uuids] :as blocks-export}
        (build-blocks-export db page-blocks {:include-uuid-fn content-ref-uuids})
        uuid-block-export (build-uuid-block-export db pvalue-uuids content-ref-ents {:page-entity page-entity})
        page-blocks-export (build-page-blocks-export db page-entity blocks-export)
        page-export (finalize-export-maps db page-blocks-export uuid-block-export content-ref-export)]
    page-export))

(defn- build-graph-ontology-export
  "Exports a graph's tags and properties"
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
                              (cond-> (build-export-class ent {})
                                (seq ent-properties)
                                (assoc :build/properties (buildable-properties db ent-properties properties)))))))
             (into {}))]
    (cond-> {}
      (seq properties)
      (assoc :properties properties)
      (seq classes)
      (assoc :classes classes))))

(defn- find-undefined-classes-and-properties [{:keys [classes properties pages-and-blocks]}]
  (let [referenced-classes
        (->> (concat (mapcat :build/property-classes (vals properties))
                     (keep :class/parent (vals classes))
                     (mapcat (comp :block/tags :page) pages-and-blocks)
                     (mapcat #(sqlite-build/extract-from-blocks (:blocks %) :build/tags) pages-and-blocks))
             (remove db-class/logseq-class?)
             set)
        undefined-classes (set/difference referenced-classes (set (keys classes)))
        referenced-properties
        (->> (concat (mapcat :build/class-properties (vals classes))
                     (mapcat (comp keys :build/properties :page) pages-and-blocks)
                     (mapcat #(sqlite-build/extract-from-blocks (:blocks %) (comp keys :build/properties)) pages-and-blocks))
             (remove db-property/logseq-property?)
             set)
        undefined-properties (set/difference referenced-properties (set (keys properties)))
        undefined (cond-> {}
                    (seq undefined-classes) (assoc :classes undefined-classes)
                    (seq undefined-properties) (assoc :properties undefined-properties))]
    ;; (prn :rclasses referenced-classes)
    ;; (prn :rproperties referenced-properties)
    undefined))

(defn- find-undefined-uuids [{:keys [classes properties pages-and-blocks]}]
  (let [known-uuids
        (->> (concat (keep :block/uuid (vals classes))
                     (keep :block/uuid (vals properties))
                     (keep #(get-in % [:page :block/uuid]) pages-and-blocks)
                     (mapcat #(sqlite-build/extract-from-blocks (:blocks %) (fn [m] (some-> m :block/uuid vector)))
                             pages-and-blocks))
             set)
        ref-uuids
        (->> (concat (mapcat (comp get-pvalue-uuids :build/properties) (vals classes))
                     (mapcat (comp get-pvalue-uuids :build/properties) (vals properties))
                     (mapcat (comp get-pvalue-uuids :build/properties :page) pages-and-blocks)
                     (mapcat #(sqlite-build/extract-from-blocks (:blocks %) (comp get-pvalue-uuids :build/properties)) pages-and-blocks))
             set)]
    (set/difference ref-uuids known-uuids)))

(defn- ensure-export-is-valid
  "Checks that export map is usable by sqlite.build including checking that
   all referenced properties and classes are defined"
  [export-map]
  (sqlite-build/validate-options export-map)
  (let [undefined-uuids (find-undefined-uuids export-map)
        undefined (cond-> (find-undefined-classes-and-properties export-map)
                    (seq undefined-uuids)
                    (assoc :uuids undefined-uuids))]
    (when (seq undefined)
      (throw (ex-info (str "The following classes, uuids and properties are not defined: " (pr-str undefined))
                      undefined)))))

(defn build-export
  "Handles exporting db by given export-type"
  [db {:keys [export-type] :as options}]
  (let [export-map
        (case export-type
          :block
          (build-block-export db (:block-id options))
          :page
          (build-page-export db (:page-id options))
          :graph-ontology
          (build-graph-ontology-export db))]
    (ensure-export-is-valid (dissoc export-map ::block))
    export-map))

;; Import fns
;; ==========
(defn- add-uuid-to-page-if-exists
  [db m]
  (if-let [ent (some->> (:build/journal m)
                        (d/datoms db :avet :block/journal-day)
                        first
                        :e
                        (d/entity db))]
    (assoc m :block/uuid (:block/uuid ent))
    ;; TODO: For now only check page uniqueness by title. Could handle more uniqueness checks later
    (if-let [ent (some->> (:block/title m) (ldb/get-case-page db))]
      (assoc m :block/uuid (:block/uuid ent))
      m)))

(defn- check-for-existing-entities
  "Checks export map for existing entities and adds :block/uuid to them if they exist in graph to import.
   Also checks for property conflicts between existing properties and properties to be imported"
  [db {:keys [pages-and-blocks classes properties]} property-conflicts]
  (let [export-map
        (cond-> {:build-existing-tx? true}
          (seq pages-and-blocks)
          (assoc :pages-and-blocks
                 (mapv (fn [m]
                         (update m :page (partial add-uuid-to-page-if-exists db)))
                       pages-and-blocks))
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
                      (into {}))))
        export-map'
        (walk/postwalk (fn [f]
                         (if (and (vector? f) (= :build/page (first f)))
                           [:build/page (add-uuid-to-page-if-exists db (second f))]
                           f))
                       export-map)]
    export-map'))

(defn- build-block-import-options
  "Builds options for sqlite-build to import into current-block"
  [current-block export-map]
  (let [block (merge (::block export-map)
                     {:block/uuid (:block/uuid current-block)
                      :block/page (select-keys (:block/page current-block) [:block/uuid])})
        pages-and-blocks
        [{:page (select-keys (:block/page block) [:block/uuid])
          :blocks [(dissoc block :block/page)]}]]
    (merge-export-maps export-map {:pages-and-blocks pages-and-blocks})))

(defn build-import
  "Given an entity's export map, build the import tx to create it"
  [export-map* db {:keys [current-block]}]
  (let [export-map (if (and (::block export-map*) current-block)
                     (build-block-import-options current-block export-map*)
                     export-map*)
        property-conflicts (atom [])
        export-map' (check-for-existing-entities db export-map property-conflicts)]
    (if (seq @property-conflicts)
      (do
        (js/console.error :property-conflicts @property-conflicts)
        {:error (str "The following imported properties conflict with the current graph: "
                     (pr-str (mapv :property-id @property-conflicts)))})
      (sqlite-build/build-blocks-tx export-map'))))
