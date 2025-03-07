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
  [property-ent pvalue {:keys [property-value-uuids?]}]
  (cond (and (not property-value-uuids?) (ldb/internal-page? pvalue))
        ;; Should page properties be pulled here?
        [:build/page (cond-> (shallow-copy-page pvalue)
                       (seq (:block/tags pvalue))
                       (assoc :build/tags (->build-tags (:block/tags pvalue))))]
        (and (not property-value-uuids?) (entity-util/journal? pvalue))
        [:build/page {:build/journal (:block/journal-day pvalue)}]
        :else
        (if (contains? #{:node :date} (:logseq.property/type property-ent))
          ;; Idents take precedence over uuid because they are keep data graph-agnostic
          (if (:db/ident pvalue)
            (:db/ident pvalue)
            ;; Use metadata distinguish from block references that don't exist like closed values
            ^::existing-property-value? [:block/uuid (:block/uuid pvalue)])
          (or (:db/ident pvalue)
              ;; nbb-compatible version of db-property/property-value-content
              (or (block-title pvalue)
                  (:logseq.property/value pvalue))))))

(defn- buildable-properties
  "Originally copied from db-test/readable-properties. Modified so that property values are
   valid sqlite.build EDN"
  [db ent-properties properties-config options]
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
                   (buildable-property-value-entity (d/entity db k) v options)
                   (and (set? v) (every? de/entity? v))
                   (let [property-ent (d/entity db k)]
                     (set (map #(buildable-property-value-entity property-ent % options) v)))
                   :else
                   v))]))
       (into {})))

(defn- build-export-properties
  "The caller of this fn is responsible for building :build/:property-classes unless shallow-copy?"
  [db user-property-idents {:keys [include-properties? include-timestamps? include-uuid? shallow-copy?] :as options}]
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
                         (assoc :block/uuid (:block/uuid property) :build/keep-uuid? true)
                         include-timestamps?
                         (merge (select-keys property [:block/created-at :block/updated-at]))
                         (and (not shallow-copy?) (:logseq.property/classes property))
                         (assoc :build/property-classes (mapv :db/ident (:logseq.property/classes property)))
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
                  (let [ent-properties (apply dissoc (db-property/properties ent) :block/tags db-property/schema-properties)]
                    [(:db/ident ent)
                     (cond-> build-property
                       (seq ent-properties)
                       (assoc :build/properties (buildable-properties db ent-properties properties-config options)))])))
           (into {}))
      properties-config)))

(defn- build-export-class
  "The caller of this fn is responsible for building any classes or properties from this fn
   unless shallow-copy?"
  [class-ent {:keys [include-parents? include-uuid? shallow-copy? include-timestamps?]
              :or {include-parents? true}}]
  (cond-> (select-keys class-ent [:block/title])
    include-uuid?
    (assoc :block/uuid (:block/uuid class-ent) :build/keep-uuid? true)
    include-timestamps?
    (merge (select-keys class-ent [:block/created-at :block/updated-at]))
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
  [db entity ent-properties {:keys [properties] :as options}]
  (let [new-user-property-ids (->> (keys ent-properties)
                                   (concat (->> (:block/tags entity)
                                                (mapcat :logseq.property.class/properties)
                                                (map :db/ident)))
                                   ;; Built-in properties and any possible modifications are not exported
                                   (remove db-property/logseq-property?)
                                   (remove #(get properties %)))]
    ;; Classes from here are built in build-node-classes
    (build-export-properties db new-user-property-ids options)))

(defn- build-node-export
  "Given a block/page entity and optional existing properties, build an export map of its
   tags and properties"
  [db entity {:keys [properties include-uuid-fn shallow-copy? include-timestamps?]
              :or {include-uuid-fn (constantly false)}
              :as options}]
  (let [ent-properties (dissoc (db-property/properties entity) :block/tags)
        build-tags (when (seq (:block/tags entity)) (->build-tags (:block/tags entity)))
        new-properties (when-not shallow-copy?
                         (build-node-properties db entity ent-properties (dissoc options :shallow-copy? :include-uuid-fn)))
        build-node (cond-> {:block/title (block-title entity)}
                     (:block/link entity)
                     (assoc :block/link [:block/uuid (:block/uuid (:block/link entity))])
                     (include-uuid-fn (:block/uuid entity))
                     (assoc :block/uuid (:block/uuid entity) :build/keep-uuid? true)
                     include-timestamps?
                     (merge (select-keys entity [:block/created-at :block/updated-at]))
                     (and (not shallow-copy?) (seq build-tags))
                     (assoc :build/tags build-tags)
                     (and (not shallow-copy?) (seq ent-properties))
                     (assoc :build/properties
                            (buildable-properties db ent-properties (merge properties new-properties) options)))
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

(defn- build-mixed-properties-and-classes-export
  "Builds an export of properties and classes from a mixed group of nodes that may both"
  [db ents export-opts]
  (let [properties
        (when-let [prop-ids (seq (map :db/ident (filter entity-util/property? ents)))]
          (build-export-properties db prop-ids export-opts))
        classes
        (when-let [class-ents (seq (filter ldb/class? ents))]
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
  "Given a vec of block entities, returns the blocks in a sqlite.build EDN format
   and all properties and classes used in these blocks"
  [db blocks {:keys [include-children?] :or {include-children? true} :as opts}]
  (let [*properties (atom {})
        *classes (atom {})
        *pvalue-uuids (atom #{})
        id-map (into {} (map (juxt :db/id identity)) blocks)
        children (if include-children? (group-by #(get-in % [:block/parent :db/id]) blocks) {})
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

(defn- build-page-blocks-export [db page-entity {:keys [properties classes blocks] :as options}]
  (let [page-ent-export (build-node-export db page-entity (dissoc options :classes :blocks))
        page (merge (dissoc (:node page-ent-export) :block/title)
                    (shallow-copy-page page-entity))
        page-blocks-export {:pages-and-blocks [{:page page :blocks blocks}]
                            :properties properties
                            :classes classes}]
    (merge-export-maps page-blocks-export page-ent-export)))

(defn- get-page-blocks [db eid]
  (->> (d/datoms db :avet :block/page eid)
       (map :e)
       (map #(d/entity db %))))

(defn- build-page-export*
  [db eid page-blocks* options]
  (let [page-entity (d/entity db eid)
        page-blocks (->> page-blocks*
                         (sort-by :block/order)
                         ;; Remove property value blocks as they are exported in a block's :build/properties
                         (remove #(:logseq.property/created-from-property %)))
        {:keys [pvalue-uuids] :as blocks-export}
        (build-blocks-export db page-blocks options)
        page-blocks-export (build-page-blocks-export db page-entity (merge blocks-export options))
        page-export (assoc page-blocks-export :pvalue-uuids pvalue-uuids)]
    page-export))

(defn- build-page-export
  "Exports page for given page eid"
  [db eid]
  (let [page-blocks* (get-page-blocks db eid)
        {:keys [content-ref-ents] :as content-ref-export} (build-content-ref-export db page-blocks*)
        {:keys [pvalue-uuids] :as page-export*}
        (build-page-export* db eid page-blocks* {:include-uuid-fn (:content-ref-uuids content-ref-export)})
        page-entity (d/entity db eid)
        uuid-block-export (build-uuid-block-export db pvalue-uuids content-ref-ents {:page-entity page-entity})
        page-export (finalize-export-maps db page-export* uuid-block-export content-ref-export)]
    page-export))

(defn build-view-nodes-export* [db nodes opts]
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
             (group-by :block/parent)
             (map (fn [[parent-page-ent blocks]]
                    (merge (build-blocks-export db
                                                (sort-by :block/order blocks)
                                                (merge opts {:include-children? false}))
                           {:page (shallow-copy-page parent-page-ent)}))))
        pages-to-blocks-export
        {:properties (apply merge (map :properties pages-to-blocks))
         :classes (apply merge (map :classes pages-to-blocks))
         :pages-and-blocks (mapv #(select-keys % [:page :blocks]) pages-to-blocks)}]
    (merge (merge-export-maps pages-export pages-to-blocks-export)
           {:pvalue-uuids (apply set/union (map :pvalue-uuids pages-to-blocks))})))

(defn- build-view-nodes-export
  "Exports given nodes from a view. Nodes are a random mix of blocks and pages"
  [db eids]
  (let [nodes (map #(d/entity db %) eids)
        property-value-ents (mapcat #(->> (dissoc (db-property/properties %) :block/tags)
                                          vals
                                          (filter de/entity?))
                                    nodes)
        {:keys [content-ref-uuids content-ref-ents] :as content-ref-export}
        (build-content-ref-export db (into nodes property-value-ents))
        {:keys [pvalue-uuids] :as nodes-export}
        (build-view-nodes-export* db nodes {:include-uuid-fn content-ref-uuids})
        uuid-block-export (build-uuid-block-export db pvalue-uuids content-ref-ents {})
        view-nodes-export (finalize-export-maps db nodes-export uuid-block-export content-ref-export)]
    view-nodes-export))

(defn- build-graph-ontology-export
  "Exports a graph's tags and properties"
  [db options]
  (let [user-property-idents (d/q '[:find [?db-ident ...]
                                    :where [?p :db/ident ?db-ident]
                                    [?p :block/tags :logseq.class/Property]
                                    (not [?p :logseq.property/built-in?])]
                                  db)
        properties (build-export-properties db user-property-idents (merge options {:include-properties? true}))
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
                              (cond-> (build-export-class ent options)
                                (seq ent-properties)
                                (assoc :build/properties (buildable-properties db ent-properties properties options)))))))
             (into {}))]
    (cond-> {}
      (seq properties)
      (assoc :properties properties)
      (seq classes)
      (assoc :classes classes))))

(defn- get-graph-content-ref-uuids
  [db]
  (let [block-titles (map :v (d/datoms db :avet :block/title))
        block-links (->> (d/datoms db :avet :block/link)
                         (map #(:block/uuid (d/entity db (:v %)))))
        content-ref-uuids (concat (->> block-titles
                                       (filter string?)
                                       (mapcat db-content/get-matched-ids))
                                  block-links)]
    (set content-ref-uuids)))

(defn- build-graph-pages-export
  "Handles pages, journals and their blocks"
  [db options]
  (let [page-ids (concat (map :e (d/datoms db :avet :block/tags :logseq.class/Page))
                         (map :e (d/datoms db :avet :block/tags :logseq.class/Journal)))
        page-exports (mapv (fn [eid]
                             (let [page-blocks* (get-page-blocks db eid)]
                               (build-page-export* db eid page-blocks* (merge options {:include-uuid-fn (constantly true)}))))
                           page-ids)
        pages-export (apply merge-export-maps page-exports)
        pages-export' (assoc pages-export :pvalue-uuids (set (mapcat :pvalue-uuids page-exports)))]
    pages-export'))

(defn- build-graph-files
  [db {:keys [include-timestamps?]}]
  (->> (d/q '[:find [(pull ?b [:file/path :file/content :file/created-at :file/last-modified-at]) ...]
              :where [?b :file/path]] db)
       (mapv #(if include-timestamps?
                (select-keys % [:file/path :file/content :file/created-at :file/last-modified-at])
                (select-keys % [:file/path :file/content])))))

(defn remove-uuids-if-not-ref [export-map all-ref-uuids]
  (let [remove-uuid-if-not-ref (fn [m] (if (contains? all-ref-uuids (:block/uuid m))
                                         m
                                         (dissoc m :block/uuid :build/keep-uuid?)))]
    (-> export-map
        (update :classes update-vals remove-uuid-if-not-ref)
        (update :properties update-vals remove-uuid-if-not-ref)
        (update :pages-and-blocks
                (fn [pages-and-blocks]
                  (mapv (fn [{:keys [page blocks]}]
                          {:page (remove-uuid-if-not-ref page)
                           :blocks (sqlite-build/update-each-block blocks remove-uuid-if-not-ref)})
                        pages-and-blocks))))))

(defn- build-graph-export
  "Exports whole graph. Has the following options:
   * :include-timestamps? - When set timestamps are included on all blocks"
  [db options*]
  (let [options (merge options* {:property-value-uuids? true})
        content-ref-uuids (get-graph-content-ref-uuids db)
        ontology-options (merge options {:include-uuid? true})
        ontology-export (build-graph-ontology-export db ontology-options)
        ontology-pvalue-uuids (set (concat (mapcat get-pvalue-uuids (vals (:properties ontology-export)))
                                           (mapcat get-pvalue-uuids (vals (:classes ontology-export)))))
        pages-export (build-graph-pages-export db options)
        graph-export (merge-export-maps ontology-export pages-export)
        all-ref-uuids (set/union content-ref-uuids ontology-pvalue-uuids (:pvalue-uuids pages-export))
        files (build-graph-files db options)
        ;; Remove all non-ref uuids after all nodes are built.
        ;; Only way to ensure all pvalue uuids present across block types
        graph-export' (remove-uuids-if-not-ref graph-export all-ref-uuids)]
    (merge graph-export'
           {::graph-files files})))

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
        ;; Only looks one-level deep in properties e.g. not inside :build/page
        ;; Doesn't find :block/link refs
        ref-uuids
        (->> (concat (mapcat get-pvalue-uuids (vals classes))
                     (mapcat get-pvalue-uuids (vals properties))
                     (mapcat (comp get-pvalue-uuids :page) pages-and-blocks)
                     (mapcat #(sqlite-build/extract-from-blocks (:blocks %) get-pvalue-uuids) pages-and-blocks))
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
          :view-nodes
          (build-view-nodes-export db (:node-ids options))
          :graph-ontology
          (build-graph-ontology-export db {})
          :graph
          (build-graph-export db (:graph-options options)))]
    (ensure-export-is-valid (dissoc export-map ::block ::graph-files))
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
  [db {:keys [pages-and-blocks classes properties] ::keys [graph-files]} property-conflicts]
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
                      (into {})))
          ;; Currently all files are created by app so no need to distinguish between user and built-in ones yet
          (seq graph-files)
          (assoc ::graph-files graph-files))
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
  "Given an entity's export map, build the import tx to create it. Returns a map
   of txs to transact with the following keys:
   * :init-tx - Txs that must be transacted first, usually because they define new properties
   * :block-props-tx - Txs to transact after :init-tx, usually because they use newly defined properties
   * :misc-tx - Txs to transact unrelated to other txs"
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
      (cond-> (sqlite-build/build-blocks-tx (dissoc export-map' ::graph-files))
        (seq (::graph-files export-map'))
        (assoc :misc-tx (::graph-files export-map'))))))