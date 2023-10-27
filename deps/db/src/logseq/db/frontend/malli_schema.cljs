(ns logseq.db.frontend.malli-schema
  "Malli schemas and fns for logseq.db.frontend.*"
  (:require [clojure.walk :as walk]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.frontend.property :as db-property]
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
                         [property-type [:tuple :uuid [:fn validation-fn]]])
                       :else
                       e)))
                 db-schema))

(defn update-properties-in-ents
  "Prepares entities to be validated by DB schema"
  [ents]
  (map #(if (:block/properties %)
          (update % :block/properties (fn [x] (mapv identity x)))
          %)
       ents))

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
(def property-tuple
  "Represents a tuple of a property and its property value. This schema
   has 2 metadata hooks which are used to inject a datascript db later"
  (into
   [:multi {:dispatch ^:add-db (fn [db property-tuple]
                                 (get-in (d/entity db [:block/uuid (first property-tuple)])
                                         [:block/schema :type]))}]
   (map (fn [[prop-type value-schema]]
          ^:property-value [prop-type (if (vector? value-schema) (last value-schema) value-schema)])
        db-property-type/builtin-schema-types)))

(def block-properties
  "Validates a slightly modified version of :block/properties. Properties are
  expected to be a vector of tuples instead of a map in order to validate each
  property with its property value that is valid for its type"
  [:sequential property-tuple])

(def page-or-block-attrs
  "Common attributes for page and normal blocks"
  [[:block/uuid :uuid]
   [:block/created-at :int]
   [:block/updated-at :int]
   [:block/properties {:optional true} block-properties]
   [:block/format [:enum :markdown]]
   [:block/refs {:optional true} [:set :int]]
   [:block/tags {:optional true} [:set :int]]
   [:block/tx-id {:optional true} :int]])

(def page-attrs
  "Common attributes for pages"
  [[:block/name :string]
   [:block/original-name :string]
   [:block/type {:optional true} [:enum #{"property"} #{"class"} #{"object"} #{"whiteboard"} #{"hidden"}]]
   [:block/journal? :boolean]
   [:block/alias {:optional true} [:set :int]]
    ;; TODO: Should this be here or in common?
   [:block/path-refs {:optional true} [:set :int]]])

(def normal-page
  (vec
   (concat
    [:map
     ;; journal-day is only set for journal pages
     [:block/journal-day {:optional true} :int]
     [:block/namespace {:optional true} :int]]
    page-attrs
    page-or-block-attrs)))

(def object-page
  (vec
   (concat
    [:map
     [:block/collapsed? {:optional true} :boolean]
     [:block/tags [:set :int]]]
    page-attrs
    (remove #(= :block/tags (first %)) page-or-block-attrs))))

(def class-page
  (vec
   (concat
    [:map
     [:block/namespace {:optional true} :int]
     [:block/schema
      {:optional true}
      [:map
       [:properties {:optional true} [:vector :uuid]]]]]
    page-attrs
    page-or-block-attrs)))

(def property-schema-attrs
  [[:hide? {:optional true} :boolean]
   [:description {:optional true} :string]
   ;; For any types except for :checkbox :default :template :enum
   [:cardinality {:optional true} [:enum :one :many]]
   ;; Just for :enum type
   [:enum-config {:optional true}
    [:map
     [:values
      [:map-of
       :uuid [:map
              [:name :string]
              [:description :string]
              [:icon {:optional true}
               [:map
                [:id :string]
                [:name :string]
                [:type [:enum :tabler-icon :emoji]]]]]]]
     ;; Optional b/c built-in props don't have it set
     [:order {:optional true} [:vector :uuid]]]]
   ;; Just for :enum
   [:position {:optional true} :string]
   ;; For :page and :template
   [:classes {:optional true} [:set [:or :uuid :keyword]]]])

(def internal-property
  (vec
   (concat
    [:map
     [:block/schema
      (into [:map
             [:type (apply vector :enum (into db-property-type/internal-builtin-schema-types
                                              db-property-type/user-builtin-schema-types))]]
            property-schema-attrs)]]
    page-attrs
    page-or-block-attrs)))

(def user-property
  (vec
   (concat
    [:map
     [:block/schema
      {:optional true}
      (into [:map
             ;; Once a schema is defined it must have :type as this is an irreversible decision
             [:type (apply vector :enum db-property-type/user-builtin-schema-types)]]
            property-schema-attrs)]]
    page-attrs
    page-or-block-attrs)))

(def property-page
  [:multi {:dispatch
           (fn [m] (contains? db-property/built-in-properties-keys-str (:block/name m)))}
   [true internal-property]
   [:malli.core/default user-property]])

(def hidden-page
  (vec
   (concat
    [:map
     [:block/metadata
      [:map
       [:source-page-id :uuid]]]]
    page-attrs
    page-or-block-attrs)))

(def page
  [:multi {:dispatch :block/type}
   [#{"property"} property-page]
   [#{"class"} class-page]
   [#{"object"} object-page]
   [#{"hidden"} hidden-page]
   [:malli.core/default normal-page]])

(def block-attrs
  "Common attributes for normal blocks"
  [[:block/content :string]
   [:block/left :int]
   [:block/parent :int]
   [:block/metadata {:optional true}
    [:map
     [:created-from-block :uuid]
     [:created-from-property :uuid]
     [:created-from-template {:optional true} :uuid]]]
    ;; refs
   [:block/page :int]
   [:block/path-refs {:optional true} [:set :int]]
   [:block/macros {:optional true} [:set :int]]
   [:block/link {:optional true} :int]
   [:block/collapsed-properties {:optional true} [:set :int]]
    ;; other
   [:block/marker {:optional true} :string]
   [:block/deadline {:optional true} :int]
   [:block/scheduled {:optional true} :int]
   [:block/repeated? {:optional true} :boolean]
   [:block/priority {:optional true} :string]
   [:block/collapsed? {:optional true} :boolean]])

(def object-block
  "A normal block with tags"
  (vec
   (concat
    [:map]
    [[:block/type [:= #{"object"}]]
     [:block/tags [:set :int]]]
    block-attrs
    (remove #(= :block/tags (first %)) page-or-block-attrs))))

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
   object-block])

;; TODO: invalid macros should not generate unknown
(def unknown-block
  "A block that has an unknown type. This type of block should be removed when
  the above TODOs have been addressed and the frontend ensures no unknown blocks
  are being created"
  [:map
   [:block/uuid :uuid]
   [:block/unknown? :boolean]])

(def file-block
  [:map
   [:block/uuid :uuid]
   [:block/tx-id {:optional true} :int]
   [:file/content :string]
   [:file/path :string]
   [:file/last-modified-at inst?]])

(def schema-version
  [:map
   [:schema/version :int]])

(def db-ident
  [:map
   [:db/ident :keyword]
   [:db/type {:optional true} :string]])

(def macro
  [:map
   [:db/ident :string]
   [:block/uuid :uuid]
   [:block/type [:= #{"macro"}]]
   [:block/properties block-properties]
   ;; Should this be removed?
   [:block/tx-id {:optional true} :int]])

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
    schema-version
    db-ident
    macro
    unknown-block]])

;; Keep malli schema in sync with db schema
;; ========================================
(let [malli-many-ref-attrs (->> (concat page-attrs block-attrs page-or-block-attrs)
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
                               (concat (rest file-block) (rest db-ident) (rest schema-version) (rest class-page))
                               (remove #(= (last %) [:set :int]))
                               (map first)
                               set)
      attrs-to-ignore #{:ast/version}]
  (when-let [undeclared-attrs (seq (remove (some-fn malli-non-ref-attrs attrs-to-ignore) db-schema/db-non-ref-attributes))]
    (throw (ex-info (str "The malli DB schema is missing the following non ref attributes from datascript's schema: "
                         (string/join ", " undeclared-attrs))
                    {}))))