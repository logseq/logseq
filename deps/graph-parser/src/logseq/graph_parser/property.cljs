(ns logseq.graph-parser.property
  "Core vars and util fns for properties"
  (:require [logseq.graph-parser.util :as gp-util]
            [clojure.string :as string]
            [clojure.set :as set]
            [goog.string :as gstring]
            [goog.string.format]))

;; Graph agnostic fns
;; ==================
(def colons "Property delimiter for markdown mode" "::")
(defn colons-org
  "Property delimiter for org mode"
  [property]
  (str ":" property ":"))

(defn ->block-content
  "Creates a block content string from properties map"
  [properties]
  (->> properties
       (map #(str (name (key %)) (str colons " ") (val %)))
       (string/join "\n")))

(defn properties-ast?
  [block]
  (and
   (vector? block)
   (contains? #{"Property_Drawer" "Properties"}
              (first block))))

;; Configuration and fns for older, file graph properties
;; =============

(defn valid-property-name?
  [s]
  {:pre [(string? s)]}
  (and (gp-util/valid-edn-keyword? s)
       (not (re-find #"[\"|^|(|)|{|}]+" s))
       ;; Disallow tags as property names
       (not (re-find #"^:#" s))))

;; Built-in properties are properties that logseq uses for its features. Most of
;; these properties are hidden from the user but a few like the editable ones
;; are visible for the user to edit.

(def built-in-extended-properties (atom #{}))
(defn register-built-in-properties
  [props]
  (reset! built-in-extended-properties (set/union @built-in-extended-properties props)))

(def editable-linkable-built-in-properties
  "Properties used by logseq that user can edit and that can have linkable property values"
  #{:alias :aliases :tags})

;; file based graphs only (or maybe not for backward compatibility with markdown tables)
(def editable-view-and-table-properties
  "Properties used by view and table component"
  #{;; view props
    :logseq.color
    ;; table props
    :logseq.table.version :logseq.table.compact :logseq.table.headers :logseq.table.hover
    :logseq.table.borders :logseq.table.stripes :logseq.table.max-width})

(defn editable-built-in-properties
  "Properties used by logseq that user can edit"
  []
  (set/union #{:title :icon :template :template-including-parent :public :filters :exclude-from-graph-view
               :logseq.query/nlp-date
               ;; org-mode only
               :macro :filetags}
             editable-linkable-built-in-properties
             editable-view-and-table-properties))

(defn hidden-built-in-properties
  "Properties used by logseq that user can't edit or see"
  []
  (set/union
   #{:custom-id :background_color :created_at :last_modified_at ; backward compatibility only
     :id :background-color :heading :collapsed
     :created-at :updated-at :last-modified-at
     :query-table :query-properties :query-sort-by :query-sort-desc :ls-type
     :hl-type :hl-page :hl-stamp :hl-color :logseq.macro-name :logseq.macro-arguments
     :logseq.order-list-type :logseq.tldraw.page :logseq.tldraw.shape
     ; task markers
     :todo :doing :now :later :done}
   @built-in-extended-properties))

(def built-in-property-types
  "Types for built-in properties. Built-in properties whose values are to be
  parsed by gp-text/parse-non-string-property-value should be added here"
  {:template-including-parent :boolean
   :public :boolean
   :exclude-from-graph-view :boolean
   :logseq.query/nlp-date :boolean
   :heading :boolean                    ; FIXME: or integer
   :collapsed :boolean
   :created-at :integer
   :created_at :integer
   :updated-at :integer
   :last-modified-at :integer
   :last_modified_at :integer
   :query-table :boolean
   :query-sort-desc :boolean
   :hl-page :integer
   :hl-stamp :integer
   :todo :integer
   :doing :integer
   :now :integer
   :later :integer
   :done :integer})

(assert (set/subset? (set (keys built-in-property-types))
                     (set/union (hidden-built-in-properties)
                                (editable-built-in-properties)))
        "Keys of built-in-property-types must be valid built-in properties")

(defn unparsed-built-in-properties
  "Properties whose values will not be parsed by gp-text/parse-property"
  []
  (set/difference (set/union (hidden-built-in-properties)
                             (editable-built-in-properties))
                  ;; Most of these need to be auto-parsed as integers so exclude
                  ;; them until we have ones that must be unparsed
                  @built-in-extended-properties
                  ;; Refs need to be parsed
                  editable-linkable-built-in-properties
                  ;; All these should be parsed by gp-text/parse-non-string-property-value
                  (set (keys built-in-property-types))))


(defonce properties-start ":PROPERTIES:")
(defonce properties-end ":END:")
(defonce properties-end-pattern
  (re-pattern (gstring/format "%s[\t\r ]*\n|(%s\\s*$)" properties-end properties-end)))

(defn contains-properties?
  [content]
  (when content
    (and (string/includes? content properties-start)
         (re-find properties-end-pattern content))))

(defn ->new-properties
  "New syntax: key:: value"
  [content]
  (if (contains-properties? content)
    (let [lines (string/split-lines content)
          start-idx (.indexOf lines properties-start)
          end-idx (.indexOf lines properties-end)]
      (if (and (>= start-idx 0) (> end-idx 0) (> end-idx start-idx))
        (let [before (subvec lines 0 start-idx)
              middle (->> (subvec lines (inc start-idx) end-idx)
                          (map (fn [text]
                                 (let [[k v] (gp-util/split-first ":" (subs text 1))]
                                   (if (and k v)
                                     (let [k (string/replace k "_" "-")
                                           compare-k (keyword (string/lower-case k))
                                           k (if (contains? #{:id :custom_id :custom-id} compare-k) "id" k)
                                           k (if (contains? #{:last-modified-at} compare-k) "updated-at" k)]
                                       (str k colons " " (string/trim v)))
                                     text)))))
              after (subvec lines (inc end-idx))
              lines (concat before middle after)]
          (string/join "\n" lines))
        content))
    content))

;; Configuration and fns for db graph properties
;; =============

;; FIXME: no support for built-in-extended-properties
(def db-built-in-properties
  "Map of built in properties for db graphs. Each property has a config map with
  the following keys:
   * :schema - Property's schema. Required key
   * :original-name - Property's :block/original-name
   * :attribute - Property that is saved to a datascript attribute outside of :block/properties"
  {:alias {:original-name "Alias"
           :attribute :block/alias
           :schema {:type :page
                    :cardinality :many}}
   :tags {:original-name "Tags"
          :attribute :block/tags
          :schema {:type :page
                   :cardinality :many}}
   :background-color {:schema {:type :default}}
   :heading {:schema {:type :any}}      ; number (1-6) or boolean for auto heading
   :query-table {:schema {:type :checkbox}}
   ;; query-properties is a coll of property uuids and keywords where keywords are special frontend properties
   :query-properties {:schema {:type :coll}}
   :query-sort-by {:schema {:type :checkbox}}
   :query-sort-desc {:schema {:type :checkbox}}
   :logseq.query/nlp-date {:schema {:type :checkbox}}
   :ls-type {:schema {:type :keyword}}
   :hl-type {:schema {:type :keyword}}
   :hl-page {:schema {:type :number}}
   :hl-stamp {:schema {:type :number}}
   :hl-color {:schema {:type :default}}
   :logseq.macro-name {:schema {:type :default}}
   :logseq.macro-arguments {:schema {:type :default}}
   :logseq.order-list-type {:schema {:type :checkbox}}
   :logseq.tldraw.page {:schema {:type :map}}
   :logseq.tldraw.shape {:schema {:type :map}}
   :icon {:original-name "Icon"
          :schema {:type :map}}
   :public {:schema {:type :checkbox}}
   :filters {:schema {:type :map}}
   :exclude-from-graph-view {:schema {:type :checkbox}}
   :created-in-property {:schema {:type :checkbox}}})

(def db-user-facing-built-in-properties
  "These are built-in properties that users can see and use"
  #{:alias :tags})

(defonce db-built-in-properties-keys
  (set (keys db-built-in-properties)))

(def db-hidden-built-in-properties
  (set/difference db-built-in-properties-keys db-user-facing-built-in-properties))

(defonce db-built-in-properties-keys-str
  (set (map name (keys db-built-in-properties))))

(defn db-valid-property-name?
  [s]
  {:pre [(string? s)]}
  ;; Disallow tags or page refs as they would create unreferenceable page names
  (not (re-find #"^(#|\[\[)" s)))
