(ns frontend.worker.handler.render-resource
  "Explicit plain resources used by renderer subscriptions."
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [frontend.common.reaction :as reaction]
            [frontend.common.thread-api :refer [def-thread-api]]
            [frontend.worker.handler.block :as block-handler]
            [frontend.worker.handler.comments :as comments-handler]
            [frontend.worker.handler.page :as worker-page]
            [frontend.worker.handler.property :as property-handler]
            [frontend.worker.handler.query :as query-handler]
            [frontend.worker.handler.search :as search-handler]
            [frontend.worker.query-dsl :as query-dsl]
            [frontend.worker.state :as worker-state]
            [lambdaisland.glogi :as log]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.common.view :as db-view]
            [logseq.db.frontend.class :as db-class]
            [logseq.outliner.tree :as otree]
            [sci.core :as sci]))

(defn- fail!
  [message data]
  (throw (ex-info message data)))

(defn- function-bearing?
  [value]
  (cond
    (fn? value)
    true

    (de/entity? value)
    false

    (map? value)
    (or (some function-bearing? (keys value))
        (some function-bearing? (vals value)))

    (coll? value)
    (some function-bearing? value)

    :else
    false))

(defn- entity-bearing?
  [value]
  (cond
    (de/entity? value)
    true

    (map? value)
    (or (some entity-bearing? (keys value))
        (some entity-bearing? (vals value)))

    (coll? value)
    (some entity-bearing? value)

    :else
    false))

(defn- require-shape!
  [resource-key tag size]
  (when-not (and (vector? resource-key)
                 (= tag (first resource-key))
                 (= size (count resource-key)))
    (fail! "Invalid renderer resource key"
           {:resource-key resource-key
            :expected-tag tag
            :expected-size size})))

(defn- require-uuid!
  [label value]
  (when-not (uuid? value)
    (fail! "Invalid renderer resource UUID" {label value}))
  value)

(defn- entity-by-uuid!
  [db label value]
  (require-uuid! label value)
  (or (d/entity db [:block/uuid value])
      (fail! "Missing renderer resource entity" {label value})))

(defn- entity-uuid!
  [db eid]
  (let [block-uuid (:block/uuid (d/entity db eid))]
    (when-not (uuid? block-uuid)
      (fail! "Renderer resource row has no UUID" {:db-id eid}))
    block-uuid))

(defn- basis-rev
  [db]
  (let [rev (:max-tx db)]
    (when-not (and (integer? rev) (not (neg? rev)))
      (fail! "Invalid renderer resource revision" {:basis-rev rev}))
    rev))

(defn- envelope
  [db resource-key watch-keys value]
  {:basis-rev (basis-rev db)
   :key resource-key
   :watch-keys watch-keys
   :value value})

(defn- page-identity
  [db resource-key]
  (require-shape! resource-key :page-identity 2)
  (let [lookup (second resource-key)]
    (when-not (or (uuid? lookup)
                  (and (string? lookup) (not (string/blank? lookup))))
      (fail! "Invalid page identity lookup" {:lookup lookup}))
    (let [watch-lookup (if (string? lookup)
                         (common-util/page-name-sanity-lc lookup)
                         lookup)]
      [#{[:page-lookup watch-lookup]}
       (some-> (ldb/get-page db lookup) :block/uuid)])))

(defn- page-preview-source
  [db resource-key]
  (require-shape! resource-key :page-preview-source 2)
  (let [page-uuid (require-uuid! :page-uuid (second resource-key))
        page (entity-by-uuid! db :page-uuid page-uuid)
        source (or (ldb/get-alias-source-page db (:db/id page)) page)]
    [#{[:entity page-uuid]
       [:attr :block/alias]}
     (entity-uuid! db (:db/id source))]))

(defn- breadcrumb-ref-titles
  [entities]
  (into {}
        (comp
         (mapcat :block/refs)
         (keep (fn [ref]
                 (when-let [ref-uuid (:block/uuid ref)]
                   (let [title (:block/title ref)]
                     (when-not (string? title)
                       (fail! "Invalid breadcrumb reference title"
                              {:ref-uuid ref-uuid
                               :title title}))
                     [ref-uuid title])))))
        entities))

(defn- block-breadcrumb
  [db resource-key]
  (require-shape! resource-key :block-breadcrumb 3)
  (let [[_ block-uuid load-depth] resource-key
        block (entity-by-uuid! db :block-uuid block-uuid)]
    (when-not (and (integer? load-depth) (pos? load-depth))
      (fail! "Invalid breadcrumb load depth" {:load-depth load-depth}))
    (let [parents (vec (ldb/get-block-parents db block-uuid {:depth load-depth}))
          page (:block/page block)
          ancestor-blocks (if (and page
                                   (not= (:db/id page) (:db/id (first parents))))
                            (into [page] parents)
                            parents)
          from-property (:logseq.property/created-from-property block)
          ancestor-blocks (cond-> ancestor-blocks
                                 from-property
                                 (conj from-property))
          ancestor-uuids (mapv (fn [ancestor]
                                 (entity-uuid! db (:db/id ancestor)))
                               ancestor-blocks)
          ref-titles (breadcrumb-ref-titles (into [block] ancestor-blocks))
          watch-uuids (into (conj (set ancestor-uuids) block-uuid)
                            (keys ref-titles))
          watch-keys (into #{}
                           (map (fn [watch-uuid]
                                  [:entity watch-uuid]))
                           watch-uuids)]
      [watch-keys
       {:target-uuid block-uuid
        :ancestor-uuids ancestor-uuids
        :ref-titles ref-titles}])))

(defn- journals
  [db resource-key]
  (require-shape! resource-key :journals 1)
  [#{[:journals]}
   (mapv :block/uuid (ldb/get-latest-journals db))])

(defn- collect-flat-journal
  [db root-uuid]
  (loop [pending [root-uuid]
         seen #{}
         children {}]
    (if-let [parent-uuid (peek pending)]
      (let [pending (pop pending)]
        (if (contains? seen parent-uuid)
          (recur pending seen children)
          (let [membership (block-handler/direct-children-membership db parent-uuid)
                child-uuids (mapv first (:items membership))]
            (recur (into pending child-uuids)
                   (conj seen parent-uuid)
                   (assoc children parent-uuid
                          (dissoc membership :basis-rev))))))
      {:root-uuid root-uuid
       :blocks (:blocks (block-handler/canonical-blocks db (vec seen)))
       :children children})))

(defn- journal-bundle
  [db resource-key]
  (require-shape! resource-key :journal-bundle 2)
  (let [journal-uuid (require-uuid! :journal-uuid (second resource-key))]
    [#{} (collect-flat-journal db journal-uuid)]))

(defn- block-reactions
  [db resource-key]
  (require-shape! resource-key :block-reactions 3)
  (let [[_ target-uuid current-user-uuid] resource-key
        target (entity-by-uuid! db :target-uuid target-uuid)]
    (when-not (or (nil? current-user-uuid) (uuid? current-user-uuid))
      (fail! "Invalid reaction user UUID" {:current-user-uuid current-user-uuid}))
    (let [reactions (block-handler/block-reactions db (:db/id target))
          watch-keys (into #{[:reactions target-uuid]}
                           (keep (fn [item]
                                   (when-let [creator-uuid
                                              (get-in item [:logseq.property/created-by-ref
                                                            :block/uuid])]
                                     [:entity creator-uuid])))
                           reactions)]
      [watch-keys (reaction/summarize reactions current-user-uuid)])))

(def ^:private display-context-keys
  #{:gallery-view?
    :page-title?
    :sidebar-properties?
    :tag-dialog?
    :publishing?
    :state-hide-empty-properties?
    :show-empty-and-hidden-properties?})

(defn- require-display-context!
  [context]
  (when-not (and (map? context)
                 (= display-context-keys (set (keys context)))
                 (every? boolean? (vals context)))
    (fail! "Invalid block display properties context" {:context context}))
  context)

(defn- normalize-entity-value
  [value]
  (cond
    (and (map? value) (uuid? (:block/uuid value)))
    (:block/uuid value)

    (set? value)
    (into #{} (map normalize-entity-value) value)

    (vector? value)
    (mapv normalize-entity-value value)

    (and (sequential? value) (not (string? value)))
    (mapv normalize-entity-value value)

    (map? value)
    (fail! "Renderer property value has no UUID" {:value value})

    :else
    value))

(defn- value-uuids
  [value]
  (cond
    (uuid? value)
    #{value}

    (and (map? value) (uuid? (:block/uuid value)))
    #{(:block/uuid value)}

    (coll? value)
    (into #{} (mapcat value-uuids) value)

    :else
    #{}))

(defn- normalize-display-property-row
  [{:keys [property value]}]
  (let [property-uuid (require-uuid! :property-uuid (:block/uuid property))
        property-ident (:db/ident property)
        closed-value-uuids
        (mapv (fn [closed-value]
                (require-uuid! :closed-value-uuid
                               (:block/uuid closed-value)))
              (:property/closed-values property))]
    (when-not (keyword? property-ident)
      (fail! "Renderer property has no ident" {:property-uuid property-uuid}))
    {:property-uuid property-uuid
     :property-ident property-ident
     :value (normalize-entity-value value)
     :closed-value-uuids closed-value-uuids}))

(defn- display-row-watch-keys
  [{:keys [property value]}]
  (let [property-uuid (require-uuid! :property-uuid (:block/uuid property))
        closed-value-uuids (keep :block/uuid
                                 (:property/closed-values property))]
    (into #{[:entity property-uuid]}
          (map (fn [block-uuid] [:entity block-uuid]))
          (concat (value-uuids value) closed-value-uuids))))

(defn- optional-entity-uuid
  [label entity]
  (when entity
    (require-uuid! label (:block/uuid entity))))

(defn- block-display-properties
  [db resource-key]
  (require-shape! resource-key :block-display-properties 3)
  (let [[_ block-uuid context] resource-key
        block (entity-by-uuid! db :block-uuid block-uuid)
        context (require-display-context! context)
        show-empty-and-hidden-properties?
        (:show-empty-and-hidden-properties? context)
        result (property-handler/display-properties
                db
                block
                (dissoc context :show-empty-and-hidden-properties?)
                show-empty-and-hidden-properties?)
        rows (concat (:full-properties result)
                     (:hidden-properties result))
        watch-keys (reduce into
                           #{[:display-properties block-uuid]
                             [:property-membership :block/closed-value-property]}
                           (map display-row-watch-keys rows))]
    [watch-keys
     {:full-properties
      (mapv normalize-display-property-row (:full-properties result))
      :hidden-properties
      (mapv normalize-display-property-row (:hidden-properties result))
      :description-property-uuid
      (optional-entity-uuid :description-property-uuid
                            (:description-property result))
      :class-properties-property-uuid
      (optional-entity-uuid :class-properties-property-uuid
                            (:class-properties-property result))}]))

(defn- property-uuid!
  [property]
  (require-uuid! :property-uuid (:block/uuid property)))

(defn- block-positioned-properties
  [db resource-key]
  (require-shape! resource-key :block-positioned-properties 3)
  (let [[_ block-uuid position] resource-key
        block (entity-by-uuid! db :block-uuid block-uuid)]
    (when-not (contains? (set property-handler/render-property-positions)
                         position)
      (fail! "Invalid block property position" {:position position}))
    (let [properties (property-handler/block-positioned-properties
                      db (:db/id block) position)
          candidate-properties
          (keep #(d/entity db %)
                (property-handler/direct-block-property-ids db (:db/id block)))
          property-uuids (mapv property-uuid! properties)
          watch-uuids (into (set property-uuids)
                            (map property-uuid!)
                            candidate-properties)]
      [(into #{[:entity block-uuid]}
             (map (fn [property-uuid] [:entity property-uuid]))
             watch-uuids)
       property-uuids])))

(defn- block-bidirectional-properties
  [db resource-key]
  (require-shape! resource-key :block-bidirectional-properties 2)
  (let [block-uuid (second resource-key)
        block (entity-by-uuid! db :block-uuid block-uuid)
        groups (ldb/get-bidirectional-properties db (:db/id block))]
    [#{[:bidirectional block-uuid]}
     (mapv (fn [{:keys [class entities]}]
             {:class-uuid (require-uuid! :class-uuid (:block/uuid class))
              :entity-uuids (mapv #(require-uuid! :entity-uuid
                                                 (:block/uuid %))
                                  entities)})
           groups)]))

(defn- block-ref-count
  [db resource-key]
  (require-shape! resource-key :block-ref-count 2)
  (let [block-uuid (second resource-key)
        block (entity-by-uuid! db :block-uuid block-uuid)]
    [#{[:refs block-uuid]}
     (ldb/get-block-refs-count db (:db/id block))]))

(defn- block-unlinked-ref-exists
  [db resource-key {:keys [repo]}]
  (require-shape! resource-key :block-unlinked-ref-exists 2)
  (let [block-uuid (second resource-key)
        block (entity-by-uuid! db :block-uuid block-uuid)]
    [#{}
     (block-handler/unlinked-reference-exists? db repo (:db/id block))]))

(defn- block-comment-threads
  [db resource-key]
  (require-shape! resource-key :block-comment-threads 2)
  (let [block-uuid (second resource-key)]
    (entity-by-uuid! db :block-uuid block-uuid)
    [#{[:comments block-uuid]}
     (->> (comments-handler/get-comment-threads-for-block db block-uuid)
          ldb/sort-by-order
          (mapv #(require-uuid! :comment-thread-uuid
                                (:block/uuid %))))]))

(defn- block-task-time
  [db resource-key]
  (require-shape! resource-key :block-task-time 2)
  (let [block-uuid (second resource-key)
        block (entity-by-uuid! db :block-uuid block-uuid)
        [history seconds]
        (or (query-handler/task-spent-time db (:db/id block)
                                           (common-util/time-ms))
            [[] 0])]
    [#{[:task-time block-uuid]}
     {:history
      (mapv (fn [item]
              {:created-at (:block/created-at item)
               :status-uuid
               (require-uuid!
                :status-uuid
                (:logseq.property.history/ref-value-uuid item))})
            history)
      :seconds seconds}]))

(defn- route-block
  [db resource-key]
  (require-shape! resource-key :route-block 3)
  (let [[_ page-lookup route-name] resource-key]
    (when-not (and (string? page-lookup) (not (string/blank? page-lookup)))
      (fail! "Invalid route page lookup" {:page-lookup page-lookup}))
    (when-not (and (string? route-name) (not (string/blank? route-name)))
      (fail! "Invalid block route name" {:route-name route-name}))
    (let [normalized-page-lookup (common-util/page-name-sanity-lc page-lookup)
          {:keys [page candidates block]}
          (worker-page/block-route-resolution db page-lookup route-name)
          page-uuid (when page
                      (require-uuid! :page-uuid (:block/uuid page)))
          block-uuid (when block
                       (require-uuid! :route-block-uuid (:block/uuid block)))
          referenced-uuids
          (into #{}
                (comp
                 (mapcat #(concat (:block/tags %) (:block/refs %)))
                 (map (fn [reference]
                        (require-uuid! :route-reference-uuid
                                       (:block/uuid reference)))))
                candidates)
          watch-keys
          (if page
            (into #{[:page-lookup normalized-page-lookup]
                    [:entity page-uuid]
                    [:route-page page-uuid]}
                  (map (fn [reference-uuid]
                         [:entity reference-uuid]))
                  referenced-uuids)
            #{[:page-lookup normalized-page-lookup]})]
      [watch-keys block-uuid])))

(defn- direct-child-entities
  [db page-uuid]
  (mapv (fn [[child-uuid]]
          (entity-by-uuid! db :child-uuid child-uuid))
        (:items (block-handler/direct-children-membership db page-uuid))))

(defn- comment-thread?
  [entity]
  (boolean
   (some #(= :logseq.class/Comments (:db/ident %))
         (:block/tags entity))))

(defn- comment-author-title
  [comment-block]
  (some-> comment-block
          :logseq.property/created-by-ref
          :block/title
          string/trim
          not-empty))

(defn- comment-author-uuid
  [comment-block]
  (when-let [author (:logseq.property/created-by-ref comment-block)]
    (require-uuid! :comment-author-uuid (:block/uuid author))))

(defn- block-comment-summary
  [db resource-key]
  (require-shape! resource-key :block-comment-summary 2)
  (let [thread-uuid (second resource-key)
        thread (entity-by-uuid! db :thread-uuid thread-uuid)]
    (when-not (comment-thread? thread)
      (fail! "Renderer resource entity is not a comment thread"
             {:thread-uuid thread-uuid}))
    (let [comments (direct-child-entities db thread-uuid)
          _ (doseq [comment-block comments]
              (when-not (or (nil? (:block/created-at comment-block))
                            (number? (:block/created-at comment-block)))
                (fail! "Invalid comment creation time"
                       {:comment-uuid (:block/uuid comment-block)
                        :created-at (:block/created-at comment-block)})))
          latest (last (sort-by #(or (:block/created-at %) 0) comments))
          watch-uuids (concat [thread-uuid]
                              (map :block/uuid comments)
                              (keep comment-author-uuid comments))
          watch-keys (into #{[:children thread-uuid]}
                           (map (fn [watch-uuid]
                                  [:entity watch-uuid]))
                           watch-uuids)]
      [watch-keys
       {:count (count comments)
        :latest-author (comment-author-title latest)
        :latest-created-at (:block/created-at latest)}])))

(defn- tagged-with-page?
  [child page-id]
  (some #(= page-id (:db/id %)) (:block/tags child)))

(defn- page-membership
  [db resource-key]
  (let [[_ page-uuid membership-kind current-user-uuid] resource-key
        page (entity-by-uuid! db :page-uuid page-uuid)
        children (direct-child-entities db page-uuid)]
    (case membership-kind
      :class
      (do
        (require-shape! resource-key :page-membership 3)
        (when-not (ldb/class? page)
          (fail! "Page membership target is not a class" {:page-uuid page-uuid}))
        [#{[:entity page-uuid]
           [:children page-uuid]
           [:class-membership page-uuid]}
         (->> children
              (remove #(tagged-with-page? % (:db/id page)))
              (mapv :block/uuid))])

      :property
      (do
        (require-shape! resource-key :page-membership 3)
        (when-not (ldb/property? page)
          (fail! "Page membership target is not a property"
                 {:page-uuid page-uuid}))
        (let [property-ident (:db/ident page)]
          [#{[:entity page-uuid]
             [:children page-uuid]
             [:property-membership property-ident]}
           (->> children
                (remove #(some? (property-handler/entity-direct-value
                                 db (:db/id %) property-ident)))
                (mapv :block/uuid))]))

      :quick-add
      (do
        (require-shape! resource-key :page-membership 4)
        (when-not (= common-config/quick-add-page-name (:block/title page))
          (fail! "Page membership target is not quick add"
                 {:page-uuid page-uuid}))
        (let [current-user
              (entity-by-uuid! db :current-user-uuid current-user-uuid)
              current-user-id (:db/id current-user)]
          [#{[:entity page-uuid] [:graph]}
           (->> children
                (filter (fn [child]
                          (let [creator-id
                                (property-handler/entity-direct-value
                                 db child :logseq.property/created-by-ref)]
                            (or (nil? creator-id)
                                (= current-user-id creator-id)))))
                (mapv :block/uuid))]))

      (fail! "Unsupported page membership kind"
             {:membership-kind membership-kind
              :resource-key resource-key}))))

(def ^:private view-eids-query
  '[:find [?view ...]
    :in $ ?owner ?feature-type
    :where
    [?view :logseq.property/view-for ?owner]
    [?view :logseq.property.view/feature-type ?feature-type]])

(defn- views
  [db resource-key]
  (require-shape! resource-key :views 3)
  (let [[_ owner-uuid feature-type] resource-key
        owner (entity-by-uuid! db :owner-uuid owner-uuid)]
    (when-not (keyword? feature-type)
      (fail! "Invalid view feature type" {:feature-type feature-type}))
    [#{resource-key}
     (->> (d/q view-eids-query db (:db/id owner) feature-type)
          (map #(d/entity db %))
          ldb/sort-by-order
          (mapv (fn [view]
                  (entity-uuid! db (:db/id view)))))]))

(defn- scope-uuids
  [db eids]
  (into #{} (map #(entity-uuid! db %)) (distinct eids)))

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
                 (or (not (contains? context :query-row-uuids))
                     (and (vector? (:query-row-uuids context))
                          (every? uuid? (:query-row-uuids context)))))
    (fail! "Invalid view resource context" {:context context}))
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
    (fail! "View resource has no owner"
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
          (fail! "View property owner has no ident"
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
    (entity-uuid! db row)

    (and (map? row) (uuid? (:block/uuid row)))
    (:block/uuid row)

    (and (map? row) (integer? (:db/id row)))
    (entity-uuid! db (:db/id row))

    (and (de/entity? row) (uuid? (:block/uuid row)))
    (:block/uuid row)

    :else
    (fail! "Unsupported view resource row" {:row row})))

(defn- normalize-group-value
  [value]
  (cond
    (nil? value)
    {:kind :empty}

    (and (or (map? value) (de/entity? value))
         (uuid? (:block/uuid value)))
    {:kind :entity :uuid (:block/uuid value)}

    (coll? value)
    (fail! "Unsupported view group value" {:value value})

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

(defn- normalize-flat-view-data
  [db result]
  {:partition :flat
   :count (:count result)
   :rows (mapv #(normalize-view-row db %) (:data result))})

(defn- normalize-grouped-view-data
  [db result]
  {:partition :grouped
   :count (:count result)
   :groups
   (mapv (fn [[value rows]]
           {:value (normalize-group-value value)
            :rows (mapv #(normalize-view-row db %) rows)})
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
                     :rows (mapv #(normalize-view-row db %) rows)})
                  partitions)})
         (:data result))})

(defn- normalize-view-data
  [db result grouped?]
  (when-not (map? result)
    (fail! "Invalid view resource result" {:result result}))
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
             (into #{} (map #(entity-uuid! db %)) ids)))

      (contains? result :properties)
      (assoc :properties (mapv identity (:properties result))))))

(defn- view-data
  [db resource-key]
  (require-shape! resource-key :view-data 3)
  (let [[_ view-uuid context] resource-key
        context (require-view-context! context)
        feature-type (:feature-type context)
        view (entity-by-uuid! db :view-uuid view-uuid)
        stored-feature-type (:logseq.property.view/feature-type view)
        owner (require-view-owner! feature-type
                                   (:logseq.property/view-for view)
                                   view-uuid)]
    (when (and stored-feature-type
               (not= stored-feature-type feature-type))
      (fail! "View resource feature does not match its definition"
             {:view-uuid view-uuid
              :feature-type feature-type
              :stored-feature-type stored-feature-type}))
    (let [query-row-uuids (:query-row-uuids context)]
      (when-not (= (= :query-result feature-type)
                   (contains? context :query-row-uuids))
        (fail! "Invalid query-result view rows"
               {:feature-type feature-type
                :query-row-uuids query-row-uuids})))
    (let [config (effective-view-config view context)
          query-entity-ids (mapv (fn [block-uuid]
                                   (:db/id (entity-by-uuid! db
                                                            :query-row-uuid
                                                            block-uuid)))
                                 (:query-row-uuids context))
          option (cond-> (-> context
                             (dissoc :feature-type :query-row-uuids)
                             (assoc :view-feature-type feature-type))
                   owner (assoc :view-for-id (:db/id owner))
                   (= :query-result feature-type)
                   (assoc :query-entity-ids query-entity-ids))
          result (db-view/get-view-data db (:db/id view) option)
          value (normalize-view-data db result
                                     (some? (:group-by-property-ident config)))
          value-partition (:partition value)]
      [(view-watch-keys db view-uuid owner feature-type config value-partition)
       value])))

(defn- normalize-query-cell
  [cell]
  (cond
    (and (or (map? cell) (de/entity? cell))
         (uuid? (:block/uuid cell)))
    (:block/uuid cell)

    (or (map? cell) (de/entity? cell))
    (fail! "Renderer query result map has no UUID" {:value cell})

    (fn? cell)
    (fail! "Renderer query result contains a function" {})

    (set? cell)
    (into #{} (map normalize-query-cell) cell)

    (vector? cell)
    (mapv normalize-query-cell cell)

    (and (sequential? cell) (not (string? cell)))
    (mapv normalize-query-cell cell)

    :else
    cell))

(defn- normalize-query-row
  [row]
  (let [tuple (if (vector? row) row [row])
        tuple (mapv normalize-query-cell tuple)]
    (if (= 1 (count tuple))
      (first tuple)
      tuple)))

(def ^:private query-common-keys
  #{:kind
    :query
    :current-page-title
    :current-block-uuid
    :today-day
    :remove-block-children?
    :result-transform-edn})

(def ^:private query-dsl-keys
  (conj query-common-keys :cards?))

(def ^:private query-datalog-keys
  (conj query-common-keys :inputs :rules))

(defn- valid-today-day?
  [value]
  (and (integer? value)
       (<= 10000101 value 99991231)))

(defn- require-query-spec!
  [query-spec]
  (let [kind (:kind query-spec)
        allowed-keys (case kind
                       :dsl query-dsl-keys
                       :datalog query-datalog-keys
                       nil)]
    (when-not (and (map? query-spec)
                   allowed-keys
                   (every? allowed-keys (keys query-spec))
                   (or (not (contains? query-spec :current-page-title))
                       (and (string? (:current-page-title query-spec))
                            (not (string/blank?
                                  (:current-page-title query-spec)))))
                   (or (not (contains? query-spec :current-block-uuid))
                       (uuid? (:current-block-uuid query-spec)))
                   (or (not (contains? query-spec :today-day))
                       (valid-today-day? (:today-day query-spec)))
                   (or (not (contains? query-spec :remove-block-children?))
                       (boolean? (:remove-block-children? query-spec)))
                   (or (not (contains? query-spec :result-transform-edn))
                       (and (string? (:result-transform-edn query-spec))
                            (not (string/blank?
                                  (:result-transform-edn query-spec)))))
                   (case kind
                     :dsl
                     (and (string? (:query query-spec))
                          (or (not (contains? query-spec :cards?))
                              (boolean? (:cards? query-spec))))

                     :datalog
                     (and (vector? (:query query-spec))
                          (= :find (first (:query query-spec)))
                          (or (not (contains? query-spec :inputs))
                              (vector? (:inputs query-spec)))
                          (or (not (contains? query-spec :rules))
                              (vector? (:rules query-spec))))

                     false))
      (fail! "Invalid renderer query resource" {:query-spec query-spec})))
  query-spec)

(defn- quoted-query-text
  [query-string]
  (when (re-matches #"^\".*\"$" query-string)
    (let [value (common-util/safe-read-string {:log-error? false}
                                              query-string)]
      (when (and (string? value) (not (string/blank? value)))
        (string/trim value)))))

(defn- execute-query-spec
  [db query-spec {:keys [repo]}]
  (case (:kind query-spec)
    :dsl
    (let [query-string (:query query-spec)]
      (cond
        (string/blank? query-string)
        []

        (quoted-query-text query-string)
        (let [query-text (quoted-query-text query-string)]
          (when-not repo
            (fail! "Full-text query resource requires repository" {}))
          (mapv vector
                (search-handler/search-blocks
                 repo query-text
                 {:limit 30
                  :feature/enable-semantic-search? false})))

        :else
        (query-dsl/execute-query
         query-string
         db
         {:cards? (:cards? query-spec)
          :current-page-title (:current-page-title query-spec)
          :today-day (:today-day query-spec)
          :block-attrs [:db/id :block/uuid
                        {:block/parent [:db/id]}]})))

    :datalog
    (query-handler/execute-custom-query
     db query-spec (assoc query-spec :require-today-day? true))))

(defn- query-tuples
  [result]
  (mapv (fn [row]
          (cond
            (vector? row) row
            (map? row) [row]
            (and (sequential? row) (not (string? row))) (vec row)
            :else [row]))
        result))

(defn- block-query-result?
  [tuples]
  (and (seq tuples)
       (every? (fn [tuple]
                 (and (= 1 (count tuple))
                      (let [value (first tuple)]
                        (and (or (map? value) (de/entity? value))
                             (uuid? (:block/uuid value))))))
               tuples)))

(defn- filter-block-query-result
  [blocks {:keys [current-block-uuid remove-block-children?]}]
  (let [blocks (->> blocks
                    (remove ldb/hidden?)
                    (remove #(= current-block-uuid (:block/uuid %))))]
    (if (or (false? remove-block-children?)
            (not-every? #(integer? (:db/id %)) blocks))
      blocks
      (otree/filter-top-level-blocks blocks))))

(defn- apply-result-transform
  [rows result-transform-edn]
  (if result-transform-edn
    (let [transform (sci/eval-string result-transform-edn)]
      (when-not (fn? transform)
        (fail! "Query result transform is not a function"
               {:result-transform-edn result-transform-edn}))
      (let [result (transform rows)]
        (when-not (or (sequential? result) (set? result))
          (fail! "Query result transform must return rows"
                 {:result result}))
        result))
    rows))

(defn- query-result-rows
  [result query-spec]
  (let [tuples (query-tuples result)
        rows (if (block-query-result? tuples)
               (filter-block-query-result (map first tuples) query-spec)
               tuples)
        rows (apply-result-transform rows (:result-transform-edn query-spec))]
    (mapv normalize-query-row rows)))

(defn- query
  [db resource-key runtime]
  (require-shape! resource-key :query 2)
  (let [query-spec (require-query-spec! (second resource-key))
        watch-keys (if (= :datalog (:kind query-spec))
                     (let [{:keys [attrs task-attrs tasks? opaque?]}
                           (query-handler/custom-query-watch-dependencies query-spec)
                           keys (cond-> (into #{} (map (fn [attr] [:attr attr])) attrs)
                                  (seq task-attrs)
                                  (into (map (fn [attr] [:task-attr attr])) task-attrs)
                                  tasks? (conj [:tasks]))]
                       (if (or opaque? (empty? keys))
                         #{[:graph]}
                         keys))
                     #{[:graph]})]
    [watch-keys
     {:rows (query-result-rows (execute-query-spec db query-spec runtime)
                               query-spec)}]))

(defn- resource-value
  [db resource-key runtime]
  (when-not (and (vector? resource-key) (seq resource-key))
    (fail! "Invalid renderer resource key" {:resource-key resource-key}))
  (when (function-bearing? resource-key)
    (fail! "Renderer resource keys cannot contain functions"
           {:resource-key resource-key}))
  (when (entity-bearing? resource-key)
    (fail! "Renderer resource keys cannot contain graph entities"
           {:resource-key resource-key}))
  (case (first resource-key)
    :page-identity (page-identity db resource-key)
    :page-preview-source (page-preview-source db resource-key)
    :block-breadcrumb (block-breadcrumb db resource-key)
    :journals (journals db resource-key)
    :journal-bundle (journal-bundle db resource-key)
    :block-reactions (block-reactions db resource-key)
    :block-display-properties (block-display-properties db resource-key)
    :block-positioned-properties (block-positioned-properties db resource-key)
    :block-bidirectional-properties (block-bidirectional-properties db resource-key)
    :block-ref-count (block-ref-count db resource-key)
    :block-unlinked-ref-exists (block-unlinked-ref-exists db resource-key runtime)
    :block-comment-threads (block-comment-threads db resource-key)
    :block-comment-summary (block-comment-summary db resource-key)
    :block-task-time (block-task-time db resource-key)
    :route-block (route-block db resource-key)
    :page-membership (page-membership db resource-key)
    :views (views db resource-key)
    :view-data (view-data db resource-key)
    :query (query db resource-key runtime)
    :block-sync-conflicts
    (fail! "Renderer resource belongs to a non-DB provider"
           {:provider :sync-state
            :resource-key resource-key})
    (fail! "Unknown renderer resource key"
           {:resource-key resource-key})))

(defn render-resource
  ([db resource-key]
   (render-resource db resource-key {}))
  ([db resource-key runtime]
   (let [[watch-keys value] (resource-value db resource-key runtime)]
     (envelope db resource-key watch-keys value))))

(def ^:private render-resource-batch-limit 25)

(defn- require-resource-keys!
  [resource-keys]
  (when-not (and (vector? resource-keys)
                 (seq resource-keys)
                 (<= (count resource-keys) render-resource-batch-limit)
                 (= (count resource-keys) (count (distinct resource-keys))))
    (fail! "Invalid renderer resource batch"
           {:resource-keys resource-keys
            :max-size render-resource-batch-limit}))
  resource-keys)

(defn render-resources
  ([db resource-keys]
   (render-resources db resource-keys {}))
  ([db resource-keys runtime]
   (require-resource-keys! resource-keys)
   {:basis-rev (basis-rev db)
    :resources
    (into {}
          (map (fn [resource-key]
                 (let [started-at (.now js/performance)
                       [watch-keys value] (resource-value db resource-key runtime)
                       completed-at (.now js/performance)]
                   (when (and goog.DEBUG (> (- completed-at started-at) 10))
                     (log/info :db-worker/render-resource-perf
                               {:resource-key resource-key
                                :elapsed-ms (- completed-at started-at)}))
                   [resource-key
                    {:watch-keys watch-keys
                     :value value}])))
          resource-keys)}))

(def-thread-api :thread-api/get-render-resources
  [repo resource-keys]
  (if-let [conn (worker-state/get-datascript-conn repo)]
    (render-resources @conn resource-keys {:repo repo})
    (fail! "Missing renderer resource database" {:repo repo})))
