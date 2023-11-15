(ns logseq.db.frontend.property.type
  "Provides property types including fns to validate them"
  (:require [datascript.core :as d]
            [clojure.set :as set]))

(def internal-builtin-schema-types
  "Valid schema :type only to be used by built-in-properties"
  #{:keyword :map :coll :any})

(def user-builtin-schema-types
  "Valid schema :type for users in order they appear in the UI"
  [:default :number :date :checkbox :url :page :template])

(def closed-values-schema-types
  "Valid schema :type for closed values"
  #{:default :number :date :url :page})

(assert (set/subset? closed-values-schema-types (set user-builtin-schema-types))
        "All closed value types are valid property types")

;; TODO:
;; Validate && list fixes for non-validated values when updating property schema

(defn url?
  "Test if it is a `protocol://`-style URL.
   Originally from gp-util/url? but does not need to be the same"
  [s]
  (and (string? s)
       (try
         (not (contains? #{nil "null"} (.-origin (js/URL. s))))
         (catch :default _e
           false))))

(defn- logseq-page?
  [db id]
  (and (uuid? id)
       (when-let [e (d/entity db [:block/uuid id])]
         (nil? (:block/page e)))))

;; FIXME: template instance check
(defn- logseq-template?
  [db id]
  (and (uuid? id)
       (some? (d/entity db [:block/uuid id]))))

(defn- existing-closed-value-valid?
  "Validates that the given existing closed value is valid"
  [db property type-validate-fn value]
  (boolean
   (when-let [e (and (uuid? value)
                     (d/entity db [:block/uuid value]))]
     (let [values (get-in property [:block/schema :values])]
       (and
        (contains? (set values) value)
        (if (contains? (:block/type e) "closed value")
          (type-validate-fn (:value (:block/schema e)))
          ;; page uuids aren't closed value types
          (type-validate-fn value)))))))

(defn type-or-closed-value?
  "The `value` could be either a closed value (when `property` has pre-defined values) or it can be validated by `type-validate-fn`.
  Args:
  `new-closed-value?`: a new value will be added, so we'll check it using `type-validate-fn`."
  [type-validate-fn]
  (fn [db property value new-closed-value?]
    (if (and (seq (get-in property [:block/schema :values]))
             (not new-closed-value?))
      (existing-closed-value-valid? db property type-validate-fn value)
      (type-validate-fn value))))

(def builtin-schema-types
  {:default  [:fn
              {:error/message "should be a text"}
              ;; uuid check needed for property block values
              (some-fn string? uuid?)]                     ; refs/tags will not be extracted
   :number   [:fn
              {:error/message "should be a number"}
              ;; TODO: Remove uuid? for :number and :url when type-or-closed-value? is used in this ns
              (some-fn number? uuid?)]
   :date     [:fn
              {:error/message "should be a journal date"}
              logseq-page?]
   :checkbox boolean?
   :url      [:fn
              {:error/message "should be a URL"}
              (some-fn url? uuid?)]
   :page     [:fn
              {:error/message "should be a page"}
              logseq-page?]
   :template [:fn
              {:error/message "should has #template"}
              logseq-template?]
   ;; internal usage
   :keyword  keyword?
   :map      map?
   ;; coll elements are ordered as it's saved as a vec
   :coll     coll?
   :any      some?})

(def property-types-with-db
  "Property types whose validation fn requires a datascript db"
  #{:date :page :template})

(assert (= (set (keys builtin-schema-types))
           (into internal-builtin-schema-types
                 user-builtin-schema-types))
        "Built-in schema types must be equal")
