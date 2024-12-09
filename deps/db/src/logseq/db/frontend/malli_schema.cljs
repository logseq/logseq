(ns logseq.db.frontend.malli-schema
  "Malli schemas and fns for logseq.db.frontend.*"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.frontend.property.type :as db-property-type]
            [datascript.core :as d]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.entity-plus :as entity-plus]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.frontend.order :as db-order]))

;; :db/ident malli schemas
;; =======================

(def db-attribute-ident
  (into [:enum] db-property/db-attribute-properties))

(def logseq-property-ident
  [:and :keyword [:fn
                  {:error/message "should be a valid logseq property namespace"}
                  db-property/logseq-property?]])

(def block-order
  [:and :string [:fn
                 {:error/message "should be a valid fractional index"}
                 db-order/validate-order-key?]])

(def internal-property-ident
  [:or logseq-property-ident db-attribute-ident])

(defn user-property?
  "Determines if keyword/ident is a user property"
  [kw]
  (db-property/user-property-namespace? (namespace kw)))

(def user-property-ident
  [:and :qualified-keyword [:fn
                            {:error/message "should be a valid user property namespace"}
                            user-property?]])

(def logseq-ident-namespaces
  "Set of all namespaces Logseq uses for :db/ident except for
  db-attribute-ident. It's important to grow this list purposefully and have it
  start with 'logseq' to allow for users and 3rd party plugins to provide their
  own namespaces to core concepts."
  (into db-property/logseq-property-namespaces #{"logseq.class" "logseq.kv"}))

(def logseq-ident
  [:and :keyword [:fn
                  {:error/message "should be a valid :db/ident namespace"}
                  (fn logseq-namespace? [k]
                    (contains? logseq-ident-namespaces (namespace k)))]])

(defn class?
  "Determines if keyword/ident is a logseq or user class"
  [kw]
  (string/includes? (namespace kw) ".class"))

(def class-ident
  [:and :qualified-keyword [:fn
                            {:error/message "should be a valid class namespace"}
                            class?]])
;; Helper fns
;; ==========
(defn- empty-placeholder-value? [db property property-val]
  (if (= :db.type/ref (:db/valueType property))
    (and (integer? property-val)
         (= :logseq.property/empty-placeholder (:db/ident (d/entity db property-val))))
    (= :logseq.property/empty-placeholder property-val)))

(defn validate-property-value
  "Validates the property value in a property tuple. The property value is
  expected to be a coll if the property has a :many cardinality. validate-fn is
  a fn that is called directly on each value to return a truthy value.
  validate-fn varies by property type"
  [db validate-fn [{:block/keys [schema] :as property} property-val] & {:keys [new-closed-value?]}]
  ;; For debugging
  ;; (when (not (string/starts-with? (namespace (:db/ident property)) "logseq.")) (prn :validate-val (dissoc property :property/closed-values) property-val))
  (let [validate-fn' (if (db-property-type/property-types-with-db (:type schema))
                       (fn [value]
                         (validate-fn db value {:new-closed-value? new-closed-value?}))
                       validate-fn)
        validate-fn'' (if (and (db-property-type/closed-value-property-types (:type schema))
                               ;; new closed values aren't associated with the property yet
                               (not new-closed-value?)
                               (seq (:property/closed-values property)))
                        (fn closed-value-valid? [val]
                          (and (validate-fn' val)
                               (contains? (set (map :db/id (:property/closed-values property))) val)))
                        validate-fn')]
    (if (db-property/many? property)
      (or (every? validate-fn'' property-val)
          (empty-placeholder-value? db property (first property-val)))
      (or (validate-fn'' property-val)
          ;; also valid if value is empty-placeholder
          (empty-placeholder-value? db property property-val)))))

(def required-properties
  "Set of properties required by a schema and that are validated directly in a schema instead
   of validate-property-value"
  (set/union
   (set (get-in db-class/built-in-classes [:logseq.class/Asset :schema :required-properties]))
   #{:logseq.property/created-from-property}))

(defn update-properties-in-ents
  "Prepares properties in entities to be validated by DB schema"
  [db ents]
  (mapv
   (fn [ent]
     (reduce (fn [m [k v]]
               (if-let [property (and (db-property/property? k)
                                      ;; This allows schemas like property-value-block to require properties in
                                      ;; their schema that they depend on
                                      (not (contains? required-properties k))
                                      (d/entity db k))]
                 (update m :block/properties (fnil conj [])
                         ;; use explicit call to be nbb compatible
                         [(let [closed-values (entity-plus/lookup-kv-then-entity property :property/closed-values)]
                            (cond-> (assoc (select-keys property [:db/ident :db/valueType :db/cardinality])
                                           :block/schema
                                           (select-keys (:block/schema property) [:type]))
                              (seq closed-values)
                              (assoc :property/closed-values closed-values)))
                          v])
                 (assoc m k v)))
             {}
             ent))
   ents))

(defn datoms->entity-maps
  "Returns entity maps for given :eavt datoms indexed by db/id. Optional keys:
   * :entity-fn - Optional fn that given an entity id, returns entity. Defaults
     to just doing a lookup based on existing entity-maps to be as performant as possible"
  [datoms & {:keys [entity-fn]}]
  (let [ent-maps
        (reduce (fn [acc {:keys [a e v]}]
                  (if (contains? db-schema/card-many-attributes a)
                    (update acc e update a (fnil conj #{}) v)
                    ;; If there's already a val, don't clobber it and automatically start collecting it as a :many
                    (if-let [existing-val (get-in acc [e a])]
                      (if (set? existing-val)
                        (update acc e assoc a (conj existing-val v))
                        (update acc e assoc a #{existing-val v}))
                      (update acc e assoc a v))))
                {}
                datoms)
        entity-fn' (or entity-fn
                       (let [db-ident-maps (dissoc (into {} (map (juxt :db/ident identity) (vals ent-maps))) nil)]
                         #(get db-ident-maps %)))]
    (-> ent-maps
        (update-vals
         (fn [m]
           (->> m
                (map (fn [[k v]]
                       (if-let [property (and (db-property/property? k)
                                              (entity-fn' k))]
                         (if (and (db-property/many? property)
                                  (not (set? v)))
                           ;; Fix :many property values that only had one value
                           [k #{v}]
                           [k v])
                         [k v])))
                (into {})))))))

(defn datoms->entities
  "Returns a vec of entity maps given :eavt datoms"
  [datoms]
  (mapv (fn [[db-id m]] (with-meta m {:db/id db-id}))
        (datoms->entity-maps datoms)))

(defn internal-ident?
  "Determines if given ident is created by Logseq. All Logseq internal idents
   must start with 'block' or 'logseq' to keep Logseq internals from leaking
   across namespaces and to allow for users and 3rd party plugins to choose
   any other namespace"
  [ident]
  (or (contains? db-property/db-attribute-properties ident)
      (contains? logseq-ident-namespaces (namespace ident))))

(assert (every? #(re-find #"^(block|logseq\.)" (namespace %)) db-property/db-attribute-properties)
        "All db-attribute idents start with an internal namespace")
(assert (every? #(re-find #"^logseq\." %) logseq-ident-namespaces)
        "All logseq idents start with an internal namespace")

;; Main malli schemas
;; ==================
;; These schemas should be data vars to remain as simple and reusable as possible

(def ^:dynamic *db-for-validate-fns*
  "Used by validate-fns which need db as input"
  nil)

(def property-tuple
  "A tuple of a property map and a property value. This schema
   has 1 metadata hook which is used to inject a datascript db later"
  (into
   [:multi {:dispatch #(-> % first :block/schema :type)}]
   (map (fn [[prop-type value-schema]]
          [prop-type
           (let [schema-fn (if (vector? value-schema) (last value-schema) value-schema)]
             [:fn (fn [tuple]
                    (validate-property-value *db-for-validate-fns* schema-fn tuple))])])
        db-property-type/built-in-validation-schemas)))

(def block-properties
  "Validates a block's properties as property pairs. Properties are
  a vector of tuples instead of a map in order to validate each
  property with its property value that is valid for its type"
  [:sequential property-tuple])

(def page-or-block-attrs
  "Common attributes for page and normal blocks"
  [[:block/uuid :uuid]
   [:block/created-at :int]
   [:block/updated-at :int]
   [:block/format [:enum :markdown]]
   ;; Injected by update-properties-in-ents
   [:block/properties {:optional true} block-properties]
   [:block/refs {:optional true} [:set :int]]
   [:block/tags {:optional true} [:set :int]]
   [:block/tx-id {:optional true} :int]
   [:block/collapsed? {:optional true} :boolean]])

(def page-attrs
  "Common attributes for pages"
  [[:block/name :string]
   [:block/title :string]
   [:block/alias {:optional true} [:set :int]]
    ;; TODO: Should this be here or in common?
   [:block/path-refs {:optional true} [:set :int]]
   ;; file-based
   [:block/namespace {:optional true} :int]])

(def property-attrs
  "Common attributes for properties"
  [[:db/index {:optional true} :boolean]
   [:db/valueType {:optional true} [:enum :db.type/ref]]
   [:db/cardinality {:optional true} [:enum :db.cardinality/many :db.cardinality/one]]
   [:block/order {:optional true} block-order]
   [:property/schema.classes {:optional true} [:set :int]]])

(def normal-page
  (vec
   (concat
    [:map
     ;; journal-day is only set for journal pages
     [:block/journal-day {:optional true} :int]]
    page-attrs
    page-or-block-attrs)))

(def class-page
  (vec
   (concat
    [:map
     [:db/ident class-ident]]
    page-attrs
    page-or-block-attrs)))

(def property-common-schema-attrs
  "Property :schema attributes common to all properties"
  [[:hide? {:optional true} :boolean]
   [:position {:optional true} [:enum :properties :block-left :block-right :block-below]]])

(def internal-property
  (vec
   (concat
    [:map
     [:db/ident internal-property-ident]
     [:block/schema
      (vec
       (concat
        [:map
         [:type (apply vector :enum (into db-property-type/internal-built-in-property-types
                                          db-property-type/user-built-in-property-types))]
         [:public? {:optional true} :boolean]
         [:view-context {:optional true} [:enum :page :block :class :property :never]]
         [:shortcut {:optional true} :string]]
        property-common-schema-attrs))]]
    property-attrs
    page-attrs
    page-or-block-attrs)))

(def user-property-schema
  (into
   [:multi {:dispatch :type}]
   (map
    (fn [prop-type]
      [prop-type
       (vec
        (concat
         [:map
          ;; Once a schema is defined it must have :type as this is an irreversible decision
          [:type :keyword]]
         property-common-schema-attrs))])
    db-property-type/user-built-in-property-types)))

(def user-property
  (vec
   (concat
    [:map
     [:db/ident user-property-ident]
     [:block/schema user-property-schema]]
    property-attrs
    page-attrs
    page-or-block-attrs)))

(def property-page
  [:multi {:dispatch (fn [m]
                       (or (some->> (:db/ident m) db-property/logseq-property?)
                           (contains? db-property/db-attribute-properties (:db/ident m))))}
   [true internal-property]
   [:malli.core/default user-property]])

(def hidden-page
  (vec
   (concat
    [:map
     ;; pages from :default property uses this but closed-value pages don't
     [:block/order {:optional true} block-order]
     [:block/schema
      [:map
       [:public? {:optional true} :boolean]]]]
    page-attrs
    page-or-block-attrs)))

(def block-attrs
  "Common attributes for normal blocks"
  [[:block/title :string]
   [:block/parent :int]
   [:block/order block-order]
   ;; refs
   [:block/page :int]
   [:block/path-refs {:optional true} [:set :int]]
   [:block/link {:optional true} :int]
   [:logseq.property/created-from-property {:optional true} :int]])

(def whiteboard-block
  "A (shape) block for whiteboard"
  (vec
   (concat
    [:map]
    [[:block/title :string]
     [:block/parent :int]
     ;; These blocks only associate with pages of type "whiteboard"
     [:block/page :int]
     [:block/path-refs {:optional true} [:set :int]]]
    page-or-block-attrs)))

(def property-value-block
  "A common property value for user properties"
  (vec
   (concat
    [:map]
    [[:property.value/content [:or :string :double :boolean]]
     [:logseq.property/created-from-property :int]]
    (remove #(#{:block/title :logseq.property/created-from-property} (first %)) block-attrs)
    page-or-block-attrs)))

(def closed-value-block*
  (vec
   (concat
    [:map]
    [;; for built-in properties
     [:db/ident {:optional true} logseq-property-ident]
     [:block/title {:optional true} :string]
     [:property.value/content {:optional true} [:or :string :double]]
     [:logseq.property/created-from-property :int]
     [:block/closed-value-property {:optional true} [:set :int]]]
    (remove #(#{:block/title :logseq.property/created-from-property} (first %)) block-attrs)
    page-or-block-attrs)))

(def closed-value-block
  "A closed value for a property with closed/allowed values"
  [:and closed-value-block*
   [:fn {:error/message ":block/title or :property.value/content required"
         :error/path [:property.value/content]}
    (fn [m]
      (or (:block/title m) (:property.value/content m)))]])

(def normal-block
  "A block with content and no special type or tag behavior"
  (vec
   (concat
    [:map]
    block-attrs
    page-or-block-attrs)))

(def block
  "A block has content and a page"
  [:or
   normal-block
   closed-value-block
   whiteboard-block
   property-value-block])

(def asset-block
  "A block tagged with #Asset"
  (vec
   (concat
    [:map]
    ;; TODO: Derive required property types from existing schema in frontend.property
    [[:logseq.property.asset/type :string]
     [:logseq.property.asset/checksum :string]
     [:logseq.property.asset/size :int]]
    block-attrs
    page-or-block-attrs)))

(def file-block
  [:map
   [:block/uuid :uuid]
   [:block/tx-id {:optional true} :int]
   [:file/content :string]
   [:file/path :string]
   [:file/size {:optional true} :int]
   [:file/created-at inst?]
   [:file/last-modified-at inst?]])

(def db-ident-key-val
  "A key value map with :db/ident and :kv/value"
  [:map
   [:db/ident logseq-ident]
   [:kv/value :any]
   [:block/tx-id {:optional true} :int]])

(def property-value-placeholder
  [:map
   [:db/ident [:= :logseq.property/empty-placeholder]]
   [:block/tx-id {:optional true} :int]])

(def Data
  (into
   [:multi {:dispatch (fn [d]
                        ;; order matters as some block types are a subset of others e.g. :whiteboard
                        (let [db *db-for-validate-fns*
                              d (if (:block/uuid d) (d/entity db [:block/uuid (:block/uuid d)]) d)
                              dispatch-key (cond
                                             (entity-util/property? d)
                                             :property
                                             (entity-util/class? d)
                                             :class
                                             (entity-util/hidden? (:block/title d))
                                             :hidden
                                             (entity-util/whiteboard? d)
                                             :normal-page
                                             (entity-util/page? d)
                                             :normal-page
                                             (entity-util/asset? d)
                                             :asset-block
                                             (:file/path d)
                                             :file-block
                                             (:block/uuid d)
                                             :block
                                             (= (:db/ident d) :logseq.property/empty-placeholder)
                                             :property-value-placeholder
                                             (:db/ident d)
                                             :db-ident-key-value)]
                          dispatch-key))}]
   {:property property-page
    :class class-page
    :hidden hidden-page
    :normal-page normal-page
    :block block
    :asset-block asset-block
    :file-block file-block
    :db-ident-key-value db-ident-key-val
    :property-value-placeholder property-value-placeholder}))

(def DB
  "Malli schema for entities from schema/schema-for-db-based-graph. In order to
  thoroughly validate properties, the entities and this schema should be
  prepared with update-properties-in-ents and update-properties-in-schema
  respectively"
  [:sequential Data])

;; Keep malli schema in sync with db schema
;; ========================================
(let [malli-many-ref-attrs (->> (concat property-attrs page-attrs block-attrs page-or-block-attrs (rest closed-value-block*))
                                (filter #(= (last %) [:set :int]))
                                (map first)
                                set)]
  (when-let [undeclared-ref-attrs (seq (remove malli-many-ref-attrs db-schema/card-many-ref-type-attributes))]
    (throw (ex-info (str "The malli DB schema is missing the following cardinality-many ref attributes from datascript's schema: "
                         (string/join ", " undeclared-ref-attrs))
                    {}))))

(let [malli-one-ref-attrs (->> (concat property-attrs page-attrs block-attrs page-or-block-attrs (rest normal-page))
                               (filter #(= (last %) :int))
                               (map first)
                               set)
      attrs-to-ignore #{:block/file}]
  (when-let [undeclared-ref-attrs (seq (remove (some-fn malli-one-ref-attrs attrs-to-ignore) db-schema/card-one-ref-type-attributes))]
    (throw (ex-info (str "The malli DB schema is missing the following cardinality-one ref attributes from datascript's schema: "
                         (string/join ", " undeclared-ref-attrs))
                    {}))))

(let [malli-non-ref-attrs (->> (concat property-attrs page-attrs block-attrs page-or-block-attrs (rest normal-page))
                               (concat (rest file-block) (rest property-value-block)
                                       (rest db-ident-key-val) (rest internal-property))
                               (remove #(= (last %) [:set :int]))
                               (map first)
                               set)]
  (when-let [undeclared-attrs (seq (remove malli-non-ref-attrs db-schema/db-non-ref-attributes))]
    (throw (ex-info (str "The malli DB schema is missing the following non ref attributes from datascript's schema: "
                         (string/join ", " undeclared-attrs))
                    {}))))
