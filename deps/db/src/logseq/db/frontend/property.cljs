(ns logseq.db.frontend.property
  "Property related fns for DB graphs and frontend/datascript usage"
  (:require [logseq.db.sqlite.util :as sqlite-util]
            [datascript.core :as d]
            [logseq.common.util :as common-util]
            [clojure.string :as string]))

(def first-stage-properties
  #{:logseq.property/built-in? :logseq.property/created-from-property})

(def ^:large-vars/data-var built-in-properties*
  "Map of built in properties for db graphs with their :db/ident as keys.
   Each property has a config map with the following keys:
   * :schema - Property's schema. Required key. Has the following common keys:
     * :type - Property type
     * :cardinality - property cardinality. Default to one/single cardinality if not set
     * :hide? - Boolean which hides property when set on a block
     * :public? - Boolean which allows property to be used by user e.g. add and remove property to blocks/pages
   * :original-name - Property's :block/original-name
   * :name - Property's :block/name as a keyword. If none given, one is derived from the db/ident
   * :attribute - Property keyword that is saved to a datascript attribute outside of :block/properties
   * :closed-values - Vec of closed-value maps for properties with choices. Map
     has keys :value, :db-ident, :uuid and :icon
   * :db-ident - Keyword to set :db/ident and give property unique id in db"
  {:logseq.property/alias {:original-name "Alias"
                           :attribute :block/alias
                           :schema {:type :page
                                    :cardinality :many
                                    :public? true}}
   :logseq.property/tags {:original-name "Tags"
                          :attribute :block/tags
                          :schema {:type :page
                                   :cardinality :many
                                   :public? true
                                   :classes #{:logseq.class}}}
   :logseq.property/pagetags {:original-name "pageTags"
                              :schema {:type :page
                                       :public? true
                                       :cardinality :many}}
   :logseq.property/background-color {:schema {:type :default :hide? true}}
   :logseq.property/background-image {:schema {:type :default :hide? true :public? true}}
   ;; number (1-6) or boolean for auto heading
   :logseq.property/heading {:schema {:type :any :hide? true}}
   :logseq.property/created-from-block    {:schema {:type :uuid}}
   :logseq.property/created-from-property {:schema {:type :uuid}}
   :logseq.property/created-from-template {:schema {:type :uuid}}
   :logseq.property/source-page-id        {:schema {:type :uuid}}
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
   :logseq.property/macro-name {:name :logseq.macro-name
                                :schema {:type :default}}
   :logseq.property/macro-arguments {:name :logseq.macro-arguments
                                     :schema {:type :coll}}
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
                                   :schema {:type :number :hide? true :public? true}}
   :logseq.property.table/compact {:name :logseq.table.compact
                                   :schema {:type :checkbox :hide? true :public? true}}
   :logseq.property.table/headers
   {:name :logseq.table.headers
    :schema
    {:type :default :hide? true :public? true}
    :closed-values
    (mapv #(hash-map :db-ident (keyword "logseq.property.table" (str "headers." %))
                     :value %
                     :uuid (random-uuid))
          ["uppercase" "capitalize" "capitalize-first" "lowercase"])}
   :logseq.property.table/hover
   {:name :logseq.table.hover
    :schema
    {:type :default :hide? true :public? true}
    :closed-values
    (mapv #(hash-map :db-ident (keyword "logseq.property.table" (str "hover." %))
                     :value %
                     :uuid (random-uuid))
          ["row" "col" "both" "none"])}
   :logseq.property.table/borders {:name :logseq.table.borders
                                   :schema {:type :checkbox :hide? true :public? true}}
   :logseq.property.table/stripes {:name :logseq.table.stripes
                                   :schema {:type :checkbox :hide? true :public? true}}
   :logseq.property.table/max-width {:name :logseq.table.max-width
                                     :schema {:type :number :hide? true :public? true}}

   :logseq.property/icon {:original-name "Icon"
                          :schema {:type :map}}
   :logseq.property/public {:schema {:type :checkbox :hide? true}}
   :logseq.property/filters {:schema {:type :map}}
   :logseq.property/exclude-from-graph-view {:schema {:type :checkbox :hide? true :public? true}}})

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

(defn valid-property-name?
  [s]
  {:pre [(string? s)]}
  ;; Disallow tags or page refs as they would create unreferenceable page names
  (not (re-find #"^(#|\[\[)" s)))

(defn lookup
  "Get the value of coll's (a map) `key`. For file and db graphs"
  [repo db coll key]
  (when db
    (let [property-name (if (keyword? key)
                          (name key)
                          key)]
      (if (sqlite-util/db-based-graph? repo)
        (when-let [property (d/entity db [:block/name (common-util/page-name-sanity-lc property-name)])]
          (get coll (:block/uuid property)))
        (get coll key)))))

(defn get-block-property-value
  "Get the value of block's property `key`"
  [repo db block key]
  (when db
    (let [block (or (d/entity db (:db/id block)) block)]
      (when-let [properties (:block/properties block)]
        (lookup repo db properties key)))))

(defn get-pid
  "Get a built-in property's id (name or uuid) given its db-ident. Use when it can be a file or db graph.
   Use db-pu/get-built-in-property-uuid if just a db graph"
  [repo db db-ident]
  (if (sqlite-util/db-based-graph? repo)
    (:block/uuid (d/entity db db-ident))
    (get-in built-in-properties [db-ident :name])))

(defn get-property
  "Get a property given its unsanitized name"
  [db property-name]
  (d/entity db [:block/name (common-util/page-name-sanity-lc (name property-name))]))

(defn shape-block?
  [repo db block]
  (= :whiteboard-shape (get-block-property-value repo db block :ls-type)))

(defn get-built-in
  "Gets a built-in page/class/property/X by its :db/ident"
  [db db-ident]
  (d/entity db db-ident))

(defn get-by-ident-or-name
  "Gets a property by ident or name"
  [db ident-or-name]
  (if (and (keyword? ident-or-name) (namespace ident-or-name))
    (get-built-in db ident-or-name)
    (d/entity db [:block/name (common-util/page-name-sanity-lc (name ident-or-name))])))

(defn get-closed-property-values
  [db ident-or-name]
  (when-let [property (get-by-ident-or-name db ident-or-name)]
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