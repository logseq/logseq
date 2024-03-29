(ns logseq.db.frontend.property
  "Property related fns for DB graphs and frontend/datascript usage"
  (:require [clojure.set :as set]
            [logseq.db.sqlite.util :as sqlite-util]
            [datascript.core :as d]
            [logseq.common.util :as common-util]
            [clojure.string :as string]))

;; FIXME: no support for built-in-extended-properties
(def ^:large-vars/data-var built-in-properties
  "Map of built in properties for db graphs. Each property has a config map with
  the following keys:
   * :schema - Property's schema. Required key
   * :original-name - Property's :block/original-name
   * :attribute - Property keyword that is saved to a datascript attribute outside of :block/properties
   * :visible - Boolean to indicate user can see and use this property"
  {:alias {:original-name "Alias"
           :attribute :block/alias
           :db-ident :block/alias
           :visible true
           :schema {:type :page
                    :cardinality :many}}
   :tags {:original-name "Tags"
          :attribute :block/tags
          :db-ident :block/tags
          :visible true
          :schema {:type :page
                   :cardinality :many
                   :classes #{:logseq.class}}}
   :pagetags {:original-name "pageTags"
              :visible true
              :schema {:type :page
                       :cardinality :many}}
   :background-color {:schema {:type :default :hide? true}}
   :background-image {:schema {:type :default :hide? true}
                      :visible true}
   :heading {:schema {:type :any :hide? true}}      ; number (1-6) or boolean for auto heading
   :created-from-block    {:schema {:db-attr-type :ref
                                    :type :number}}
   :created-from-property {:schema {:db-attr-type :ref
                                    :type :number}}
   :created-from-template {:schema {:db-attr-type :ref
                                    :type :number}}
   :source-page-id        {:schema {:type :ref}}
   :built-in?             {:schema {:type :checkbox}}
   :hide-properties?      {:schema {:type :checkbox}}
   :query-table {:schema {:type :checkbox}}
   ;; query-properties is a coll of property uuids and keywords where keywords are special frontend keywords
   :query-properties {:schema {:type :coll}}
   ;; query-sort-by is either a property uuid or a keyword where keyword is a special frontend keyword
   :query-sort-by {:schema {:type :any}}
   :query-sort-desc {:schema {:type :checkbox}}
   :ls-type {:schema {:type :keyword}}
   :hl-type {:schema {:type :keyword}}
   :hl-page {:schema {:type :number}}
   :hl-stamp {:schema {:type :number}}
   :hl-color {:schema {:type :default}}
   :logseq.macro-name {:schema {:type :default}}
   :logseq.macro-arguments {:schema {:type :coll}}
   :logseq.order-list-type {:schema {:type :default}}
   :logseq.tldraw.page {:schema {:type :map}}
   :logseq.tldraw.shape {:schema {:type :map}}

   ;; Task props
   :status {:db-ident :logseq.property/status
            :original-name "Status"
            :schema
            {:type :default}
            :closed-values
            (mapv (fn [[db-ident value icon]]
                    {:db-ident db-ident
                     :value value
                     :uuid (random-uuid)
                     :icon {:type :tabler-icon :id icon :name icon}})
                  [[:logseq.property/status.backlog "Backlog" "Backlog"]
                   [:logseq.property/status.todo "Todo" "Todo"]
                   [:logseq.property/status.doing "Doing" "InProgress50"]
                   [:logseq.property/status.in-review "In Review" "InReview"]
                   [:logseq.property/status.done "Done" "Done"]
                   [:logseq.property/status.canceled "Canceled" "Cancelled"]])
            :visible true}
   :priority {:db-ident :logseq.property/priority
              :original-name "Priority"
              :schema
              {:type :default}
              :closed-values
              (mapv (fn [[db-ident value]]
                      {:db-ident db-ident
                       :value value
                       :uuid (random-uuid)})
                    [[:logseq.property/priority.urgent "Urgent"]
                     [:logseq.property/priority.high "High"]
                     [:logseq.property/priority.medium "Medium"]
                     [:logseq.property/priority.low "Low"]])
              :visible true}
   :scheduled {:db-ident :logseq.property/scheduled
               :original-name "Scheduled"
               :schema {:db-attr-type :ref
                        :type :date}
               :visible true}
   :deadline {:db-ident :logseq.property/deadline
              :original-name "Deadline"
              :schema {:db-attr-type :ref
                       :type :date}
              :visible true}

   ;; TODO: Add more props :Assignee, :Estimate, :Cycle, :Project

   ;; color props
   :logseq.color {:schema
                  {:type :default :hide? true}
                  :closed-values
                  (mapv #(hash-map :db-ident (keyword "logseq.property" (str "color." %))
                                   :value %
                                   :uuid (random-uuid))
                        ;; Stringified version of frontend.colors/COLORS. Too basic to couple
                        ["tomato" "red" "crimson" "pink" "plum" "purple" "violet" "indigo" "blue" "cyan" "teal" "green" "grass" "orange" "brown"])
                  :visible true}
   ;; table-v2 props
   :logseq.table.version {:schema {:type :number :hide? true}
                          :visible true}
   :logseq.table.compact {:schema {:type :checkbox :hide? true}
                          :visible true}
   :logseq.table.headers {:schema
                          {:type :default :hide? true}
                          :closed-values
                          (mapv #(hash-map :db-ident (keyword "logseq.property.table" (str "headers." %))
                                           :value %
                                           :uuid (random-uuid))
                                ["uppercase" "capitalize" "capitalize-first" "lowercase"])
                          :visible true}
   :logseq.table.hover {:schema
                        {:type :default :hide? true}
                        :closed-values
                        (mapv #(hash-map :db-ident (keyword "logseq.property.table" (str "hover." %))
                                         :value %
                                         :uuid (random-uuid))
                              ["row" "col" "both" "none"])
                        :visible true}
   :logseq.table.borders {:schema {:type :checkbox :hide? true}
                          :visible true}
   :logseq.table.stripes {:schema {:type :checkbox :hide? true}
                          :visible true}
   :logseq.table.max-width {:schema {:type :number :hide? true}
                            :visible true}

   :icon {:original-name "Icon"
          :schema {:type :map}}
   :public {:schema {:type :checkbox :hide? true}
            :visible true}
   :filters {:schema {:type :map}}
   :exclude-from-graph-view {:schema {:type :checkbox :hide? true}
                             :visible true}})

(def visible-built-in-properties
  "These are built-in properties that users can see and use"
  (set (keep (fn [[k v]] (when (:visible v) k)) built-in-properties)))

(defonce built-in-properties-keys
  (set (keys built-in-properties)))

(def hidden-built-in-properties
  (set/difference built-in-properties-keys visible-built-in-properties))

(defonce built-in-properties-keys-str
  (set (map name (keys built-in-properties))))

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

(defn name->db-ident
  "Converts a built-in property's keyword name to its :db/ident equivalent.
  Legacy property names that had pseudo-namespacing are converted to their new
  format e.g. :logseq.table.headers -> :logseq.property.table/headers"
  [legacy-name]
  ;; Migrate legacy names that have logseq.* style names but no namespace
  (if-let [[_ additional-ns prop-name] (re-matches  #"logseq(.*)\.([^.]+)" (name legacy-name))]
    (keyword (str "logseq.property" additional-ns) prop-name)
    (keyword "logseq.property" (name legacy-name))))

(defn get-pid
  "Get a property's id (name or uuid) given its name. For file and db graphs"
  [repo db property-name]
  (if (sqlite-util/db-based-graph? repo)
    (:block/uuid (d/entity db [:block/name (common-util/page-name-sanity-lc (name property-name))]))
    property-name))

(defn shape-block?
  [repo db block]
  (= :whiteboard-shape (get-block-property-value repo db block :ls-type)))

(defn get-by-ident-or-name
  "Gets a property by ident or name"
  [db ident-or-name]
  (if (and (keyword? ident-or-name) (namespace ident-or-name))
    (d/entity db ident-or-name)
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

(defn property?
  [k]
  (let [k-name (name k)]
    (or (string/starts-with? k-name "logseq.property")
        (string/starts-with? k-name "user.property"))))

;; TODO: db ident should obey clojure's rules for keywords
(defn get-db-ident-from-name
  [property-name]
  (let [n (-> (string/lower-case property-name)
              (string/replace #"^:" "")
              (string/replace " " "_")
              (string/trim))]
    (when-not (string/blank? n)
      (->
       (str "user.property/" n)
       keyword))))
