(ns logseq.melange.bridge.db.property
  "Property identity and name representation boundary."
  (:require ["@logseq/melange-js-api/db" :as melange-db]
            [logseq.melange.bridge.db.property-catalog :as property-catalog]
            [logseq.melange.bridge.platform.datascript :as d]
            [logseq.melange.bridge.runtime :as runtime]))

(def ^:private property-api (.-PropertyIdentity melange-db))
(def ^:private property-order-api (.-PropertyOrder melange-db))
(def ^:private property-scope-api (.-PropertyScope melange-db))
(def ^:private property-shape-api (.-PropertyShape melange-db))
(def ^:private property-workflow-api (.-PropertyWorkflow melange-db))

(defn- ident-text
  [value]
  (if (keyword? value)
    (subs (str value) 1)
    (str value)))

(defn logseq-property?
  "Returns true when the keyword belongs to a registered Logseq property namespace."
  [value]
  ((.-isLogseqPropertyNamespace property-api) (namespace value)))

(defn user-property-namespace?
  "Returns true when the namespace contains the user-property marker."
  [namespace-value]
  ((.-isUserPropertyNamespace property-api) namespace-value))

(defn plugin-property?
  "Returns true when the keyword belongs to a namespaced plugin property."
  [value]
  ((.-isPluginPropertyNamespace property-api) (namespace value)))

(defn internal-property?
  "Returns true when the ident is an internal property exposed by the DB model."
  [value]
  ((.-isInternalProperty property-api)
   (namespace value)
   (ident-text value)
   (keyword? value)))

(defn property?
  "Returns true when the ident is a property visible to users."
  [value]
  ((.-isProperty property-api)
   (namespace value)
   (ident-text value)
   (keyword? value)))

(defn valid-property-name?
  "Returns true when the string does not begin with tag or page-reference syntax."
  [value]
  {:pre [(string? value)]}
  ((.-validPropertyName property-api) value))

(defn built-in-ident->i18n-key
  "Returns the derived i18n keyword for a built-in ident, or nil for other idents."
  [value]
  (when-let [result ((.-builtInI18nKey property-api) (namespace value) (name value))]
    (keyword (aget result 0) (aget result 1))))

(defn sort-properties
  "Sorts property entities by order and UUID, placing missing orders last."
  [entities]
  (seq ((.-sortEntitiesWith property-order-api)
        (runtime/runtime-adapter)
        (d/adapter)
        (to-array entities))))

(defn normalize-sorted-entities-block-order
  "Returns DB updates that replace duplicated or grouped missing property orders."
  [sorted-entities]
  ((.-normalizeEntitiesValueWith property-order-api)
   (runtime/runtime-adapter)
   (d/adapter)
   sorted-entities))

(defn get-class-ordered-properties
  "Returns a class entity's properties in property order."
  [class-entity]
  (seq ((.-classOrderedWith property-order-api)
        (runtime/runtime-adapter)
        (d/adapter)
        class-entity)))

(defn scoped-closed-values
  "Returns non-recycled closed values visible to the block's classes."
  [property block & {:keys [values]}]
  (seq ((.-scopedValuesWith property-scope-api)
        (runtime/runtime-adapter)
        (d/adapter)
        property
        block
        values)))

(defn property-created-block?
  "Returns true for map blocks created by a property without stored content."
  [block]
  ((.-isPropertyCreatedBlockWith property-shape-api)
   (runtime/runtime-adapter)
   block))

(defn many?
  "Returns true when the property has many cardinality."
  [property]
  ((.-isMany property-shape-api) (ident-text (:db/cardinality property))))

(defn property-value-content
  "Returns the entity title when truthy, otherwise its stored property value."
  [entity]
  ((.-contentWith property-workflow-api)
   (runtime/runtime-adapter) (d/adapter) entity))

(def closed-value-content
  "Returns the display content for a closed-value entity."
  property-value-content)

(defn properties
  "Returns the entity's visible properties indexed by DB ident."
  [entity]
  ((.-propertiesWith property-workflow-api)
   (runtime/runtime-adapter)
   entity))

(defn built-in-closed-values
  "Returns the configured closed values for a built-in property ident."
  [ident]
  (property-catalog/closed-values ident))

(def default-user-namespace "user.property")

(defn create-user-property-ident-from-name
  "Creates a property DB ident in a controlled user namespace."
  ([property-name]
   ((.-createUserIdent property-workflow-api)
    (runtime/runtime-adapter)
    property-name
    nil))
  ([property-name user-namespace]
   ((.-createUserIdent property-workflow-api)
    (runtime/runtime-adapter)
    property-name
    (name user-namespace))))

(defn public-built-in-property?
  "Returns the built-in property's public visibility value."
  [entity]
  ((.-publicBuiltInWith property-workflow-api)
   (runtime/runtime-adapter)
   entity))

(defn get-property-schema
  "Returns only schema attributes from a property map."
  [property]
  ((.-schemaWith property-workflow-api)
   (runtime/runtime-adapter)
   property))

(defn built-in-has-ref-value?
  "Returns true when the built-in property stores reference values."
  [ident]
  ((.-builtInHasRefValue property-api) (ident-text ident)))

(defn lookup
  "Returns a built-in property value with reference content dereferenced."
  [block ident]
  ((.-lookupWith property-workflow-api)
   (runtime/runtime-adapter) (d/adapter) block ident))

(defn built-in-display-title
  "Returns a translated built-in title, falling back to the entity title."
  [entity translate-fn]
  ((.-builtInDisplayTitleWith property-workflow-api)
   (runtime/runtime-adapter) (d/adapter) entity translate-fn))

(defn get-closed-property-values
  "Returns non-recycled closed values in fractional order."
  [db property-id]
  (some->> ((.-closedValuesNullableWith property-scope-api)
            (runtime/runtime-adapter)
            (d/adapter)
            db
            property-id)
           array-seq
           (map identity)))

(defn get-closed-value-entity-by-name
  "Finds a closed value by its display content."
  [db property-ident value-content]
  ((.-closedValueByNameNullableWith property-scope-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   property-ident
   value-content))

(defn get-block-property-value
  "Returns a built-in property value from the current DB entity."
  [db block property-ident]
  ((.-blockValueWith property-workflow-api)
   (runtime/runtime-adapter) (d/adapter) db block property-ident))
