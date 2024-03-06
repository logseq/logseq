(ns logseq.db.frontend.property
  "Property related fns for DB graphs and frontend/datascript usage"
  (:require [clojure.set :as set]
            [logseq.db.sqlite.util :as sqlite-util]
            [datascript.core :as d]
            [logseq.common.util :as common-util]))

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
           :visible true
           :schema {:type :page
                    :cardinality :many}}
   :tags {:db-ident :tags
          :original-name "Tags"
          :attribute :block/tags
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
   :status {:db-ident :task/status
            :original-name "Status"
            :schema
            {:type :default}
            :closed-values
            (mapv (fn [[status icon]]
                    {:value status
                     :uuid (random-uuid)
                     :icon {:type :tabler-icon :id icon :name icon}})
                  [["Backlog" "Backlog"] ["Todo" "Todo"] ["Doing" "InProgress50"]
                   ["In Review" "InReview"] ["Done" "Done"] ["Canceled" "Cancelled"]])
            :visible true}
   :priority {:db-ident :task/priority
              :original-name "Priority"
              :schema
              {:type :default}
              :closed-values
              (mapv #(hash-map :value % :uuid (random-uuid))
                    ["Urgent" "High" "Medium" "Low"])
              :visible true}
   :scheduled {:db-ident :task/scheduled
               :original-name "Scheduled"
               :schema {:type :date}
               :visible true}
   :deadline {:db-ident :task/deadline
              :original-name "Deadline"
              :schema {:type :date}
              :visible true}

   ;; TODO: Add more props :Assignee, :Estimate, :Cycle, :Project

   ;; color props
   :logseq.color {:schema
                  {:type :default :hide? true}
                  :closed-values
                  (mapv #(hash-map :value % :uuid (random-uuid))
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
                          (mapv #(hash-map :value % :uuid (random-uuid))
                                ["uppercase" "capitalize" "capitalize-first" "lowercase"])
                          :visible true}
   :logseq.table.hover {:schema
                        {:type :default :hide? true}
                        :closed-values
                        (mapv #(hash-map :value % :uuid (random-uuid))
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

(defn get-pid
  "Get a property's id (name or uuid) given its name. For file and db graphs"
  [repo db property-name]
  (if (sqlite-util/db-based-graph? repo)
    (:block/uuid (d/entity db [:block/name (common-util/page-name-sanity-lc (name property-name))]))
    property-name))

(defn get-property
  "Get a property given its unsanitized name"
  [db property-name]
  (d/entity db [:block/name (common-util/page-name-sanity-lc (name property-name))]))

(defn shape-block?
  [repo db block]
  (= :whiteboard-shape (get-block-property-value repo db block :ls-type)))

(defn get-closed-property-values
  [db property-name]
  (when-let [property (get-property db property-name)]
    (get-in property [:block/schema :values])))

(defn get-closed-value-entity-by-name
  [db property-name value-name]
  (let [values (get-closed-property-values db property-name)]
    (some (fn [id]
            (let [e (d/entity db [:block/uuid id])]
              (when (= (get-in e [:block/schema :value]) value-name)
                e))) values)))
