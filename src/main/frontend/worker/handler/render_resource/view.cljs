(ns frontend.worker.handler.render-resource.view
  "View configuration, scope, grouping, and row normalization."
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [frontend.worker.handler.render-resource.common :as common]
            [logseq.db :as ldb]
            [logseq.db.common.view :as db-view]
            [logseq.db.frontend.class :as db-class]))

(def ^:private view-eids-query
  '[:find [?view ...]
    :in $ ?owner ?feature-type
    :where
    [?view :logseq.property/view-for ?owner]
    [?view :logseq.property.view/feature-type ?feature-type]])

(defn- view-owner
  [db owner-lookup]
  (cond
    (uuid? owner-lookup)
    (common/entity-by-uuid! db :owner-uuid owner-lookup)

    (and (string? owner-lookup) (not (string/blank? owner-lookup)))
    (or (ldb/get-page db owner-lookup)
        (common/fail! "Missing view owner page" {:owner-lookup owner-lookup}))

    :else
    (common/fail! "Invalid view owner" {:owner-lookup owner-lookup})))

(defn- views
  [db resource-key _runtime]
  (let [[_ owner-lookup feature-type] resource-key
        owner (view-owner db owner-lookup)
        owner-uuid (common/entity-uuid! db (:db/id owner))]
    (when-not (keyword? feature-type)
      (common/fail! "Invalid view feature type" {:feature-type feature-type}))
    [#{[:views owner-uuid feature-type]}
     (->> (d/q view-eids-query db (:db/id owner) feature-type)
          (map #(d/entity db %))
          ldb/sort-by-order
          (mapv (fn [view]
                  (common/entity-uuid! db (:db/id view)))))]))

(defn- scope-uuids
  [db eids]
  (into #{} (map #(common/entity-uuid! db %)) (distinct eids)))

(def ^:private view-feature-types
  #{:all-pages
    :class-objects
    :property-objects
    :linked-references
    :unlinked-references
    :query-result})

(def ^:private view-context-keys
  #{:feature-type
    :sorting
    :filters
    :input
    :group-by-property-ident
    :initial-row-count
    :row-offset
    :query-row-uuids})

(defn- valid-sorting?
  [sorting]
  (and (vector? sorting)
       (every? (fn [item]
                 (and (map? item)
                      (= #{:id :asc?} (set (keys item)))
                      (keyword? (:id item))
                      (boolean? (:asc? item))))
               sorting)))

(defn- valid-filters?
  [filters]
  (and (map? filters)
       (every? #{:or? :filters} (keys filters))
       (or (nil? (:or? filters)) (boolean? (:or? filters)))
       (vector? (:filters filters))
       (every? (fn [clause]
                 (and (vector? clause)
                      (= 3 (count clause))
                      (keyword? (first clause))))
               (:filters filters))))

(defn- require-view-context!
  [context]
  (when-not (and (map? context)
                 (= (set (keys context))
                    (set (filter #(contains? context %) view-context-keys)))
                 (contains? view-context-keys :feature-type)
                 (contains? context :feature-type)
                 (contains? view-feature-types (:feature-type context))
                 (or (not (contains? context :sorting))
                     (valid-sorting? (:sorting context)))
                 (or (not (contains? context :filters))
                     (valid-filters? (:filters context)))
                 (or (not (contains? context :input))
                     (string? (:input context)))
                 (or (not (contains? context :group-by-property-ident))
                     (keyword? (:group-by-property-ident context)))
                 (or (not (contains? context :initial-row-count))
                     (and (contains? #{:all-pages :class-objects} (:feature-type context))
                          (integer? (:initial-row-count context))
                          (pos? (:initial-row-count context))
                          ;; Cap matches views/view-prefetch-max-rows / snapshot batch.
                          (<= (:initial-row-count context) 1000)))
                 (or (not (contains? context :row-offset))
                     (and (contains? context :initial-row-count)
                          (integer? (:row-offset context))
                          (not (neg? (:row-offset context)))))
                 (or (not (contains? context :query-row-uuids))
                     (and (vector? (:query-row-uuids context))
                          (every? uuid? (:query-row-uuids context)))))
    (common/fail! "Invalid view resource context" {:context context}))
  context)

(defn- property-ident
  [value]
  (cond
    (keyword? value) value
    (de/entity? value) (:db/ident value)
    (map? value) (:db/ident value)
    :else nil))

(defn- effective-view-config
  [view context]
  (let [persisted-sorting (:logseq.property.table/sorting view)
        empty-sorting? (or (= persisted-sorting
                              :logseq.property/empty-placeholder)
                           (= (property-ident persisted-sorting)
                              :logseq.property/empty-placeholder)
                           (empty? persisted-sorting))
        sorting (if empty-sorting?
                  (or (:sorting context)
                      [{:id :block/updated-at :asc? false}])
                  persisted-sorting)
        filters (or (:logseq.property.table/filters view)
                    (:filters context))
        group-by-property-ident
        (or (property-ident (:logseq.property.view/group-by-property view))
            (:group-by-property-ident context))
        group-sort-property-ident
        (when group-by-property-ident
          (or (property-ident
               (:logseq.property.view/sort-groups-by-property view))
              :block/journal-day))]
    {:sorting sorting
     :filters filters
     :input (:input context)
     :group-by-property-ident group-by-property-ident
     :group-sort-property-ident group-sort-property-ident}))

(defn- filter-property-idents
  [filters]
  (into #{} (map first) (:filters filters)))

(defn- view-value-watch-keys
  [{:keys [sorting filters input group-by-property-ident
           group-sort-property-ident]}
   view-partition]
  (cond-> (into #{}
                (map (fn [{:keys [id]}] [:attr id]))
                sorting)
    filters
    (into (map (fn [filter-ident] [:attr filter-ident]))
          (filter-property-idents filters))

    (not (string/blank? input))
    (conj [:attr :block/title])

    group-by-property-ident
    (conj [:attr group-by-property-ident]
          [:attr group-sort-property-ident]
          [:attr :block/title])

    (= :grouped-list view-partition)
    (conj [:attr :block/parent]
          [:attr :block/order])))

(defn- require-view-owner!
  [feature-type owner view-uuid]
  (when (and (contains? #{:class-objects
                          :property-objects
                          :linked-references
                          :unlinked-references}
                        feature-type)
             (nil? owner))
    (common/fail! "View resource has no owner"
           {:view-uuid view-uuid
            :feature-type feature-type}))
  owner)

(defn- view-watch-keys
  [db view-uuid owner feature-type config view-partition]
  (if (= :unlinked-references feature-type)
    #{}
    (let [owner-uuid (:block/uuid owner)
          value-watch-keys (if (= :linked-references feature-type)
                             #{}
                             (view-value-watch-keys config view-partition))
          base (cond-> (conj value-watch-keys [:entity view-uuid])
                 owner-uuid (conj [:entity owner-uuid]))]
      (case feature-type
      :all-pages
      (conj base [:page-membership])

      :class-objects
      (let [classes (scope-uuids db
                                 (cons (:db/id owner)
                                       (db-class/get-structured-children
                                        db (:db/id owner))))]
        (into (conj base [:class-tree])
              (map (fn [class-uuid]
                     [:class-membership class-uuid]))
              classes))

      :property-objects
      (let [owner-ident (:db/ident owner)]
        (when-not (keyword? owner-ident)
          (common/fail! "View property owner has no ident"
                 {:owner-uuid owner-uuid}))
        (conj base [:property-membership owner-ident]))

      :linked-references
      (let [class-children (when (ldb/class? owner)
                             (db-class/get-structured-children db (:db/id owner)))
            refs-scope (scope-uuids db
                                    (concat [(:db/id owner)]
                                            (ldb/get-block-alias db (:db/id owner))
                                            class-children))]
        (into (conj base [:ref-scope])
              (map (fn [target-uuid]
                     [:refs target-uuid]))
              refs-scope))

      :query-result
      base))))

(defn- normalize-view-row
  [db row]
  (cond
    (integer? row)
    (common/entity-uuid! db row)

    (and (map? row) (uuid? (:block/uuid row)))
    (:block/uuid row)

    (and (map? row) (integer? (:db/id row)))
    (common/entity-uuid! db (:db/id row))

    (and (de/entity? row) (uuid? (:block/uuid row)))
    (:block/uuid row)

    :else
    (common/fail! "Unsupported view resource row" {:row row})))

(defn- first-window-row-preview
  [db block-uuid]
  (when (uuid? block-uuid)
    (when-let [entity (d/entity db [:block/uuid block-uuid])]
      {:block/uuid block-uuid
       :db/id (:db/id entity)
       :block/title (:block/title entity)
       :block.temp/first-window-preview? true})))

(defn- first-window-row-previews
  "UUID rows still need a second use-block snapshot for titles.
  26 title lookups stay in the first-window payload so the table can
  paint the name column when view-data arrives."
  [db rows]
  (into {}
        (keep (fn [block-uuid]
                (when-let [preview (first-window-row-preview db block-uuid)]
                  [block-uuid preview])))
        rows))

(defn- normalize-group-value
  [value]
  (cond
    (nil? value)
    {:kind :empty}

    (and (or (map? value) (de/entity? value))
         (uuid? (:block/uuid value)))
    {:kind :entity :uuid (:block/uuid value)}

    (coll? value)
    (common/fail! "Unsupported view group value" {:value value})

    :else
    {:kind :scalar :value value}))

(defn- grouped-list-partition?
  [value]
  (and (vector? value)
       (= 2 (count value))
       (uuid? (first value))
       (sequential? (second value))))

(defn- grouped-list-data?
  [data]
  (and (seq data)
       (every? (fn [group]
                 (and (vector? group)
                      (= 2 (count group))
                      (let [partitions (second group)]
                        (and (sequential? partitions)
                             (every? grouped-list-partition? partitions)))))
               data)))

(defn- normalize-view-rows
  [db rows]
  (mapv #(normalize-view-row db %) rows))

(defn- normalize-flat-view-data
  [db result]
  {:partition :flat
   :count (:count result)
   :rows (normalize-view-rows db (:data result))})

(defn- normalize-grouped-view-data
  [db result]
  {:partition :grouped
   :count (:count result)
   :groups
   (mapv (fn [[value rows]]
           {:value (normalize-group-value value)
            :rows (normalize-view-rows db rows)})
         (:data result))})

(defn- normalize-grouped-list-view-data
  [db result]
  {:partition :grouped-list
   :count (:count result)
   :groups
   (mapv (fn [[value partitions]]
           {:value (normalize-group-value value)
            :partitions
            (mapv (fn [[breadcrumb-uuid rows]]
                    {:breadcrumb-uuid breadcrumb-uuid
                     :rows (normalize-view-rows db rows)})
                  partitions)})
         (:data result))})

(defn- normalize-view-data
  [db result grouped?]
  (when-not (map? result)
    (common/fail! "Invalid view resource result" {:result result}))
  (let [value (cond
                (grouped-list-data? (:data result))
                (normalize-grouped-list-view-data db result)

                grouped?
                (normalize-grouped-view-data db result)

                :else
                (normalize-flat-view-data db result))]
    (cond-> value
      (contains? result :ref-pages-count)
      (assoc :ref-pages-count (:ref-pages-count result))

    (contains? result :ref-matched-children-ids)
    (assoc :matched-child-uuids
           (when-some [ids (:ref-matched-children-ids result)]
             (into #{} (map #(common/entity-uuid! db %)) ids)))

      (contains? result :properties)
      (assoc :properties (mapv identity (:properties result))))))

(defn- missing-view-data
  "Delete still has an in-flight :view-data snapshot. Fail-fast here
  rejects the whole get-render-snapshots batch and crashes the page."
  [view-uuid]
  [#{[:entity view-uuid]}
   {:partition :flat
    :count 0
    :rows []}])

(defn- view-data
  [db resource-key _runtime]
  (let [[_ view-uuid context] resource-key
        context (require-view-context! context)
        feature-type (:feature-type context)]
    (common/require-uuid! :view-uuid view-uuid)
    (if-let [view (d/entity db [:block/uuid view-uuid])]
      (let [stored-feature-type (:logseq.property.view/feature-type view)
            owner (require-view-owner! feature-type
                                       (:logseq.property/view-for view)
                                       view-uuid)]
        (when (and stored-feature-type
                   (not= stored-feature-type feature-type))
          (common/fail! "View resource feature does not match its definition"
                        {:view-uuid view-uuid
                         :feature-type feature-type
                         :stored-feature-type stored-feature-type}))
        (let [query-row-uuids (:query-row-uuids context)]
          (when-not (= (= :query-result feature-type)
                       (contains? context :query-row-uuids))
            (common/fail! "Invalid query-result view rows"
                          {:feature-type feature-type
                           :query-row-uuids query-row-uuids})))
        (let [config (effective-view-config view context)
              query-entity-ids (mapv (fn [block-uuid]
                                       (:db/id (common/entity-by-uuid! db
                                                                      :query-row-uuid
                                                                      block-uuid)))
                                     (:query-row-uuids context))
              option (cond-> (-> context
                                 (dissoc :feature-type :query-row-uuids
                                         :initial-row-count :row-offset)
                                 (assoc :view-feature-type feature-type))
                       owner (assoc :view-for-id (:db/id owner))
                       (= :query-result feature-type)
                       (assoc :query-entity-ids query-entity-ids)
                       (:initial-row-count context)
                       (assoc :row-limit (:initial-row-count context))
                       (contains? context :row-offset)
                       (assoc :row-offset (:row-offset context)))
              result (db-view/get-view-data db (:db/id view) option)
              value (normalize-view-data db result
                                         (some? (:group-by-property-ident config)))
              include-row-previews? (and (:initial-row-count context)
                                         (= :flat (:partition value)))
              value (cond-> value
                      include-row-previews?
                      (assoc :row-previews (first-window-row-previews db (:rows value))))
              value-partition (:partition value)]
          [(cond-> (view-watch-keys db view-uuid owner feature-type config value-partition)
             include-row-previews? (conj [:attr :block/title]))
           value]))
      (missing-view-data view-uuid))))

(def resource-renderers
  {:views (common/renderer 3 views)
   :view-data (common/renderer 3 view-data)})
