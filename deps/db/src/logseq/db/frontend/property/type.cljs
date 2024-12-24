(ns logseq.db.frontend.property.type
  "Provides property types and related helper fns e.g. property value validation
  fns and their allowed schema attributes"
  (:require [datascript.core :as d]
            [clojure.set :as set]
            [logseq.common.util.macro :as macro-util]
            [logseq.db.frontend.entity-util :as entity-util]
            [clojure.string :as string]))

;; Config vars
;; ===========
;; These vars enumerate all known property types and their associated behaviors
;; except for validation which is in its own section

(def internal-built-in-property-types
  "Valid property types only for use by internal built-in-properties"
  #{:keyword :map :coll :any :entity :class :page :property :string :raw-number})

(def user-built-in-property-types
  "Valid property types for users in order they appear in the UI"
  [:default :number :date :datetime :checkbox :url :node])

(def closed-value-property-types
  "Valid property :type for closed values"
  #{:default :number :url})

(def cardinality-property-types
  "Valid property types that can change cardinality"
  #{:default :number :url :date :node})

(def default-value-ref-property-types
  "Valid ref property :type for default value support"
  #{:default :number :checkbox})

(def text-ref-property-types
  "Valid ref property :types that support text"
  #{:default :url :entity})

(assert (set/subset? cardinality-property-types (set user-built-in-property-types))
        "All closed value types are valid property types")

(assert (set/subset? closed-value-property-types (set user-built-in-property-types))
        "All closed value types are valid property types")

(def original-value-ref-property-types
  "Property value ref types where the refed entity stores its value in
  :property.value/content e.g. :number is stored as a number. new value-ref-property-types
  should default to this as it allows for more querying power"
  #{:number})

(def value-ref-property-types
  "Property value ref types where the refed entities either store their value in
  :property.value/content or :block/title (for :default)"
  (into #{:default :url} original-value-ref-property-types))

(def user-ref-property-types
  "User ref types. Property values that users see are stored in either
  :property.value/content or :block/title. :block/title is for all the page related types"
  (into #{:date :node} value-ref-property-types))

(assert (set/subset? user-ref-property-types
                     (set user-built-in-property-types))
        "All ref types are valid property types")

(def all-ref-property-types
  "All ref types - user and internal"
  (into #{:entity :class :page :property} user-ref-property-types))

(assert (set/subset? all-ref-property-types
                     (set/union (set user-built-in-property-types) internal-built-in-property-types))
        "All ref types are valid property types")

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
  "Empty string, url or macro url"
  [db val {:keys [new-closed-value?]}]
  (if new-closed-value?
    (or (url? val) (macro-url? val))
    (when-let [ent (d/entity db val)]
      (let [title (:block/title ent)]
        (or (string/blank? title) (url? title) (macro-url? title))))))

(defn- entity?
  [db id]
  (some? (d/entity db id)))

(defn- class-entity?
  [db id]
  (entity-util/class? (d/entity db id)))

(defn- property-entity?
  [db id]
  (entity-util/property? (d/entity db id)))

(defn- page-entity?
  [db id]
  (entity-util/page? (d/entity db id)))

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
    (some? (:block/title ent))))

(defn- date?
  [db val]
  (when-let [ent (d/entity db val)]
    (and (some? (:block/title ent))
         (entity-util/journal? ent))))

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
   :datetime [:fn
              {:error/message "should be a datetime"}
              number?]
   :checkbox boolean?
   :url      [:fn
              {:error/message "should be a URL"}
              url-entity?]
   :node   [:fn
            {:error/message "should be a page/block with tags"}
            node-entity?]

   ;; Internal usage
   ;; ==============

   :string   string?
   :raw-number number?
   :entity   [:fn
              {:error/message "should be an Entity"}
              entity?]
   :class    [:fn
              {:error/message "should be a Class"}
              class-entity?]
   :property [:fn
              {:error/message "should be a Property"}
              property-entity?]
   :page     [:fn
              {:error/message "should be a Page"}
              page-entity?]
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
  #{:default :url :number :date :node :entity :class :property :page})

;; Helper fns
;; ==========
(defn infer-property-type-from-value
  "Infers a user defined built-in :type from property value(s)"
  [val]
  (cond
    (number? val) :number
    (url? val) :url
    (contains? #{true false} val) :checkbox
    :else :default))

(defn property-value-content?
  "Whether property value should be stored in :property.value/content"
  [block-type property]
  (or
   (original-value-ref-property-types (get-in property [:block/schema :type]))
   (and (= (:db/ident property) :logseq.property/default-value)
        (original-value-ref-property-types block-type))))
