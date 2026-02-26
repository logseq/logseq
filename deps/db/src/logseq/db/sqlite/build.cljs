(ns logseq.db.sqlite.build
  "This ns provides a concise and readable EDN format to build DB graph tx-data.
  All core concepts including pages, blocks, properties and classes can be
  generated and related to each other without needing to juggle uuids or
  temporary db ids. The generated tx-data is used to create DB graphs that
  persist to sqlite or for testing with in-memory databases. See `Options` for
  the EDN format and `build-blocks-tx` which is the main fn to build tx data"
  (:require [cljs.pprint :as pprint]
            [clojure.set :as set]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [datascript.core :as d]
            [logseq.common.util :as common-util]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.common.uuid :as common-uuid]
            [logseq.db.common.order :as db-order]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.frontend.db-ident :as db-ident]
            [logseq.db.frontend.malli-schema :as db-malli-schema]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.build :as db-property-build]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.db.sqlite.util :as sqlite-util]
            [malli.core :as m]
            [malli.error :as me]))

(defn block-property-value? [%]
  (and (map? %) (:build/property-value %)))

;; should match definition in translate-property-value
(defn page-prop-value?
  [prop-value]
  (and (vector? prop-value) (= :build/page (first prop-value))))

(defn- translate-property-value
  "Translates a property value for create-graph edn. A value wrapped in vector
  may indicate a reference type e.g. [:build/page {:block/title \"some page\"}]"
  [val page-uuids]
  (if (vector? val)
    (case (first val)
      ;; Converts a page or journal name to block/uuid
      :build/page
      (let [page-name (if-let [journal-day (:build/journal (second val))]
                        ;; TODO: Make lookup more efficient than build name each time
                        (date-time-util/int->journal-title journal-day "MMM do, yyyy")
                        (:block/title (second val)))]
        (if-let [page-uuid (page-uuids page-name)]
          [:block/uuid page-uuid]
          (throw (ex-info (str "No uuid for page '" (second val) "'") {:name (second val)}))))
      :block/uuid
      val
      ;; Allow through :coll properties like
      val)
    val))

(defn- block-with-timestamps
  "Only adds timestamps to block if they don't exist"
  [block]
  (let [updated-at (common-util/time-ms)
        block (cond-> block
                (nil? (:block/updated-at block))
                (assoc :block/updated-at updated-at)
                (nil? (:block/created-at block))
                (assoc :block/created-at updated-at))]
    block))

(defn- get-ident [all-idents kw]
  (if (and (qualified-keyword? kw)
           ;; Loosen checks to any property or class for build-existing-tx?
           (or (db-property/property? kw)
               (db-class/user-class-namespace? (namespace kw))))
    kw
    (or (get all-idents kw)
        (throw (ex-info (str "No ident found for " (pr-str kw)) {})))))

(defn- ->block-properties [properties page-uuids all-idents {:keys [translate-property-values?]}]
  (let [translate-property-values (if translate-property-values?
                                    (fn translate-property-values [val]
                                      ;; set indicates a :many value
                                      (if (set? val)
                                        (set (map #(translate-property-value % page-uuids) val))
                                        (translate-property-value val page-uuids)))
                                    identity)]
    (->> (map (fn [[prop-name val]]
                [(get-ident all-idents prop-name)
                 (translate-property-values val)])
              properties)
         (into {}))))

(defn- create-page-uuids
  "Creates maps of unique page names, block contents and property names to their uuids. Used to
   provide user references for translate-property-value"
  [pages-and-blocks]
  (->> pages-and-blocks
       (map :page)
       (map (juxt :block/title :block/uuid))
       (into {})))

(def current-db-id (atom 0))
(def new-db-id
  "Provides the next temp :db/id to use in a create-graph transact!"
  #(swap! current-db-id dec))

(defn- build-property-map-for-pvalue-tx
  "Returns a property map if the given property pair should have a property value entity constructured
   or nil if it should not. Property maps must at least contain the :db/ident and :logseq.property/type keys"
  [k v new-block properties-config all-idents]
  (if-let [built-in-type (get-in db-property/built-in-properties [k :schema :type])]
    (if (and (db-property-type/value-ref-property-types built-in-type)
             ;; closed values are referenced by their :db/ident so no need to create values
             (not (get-in db-property/built-in-properties [k :closed-values])))
      {:db/ident k
       :logseq.property/type built-in-type}
      (when-let [built-in-type' (get (or (:build/properties-ref-types new-block)
                                         ;; Reasonable default for properties like logseq.property/default-value
                                         {:entity :number})
                                     built-in-type)]
        ;; Don't build property value entity if values are :block/uuid refs
        (when (if (set? v) (not (vector? (first v))) (not (vector? v)))
          {:db/ident k
           :logseq.property/type built-in-type'})))
    (when (and (db-property-type/value-ref-property-types (get-in properties-config [k :logseq.property/type]))
               ;; Don't build property value entity if values are :block/uuid refs
               (if (set? v) (not (vector? (first v))) (not (vector? v))))
      (let [prop-type (get-in properties-config [k :logseq.property/type])]
        {:db/ident (get-ident all-idents k)
         :original-property-id k
         :logseq.property/type prop-type}))))

(declare ->property-value-tx-m)

(defn- build-pvalue [properties-config all-idents closed-value-id v]
  (let [pvalue-uuid (or (:block/uuid v) (random-uuid))
        nested-pvalue-tx-m
        (when (seq (:build/properties v))
          (some-> (->property-value-tx-m {:block/uuid pvalue-uuid}
                                         (:build/properties v)
                                         properties-config
                                         all-idents)
                  ;; add :db/id to ensure datascript consistently creates this new tx
                  (update-vals (fn [prop-val]
                                 (cond
                                   (map? prop-val)
                                   (assoc prop-val :db/id (new-db-id))
                                   (set? prop-val)
                                   (set (map #(if (map? %)
                                                (assoc % :db/id (new-db-id))
                                                %)
                                             prop-val))
                                   :else
                                   prop-val)))))]
    {:attributes
     (when (:build/property-value v)
       (merge (:build/properties v)
              nested-pvalue-tx-m
              {:block/tags (mapv #(hash-map :db/ident (get-ident all-idents %))
                                 (:build/tags v))}
              (select-keys v [:block/created-at :block/updated-at])
              {:block/uuid pvalue-uuid}))
     :value
     (cond
       closed-value-id
       closed-value-id
       (:build/property-value v)
       (or (:logseq.property/value v) (:block/title v))
       :else
       v)}))

(defn- ->property-value-tx-m
  "Given a new block and its properties, creates a map of properties which have values of property value tx.
   This map is used for both creating the new property values and then adding them to a block.
   This fn is similar to sqlite-create-graph/->property-value-tx-m and we may want to reuse it from here later."
  [new-block properties properties-config all-idents]
  (->> properties
       (keep (fn [[k v]]
               (when-let [property-map (build-property-map-for-pvalue-tx k v new-block properties-config all-idents)]
                 [property-map
                  (let [property (when (keyword? k) (get properties-config k))
                        closed-value-id (when property (some (fn [item]
                                                               (when (= (:value item) v)
                                                                 (:uuid item)))
                                                             (get property :build/closed-values)))
                        build-pvalue' #(build-pvalue properties-config all-idents closed-value-id %)]
                    (if (set? v) (set (map build-pvalue' v)) (build-pvalue' v)))])))
       ((fn [x]
          (db-property-build/build-property-values-tx-m new-block x {:pvalue-map? true})))))

(defn- extract-basic-content-refs
  "Extracts basic refs from :block/title like `[[foo]]` or `[[UUID]]`. Can't
  use db-content/get-matched-ids because of named ref support.  Adding more ref
  support would require parsing each block with mldoc and extracting with
  text/extract-refs-from-mldoc-ast"
  [s]
  ;; FIXME: Better way to ignore refs inside a macro
  (if (string/starts-with? s "{{")
    []
    (map second (re-seq page-ref/page-ref-re s))))

(defn- ->block-tx [{:keys [build/properties] :as m} page-uuids all-idents page-id
                   {properties-config :properties :keys [build-existing-tx? extract-content-refs?] :as options}]
  (let [build-existing-tx?' (and build-existing-tx? (::existing-block? (meta m)) (not (:build/keep-uuid? m)))
        block (if build-existing-tx?'
                (select-keys m [:block/uuid])
                {:db/id (new-db-id)
                 :block/page {:db/id page-id}
                 :block/order (db-order/gen-key nil)
                 :block/parent (or (:block/parent m) {:db/id page-id})})
        pvalue-tx-m (->property-value-tx-m block properties properties-config all-idents)
        ref-strings (when extract-content-refs? (extract-basic-content-refs (:block/title m)))]
    (cond-> []
      ;; Place property values first since they are referenced by block
      (seq pvalue-tx-m)
      (into (mapcat #(if (set? %) % [%]) (vals pvalue-tx-m)))
      true
      (conj (merge (if build-existing-tx?' {:block/updated-at (common-util/time-ms)} (block-with-timestamps block))
                   (dissoc m :build/properties :build/tags :build/keep-uuid?)
                   (when (seq properties)
                     (->block-properties (merge properties (db-property-build/build-properties-with-ref-values pvalue-tx-m))
                                         page-uuids all-idents options))
                   (when-let [tags (:build/tags m)]
                     {:block/tags (mapv #(hash-map :db/ident (get-ident all-idents %))
                                        tags)})
                   (when (seq ref-strings)
                     ;; Use maps for uuids to avoid out of order tx issues
                     (let [block-refs (mapv #(if-let [uuid' (parse-uuid %)]
                                               (hash-map :block/uuid uuid')
                                               (hash-map :block/uuid
                                                         (or
                                                          (page-uuids %)
                                                          (throw (ex-info (str "No uuid for page ref name" (pr-str %)) {})))
                                                         :block/title %))
                                            ref-strings)]
                       {:block/title (db-content/title-ref->id-ref (:block/title m) block-refs {:replace-tag? false})
                        :block/refs block-refs})))))))

(defn- build-property-tx
  [properties page-uuids all-idents property-db-ids class-property-orders options
   [prop-name {:build/keys [property-classes] :as prop-m}]]
  (let [class-property-order (get class-property-orders prop-name)
        [new-block & additional-tx]
        (if-let [closed-values (seq (map #(merge {:uuid (random-uuid)} %) (:build/closed-values prop-m)))]
          (let [db-ident (get-ident all-idents prop-name)]
            (db-property-build/build-closed-values
             db-ident
             (:block/title prop-m)
             (assoc prop-m :db/ident db-ident :closed-values closed-values)
             {:property-attributes
              (merge {:db/id (or (property-db-ids prop-name)
                                 (throw (ex-info "No :db/id for property" {:property prop-name})))}
                     (when class-property-order
                       {:block/order class-property-order})
                     (select-keys prop-m [:build/properties-ref-types :block/created-at :block/updated-at :block/collapsed?]))}))
          [(cond-> (merge (sqlite-util/build-new-property (get-ident all-idents prop-name)
                                                          (db-property/get-property-schema prop-m)
                                                          {:block-uuid (:block/uuid prop-m)
                                                           :title (:block/title prop-m)})
                          {:db/id (or (property-db-ids prop-name)
                                      (throw (ex-info "No :db/id for property" {:property prop-name})))}
                          (select-keys prop-m [:build/properties-ref-types :block/created-at :block/updated-at :block/collapsed?]))
             class-property-order
             (assoc :block/order class-property-order))])
        pvalue-tx-m
        (->property-value-tx-m new-block (:build/properties prop-m) properties all-idents)]
    (cond-> []
      (seq pvalue-tx-m)
      (into (mapcat #(if (set? %) % [%]) (vals pvalue-tx-m)))
      true
      (conj
       (merge
        (dissoc new-block :build/properties-ref-types)
        (when-let [props (not-empty (:build/properties prop-m))]
          (->block-properties (merge props (db-property-build/build-properties-with-ref-values pvalue-tx-m))
                              page-uuids all-idents options))
        (when (seq property-classes)
          {:logseq.property/classes
           (mapv #(hash-map :db/ident (get-ident all-idents %))
                 property-classes)})))
      true
      (into additional-tx))))

(defn- class-properties->ordered-properties
  "Returns a deterministic property order inferred from :build/class-properties, using topological sorting"
  [classes]
  (let [class-properties (->> (vals classes)
                              (map :build/class-properties)
                              (filter seq))
        ;; Create first-seen unique property ids for use as a stable tie-break order
        all-properties (vec (distinct (mapcat identity class-properties)))
        property-index (zipmap all-properties (range))
        sort-by-input-order #(sort-by property-index %)
        ;; Adjacent pairs encode ordering e.g. [:p2 :p1 :p3]: #{[:p2 :p1] [:p1 :p3]}
        edges (->> class-properties
                   (mapcat #(partition 2 1 %))
                   (remove (fn [[left right]] (= left right)))
                   set)
        ;; Adjacency list by source node
        ;; Example: #{[:p2 :p1] [:p2 :p3] [:p1 :p3]} -> {:p2 [[:p2 :p1] [:p2 :p3]], :p1 [[:p1 :p3]]}
        outgoing (group-by first edges)
        ;; Count inbound edges for each property e.g. {:p2 0, :p1 1, :p3 2}
        incoming-counts (reduce (fn [m [_left right]]
                                  (update m right inc))
                                (zipmap all-properties (repeat 0))
                                edges)]
    (loop [ordered-properties []
           ;; Kahn queue: nodes with zero incoming edges, stably sorted
           queue (->> all-properties
                      (filter #(zero? (incoming-counts %)))
                      sort-by-input-order
                      vec)
           remaining-incoming incoming-counts]
      (if-let [property (first queue)]
        ;; Consume one zero-incoming node, then decrement incoming counts for its neighbors
        (let [[next-incoming unlocked]
              (reduce (fn [[incoming unlocked*] [_left next-property]]
                        (let [next-count (dec (incoming next-property))]
                          [(assoc incoming next-property next-count)
                           (if (zero? next-count) (conj unlocked* next-property) unlocked*)]))
                      [remaining-incoming []]
                      (get outgoing property))
              ;; Merge newly unlocked nodes into queue with deterministic ordering
              next-queue (->> (concat (rest queue) unlocked)
                              sort-by-input-order
                              vec)]
          (recur (conj ordered-properties property) next-queue next-incoming))
        (do
          (assert (= (count ordered-properties) (count all-properties))
                  (str "Cycle detected in :build/class-properties constraints. Ordered "
                       (count ordered-properties) " of " (count all-properties) " properties."))
          ordered-properties)))))

(defn- build-properties-tx [properties classes page-uuids all-idents {:keys [build-existing-tx?] :as options}]
  (let [properties' (if build-existing-tx?
                      (->> properties
                           (remove (fn [[_ v]] (and (:block/uuid v) (not (:build/keep-uuid? v)))))
                           (into {}))
                      properties)
        class-property-orders (->> classes
                                   class-properties->ordered-properties
                                   (#(zipmap % (db-order/gen-n-keys (count %) nil nil))))
        property-db-ids (->> (keys properties')
                             (map #(vector % (new-db-id)))
                             (into {}))
        new-properties-tx (vec
                           (mapcat (partial build-property-tx properties' page-uuids all-idents property-db-ids class-property-orders options)
                                   properties'))]
    new-properties-tx))

(defn- build-class-extends [{:build/keys [class-parent class-extends]} class-db-ids]
  (when-let [class-extends' (if class-parent
                              (do (println "Warning: :build/class-parent is deprecated and will be removed soon.")
                                  [class-parent])
                              class-extends)]
    (mapv (fn [c]
            (or (class-db-ids c)
                (if (db-malli-schema/class? c)
                  c
                  (throw (ex-info (str "No :db/id for " c) {})))))
          class-extends')))

(defn- build-classes-tx [classes properties-config uuid-maps all-idents {:keys [build-existing-tx?] :as options}]
  (let [classes' (if build-existing-tx?
                   (->> classes
                        (remove (fn [[_ v]] (and (:block/uuid v) (not (:build/keep-uuid? v)))))
                        (into {}))
                   classes)
        class-db-ids (->> (keys classes')
                          (map #(vector % (new-db-id)))
                          (into {}))
        classes-tx (vec
                    (mapcat
                     (fn [[class-name {:build/keys [class-properties] :as class-m}]]
                       (let [db-ident (get-ident all-idents class-name)
                             new-block
                             (sqlite-util/build-new-class
                              {:block/name (common-util/page-name-sanity-lc (name class-name))
                               :block/title (name class-name)
                               :block/uuid (or (:block/uuid class-m)
                                               (common-uuid/gen-uuid :db-ident-block-uuid db-ident))
                               :db/ident db-ident
                               :db/id (or (class-db-ids class-name)
                                          (throw (ex-info "No :db/id for class" {:class class-name})))})
                             pvalue-tx-m (->property-value-tx-m new-block (:build/properties class-m) properties-config all-idents)]
                         (cond-> []
                           (seq pvalue-tx-m)
                           (into (mapcat #(if (set? %) % [%]) (vals pvalue-tx-m)))
                           true
                           (conj
                            (merge
                             new-block
                             (dissoc class-m :build/properties :build/class-extends :build/class-parent :build/class-properties :build/keep-uuid?)
                             (when-let [props (not-empty (:build/properties class-m))]
                               (->block-properties (merge props (db-property-build/build-properties-with-ref-values pvalue-tx-m))
                                                   uuid-maps all-idents options))
                             (when-let [class-extends (build-class-extends class-m class-db-ids)]
                               {:logseq.property.class/extends class-extends})
                             (when class-properties
                               {:logseq.property.class/properties
                                (mapv #(hash-map :db/ident (get-ident all-idents %))
                                      class-properties)}))))))
                     classes'))]
    classes-tx))

(def Class :keyword)
(def Property :keyword)
(def Page
  [:and
   [:map
    [:block/uuid {:optional true} :uuid]
    [:block/title {:optional true} :string]
    [:build/journal {:optional true} :int]
    [:build/properties {:optional true} [:ref ::user-properties]]
    [:build/tags {:optional true} [:or [:set Class] [:vector Class]]]
    [:build/keep-uuid? {:optional true} :boolean]]
   [:fn {:error/message ":block/title, :block/uuid or :build/journal required"
         :error/path [:block/title]}
    (fn [m]
      (or (:block/title m) (:block/uuid m) (:build/journal m)))]])

(def Build-schema-registry
  "This registry contains block and properties related definitions which reference each other"
  {::block
   [:map
    [:block/title :string]
    [:build/children {:optional true} [:vector [:ref ::block]]]
    [:build/properties {:optional true} [:ref ::user-properties]]
    [:build/tags {:optional true} [:or [:set Class] [:vector Class]]]
    [:build/keep-uuid? {:optional true} :boolean]]
   ;; Used primarily by text-ref property values like :default
   ::block-property-value
   [:and
    [:ref ::block]
    [:map
     [:build/property-value [:= :block]]]]
   ;; Used for any other ref property value
   ::block-uuid-property-value
   [:tuple [:= :block/uuid] :uuid]
   ;; Used as a convenient way to embed pages in non :graph type exports
   ::build-page-property-value
   [:tuple [:= :build/page] Page]
   ::property-value
   [:or
    ;; All ref property values
    [:ref ::build-page-property-value]
    [:ref ::block-uuid-property-value]
    [:ref ::block-property-value]
    ;; All scalar property values as enumerated in logseq.db.frontend.property.type
    :any]
   ::property-values
   [:or [:ref ::property-value] [:set [:ref ::property-value]]]
   ::user-properties
   [:map-of Property [:ref ::property-values]]})

;; Having the schema here instead of Options allows the schemas below to be public facing
(def User-properties
  [:schema
   {:registry Build-schema-registry}
   [:ref ::user-properties]])

(def Page-blocks
  [:schema
   {:registry Build-schema-registry}
   [:map
    {:closed true}
    [:page Page]
    [:blocks {:optional true} [:vector [:ref ::block]]]]])

(def Properties
  [:map-of
   Property
   [:map
    [:build/properties {:optional true} User-properties]
    [:build/properties-ref-types {:optional true}
     [:map-of :keyword :keyword]]
    [:build/closed-values
     {:optional true}
     [:vector [:map
               [:value [:or :string :double]]
               [:uuid {:optional true} :uuid]
               [:icon {:optional true} :map]]]]
    [:build/property-classes {:optional true} [:or [:set Class] [:vector Class]]]
    [:build/keep-uuid? {:optional true} :boolean]]])

(def Classes
  [:map-of
   Class
   [:map
    [:build/properties {:optional true} User-properties]
    [:build/class-extends {:optional true} [:or [:set Class] [:vector Class]]]
    [:build/class-properties {:optional true} [:vector Property]]
    [:build/keep-uuid? {:optional true} :boolean]]])

(def Options
  "Main malli schema that validates a sqlite.build EDN map. If an inner schema
  uses :vector e.g. :blocks, it's to preserve :block/order-ing for that node's
  attribute. If an inner schema uses :vector or :set e.g. :build/class-extends,
  it's to indicate it is order-less and also allow users to write the more
  familiar vector syntax"
  [:map
   {:closed true}
   ;; TODO: Make this respect :block/order or allow :set
   [:pages-and-blocks {:optional true} [:vector Page-blocks]]
   [:properties {:optional true} Properties]
   [:classes {:optional true} Classes]
   [:graph-namespace {:optional true} :keyword]
   [:page-id-fn {:optional true} :any]
   [:auto-create-ontology? {:optional true} :boolean]
   [:build-existing-tx? {:optional true} :boolean]
   [:extract-content-refs? {:optional true} :boolean]
   [:translate-property-values? {:optional true} :boolean]])

(defn get-used-properties-from-options
  "Extracts all used properties as a map of properties to their property values. Looks at properties
   from :build/properties and :build/class-properties. Properties from :build/class-properties have
   a ::no-value value"
  [{:keys [pages-and-blocks properties classes]}]
  (let [page-block-properties (->> pages-and-blocks
                                   (map #(-> (:blocks %) vec (conj (:page %))))
                                   (mapcat (fn build-node-props-vec [nodes]
                                             (mapcat (fn [m]
                                                       (let [nested-pvalue-pages
                                                             (->> (vals (:build/properties m))
                                                                  (mapcat #(if (set? %) % [%]))
                                                                  (keep #(cond
                                                                           (page-prop-value? %)
                                                                           (second %)
                                                                           (block-property-value? %)
                                                                           %
                                                                           :else
                                                                           nil))
                                                                  seq)]
                                                         (if nested-pvalue-pages
                                                           (into (vec (:build/properties m))
                                                                 (build-node-props-vec nested-pvalue-pages))
                                                           (:build/properties m))))
                                                     nodes)))
                                   set)
        property-properties (->> (vals properties)
                                 (mapcat #(into [] (:build/properties %))))
        class-properties (->> (vals classes)
                              (mapcat #(concat (map (fn [p] [p ::no-value]) (:build/class-properties %))
                                               (into [] (:build/properties %))))
                              set)
        props-to-values (->> (set/union class-properties page-block-properties property-properties)
                             (group-by first)
                             ((fn [x] (update-vals x #(mapv second %)))))]
    props-to-values))

;; TODO: How to detect these idents don't conflict with existing? :db/add?
(defn- create-all-idents
  [properties classes {:keys [graph-namespace]}]
  (let [create-property-ident (if graph-namespace
                                (fn create-property-ident [kw]
                                  (db-ident/create-db-ident-from-name (str (name graph-namespace) ".property")
                                                                      (name kw)))
                                (fn create-property-ident [kw]
                                  (if (qualified-keyword? kw)
                                    (do
                                      (assert (db-property/user-property-namespace? (namespace kw))
                                              "Property ident must have valid namespace")
                                      (db-ident/create-db-ident-from-name (namespace kw) (name kw)))
                                    (db-property/create-user-property-ident-from-name (name kw)))))
        property-idents (->> (keys properties)
                             (map #(vector % (create-property-ident %)))
                             (into {}))
        _ (assert (= (count (set (vals property-idents))) (count properties))
                  (str "All property db-idents must be unique but the following are duplicates: "
                       (->> property-idents vals frequencies (keep (fn [[k v]] (when (> v 1) k))))))
        create-class-ident (if graph-namespace
                             (fn create-class-ident [kw]
                               (db-ident/create-db-ident-from-name (str (name graph-namespace) ".class")
                                                                   (name kw)))
                             (fn create-class-ident [kw]
                               (if (qualified-keyword? kw)
                                 (do
                                   (assert (db-class/user-class-namespace? (namespace kw))
                                           "Class ident must have valid namespace")
                                   (db-ident/create-db-ident-from-name (namespace kw) (name kw)))
                                 (db-class/create-user-class-ident-from-name nil (name kw)))))
        class-idents (->> (keys classes)
                          (map #(vector % (create-class-ident %)))
                          (into {}))
        _ (assert (= (count (set (vals class-idents))) (count classes)) "All class db-idents must be unique")
        all-idents (merge property-idents class-idents)]
    (assert (= (count all-idents) (+ (count property-idents) (count class-idents)))
            "Class and property db-idents are unique and do not overlap")
    all-idents))

(defn- build-page-tx [page all-idents page-uuids properties {:keys [build-existing-tx?] :as options}]
  (let [page' (dissoc page :build/tags :build/properties :build/keep-uuid?)
        pvalue-tx-m (->property-value-tx-m page' (:build/properties page) properties all-idents)]
    (cond-> []
      (seq pvalue-tx-m)
      (into (mapcat #(if (set? %) % [%]) (vals pvalue-tx-m)))
      true
      (conj
       (merge
        (if build-existing-tx?
          {:block/updated-at (common-util/time-ms)}
          (select-keys (block-with-timestamps page') [:block/created-at :block/updated-at]))
        page'
        (when (seq (:build/properties page))
          (->block-properties (merge (:build/properties page) (db-property-build/build-properties-with-ref-values pvalue-tx-m))
                              page-uuids all-idents options))
        (when-let [tag-idents (->> (:build/tags page) (map #(get-ident all-idents %)) seq)]
          {:block/tags (cond-> (mapv #(hash-map :db/ident %) tag-idents)
                         (empty? (set/intersection (set tag-idents) db-class/page-classes))
                         (conj :logseq.class/Page))}))))))

(defn- build-pages-and-blocks-tx
  [pages-and-blocks all-idents page-uuids {:keys [page-id-fn properties build-existing-tx?]
                                           :or {page-id-fn :db/id}
                                           :as options}]
  (vec
   (mapcat
    (fn [{:keys [page blocks]}]
      (let [build-existing-tx?' (and build-existing-tx? (not (::new-page? (meta page))) (not (:build/keep-uuid? page)))
            page' (if build-existing-tx?'
                    page
                    (merge
                     ;; TODO: Use sqlite-util/build-new-page
                     {:db/id (or (:db/id page) (new-db-id))
                      :block/title (or (:block/title page) (string/capitalize (:block/name page)))
                      :block/name (or (:block/name page) (common-util/page-name-sanity-lc (:block/title page)))
                      :block/tags #{:logseq.class/Page}}
                     (dissoc page :db/id :block/name :block/title)))
            page-id-fn' (if (and build-existing-tx? (not (::new-page? (meta page))))
                          #(vector :block/uuid (:block/uuid %))
                          page-id-fn)]
        (into
         ;; page tx
         (if (and build-existing-tx?' (not (:build/properties page')) (not (:build/tags page')))
           ;; Minimally update existing unless there is useful data to update e.g. properties and tags
           [(select-keys page [:block/uuid :block/created-at :block/updated-at])]
           (build-page-tx page' all-idents page-uuids properties (assoc options :build-existing-tx? build-existing-tx?')))
         ;; blocks tx
         (reduce (fn [acc m]
                   (into acc
                         (->block-tx m page-uuids all-idents (page-id-fn' page') options)))
                 []
                 blocks))))
    pages-and-blocks)))

(defn- split-blocks-tx
  "Splits a vec of maps tx into maps that can immediately be transacted,
  :init-tx, and maps that need to be transacted after :init-tx, :block-props-tx, in order to use
   the correct schema e.g. user properties with :db/cardinality"
  [blocks-tx properties]
  (let [property-idents (concat (keep #(when (:db/cardinality %) (:db/ident %)) blocks-tx)
                                ;; add properties for :build-existing-tx? since they aren't in blocks-tx
                                (keys properties))
        [init-tx block-props-tx]
        (reduce (fn [[init-tx* block-props-tx*] m]
                  (let [props (select-keys m property-idents)]
                    [(if (map? m)
                       (conj init-tx* (apply dissoc m property-idents))
                       init-tx*)
                     (if (seq props)
                       (conj block-props-tx*
                             (merge {:block/uuid (or (:block/uuid m)
                                                     (throw (ex-info "No :block/uuid for block" {:block m})))}
                                    props))
                       block-props-tx*)]))
                [[] []]
                blocks-tx)]
    {:init-tx init-tx
     :block-props-tx block-props-tx}))

(defn- add-new-pages-from-refs
  "This allows top-level page blocks to contain [[named]] refs and auto create
  those pages.  This is for convenience. For robust EDN it's recommended
  to use [[UUID]] refs and handle page creation with initial build-blocks-tx options"
  [pages-and-blocks]
  (let [existing-pages (->> pages-and-blocks (keep #(get-in % [:page :block/title])) set)
        new-pages-from-refs
        (->> pages-and-blocks
             (mapcat
              (fn [{:keys [blocks]}]
                (->> blocks
                     (mapcat #(extract-basic-content-refs (:block/title %)))
                     (remove common-util/uuid-string?)
                     (remove existing-pages))))
             distinct
             (map #(hash-map :page {:block/title %})))]
    ;; (when (seq new-pages-from-refs)
    ;;   (prn :debug "Building additional pages from content refs:" (pr-str (mapv #(get-in % [:page :block/title]) new-pages-from-refs))))
    (concat new-pages-from-refs pages-and-blocks)))

(defn- add-new-pages-from-properties
  [properties pages-and-blocks]
  (let [used-properties (get-used-properties-from-options {:pages-and-blocks pages-and-blocks :properties properties})
        existing-pages (->> pages-and-blocks (keep #(select-keys (:page %) [:build/journal :block/title])) set)
        new-pages (->> (mapcat val used-properties)
                       (mapcat (fn [val-or-vals]
                                 (keep #(when (page-prop-value? %) (second %))
                                       (if (set? val-or-vals) val-or-vals [val-or-vals]))))
                       distinct
                       (remove existing-pages)
                       (map #(hash-map :page %)))]
    ;; (when (seq new-pages)
    ;;   (prn :debug "Building additional pages from property values:"
    ;;            (pr-str (mapv #(or (get-in % [:page :block/title]) (get-in % [:page :build/journal])) new-pages))))
    ;; new-pages must come first because they are referenced by pages-and-blocks
    (concat new-pages pages-and-blocks)))

(defn- expand-build-children
  "Expands any blocks with :build/children to return a flattened vec with
  children having correct :block/parent. Also ensures all blocks have a :block/uuid"
  ([data] (expand-build-children data nil))
  ([data parent-id]
   (vec
    (mapcat
     (fn [block]
       (let [block' (if (:block/uuid block)
                      (with-meta block {::existing-block? true})
                      (assoc block :block/uuid (random-uuid)))
             block'' (cond-> block'
                       true
                       (dissoc :build/children)
                       parent-id
                       (assoc :block/parent {:db/id [:block/uuid parent-id]}))
             children (:build/children block)
             child-maps (when children (expand-build-children children (:block/uuid block'')))]
         (cons block'' child-maps)))
     data))))

(defn- pre-build-pages-and-blocks
  "Pre builds :pages-and-blocks before any indexes like page-uuids are made"
  [pages-and-blocks properties {:keys [:extract-content-refs?]}]
  (let [ensure-page-uuids (fn [m]
                            (if (get-in m [:page :block/uuid])
                              m
                              (-> (assoc-in m [:page :block/uuid] (random-uuid))
                                  (update :page #(with-meta % {::new-page? true})))))
        expand-block-children (fn [m]
                                (if (:blocks m)
                                  (update m :blocks expand-build-children)
                                  m))
        expand-journal (fn [m]
                         (if-let [date-int (get-in m [:page :build/journal])]
                           (update m :page
                                   (fn [page]
                                     (let [page-name (date-time-util/int->journal-title date-int "MMM do, yyyy")]
                                       (-> (dissoc page :build/journal)
                                           (merge {:block/journal-day date-int
                                                   :block/title page-name
                                                   :block/uuid
                                                   (or (:block/uuid page) (common-uuid/gen-uuid :journal-page-uuid date-int))
                                                   :block/tags :logseq.class/Journal})
                                           (with-meta {::new-page? (not (:block/uuid page))})))))
                           m))
        ;; Order matters as some steps depend on previous step having prepared blocks or pages in a certain way
        pages (->> pages-and-blocks
                   (add-new-pages-from-properties properties)
                   (map expand-journal)
                   (map expand-block-children))]
    (cond->> pages
      extract-content-refs?
      add-new-pages-from-refs
      true
      ;; This needs to be last to ensure page metadata
      (map ensure-page-uuids)
      true
      vec)))

(defn- infer-property-schema
  "Infers a property schema given a collection of its a property pair values"
  [property-pair-values]
  ;; Infer from first property pair is good enough for now
  (let [prop-value (some #(when (not= ::no-value %) %) property-pair-values)
        prop-value' (if (set? prop-value) (first prop-value) prop-value)
        prop-type (if prop-value'
                    (if (page-prop-value? prop-value')
                      (if (:build/journal (second prop-value)) :date :node)
                      (db-property-type/infer-property-type-from-value prop-value'))
                    :default)]
    (cond-> {:logseq.property/type prop-type}
      (set? prop-value)
      (assoc :db/cardinality :many))))

(defn- auto-create-ontology
  "Auto creates properties and classes from uses of options.  Creates properties
  from any uses of :build/properties and :build/schema.properties. Creates classes from any uses of
  :build/tags"
  [{:keys [pages-and-blocks properties classes] :as options}]
  (let [new-classes (-> (remove
                         #(and (keyword? %) (db-class/logseq-class? %))
                         (concat
                          (mapcat #(mapcat :build/tags (:blocks %)) pages-and-blocks)
                          (mapcat #(get-in % [:page :build/tags]) pages-and-blocks)))
                        set
                        (set/difference (set (keys classes)))
                        (zipmap (repeat {})))
        classes' (merge new-classes classes)
        used-properties (get-used-properties-from-options options)
        new-properties (->> (set/difference (set (keys used-properties)) (set (keys properties)))
                            (remove db-property/internal-property?)
                            (map (fn [prop]
                                   [prop (infer-property-schema (get used-properties prop))]))
                            (into {}))
        properties' (merge new-properties properties)]
    ;; (when (seq new-properties) (prn :new-properties new-properties))
    ;; (when (seq new-classes) (prn :new-classes new-classes))
    {:classes classes' :properties properties'}))

(defn- get-possible-referenced-uuids
  "Gets all possible ref uuids from either [:block/uuid X] or {:build/journal X}. Uuid scraping
   is aggressive so some uuids may not be referenced"
  [input-map]
  (let [uuids (atom #{})
        _ (walk/postwalk (fn [f]
                           ;; This does get a few uuids that aren't :build/keep-uuid? but
                           ;; that's ok because it consistently gets pvalue uuids
                           (when (and (vector? f) (= :block/uuid (first f)))
                             (swap! uuids conj (second f)))
                           ;; All journals that don't have uuid and could be referenced
                           (when (and (map? f) (:build/journal f) (not (:block/uuid f)))
                             (swap! uuids conj (common-uuid/gen-uuid :journal-page-uuid (:build/journal f))))
                           f)
                         input-map)]
    @uuids))

(defn- build-blocks-tx*
  [{:keys [pages-and-blocks properties auto-create-ontology? build-existing-tx?]
    :as options}]
  (let [pages-and-blocks' (pre-build-pages-and-blocks pages-and-blocks properties (dissoc options :pages-and-blocks :properties))
        page-uuids (create-page-uuids pages-and-blocks')
        {:keys [classes properties]} (if auto-create-ontology? (auto-create-ontology options) options)
        all-idents (create-all-idents properties classes options)
        properties-tx (build-properties-tx properties classes page-uuids all-idents options)
        classes-tx (build-classes-tx classes properties page-uuids all-idents options)
        class-ident->id (->> classes-tx (map (juxt :db/ident :db/id)) (into {}))
        ;; Replace idents with db-ids to avoid any upsert issues
        properties-tx' (mapv (fn [m]
                               (if (:logseq.property/classes m)
                                 (update m :logseq.property/classes
                                         (fn [cs]
                                           (mapv #(if (db-class/logseq-class? (:db/ident %))
                                                    %
                                                    (or (some->> (:db/ident %) class-ident->id (hash-map :db/id))
                                                        ;; Allow existing user classes to be specified as idents
                                                        (when (and build-existing-tx? (some->> (:db/ident %) (get classes)))
                                                          (:db/ident %))
                                                        (throw (ex-info (str "No :db/id found for :db/ident " (pr-str %)) {}))))
                                                 cs)))
                                 m))
                             properties-tx)
        pages-and-blocks-tx (build-pages-and-blocks-tx pages-and-blocks' all-idents page-uuids
                                                       (assoc options :properties properties))
        ;; Properties first b/c they have schema and are referenced by all. Then
        ;; classes b/c they can be referenced by pages. Then pages
        split-txs (split-blocks-tx (concat properties-tx' classes-tx pages-and-blocks-tx)
                                   properties)]
    (cond-> split-txs
      ;; Just add indices option as there are too many out of order uuid cases with importing user content
      (:build-existing-tx? options)
      (update :init-tx
              (fn [init-tx]
                (let [indices
                      (mapv #(hash-map :block/uuid %)
                            (get-possible-referenced-uuids {:classes classes :properties properties :pages-and-blocks pages-and-blocks}))]
                  (into indices init-tx)))))))

;; Public API
;; ==========

(defn extract-from-blocks
  "Given a vec of blocks and a fn which applied to a block returns a coll, this
  returns the coll produced by applying f to all blocks including :build/children blocks"
  [blocks f]
  (let [apply-to-block-and-all-children
        (fn apply-to-block-and-all-children [m f]
          (into (f m)
                (when-let [children (seq (:build/children m))]
                  (mapcat #(apply-to-block-and-all-children % f) children))))]
    (mapcat #(apply-to-block-and-all-children % f) blocks)))

(defn update-each-block
  "Calls fn f on each block including all children under :build/children"
  [blocks f]
  (mapv (fn [m]
          (let [updated-m (f m)]
            (if (:build/children m)
              (assoc updated-m :build/children (update-each-block (:build/children m) f))
              updated-m)))
        blocks))

(defn validate-options
  [{:keys [properties] :as options}]
  (when-let [errors (m/explain Options options)]
    (println "The build-blocks-tx has the following options errors:")
    (pprint/pprint (me/humanize errors))
    (println "Invalid data for options errors:")
    (pprint/pprint (reduce (fn [m e]
                             (assoc-in m
                                       (:in e)
                                       (get-in options (:in e))))
                           {}
                           (:errors errors)))
    (throw (ex-info "Options validation failed" {:errors (me/humanize errors)})))
  (when-not (:auto-create-ontology? options)
    (let [used-properties (get-used-properties-from-options options)
          undeclared-properties (-> (set (keys used-properties))
                                    (set/difference (set (keys properties)))
                                    ((fn [x] (remove db-property/internal-property? x))))]
      (when (seq undeclared-properties)
        (throw (ex-info (str "The following properties used in EDN were not declared in :properties: " undeclared-properties)
                        {:used-properties (select-keys used-properties undeclared-properties)}))))))

(defn ^:large-vars/doc-var build-blocks-tx
  "Given an EDN map for defining pages, blocks and properties, this creates a map
 with two keys of transactable data for use with d/transact!. The :init-tx key
 must be transacted first and the :block-props-tx can be transacted after.
 The blocks that can be created have the following limitations:

 * Only top level blocks can be easily defined. Other level blocks can be
   defined but they require explicit setting of :block/parent

   The EDN map has the following keys:

   * :pages-and-blocks - This is a vector of maps containing a :page key and optionally a :blocks
     key when defining a page's blocks. More about each key:
     * :page - This is a datascript attribute map for pages with
       :block/title required e.g. `{:block/title \"foo\"}`. Additional keys available:
       * :build/journal - Define a journal pages as an integer e.g. 20240101 is Jan 1, 2024. :block/title
         is not required if using this since it generates one
       * :build/properties - Defines properties on a page
       * :build/tags - Defines tags on a page
       * :build/keep-uuid? - Keeps :block/uuid because another block depends on it
     * :blocks - This is a vec of datascript attribute maps for blocks with
       :block/title required. e.g. `{:block/title \"bar\"}`. Additional keys available:
       * :build/children - A vec of blocks that are nested (indented) under the current block.
          Allows for outlines to be expressed to whatever depth
       * :build/properties - Defines properties on a block
       * :build/tags - Defines tags on a block
       * :build/keep-uuid? - Keeps :block/uuid because another block depends on it
   * :properties - This is a map to configure properties where the keys are property name keywords
     and the values are maps of datascript attributes e.g. `{:logseq.property/type :checkbox}`.
     Additional keys available:
     * :build/properties - Define properties on a property page.
     * :build/closed-values - Define closed values with a vec of maps. A map contains keys :uuid, :value and :icon.
     * :build/property-classes - Vec of class name keywords. Defines a property's range classes
     * :build/properties-ref-types - Map of internal ref types to public ref types that are valid only for this property.
       Useful when remapping value ref types e.g. for :logseq.property/default-value.
       Default is `{:entity :number}`
     * :build/keep-uuid? - Keeps :block/uuid because another block depends on it
   * :classes - This is a map to configure classes where the keys are class name keywords
     and the values are maps of datascript attributes e.g. `{:block/title \"Foo\"}`.
     Additional keys available:
     * :build/properties - Define properties on a class page
     * :build/class-extends - Vec of class name keywords which extend a class.
     * :build/class-properties - Vec of property name keywords. Defines properties that a class gives to its objects
     * :build/keep-uuid? - Keeps :block/uuid because another block depends on it
  * :graph-namespace - namespace to use for db-ident creation. Useful when importing an ontology
  * :auto-create-ontology? - When set to true, creates properties and classes from their use.
    See auto-create-ontology for more details
  * :build-existing-tx? - When set to true, blocks, pages, properties and classes with :block/uuid are treated as
     existing in DB and are skipped for creation. This is useful for building tx on existing DBs e.g. for importing.
     Blocks and pages are updated with any attributes passed to it while all other node types are ignored for update
     unless :build/keep-uuid? is set.
  * :extract-content-refs? - When set to true, plain text refs e.g. `[[foo]]` are automatically extracted to create pages
    and to create refs in blocks. This is useful for testing but since it only partially works, not useful for exporting.
    Default is true
  * :translate-property-values? - When set to true, property values support special interpretation e.g. `[:build/page ..]`.
    Default is true
  * :page-id-fn - custom fn that returns ent lookup id for page refs e.g. `[:block/uuid X]`
    Default is :db/id

   The :build/properties in :pages-and-blocks, :properties and :classes is a map of
   property name keywords to property values.  Multiple property values for a many
   cardinality property are defined as a set. The following property types are
   supported: :default, :url, :checkbox, :number, :node and :date. :checkbox and
   :number values are written as booleans and integers/floats. :node references
   are written as vectors e.g. `[:build/page {:block/title \"PAGE NAME\"}]`"
  [options*]
  (let [options (merge {:extract-content-refs? true :translate-property-values? true} options*)]
    (validate-options options)
    (build-blocks-tx* options)))

(defn create-blocks
  "Builds txs with build-blocks-tx and transacts them. Also provides a shorthand
  version of options that are useful for testing"
  [conn options]
  (let [options' (merge {:auto-create-ontology? true}
                        (if (vector? options) {:pages-and-blocks options} options))
        {:keys [init-tx block-props-tx] :as _txs} (build-blocks-tx options')]
    ;; (cljs.pprint/pprint _txs)
    (d/transact! conn init-tx)
    (when (seq block-props-tx)
      (d/transact! conn block-props-tx))))
