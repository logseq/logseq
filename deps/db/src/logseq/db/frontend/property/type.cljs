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
  [:default :string :number :date :checkbox :url :page :template])

(def closed-value-property-types
  "Valid schema :type for closed values"
  #{:string :number :url :page :date})

(assert (set/subset? closed-value-property-types (set user-built-in-property-types))
        "All closed value types are valid property types")

(def ref-property-types
  "User facing ref types"
  #{:default :page :date})

(assert (set/subset? ref-property-types
                     (set user-built-in-property-types))
        "All ref types are valid property types")

(def ^:private user-built-in-allowed-schema-attributes
  "Map of types to their set of allowed :schema attributes"
  (merge-with into
              (zipmap closed-value-property-types (repeat #{:values}))
              (zipmap #{:string :number :url} (repeat #{:position}))
              {:default #{:cardinality}
               :string #{:cardinality}
               :number #{:cardinality}
               :date #{:cardinality}
               :url #{:cardinality}
               :page #{:cardinality :classes}
               :template #{:classes}
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

(defn- entity?
  [db id]
  (some? (d/entity db id)))

(defn- url-or-closed-url?
  [db val]
  (or (url? val)
      (macro-url? val)
      (when-let [ent (d/entity db val)]
        (url? (get-in ent [:block/schema :value])))))

(defn- property-value-block?
  [db s]
  (when-let [ent (d/entity db s)]
    (and (:block/content ent)
         (:logseq.property/created-from-property ent))))

(defn- page?
  [db val]
  (when-let [ent (d/entity db val)]
    (some? (:block/original-name ent))))

(defn- date?
  [db val]
  (when-let [ent (d/entity db val)]
    (and (some? (:block/original-name ent))
         (contains? (:block/type ent) "journal"))))

(defn- string-or-closed-string?
  [db s]
  (or (string? s)
      (when-let [entity (d/entity db s)]
        (string? (get-in entity [:block/schema :value])))))

(def built-in-validation-schemas
  "Map of types to malli validation schemas that validate a property value for that type"
  {:default  [:fn
              {:error/message "should be a text block"}
              property-value-block?]
   :string   [:fn
              {:error/message "should be a string"}
              string-or-closed-string?]
   :number   [:fn
              {:error/message "should be a number"}
              ;; Also handles entity? so no need to use it
              number?]
   :date     [:fn
              {:error/message "should be a journal date"}
              date?]
   :checkbox boolean?
   :url      [:fn
              {:error/message "should be a URL"}
              url-or-closed-url?]
   :page     [:fn
              {:error/message "should be a page"}
              page?]
   ;; TODO: strict check on template
   :template [:fn
              {:error/message "should has #template"}
              entity?]

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
  #{:default :string :url :date :page :template :entity})

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
    (coll? val) :page
    (number? val) :number
    (url? val) :url
    (contains? #{true false} val) :checkbox
    :else :default))
