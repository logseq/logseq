(ns frontend.db.async
  "Async queries"
  (:require [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [cljs-time.format :as tf]
            [datascript.core :as d]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.async.util :as db-async-util]
            [frontend.db.model :as db-model]
            [frontend.db.react :as react]
            [frontend.db.utils :as db-utils]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(def ^:private yyyyMMdd-formatter (tf/formatter "yyyyMMdd"))

(def <q db-async-util/<q)

(defonce ^:private *block-reactions-batch-state
  (atom {:scheduled? false
         :queue []}))

(def ^:private block-reactions-cache-ttl-ms 30000)
(defonce ^:private *block-reactions-cache (atom {}))

(declare flush-block-reactions-batch!)

(defn- fresh-block-reactions-cache-entry
  [cache-key]
  (when-let [{:keys [ts] :as entry} (get @*block-reactions-cache cache-key)]
    (when (< (- (util/time-ms) ts) block-reactions-cache-ttl-ms)
      entry)))

(defn- schedule-block-reactions-batch-flush!
  []
  (let [should-schedule? (not (:scheduled? @*block-reactions-batch-state))]
    (when should-schedule?
      (swap! *block-reactions-batch-state assoc :scheduled? true)
      (util/schedule flush-block-reactions-batch!))))

(defn- enqueue-block-reactions-request!
  [graph target-id]
  (let [result (p/deferred)]
    (swap! *block-reactions-batch-state
           (fn [state]
             (update state :queue conj {:graph graph
                                        :target-id target-id
                                        :result result})))
    (schedule-block-reactions-batch-flush!)
    result))

(defn- flush-block-reactions-batch!
  []
  (let [queue (:queue @*block-reactions-batch-state)]
    (swap! *block-reactions-batch-state
           (fn [state] (assoc state :scheduled? false :queue [])))
    (doseq [[graph entries] (group-by :graph queue)]
      (let [target-ids (->> entries (map :target-id) distinct vec)]
        (->
         (p/let [responses (state/<invoke-db-worker :thread-api/get-block-reactions graph target-ids)
                 reactions-by-target (zipmap target-ids responses)]
           (doseq [{:keys [target-id result]} entries]
             (p/resolve! result (get reactions-by-target target-id []))))
         (p/catch (fn [error]
                    (doseq [{:keys [result]} entries]
                      (p/reject! result error)))))))))

(defn- cache-block-reactions-response!
  [graph target-ids responses]
  (doseq [[target-id reactions] (map vector target-ids responses)]
    (swap! *block-reactions-cache assoc [graph target-id]
           {:value (or reactions [])
            :ts (util/time-ms)})))

(defn <get-block-reactions
  ([graph target-id]
   (<get-block-reactions graph target-id nil))
  ([graph target-id {:keys [refresh?]}]
   (when (and graph target-id)
     (let [cache-key [graph target-id]]
       (if-let [{:keys [value promise]} (when-not refresh?
                                          (fresh-block-reactions-cache-entry cache-key))]
         (or promise (p/resolved value))
         (let [promise (-> (enqueue-block-reactions-request! graph target-id)
                           (p/then (fn [value]
                                     (swap! *block-reactions-cache assoc cache-key
                                            {:value value
                                             :ts (util/time-ms)})
                                     value))
                           (p/catch (fn [error]
                                      (swap! *block-reactions-cache dissoc cache-key)
                                      (throw error))))]
           (swap! *block-reactions-cache assoc cache-key {:promise promise
                                                          :ts (util/time-ms)})
           promise))))))

(defn <prefetch-block-reactions
  [graph target-ids]
  (let [target-ids (->> target-ids
                        distinct
                        (remove #(fresh-block-reactions-cache-entry [graph %]))
                        vec)]
    (when (and graph (seq target-ids))
      (-> (p/let [responses (state/<invoke-db-worker :thread-api/get-block-reactions graph target-ids)]
            (cache-block-reactions-response! graph target-ids responses)
            responses)
          (p/catch (fn [error]
                     (doseq [target-id target-ids]
                       (swap! *block-reactions-cache dissoc [graph target-id]))
                     (throw error)))))))

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
    (db-model/get-all-properties graph opts)))

(defn <get-property-values
  "For db graphs, returns a vec of property value maps for given property
  db-ident.  The map contains a :label key which can be a string or number (for
  query builder) and a :value key which contains the entity or scalar property value"
  [property-id & {:as opts}]
  (when property-id
    (state/<invoke-db-worker :thread-api/get-property-values (state/get-current-repo)
                             (assoc opts :property-ident property-id))))

(def ^:private bidirectional-properties-cache-ttl-ms 30000)
(defonce ^:private *bidirectional-properties-cache (atom {}))

(defn <get-bidirectional-properties
  [target-id]
  (when-let [graph (and target-id (state/get-current-repo))]
    (let [cache-key [graph target-id]
          now (util/time-ms)
          {:keys [value promise ts]} (get @*bidirectional-properties-cache cache-key)]
      (cond
        (and ts (< (- now ts) bidirectional-properties-cache-ttl-ms))
        (or promise (p/resolved value))

        :else
        (let [promise (-> (state/<invoke-db-worker :thread-api/get-bidirectional-properties graph
                                                   {:target-id target-id})
                          (p/then (fn [value]
                                    (swap! *bidirectional-properties-cache assoc cache-key
                                           {:value value
                                            :ts (util/time-ms)})
                                    value))
                          (p/catch (fn [error]
                                     (swap! *bidirectional-properties-cache dissoc cache-key)
                                     (throw error))))]
          (swap! *bidirectional-properties-cache assoc cache-key {:promise promise
                                                                  :ts now})
          promise)))))

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

(def ^:private get-blocks-cache-ttl-ms 30000)
(defonce ^:private *get-blocks-cache (atom {}))

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
  (let [cache-key [graph (worker-get-blocks-requests [request])]
        now (util/time-ms)
        {:keys [value promise ts]} (get @*get-blocks-cache cache-key)]
    (cond
      (and (some? value) ts (< (- now ts) get-blocks-cache-ttl-ms))
      (p/resolved value)

      promise
      promise

      :else
      (let [result (p/deferred)
            promise (-> result
                        (p/then (fn [value]
                                  (swap! *get-blocks-cache assoc cache-key
                                         {:value value
                                          :ts (util/time-ms)})
                                  value))
                        (p/catch (fn [error]
                                   (swap! *get-blocks-cache dissoc cache-key)
                                   (throw error))))]
        (swap! *get-blocks-cache assoc cache-key {:promise promise
                                                  :ts now})
        (swap! *get-blocks-batch-state
               (fn [state]
                 (update state :queue conj {:graph graph
                                            :request request
                                            :result result})))
        (schedule-get-blocks-batch-flush!)
        promise))))

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
  [graph id-uuid-or-name & {:keys [children? include-collapsed-children? skip-transact? skip-refresh? properties]
                            :or {children? true}
                            :as opts}]

  ;; (prn :debug :<get-block id-uuid-or-name :children? children? :properties properties)
  ;; (js/console.trace)
  (let [name' (str id-uuid-or-name)
        opts (assoc opts :children? children?)
        e (cond
            (number? id-uuid-or-name)
            (db/entity id-uuid-or-name)
            (util/uuid-string? name')
            (db/entity [:block/uuid (uuid name')])
            :else
            (db/get-page name'))
        id (or (and (:block/uuid e) (str (:block/uuid e)))
               (and (util/uuid-string? name') name')
               id-uuid-or-name)
        load-status (:block.temp/load-status e)]
    (cond
      (and (or (= load-status :full)
               (and (= load-status :children) (not include-collapsed-children?))
               (and (= load-status :self) (not children?)))
           (not (some #{:block.temp/refs-count} properties)))
      (p/promise e)

      :else
      (->
       (p/let [result (<fetch-blocks-from-worker-batched graph [{:id id :opts opts}])
               {:keys [block children]} (first result)]
         (when-not skip-transact?
           (let [conn (db/get-db graph false)
                 block-and-children (if block (cons block children) children)
                 affected-keys [[:frontend.worker.react/block (:db/id block)]]
                 tx-data (concat
                          (->> (remove (fn [b] (:block.temp/load-status (db/entity (:db/id b))))
                                       block-and-children)
                               (common-util/fast-remove-nils)
                               (remove empty?))
                          (when (and (:db/id block) children? include-collapsed-children?
                                     (not= :full (:block.temp/load-status (some-> (:db/id block) db/entity))))
                            [{:db/id (:db/id block)
                              :block.temp/load-status :full}]))]
             (when (seq tx-data) (d/transact! conn tx-data))
             (when-not skip-refresh?
               (react/refresh-affected-queries! graph affected-keys {:skip-kv-custom-keys? true}))))

         (if skip-transact? block (db/entity (:db/id block))))
       (p/catch (fn [error]
                  (js/console.error error)
                  (throw (ex-info "get-block error" {:block id-uuid-or-name}))))))))

(defn <get-blocks
  [graph ids* & {:as opts}]
  (let [ids (remove (fn [id] (:block.temp/load-status (db/entity id))) ids*)]
    (when (seq ids)
      (p/let [result (<fetch-blocks-from-worker-batched graph
                                                        (mapv (fn [id]
                                                                {:id id :opts (assoc opts :children? false)})
                                                              ids))]
        (let [conn (db/get-db graph false)
              result' (keep :block result)]
          (when (seq result')
            (d/transact! conn result'))
          result)))))

(defn <get-block-parents
  [graph id depth]
  (assert (integer? id))
  (when (:block/uuid (db/entity graph id))
    (p/let [result (state/<invoke-db-worker :thread-api/get-block-parents graph id depth)
            conn (db/get-db graph false)
            _ (d/transact! conn result)]
      result)))

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

(defonce ^:private *get-block-refs-counts-batch-state
  (atom {:scheduled? false
         :queue []}))

(def ^:private get-block-refs-count-cache-ttl-ms 30000)
(defonce ^:private *get-block-refs-count-cache (atom {}))

(declare flush-get-block-refs-counts-batch!)

(defn- schedule-get-block-refs-counts-batch-flush!
  []
  (let [should-schedule? (not (:scheduled? @*get-block-refs-counts-batch-state))]
    (when should-schedule?
      (swap! *get-block-refs-counts-batch-state assoc :scheduled? true)
      (util/schedule flush-get-block-refs-counts-batch!))))

(defn- enqueue-get-block-refs-count-request!
  [graph eid]
  (let [cache-key [graph eid]
        now (util/time-ms)
        {:keys [value promise ts]} (get @*get-block-refs-count-cache cache-key)]
    (cond
      (and (some? value) ts (< (- now ts) get-block-refs-count-cache-ttl-ms))
      (p/resolved value)

      promise
      promise

      :else
      (let [result (p/deferred)
            promise (-> result
                        (p/then (fn [value]
                                  (swap! *get-block-refs-count-cache assoc cache-key
                                         {:value value
                                          :ts (util/time-ms)})
                                  value))
                        (p/catch (fn [error]
                                   (swap! *get-block-refs-count-cache dissoc cache-key)
                                   (throw error))))]
        (swap! *get-block-refs-count-cache assoc cache-key {:promise promise
                                                            :ts now})
        (swap! *get-block-refs-counts-batch-state
               (fn [state]
                 (update state :queue conj {:graph graph
                                            :eid eid
                                            :result result})))
        (schedule-get-block-refs-counts-batch-flush!)
        promise))))

(defn- resolve-batched-get-block-refs-counts!
  [entries responses]
  (doseq [[idx {:keys [result]}] (map-indexed vector entries)]
    (p/resolve! result (nth responses idx nil))))

(defn- reject-batched-get-block-refs-counts!
  [entries error]
  (doseq [{:keys [result]} entries]
    (p/reject! result error)))

(defn- flush-get-block-refs-counts-batch!
  []
  (let [queue (:queue @*get-block-refs-counts-batch-state)]
    (swap! *get-block-refs-counts-batch-state
           (fn [state] (assoc state :scheduled? false :queue [])))
    (doseq [[graph entries] (group-by :graph queue)]
      (let [ids (mapv :eid entries)]
        (->
         (p/let [result (state/<invoke-db-worker :thread-api/get-block-refs-counts graph ids)
                 result (if (= (count result) (count ids))
                          result
                          nil)
                 result (or result
                            (p/all (mapv #(state/<invoke-db-worker :thread-api/get-block-refs-count graph %) ids)))]
           (resolve-batched-get-block-refs-counts! entries result))
         (p/catch (fn [error]
                    (reject-batched-get-block-refs-counts! entries error))))))))

(defn <get-block-refs-counts
  [graph eids]
  (let [eids (vec eids)]
    (run! #(assert (integer? %)) eids)
    (when (seq eids)
      (p/all (mapv #(enqueue-get-block-refs-count-request! graph %) eids)))))

(defn <get-block-refs-count
  [graph eid]
  (assert (integer? eid))
  (enqueue-get-block-refs-count-request! graph eid))

(defonce ^:private *block-conflicts-batch-state
  (atom {:scheduled? false
         :queue []}))

(def ^:private block-conflicts-batch-delay-ms 100)
(def ^:private block-conflicts-cache-ttl-ms 30000)
(defonce ^:private *block-conflicts-cache (atom {}))

(declare flush-block-conflicts-batch!)

(defn- fresh-block-conflicts-cache-entry
  [cache-key]
  (when-let [{:keys [ts] :as entry} (get @*block-conflicts-cache cache-key)]
    (when (< (- (util/time-ms) ts) block-conflicts-cache-ttl-ms)
      entry)))

(defn- schedule-block-conflicts-batch-flush!
  []
  (let [should-schedule? (not (:scheduled? @*block-conflicts-batch-state))]
    (when should-schedule?
      (swap! *block-conflicts-batch-state assoc :scheduled? true)
      (js/setTimeout flush-block-conflicts-batch! block-conflicts-batch-delay-ms))))

(defn- enqueue-block-conflicts-request!
  [graph block-uuid]
  (let [result (p/deferred)]
    (swap! *block-conflicts-batch-state
           (fn [state]
             (update state :queue conj {:graph graph
                                        :block-uuid block-uuid
                                        :result result})))
    (schedule-block-conflicts-batch-flush!)
    result))

(defn- flush-block-conflicts-batch!
  []
  (let [queue (:queue @*block-conflicts-batch-state)]
    (swap! *block-conflicts-batch-state
           (fn [state] (assoc state :scheduled? false :queue [])))
    (doseq [[graph entries] (group-by :graph queue)]
      (let [block-uuids (mapv :block-uuid entries)]
        (->
         (p/let [responses (state/<invoke-db-worker :thread-api/db-sync-get-block-conflicts-batch
                                                    graph
                                                    block-uuids)]
           (doseq [[idx {:keys [result]}] (map-indexed vector entries)]
             (p/resolve! result (nth responses idx []))))
         (p/catch (fn [error]
                    (doseq [{:keys [result]} entries]
                      (p/reject! result error)))))))))

(defn <get-block-conflicts
  [graph block-uuid]
  (let [cache-key [graph block-uuid]]
    (if-let [{:keys [value promise]} (fresh-block-conflicts-cache-entry cache-key)]
      (or promise (p/resolved value))
      (let [promise (-> (enqueue-block-conflicts-request! graph block-uuid)
                        (p/then (fn [value]
                                  (swap! *block-conflicts-cache assoc cache-key
                                         {:value value
                                          :ts (util/time-ms)})
                                  value))
                        (p/catch (fn [error]
                                   (swap! *block-conflicts-cache dissoc cache-key)
                                   (throw error))))]
        (swap! *block-conflicts-cache assoc cache-key {:promise promise
                                                       :ts (util/time-ms)})
        promise))))

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
        (p/let [result (<q repo {}
                           '[:find [(pull ?block ?block-attrs) ...]
                             :in $ ?start-time ?end-time ?block-attrs
                             :where
                             (or [?block :logseq.property/scheduled ?n]
                                 [?block :logseq.property/deadline ?n])
                             [(>= ?n ?start-time)]
                             [(<= ?n ?end-time)]
                             [?block :logseq.property/status ?status]
                             [?status :db/ident ?status-ident]
                             [(not= ?status-ident :logseq.property/status.done)]
                             [(not= ?status-ident :logseq.property/status.canceled)]]
                           start-time
                           future-time
                           '[*])]
          (->> result
               db-model/sort-by-order-recursive
               db-utils/group-by-page))))))

(defn <get-tag-objects
  [graph class-id]
  (let [class-children (db-model/get-structured-children graph class-id)
        class-ids (distinct (conj class-children class-id))]
    (<q graph {:transact-db? true}
        '[:find [(pull ?b [*]) ...]
          :in $ [?class-id ...]
          :where
          [?b :block/tags ?class-id]]
        class-ids)))

(defonce ^:private *get-views-in-flight (atom {}))

(defn <get-views
  [graph class-id view-feature-type]
  (let [request-key [graph class-id view-feature-type]]
    (if-let [promise (get @*get-views-in-flight request-key)]
      promise
      (let [promise (-> (p/let [result (state/<invoke-db-worker :thread-api/get-views graph class-id view-feature-type)]
                          (when (seq result)
                            (when-let [conn (db/get-db graph false)]
                              (d/transact! conn result)))
                          result)
                        (p/finally
                         (fn []
                           (swap! *get-views-in-flight dissoc request-key))))]
        (swap! *get-views-in-flight assoc request-key promise)
        promise))))

(defn <get-asset-with-checksum
  [graph checksum]
  (p/let [result (<q graph {:transact-db? true}
                     '[:find [(pull ?b [*]) ...]
                       :in $ ?checksum
                       :where
                       [?b :logseq.property.asset/checksum ?checksum]]
                     checksum)]
    (some-> (first result)
            :db/id
            db/entity)))

(defn <get-block-properties-history
  [graph block-id]
  (p/let [result (<q graph {:transact-db? true}
                     '[:find [(pull ?b [*]) ...]
                       :in $ ?block-id
                       :where
                       [?b :logseq.property.history/block ?block-id]]
                     block-id)]
    (->> (sort-by :block/created-at result)
         (map (fn [b] (db/entity (:db/id b)))))))

(defn- task-spent-time-from-history
  [history]
  (let [status-history (filter
                        (fn [b] (= :logseq.property/status (:db/ident (:logseq.property.history/property b))))
                        history)]
    (when (seq status-history)
      (let [time (loop [[last-item item & others] status-history
                        time 0]
                   (if item
                     (let [last-status (:db/ident (:logseq.property.history/ref-value last-item))
                           this-status (:db/ident (:logseq.property.history/ref-value item))]
                       (if (and (= this-status :logseq.property/status.doing)
                                (empty? others))
                         (-> (+ time (- (tc/to-long (t/now)) (:block/created-at item)))
                             (quot 1000))
                         (let [time' (if (or
                                          (= last-status :logseq.property/status.doing)
                                          (and
                                           (not (contains? #{:logseq.property/status.canceled
                                                             :logseq.property/status.backlog
                                                             :logseq.property/status.done} last-status))
                                           (= this-status :logseq.property/status.done)))
                                       (+ time (- (:block/created-at item) (:block/created-at last-item)))
                                       time)]
                           (recur (cons item others) time'))))
                     (quot time 1000)))]
        [status-history time]))))

(defn- <task-spent-times-batch
  [graph block-ids]
  (let [block-ids (vec (distinct block-ids))]
    (when (seq block-ids)
      (p/let [histories (state/<invoke-db-worker :thread-api/get-task-status-histories graph block-ids)
              history-by-block-id (zipmap block-ids histories)]
        (into {}
              (map (fn [block-id]
                     [block-id (task-spent-time-from-history (get history-by-block-id block-id))])
                   block-ids))))))

(defonce ^:private *task-spent-time-batch-state
  (atom {:scheduled? false
         :queue []}))

(def ^:private task-spent-time-cache-ttl-ms 30000)
(defonce ^:private *task-spent-time-cache (atom {}))

(declare flush-task-spent-time-batch!)

(defn- cache-task-spent-times!
  [graph block-id->time]
  (doseq [[block-id value] block-id->time]
    (swap! *task-spent-time-cache assoc [graph block-id]
           {:value value
            :ts (util/time-ms)})))

(defn- fresh-task-spent-time-cache-entry
  [cache-key]
  (when-let [{:keys [ts] :as entry} (get @*task-spent-time-cache cache-key)]
    (when (< (- (util/time-ms) ts) task-spent-time-cache-ttl-ms)
      entry)))

(defn- schedule-task-spent-time-batch-flush!
  []
  (let [should-schedule? (not (:scheduled? @*task-spent-time-batch-state))]
    (when should-schedule?
      (swap! *task-spent-time-batch-state assoc :scheduled? true)
      (util/schedule flush-task-spent-time-batch!))))

(defn- enqueue-task-spent-time-request!
  [graph block-id]
  (let [result (p/deferred)]
    (swap! *task-spent-time-batch-state
           (fn [state]
             (update state :queue conj {:graph graph
                                        :block-id block-id
                                        :result result})))
    (schedule-task-spent-time-batch-flush!)
    result))

(defn- flush-task-spent-time-batch!
  []
  (let [queue (:queue @*task-spent-time-batch-state)]
    (swap! *task-spent-time-batch-state
           (fn [state] (assoc state :scheduled? false :queue [])))
    (doseq [[graph entries] (group-by :graph queue)]
      (let [block-ids (mapv :block-id entries)]
        (->
         (p/let [batch-result (<task-spent-times-batch graph block-ids)]
           (doseq [{:keys [block-id result]} entries]
             (p/resolve! result (get batch-result block-id))))
         (p/catch (fn [error]
                    (doseq [{:keys [result]} entries]
                      (p/reject! result error)))))))))

(defn <task-spent-time
  [graph block-id]
  (let [cache-key [graph block-id]]
    (if-let [{:keys [value promise]} (fresh-task-spent-time-cache-entry cache-key)]
      (or promise (p/resolved value))
      (let [promise (-> (enqueue-task-spent-time-request! graph block-id)
                        (p/then (fn [value]
                                  (swap! *task-spent-time-cache assoc cache-key
                                         {:value value
                                          :ts (util/time-ms)})
                                  value))
                        (p/catch (fn [error]
                                   (swap! *task-spent-time-cache dissoc cache-key)
                                   (throw error))))]
        (swap! *task-spent-time-cache assoc cache-key {:promise promise
                                                       :ts (util/time-ms)})
        promise))))

(defn <prefetch-task-spent-times
  [graph block-ids]
  (let [block-ids (->> block-ids
                       distinct
                       (remove #(fresh-task-spent-time-cache-entry [graph %]))
                       vec)]
    (when (and graph (seq block-ids))
      (-> (p/let [block-id->time (<task-spent-times-batch graph block-ids)]
            (cache-task-spent-times! graph block-id->time)
            block-id->time)
          (p/catch (fn [error]
                     (doseq [block-id block-ids]
                       (swap! *task-spent-time-cache dissoc [graph block-id]))
                     (throw error)))))))
