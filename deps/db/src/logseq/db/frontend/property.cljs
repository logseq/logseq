(ns logseq.db.frontend.property
  "Property related fns for DB graphs and frontend/datascript usage"
  (:require [datascript.core :as d]
            [clojure.string :as string]
            [flatland.ordered.map :refer [ordered-map]]))

;; Main property vars
;; ==================

(def ^:large-vars/data-var built-in-properties*
  "Map of built in properties for db graphs with their :db/ident as keys.
   Each property has a config map with the following keys:
   * :schema - Property's schema. Required key. Has the following common keys:
     * :type - Property type
     * :cardinality - property cardinality. Default to one/single cardinality if not set
     * :hide? - Boolean which hides property when set on a block
     * :public? - Boolean which allows property to be used by user e.g. add and remove property to blocks/pages
     * :view-context - Keyword to indicate which view contexts a property can be
       seen in when :public? is set. Valid values are :page and :block. Property can
       be viewed in any context if not set
   * :original-name - Property's :block/original-name
   * :name - Property's :block/name as a keyword. If none given, one is derived from the db/ident
   * :attribute - Property keyword that is saved to a datascript attribute outside of :block/properties
   * :closed-values - Vec of closed-value maps for properties with choices. Map
     has keys :value, :db-ident, :uuid and :icon"
  (ordered-map
   :block/alias           {:original-name "Alias"
                           :attribute :block/alias
                           :schema {:type :page
                                    :cardinality :many
                                    :view-context :page
                                    :public? true}}
   :block/tags           {:original-name "Tags"
                          :attribute :block/tags
                          :schema {:type :page
                                   :cardinality :many
                                   :public? true
                                   :classes #{:logseq.class/base}}}
   :logseq.property/page-tags {:original-name "pageTags"
                               :schema {:type :page
                                        :public? true
                                        :view-context :page
                                        :cardinality :many}}
   :logseq.property/background-color {:schema {:type :string :hide? true}}
   :logseq.property/background-image {:schema
                                      {:type :string
                                       :view-context :block
                                       :public? true}}
   ;; number (1-6) or boolean for auto heading
   :logseq.property/heading {:schema {:type :any :hide? true}}
   :logseq.property/created-from-property {:schema {:type :entity
                                                    :hide? true}}
   :logseq.property/created-from-template {:schema {:type :entity
                                                    :hide? true}}
   :logseq.property/source-page           {:schema {:type :entity
                                                    :hide? true}}
   :logseq.property/built-in?             {:schema {:type :checkbox
                                                    :hide? true}}
   :logseq.property/hide-properties?      {:schema {:type :checkbox
                                                    :hide? true}}
   :logseq.property/query-table {:schema {:type :checkbox
                                          :hide? true}}
   ;; query-properties is a coll of property uuids and keywords where keywords are special frontend keywords
   :logseq.property/query-properties {:schema {:type :coll
                                               :hide? true}}
   ;; query-sort-by is either a property uuid or a keyword where keyword is a special frontend keyword
   :logseq.property/query-sort-by {:schema {:type :any
                                            :hide? true}}
   :logseq.property/query-sort-desc {:schema {:type :checkbox
                                              :hide? true}}
   :logseq.property/ls-type {:schema {:type :keyword
                                      :hide? true}}
   :logseq.property/hl-type {:schema {:type :keyword
                                      :hide? true}}
   :logseq.property/hl-page {:schema {:type :number
                                      :hide? true}}
   :logseq.property/hl-stamp {:schema {:type :number
                                       :hide? true}}
   :logseq.property/hl-color {:schema {:type :string
                                       :hide? true}}
   :logseq.property/order-list-type {:name :logseq.order-list-type
                                     :schema {:type :string
                                              :hide? true}}
   :logseq.property.tldraw/page {:name :logseq.tldraw.page
                                 :schema {:type :map
                                          :hide? true}}
   :logseq.property.tldraw/shape {:name :logseq.tldraw.shape
                                  :schema {:type :map
                                           :hide? true}}

   ;; Task props
   :logseq.task/status
   {:original-name "Status"
    :schema
    {:type :string
     :public? true}
    :closed-values
    (mapv (fn [[db-ident value icon]]
            {:db-ident db-ident
             :value value
             :uuid (random-uuid)
             :icon {:type :tabler-icon :id icon :name icon}})
          [[:logseq.task/status.backlog "Backlog" "Backlog"]
           [:logseq.task/status.todo "Todo" "Todo"]
           [:logseq.task/status.doing "Doing" "InProgress50"]
           [:logseq.task/status.in-review "In Review" "InReview"]
           [:logseq.task/status.done "Done" "Done"]
           [:logseq.task/status.canceled "Canceled" "Cancelled"]])}
   :logseq.task/priority
   {:original-name "Priority"
    :schema
    {:type :string
     :public? true}
    :closed-values
    (mapv (fn [[db-ident value]]
            {:db-ident db-ident
             :value value
             :uuid (random-uuid)})
          [[:logseq.task/priority.urgent "Urgent"]
           [:logseq.task/priority.high "High"]
           [:logseq.task/priority.medium "Medium"]
           [:logseq.task/priority.low "Low"]])}
   :logseq.task/scheduled
   {:original-name "Scheduled"
    :schema {:type :date
             :public? true}}
   :logseq.task/deadline
   {:original-name "Deadline"
    :schema {:type :date
             :public? true}}

   ;; TODO: Add more props :Assignee, :Estimate, :Cycle, :Project

   ;; color props
   :logseq.property/color
   {:name :logseq.color
    :schema
    {:type :string :hide? true :public? true}
    :closed-values
    (mapv #(hash-map :db-ident (keyword "logseq.property" (str "color." %))
                     :value %
                     :uuid (random-uuid))
          ;; Stringified version of frontend.colors/COLORS. Too basic to couple
          ["tomato" "red" "crimson" "pink" "plum" "purple" "violet" "indigo" "blue" "cyan" "teal" "green" "grass" "orange" "brown"])}
   ;; table-v2 props
   :logseq.property.table/version {:name :logseq.table.version
                                   :schema {:type :number :hide? true :public? true :view-context :block}}
   :logseq.property.table/compact {:name :logseq.table.compact
                                   :schema {:type :checkbox :hide? true :public? true :view-context :block}}
   :logseq.property.table/headers
   {:name :logseq.table.headers
    :schema
    {:type :string :hide? true :public? true :view-context :block}
    :closed-values
    (mapv #(hash-map :db-ident (keyword "logseq.property.table" (str "headers." %))
                     :value %
                     :uuid (random-uuid))
          ["uppercase" "capitalize" "capitalize-first" "lowercase"])}
   :logseq.property.table/hover
   {:name :logseq.table.hover
    :schema
    {:type :string :hide? true :public? true :view-context :block}
    :closed-values
    (mapv #(hash-map :db-ident (keyword "logseq.property.table" (str "hover." %))
                     :value %
                     :uuid (random-uuid))
          ["row" "col" "both" "none"])}
   :logseq.property.table/borders {:name :logseq.table.borders
                                   :schema {:type :checkbox :hide? true :public? true :view-context :block}}
   :logseq.property.table/stripes {:name :logseq.table.stripes
                                   :schema {:type :checkbox :hide? true :public? true :view-context :block}}
   :logseq.property.table/max-width {:name :logseq.table.max-width
                                     :schema {:type :number :hide? true :public? true :view-context :block}}

   :logseq.property/icon {:original-name "Icon"
                          :schema {:type :map}}
   :logseq.property/public {:schema
                            {:type :checkbox
                             :hide? true
                             :view-context :page
                             :public? true}}
   :logseq.property/filters {:schema {:type :map
                                      :hide? true}}
   :logseq.property/exclude-from-graph-view {:schema
                                             {:type :checkbox
                                              :hide? true
                                              :view-context :page
                                              :public? true}}
   :logseq.property.pdf/file
   {:schema {:type :string :hide? true :public? true :view-context :page}}
   :logseq.property.pdf/file-path
   {:schema {:type :string :hide? true :public? true :view-context :page}}))

(def built-in-properties
  (->> built-in-properties*
       (map (fn [[k v]]
              (assert (and (keyword? k) (namespace k)))
              [k
               ;; All built-ins must have a :name
               (if (:name v)
                 v
                 (assoc v :name (keyword (string/lower-case (name k)))))]))
       (into (ordered-map))))

(def db-attribute-properties
  "Internal properties that are also db schema attributes"
  #{:block/alias :block/tags})

(assert (= db-attribute-properties
           (set (keep (fn [[k {:keys [attribute]}]] (when attribute k))
                      built-in-properties)))
        "All db attribute properties are configured in built-in-properties")

(def logseq-property-namespaces
  #{"logseq.property" "logseq.property.table" "logseq.property.tldraw"
    "logseq.property.pdf" "logseq.task"})

(defn logseq-property?
  "Determines if keyword is a logseq property"
  [kw]
  (contains? logseq-property-namespaces (namespace kw)))

(defn user-property-namespace?
  "Determines if namespace string is a user property"
  [s]
  (string/includes? s ".property"))

(defn property?
  "Determines if ident kw is a property"
  [k]
  (let [k-name (namespace k)]
    (and k-name
         (or (contains? logseq-property-namespaces k-name)
             (user-property-namespace? k-name)
             (and (keyword? k) (contains? db-attribute-properties k))))))

;; Helper fns
;; ==========

(defn properties
  "Returns a block's properties as a map indexed by property's db-ident.
   Use this in deps because nbb can't use :block/properties from entity-plus"
  [e]
  (->> (into {} e)
       (filter (fn [[k _]] (property? k)))
       (into {})))

(defn valid-property-name?
  [s]
  {:pre [(string? s)]}
  ;; Disallow tags or page refs as they would create unreferenceable page names
  (not (re-find #"^(#|\[\[)" s)))

(defn get-closed-property-values
  [db property-id]
  (when-let [property (d/entity db property-id)]
    (:property/closed-values property)))

(defn closed-value-name
  "Gets name of closed value given closed value ent/map. Works for all closed value types including pages, blocks"
  [ent]
  (or (:block/original-name ent)
      (:block/content ent)))

(defn get-closed-value-entity-by-name
  "Given a property, finds one of its closed values by name or nil if none
  found. Works for all closed value types"
  [db db-ident value-name]
  (let [values (get-closed-property-values db db-ident)]
    (some (fn [e]
            (when (= (closed-value-name e) value-name)
              e)) values)))

;; TODO: db ident should obey clojure's rules for keywords
(defn create-db-ident-from-name
  "Creates a :db/ident by sanitizing the given name.

   NOTE: Only use this when creating a db-ident for a string name. Using this
   in read-only contexts like querying can result in db-ident conflicts"
  [user-namespace name-string]
  (let [n (-> name-string
              (string/replace #"(^:\s*|\s*:$)" "")
              (string/replace #"\s*:\s*$" "")
              (string/replace-first #"^\d+" "")
              (string/replace " " "-")
              (string/replace "#" "")
              (string/trim))]
    (assert (seq n) "name is not empty")
    (keyword user-namespace n)))

(defn create-user-property-ident-from-name
  "Creates a property :db/ident for a default user namespace"
  [property-name]
  (create-db-ident-from-name "user.property" property-name))

(defn get-class-ordered-properties
  [class-entity]
  (->> (:class/schema.properties class-entity)
       (sort-by :block/order)))

(defn property-created-block?
  "`block` has been created in a property and it's not a closed value."
  [block]
  (and (map? block)
       (:logseq.property/created-from-property block)
       (:block/page block)
       ;; not closed value
       (not (some? (:block/content block)))))

(defn many?
  [property]
  (= (:db/cardinality property) :db.cardinality/many))

(defn property-value-when-closed
  "Returns property value if the given entity is type 'closed value' or nil"
  [ent]
  (when (contains? (:block/type ent) "closed value")
    (:block/content ent)))
