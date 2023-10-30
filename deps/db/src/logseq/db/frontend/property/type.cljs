(ns logseq.db.frontend.property.type
  "Provides property types including fns to validate them"
  (:require [datascript.core :as d]))

(def internal-builtin-schema-types
  "Valid schema :type only to be used by built-in-properties"
  #{:keyword :map :coll :any})

(def user-builtin-schema-types
  "Valid schema :type for users in order they appear in the UI"
  [:default :number :date :checkbox :url :page :template :enum])

(def enum-schema-types
  "Valid schema :type for enum property"
  ;; [:default :number :date :url :page]
  [:default :number :date :url]         ; TODO: add :page support
  )

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

(defn- text-or-uuid?
  [value]
  (or (string? value) (uuid? value)))

(def builtin-schema-types
  {:default  [:fn
              {:error/message "should be a text or UUID"}
              text-or-uuid?]                     ; refs/tags will not be extracted
   :number   number?
   :date     [:fn
              {:error/message "should be a journal date"}
              logseq-page?]
   :checkbox boolean?
   :url      [:fn
              {:error/message "should be a URL"}
              url?]
   :page     [:fn
              {:error/message "should be a page"}
              logseq-page?]
   :template [:fn
              {:error/message "should has #template"}
              logseq-template?]
   :enum     some?                      ; the value could be anything such as number, text, url, date, page, image, video, etc.
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
