(ns logseq.db.sqlite.export
  "Builds sqlite.build EDN to represent nodes in a graph-agnostic way.
   Useful for exporting and importing across DB graphs"
  (:require [cljs.pprint :as pprint]
            [clojure.data :as data]
            [clojure.set :as set]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.db :as ldb]
            [logseq.db.common.entity-plus :as entity-plus]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.frontend.db :as db-db]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.frontend.validate :as db-validate]
            [logseq.db.sqlite.build :as sqlite-build]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]))

;; Export fns
;; ==========
(defn- ->build-tags [block-tags]
  (->> (map :db/ident block-tags)
       ;; These classes are redundant as :build/journal is enough for Journal and Page
       ;; is implied by being in :pages-and-blocks
       (remove #{:logseq.class/Page :logseq.class/Journal})
       set))

(defn- block-title
  "Get an entity's original title"
  [ent]
  (or (:block/raw-title ent) (:block/title ent)))

;; nbb-compatible version of db-property/property-value-content
(defn- property-value-content [pvalue]
  (or (block-title pvalue)
      (:logseq.property/value pvalue)))

(defn- shallow-copy-page
  "Given a page or journal entity, shallow copies it e.g. no properties or tags info included.
   Pages that are shallow copied are at the edges of export and help keep the export size reasonable and
   avoid exporting unexpected info"
  [page-entity]
  (if (entity-util/journal? page-entity)
    {:build/journal (:block/journal-day page-entity)}
    {:block/title (block-title page-entity)}))

(defn- build-pvalue-entity-for-build-page
  [pvalue]
  (cond (entity-util/internal-page? pvalue)
        ;; Should page properties be pulled here?
        [:build/page (cond-> (shallow-copy-page pvalue)
                       (seq (:block/tags pvalue))
                       (assoc :build/tags (->build-tags (:block/tags pvalue))))]
        (entity-util/journal? pvalue)
        [:build/page {:build/journal (:block/journal-day pvalue)}]))

(defn- build-pvalue-entity-default [ent-properties pvalue
                                    {:keys [include-pvalue-uuid-fn]
                                     :or {include-pvalue-uuid-fn (constantly false)}
                                     :as options}]
  (let [property-value-content' (property-value-content pvalue)]
    (if (or (seq ent-properties) (seq (:block/tags pvalue)) (include-pvalue-uuid-fn (:block/uuid pvalue)))
      (cond-> {:build/property-value :block
               :block/title property-value-content'}
        (seq (:block/tags pvalue))
        (assoc :build/tags (->build-tags (:block/tags pvalue)))

        (seq ent-properties)
        (assoc :build/properties ent-properties)

        (include-pvalue-uuid-fn (:block/uuid pvalue))
        (assoc :block/uuid (:block/uuid pvalue) :build/keep-uuid? true)

        (:include-timestamps? options)
        (merge (select-keys pvalue [:block/created-at :block/updated-at])))
      property-value-content')))

(defonce ignored-properties [:logseq.property/created-by-ref :logseq.property.embedding/hnsw-label-updated-at])

(defn- buildable-properties
  "Originally copied from db-test/readable-properties. Modified so that property values are
   valid sqlite.build EDN"
  [db ent-properties properties-config options]
  (letfn [(build-pvalue-entity
            [db' property-ent pvalue properties-config' {:keys [property-value-uuids?] :as options'}]
            (if-let [build-page (and (not property-value-uuids?) (build-pvalue-entity-for-build-page pvalue))]
              build-page
              (if (and (contains? #{:node :date :entity} (:logseq.property/type property-ent))
                       (not= :logseq.property/default-value (:db/ident property-ent)))
                ;; Idents take precedence over uuid because they keep data graph-agnostic
                (if (:db/ident pvalue)
                  (:db/ident pvalue)
                  ;; Use metadata to distinguish from block references that don't exist like closed values
                  ^::existing-property-value? [:block/uuid (:block/uuid pvalue)])
                (or (:db/ident pvalue)
                    (let [ent-properties* (apply dissoc (db-property/properties pvalue)
                                                 :logseq.property/value :logseq.property/created-from-property
                                                 db-property/public-db-attribute-properties)
                          ent-properties (when (and (not (:block/closed-value-property pvalue)) (seq ent-properties*))
                                           (buildable-properties db' ent-properties* properties-config' options'))]
                      (build-pvalue-entity-default ent-properties pvalue options'))))))]
    (->> (apply dissoc ent-properties ignored-properties)
         (map (fn [[k v]]
                [k
                 ;; handle user closed value properties. built-ins have idents and shouldn't be handled here
                 (if (and (not (db-property/logseq-property? k))
                          (or (:block/closed-value-property v)
                              (and (set? v) (:block/closed-value-property (first v)))))
                   (let [find-closed-uuid (fn [val]
                                            (or (some #(when (= (:value %) (db-property/property-value-content val))
                                                         (:uuid %))
                                                      (get-in properties-config [k :build/closed-values]))
                                                (throw (ex-info (str "No closed value found for content: " (pr-str (db-property/property-value-content val))) {:properties properties-config}))))]
                     (if (set? v)
                       (set (map #(vector :block/uuid (find-closed-uuid %)) v))
                       [:block/uuid (find-closed-uuid v)]))
                   (cond
                     (de/entity? v)
                     (build-pvalue-entity db (d/entity db k) v properties-config options)
                     (and (set? v) (every? de/entity? v))
                     (let [property-ent (d/entity db k)]
                       (set (map #(build-pvalue-entity db property-ent % properties-config options) v)))
                     :else
                     v))]))
         (into {}))))

(defn- build-export-properties
  "The caller of this fn is responsible for building :build/:property-classes unless shallow-copy?"
  [db user-property-idents {:keys [include-properties? include-timestamps? include-uuid? shallow-copy? include-alias?] :as options}]
  (let [properties-config-by-ent
        (->> user-property-idents
             (map (fn [ident]
                    (let [property (d/entity db ident)
                          closed-values (entity-plus/lookup-kv-then-entity property :property/closed-values)]
                      [property
                       (cond-> (select-keys property
                                            (-> (disj db-property/schema-properties :logseq.property/classes)
                                                (into [:block/title :block/collapsed?])))
                         include-uuid?
                         (assoc :block/uuid (:block/uuid property) :build/keep-uuid? true)
                         include-timestamps?
                         (merge (select-keys property [:block/created-at :block/updated-at]))
                         (and (not shallow-copy?) include-alias? (:block/alias property))
                         (assoc :block/alias (set (map #(vector :block/uuid (:block/uuid %)) (:block/alias property))))
                         (and (not shallow-copy?) (:logseq.property/classes property))
                         (assoc :build/property-classes (set (map :db/ident (:logseq.property/classes property))))
                         (seq closed-values)
                         (assoc :build/closed-values
                                (mapv #(cond-> {:value (db-property/property-value-content %)
                                                :uuid (:block/uuid %)}
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
                  (let [ent-properties (apply dissoc (db-property/properties ent)
                                              (into db-property/schema-properties db-property/public-db-attribute-properties))
                        build-properties (buildable-properties db ent-properties properties-config options)]
                    [(:db/ident ent)
                     (cond-> build-property
                       (seq build-properties)
                       (assoc :build/properties build-properties))])))
           (into {}))
      properties-config)))

(defn- build-export-class
  "The caller of this fn is responsible for building any classes or properties from this fn
   unless shallow-copy?"
  [class-ent {:keys [include-uuid? shallow-copy? include-timestamps? include-alias?]}]
  (cond-> (select-keys class-ent [:block/title :block/collapsed?])
    include-uuid?
    (assoc :block/uuid (:block/uuid class-ent) :build/keep-uuid? true)
    include-timestamps?
    (merge (select-keys class-ent [:block/created-at :block/updated-at]))
    (and (:logseq.property.class/properties class-ent) (not shallow-copy?))
    (assoc :build/class-properties
           (->> (:logseq.property.class/properties class-ent)
                (sort-by :block/order)
                (mapv :db/ident)))
    (and (not shallow-copy?) include-alias? (:block/alias class-ent))
    (assoc :block/alias (set (map #(vector :block/uuid (:block/uuid %)) (:block/alias class-ent))))
    ;; It's caller's responsibility to ensure parent is included in final export
    (and (not shallow-copy?)
         (:logseq.property.class/extends class-ent)
         (not= [:logseq.class/Root] (mapv :db/ident (:logseq.property.class/extends class-ent))))
    (assoc :build/class-extends
           (set (map :db/ident (:logseq.property.class/extends class-ent))))))

(defn block-property-value? [%]
  (and (map? %) (:build/property-value %)))

(defn- build-node-classes
  [db build-block block-tags properties]
  (let [pvalue-classes (->> (:build/properties build-block)
                            vals
                            (mapcat (fn [val-or-vals]
                                      (mapcat #(cond (sqlite-build/page-prop-value? %)
                                                     (:build/tags (second %))
                                                     (block-property-value? %)
                                                     (:build/tags %))
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
  [db entity ent-properties {:keys [properties] :as options}]
  (let [collect-nested-property-ids
        (fn collect-nested-property-ids [v]
          (cond
            (and (de/entity? v) (:logseq.property/created-from-property v))
            (let [pvalue-properties (apply dissoc (db-property/properties v) db-property/public-db-attribute-properties)]
              (concat (keys pvalue-properties)
                      (mapcat collect-nested-property-ids (vals pvalue-properties))))
            (set? v)
            (mapcat collect-nested-property-ids v)
            :else
            []))
        new-user-property-ids (->> (keys ent-properties)
                                   (concat (->> (:block/tags entity)
                                                (mapcat :logseq.property.class/properties)
                                                (map :db/ident)))
                                   (concat (mapcat collect-nested-property-ids (vals ent-properties)))
                                   ;; Built-in properties and any possible modifications are not exported
                                   (remove db-property/logseq-property?)
                                   (remove #(get properties %)))]
    ;; Classes from here are built in build-node-classes
    (build-export-properties db new-user-property-ids options)))

(defn- build-node-export
  "Given a block/page entity and optional existing properties, build an export map of its
   tags and properties"
  [db entity {:keys [properties include-uuid-fn shallow-copy? include-timestamps? exclude-ontology?]
              :or {include-uuid-fn (constantly false)}
              :as options}]
  (let [ent-properties (apply dissoc (db-property/properties entity) db-property/public-db-attribute-properties)
        build-tags (when (seq (:block/tags entity)) (->build-tags (:block/tags entity)))
        new-properties (when-not (or shallow-copy? exclude-ontology?)
                         (build-node-properties db entity ent-properties (dissoc options :shallow-copy? :include-uuid-fn)))
        build-properties (when (and (not shallow-copy?) (seq ent-properties))
                           (buildable-properties db ent-properties (merge properties new-properties) options))
        build-node (cond-> {:block/title (property-value-content entity)}
                     (some? (:block/collapsed? entity))
                     (assoc :block/collapsed? (:block/collapsed? entity))
                     (:block/link entity)
                     (assoc :block/link [:block/uuid (:block/uuid (:block/link entity))])
                     (include-uuid-fn (:block/uuid entity))
                     (assoc :block/uuid (:block/uuid entity) :build/keep-uuid? true)
                     include-timestamps?
                     (merge (select-keys entity [:block/created-at :block/updated-at]))
                     (and (not shallow-copy?) (seq build-tags))
                     (assoc :build/tags build-tags)
                     (seq build-properties)
                     (assoc :build/properties build-properties))
        new-classes (when-not (or shallow-copy? exclude-ontology?)
                      (build-node-classes db build-node (:block/tags entity) new-properties))]
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
                                   (::existing-property-value? (meta %)))
                          (second %))
                       (if (set? val-or-vals) val-or-vals [val-or-vals]))))
       set))

(defn- merge-export-maps
  "Merge export maps for partial graph exports. *Do not* use for a full graph
  export because it makes assumptions about page identity"
  [& export-maps]
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

(defn- build-mixed-properties-and-classes-export
  "Builds an export of properties and classes from a mixed group of nodes that may both"
  [db ents export-opts]
  (let [properties
        (when-let [prop-ids (seq (map :db/ident (filter entity-util/property? ents)))]
          (build-export-properties db prop-ids export-opts))
        classes
        (when-let [class-ents (seq (filter entity-util/class? ents))]
          (->> class-ents
               (map #(vector (:db/ident %) (build-export-class % export-opts)))
               (into {})))]
    (cond-> {}
      properties (assoc :properties properties)
      classes (assoc :classes classes))))

(defn- build-content-ref-export
  "Builds an export config (and additional info) for refs in the given blocks. Refs are detected
   if they are a :block/link or if a `[[UUID]]` ref in the content. All the exported
   entities found in block refs include their uuid in order to preserve the relationship to the blocks"
  [db blocks*]
  (let [;; Remove property value blocks that can't have content refs
        blocks (remove :logseq.property/value blocks*)
        block-links (->> (filter :block/link blocks)
                         (map #(:block/uuid (:block/link %))))
        content-ref-uuids (into (set (mapcat (comp db-content/get-matched-ids block-title) blocks))
                                block-links)
        content-ref-ents (map #(d/entity db [:block/uuid %]) content-ref-uuids)
        content-ref-pages (filter #(or (entity-util/internal-page? %) (entity-util/journal? %)) content-ref-ents)
        {:keys [properties classes]}
        (build-mixed-properties-and-classes-export db content-ref-ents {:include-uuid? true :shallow-copy? true})]
    {:content-ref-uuids content-ref-uuids
     :content-ref-ents content-ref-ents
     :properties (update-vals properties #(merge % {:build/keep-uuid? true}))
     :classes (update-vals classes #(merge % {:build/keep-uuid? true}))
     :pages-and-blocks (mapv #(hash-map :page (merge (shallow-copy-page %)
                                                     {:block/uuid (:block/uuid %) :build/keep-uuid? true}))
                             content-ref-pages)}))

(defn- build-class-parents-export [db classes-config]
  (let [class-parent-ents (->> classes-config
                               (filter #(:build/class-extends (val %)))
                               (map #(d/entity db (key %)))
                               db-db/get-classes-parents)
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
  "Given a vec of block entities, returns the blocks in a sqlite.build EDN format
   and all properties and classes used in these blocks"
  [db blocks {:keys [include-children?] :or {include-children? true} :as opts}]
  (let [*properties (atom (or (get-in opts [:graph-ontology :properties]) {}))
        *classes (atom (or (get-in opts [:graph-ontology :classes]) {}))
        *pvalue-uuids (atom #{})
        id-map (into {} (map (juxt :db/id identity)) blocks)
        children (if include-children? (group-by #(get-in % [:block/parent :db/id]) blocks) {})
        build-block (fn build-block [block*]
                      (let [child-nodes (mapv build-block (get children (:db/id block*) []))
                            {:keys [node properties classes]}
                            (build-node-export db block* (-> (dissoc opts :graph-ontology)
                                                             (assoc :properties @*properties)))
                            new-pvalue-uuids (get-pvalue-uuids node)]
                        (when (seq properties) (swap! *properties merge properties))
                        (when (seq classes) (swap! *classes merge classes))
                        (when (seq new-pvalue-uuids) (swap! *pvalue-uuids into new-pvalue-uuids))
                        (cond-> node
                          (seq child-nodes) (assoc :build/children child-nodes))))
        roots (remove #(contains? id-map (get-in % [:block/parent :db/id])) blocks)
        exported-blocks (mapv build-block roots)]
    (cond-> {:blocks exported-blocks
             :pvalue-uuids @*pvalue-uuids}
      (not= @*properties (get-in opts [:graph-ontology :properties]))
      (assoc :properties @*properties)
      (not= @*classes (get-in opts [:graph-ontology :classes]))
      (assoc :classes @*classes))))

(defn- build-uuid-block-export [db pvalue-uuids content-ref-ents {:keys [page-entity]}]
  (let [content-ref-blocks (set (remove entity-util/page? content-ref-ents))
        uuid-block-ents-to-export (concat (map #(d/entity db [:block/uuid %]) pvalue-uuids)
                                          content-ref-blocks)
        uuid-block-pages
        (when (seq uuid-block-ents-to-export)
          (->> uuid-block-ents-to-export
               (group-by :block/page)
               ;; Remove page-entity because it's already been built for content-ref-ents
               ;; and it's unlikely and complex to handle for pvalue-uuids
               ((fn [m] (dissoc m page-entity)))
               (map (fn [[parent-page-ent blocks]]
                      (merge (build-blocks-export db
                                                  (sort-by :block/order blocks)
                                                  {:include-uuid-fn (constantly true)
                                                   ;; shallow copy to disallow failing pvalues
                                                   :shallow-copy? true})
                             {:page (shallow-copy-page parent-page-ent)})))))]
    {:properties (apply merge (map :properties uuid-block-pages))
     :classes (apply merge (map :classes uuid-block-pages))
     :pages-and-blocks (mapv #(select-keys % [:page :blocks]) uuid-block-pages)}))

(defn sort-pages-and-blocks
  "Provide a reliable sort order since this tends to be large. Helps with diffing
   and readability"
  [pages-and-blocks]
  (vec
   (sort-by #(or (get-in % [:page :block/title])
                 (some-> (get-in % [:page :build/journal]) str)
                 (str (get-in % [:page :block/uuid])))
            pages-and-blocks)))

(defn- finalize-export-maps
  "Given final export maps, merges them, adds any missing class parents and merges those in.
   If :pages-and-blocks exist, sorts them in order to have reliable sort order"
  [db & export-maps]
  (let [final-export* (apply merge-export-maps export-maps)
        class-parents-export (some->> (:classes final-export*) (build-class-parents-export db))
        merged-map (merge-export-maps final-export* class-parents-export)]
    (cond-> merged-map
      (:pages-and-blocks merged-map)
      (update :pages-and-blocks sort-pages-and-blocks))))

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

(defn- build-page-blocks-export
  "If :include-alias? option is set, the caller fn is responsible for defining alias pages"
  [db page-entity {:keys [properties classes blocks ontology-page? include-alias?] :as options}]
  (let [options' (cond-> (dissoc options :classes :blocks :graph-ontology)
                   (:exclude-ontology? options)
                   (assoc :properties (get-in options [:graph-ontology :properties])))
        page-ent-export (if ontology-page?
                          ;; Ontology pages are already built in build-graph-ontology-export
                          {:node (select-keys page-entity [:block/uuid])}
                          (build-node-export db page-entity options'))
        page-pvalue-uuids (get-pvalue-uuids (:node page-ent-export))
        page (if ontology-page?
               (:node page-ent-export)
               (merge (dissoc (:node page-ent-export) :block/title)
                      (shallow-copy-page page-entity)
                      (when (and include-alias? (:block/alias page-entity))
                        {:block/alias (set (map #(vector :block/uuid (:block/uuid %)) (:block/alias page-entity)))})))
        page-blocks-export {:pages-and-blocks [{:page page :blocks (or blocks [])}]
                            :properties properties
                            :classes classes}]
    (assoc (merge-export-maps page-blocks-export page-ent-export)
           :pvalue-uuids page-pvalue-uuids)))

(defn- get-page-blocks [db eid]
  (->> (d/datoms db :avet :block/page eid)
       (map :e)
       (map #(d/entity db %))))

(defn- remove-uuid-if-not-ref-given-uuids
  "Cleans up blocks that have uuids that are not referenced elsewhere.
   Handles a block map and its properties' value blocks (one level deep). For property
   value blocks also handles reverting the value back to its concise form as needed"
  [ref-uuids m]
  (cond-> m
    (not (contains? ref-uuids (:block/uuid m)))
    (dissoc :block/uuid :build/keep-uuid?)
    (:build/properties m)
    (update :build/properties
            (fn [props]
              (let [shrink-property-value
                    (fn shrink-property-value [v]
                      (if (block-property-value? v)
                        ;; Keep property value as map if uuid is referenced or it has unique attributes
                        (if (or (contains? ref-uuids (:block/uuid v))
                               ;; Keep this in sync with build-pvalue-entity-default
                                ((some-fn :build/tags :build/properties) v))
                          v
                          (:block/title v))
                        v))]
                (update-vals props
                             (fn [v]
                               (if (set? v)
                                 (set (map shrink-property-value v))
                                 (shrink-property-value v)))))))))

(defn- build-page-export*
  "When given the :handle-block-uuids option, handle uuid references between
  blocks including property value blocks"
  [db eid page-blocks* {:keys [handle-block-uuids?] :as options}]
  (let [page-entity (d/entity db eid)
        page-blocks (->> page-blocks*
                         (sort-by :block/order)
                         ;; Remove property value blocks as they are exported in a block's :build/properties
                         (remove :logseq.property/created-from-property))
        {:keys [pvalue-uuids] :as blocks-export*}
        (build-blocks-export db page-blocks (cond-> options
                                              handle-block-uuids?
                                              (assoc :include-uuid-fn (constantly true))))
        blocks-export (if handle-block-uuids?
                        (let [remove-uuid-if-not-ref
                              (partial remove-uuid-if-not-ref-given-uuids
                                       (set/union (set pvalue-uuids)
                                                  (when (set? (:include-uuid-fn options)) (:include-uuid-fn options))))]
                          (update blocks-export* :blocks #(sqlite-build/update-each-block % remove-uuid-if-not-ref)))
                        blocks-export*)
        ontology-page-export
        (when (and (not (:ontology-page? options))
                   (or (entity-util/class? page-entity) (entity-util/property? page-entity)))
          (build-mixed-properties-and-classes-export db [page-entity] {:include-uuid? true}))
        class-page-properties-export
        (when-let [props
                   (and (not (:ontology-page? options))
                        (entity-util/class? page-entity)
                        (->> (:logseq.property.class/properties page-entity)
                             (map :db/ident)
                             seq))]
          {:properties (build-export-properties db props {:shallow-copy? true})})
        page-block-options (cond-> blocks-export
                             ontology-page-export
                             (merge-export-maps ontology-page-export class-page-properties-export)
                             true
                             (merge options
                                    {:blocks (:blocks blocks-export)}
                                    (when ontology-page-export {:ontology-page? true})))
        page-blocks-export (build-page-blocks-export db page-entity page-block-options)
        page-block-uuids (set/union pvalue-uuids (:pvalue-uuids page-blocks-export))
        page-export (assoc page-blocks-export :pvalue-uuids page-block-uuids)]
    page-export))

(defn- build-page-export
  "Exports page for given page eid"
  [db eid]
  (let [page-blocks* (get-page-blocks db eid)
        {:keys [content-ref-ents] :as content-ref-export} (build-content-ref-export db page-blocks*)
        {:keys [pvalue-uuids] :as page-export*}
        (build-page-export* db eid page-blocks* {:include-uuid-fn (:content-ref-uuids content-ref-export)
                                                 :include-pvalue-uuid-fn (:content-ref-uuids content-ref-export)
                                                 :handle-block-uuids? true
                                                 :include-alias? true})
        page-entity (d/entity db eid)
        uuid-block-export (build-uuid-block-export db pvalue-uuids content-ref-ents {:page-entity page-entity})
        alias-export (when (:block/alias page-entity)
                       {:pages-and-blocks (mapv #(hash-map :page (merge (shallow-copy-page %)
                                                                        {:block/uuid (:block/uuid %) :build/keep-uuid? true}))
                                                (:block/alias page-entity))})
        page-export (finalize-export-maps db page-export* uuid-block-export content-ref-export alias-export)]
    page-export))

(defn- build-nodes-export
  "Export a mix of pages and blocks"
  [db nodes opts]
  (let [node-pages (filter entity-util/page? nodes)
        pages-export
        (merge
         (build-mixed-properties-and-classes-export db node-pages {:shallow-copy? true})
         {:pages-and-blocks (mapv #(hash-map :page (shallow-copy-page %))
                                  (filter #(or (entity-util/internal-page? %) (entity-util/journal? %)) node-pages))})
        node-blocks (remove entity-util/page? nodes)
        ;; Similar to build-uuid-block-export
        pages-to-blocks
        (->> node-blocks
             (group-by :block/page)
             (map (fn [[parent-page-ent blocks]]
                    (merge (build-blocks-export db (sort-by :block/order blocks) opts)
                           {:page (shallow-copy-page parent-page-ent)}))))
        pages-to-blocks-export
        {:properties (apply merge (map :properties pages-to-blocks))
         :classes (apply merge (map :classes pages-to-blocks))
         :pages-and-blocks (mapv #(select-keys % [:page :blocks]) pages-to-blocks)}]
    (merge (merge-export-maps pages-export pages-to-blocks-export)
           {:pvalue-uuids (apply set/union (map :pvalue-uuids pages-to-blocks))})))

(defn- build-view-nodes-export
  "Exports given nodes from a view. Nodes are a random mix of blocks and pages"
  [db rows {:keys [group-by?]}]
  (let [eids (if group-by? (mapcat second rows) rows)
        nodes (map #(d/entity db %) eids)
        property-value-ents (mapcat #(->> (apply dissoc (db-property/properties %) db-property/public-db-attribute-properties)
                                          vals
                                          (filter de/entity?))
                                    nodes)
        {:keys [content-ref-uuids content-ref-ents] :as content-ref-export}
        (build-content-ref-export db (into nodes property-value-ents))
        {:keys [pvalue-uuids] :as nodes-export}
        (build-nodes-export db nodes {:include-uuid-fn content-ref-uuids :include-children? false})
        uuid-block-export (build-uuid-block-export db pvalue-uuids content-ref-ents {})
        view-nodes-export (finalize-export-maps db nodes-export uuid-block-export content-ref-export)]
    view-nodes-export))

(defn- build-selected-nodes-export
  "Exports given nodes selected by a user. Nodes can be a mix of blocks and pages"
  [db eids]
  (let [top-level-nodes (map #(d/entity db %) eids)
        children-nodes (->> top-level-nodes
                            ;; Remove pages b/c when selected their children are not highlighted
                            (remove entity-util/page?)
                            (mapcat #(rest (ldb/get-block-and-children db (:block/uuid %))))
                            (remove :logseq.property/created-from-property))
        nodes (concat top-level-nodes children-nodes)
        property-value-ents (mapcat #(->> (apply dissoc (db-property/properties %) db-property/public-db-attribute-properties)
                                          vals
                                          (filter de/entity?))
                                    nodes)
        {:keys [content-ref-uuids content-ref-ents] :as content-ref-export}
        (build-content-ref-export db (into nodes property-value-ents))
        {:keys [pvalue-uuids] :as nodes-export}
        (build-nodes-export db nodes {:include-uuid-fn content-ref-uuids :include-children? true})
        uuid-block-export (build-uuid-block-export db pvalue-uuids content-ref-ents {})
        view-nodes-export (finalize-export-maps db nodes-export uuid-block-export content-ref-export)]
    view-nodes-export))

(defn- build-graph-ontology-export
  "Exports a graph's tags and properties"
  [db {:keys [exclude-namespaces] :as options}]
  (let [exclude-regex (when (seq exclude-namespaces)
                        (re-pattern (str "^("
                                         (string/join "|" (map name exclude-namespaces))
                                         ")(\\.|$)")))
        user-property-idents (d/q '[:find [?db-ident ...]
                                    :where [?p :db/ident ?db-ident]
                                    [?p :block/tags :logseq.class/Property]
                                    (not [?p :logseq.property/built-in?])]
                                  db)
        user-property-idents' (if (seq exclude-namespaces)
                                (remove #(re-find exclude-regex (namespace %)) user-property-idents)
                                user-property-idents)
        properties (build-export-properties db user-property-idents' (merge options {:include-properties? true}))
        class-ents (->> (d/q '[:find [?class ...]
                               :where [?class :block/tags :logseq.class/Tag]
                               (not [?class :logseq.property/built-in?])]
                             db)
                        (map #(d/entity db %))
                        (remove #(and (seq exclude-namespaces) (re-find exclude-regex (namespace (:db/ident %))))))
        classes
        (->> class-ents
             (map (fn [ent]
                    (let [ent-properties (apply dissoc (db-property/properties ent) :logseq.property.class/extends db-property/public-db-attribute-properties)]
                      (vector (:db/ident ent)
                              (let [build-properties
                                    (-> (buildable-properties db ent-properties properties options)
                                        (dissoc :logseq.property.class/properties))]
                                (cond-> (build-export-class ent options)
                                  (seq build-properties)
                                  (assoc :build/properties build-properties)))))))
             (into {}))]
    (cond-> {}
      (seq properties)
      (assoc :properties properties)
      (seq classes)
      (assoc :classes classes))))

(defn- get-graph-content-ref-uuids
  [db {:keys [:exclude-built-in-pages?]}]
  (let [;; Add support for exclude-built-in-pages? and block-titles as needed
        block-titles (map :v (d/datoms db :avet :block/title))
        block-links (if exclude-built-in-pages?
                      (->> (d/datoms db :avet :block/link)
                           (keep #(when-not (:logseq.property/built-in? (:block/page (d/entity db (:e %))))
                                    (:block/uuid (d/entity db (:v %))))))
                      (->> (d/datoms db :avet :block/link)
                           (map #(:block/uuid (d/entity db (:v %))))))
        content-ref-uuids (concat (->> block-titles
                                       (filter string?)
                                       (mapcat db-content/get-matched-ids))
                                  block-links)]
    (set content-ref-uuids)))

(defn- build-graph-pages-export
  "Handles pages, journals and their blocks"
  [db graph-ontology options*]
  (let [options (merge options*
                       {:graph-ontology graph-ontology}
                       ;; dont exclude when ontology is incomplete because :closed values can fail so have to build ontology
                       (when (empty? (:exclude-namespaces options*))
                         {:exclude-ontology? true}))
        page-ids (concat (map :e (d/datoms db :avet :block/tags :logseq.class/Page))
                         (map :e (d/datoms db :avet :block/tags :logseq.class/Journal)))
        ontology-ids (set/union (set (map :e (d/datoms db :avet :block/tags :logseq.class/Tag)))
                                (set (map :e (d/datoms db :avet :block/tags :logseq.class/Property))))
        page-exports (mapv (fn [eid]
                             (let [page-blocks (get-page-blocks db eid)]
                               (build-page-export* db eid page-blocks (merge options {:include-uuid-fn (constantly true)
                                                                                      :include-pvalue-uuid-fn (constantly true)}))))
                           page-ids)
        ontology-page-exports
        (vec
         (keep (fn [eid]
                 (when-let [page-blocks (seq (remove :logseq.property/created-from-property (get-page-blocks db eid)))]
                   (build-page-export* db eid page-blocks (merge options {:include-uuid-fn (constantly true)
                                                                          :include-pvalue-uuid-fn (constantly true)
                                                                          :ontology-page? true}))))
               ontology-ids))
        page-exports' (remove (fn [page-export]
                                (and (:exclude-built-in-pages? options)
                                     (get-in page-export [:pages-and-blocks 0 :page :build/properties :logseq.property/built-in?])))
                              (concat page-exports ontology-page-exports))
        alias-uuids  (concat (mapcat (fn [{:keys [pages-and-blocks]}]
                                       (mapcat #(map second (get-in % [:page :block/alias]))
                                               pages-and-blocks))
                                     page-exports')
                             (mapcat #(map second (:block/alias %))
                                     (vals (:classes graph-ontology)))
                             (mapcat #(map second (:block/alias %))
                                     (vals (:properties graph-ontology))))
        uuids-to-keep (set/union (set (mapcat :pvalue-uuids page-exports'))
                                 (set alias-uuids)
                                 (set (map #(get-in % [:pages-and-blocks 0 :page :block/uuid]) ontology-page-exports)))
        pages-export {:pages-and-blocks (vec (mapcat :pages-and-blocks page-exports'))
                      ;; :pvalue-uuids is a misleading name here but using it to keep uuid key consistent across exports
                      :pvalue-uuids uuids-to-keep}]
    pages-export))

(defn- build-graph-files
  [db {:keys [include-timestamps?]}]
  (->> (d/q '[:find [(pull ?b [:file/path :file/content :file/created-at :file/last-modified-at]) ...]
              :where [?b :file/path]] db)
       (mapv #(if include-timestamps?
                (select-keys % [:file/path :file/content :file/created-at :file/last-modified-at])
                (select-keys % [:file/path :file/content])))))

(defn- build-kv-values
  [db]
  (->> (d/q '[:find [(pull ?b [:db/ident :kv/value]) ...]
              :where [?b :kv/value]] db)
       ;; Don't export schema-version as frontend sets this and shouldn't be overridden
       (remove #(= :logseq.kv/schema-version (:db/ident %)))
       vec))

(defn- build-property-history
  "Builds property history. Always include timestamps regardless of :include-timestamps? because
   timestamps are a necessary part of history"
  [db]
  (->> (d/q '[:find [(pull ?b [:block/uuid
                               :block/created-at
                               {:logseq.property.history/block [:block/uuid]}
                               {:logseq.property.history/property [:db/ident]}
                               {:logseq.property.history/ref-value [:db/ident :block/uuid]}
                               :logseq.property.history/scalar-value]) ...]
              :where [?b :logseq.property.history/block]] db)
       (map (fn [history]
              (cond-> (-> history
                          (update :logseq.property.history/block
                                  (fn [m] [:block/uuid (:block/uuid m)]))
                          (update :logseq.property.history/property :db/ident)
                          (update :logseq.property.history/ref-value
                                  (fn [m]
                                    (if (:db/ident m)
                                      (:db/ident m)
                                      [:block/uuid (:block/uuid m)]))))
                (nil? (:logseq.property.history/ref-value history))
                (dissoc :logseq.property.history/ref-value)
                (not (contains? history :logseq.property.history/scalar-value))
                (dissoc :logseq.property.history/scalar-value))))
       set))

(defn remove-uuids-if-not-ref [export-map all-ref-uuids]
  (let [remove-uuid-if-not-ref (partial remove-uuid-if-not-ref-given-uuids all-ref-uuids)]
    (-> export-map
        (update :classes update-vals remove-uuid-if-not-ref)
        (update :properties update-vals remove-uuid-if-not-ref)
        (update :pages-and-blocks
                (fn [pages-and-blocks]
                  (mapv (fn [{:keys [page blocks]}]
                          (let [page-map {:page (remove-uuid-if-not-ref page)
                                          :blocks (sqlite-build/update-each-block blocks remove-uuid-if-not-ref)}
                                ;; TODO: Walk data structure via :build/properties instead of slower walk
                                page-map'
                                (walk/postwalk (fn [f]
                                                 (if (block-property-value? f)
                                                   (remove-uuid-if-not-ref f)
                                                   f))
                                               page-map)]
                            page-map'))
                        pages-and-blocks))))))

(defn- add-ontology-for-include-namespaces
  "Adds :properties to export for given namespace parents. Current use case is for :exclude-namespaces
   so no need to add :classes yet"
  [db {::keys [auto-include-namespaces] :as graph-export}]
  (let [include-regex (re-pattern (str "^("
                                       (string/join "|" (map name auto-include-namespaces))
                                       ")(\\.|$)"))
        used-properties
        (->> (sqlite-build/get-used-properties-from-options graph-export)
             keys
             (remove db-property/internal-property?)
             (filter #(re-find include-regex (namespace %)))
             (map #(vector % (select-keys (d/entity db %) [:logseq.property/type :db/cardinality])))
             (into {}))]
    (-> (merge-export-maps (select-keys graph-export [:properties])
                           {:properties used-properties})
        (select-keys [:properties]))))

(defn- build-graph-export
  "Exports whole graph. Has the following options:
   * :include-timestamps? - When set, timestamps are included on all blocks except for property value blocks
   * :exclude-namespaces - A set of parent namespaces to exclude from properties and classes.
     This is useful for graphs seeded with an ontology e.g. schema.org as it eliminates noisy and needless
     export+import
   * :exclude-built-in-pages? - When set, built-in pages are excluded from export
   * :exclude-files? - When set, files are excluded from export"
  [db {:keys [exclude-files?] :as options*}]
  (let [options (merge options* {:property-value-uuids? true
                                 :include-alias? true})
        content-ref-uuids (get-graph-content-ref-uuids db options)
        ontology-options (merge options {:include-uuid? true})
        ontology-export (build-graph-ontology-export db ontology-options)
        ontology-pvalue-uuids (set (concat (mapcat get-pvalue-uuids (vals (:properties ontology-export)))
                                           (mapcat get-pvalue-uuids (vals (:classes ontology-export)))))
        pages-export (build-graph-pages-export db ontology-export (assoc options :include-pvalue-uuid-fn content-ref-uuids))
        graph-export* (-> (merge ontology-export pages-export) (dissoc :pvalue-uuids))
        graph-export (if (seq (:exclude-namespaces options))
                       (assoc graph-export* ::auto-include-namespaces (:exclude-namespaces options))
                       graph-export*)
        property-history (build-property-history db)
        property-history-ref-uuids
        (->> property-history
             (mapcat (fn [history]
                       (keep #(when (vector? %) (second %))
                             [(:logseq.property.history/block history)
                              (:logseq.property.history/ref-value history)])))
             set)
        all-ref-uuids (set/union content-ref-uuids ontology-pvalue-uuids (:pvalue-uuids pages-export)
                                 property-history-ref-uuids)
        files (when-not exclude-files? (build-graph-files db options))
        kv-values (build-kv-values db)
        ;; Remove all non-ref uuids after all nodes are built.
        ;; Only way to ensure all pvalue uuids present across block types
        graph-export' (-> (remove-uuids-if-not-ref graph-export all-ref-uuids)
                          (update :pages-and-blocks sort-pages-and-blocks)
                          (assoc ::schema-version db-schema/version))]
    (cond-> graph-export'
      (not exclude-files?)
      (assoc ::graph-files files)
      true
      (assoc ::kv-values kv-values)
      true
      (assoc ::property-history property-history))))

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
             (remove db-property/internal-property?)
             set)
        undefined-properties (set/difference referenced-properties (set (keys properties)))
        undefined (cond-> {}
                    (seq undefined-classes) (assoc :classes undefined-classes)
                    (seq undefined-properties) (assoc :properties undefined-properties))]
    ;; (prn :rclasses referenced-classes)
    ;; (prn :rproperties referenced-properties)
    undefined))

(defn- find-undefined-uuids [db {:keys [classes properties pages-and-blocks]}]
  (let [pvalue-known-uuids (atom #{})
        _ (walk/postwalk (fn [f]
                           (if (and (block-property-value? f) (:block/uuid f))
                             (swap! pvalue-known-uuids conj (:block/uuid f))
                             f))
                         pages-and-blocks)
        known-uuids
        (->> (concat (keep :block/uuid (vals classes))
                     (keep :block/uuid (vals properties))
                     (keep #(get-in % [:page :block/uuid]) pages-and-blocks)
                     (mapcat #(sqlite-build/extract-from-blocks (:blocks %) (fn [m] (some-> m :block/uuid vector)))
                             pages-and-blocks)
                     @pvalue-known-uuids)
             set)
        ;; Only looks one-level deep in properties e.g. not inside :build/page
        ;; Doesn't find :block/link refs
        ref-uuids
        (->> (concat (mapcat #(map second (:block/alias %)) (vals classes))
                     (mapcat #(map second (:block/alias %)) (vals properties))
                     (mapcat #(map second (:block/alias (:page %))) pages-and-blocks)
                     (mapcat get-pvalue-uuids (vals classes))
                     (mapcat get-pvalue-uuids (vals properties))
                     (mapcat (comp get-pvalue-uuids :page) pages-and-blocks)
                     (mapcat #(sqlite-build/extract-from-blocks (:blocks %) get-pvalue-uuids) pages-and-blocks))
             (remove (fn [id]
                       (let [eid (when id [:block/uuid id])]
                         (some->> eid
                                  (d/entity db)
                                  :logseq.property/created-from-property))))
             set)]
    (set/difference ref-uuids known-uuids)))

(defn- remove-namespaced-keys
  "Removes keys from this ns for maps passed sqlite.build fns as they don't need to validate or use them"
  [m]
  (->> m
       (remove (fn [[k _v]] (= "logseq.db.sqlite.export" (namespace k))))
       (into {})))

;; Remove if DB graphs are migrated to no longer have invalid keywords
(defn- patch-invalid-keywords
  "Fixes invalids keywords whose name start with a number e.g. :user.property/2ndsomething"
  [m]
  (let [initial-version (:kv/value (first (filter #(= :logseq.kv/graph-initial-schema-version (:db/ident %))
                                                  (::kv-values m))))]
    ;; Only ignore patch if initial version is > 64.8 since this fix started with 64.9
    (if (some-> initial-version (db-schema/compare-schema-version {:major 64 :minor 8}) pos?)
      m
      (walk/postwalk
       (fn [e]
         (if (and (keyword? e) (some-> (namespace e) (string/starts-with? "user.")))
           ;; Copied from create-db-ident-from-name since this may be shortlived
           (let [sanitized-kw (keyword (namespace e)
                                       (->> (string/replace-first (name e) #"^(\d)" "NUM-$1")
                                            (filter #(re-find #"[0-9a-zA-Z*+!_'?<>=-]{1}" %))
                                            (apply str)))]
             ;; (when (not= sanitized-kw e) (prn :sanitize e :-> sanitized-kw))
             (if (not= sanitized-kw e) sanitized-kw e))
           e))
       m))))

(defn- basic-validate-export
  "Checks that export map is usable by sqlite.build including checking that
   all referenced properties and classes are defined. This validation is not as robust
   as validate-export. Checks related to properties and
   classes are disabled when :exclude-namespaces is set because those checks can't be done"
  [db export-map* {:keys [graph-options]}]
  (let [export-map (remove-namespaced-keys export-map*)]
    (when-not (seq (:exclude-namespaces graph-options)) (sqlite-build/validate-options export-map))
    (let [undefined-uuids (find-undefined-uuids db export-map)
          undefined (cond-> {}
                      (empty? (:exclude-namespaces graph-options))
                      (merge (find-undefined-classes-and-properties export-map))
                      (seq undefined-uuids)
                      (assoc :uuids undefined-uuids))]
      (when (seq undefined)
        (throw (ex-info (str "The following classes, uuids and properties are not defined: " (pr-str undefined))
                        undefined))))))

(defn build-export
  "Handles exporting db by given export-type"
  [db {:keys [export-type] :as options}]
  (let [export-map*
        (case export-type
          :block
          (build-block-export db (:block-id options))
          :page
          (build-page-export db (:page-id options))
          :view-nodes
          (build-view-nodes-export db (:rows options) (select-keys options [:group-by?]))
          :selected-nodes
          (build-selected-nodes-export db (:node-ids options))
          :graph-ontology
          (build-graph-ontology-export db {})
          :graph
          (build-graph-export db (:graph-options options))
          (throw (ex-info (str (pr-str export-type) " is an invalid export-type") {})))
        export-map (patch-invalid-keywords export-map*)]
    (if (get-in options [:graph-options :catch-validation-errors?])
      (try
        (basic-validate-export db export-map options)
        (catch ExceptionInfo e
          (println "Caught error:" e)))
      (basic-validate-export db export-map options))
    (assoc export-map ::export-type export-type)))

;; Import fns
;; ==========
(defn- add-uuid-to-page-if-exists
  [db import-to-existing-page-uuids {:keys [existing-pages-keep-properties?]} m]
  (if-let [ent (if (:build/journal m)
                 (some->> (:build/journal m)
                          (d/datoms db :avet :block/journal-day)
                          first
                          :e
                          (d/entity db))
                 ;; TODO: For now only check page uniqueness by title. Could handle more uniqueness checks later
                 (some->> (:block/title m) (ldb/get-case-page db)))]
    (do
      (swap! import-to-existing-page-uuids assoc (:block/uuid m) (:block/uuid ent))
      (cond-> (assoc m :block/uuid (:block/uuid ent))
        (and (:build/properties m) existing-pages-keep-properties?)
        (update :build/properties (fn [props]
                                    (->> props
                                         (remove (fn [[k _v]] (get ent k)))
                                         (into {}))))))
    m))

(defn- update-existing-properties
  "Updates existing properties by ident. Also check imported and existing properties have
   the same cardinality and type to avoid failure after import"
  [db property-conflicts properties]
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
       (into {})))

(defn- check-for-existing-entities
  "Checks export map for existing entities and adds :block/uuid to them if they exist in graph to import.
   Also checks for property conflicts between existing properties and properties to be imported"
  [db {:keys [pages-and-blocks classes properties] ::keys [export-type import-options] :as export-map} property-conflicts]
  (let [import-to-existing-page-uuids (atom {})
        export-map
        (cond-> {:build-existing-tx? true
                 :extract-content-refs? false}
          (seq pages-and-blocks)
          (assoc :pages-and-blocks
                 (mapv (fn [m]
                         (update m :page (partial add-uuid-to-page-if-exists db import-to-existing-page-uuids import-options)))
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
          (assoc :properties (update-existing-properties db property-conflicts properties))
          ;; Graph export doesn't use :build/page so this speeds up build
          (= :graph export-type)
          (assoc :translate-property-values? false)
          (= :graph export-type)
          ;; Currently all graph-files are created by app so no need to distinguish between user and built-in ones yet
          (merge (dissoc export-map :pages-and-blocks :classes :properties)))
        export-map' (if (= :graph export-type)
                      export-map
                      (walk/postwalk (fn [f]
                                       (if (and (vector? f) (= :build/page (first f)))
                                         [:build/page
                                          (add-uuid-to-page-if-exists db import-to-existing-page-uuids import-options (second f))]
                                         f))
                                     export-map))
        ;; Update uuid references of all pages that had their uuids updated to reference an existing page
        export-map''
        (walk/postwalk (fn [f]
                         (if-let [new-uuid (and (vector? f) (= :block/uuid (first f))
                                                (get @import-to-existing-page-uuids (second f)))]
                           [:block/uuid new-uuid]
                           f))
                       export-map')]
    export-map''))

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
  "Given an export map, build the import tx to create it. In addition to standard sqlite.build keys,
   an export map can have the following namespaced keys:
   * ::export-type - Keyword indicating export type
   * ::block - Block map for a :block export
   * ::graph-files - Vec of files for a :graph export
   * ::kv-values - Vec of :kv/value maps for a :graph export
   * ::property-history - Set of property history blocks for a :graph export
   * ::auto-include-namespaces - A set of parent namespaces to include from properties and classes
     for a :graph export. See :exclude-namespaces in build-graph-export for a similar option
   * ::import-options - A map of options that alters importing behavior. Has the following keys:
     * :existing-pages-keep-properties? - Boolean which allows existing pages to keep existing properties

   This fn then returns a map of txs to transact with the following keys:
   * :init-tx - Txs that must be transacted first, usually because they define new properties
   * :block-props-tx - Txs to transact after :init-tx, usually because they use newly defined properties
   * :misc-tx - Txs to transact unrelated to other txs"
  [export-map* db {:keys [current-block]}]
  (let [export-map (if (and (::block export-map*) current-block)
                     (build-block-import-options current-block export-map*)
                     export-map*)
        export-map' (if (and (= :graph (::export-type export-map*)) (seq (::auto-include-namespaces export-map*)))
                      (merge (dissoc export-map :properties ::auto-include-namespaces)
                             (add-ontology-for-include-namespaces db export-map))
                      export-map)
        property-conflicts (atom [])
        export-map'' (check-for-existing-entities db export-map' property-conflicts)]
    (if (seq @property-conflicts)
      (do
        (js/console.error :property-conflicts @property-conflicts)
        {:error (str "The following imported properties conflict with the current graph: "
                     (pr-str (mapv :property-id @property-conflicts)))})
      (if (= :graph (::export-type export-map''))
        (-> (sqlite-build/build-blocks-tx (remove-namespaced-keys export-map''))
            (assoc :misc-tx (vec (concat (::graph-files export-map'')
                                         (::kv-values export-map'')
                                         (::property-history export-map'')))))
        (sqlite-build/build-blocks-tx (remove-namespaced-keys export-map''))))))

(defn create-conn
  "Create a conn for a DB graph seeded with initial data"
  []
  (let [conn (d/create-conn db-schema/schema)
        _ (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))]
    (entity-plus/reset-immutable-entities-cache!)
    conn))

(defn validate-export
  "Validates an export by creating an in-memory DB graph, importing the EDN and validating the graph.
   Returns a map with a readable :error key if any error occurs"
  [export-edn]
  (try
    (let [import-conn (create-conn)
          {:keys [init-tx block-props-tx misc-tx] :as _txs} (build-import export-edn @import-conn {})
          _ (d/transact! import-conn (concat init-tx block-props-tx misc-tx))
          validation (db-validate/validate-local-db! @import-conn)]
      (if-let [errors (seq (:errors validation))]
        (do
          (js/console.error "Exported EDN has the following invalid errors when imported into a new graph:")
          (pprint/pprint errors)
          {:error (str "The exported EDN has " (count errors) " validation error(s)")
           :db @import-conn})
        {:db @import-conn}))
    (catch :default e
      (js/console.error "Unexpected export-edn validation error:" e)
      {:error (str "The exported EDN is unexpectedly invalid: " (pr-str (ex-message e)))})))

(defn- prepare-export-to-diff
  "Prepare a graph's exported edn to be diffed with another"
  [m]
  (-> m
      (update ::kv-values
              (fn [kvs]
                (->> kvs
                     ;; This varies per copied graph so ignore it
                     (remove #(#{:logseq.kv/import-type :logseq.kv/imported-at :logseq.kv/local-graph-uuid}
                               (:db/ident %)))
                     (sort-by :db/ident)
                     vec)))))

(defn diff-exports
  "Given two graph export edns, return a vector of diffs when there is a diff and nil when there is
   no diff between the two"
  [export-map export-map2]
  (let [diff (->> (data/diff (prepare-export-to-diff export-map) (prepare-export-to-diff export-map2))
                  butlast)]
    (when-not (= [nil nil] diff)
      diff)))
