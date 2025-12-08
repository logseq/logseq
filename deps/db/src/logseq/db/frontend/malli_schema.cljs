(ns logseq.db.frontend.malli-schema
  "Malli schemas and fns for logseq.db.frontend.*"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.db.common.entity-plus :as entity-plus]
            [logseq.db.common.order :as db-order]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.db.frontend.schema :as db-schema]))

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

(def plugin-property-ident
  [:and :qualified-keyword [:fn
                            {:error/message "should be a valid plugin property namespace"}
                            db-property/plugin-property?]])

(def logseq-ident-namespaces
  "Set of all namespaces Logseq uses for :db/ident except for
  db-attribute-ident. It's important to grow this list purposefully and have it
  start with 'logseq' to allow for users and 3rd party plugins to provide their
  own namespaces to core concepts."
  (into db-property/logseq-property-namespaces #{db-class/logseq-class "logseq.kv"}))

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

(defn internal-ident?
  "Determines if given ident is created by Logseq. All Logseq internal idents
   must start with 'block' or 'logseq' to keep Logseq internals from leaking
   across namespaces and to allow for users and 3rd party plugins to choose
   any other namespace"
  [ident]
  (or (contains? db-property/db-attribute-properties ident)
      (contains? logseq-ident-namespaces (namespace ident))))

(defn validate-property-value
  "Validates the property value in a property tuple. The property value is
  expected to be a coll if the property has a :many cardinality. validate-fn is
  a fn that is called directly on each value to return a truthy value.
  validate-fn varies by property type"
  [db validate-fn [property property-val] & {:keys [new-closed-value? :closed-values-validate? _skip-strict-url-validate?]
                                             :as validate-options}]
  ;; For debugging
  ;; (when (not (internal-ident? (:db/ident property))) (prn :validate-val (dissoc property :property/closed-values) property-val))
  (let [validate-fn' (if (db-property-type/property-types-with-db (:logseq.property/type property))
                       (fn [value]
                         (validate-fn db value validate-options))
                       validate-fn)
        validate-fn'' (if (and closed-values-validate?
                               (db-property-type/closed-value-property-types (:logseq.property/type property))
                               ;; new closed values aren't associated with the property yet
                               (not new-closed-value?)
                               (seq (:property/closed-values property)))
                        (fn closed-value-valid? [val]
                          (and (validate-fn' val)
                               (let [ids (set (map :db/id (:property/closed-values property)))
                                     result (contains? ids val)]
                                 (when-not result
                                   (js/console.error (str "Error: not a closed value, id: " val ", existing choices: " ids ", property: " (:db/ident property))))
                                 result)))
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
   #{:logseq.property/created-from-property :logseq.property/value
     :logseq.property.history/scalar-value :logseq.property.history/block
     :logseq.property.history/property :logseq.property.history/ref-value
     :logseq.property.class/extends}))

(defn- property-entity->map
  "Provide the minimal number of property attributes to validate the property
  and to reduce noise in error messages. The resulting map should be the same as
  what the frontend property since they both call validate-property-value"
  [property]
  ;; use explicit call to be nbb compatible
  (let [closed-values (entity-plus/lookup-kv-then-entity property :property/closed-values)]
    (cond-> (select-keys property [:db/ident :db/valueType :db/cardinality :logseq.property/type])
      (seq closed-values)
      (assoc :property/closed-values closed-values))))

(defn update-properties-in-ents
  "Prepares properties in entities to be validated by DB schema"
  [db ents]
  ;; required-properties allows schemas like property-value-block to require
  ;; properties in their schema that they depend on
  (let [exceptions-to-block-properties (-> required-properties
                                           (into db-property/schema-properties)
                                           (conj :block/tags))
        page-class-id (:db/id (d/entity db :logseq.class/Page))
        all-page-class-ids (set (map #(:db/id (d/entity db %)) db-class/page-classes))]
    (mapv
     (fn [ent]
       (reduce (fn [m [k v]]
                 (if-let [property (and (db-property/property? k)
                                        (not (contains? exceptions-to-block-properties k))
                                        (d/entity db k))]
                   (update m :block/properties (fnil conj [])
                           [(property-entity->map property) v])
                   (if (= :block/tags k)
                     ;; Provides additional options map to validation for data about current entity being tagged
                     (let [property (d/entity db :block/tags)]
                       (assoc m k [(property-entity->map property)
                                   v
                                   (merge (select-keys ent [:logseq.property/built-in?])
                                          {:page-class-id page-class-id
                                           :all-page-class-ids all-page-class-ids})]))
                     (assoc m k v))))
               {}
               ent))
     ents)))

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
  (mapv (fn [[db-id m]] (assoc m :db/id db-id))
        (datoms->entity-maps datoms)))

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

(def ^:dynamic *skip-strict-url-validate?*
  "`true` allows updating a block's other property when it has invalid URL value"
  false)

(def ^:dynamic *closed-values-validate?*
  "By default this is false because we can't ensure this when merging updates from server.
   `true` allows for non RTC graphs to have higher data quality and avoid
   possible UX bugs related to closed values."
  false)

(def property-tuple
  "A tuple of a property map and a property value"
  (into
   [:multi {:dispatch #(-> % first :logseq.property/type)}]
   (map (fn [[prop-type value-schema]]
          [prop-type
           (let [schema-fn (if (vector? value-schema) (last value-schema) value-schema)
                 error-message (when (vector? value-schema)
                                 (and (map? (second value-schema))
                                      (:error/message (second value-schema))))]
             [:fn
              (when error-message
                {:error/message error-message})
              (fn [tuple]
                (validate-property-value *db-for-validate-fns* schema-fn tuple
                                         {:skip-strict-url-validate? *skip-strict-url-validate?*
                                          :closed-values-validate? *closed-values-validate?*}))])])
        db-property-type/built-in-validation-schemas)))

(def block-properties
  "Validates a block's properties as property pairs. Properties are
  a vector of tuples instead of a map in order to validate each
  property with its property value that is valid for its type"
  [:sequential property-tuple])

(def block-tags
  [:and
   property-tuple
   ;; Important to keep data integrity of built-in entities. Ensure UI doesn't accidentally modify them
   [:fn {:error/message "should only have one tag for a built-in entity"}
    (fn [[_k v opts]]
      (if (:logseq.property/built-in? opts)
        (= 1 (count v))
        true))]
   ;; Ensure use of :logseq.class/Page is consistent and simple. Doing so reduces complexity elsewhere
   ;; and allows for Page to exist as its own public concept later
   [:fn {:error/message "should not have other built-in page tags when tagged with #Page"}
    (fn [[_k v {:keys [page-class-id all-page-class-ids]}]]
      (if (contains? v page-class-id)
        (empty? (set/intersection (disj v page-class-id) all-page-class-ids))
        true))]])

(def page-or-block-attrs
  "Common attributes for page and normal blocks"
  [[:block/uuid :uuid]
   [:block/created-at :int]
   [:block/updated-at :int]
   ;; Injected by update-properties-in-ents
   [:block/properties {:optional true} block-properties]
   [:block/tags {:optional true} block-tags]
   [:block/refs {:optional true} [:set :int]]
   [:block/tx-id {:optional true} :int]
   [:block/collapsed? {:optional true} :boolean]])

(def page-attrs
  "Common attributes for pages"
  [[:block/name :string]
   [:block/title :string]])

(def property-attrs
  "Common attributes for properties"
  [[:db/index {:optional true} :boolean]
   [:db/valueType {:optional true} [:enum :db.type/ref]]
   [:db/cardinality {:optional true} [:enum :db.cardinality/many :db.cardinality/one]]
   [:block/order {:optional true} block-order]
   [:logseq.property/classes {:optional true} [:set :int]]])

(def normal-page
  (vec
   (concat
    [:map
     ;; journal-day is only set for journal pages
     [:block/journal-day {:optional true} :int]
     [:block/parent {:optional true} :int]
     [:block/order {:optional true} block-order]]
    page-attrs
    page-or-block-attrs)))

(def class-page
  [:or
   (vec
    (concat
     [:map
      [:db/ident class-ident]
      [:logseq.property.class/extends [:set :int]]]
     page-attrs
     page-or-block-attrs))
   (vec
    (concat
     [:map
      [:db/ident [:= :logseq.class/Root]]]
     page-attrs
     page-or-block-attrs))])

(def property-common-schema-attrs
  "Property :schema attributes common to all properties"
  [[:logseq.property/hide? {:optional true} :boolean]
   [:logseq.property/public? {:optional true} :boolean]
   [:logseq.property/ui-position {:optional true} [:enum :properties :block-left :block-right :block-below]]])

(def internal-property
  (vec
   (concat
    [:map
     [:db/ident internal-property-ident]
     [:logseq.property/type (apply vector :enum (into db-property-type/internal-built-in-property-types
                                                      db-property-type/user-built-in-property-types))]
     [:logseq.property/view-context {:optional true} [:enum :page :block :class :property :never]]]
    property-common-schema-attrs
    property-attrs
    page-attrs
    page-or-block-attrs)))

(def user-property
  (vec
   (concat
    [:map
     [:db/ident user-property-ident]
     [:logseq.property/type (apply vector :enum (into db-property-type/user-allowed-internal-property-types
                                                      db-property-type/user-built-in-property-types))]]
    property-common-schema-attrs
    property-attrs
    page-attrs
    page-or-block-attrs)))

(def plugin-property
  (vec
   (concat
    [:map
     [:db/ident plugin-property-ident]
     [:logseq.property/type (apply vector :enum (concat db-property-type/user-built-in-property-types [:json :string :page]))]]
    property-common-schema-attrs
    property-attrs
    page-attrs
    page-or-block-attrs)))

(def property-page
  [:multi {:dispatch (fn [m]
                       (let [ident (:db/ident m)]

                         (cond
                           (or (some->> ident db-property/logseq-property?)
                               (contains? db-property/db-attribute-properties (:db/ident m)))
                           :internal

                           (some->> ident db-property/plugin-property?)
                           :plugin

                           :else
                           :user)))}
   [:internal internal-property]
   [:plugin plugin-property]
   [:malli.core/default user-property]])

(def hidden-page
  (vec
   (concat
    [:map
     ;; pages from :default property uses this but closed-value pages don't
     [:block/order {:optional true} block-order]
     [:logseq.property/hide? [:enum true]]]
    page-attrs
    page-or-block-attrs)))

(def block-attrs
  "Common attributes for normal blocks"
  [[:block/title :string]
   [:block/parent :int]
   [:block/order block-order]
   ;; refs
   [:block/page :int]
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
     [:block/page :int]]
    page-or-block-attrs)))

(def property-value-block
  "A common property value for user properties"
  (vec
   (concat
    [:map]
    [[:logseq.property/value [:or :string :double :boolean]]
     [:logseq.property/created-from-property :int]]
    (remove #(#{:block/title :logseq.property/created-from-property} (first %)) block-attrs)
    page-or-block-attrs)))

(def property-history-block*
  [:map
   [:block/uuid :uuid]
   [:block/created-at :int]
   [:block/updated-at {:optional true} :int]
   [:logseq.property.history/block :int]
   [:logseq.property.history/property :int]
   [:logseq.property.history/ref-value {:optional true} :int]
   [:logseq.property.history/scalar-value {:optional true} :any]
   [:block/tx-id {:optional true} :int]])

(def property-history-block
  "A closed value for a property with closed/allowed values"
  [:and property-history-block*
   [:fn {:error/message ":logseq.property.history/ref-value or :logseq.property.history/scalar-value required"
         :error/path [:logseq.property.history/ref-value]}
    (fn [m]
      (or (:logseq.property.history/ref-value m)
          (some? (:logseq.property.history/scalar-value m))))]])

(def closed-value-block*
  (vec
   (concat
    [:map]
    [;; for built-in properties
     [:db/ident {:optional true} logseq-property-ident]
     [:block/title {:optional true} :string]
     [:logseq.property/value {:optional true} [:or :string :double]]
     [:logseq.property/created-from-property :int]
     [:block/closed-value-property {:optional true} [:set :int]]]
    (remove #(#{:block/title :logseq.property/created-from-property} (first %)) block-attrs)
    page-or-block-attrs)))

(def closed-value-block
  "A closed value for a property with closed/allowed values"
  [:and closed-value-block*
   [:fn {:error/message ":block/title or :logseq.property/value required"
         :error/path [:logseq.property/value]}
    (fn [m]
      (or (:block/title m) (:logseq.property/value m)))]])

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
   whiteboard-block])

(def asset-block
  "A block tagged with #Asset"
  (vec
   (concat
    [:map]
    ;; TODO: Derive required property types from existing schema in frontend.property
    [[:logseq.property.asset/type :string]
     [:logseq.property.asset/checksum :string]
     [:logseq.property.asset/size :int]
     [:logseq.property.asset/width {:optional true} :int]
     [:logseq.property.asset/height {:optional true} :int]]
    block-attrs
    page-or-block-attrs)))

(def file-block
  [:map
   [:block/uuid :uuid]
   [:block/tx-id {:optional true} :int]
   ;; App doesn't use timestamps but migrations may
   [:block/created-at {:optional true} :int]
   [:block/updated-at {:optional true} :int]
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
   [:block/uuid :uuid]
   [:block/tx-id {:optional true} :int]
   [:block/created-at {:optional true} :int]
   [:block/updated-at {:optional true} :int]])

(defn entity-dispatch-key [db ent]
  (let [d (if (:block/uuid ent) (d/entity db [:block/uuid (:block/uuid ent)]) ent)
        ;; order matters as some block types are a subset of others e.g. :whiteboard
        dispatch-key (cond
                       (entity-util/property? d)
                       :property
                       (entity-util/class? d)
                       :class
                       (entity-util/hidden? d)
                       :hidden
                       (entity-util/whiteboard? d)
                       :normal-page
                       (entity-util/page? d)
                       :normal-page
                       (entity-util/asset? d)
                       :asset-block
                       (:file/path d)
                       :file-block
                       (:logseq.property.history/block d)
                       :property-history-block
                       (:block/closed-value-property d)
                       :closed-value-block
                       (and (:logseq.property/created-from-property d) (:logseq.property/value d))
                       :property-value-block
                       (= (:db/ident d) :logseq.property/empty-placeholder)
                       :property-value-placeholder
                       (:block/uuid d)
                       :block
                       (:db/ident d)
                       :db-ident-key-value)]
    dispatch-key))

(def Data
  (into
   [:multi {:dispatch (fn [d] (entity-dispatch-key *db-for-validate-fns* d))}]
   {:property property-page
    :class class-page
    :hidden hidden-page
    :normal-page normal-page
    :property-history-block property-history-block
    :closed-value-block closed-value-block
    :property-value-block property-value-block
    :block block
    :asset-block asset-block
    :file-block file-block
    :db-ident-key-value db-ident-key-val
    :property-value-placeholder property-value-placeholder}))

(def DB
  "Malli schema for entities from db-schema/schema. In order to
  thoroughly validate properties, the entities and this schema should be
  prepared with update-properties-in-ents and update-properties-in-schema
  respectively"
  [:sequential Data])

;; Keep malli schema in sync with db schema
;; ========================================
(let [malli-many-ref-attrs (->> (concat property-attrs page-attrs block-attrs page-or-block-attrs (rest closed-value-block*))
                                (filter #(= (last %) [:set :int]))
                                (map first)
                                (into db-property/public-db-attribute-properties)
                                set)]
  (when-let [undeclared-ref-attrs (seq (remove malli-many-ref-attrs db-schema/card-many-ref-type-attributes))]
    (throw (ex-info (str "The malli DB schema is missing the following cardinality-many ref attributes from datascript's schema: "
                         (string/join ", " undeclared-ref-attrs))
                    {}))))

(let [malli-one-ref-attrs (->> (concat property-attrs page-attrs block-attrs page-or-block-attrs (rest normal-page))
                               (filter #(= (last %) :int))
                               (map first)
                               set)]
  (when-let [undeclared-ref-attrs (seq (remove malli-one-ref-attrs db-schema/card-one-ref-type-attributes))]
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
