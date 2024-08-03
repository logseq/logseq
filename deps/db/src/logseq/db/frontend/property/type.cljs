(ns logseq.db.frontend.property.type
  "Provides property types and related helper fns e.g. property value validation
  fns and their allowed schema attributes"
  (:require [datascript.core :as d]
            [clojure.set :as set]
            [logseq.common.util.macro :as macro-util]))

;; Config vars
;; ===========
;; These vars enumerate all known property types and their associated behaviors
;; except for validation which is in its own section

(def internal-built-in-property-types
  "Valid property types only for use by internal built-in-properties"
  #{:keyword :map :coll :any :entity})

(def user-built-in-property-types
  "Valid property types for users in order they appear in the UI"
  [:default :number :date :checkbox :url :node])

(def closed-value-property-types
  "Valid property :type for closed values"
  #{:default :number :url})

(def position-property-types
  "Valid property :type for position"
  #{:default :number :date :checkbox :url :node})

(assert (set/subset? closed-value-property-types (set user-built-in-property-types))
        "All closed value types are valid property types")

(def original-value-ref-property-types
  "Property value ref types where the refed entity stores its value in
  :property.value/content e.g. :number is stored as a number. new value-ref-property-types
  should default to this as it allows for more querying power"
  #{:number :url})

(def value-ref-property-types
  "Property value ref types where the refed entities either store their value in
  :property.value/content or :block/title (for :default)"
  (into #{:default}
        original-value-ref-property-types))

(def ref-property-types
  "User facing ref types. Property values that users see are stored in either
  :property.value/content, :block/title.
  :block/title is for all the page related types"
  (into #{:date :node} value-ref-property-types))

(assert (set/subset? ref-property-types
                     (set user-built-in-property-types))
        "All ref types are valid property types")

(def ^:private user-built-in-allowed-schema-attributes
  "Map of types to their set of allowed :schema attributes"
  (merge-with into
              (zipmap closed-value-property-types (repeat #{:values}))
              (zipmap position-property-types (repeat #{:position}))
              {:default #{:cardinality}
               :number #{:cardinality}
               :date #{:cardinality}
               :url #{:cardinality}
               :node #{:cardinality :classes}
               :checkbox #{}}))

(assert (= (set user-built-in-property-types) (set (keys user-built-in-allowed-schema-attributes)))
        "Each user built in type should have an allowed schema attribute")

;; Property value validation
;; =========================
;; TODO:
;; Validate && list fixes for non-validated values when updating property schema

(defn url?
  "Test if it is a `protocol://`-style URL.
   Originally from common-util/url? but does not need to be the same"
  [s]
  (and (string? s)
       (try
         (not (contains? #{nil "null"} (.-origin (js/URL. s))))
         (catch :default _e
           false))))

(defn macro-url?
  [s]
  ;; TODO: Confirm that macro expanded value is url when it's easier to pass data into validations
  (macro-util/macro? s))

(defn- url-entity?
  [db val {:keys [new-closed-value?]}]
  (if new-closed-value?
    (or (url? val) (macro-url? val))
    (when-let [ent (d/entity db val)]
      (or (url? (:property.value/content ent))
          (macro-url? (:property.value/content ent))))))

(defn- entity?
  [db id]
  (some? (d/entity db id)))

(defn- number-entity?
  [db id-or-value {:keys [new-closed-value?]}]
  (if new-closed-value?
    (number? id-or-value)
    (when-let [entity (d/entity db id-or-value)]
      (number? (:property.value/content entity)))))

(defn- text-entity?
  [db s {:keys [new-closed-value?]}]
  (if new-closed-value?
    (string? s)
    (when-let [ent (d/entity db s)]
      (string? (:block/title ent)))))

(defn- node-entity?
  [db val]
  (when-let [ent (d/entity db val)]
    ;; (seq (:block/tags ent))
    (some? ent)))

(defn- date?
  [db val]
  (when-let [ent (d/entity db val)]
    (and (some? (:block/title ent))
         (= (:block/type ent) "journal"))))

(def built-in-validation-schemas
  "Map of types to malli validation schemas that validate a property value for that type"
  {:default  [:fn
              {:error/message "should be a text block"}
              text-entity?]
   :number   [:fn
              {:error/message "should be a number"}
              number-entity?]
   :date     [:fn
              {:error/message "should be a journal date"}
              date?]
   :checkbox boolean?
   :url      [:fn
              {:error/message "should be a URL"}
              url-entity?]
   :node   [:fn
            {:error/message "should be a page/block with tags"}
            node-entity?]

   ;; Internal usage
   ;; ==============

   :entity   entity?
   :keyword  keyword?
   :map      map?
   ;; coll elements are ordered as it's saved as a vec
   :coll     coll?
   :any      some?})

(assert (= (set (keys built-in-validation-schemas))
           (into internal-built-in-property-types
                 user-built-in-property-types))
        "Built-in property types must be equal")

(def property-types-with-db
  "Property types whose validation fn requires a datascript db"
  #{:default :url :number :date :node :entity})

;; Helper fns
;; ==========
(defn property-type-allows-schema-attribute?
  "Returns boolean to indicate if property type allows the given :schema attribute"
  [property-type schema-attribute]
  (contains? (get user-built-in-allowed-schema-attributes property-type)
             schema-attribute))

(defn infer-property-type-from-value
  "Infers a user defined built-in :type from property value(s)"
  [val]
  (cond
    (number? val) :number
    (url? val) :url
    (contains? #{true false} val) :checkbox
    :else :default))
