(ns logseq.db.frontend.property
  "Property related fns for DB graphs and frontend/datascript usage"
  (:require [datascript.core :as d]
            [clojure.string :as string]))

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
  {:block/alias           {:original-name "Alias"
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
                                   :classes #{:logseq.class}}}
   :logseq.property/page-tags {:original-name "pageTags"
                               :schema {:type :page
                                        :public? true
                                        :view-context :page
                                        :cardinality :many}}
   :logseq.property/background-color {:schema {:type :default :hide? true}}
   :logseq.property/background-image {:schema
                                      {:type :default
                                       :hide? true
                                       :view-context :block
                                       :public? true}}
   ;; number (1-6) or boolean for auto heading
   :logseq.property/heading {:schema {:type :any :hide? true}}
   :logseq.property/created-from-block    {:schema {:type :entity}}
   :logseq.property/created-from-property {:schema {:type :entity}}
   :logseq.property/created-from-template {:schema {:type :entity}}
   :logseq.property/source-page           {:schema {:type :entity}}
   :logseq.property/built-in?             {:schema {:type :checkbox}}
   :logseq.property/hide-properties?      {:schema {:type :checkbox}}
   :logseq.property/query-table {:schema {:type :checkbox}}
   ;; query-properties is a coll of property uuids and keywords where keywords are special frontend keywords
   :logseq.property/query-properties {:schema {:type :coll}}
   ;; query-sort-by is either a property uuid or a keyword where keyword is a special frontend keyword
   :logseq.property/query-sort-by {:schema {:type :any}}
   :logseq.property/query-sort-desc {:schema {:type :checkbox}}
   :logseq.property/ls-type {:schema {:type :keyword}}
   :logseq.property/hl-type {:schema {:type :keyword}}
   :logseq.property/hl-page {:schema {:type :number}}
   :logseq.property/hl-stamp {:schema {:type :number}}
   :logseq.property/hl-color {:schema {:type :default}}
   :logseq.property/order-list-type {:name :logseq.order-list-type
                                     :schema {:type :default}}
   :logseq.property.tldraw/page {:name :logseq.tldraw.page
                                 :schema {:type :map}}
   :logseq.property.tldraw/shape {:name :logseq.tldraw.shape
                                  :schema {:type :map}}

   ;; Task props
   :logseq.task/status
   {:original-name "Status"
    :schema
    {:type :default
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
    {:type :default
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
    {:type :default :hide? true :public? true}
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
    {:type :default :hide? true :public? true :view-context :block}
    :closed-values
    (mapv #(hash-map :db-ident (keyword "logseq.property.table" (str "headers." %))
                     :value %
                     :uuid (random-uuid))
          ["uppercase" "capitalize" "capitalize-first" "lowercase"])}
   :logseq.property.table/hover
   {:name :logseq.table.hover
    :schema
    {:type :default :hide? true :public? true :view-context :block}
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
   :logseq.property/filters {:schema {:type :map}}
   :logseq.property/exclude-from-graph-view {:schema
                                             {:type :checkbox
                                              :hide? true
                                              :view-context :page
                                              :public? true}}})

(def built-in-properties
  (->> built-in-properties*
       (map (fn [[k v]]
              (assert (and (keyword? k) (namespace k)))
              [k
               ;; All built-ins must have a :name
               (if (:name v)
                 v
                 (assoc v :name (keyword (string/lower-case (name k)))))]))
       (into {})))

(def db-attribute-properties
  "Internal properties that are also db schema attributes"
  #{:block/alias :block/tags})

(assert (= db-attribute-properties
           (set (keep (fn [[k {:keys [attribute]}]] (when attribute k))
                      built-in-properties)))
        "All db attribute properties are configured in built-in-properties")

(def logseq-property-namespaces
  #{"logseq.property" "logseq.property.table" "logseq.property.tldraw"
    "logseq.task"})

(defn logseq-property?
  "Determines if keyword is a logseq property"
  [kw]
  (contains? logseq-property-namespaces (namespace kw)))

(def user-property-namespaces
  #{"user.property"})

(defn property?
  "Determines if ident kw is a property"
  [k]
  (let [k-name (namespace k)]
    (and k-name
         (or (contains? logseq-property-namespaces k-name)
             (contains? user-property-namespaces k-name)))))

;; Helper fns
;; ==========

(defn properties
  "Fetch all properties of entity like :block/properties used to do.
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

(defn get-pid
  "Get a built-in property's id (keyword name for file graph and db-ident for db
  graph) given its db-ident. No need to use this fn in a db graph only context"
  [repo db-ident]
  ;; FIXME: Use db-based-graph? when this fn moves to another ns
  (if (string/starts-with? repo "logseq_db_")
    db-ident
    (get-in built-in-properties [db-ident :name])))

(defn lookup
  "Get the value of coll by db-ident. For file and db graphs"
  [repo coll db-ident]
  (get coll (get-pid repo db-ident)))

(defn get-block-property-value
  "Get the value of built-in block's property by its db-ident"
  [repo db block db-ident]
  (when db
    (let [block (or (d/entity db (:db/id block)) block)
          ;; FIXME: Use db-based-graph? when this fn moves to another ns
          properties' (if (string/starts-with? repo "logseq_db_")
                        (properties block)
                        (:block/properties block))]
      (lookup repo properties' db-ident))))

(defn shape-block?
  [repo db block]
  (= :whiteboard-shape (get-block-property-value repo db block :logseq.property/ls-type)))

(defn get-closed-property-values
  [db property-id]
  (when-let [property (d/entity db property-id)]
    (get-in property [:block/schema :values])))

(defn closed-value-name
  "Gets name of closed value given closed value ent/map. Works for all closed value types including pages"
  [ent]
  (or (:block/original-name ent) (get-in ent [:block/schema :value])))

(defn get-closed-value-entity-by-name
  "Given a property, finds one of its closed values by name or nil if none
  found. Works for all closed value types"
  [db db-ident value-name]
  (let [values (get-closed-property-values db db-ident)]
    (some (fn [id]
            (let [e (d/entity db [:block/uuid id])]
              (when (= (closed-value-name e) value-name)
                e))) values)))

;; TODO: db ident should obey clojure's rules for keywords
(defn user-property-ident-from-name
  "Makes a user property :db/ident from a name by sanitizing the given name"
  [property-name]
  (let [n (-> (string/lower-case property-name)
              (string/replace #"^:\s*" "")
              (string/replace #"\s*:\s*$" "")
              (string/replace " " "-")
              (string/replace "#" "")
              (string/trim))]
    (assert (seq n) "name is not empty")
    (keyword "user.property" n)))

(defn get-class-ordered-properties
  [class-entity]
  (let [properties (map :db/ident (:class/schema.properties class-entity))
        ordered (get-in class-entity [:block/schema :properties])]
    (concat ordered (remove (set ordered) properties))))
