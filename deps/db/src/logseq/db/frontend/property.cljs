(ns logseq.db.frontend.property
  "Property related fns for DB graphs and frontend/datascript usage"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [flatland.ordered.map :refer [ordered-map]]
            [logseq.common.util :as common-util]
            [logseq.common.uuid :as common-uuid]
            [logseq.db.frontend.db-ident :as db-ident]
            [logseq.db.frontend.order :as db-order]
            [logseq.db.frontend.property.type :as db-property-type]))

(defn build-property-value-block
  "Builds a property value entity given a block map/entity, a property entity or
  ident and its property value"
  [block property value]
  (let [block-id (or (:db/id block) (:db/ident block))]
    (-> (merge
         {:block/uuid (d/squuid)
          :block/page (if (:block/page block)
                        (:db/id (:block/page block))
                        ;; page block
                        block-id)
          :block/parent block-id
          :logseq.property/created-from-property (if (= (:db/ident property) :logseq.property/default-value)
                                                   block-id
                                                   (or (:db/id property) {:db/ident (:db/ident property)}))
          :block/order (db-order/gen-key)}
         (if (db-property-type/property-value-content? (get-in block [:block/schema :type]) property)
           {:property.value/content value}
           {:block/title value}))
        common-util/block-with-timestamps)))

;; Main property vars
;; ==================

(def ^:large-vars/data-var built-in-properties*
  "Map of built in properties for db graphs with their :db/ident as keys.
   Each property has a config map with the following keys:
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
   * :name - Property's :block/name as a keyword. If none given, one is derived from the db/ident
   * :attribute - Property keyword that is saved to a datascript attribute outside of :block/properties
   * :queryable? - Boolean for whether property can be queried in the query builder
   * :closed-values - Vec of closed-value maps for properties with choices. Map
     has keys :value, :db-ident, :uuid and :icon"
  (ordered-map
   :block/alias           {:title "Alias"
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
                                   :public? true
                                   :classes #{:logseq.class/Root}}
                          :queryable? true}
   :logseq.property.attribute/kv-value {:title "KV value"
                                        :attribute :kv/value
                                        :schema {:type :any
                                                 :public? false
                                                 :hide? true}}
   :block/schema         {:title "Node schema"
                          :attribute :block/schema
                          :schema {:type :map
                                   :public? false
                                   :hide? true}}
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
   :logseq.property.attribute/property-schema-classes
   {:title "Property classes"
    :attribute :property/schema.classes
    :schema {:type :entity
             :cardinality :many
             :public? false
             :hide? true}}
   :logseq.property.attribute/property-value-content
   {:title "Property value"
    :attribute :property.value/content
    :schema {:type :any
             :public? false
             :hide? true}}

   :logseq.property.node/display-type {:title "Node Display Type"
                                       :schema {:type :keyword
                                                :public? false
                                                :hide? true
                                                :view-context :block}
                                       :queryable? true}
   :logseq.property.code/lang {:title "Code Mode"
                               :schema {:type :string
                                        :public? false
                                        :hide? true
                                        :view-context :block}
                               :queryable? true}
   :logseq.property/parent {:title "Parent"
                            :schema {:type :node
                                     :public? true
                                     :view-context :page}
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
   :logseq.property.class/properties {:title "Tag Properties"
                                      :schema {:type :property
                                               :cardinality :many
                                               :public? true
                                               :view-context :never}}
   :logseq.property/hide-empty-value {:title "Hide empty value"
                                      :schema {:type :checkbox
                                               :public? true
                                               :view-context :property}}
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
                                        :cardinality :many}}
   :logseq.property/background-color {:title "Background color"
                                      :schema {:type :default :hide? true}}
   :logseq.property/background-image {:title "Background image"
                                      :schema
                                      {:type :default ; FIXME: asset
                                       :view-context :block}}
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
                                     :name :logseq.order-list-type
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
   :logseq.property.tldraw/page {:name :logseq.tldraw.page
                                 :schema {:type :map
                                          :hide? true}}
   :logseq.property.tldraw/shape {:name :logseq.tldraw.shape
                                  :schema {:type :map
                                           :hide? true}}

   ;; Journal props
   :logseq.property.journal/title-format {:title "Title Format"
                                          :schema
                                          {:type :string
                                           :public? false}}

   ;; TODO: should we replace block/journal-day with those separate props?
   ;; :logseq.property.journal/year {:title "Journal year"
   ;;                                :schema
   ;;                                {:type :raw-number
   ;;                                 :public? false}}
   ;; :logseq.property.journal/month {:title "Journal month"
   ;;                                 :schema
   ;;                                 {:type :raw-number
   ;;                                  :public? false}}
   ;; :logseq.property.journal/day {:title "Journal day"
   ;;                               :schema
   ;;                               {:type :raw-number
   ;;                                :public? false}}

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
   :logseq.task/priority
   {:title "Priority"
    :schema
    {:type :default
     :public? true
     :position :block-left}
    :closed-values
    (mapv (fn [[db-ident value icon]]
            {:db-ident db-ident
             :value value
             :uuid (common-uuid/gen-uuid :db-ident-block-uuid db-ident)
             :icon {:type :tabler-icon :id icon}})
          [[:logseq.task/priority.low "Low" "priorityLvlLow"]
           [:logseq.task/priority.medium "Medium" "priorityLvlMedium"]
           [:logseq.task/priority.high "High" "priorityLvlHigh"]
           [:logseq.task/priority.urgent "Urgent" "priorityLvlUrgent"]])
    :properties {:logseq.property/hide-empty-value true
                 :logseq.property/enable-history? true}}
   :logseq.task/status
   {:title "Status"
    :schema
    {:type :default
     :public? true
     :position :block-left}
    :closed-values
    (mapv (fn [[db-ident value icon checkbox-state]]
            {:db-ident db-ident
             :value value
             :uuid (common-uuid/gen-uuid :db-ident-block-uuid db-ident)
             :icon {:type :tabler-icon :id icon}
             :properties (when (some? checkbox-state)
                           {:logseq.property/choice-checkbox-state checkbox-state})})
          [[:logseq.task/status.backlog "Backlog" "Backlog"]
           [:logseq.task/status.todo "Todo" "Todo" false]
           [:logseq.task/status.doing "Doing" "InProgress50"]
           [:logseq.task/status.in-review "In Review" "InReview"]
           [:logseq.task/status.done "Done" "Done" true]
           [:logseq.task/status.canceled "Canceled" "Cancelled"]])
    :properties {:logseq.property/hide-empty-value true
                 :logseq.property/default-value :logseq.task/status.todo
                 :logseq.property/enable-history? true}
    :queryable? true}
   :logseq.task/deadline
   {:title "Deadline"
    :schema {:type :datetime
             :public? true
             :position :block-below}
    :properties {:logseq.property/hide-empty-value true}
    :queryable? true}
   :logseq.task/scheduled
   {:title "Scheduled"
    :schema {:type :datetime
             :public? true
             :position :block-below}
    :properties {:logseq.property/hide-empty-value true}
    :queryable? true}
   :logseq.task/recur-frequency
   (let [schema {:type :number
                 :public? false}]
     {:title "Recur frequency"
      :schema schema
      :properties (let [block {:db/ident :logseq.task/recur-frequency
                               :block/schema schema}
                        property {:db/ident :logseq.property/default-value
                                  :block/schema {:type :entity}}
                        default-value (assoc (build-property-value-block block property 1) :db/id -1)]
                    {:logseq.property/hide-empty-value true
                     :logseq.property/default-value default-value})
      :queryable? true})
   :logseq.task/recur-unit
   {:title "Recur unit"
    :schema {:type :default
             :public? false}
    :closed-values (mapv (fn [[db-ident value]]
                           {:db-ident db-ident
                            :value value
                            :uuid (common-uuid/gen-uuid :db-ident-block-uuid db-ident)})
                         [[:logseq.task/recur-unit.minute "Minute"]
                          [:logseq.task/recur-unit.hour "Hour"]
                          [:logseq.task/recur-unit.day "Day"]
                          [:logseq.task/recur-unit.week "Week"]
                          [:logseq.task/recur-unit.month "Month"]
                          [:logseq.task/recur-unit.year "Year"]])
    :properties {:logseq.property/hide-empty-value true
                 :logseq.property/default-value :logseq.task/recur-unit.day}
    :queryable? true}
   :logseq.task/repeated?
   {:title "Repeated task?"
    :schema {:type :checkbox
             :hide? true}
    :queryable? true}
   :logseq.task/scheduled-on-property
   {:title "Scheduled on property"
    :schema {:type :property
             :hide? true}}
   :logseq.task/recur-status-property
   {:title "Recur status property"
    :schema {:type :property
             :hide? true}}

;; TODO: Add more props :Assignee, :Estimate, :Cycle, :Project

   :logseq.property/icon {:title "Icon"
                          :schema {:type :map}}
   :logseq.property/public {:title "Publishing Public?"
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
   :logseq.property/description {:title "Description"
                                 :schema
                                 {:type :default
                                  :public? true}}

   :logseq.property.view/type
   {:title "View Type"
    :schema
    {:type :default
     :public? false
     :hide? true}
    :closed-values
    (mapv (fn [[db-ident value]]
            {:db-ident db-ident
             :value value
             :uuid (common-uuid/gen-uuid :db-ident-block-uuid db-ident)})
          [[:logseq.property.view/type.table "Table View"]
           [:logseq.property.view/type.list "List View"]
           [:logseq.property.view/type.gallery "Gallery View"]])
    :properties {:logseq.property/default-value :logseq.property.view/type.table}
    :queryable? true}

   :logseq.property.table/sorting {:title "View sorting"
                                   :schema
                                   {:type :coll
                                    :hide? true
                                    :public? false}}

   :logseq.property.table/filters {:title "View filters"
                                   :schema
                                   {:type :coll
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
                                                    :public? false}}
   :logseq.property.asset/remote-metadata {:title "File remote metadata"
                                           :schema
                                           {:type :map
                                            :hide? true
                                            :public? false}}
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
                                              :view-context :property}}
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
                                                   :hide? true}}))

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
  #{:block/alias :block/tags :block/schema :block/parent
    :block/order :block/collapsed? :block/page
    :block/refs :block/path-refs :block/link
    :block/title :block/closed-value-property
    :block/created-at :block/updated-at
    :logseq.property.attribute/kv-value :logseq.property.attribute/property-schema-classes :logseq.property.attribute/property-value-content})

(assert (= db-attribute-properties
           (set (keep (fn [[k {:keys [attribute]}]] (when attribute k))
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

(def logseq-property-namespaces
  #{"logseq.property" "logseq.property.tldraw" "logseq.property.pdf" "logseq.property.fsrs" "logseq.task"
    "logseq.property.linked-references" "logseq.property.asset" "logseq.property.table" "logseq.property.node"
    "logseq.property.code"
    ;; attribute ns is for db attributes that don't start with :block
    "logseq.property.attribute"
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

(defn user-class-namespace?
  "Determines if namespace string is a user class"
  [s]
  (string/includes? s ".class"))

(defn property?
  "Determines if ident kw is a property visible to user"
  [k]
  (let [k-name (namespace k)]
    (and k-name
         (or (contains? logseq-property-namespaces k-name)
             (user-property-namespace? k-name)
             (user-class-namespace? k-name)
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
  (when-let [property (d/entity db property-id)]
    (:property/closed-values property)))

(defn closed-value-content
  "Gets content/value of a given closed value ent/map. Works for all closed value types"
  [ent]
  (or (:block/title ent)
      (:property.value/content ent)))

(defn property-value-content
  "Given an entity, gets the content for the property value of a ref type
  property i.e. what the user sees. For page types the content is the page name"
  [ent]
  (or (:block/title ent)
      (:property.value/content ent)))

(defn ref->property-value-content
  "Given a ref from a pulled query e.g. `{:db/id X}`, gets a readable name for
  the property value of a ref type property"
  [db ref]
  (some->> (:db/id ref)
           (d/entity db)
           property-value-content))

(defn ref->property-value-contents
  "Given a ref or refs from a pulled query e.g. `{:db/id X}`, gets a readable
  name for the property values of a ref type property"
  [db ref]
  (if (or (set? ref) (sequential? ref))
    (set (map #(ref->property-value-content db %) ref))
    (ref->property-value-content db ref)))

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

(defn properties-by-name
  "Given a block from a query result, returns a map of its properties indexed by
  property names"
  [db block]
  (->> (properties block)
       (map (fn [[k v]]
              [(:block/title (d/entity db k))
               (ref->property-value-contents db v)]))
       (into {})))

(defn public-built-in-property?
  "Indicates whether built-in property can be seen and edited by users"
  [entity]
  ;; No need to do :built-in? check yet since user properties can't set this
  (get-in entity [:block/schema :public?]))
