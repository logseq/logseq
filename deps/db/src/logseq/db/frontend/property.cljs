(ns logseq.db.frontend.property
  "Property related fns for DB graphs and frontend/datascript usage"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [flatland.ordered.map :refer [ordered-map]]
            [logseq.common.defkeywords :refer [defkeywords]]
            [logseq.common.uuid :as common-uuid]
            [logseq.db.frontend.db-ident :as db-ident]
            [logseq.db.frontend.property.type :as db-property-type]))

;; Main property vars
;; ==================

(def ^:large-vars/data-var built-in-properties
  "Map of built in properties for db graphs with their :db/ident as keys.
   Each property has a config map with the following keys:
   TODO: Move some of these keys to :properties since :schema is a deprecated concept
   * :schema - Property's schema. Required key. Has the following common keys:
     * :type - Property type
     * :cardinality - property cardinality. Default to one/single cardinality if not set
     * :hide? - Boolean which hides property when set on a block or exported e.g. slides
     * :public? - Boolean which allows property to be used by user: add and remove property to blocks/pages
       and queryable via property and has-property rules
     * :view-context - Keyword to indicate which view contexts a property can be
       seen in when :public? is set. Valid values are :page, :block and :never. Property can
       be viewed in any context if not set
   * :title - Property's :block/title
   * :attribute - Property keyword that is saved to a datascript attribute outside of :block/properties
   * :queryable? - Boolean for whether property can be queried in the query builder
   * :closed-values - Vec of closed-value maps for properties with choices. Map
     has keys :value, :db-ident, :uuid and :icon
   * :rtc - submap for RTC configs. view docs by jumping to keyword definitions.
  "
  (apply
   ordered-map
   (defkeywords
     :logseq.property/type {:title "Property type"
                            :schema {:type :keyword
                                     :hide? true}}
     :logseq.property/hide? {:title "Hide this property"
                             :schema {:type :checkbox
                                      :hide? true}}
     :logseq.property/public? {:title "Property public?"
                               :schema {:type :checkbox
                                        :hide? true}}
     :logseq.property/view-context {:title "Property view context"
                                    :schema {:type :keyword
                                             :hide? true}}
     :logseq.property/ui-position {:title "Property position"
                                   :schema {:type :keyword
                                            :hide? true}}
     :logseq.property/classes
     {:title "Property classes"
      :schema {:type :entity
               :cardinality :many
               :public? false
               :hide? true}}
     :logseq.property/value
     {:title "Property value"
      :schema {:type :any
               :public? false
               :hide? true}}

     :block/alias          {:title "Alias"
                            :attribute :block/alias
                            :schema {:type :page
                                     :cardinality :many
                                     :view-context :page
                                     :public? true}
                            :queryable? true}
     :block/tags           {:title "Tags"
                            :attribute :block/tags
                            :schema {:type :class
                                     :cardinality :many
                                     :public? true}
                            :queryable? true}
     :block/parent         {:title "Node parent"
                            :attribute :block/parent
                            :schema {:type :entity
                                     :public? false
                                     :hide? true}}
     :block/order          {:title "Node order"
                            :attribute :block/order
                            :schema {:type :string
                                     :public? false
                                     :hide? true}}
     :block/collapsed?     {:title "Node collapsed?"
                            :attribute :block/collapsed?
                            :schema {:type :checkbox
                                     :public? false
                                     :hide? true}}
     :block/page           {:title "Node page"
                            :attribute :block/page
                            :schema {:type :entity
                                     :public? false
                                     :hide? true}}
     :block/refs           {:title "Node references"
                            :attribute :block/refs
                            :schema {:type :entity
                                     :cardinality :many
                                     :public? false
                                     :hide? true}}
     :block/path-refs      {:title "Node path references"
                            :attribute :block/path-refs
                            :schema {:type :entity
                                     :cardinality :many
                                     :public? false
                                     :hide? true}}
     :block/link           {:title "Node links to"
                            :attribute :block/link
                            :schema {:type :entity
                                     :public? false
                                     :hide? true}}
     :block/title          {:title "Node title"
                            :attribute :block/title
                            :schema {:type :string
                                     :public? false
                                     :hide? true}}
     :block/closed-value-property  {:title "Closed value property"
                                    :attribute :block/closed-value-property
                                    :schema {:type :entity
                                             :public? false
                                             :hide? true}}
     :block/created-at     {:title "Node created at"
                            :attribute :block/created-at
                            :schema {:type :datetime
                                     :public? false
                                     :hide? true}}
     :block/updated-at     {:title "Node updated at"
                            :attribute :block/updated-at
                            :schema {:type :datetime
                                     :public? false
                                     :hide? true}}
     :logseq.property.node/display-type {:title "Node Display Type"
                                         :schema {:type :keyword
                                                  :public? false
                                                  :hide? true
                                                  :view-context :block}
                                         :queryable? true}
     :logseq.property/description {:title "Description"
                                   :schema
                                   {:type :default
                                    :public? true}}
     :logseq.property.code/lang {:title "Code Mode"
                                 :schema {:type :string
                                          :public? false
                                          :hide? true
                                          :view-context :block}
                                 :queryable? true}
     :logseq.property/default-value {:title "Default value"
                                     :schema {:type :entity
                                              :public? false
                                              :hide? true
                                              :view-context :property}}
     :logseq.property/scalar-default-value {:title "Non ref type default value"
                                            :schema {:type :any
                                                     :public? false
                                                     :hide? true
                                                     :view-context :property}}
     :logseq.property.class/extends {:title "Extends"
                                     :schema {:type :class
                                              :cardinality :many
                                              :public? true
                                              :view-context :class}
                                     :queryable? true
                                     :properties
                                     {:logseq.property/description "This enables tags to inherit properties from other tags"}}
     :logseq.property.class/properties {:title "Tag Properties"
                                        :schema {:type :property
                                                 :cardinality :many
                                                 :public? true
                                                 :view-context :never}}
     :logseq.property/hide-empty-value {:title "Hide empty value"
                                        :schema {:type :checkbox
                                                 :public? true
                                                 :view-context :property}
                                        :properties
                                        {:logseq.property/description "Hides a property's value on any node when empty e.g. when a property appears on a node through a tag."}}
     :logseq.property.class/hide-from-node {:title "Hide from Node"
                                            :schema {:type :checkbox
                                                     :public? true
                                                     :view-context :class}}
     :logseq.property/query       {:title "Query"
                                   :schema {:type :default
                                            :public? true
                                            :hide? true
                                            :view-context :block}}
     :logseq.property/page-tags {:title "Page Tags"
                                 :schema {:type :page
                                          :public? true
                                          :view-context :page
                                          :cardinality :many}
                                 :properties
                                 {:logseq.property/description "Provides a way for a page to associate to another page i.e. backward compatible tagging."}}
     :logseq.property/background-color {:title "Background color"
                                        :schema {:type :default :hide? true}}
   ;; number (1-6) or boolean for auto heading
     :logseq.property/heading {:title "Heading"
                               :schema {:type :any :hide? true}
                               :queryable? true}
     :logseq.property/created-from-property {:title "Created from property"
                                             :schema {:type :entity
                                                      :hide? true}}
     :logseq.property/built-in?             {:title "Built in?"
                                             :schema {:type :checkbox
                                                      :hide? true}}
     :logseq.property/asset   {:title "Asset"
                               :schema {:type :entity
                                        :hide? true}}
   ;; used by pdf and whiteboard
   ;; TODO: remove ls-type
     :logseq.property/ls-type {:schema {:type :keyword
                                        :hide? true}}

     :logseq.property.pdf/hl-type {:title "Annotation type"
                                   :schema {:type :keyword :hide? true}}
     :logseq.property.pdf/hl-color
     {:title "Annotation color"
      :schema {:type :default :hide? true}
      :closed-values
      (mapv (fn [[db-ident value]]
              {:db-ident db-ident
               :value value
               :uuid (common-uuid/gen-uuid :db-ident-block-uuid db-ident)})
            [[:logseq.property/color.yellow "yellow"]
             [:logseq.property/color.red "red"]
             [:logseq.property/color.green "green"]
             [:logseq.property/color.blue "blue"]
             [:logseq.property/color.purple "purple"]])}
     :logseq.property.pdf/hl-page {:title "Annotation page"
                                   :schema {:type :raw-number :hide? true}}
     :logseq.property.pdf/hl-image {:title "Annotation image"
                                    :schema {:type :entity :hide? true}}
     :logseq.property.pdf/hl-value {:title "Annotation data"
                                    :schema {:type :map :hide? true}}
   ;; FIXME: :logseq.property/order-list-type should updated to closed values
     :logseq.property/order-list-type {:title "List type"
                                       :schema {:type :default
                                                :hide? true}}
     :logseq.property.linked-references/includes {:title "Included references"
                                                  :schema {; could be :entity to support blocks(objects) in the future
                                                           :type :node
                                                           :cardinality :many
                                                           :hide? true}}
     :logseq.property.linked-references/excludes {:title "Excluded references"
                                                  :schema {:type :node
                                                           :cardinality :many
                                                           :hide? true}}
     :logseq.property.tldraw/page {:title "Tldraw Page"
                                   :schema {:type :map
                                            :hide? true}}
     :logseq.property.tldraw/shape {:title "Tldraw Shape"
                                    :schema {:type :map
                                             :hide? true}}

   ;; Journal props
     :logseq.property.journal/title-format {:title "Title Format"
                                            :schema
                                            {:type :string
                                             :public? false}}

     :logseq.property/choice-checkbox-state
     {:title "Choice checkbox state"
      :schema {:type :checkbox
               :hide? true}
      :queryable? false}
     :logseq.property/checkbox-display-properties
     {:title "Properties displayed as checkbox"
      :schema {:type :property
               :cardinality :many
               :hide? true}
      :queryable? false}
     ;; Task props
     :logseq.property/status
     {:title "Status"
      :schema
      {:type :default
       :public? true
       :ui-position :block-left}
      :closed-values
      (mapv (fn [[db-ident value icon checkbox-state]]
              {:db-ident db-ident
               :value value
               :uuid (common-uuid/gen-uuid :db-ident-block-uuid db-ident)
               :icon {:type :tabler-icon :id icon}
               :properties (when (some? checkbox-state)
                             {:logseq.property/choice-checkbox-state checkbox-state})})
            [[:logseq.property/status.backlog "Backlog" "Backlog"]
             [:logseq.property/status.todo "Todo" "Todo" false]
             [:logseq.property/status.doing "Doing" "InProgress50"]
             [:logseq.property/status.in-review "In Review" "InReview"]
             [:logseq.property/status.done "Done" "Done" true]
             [:logseq.property/status.canceled "Canceled" "Cancelled"]])
      :properties {:logseq.property/hide-empty-value true
                   :logseq.property/default-value :logseq.property/status.todo
                   :logseq.property/enable-history? true}
      :queryable? true}
     :logseq.property/priority
     {:title "Priority"
      :schema
      {:type :default
       :public? true
       :ui-position :block-left}
      :closed-values
      (mapv (fn [[db-ident value icon]]
              {:db-ident db-ident
               :value value
               :uuid (common-uuid/gen-uuid :db-ident-block-uuid db-ident)
               :icon {:type :tabler-icon :id icon}})
            [[:logseq.property/priority.low "Low" "priorityLvlLow"]
             [:logseq.property/priority.medium "Medium" "priorityLvlMedium"]
             [:logseq.property/priority.high "High" "priorityLvlHigh"]
             [:logseq.property/priority.urgent "Urgent" "priorityLvlUrgent"]])
      :properties {:logseq.property/hide-empty-value true
                   :logseq.property/enable-history? true}}
     :logseq.property/deadline
     {:title "Deadline"
      :schema {:type :datetime
               :public? true
               :ui-position :block-below}
      :properties {:logseq.property/hide-empty-value true
                   :logseq.property/description "Use it to finish something at a specific date(time)."}
      :queryable? true}
     :logseq.property/scheduled
     {:title "Scheduled"
      :schema {:type :datetime
               :public? true
               :ui-position :block-below}
      :properties {:logseq.property/hide-empty-value true
                   :logseq.property/description "Use it to plan something to start at a specific date(time)."}
      :queryable? true}
     :logseq.property.repeat/recur-frequency
     (let [schema {:type :number
                   :public? false}]
       {:title "Repeating recur frequency"
        :schema schema
        :properties {:logseq.property/hide-empty-value true
                     :logseq.property/default-value 1}
        :queryable? true})
     :logseq.property.repeat/recur-unit
     {:title "Repeating recur unit"
      :schema {:type :default
               :public? false}
      :closed-values (mapv (fn [[db-ident value]]
                             {:db-ident db-ident
                              :value value
                              :uuid (common-uuid/gen-uuid :db-ident-block-uuid db-ident)})
                           [[:logseq.property.repeat/recur-unit.minute "Minute"]
                            [:logseq.property.repeat/recur-unit.hour "Hour"]
                            [:logseq.property.repeat/recur-unit.day "Day"]
                            [:logseq.property.repeat/recur-unit.week "Week"]
                            [:logseq.property.repeat/recur-unit.month "Month"]
                            [:logseq.property.repeat/recur-unit.year "Year"]])
      :properties {:logseq.property/hide-empty-value true
                   :logseq.property/default-value :logseq.property.repeat/recur-unit.day}
      :queryable? true}
     :logseq.property.repeat/repeated?
     {:title "Node Repeats?"
      :schema {:type :checkbox
               :hide? true}
      :queryable? true}
     :logseq.property.repeat/temporal-property
     {:title "Repeating Temporal Property"
      :schema {:type :property
               :hide? true}}
     :logseq.property.repeat/checked-property
     {:title "Repeating Checked Property"
      :schema {:type :property
               :hide? true}}

;; TODO: Add more props :Assignee, :Estimate, :Cycle, :Project

     :logseq.property/icon {:title "Icon"
                            :schema {:type :map}}
     :logseq.property/publishing-public? {:title "Publishing Public?"
                                          :schema
                                          {:type :checkbox
                                           :hide? true
                                           :view-context :page
                                           :public? true}}
     :logseq.property/exclude-from-graph-view {:title "Excluded from Graph view?"
                                               :schema
                                               {:type :checkbox
                                                :hide? true
                                                :view-context :page
                                                :public? true}}

     :logseq.property.view/type
     {:title "View Type"
      :schema
      {:type :default
       :public? false
       :hide? true}
      :closed-values
      (mapv (fn [[db-ident value icon]]
              {:db-ident db-ident
               :value value
               :uuid (common-uuid/gen-uuid :db-ident-block-uuid db-ident)
               :icon {:type :tabler-icon :id icon}})
            [[:logseq.property.view/type.table "Table View" "table"]
             [:logseq.property.view/type.list "List View" "list"]
             [:logseq.property.view/type.gallery "Gallery View" "layout-grid"]])
      :properties {:logseq.property/default-value :logseq.property.view/type.table}
      :queryable? true}

     :logseq.property.view/feature-type
     {:title "View Feature Type"
      :schema
      {:type :keyword
       :public? false
       :hide? true}
      :queryable? false}

     :logseq.property.view/group-by-property
     {:title "View group by property"
      :schema
      {:type :property
       :public? false
       :hide? true}
      :queryable? true}

     :logseq.property.table/sorting {:title "View sorting"
                                     :schema
                                     {:type :coll
                                      :hide? true
                                      :public? false}
                                     ;; ignore this property when rtc,
                                     ;; since users frequently click the sort button to view table content temporarily,
                                     ;; but this action does not need to be synchronized with other clients.
                                     :rtc {:rtc/ignore-attr-when-init-upload true
                                           :rtc/ignore-attr-when-init-download true
                                           :rtc/ignore-attr-when-syncing true}}

     :logseq.property.table/filters {:title "View filters"
                                     :schema
                                     {:type :map
                                      :hide? true
                                      :public? false}}

     :logseq.property.table/hidden-columns {:title "View hidden columns"
                                            :schema
                                            {:type :keyword
                                             :cardinality :many
                                             :hide? true
                                             :public? false}}

     :logseq.property.table/ordered-columns {:title "View ordered columns"
                                             :schema
                                             {:type :coll
                                              :hide? true
                                              :public? false}}

     :logseq.property.table/sized-columns {:title "View columns settings"
                                           :schema
                                           {:type :map
                                            :hide? true
                                            :public? false}}
     :logseq.property.table/pinned-columns {:title "Table view pinned columns"
                                            :schema
                                            {:type :property
                                             :cardinality :many
                                             :hide? true
                                             :public? false}}
     :logseq.property/view-for {:title "This view belongs to"
                                :schema
                                {:type :node
                                 :hide? true
                                 :public? false}}
     :logseq.property.asset/type {:title "File Type"
                                  :schema {:type :string
                                           :hide? true
                                           :public? false}
                                  :queryable? true}
     :logseq.property.asset/size {:title "File Size"
                                  :schema {:type :raw-number
                                           :hide? true
                                           :public? false}
                                  :queryable? true}
     :logseq.property.asset/checksum {:title "File checksum"
                                      :schema {:type :string
                                               :hide? true
                                               :public? false}}
     :logseq.property.asset/last-visit-page {:title "Last visit page"
                                             :schema {:type :raw-number
                                                      :hide? true
                                                      :public? false}
                                             :rtc {:rtc/ignore-attr-when-init-upload true
                                                   :rtc/ignore-attr-when-init-download true
                                                   :rtc/ignore-attr-when-syncing true}}
     :logseq.property.asset/remote-metadata {:title "File remote metadata"
                                             :schema
                                             {:type :map
                                              :hide? true
                                              :public? false}
                                             :rtc {:rtc/ignore-attr-when-init-upload true
                                                   :rtc/ignore-attr-when-init-download true
                                                   :rtc/ignore-attr-when-syncing true}}
     :logseq.property.asset/resize-metadata {:title "Asset resize metadata"
                                             :schema {:type :map
                                                      :hide? true
                                                      :public? false}}
     :logseq.property.fsrs/due {:title "Due"
                                :schema
                                {:type :datetime
                                 :hide? false
                                 :public? false}}
     :logseq.property.fsrs/state {:title "State"
                                  :schema
                                  {:type :map
                                   :hide? false ; TODO: show for debug now, hide it later
                                   :public? false}}
     :logseq.property.user/name {:title "User Name"
                                 :schema
                                 {:type :string
                                  :hide? false
                                  :public? true}}
     :logseq.property.user/email {:title "User Email"
                                  :schema
                                  {:type :string
                                   :hide? false
                                   :public? true}}
     :logseq.property.user/avatar {:title "User Avatar"
                                   :schema
                                   {:type :string
                                    :hide? false
                                    :public? true}}
     :logseq.property/enable-history? {:title "Enable property history"
                                       :schema {:type :checkbox
                                                :public? true
                                                :view-context :property}
                                       :properties
                                       {:logseq.property/description "Records history anytime a property's value changes on a node."}}
     :logseq.property.history/block {:title "History block"
                                     :schema {:type :entity
                                              :hide? true}}
     :logseq.property.history/property {:title "History property"
                                        :schema {:type :property
                                                 :hide? true}}
     :logseq.property.history/ref-value {:title "History value"
                                         :schema {:type :entity
                                                  :hide? true}}
     :logseq.property.history/scalar-value {:title "History scalar value"
                                            :schema {:type :any
                                                     :hide? true}}
     :logseq.property/created-by {:title "Node created by(deprecated)"
                                  :schema {:type :string
                                           :hide? true}}
     :logseq.property/created-by-ref {:title "Node created by"
                                      :schema {:type :entity
                                               :hide? true}
                                      :queryable? true}
     :logseq.property/used-template {:title "Used template"
                                     :schema {:type :node
                                              :public? false
                                              :hide? true
                                              :classes #{:logseq.class/Template}}}
     :logseq.property/template-applied-to {:title "Apply template to tags"
                                           :schema {:type :class
                                                    :cardinality :many
                                                    :public? true}
                                           :queryable? true})))

(def db-attribute-properties
  "Internal properties that are also db schema attributes"
  #{:block/alias :block/tags :block/parent
    :block/order :block/collapsed? :block/page
    :block/refs :block/path-refs :block/link
    :block/title :block/closed-value-property
    :block/created-at :block/updated-at})

(assert (= db-attribute-properties
           (set (keep (fn [[_k {:keys [attribute]}]] (when attribute attribute))
                      built-in-properties)))
        "All db attribute properties are configured in built-in-properties")

(def private-db-attribute-properties
  "db-attribute properties that are not visible to user"
  (->> db-attribute-properties
       (remove #(get-in built-in-properties [% :schema :public?]))
       set))

(def public-db-attribute-properties
  "db-attribute properties that are visible to user"
  (set/difference db-attribute-properties private-db-attribute-properties))

(def read-only-properties
  "Property values that shouldn't be updated"
  #{:logseq.property/built-in?})

(def schema-properties-map
  "Maps schema unqualified keywords to their qualified keywords.
   The qualified keywords are all properties except for :db/cardinality
   which is a datascript attribute"
  {:cardinality :db/cardinality
   :type :logseq.property/type
   :hide? :logseq.property/hide?
   :public? :logseq.property/public?
   :ui-position :logseq.property/ui-position
   :view-context :logseq.property/view-context
   :classes :logseq.property/classes})

(def schema-properties
  "Properties that used to be in block/schema. Schema originally referred to just type and cardinality
   but expanded to include a property's core configuration because it was easy to add to the schema map.
   We should move some of these out since they are just like any other properties e.g. :view-context"
  (set (vals schema-properties-map)))

(def logseq-property-namespaces
  #{"logseq.property" "logseq.property.tldraw" "logseq.property.pdf" "logseq.property.fsrs"
    "logseq.property.linked-references" "logseq.property.asset" "logseq.property.table" "logseq.property.node"
    "logseq.property.code" "logseq.property.repeat"
    "logseq.property.journal" "logseq.property.class" "logseq.property.view"
    "logseq.property.user" "logseq.property.history"})

(defn logseq-property?
  "Determines if keyword is a logseq property"
  [kw]
  (contains? logseq-property-namespaces (namespace kw)))

(defn user-property-namespace?
  "Determines if namespace string is a user property"
  [s]
  (string/includes? s ".property"))

(defn plugin-property?
  "Determines if keyword is a plugin property"
  [kw]
  (string/starts-with? (namespace kw) "plugin.property."))

(defn internal-property?
  "Determines if ident kw is an internal property. This includes db-attribute properties
   unlike logseq-property? and doesn't include non-property idents unlike internal-ident?"
  [k]
  (let [k-name (namespace k)]
    (and k-name
         (or (contains? logseq-property-namespaces k-name)
             (contains? public-db-attribute-properties k)))))

(defn property?
  "Determines if ident kw is a property visible to user"
  [k]
  (let [k-name (namespace k)]
    (and k-name
         (or (contains? logseq-property-namespaces k-name)
             (user-property-namespace? k-name)
             ;; disallow private db-attribute-properties as they cause unwanted refs
             ;; and appear noisily in debugging contexts
             (and (keyword? k) (contains? public-db-attribute-properties k))))))

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
  (when db
    (when-let [property (d/entity db property-id)]
      (:property/closed-values property))))

(defn closed-value-content
  "Gets content/value of a given closed value ent/map. Works for all closed value types"
  [ent]
  (or (:block/title ent)
      (:logseq.property/value ent)))

(defn property-value-content
  "Given an entity, gets the content for the property value of a ref type
  property i.e. what the user sees. For page types the content is the page name"
  [ent]
  (or (:block/title ent)
      (:logseq.property/value ent)))

(defn get-closed-value-entity-by-name
  "Given a property, finds one of its closed values by name or nil if none
  found. Works for all closed value types"
  [db db-ident value-content]
  (let [values (get-closed-property-values db db-ident)]
    (some (fn [e]
            (when (= (closed-value-content e) value-content)
              e)) values)))

(def default-user-namespace "user.property")

(defn create-user-property-ident-from-name
  "Creates a property :db/ident for a default user namespace.
   NOTE: Only use this when creating a db-ident for a new property."
  ([property-name] (create-user-property-ident-from-name property-name default-user-namespace))
  ([property-name user-namespace]
   (db-ident/create-db-ident-from-name user-namespace property-name)))

(defn get-class-ordered-properties
  [class-entity]
  (->> (:logseq.property.class/properties class-entity)
       (sort-by :block/order)))

(defn property-created-block?
  "`block` has been created in a property and it's not a closed value."
  [block]
  (and (map? block)
       (:logseq.property/created-from-property block)
       (:block/page block)
       (not (some? (closed-value-content block)))))

(defn many?
  [property]
  (= (:db/cardinality property) :db.cardinality/many))

(defn public-built-in-property?
  "Indicates whether built-in property can be seen and edited by users"
  [entity]
  ;; No need to do :built-in? check yet since user properties can't set this
  (:logseq.property/public? entity))

(defn get-property-schema
  [property-m]
  (select-keys property-m schema-properties))

(defn built-in-has-ref-value?
  "Given a built-in's db-ident, determine if its property value is a ref"
  [db-ident]
  (contains? db-property-type/value-ref-property-types
             (get-in built-in-properties [db-ident :schema :type])))
