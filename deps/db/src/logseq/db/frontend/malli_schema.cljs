(ns logseq.db.frontend.malli-schema
  "Malli schemas and fns for logseq.db.frontend.*"
  (:require [clojure.walk :as walk]
            [clojure.string :as string]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.frontend.property.type :as db-property-type]))

;; Helper fns
;; ==========
(defn- validate-property-value
  "Validates the value in a property tuple. The property value can be one or
  many of a value to validated"
  [prop-type schema-fn val]
  (if (and (or (sequential? val) (set? val))
           (not= :coll prop-type))
    (every? schema-fn val)
    (schema-fn val)))

(defn update-properties-in-schema
  "Needs to be called on the DB schema to add the datascript db to it"
  [db-schema db]
  (walk/postwalk (fn [e]
                   (let [meta' (meta e)]
                     (cond
                       (:add-db meta')
                       (partial e db)
                       (:property-value meta')
                       (let [[property-type schema-fn] e
                             schema-fn' (if (db-property-type/property-types-with-db property-type) (partial schema-fn db) schema-fn)
                             validation-fn #(validate-property-value property-type schema-fn' %)]
                         [property-type [:tuple :entity [:fn validation-fn]]])
                       :else
                       e)))
                 db-schema))

(defn datoms->entity-maps
  "Returns entity maps for given :eavt datoms"
  [datoms]
  (->> datoms
       (reduce (fn [acc m]
                 (if (contains? db-schema/card-many-attributes (:a m))
                   (update acc (:e m) update (:a m) (fnil conj #{}) (:v m))
                   (update acc (:e m) assoc (:a m) (:v m))))
               {})))

;; Malli schemas
;; =============
;; These schemas should be data vars to remain as simple and reusable as possible

;; FIXME: validate properties
(def page-or-block-attrs
  "Common attributes for page and normal blocks"
  [[:block/uuid :uuid]
   [:block/created-at :int]
   [:block/updated-at :int]
   [:block/format [:enum :markdown]]
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
   [:block/namespace {:optional true} :int]
   [:block/alias {:optional true} [:set :int]]
    ;; TODO: Should this be here or in common?
   [:block/path-refs {:optional true} [:set :int]]])

(def logseq-ident-namespaces
  "Set of all namespaces Logseq uses for :db/ident. It's important to grow this
  list purposefully and have it start with 'logseq' to allow for users and 3rd
  party plugins to provide their own namespaces to core concepts."
  #{"logseq.property" "logseq.property.table" "logseq.property.tldraw"
    "logseq.class" "logseq.task" "logseq.kv"})

(def user-ident-namespaces
  "Set of all namespaces Logseq uses for :db/ident. It's important to grow this
  list purposefully and have it start with 'logseq' to allow for users and 3rd
  party plugins to provide their own namespaces to core concepts."
  #{"user.property"})

(def db-attribute
  [:and :keyword [:fn
                  {:error/message "should be a valid db attribute"}
                  (fn db-attribute? [k]
                    (contains? #{"block"} (namespace k)))]])

(def logseq-ident
  [:and :keyword [:fn
                  {:error/message "should be a valid :db/ident namespace"}
                  (fn logseq-namespace? [k]
                    (contains? logseq-ident-namespaces (namespace k)))]])

(def user-ident
  [:and :keyword [:fn
                  {:error/message "should be a valid :db/ident namespace"}
                  (fn user-namespace? [k]
                    (contains? user-ident-namespaces (namespace k)))]])

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
  [[:db/ident {:optional true} :keyword]
   [:class/parent {:optional true} :int]
   [:class/schema.properties {:optional true} [:set :int]]])

(def class-page
  (vec
   (concat
    [:map
     [:block/schema
      {:optional true}
      [:map
       [:properties {:optional true} [:vector :uuid]]]]]
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
     [:db/ident [:or logseq-ident db-attribute]]
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
    db-property-type/user-built-in-property-types)))

(def user-property
  (vec
   (concat
    [:map
     [:db/ident user-ident]
     [:block/schema {:optional true} user-property-schema]]
    property-attrs
    page-attrs
    page-or-block-attrs)))

(def property-page
  [:multi {:dispatch (fn [m]
                       (or (string/starts-with? (namespace (m :db/ident)) "logseq.")
                           (= "block" (namespace (m :db/ident)))))}
   [true internal-property]
   [:malli.core/default user-property]])

(def hidden-page
  (vec
   (concat
    [:map]
    page-attrs
    page-or-block-attrs)))

(def page
  [:multi {:dispatch :block/type}
   [#{"property"} property-page]
   [#{"class"} class-page]
   [#{"hidden"} hidden-page]
   [:malli.core/default normal-page]])

(def block-attrs
  "Common attributes for normal blocks"
  [[:block/content :string]
   [:block/left :int]
   [:block/parent :int]
   ;; refs
   [:block/page :int]
   [:block/path-refs {:optional true} [:set :int]]
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
     [:db/ident {:optional true} logseq-ident]
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
   [:graph/local-tx :string]])

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
   [:db/ident [:= :property/empty-placeholder]]])

(def DB
  "Malli schema for entities from schema/schema-for-db-based-graph. In order to
  thoroughly validate properties, the entities and this schema should be
  prepared with update-properties-in-ents and update-properties-in-schema
  respectively"
  [:sequential
   [:or
    page
    block
    file-block
    db-ident-key-val
    asset-block
    property-value-placeholder]])

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

(let [malli-one-ref-attrs (->> (concat page-attrs block-attrs page-or-block-attrs (rest normal-page))
                               (filter #(= (last %) :int))
                               (map first)
                               set)
      attrs-to-ignore #{:block/file}]
  (when-let [undeclared-ref-attrs (seq (remove (some-fn malli-one-ref-attrs attrs-to-ignore) db-schema/card-one-ref-type-attributes))]
    (throw (ex-info (str "The malli DB schema is missing the following cardinality-one ref attributes from datascript's schema: "
                         (string/join ", " undeclared-ref-attrs))
                    {}))))

(let [malli-non-ref-attrs (->> (concat page-attrs block-attrs page-or-block-attrs (rest normal-page))
                               (concat (rest file-block) (rest asset-block)
                                       db-ident-keys (rest class-page))
                               (remove #(= (last %) [:set :int]))
                               (map first)
                               set)]
  (when-let [undeclared-attrs (seq (remove malli-non-ref-attrs db-schema/db-non-ref-attributes))]
    (throw (ex-info (str "The malli DB schema is missing the following non ref attributes from datascript's schema: "
                         (string/join ", " undeclared-attrs))
                    {}))))
