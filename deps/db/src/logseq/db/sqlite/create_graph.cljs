(ns logseq.db.sqlite.create-graph
  "Helper fns for creating a DB graph"
  (:require [clojure.string :as string]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.common.uuid :as common-uuid]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.frontend.malli-schema :as db-malli-schema]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.build :as db-property-build]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.util :as sqlite-util]))

(defn mark-block-as-built-in [block]
  (assoc block :logseq.property/built-in? true))

(defn- schema->qualified-property-keyword
  [prop-schema]
  (reduce-kv
   (fn [r k v]
     (if-let [new-k (and (simple-keyword? k) (db-property/schema-properties-map k))]
       (assoc r new-k v)
       (assoc r k v)))
   {}
   prop-schema))

(defn- ->property-value-tx-m
  "Given a new block and its properties, creates a map of properties which have values of property value tx.
   This map is used for both creating the new property values and then adding them to a block"
  [new-block properties]
  (db-property-build/build-property-values-tx-m
   new-block
   (->> properties
        (keep (fn [[k v]]
                (when-let [built-in-type (get-in db-property/built-in-properties [k :schema :type])]
                  (if (and (db-property-type/value-ref-property-types built-in-type)
                           ;; closed values are referenced by their :db/ident so no need to create values
                           (not (get-in db-property/built-in-properties [k :closed-values])))
                    (let [property-map {:db/ident k
                                        :logseq.property/type built-in-type}]
                      [property-map v])
                    (when-let [built-in-type' (get (:build/properties-ref-types new-block) built-in-type)]
                      (let [property-map {:db/ident k
                                          :logseq.property/type built-in-type'}]
                        [property-map v])))))))
   :pure? true))

(defn build-properties
  "Given a properties map in the format of db-property/built-in-properties, builds their properties tx"
  [built-in-properties]
  (mapcat
   (fn [[db-ident {:keys [attribute schema title closed-values properties]}]]
     (let [db-ident (or attribute db-ident)
           schema' (schema->qualified-property-keyword schema)
           [property & others] (if closed-values
                                 (db-property-build/build-closed-values
                                  db-ident
                                  title
                                  {:db/ident db-ident :schema schema' :closed-values closed-values}
                                  {})
                                 [(sqlite-util/build-new-property
                                   db-ident
                                   schema'
                                   {:title title})])
           pvalue-tx-m (->property-value-tx-m
                        (merge property
                               ;; This config is for :logseq.property/default-value and may need to
                               ;; move to built-in-properties
                               {:build/properties-ref-types {:entity :number}})
                        (->> properties
                             ;; No need to create property value if it's an internal ident
                             (remove (fn [[_k v]]
                                       (and (keyword? v) (db-malli-schema/internal-ident? v))))
                             (into {})))
           ;; _ (when (seq pvalue-tx-m) (prn :pvalue-tx-m db-ident pvalue-tx-m))

           ;; The order of tx matters. property and others must come first as
           ;; they may contain idents and uuids that are referenced by properties
           tx
           (cond-> [property]
             (seq others)
             (into others)
             (seq pvalue-tx-m)
             (into (mapcat #(if (set? %) % [%]) (vals pvalue-tx-m)))
             (seq properties)
             (conj
              (merge {:block/uuid (:block/uuid property)}
                     properties
                     (db-property-build/build-properties-with-ref-values pvalue-tx-m))))]
       tx))
   built-in-properties))

(defn- build-bootstrap-property
  [db-ident]
  (sqlite-util/build-new-property
   db-ident
   (schema->qualified-property-keyword (get-in db-property/built-in-properties [db-ident :schema]))
   {:title (get-in db-property/built-in-properties [db-ident :title])}))

(defn- build-initial-properties
  "Builds initial properties and their closed values and marks them
  as built-in?. Returns their tx data as well as data needed for subsequent build steps"
  []
  ;; bootstrap-idents must either be necessary to define a property or be used on every property
  (let [bootstrap-idents #{:logseq.property/type :logseq.property/hide? :logseq.property/built-in?
                           ;; Required to define :properties on a property
                           :logseq.property/created-from-property}
        bootstrap-properties (map build-bootstrap-property bootstrap-idents)
        ;; First tx bootstrap properties so they can take affect. Then tx the bootstrap properties on themselves
        bootstrap-properties-tx (into (mapv #(apply dissoc % bootstrap-idents) bootstrap-properties)
                                      (mapv #(select-keys % (into [:block/uuid] bootstrap-idents))
                                            bootstrap-properties))
        properties-tx (build-properties (apply dissoc db-property/built-in-properties bootstrap-idents))
        mark-block-as-built-in' (fn [b] (mark-block-as-built-in {:block/uuid (:block/uuid b)}))
        ;; Tx order matters
        tx (concat bootstrap-properties-tx
                   properties-tx
                   ;; Adding built-ins must come after its properties are defined
                   (map mark-block-as-built-in' bootstrap-properties)
                   (map mark-block-as-built-in' properties-tx))]
    (doseq [m tx]
      (when-let [block-uuid (and (:db/ident m) (:block/uuid m))]
        (assert (string/starts-with? (str block-uuid) "00000002") m)))

    {:tx tx
     :properties (filter entity-util/property? properties-tx)}))

(def built-in-pages-names
  #{common-config/library-page-name
    common-config/quick-add-page-name
    "Contents"})

(defn- validate-tx-for-duplicate-idents [tx]
  (when-let [conflicting-idents
             (->> (keep :db/ident tx)
                  frequencies
                  (keep (fn [[k v]] (when (> v 1) k)))
                  seq)]
    (throw (ex-info (str "The following :db/idents are not unique and clobbered each other: "
                         (vec conflicting-idents))
                    {:idents conflicting-idents}))))

(defn build-initial-classes*
  [built-in-classes db-ident->properties]
  (map
   (fn [[db-ident {:keys [properties schema title]}]]
     (let [title' (or title (name db-ident))]
       (mark-block-as-built-in
        (sqlite-util/build-new-class
         (let [class-properties (mapv
                                 (fn [db-ident]
                                   (let [property (get db-ident->properties db-ident)]
                                     (assert property (str "Built-in property " db-ident " is not defined yet"))
                                     db-ident))
                                 (:properties schema))]
           (cond->
            {:block/title title'
             :block/name (common-util/page-name-sanity-lc title')
             :db/ident db-ident
             :block/uuid (common-uuid/gen-uuid :db-ident-block-uuid db-ident)}
             (seq class-properties)
             (assoc :logseq.property.class/properties class-properties)
             (seq properties)
             (merge properties)))))))
   built-in-classes))

(defn- build-initial-classes
  [db-ident->properties]
  (build-initial-classes* db-class/built-in-classes db-ident->properties))

(defn build-initial-views
  "Builds initial blocks used for storing views"
  []
  (let [page-id (common-uuid/gen-uuid :builtin-block-uuid common-config/views-page-name)]
    [(sqlite-util/block-with-timestamps
      {:block/uuid page-id
       :block/name common-config/views-page-name
       :block/title common-config/views-page-name
       :block/tags [:logseq.class/Page]
       :logseq.property/hide? true
       :logseq.property/built-in? true})]))

(defn- build-favorites-page
  []
  [(sqlite-util/block-with-timestamps
    {:block/uuid (common-uuid/gen-uuid :builtin-block-uuid common-config/favorites-page-name)
     :block/name common-config/favorites-page-name
     :block/title common-config/favorites-page-name
     :block/tags [:logseq.class/Page]
     :logseq.property/hide? true
     :logseq.property/built-in? true})])

(defn- build-initial-files [config-content]
  [{:block/uuid (common-uuid/gen-uuid :builtin-block-uuid "logseq/config.edn")
    :file/path (str "logseq/" "config.edn")
    :file/content config-content
    :file/created-at (js/Date.)
    :file/last-modified-at (js/Date.)}
   {:block/uuid (common-uuid/gen-uuid :builtin-block-uuid "logseq/custom.css")
    :file/path (str "logseq/" "custom.css")
    :file/content ""
    :file/created-at (js/Date.)
    :file/last-modified-at (js/Date.)}
   {:block/uuid (common-uuid/gen-uuid :builtin-block-uuid "logseq/custom.js")
    :file/path (str "logseq/" "custom.js")
    :file/content ""
    :file/created-at (js/Date.)
    :file/last-modified-at (js/Date.)}])

(defn build-db-initial-data
  "Builds tx of initial data for a new graph including key values, initial files,
   built-in properties and built-in classes"
  [config-content & {:keys [import-type graph-git-sha]}]
  (assert (string? config-content))
  (let [initial-data (cond->
                      [(sqlite-util/kv :logseq.kv/db-type "db")
                       (sqlite-util/kv :logseq.kv/schema-version db-schema/version)
                       (sqlite-util/kv :logseq.kv/graph-initial-schema-version db-schema/version)
                       (sqlite-util/kv :logseq.kv/graph-created-at (common-util/time-ms))
                       ;; Empty property value used by db.type/ref properties
                       {:db/ident :logseq.property/empty-placeholder
                        :block/uuid (common-uuid/gen-uuid :builtin-block-uuid :logseq.property/empty-placeholder)}]
                       import-type
                       (into (sqlite-util/import-tx import-type))
                       graph-git-sha
                       (conj (sqlite-util/kv :logseq.kv/graph-git-sha graph-git-sha)))
        initial-files (build-initial-files config-content)
        {properties-tx :tx :keys [properties]} (build-initial-properties)
        db-ident->properties (zipmap (map :db/ident properties) properties)
        default-classes (build-initial-classes db-ident->properties)
        default-pages (->> (map sqlite-util/build-new-page built-in-pages-names)
                           (map mark-block-as-built-in))
        hidden-pages (concat (build-initial-views) (build-favorites-page))
        ;; These classes bootstrap our tags and properties as they depend on each other e.g.
        ;; Root <-> Tag, classes-tx depends on logseq.property.class/extends, properties-tx depends on Property
        bootstrap-class? (fn [c] (contains? #{:logseq.class/Root :logseq.class/Property :logseq.class/Tag :logseq.class/Template} (:db/ident c)))
        bootstrap-classes (filter bootstrap-class? default-classes)
        bootstrap-class-ids (map #(select-keys % [:db/ident :block/uuid]) bootstrap-classes)
        classes-tx (concat (map #(dissoc % :db/ident) bootstrap-classes)
                           (remove bootstrap-class? default-classes))
        ;; Order of tx is critical. bootstrap-class-ids bootstraps properties-tx and classes-tx
        ;; bootstrap-class-ids coming first is useful as Root, Tag and Property have stable :db/id's of 1, 2 and 3
        tx (vec (concat bootstrap-class-ids
                        initial-data properties-tx classes-tx
                        initial-files default-pages hidden-pages))]
    (validate-tx-for-duplicate-idents tx)
    tx))
