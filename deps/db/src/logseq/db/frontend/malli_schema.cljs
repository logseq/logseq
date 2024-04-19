(ns logseq.db.frontend.malli-schema
  "Malli schemas and fns for logseq.db.frontend.*"
  (:require [clojure.walk :as walk]
            [clojure.string :as string]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.frontend.property.type :as db-property-type]
            [datascript.core :as d]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.sqlite.util :as sqlite-util]))

;; :db/ident malli schemas
;; =======================

(def db-attribute-ident
  (into [:enum] db-property/db-attribute-properties))

(def logseq-property-ident
  [:and :keyword [:fn
                  {:error/message "should be a valid logseq property namespace"}
                  db-property/logseq-property?]])

(def internal-property-ident
  [:or logseq-property-ident db-attribute-ident])

(defn- user-property?
  "Determines if keyword/ident is a user property"
  [kw]
  (db-property/user-property-namespace? (namespace kw)))

(def user-property-ident
  [:and :keyword [:fn
                  {:error/message "should be a valid user property namespace"}
                  user-property?]])

(def property-ident
  [:or internal-property-ident user-property-ident])

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

;; Helper fns
;; ==========
(defn validate-property-value
  "Validates the property value in a property tuple. The property value can be
  one or many of a value to validated. validate-fn is a fn that is called
  directly on each value to return a truthy value. validate-fn varies by
  property type"
  [db validate-fn [{:block/keys [schema] :as property} property-val] & {:keys [new-closed-value?]}]
  ;; For debugging
  ;; (when (not= "logseq.property" (namespace (:db/ident property))) (prn :validate-val property property-val))
  (let [validate-fn' (if (db-property-type/property-types-with-db (:type schema)) (partial validate-fn db) validate-fn)
        validate-fn'' (if (and (db-property-type/closed-value-property-types (:type schema))
                               ;; new closed values aren't associated with the property yet
                               (not new-closed-value?)
                               (seq (:values schema)))
                        (fn closed-value-valid? [val]
                          (and (validate-fn' val)
                               (contains? (set (:values schema))
                                          (:block/uuid (d/entity db val)))))
                        validate-fn')]
    (if (= (get-in property [:block/schema :cardinality]) :many)
      (every? validate-fn'' property-val)
      (or (validate-fn'' property-val) (= :logseq.property/empty-placeholder property-val)))))

(defn update-properties-in-schema
  "Needs to be called on the DB schema to add the datascript db to it"
  [db-schema db]
  (walk/postwalk (fn [e]
                   (let [meta' (meta e)]
                     (if (:add-db meta') (partial e db) e)))
                 db-schema))

(defn update-properties-in-ents
  "Prepares properties in entities to be validated by DB schema"
  [db ents]
  (mapv
   #(if-let [pair (some->> (:property/pair-property %) (d/entity db))]
      (assoc % :property-tuple
             [(hash-map :block/schema (select-keys (:block/schema pair) [:type :cardinality :values])
                        :db/ident (:db/ident pair))
              (get % (:db/ident pair))])
      %)
   ents))

(defn datoms->entity-maps
  "Returns entity maps for given :eavt datoms indexed by db/id. Optional keys:
   * :entity-fn - Optional fn that given an entity id, returns entity. Defaults
     to just doing a lookup within entity-maps to be as performant as possible"
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
        entity-fn' (or entity-fn #(get ent-maps %))]
    (-> ent-maps
        (update-vals
         (fn [v]
           (let [pair-ent (when (:property/pair-property v) (entity-fn' (:property/pair-property v)))]
             (if-let [prop-value
                      (and pair-ent
                           (= :db.cardinality/many (:db/cardinality pair-ent))
                           (get v (:db/ident pair-ent)))]
               (if-not (set? prop-value)
                 ;; Fix :many property values that only had one value
                 (assoc v (:db/ident pair-ent) #{prop-value})
                 v)
               v)))))))

(defn datoms->entities
  "Returns a vec of entity maps given :eavt datoms"
  [datoms]
  (mapv (fn [[db-id m]] (with-meta m {:db/id db-id}))
        (datoms->entity-maps datoms)))

;; Main malli schemas
;; ==================
;; These schemas should be data vars to remain as simple and reusable as possible

(def page-or-block-attrs
  "Common attributes for page and normal blocks"
  [[:block/uuid :uuid]
   [:block/created-at :int]
   [:block/updated-at :int]
   [:block/format [:enum :markdown]]
   [:block/properties {:optional true} [:set :int]]
   [:block/refs {:optional true} [:set :int]]
   [:block/tags {:optional true} [:set :int]]
   [:block/collapsed-properties {:optional true} [:set :int]]
   [:block/tx-id {:optional true} :int]])

(def page-attrs
  "Common attributes for pages"
  [[:block/name :string]
   [:block/original-name :string]
   [:block/type {:optional true} [:enum #{"class"} #{"property"} #{"whiteboard"} #{"hidden"}]]
   [:block/journal? :boolean]
   [:block/alias {:optional true} [:set :int]]
    ;; TODO: Should this be here or in common?
   [:block/path-refs {:optional true} [:set :int]]
   ;; file-based
   [:block/namespace {:optional true} :int]])

(def property-attrs
  "Common attributes for properties"
  [[:db/index {:optional true} :boolean]
   [:db/valueType {:optional true} [:enum :db.type/ref]]
   [:db/cardinality {:optional true} [:enum :db.cardinality/many :db.cardinality/one]]])

(def normal-page
  (vec
   (concat
    [:map
     ;; Only for linked pages
     [:block/collapsed? {:optional true} :boolean]
     ;; journal-day is only set for journal pages
     [:block/journal-day {:optional true} :int]]
    page-attrs
    page-or-block-attrs)))

(def class-attrs
  [[:db/ident {:optional true} logseq-ident]
   [:class/parent {:optional true} :int]
   [:class/schema.properties {:optional true} [:set :int]]])

(def class-page
  (vec
   (concat
    [:map
     [:block/schema
      {:optional true}
      [:map
       [:properties {:optional true} [:vector property-ident]]]]]
    class-attrs
    page-attrs
    page-or-block-attrs)))

(def property-type-schema-attrs
  "Property :schema attributes that vary by :type"
  [;; For any types except for :checkbox :default :template
   [:cardinality {:optional true} [:enum :one :many]]
   ;; For closed values
   [:values {:optional true}  [:vector :uuid]]
   ;; For closed values
   [:position {:optional true} :string]
   ;; For :page and :template
   [:classes {:optional true} [:set [:or :uuid :keyword]]]])

(def property-common-schema-attrs
  "Property :schema attributes common to all properties"
  [[:hide? {:optional true} :boolean]
   [:description {:optional true} :string]])

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
         [:view-context {:optional true} [:enum :page :block]]]
        property-common-schema-attrs
        property-type-schema-attrs))]]
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
         property-common-schema-attrs
         (remove #(not (db-property-type/property-type-allows-schema-attribute? prop-type (first %)))
                 property-type-schema-attrs)))])
    ;; TODO: Remove :string once it is user facing
    (conj db-property-type/user-built-in-property-types :string))))

(def user-property
  (vec
   (concat
    [:map
     [:db/ident user-property-ident]
     [:block/schema {:optional true} user-property-schema]]
    property-attrs
    page-attrs
    page-or-block-attrs)))

(def property-page
  [:multi {:dispatch (fn [m]
                       (or (db-property/logseq-property? (m :db/ident))
                           (contains? db-property/db-attribute-properties (m :db/ident))))}
   [true internal-property]
   [:malli.core/default user-property]])

(def hidden-page
  (vec
   (concat
    [:map]
    page-attrs
    page-or-block-attrs)))

(def block-attrs
  "Common attributes for normal blocks"
  [[:block/content :string]
   [:block/left :int]
   [:block/parent :int]
   ;; refs
   [:block/page :int]
   [:block/path-refs {:optional true} [:set :int]]
   [:block/macros {:optional true} [:set :int]]
   [:block/link {:optional true} :int]
    ;; other
   [:block/marker {:optional true} :string]
   [:block/deadline {:optional true} :int]
   [:block/scheduled {:optional true} :int]
   [:block/repeated? {:optional true} :boolean]
   [:block/priority {:optional true} :string]
   [:block/collapsed? {:optional true} :boolean]])

(def whiteboard-block
  "A (shape) block for whiteboard"
  (vec
   (concat
    [:map]
    [[:block/content :string]
     [:block/parent :int]
     ;; These blocks only associate with pages of type "whiteboard"
     [:block/page :int]
     [:block/path-refs {:optional true} [:set :int]]]
    page-or-block-attrs)))

(def closed-value-block
  "A closed value for a property with closed/allowed values"
  (vec
   (concat
    [:map]
    [[:block/type [:= #{"closed value"}]]
     ;; for built-in properties
     [:db/ident {:optional true} logseq-property-ident]
     [:block/schema {:optional true}
      [:map
       [:value [:or :string :double]]
       [:description {:optional true} :string]]]]
    (remove #(#{:block/content :block/left} (first %)) block-attrs)
    page-or-block-attrs)))

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
   whiteboard-block])

(def file-block
  [:map
   [:block/uuid :uuid]
   [:block/tx-id {:optional true} :int]
   [:file/content :string]
   [:file/path :string]
   [:file/last-modified-at inst?]])

(def asset-block
  [:map
   [:asset/uuid :uuid]
   [:asset/meta :map]])

(def db-ident-keys
  "Enumerates all possible keys db-ident key vals"
  [[:db/type :string]
   [:schema/version :int]
   [:graph/uuid :string]
   [:graph/local-tx :string]
   [:editor/tx-batch-mode? :boolean]])

(def property-tuple
  "A tuple of a property map and a property value. This schema
   has 1 metadata hook which is used to inject a datascript db later"
  (into
   [:multi {:dispatch #(-> % first :block/schema :type)}]
   (map (fn [[prop-type value-schema]]
          [prop-type
           (let [schema-fn (if (vector? value-schema) (last value-schema) value-schema)]
             [:fn (with-meta (fn [db tuple] (validate-property-value db schema-fn tuple)) {:add-db true})])])
        db-property-type/built-in-validation-schemas)))

(def property-pair
  [:map
   ;; Not closed because property value key is different with every property
   {:closed false}
   [:property/pair-property :int]
   [:block/created-at :int]
   [:block/updated-at :int]
   ;; Injected by update-properties-in-ents
   [:property-tuple property-tuple]
   [:block/tx-id {:optional true} :int]])

(def db-ident-key-val
  "A key-val map consists of a :db/ident and a specific key val"
  (into [:or]
        (map (fn [kv]
               [:map
                [:db/ident logseq-ident]
                kv
                [:block/tx-id {:optional true} :int]])
             db-ident-keys)))

(def property-value-placeholder
  [:map
   [:db/ident [:= :logseq.property/empty-placeholder]]
   [:block/tx-id {:optional true} :int]])

(defn- type-set
  [d]
  (when-let [type (:block/type d)]
    (if (coll? type)
      (set type)
      #{type})))

(def Data
  (into
   [:multi {:dispatch (fn [d]
                        (cond
                          (contains? (type-set d) "property")
                          :property
                          (contains? (type-set d) "class")
                          :class
                          (contains? (type-set d) "hidden")
                          :hidden
                          (contains? (type-set d) "whiteboard")
                          :normal-page
                          (sqlite-util/page? d)
                          :normal-page
                          (:file/path d)
                          :file-block
                          (:block/uuid d)
                          :block
                          (:property/pair-property d)
                          :property-pair
                          (:asset/uuid d)
                          :asset-block
                          (= (:db/ident d) :logseq.property/empty-placeholder)
                          :property-value-placeholder
                          (:db/ident d)
                          :db-ident-key-value))}]
   {:property property-page
    :class class-page
    :hidden hidden-page
    :normal-page normal-page
    :block block
    :file-block file-block
    :db-ident-key-value db-ident-key-val
    :property-pair property-pair
    :asset-block asset-block
    :property-value-placeholder property-value-placeholder}))

(def DB
  "Malli schema for entities from schema/schema-for-db-based-graph. In order to
  thoroughly validate properties, the entities and this schema should be
  prepared with update-properties-in-ents and update-properties-in-schema
  respectively"
  [:sequential Data])

;; Keep malli schema in sync with db schema
;; ========================================
(let [malli-many-ref-attrs (->> (concat class-attrs page-attrs block-attrs page-or-block-attrs)
                                (filter #(= (last %) [:set :int]))
                                (map first)
                                set)]
  (when-let [undeclared-ref-attrs (seq (remove malli-many-ref-attrs db-schema/card-many-ref-type-attributes))]
    (throw (ex-info (str "The malli DB schema is missing the following cardinality-many ref attributes from datascript's schema: "
                         (string/join ", " undeclared-ref-attrs))
                    {}))))

(let [malli-one-ref-attrs (->> (concat class-attrs page-attrs block-attrs page-or-block-attrs (rest normal-page) (rest property-pair))
                               (filter #(= (last %) :int))
                               (map first)
                               set)
      attrs-to-ignore #{:block/file}]
  (when-let [undeclared-ref-attrs (seq (remove (some-fn malli-one-ref-attrs attrs-to-ignore) db-schema/card-one-ref-type-attributes))]
    (throw (ex-info (str "The malli DB schema is missing the following cardinality-one ref attributes from datascript's schema: "
                         (string/join ", " undeclared-ref-attrs))
                    {}))))

(let [malli-non-ref-attrs (->> (concat class-attrs page-attrs block-attrs page-or-block-attrs (rest normal-page))
                               (concat (rest file-block) (rest asset-block)
                                       db-ident-keys (rest class-page))
                               (remove #(= (last %) [:set :int]))
                               (map first)
                               set)]
  (when-let [undeclared-attrs (seq (remove malli-non-ref-attrs db-schema/db-non-ref-attributes))]
    (throw (ex-info (str "The malli DB schema is missing the following non ref attributes from datascript's schema: "
                         (string/join ", " undeclared-attrs))
                    {}))))
