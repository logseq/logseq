(ns logseq.melange.bridge.db.property-type
  "CLJS keyword collection conversion for typed Melange property-type catalogs."
  (:require ["@logseq/melange-js-api/common" :as common-api]
            ["@logseq/melange-js-api/db" :as db-api]))

(def ^:private property-type (.-PropertyType db-api))
(def ^:private macro-api (.-Macro common-api))
(def ^:private string-util-api (.-StringUtil common-api))

(defn- keyword-vector
  [values]
  (mapv keyword (seq values)))

(defn- keyword-set
  [values]
  (set (keyword-vector values)))

(def internal-built-in-property-types
  (keyword-set (.-internalBuiltIn property-type)))

(def user-built-in-property-types
  (keyword-vector (.-userBuiltIn property-type)))

(def user-allowed-internal-property-types
  (keyword-set (.-userAllowedInternal property-type)))

(def closed-value-property-types
  (keyword-set (.-closedValue property-type)))

(def cardinality-property-types
  (keyword-set (.-cardinality property-type)))

(def default-value-ref-property-types
  (keyword-set (.-defaultValueRef property-type)))

(def text-ref-property-types
  (keyword-set (.-textRef property-type)))

(def original-value-ref-property-types
  (keyword-set (.-originalValueRef property-type)))

(def value-ref-property-types
  (keyword-set (.-valueRef property-type)))

(def user-ref-property-types
  (keyword-set (.-userRef property-type)))

(def all-ref-property-types
  (keyword-set (.-allRef property-type)))

(def property-types-with-db
  (keyword-set (.-withDb property-type)))

(defn url?
  "Returns true for a string with a parsed non-null URL origin."
  [value]
  (and (string? value) ((.-isUrl string-util-api) value)))

(defn macro-url?
  [value]
  ((.-isMacro macro-api) value))

(defn infer-property-type-from-value
  "Infers the public property type for a scalar CLJS value."
  [value]
  (keyword
   ((.-infer property-type)
    (number? value)
    (url? value)
    (contains? #{true false} value))))

(defn property-value-content?
  "Returns true when a property value is stored in `:logseq.property/value`."
  [block-type property]
  ((.-propertyValueContent property-type)
   (some-> (:logseq.property/type property) name)
   (= (:db/ident property) :logseq.property/default-value)
   (some-> block-type name)))
