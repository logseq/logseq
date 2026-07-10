(ns frontend.db.async
  "Async queries"
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cljs-time.format :as tf]
            [frontend.date :as date]
            [frontend.db.async.util :as db-async-util]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(def ^:private yyyyMMdd-formatter (tf/formatter "yyyyMMdd"))

(def <q db-async-util/<q)

(defn <invoke-db-worker
  [api & args]
  (apply state/<invoke-db-worker api args))

(defn <get-all-properties-from-worker
  [graph opts]
  (<invoke-db-worker :thread-api/get-all-properties graph opts))

(defn <get-class-objects-from-worker
  [graph class-id]
  (<invoke-db-worker :thread-api/get-class-objects graph class-id))

(defn <get-date-scheduled-or-deadlines-from-worker
  [graph start-time end-time]
  (<invoke-db-worker :thread-api/get-date-scheduled-or-deadlines graph start-time end-time))

(defn <get-today-journal-title
  [graph]
  (<invoke-db-worker :thread-api/get-today-journal-title
                     graph
                     (date/today-journal-day)
                     (date/today)))

(defn <get-date-formatter
  [graph]
  (<invoke-db-worker :thread-api/get-date-formatter graph "MMM do, yyyy"))

(defn <get-journal-page-title
  [graph journal-title]
  (<invoke-db-worker :thread-api/get-journal-page-title
                     graph
                     (date/journal-title->int journal-title)
                     journal-title))

(defn <get-journal-page-by-day
  [graph journal-day]
  (<invoke-db-worker :thread-api/get-journal-page-by-day graph journal-day))

(defn <get-latest-journals
  [graph n]
  (<invoke-db-worker :thread-api/get-latest-journals graph n))

(defn <get-block-by-page-name-and-block-route-name
  [graph page-id-name-or-uuid route-name]
  (<invoke-db-worker :thread-api/get-block-by-page-name-and-block-route-name graph page-id-name-or-uuid route-name))

(defn <get-file-content
  [graph path]
  (<invoke-db-worker :thread-api/get-file-content graph path))

(defn <page-exists?
  [graph page-name tags]
  (<invoke-db-worker :thread-api/page-exists? graph page-name tags))

(defn <get-case-page
  [graph page-name-or-uuid]
  (<invoke-db-worker :thread-api/get-case-page graph page-name-or-uuid))

(defn <get-tags-by-name
  [graph name]
  (<invoke-db-worker :thread-api/get-tags-by-name graph name))

(defn <resolve-query-inputs
  [graph inputs opts]
  (<invoke-db-worker :thread-api/resolve-query-inputs graph inputs opts))

(defn <get-block-parent
  [graph block-uuid]
  (<invoke-db-worker :thread-api/get-block-parent graph block-uuid))

(defn <get-block-page-info
  [graph block-ref]
  (<invoke-db-worker :thread-api/get-block-page-info graph block-ref))

(defn <get-block-immediate-children
  [graph block-uuid]
  (<invoke-db-worker :thread-api/get-block-immediate-children graph block-uuid))

(defn <get-block-sibling
  [graph block-id direction]
  (<invoke-db-worker :thread-api/get-block-sibling graph block-id direction))

(defn <get-comments-area-block
  [graph block-ref]
  (<invoke-db-worker :thread-api/get-comments-area-block graph block-ref))

(defn <resolve-comments-area
  [graph block-ref]
  (<invoke-db-worker :thread-api/resolve-comments-area graph block-ref))

(defn <resolve-comments-area-for-blocks
  [graph block-refs]
  (<invoke-db-worker :thread-api/resolve-comments-area-for-blocks graph block-refs))

(defn <get-comment-delete-targets
  [graph comment-block-ref]
  (<invoke-db-worker :thread-api/get-comment-delete-targets graph comment-block-ref))

(defn <get-comment-threads-for-block
  [graph block-uuid]
  (<invoke-db-worker :thread-api/get-comment-threads-for-block graph block-uuid))

(defn <get-comment-thread-block-uuids
  [graph block-uuids]
  (<invoke-db-worker :thread-api/get-comment-thread-block-uuids graph block-uuids))

(defn <get-page-blocks-tree
  [graph page-id-name-or-uuid]
  (<invoke-db-worker :thread-api/get-page-blocks-tree graph page-id-name-or-uuid))

(defn <get-block-class-default-properties
  [graph block-id]
  (<invoke-db-worker :thread-api/get-block-class-default-properties graph block-id))

(defn <get-all-classes
  [graph opts]
  (<invoke-db-worker :thread-api/get-all-classes graph opts))

(defn <get-structured-children
  [graph class-id]
  (<invoke-db-worker :thread-api/get-structured-children graph class-id))

(defn <get-class-extends-children-tree
  [graph class-id]
  (<invoke-db-worker :thread-api/get-class-extends-children-tree graph class-id))

(defn <get-alias-source-page
  [graph page-id]
  (<invoke-db-worker :thread-api/get-alias-source-page graph page-id))

(defn <get-property-closed-values
  [graph property-ident]
  (<invoke-db-worker :thread-api/get-property-closed-values graph property-ident))

(defn <get-files
  [graph]
  (p/let [result (<q graph
                     {:transact-db? false}
                     '[:find [(pull ?file [:file/path :file/last-modified-at]) ...]
                       :where
                       [?file :file/path ?path]])]
    (->> result seq reverse (map #(vector (:file/path %) (or (:file/last-modified-at %) 0))))))

(defn <get-all-properties
  "Returns all public properties as property maps including their
  :block/title and :db/ident"
  [& {:as opts}]
  (when-let [graph (state/get-current-repo)]
    (<get-all-properties-from-worker graph opts)))

(defn <get-property-values
  "For db graphs, returns a vec of property value maps for given property
  db-ident.  The map contains a :label key which can be a string or number (for
  query builder) and a :value key which contains the entity or scalar property value"
  [property-id & {:as opts}]
  (when property-id
    (state/<invoke-db-worker :thread-api/get-property-values (state/get-current-repo)
                             (assoc opts :property-ident property-id))))

(defn <get-bidirectional-properties
  [target-id]
  (when target-id
    (state/<invoke-db-worker :thread-api/get-bidirectional-properties (state/get-current-repo)
                             {:target-id target-id})))

(defn <get-display-properties
  [repo block opts show-empty-and-hidden-properties?]
  (when (and repo (:db/id block))
    (state/<invoke-db-worker :thread-api/get-display-properties repo
                             {:block block
                              :opts opts
                              :show-empty-and-hidden-properties? show-empty-and-hidden-properties?})))

(defn <reorder-display-property!
  [repo block active-id over-id direction property-idents]
  (when (and repo (:db/id block) active-id over-id direction)
    (state/<invoke-db-worker :thread-api/reorder-display-property repo
                             {:block-id (:db/id block)
                              :active-ident (keyword active-id)
                              :over-ident (keyword over-id)
                              :direction direction
                              :property-idents property-idents})))

(defn- worker-get-blocks-requests
  [requests]
  (mapv (fn [{:keys [id opts]}]
          {:id id
           :opts (select-keys opts [:children? :properties :include-collapsed-children?])})
        requests))

(defn- <invoke-worker-get-blocks
  [graph requests]
  (p/let [result-transit-str
          (state/<invoke-db-worker :thread-api/get-blocks
                                   graph
                                   (ldb/write-transit-str requests))]
    (some-> result-transit-str ldb/read-transit-str)))

(defonce ^:private *get-blocks-batch-enabled? (atom true))

(defonce ^:private *get-blocks-batch-state
  (atom {:scheduled? false
         :queue []}))

(declare flush-get-blocks-batch!)

(defn- schedule-get-blocks-batch-flush!
  []
  (let [should-schedule? (not (:scheduled? @*get-blocks-batch-state))]
    (when should-schedule?
      (swap! *get-blocks-batch-state assoc :scheduled? true)
      (util/schedule flush-get-blocks-batch!))))

(defn- enqueue-get-blocks-request!
  [graph request]
  (let [result (p/deferred)]
    (swap! *get-blocks-batch-state
           (fn [state]
             (update state :queue conj {:graph graph
                                        :request request
                                        :result result})))
    (schedule-get-blocks-batch-flush!)
    result))

(defn- resolve-batched-get-blocks!
  [entries responses]
  (doseq [[idx {:keys [result]}] (map-indexed vector entries)]
    (p/resolve! result (nth responses idx nil))))

(defn- reject-batched-get-blocks!
  [entries error]
  (doseq [{:keys [result]} entries]
    (p/reject! result error)))

(defn- flush-get-blocks-batch!
  []
  (let [queue (:queue @*get-blocks-batch-state)]
    (swap! *get-blocks-batch-state
           (fn [state] (assoc state :scheduled? false :queue [])))
    (doseq [[graph entries] (group-by :graph queue)]
      (let [requests (->> entries (map :request) worker-get-blocks-requests)]
        (->
         (p/let [result (<invoke-worker-get-blocks graph requests)
                 result (if (= (count result) (count requests))
                          result
                          nil)
                 result (or result
                            ;; Safety fallback: retry once if response length is unexpected.
                            (<invoke-worker-get-blocks graph requests))]
           (resolve-batched-get-blocks! entries result))
         (p/catch (fn [error]
                    (reject-batched-get-blocks! entries error))))))))

(defn- <fetch-blocks-from-worker-batched
  [graph requests]
  (when (seq requests)
    (if @*get-blocks-batch-enabled?
      (-> (p/all (mapv #(enqueue-get-blocks-request! graph %) requests))
          (p/catch (fn [_]
                     ;; Fail-open: disable batching for this runtime and fall back to direct fetch.
                     (reset! *get-blocks-batch-enabled? false)
                     (<invoke-worker-get-blocks graph (worker-get-blocks-requests requests)))))
      (<invoke-worker-get-blocks graph (worker-get-blocks-requests requests)))))

(defn <get-block
  [graph id-uuid-or-name & {:keys [children?]
                            :or {children? true}
                            :as opts}]

  ;; (prn :debug :<get-block id-uuid-or-name :children? children? :properties properties)
  ;; (js/console.trace)
  (let [name' (str id-uuid-or-name)
        opts (assoc opts :children? children?)
        id (if (util/uuid-string? name') name' id-uuid-or-name)]
    (->
     (p/let [result (<fetch-blocks-from-worker-batched graph [{:id id :opts opts}])]
       (:block (first result)))
     (p/catch (fn [error]
                (js/console.error error)
                (throw (ex-info "get-block error" {:block id-uuid-or-name})))))))

(defn <get-block-with-children
  [graph id-uuid-or-name & {:keys [children?]
                            :or {children? true}
                            :as opts}]
  (let [name' (str id-uuid-or-name)
        opts (assoc opts :children? children?)
        id (if (util/uuid-string? name') name' id-uuid-or-name)]
    (->
     (p/let [result (<fetch-blocks-from-worker-batched graph [{:id id :opts opts}])]
       (first result))
     (p/catch (fn [error]
                (js/console.error error)
                (throw (ex-info "get-block-with-children error" {:block id-uuid-or-name})))))))

(defn <get-blocks
  [graph ids* & {:as opts}]
  (when (seq ids*)
    (<fetch-blocks-from-worker-batched graph
                                      (mapv (fn [id]
                                              {:id id :opts (assoc opts :children? false)})
                                            ids*))))

(defn <get-block-parents
  [graph id depth]
  (assert (integer? id))
  (<invoke-db-worker :thread-api/get-block-parents graph id depth))

(defn <get-block-source
  [graph id]
  (assert (integer? id))
  (p/let [source-id (state/<invoke-db-worker :thread-api/get-block-source graph id)]
    (when source-id
      (<get-block graph source-id {:children? false}))))

(defn <get-block-refs
  [graph eid]
  (assert (integer? eid))
  (state/<invoke-db-worker :thread-api/get-block-refs graph eid))

(defn <get-block-refs-count
  [graph eid]
  (assert (integer? eid))
  (state/<invoke-db-worker :thread-api/get-block-refs-count graph eid))

(defn <get-date-scheduled-or-deadlines
  [journal-title]
  (when-let [date (date/journal-title->int journal-title)]
    (let [future-days (state/get-scheduled-future-days)
          current-day (tf/parse yyyyMMdd-formatter (str date))
          future-date (t/plus current-day (t/days future-days))
          future-day (some->> future-date
                              (tf/unparse yyyyMMdd-formatter)
                              (parse-long))
          start-time (date/journal-day->utc-ms date)
          future-time (tc/to-long future-date)]
      (when-let [repo (and future-day (state/get-current-repo))]
        (<get-date-scheduled-or-deadlines-from-worker repo start-time future-time)))))

(defn <get-tag-objects
  [graph class-id]
  (<get-class-objects-from-worker graph class-id))

(defn <get-views
  [graph class-id view-feature-type]
  (<q graph {:transact-db? true}
      '[:find [(pull ?b [*]) ...]
        :in $ ?class-id ?view-feature-type
        :where
        [?b :logseq.property/view-for ?class-id]
        [?b :logseq.property.view/feature-type ?view-feature-type]]
      class-id
      view-feature-type))

(defn <get-asset-with-checksum
  [graph checksum]
  (p/let [result (<q graph {:transact-db? false}
                     '[:find [(pull ?b [*]) ...]
                       :in $ ?checksum
                       :where
                       [?b :logseq.property.asset/checksum ?checksum]]
                     checksum)]
    (first result)))

(defn <get-block-properties-history
  [graph block-id]
  (p/let [result (<q graph {:transact-db? false}
                     '[:find [(pull ?b [*]) ...]
                       :in $ ?block-id
                       :where
                       [?b :logseq.property.history/block ?block-id]]
                     block-id)]
    (sort-by :block/created-at result)))

(defn <task-spent-time
  [graph block-id]
  (<invoke-db-worker :thread-api/task-spent-time graph block-id))
