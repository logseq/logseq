(ns frontend.db.subs
  "Exact renderer subscriptions for worker-owned graph data."
  (:require [clojure.set :as set]
            [frontend.state :as state]
            [promesa.core :as p]))

(def ^:private loading-snapshot {:status :loading})
(def ^:private missing-snapshot {:status :missing})

(defn- empty-store
  [graph-id generation]
  {:graph-id graph-id
   :generation generation
   :rev -1
   :blocks {}
   :children {}
   :resources {}})

(defonce ^:private *store
  (atom (empty-store (state/get-current-repo) 0)))
(defonce ^:private *listeners
  (atom {:blocks {}
         :children {}
         :resources {}}))
(defonce ^:private *in-flight (atom {}))

(defn- valid-revision?
  [value]
  (and (integer? value) (not (neg? value))))

(defn- require-revision!
  [label value]
  (when-not (valid-revision? value)
    (throw (ex-info (str "Invalid " label) {label value})))
  value)

(defn- require-uuid!
  [label value]
  (when-not (uuid? value)
    (throw (ex-info (str "Invalid " label) {label value})))
  value)

(defn- require-block!
  [block-uuid block]
  (require-uuid! :block/uuid block-uuid)
  (when-not (= block-uuid (:block/uuid block))
    (throw (ex-info "Block UUID does not match its subscription key"
                    {:block-uuid block-uuid
                     :replacement-uuid (:block/uuid block)})))
  (require-revision! :block/tx-id (:block/tx-id block))
  block)

(defn block-changed?
  [old-block new-block]
  (let [old-tx-id (require-revision! :block/tx-id (:block/tx-id old-block))
        new-tx-id (require-revision! :block/tx-id (:block/tx-id new-block))]
    (not= old-tx-id new-tx-id)))

(def ^:private load-batch-limit 25)

(defonce ^:private *block-load-batch
  (atom {:scheduled? false :entries {}}))
(defonce ^:private *children-load-batch
  (atom {:scheduled? false :entries {}}))
(defonce ^:private *resource-load-batch
  (atom {:scheduled? false :entries {}}))

(defn- enqueue-load!
  [batch-state flush! graph-id key]
  (let [entry-key [graph-id key]]
    (if-let [result (get-in @batch-state [:entries entry-key :result])]
      result
      (let [result (p/deferred)
            schedule? (not (:scheduled? @batch-state))]
        (swap! batch-state
               (fn [batch]
                 (-> batch
                     (assoc :scheduled? true)
                     (assoc-in [:entries entry-key]
                               {:graph-id graph-id
                                :key key
                                :result result}))))
        (when schedule?
          (js/queueMicrotask flush!))
        result))))

(defn- take-load-entries!
  [batch-state]
  (let [entries (vec (vals (:entries @batch-state)))]
    (reset! batch-state {:scheduled? false :entries {}})
    entries))

(defn- reject-load-entries!
  [entries error]
  (doseq [{:keys [result]} entries]
    (p/reject! result error)))

(defn- flush-block-loads!
  []
  (doseq [[graph-id entries] (group-by :graph-id
                                       (take-load-entries! *block-load-batch))
          batch (partition-all load-batch-limit entries)]
    (let [block-uuids (mapv :key batch)]
      (-> (state/<invoke-db-worker :thread-api/get-canonical-blocks
                                   graph-id
                                   block-uuids)
          (p/then (fn [response]
                    (doseq [{:keys [result]} batch]
                      (p/resolve! result response))))
          (p/catch (fn [error]
                     (reject-load-entries! batch error)))))))

(defn- children-batch-results
  [entries {:keys [basis-rev children]}]
  (mapv (fn [{:keys [key]}]
          (when-not (contains? children key)
            (throw (ex-info "Missing direct-children batch result"
                            {:parent-uuid key})))
          (assoc (get children key) :basis-rev basis-rev))
        entries))

(defn- flush-children-loads!
  []
  (doseq [[graph-id entries] (group-by :graph-id
                                       (take-load-entries! *children-load-batch))
          batch (partition-all load-batch-limit entries)]
    (let [parent-uuids (mapv :key batch)]
      (-> (state/<invoke-db-worker :thread-api/get-direct-children
                                   graph-id
                                   parent-uuids)
          (p/then (fn [response]
                    (doseq [[{:keys [result]} value]
                            (map vector batch
                                 (children-batch-results batch response))]
                      (p/resolve! result value))))
          (p/catch (fn [error]
                     (reject-load-entries! batch error)))))))

(defn- resource-batch-results
  [entries {:keys [basis-rev resources]}]
  (mapv (fn [{:keys [key]}]
          (when-not (contains? resources key)
            (throw (ex-info "Missing renderer resource batch result"
                            {:resource-key key})))
          (assoc (get resources key)
                 :basis-rev basis-rev
                 :key key))
        entries))

(defn- flush-resource-loads!
  []
  (doseq [[graph-id entries] (group-by :graph-id
                                       (take-load-entries! *resource-load-batch))
          batch (partition-all load-batch-limit entries)]
    (let [resource-keys (mapv :key batch)]
      (-> (state/<invoke-db-worker :thread-api/get-render-resources
                                   graph-id
                                   resource-keys)
          (p/then (fn [response]
                    (doseq [[{:keys [result]} value]
                            (map vector batch
                                 (resource-batch-results batch response))]
                      (p/resolve! result value))))
          (p/catch (fn [error]
                     (reject-load-entries! batch error)))))))

(defn <load-block
  [graph-id block-uuid]
  (enqueue-load! *block-load-batch flush-block-loads! graph-id block-uuid))

(defn <load-children
  [graph-id parent-uuid]
  (enqueue-load! *children-load-batch flush-children-loads! graph-id parent-uuid))

(defn <load-resource
  [graph-id resource-key]
  (enqueue-load! *resource-load-batch flush-resource-loads!
                 graph-id resource-key))

(defn- listeners-for
  [slot-type key]
  (vals (get-in @*listeners [slot-type key])))

(defn- mounted?
  [slot-type key]
  (seq (get-in @*listeners [slot-type key])))

(defn- notify-key!
  [slot-type key]
  (doseq [listener (listeners-for slot-type key)]
    (listener)))

(defn- notify-keys!
  [slot-type keys]
  (doseq [key keys]
    (notify-key! slot-type key)))

(defn- all-listeners
  []
  (mapcat (fn [listeners-by-key]
            (mapcat vals (vals listeners-by-key)))
          (vals @*listeners)))

(declare start-block-load! start-children-load! start-resource-load!)

(defn reset-graph!
  [graph-id]
  (let [generation (inc (:generation @*store))
        {:keys [blocks children resources]} @*listeners
        block-uuids (vec (keys blocks))
        parent-uuids (vec (keys children))
        resource-keys (vec (keys resources))
        listeners (vec (all-listeners))
        reset-error (ex-info "Graph changed during renderer load"
                             {:graph-id graph-id})]
    (reset! *store (empty-store graph-id generation))
    (reset! *in-flight {})
    (reject-load-entries! (take-load-entries! *block-load-batch) reset-error)
    (reject-load-entries! (take-load-entries! *children-load-batch) reset-error)
    (reject-load-entries! (take-load-entries! *resource-load-batch) reset-error)
    (doseq [listener listeners]
      (listener))
    (when graph-id
      (doseq [block-uuid block-uuids]
        (start-block-load! block-uuid))
      (doseq [parent-uuid parent-uuids]
        (start-children-load! parent-uuid))
      (doseq [resource-key resource-keys]
        (start-resource-load! resource-key))))
  nil)

(defn block-snapshot
  [block-uuid]
  (require-uuid! :block/uuid block-uuid)
  (or (get-in @*store [:blocks block-uuid :snapshot])
      loading-snapshot))

(defn children-snapshot
  [parent-uuid]
  (require-uuid! :block/uuid parent-uuid)
  (or (get-in @*store [:children parent-uuid :snapshot])
      loading-snapshot))

(defn resource-snapshot
  [resource-key]
  (or (get-in @*store [:resources resource-key :snapshot])
      loading-snapshot))

(defn- ready-block-slot
  [basis-rev block]
  {:kind :ready
   :basis-rev basis-rev
   :tx-id (:block/tx-id block)
   :snapshot {:status :ready :value block}})

(defn- tombstone-slot
  [rev]
  {:kind :tombstone
   :rev rev
   :snapshot missing-snapshot})

(defn- ready-children-slot
  [basis-rev parent-tx-id items]
  {:kind :ready
   :basis-rev basis-rev
   :tx-id parent-tx-id
   :items items
   :snapshot {:status :ready :value (mapv first items)}})

(defn- ready-resource-slot
  [basis-rev watch-keys value]
  {:kind :ready
   :basis-rev basis-rev
   :watch-keys watch-keys
   :snapshot {:status :ready :value value}})

(defn- error-slot
  [error]
  {:kind :error
   :snapshot {:status :error :error error}})

(defn- slot-revision
  [slot]
  (max -1
       (or (:basis-rev slot) -1)
       (or (:rev slot) -1)
       (or (:stale-rev slot) -1)))

(defn- clear-in-flight!
  [request-key token]
  (let [reload? (volatile! false)]
    (swap! *in-flight
           (fn [requests]
             (let [request (get requests request-key)]
               (if (identical? token (:token request))
                 (do
                   (vreset! reload? (:reload? request))
                   (dissoc requests request-key))
                 requests))))
    @reload?))

(defn- request-reload!
  [request-key start-load!]
  (let [in-flight? (volatile! false)]
    (swap! *in-flight
           (fn [requests]
             (if (contains? requests request-key)
               (do
                 (vreset! in-flight? true)
                 (assoc-in requests [request-key :reload?] true))
               requests)))
    (when-not @in-flight?
      (start-load!))))

(defn- current-generation?
  [graph-id generation]
  (let [store @*store]
    (and (= graph-id (:graph-id store))
         (= generation (:generation store)))))

(defn- current-request?
  [request-key token graph-id generation]
  (and (current-generation? graph-id generation)
       (identical? token (get-in @*in-flight [request-key :token]))))

(defn- apply-load-error!
  [slot-type key graph-id generation error]
  (when (current-generation? graph-id generation)
    (let [changed? (volatile! false)]
      (swap! *store
             (fn [store]
               (let [current (get-in store [slot-type key])]
                 (if (or (contains? #{nil :error} (:kind current))
                         (contains? current :stale-rev))
                   (do
                     (vreset! changed? true)
                     (assoc-in store [slot-type key] (error-slot error)))
                   store))))
      (when @changed?
        (notify-key! slot-type key)))))

(defn- start-request!
  [request-key loader on-success on-error]
  (when (and (:graph-id @*store)
             (not (get @*in-flight request-key)))
    (let [{:keys [graph-id generation]} @*store
          token (js-obj)
          request (try
                    (loader graph-id (second request-key))
                    (catch :default error
                      (p/rejected error)))]
      (swap! *in-flight assoc request-key {:token token})
      (-> request
          (p/then (fn [response]
                    (when (current-request? request-key token
                                            graph-id generation)
                      (on-success generation response))))
          (p/catch (fn [error]
                     (when (current-request? request-key token
                                             graph-id generation)
                       (on-error graph-id generation error))))
          (p/finally (fn []
                       (when (and (clear-in-flight! request-key token)
                                  (mounted? (first request-key)
                                            (second request-key)))
                         (start-request! request-key loader
                                         on-success on-error))))))))

(defn- loaded-block-slot
  [block-uuid basis-rev current block]
  (let [block (require-block! block-uuid block)]
    (cond
      (and (= :tombstone (:kind current))
           (> (:rev current) basis-rev))
      current

      (and (= :ready (:kind current))
           (not (block-changed? (get-in current [:snapshot :value]) block)))
      current

      :else
      (ready-block-slot basis-rev block))))

(defn- apply-block-load!
  [generation block-uuid {:keys [basis-rev blocks]}]
  (require-revision! :basis-rev basis-rev)
  (let [changed? (volatile! false)]
    (swap! *store
           (fn [store]
             (let [current (get-in store [:blocks block-uuid])]
               (if (or (not= generation (:generation store))
                       (< basis-rev (slot-revision current)))
                 store
                 (let [block (get blocks block-uuid)
                       next-slot
                       (if block
                         (loaded-block-slot block-uuid basis-rev current block)
                         (if (and (= :tombstone (:kind current))
                                  (>= (:rev current) basis-rev))
                           current
                           (tombstone-slot basis-rev)))]
                   (when-not (identical? current next-slot)
                     (vreset! changed? true))
                   (assoc-in store [:blocks block-uuid] next-slot))))))
    (when @changed?
      (notify-key! :blocks block-uuid))))

(defn- require-child-items!
  [parent-uuid items]
  (->> items
       (map (fn [[child-uuid order :as item]]
              (when-not (= 2 (count item))
                (throw (ex-info "Invalid direct-child item"
                                {:parent-uuid parent-uuid :item item})))
              (require-uuid! :block/uuid child-uuid)
              (when-not (string? order)
                (throw (ex-info "Invalid direct-child order"
                                {:parent-uuid parent-uuid
                                 :block-uuid child-uuid
                                 :block-order order})))
              [child-uuid order]))
       (sort-by second)
       vec))

(defn- journal-bundle-key?
  [resource-key]
  (= :journal-bundle (first resource-key)))

(defn- require-journal-bundle!
  [resource-key value]
  (when-not (and (vector? resource-key)
                 (= 2 (count resource-key)))
    (throw (ex-info "Invalid journal bundle resource key"
                    {:resource-key resource-key})))
  (when-not (and (map? value)
                 (= #{:root-uuid :blocks :children} (set (keys value))))
    (throw (ex-info "Invalid journal bundle value"
                    {:resource-key resource-key})))
  (let [{:keys [root-uuid blocks children]} value]
    (require-uuid! :root-uuid root-uuid)
    (when-not (= (second resource-key) root-uuid)
      (throw (ex-info "Journal bundle root does not match its resource key"
                      {:resource-key resource-key
                       :root-uuid root-uuid})))
    (when-not (map? blocks)
      (throw (ex-info "Invalid journal bundle blocks"
                      {:resource-key resource-key})))
    (when-not (map? children)
      (throw (ex-info "Invalid journal bundle children"
                      {:resource-key resource-key})))
    (when-not (and (contains? blocks root-uuid)
                   (= (set (keys blocks)) (set (keys children))))
      (throw (ex-info "Journal bundle requires one membership per block"
                      {:resource-key resource-key})))
    (let [blocks (into {}
                       (map (fn [[block-uuid block]]
                              [block-uuid (require-block! block-uuid block)]))
                       blocks)
          block-uuids (set (keys blocks))
          children
          (into {}
                (map
                 (fn [[parent-uuid membership]]
                   (when-not (and (map? membership)
                                  (= #{:parent-tx-id :items}
                                     (set (keys membership))))
                     (throw (ex-info "Invalid journal bundle membership"
                                     {:parent-uuid parent-uuid})))
                   (let [parent-tx-id
                         (require-revision! :block/tx-id
                                            (:parent-tx-id membership))
                         items (require-child-items! parent-uuid
                                                     (:items membership))]
                     (when-not (= parent-tx-id
                                  (get-in blocks [parent-uuid :block/tx-id]))
                       (throw (ex-info "Journal bundle membership revision mismatch"
                                       {:parent-uuid parent-uuid
                                        :parent-tx-id parent-tx-id})))
                     (doseq [[child-uuid] items]
                       (when-not (contains? block-uuids child-uuid)
                         (throw (ex-info "Journal bundle child has no canonical block"
                                         {:parent-uuid parent-uuid
                                          :block-uuid child-uuid}))))
                     [parent-uuid {:parent-tx-id parent-tx-id
                                   :items items}])))
                children)]
      {:root-uuid root-uuid
       :blocks blocks
       :children children})))

(defn- apply-children-load!
  [generation parent-uuid {:keys [basis-rev parent-tx-id items]}]
  (require-revision! :basis-rev basis-rev)
  (require-revision! :block/tx-id parent-tx-id)
  (let [items (require-child-items! parent-uuid items)
        next-slot (ready-children-slot basis-rev parent-tx-id items)
        changed? (volatile! false)]
    (swap! *store
           (fn [store]
             (let [current (get-in store [:children parent-uuid])]
               (if (or (not= generation (:generation store))
                       (< basis-rev (slot-revision current)))
                 store
                 (do
                   (when-not (= current next-slot)
                     (vreset! changed? true))
                   (assoc-in store [:children parent-uuid] next-slot))))))
    (when @changed?
      (notify-key! :children parent-uuid))))

(defn- bundle-has-newer-slot?
  [store basis-rev {:keys [blocks children]}]
  (or (some #(> (slot-revision (get-in store [:blocks %])) basis-rev)
            (keys blocks))
      (some #(> (slot-revision (get-in store [:children %])) basis-rev)
            (keys children))))

(defn- seed-journal-bundle
  [store basis-rev {:keys [blocks children]}
   changed-blocks changed-children]
  (let [store
        (reduce-kv
         (fn [store block-uuid block]
           (let [current (get-in store [:blocks block-uuid])
                 next-slot (loaded-block-slot block-uuid basis-rev current block)]
             (if (identical? current next-slot)
               store
               (do
                 (vswap! changed-blocks conj block-uuid)
                 (assoc-in store [:blocks block-uuid] next-slot)))))
         store
         blocks)]
    (reduce-kv
     (fn [store parent-uuid {:keys [parent-tx-id items]}]
       (let [current (get-in store [:children parent-uuid])
             next-slot (ready-children-slot basis-rev parent-tx-id items)]
         (if (= current next-slot)
           store
           (do
             (vswap! changed-children conj parent-uuid)
             (assoc-in store [:children parent-uuid] next-slot)))))
     store
     children)))

(defn- apply-resource-load!
  [generation resource-key {:keys [basis-rev key watch-keys value]}]
  (require-revision! :basis-rev basis-rev)
  (when-not (= resource-key key)
    (throw (ex-info "Resource key does not match its subscription key"
                    {:resource-key resource-key :response-key key})))
  (when-not (set? watch-keys)
    (throw (ex-info "Invalid resource watch keys"
                    {:resource-key resource-key :watch-keys watch-keys})))
  (let [journal-bundle? (journal-bundle-key? resource-key)
        value (if journal-bundle?
                (require-journal-bundle! resource-key value)
                value)
        next-slot (ready-resource-slot basis-rev watch-keys value)
        changed-resource? (volatile! false)
        changed-blocks (volatile! #{})
        changed-children (volatile! #{})
        stale-response? (volatile! false)]
    (swap! *store
           (fn [store]
             (let [current (get-in store [:resources resource-key])]
               (if (or (not= generation (:generation store))
                       (< basis-rev (:rev store))
                       (< basis-rev (slot-revision current))
                       (and journal-bundle?
                            (bundle-has-newer-slot? store basis-rev value)))
                 (do
                   (when (= generation (:generation store))
                     (vreset! stale-response? true))
                   store)
                 (let [store (if (= current next-slot)
                               store
                               (do
                                 (vreset! changed-resource? true)
                                 (assoc-in store [:resources resource-key]
                                           next-slot)))]
                   (if journal-bundle?
                     (seed-journal-bundle store basis-rev value
                                          changed-blocks changed-children)
                     store))))))
    (when @stale-response?
      (request-reload! [:resources resource-key]
                       #(start-resource-load! resource-key)))
    (notify-keys! :children @changed-children)
    (notify-keys! :blocks @changed-blocks)
    (when @changed-resource?
      (notify-key! :resources resource-key))))

(defn- start-block-load!
  [block-uuid]
  (start-request!
   [:blocks block-uuid]
   <load-block
   #(apply-block-load! %1 block-uuid %2)
   #(apply-load-error! :blocks block-uuid %1 %2 %3)))

(defn- start-children-load!
  [parent-uuid]
  (start-request!
   [:children parent-uuid]
   <load-children
   #(apply-children-load! %1 parent-uuid %2)
   #(apply-load-error! :children parent-uuid %1 %2 %3)))

(defn- start-resource-load!
  [resource-key]
  (start-request!
   [:resources resource-key]
   <load-resource
   #(apply-resource-load! %1 resource-key %2)
   #(apply-load-error! :resources resource-key %1 %2 %3)))

(defn- collect-slot!
  [slot-type key]
  (when-not (mounted? slot-type key)
    (swap! *store update slot-type dissoc key)
    (swap! *in-flight dissoc [slot-type key])))

(defn- schedule-slot-gc!
  [slot-type key]
  (js/queueMicrotask
   (fn []
     (when-not (mounted? slot-type key)
       (let [journal-bundle
             (when (and (= :resources slot-type)
                        (journal-bundle-key? key))
               (get-in @*store [:resources key :snapshot :value]))]
         (collect-slot! slot-type key)
         (when journal-bundle
           (doseq [block-uuid (keys (:blocks journal-bundle))]
             (collect-slot! :blocks block-uuid))
           (doseq [parent-uuid (keys (:children journal-bundle))]
             (collect-slot! :children parent-uuid))))))))

(defn- add-listener!
  [slot-type key listener start-load!]
  (let [listener-id (random-uuid)]
    (swap! *listeners assoc-in [slot-type key listener-id] listener)
    (let [slot (get-in @*store [slot-type key])]
      (when (or (contains? #{nil :error} (:kind slot))
                (contains? slot :stale-rev))
        (start-load! key)))
    (fn []
      (swap! *listeners
             (fn [listeners]
               (let [listeners' (update-in listeners [slot-type key]
                                           dissoc listener-id)]
                 (if (seq (get-in listeners' [slot-type key]))
                   listeners'
                   (update listeners' slot-type dissoc key)))))
      (schedule-slot-gc! slot-type key))))

(defn subscribe-block!
  [block-uuid listener]
  (require-uuid! :block/uuid block-uuid)
  (add-listener! :blocks block-uuid listener start-block-load!))

(defn subscribe-children!
  [parent-uuid listener]
  (require-uuid! :block/uuid parent-uuid)
  (add-listener! :children parent-uuid listener start-children-load!))

(defn subscribe-resource!
  [resource-key listener]
  (add-listener! :resources resource-key listener start-resource-load!))

(defn- block-resolution-error
  [block-uuid snapshot]
  (case (:status snapshot)
    :missing
    (ex-info "Canonical block is missing"
             {:status :missing
              :block-uuid block-uuid})

    :error
    (:error snapshot)

    (ex-info "Invalid canonical block snapshot"
             {:block-uuid block-uuid
              :snapshot snapshot})))

(defn- wait-for-block!
  [block-uuid cleanups]
  (letfn [(settle! [result]
            (let [snapshot (block-snapshot block-uuid)]
              (case (:status snapshot)
                :loading nil
                :ready (p/resolve! result (:value snapshot))
                (p/reject! result
                           (block-resolution-error block-uuid snapshot)))))]
    (let [snapshot (block-snapshot block-uuid)]
      (case (:status snapshot)
        :ready
        (p/resolved (:value snapshot))

        (:missing :error)
        (p/rejected (block-resolution-error block-uuid snapshot))

        :loading
        (let [result (p/deferred)
              unsubscribe (subscribe-block! block-uuid #(settle! result))]
          (swap! cleanups conj unsubscribe)
          (settle! result)
          result)

        (p/rejected (block-resolution-error block-uuid snapshot))))))

(defn resolve-blocks!
  "Resolve canonical blocks in input order through the exact block store."
  [block-uuids]
  (when-not (vector? block-uuids)
    (throw (ex-info "Canonical block UUIDs must be a vector"
                    {:block-uuids block-uuids})))
  (let [cleanups (atom [])]
    (-> (p/all (mapv #(wait-for-block! % cleanups) block-uuids))
        (p/then vec)
        (p/finally #(run! (fn [unsubscribe] (unsubscribe)) @cleanups)))))

(defn- apply-block-replacement
  [store block-uuid block changed-blocks]
  (let [block (require-block! block-uuid block)
        current (get-in store [:blocks block-uuid])]
    (if (or (and (nil? current)
                 (not (mounted? :blocks block-uuid)))
            (> (slot-revision current) (:rev store))
            (and (= :ready (:kind current))
                 (not (block-changed? (get-in current [:snapshot :value]) block))))
      store
      (do
        (vswap! changed-blocks conj block-uuid)
        (assoc-in store [:blocks block-uuid]
                  (ready-block-slot (:rev store) block))))))

(defn- apply-tombstone
  [store delta-rev block-uuid tombstone changed-blocks]
  (require-uuid! :block/uuid block-uuid)
  (let [tombstone-rev (require-revision! :rev (:rev tombstone))
        current (get-in store [:blocks block-uuid])]
    (when-not (= delta-rev tombstone-rev)
      (throw (ex-info "Tombstone revision does not match delta"
                      {:delta-rev delta-rev
                       :block-uuid block-uuid
                       :tombstone-rev tombstone-rev})))
    (if (or (and (nil? current)
                 (not (mounted? :blocks block-uuid)))
            (> (slot-revision current) delta-rev)
            (and (= :tombstone (:kind current))
                 (>= (:rev current) tombstone-rev)))
      store
      (do
        (vswap! changed-blocks conj block-uuid)
        (assoc-in store [:blocks block-uuid]
                  (tombstone-slot tombstone-rev))))))

(defn- child-patch-items
  [parent-uuid items remove-items upsert-items]
  (let [remove-items (set (require-child-items! parent-uuid remove-items))
        upsert-items (require-child-items! parent-uuid upsert-items)
        upsert-uuids (set (map first upsert-items))]
    (->> items
         (remove (fn [[child-uuid :as item]]
                   (or (contains? remove-items item)
                       (contains? upsert-uuids child-uuid))))
         (concat upsert-items)
         (sort-by second)
         vec)))

(defn- apply-child-patch
  [store parent-uuid {removed :remove :keys [base-tx-id tx-id upsert]}
   changed-children stale-children]
  (require-uuid! :block/uuid parent-uuid)
  (when (some? base-tx-id)
    (require-revision! :block/tx-id base-tx-id))
  (require-revision! :block/tx-id tx-id)
  (let [current (get-in store [:children parent-uuid])]
    (cond
      (nil? current)
      (if (mounted? :children parent-uuid)
        (do
          (vswap! stale-children conj parent-uuid)
          (assoc-in store [:children parent-uuid :stale-rev]
                    (:rev store)))
        store)

      (> (slot-revision current) (:rev store))
      store

      (= tx-id (:tx-id current))
      store

      (= base-tx-id (:tx-id current))
      (let [items (child-patch-items parent-uuid (:items current) removed upsert)]
        (vswap! changed-children conj parent-uuid)
        (assoc-in store [:children parent-uuid]
                  (ready-children-slot (:rev store) tx-id items)))

      :else
      (do
        (when (mounted? :children parent-uuid)
          (vswap! stale-children conj parent-uuid))
        (assoc-in store [:children parent-uuid :stale-rev]
                  (:rev store))))))

(defn- invalidate-unpatched-children
  [store blocks child-patches stale-children]
  (reduce-kv
   (fn [store parent-uuid block]
     (let [current (get-in store [:children parent-uuid])]
       (if (or (contains? child-patches parent-uuid)
               (not= :ready (:kind current))
               (= (:block/tx-id block) (:tx-id current))
               (> (slot-revision current) (:rev store)))
         store
         (do
           (when (and (mounted? :children parent-uuid)
                      (< (or (:stale-rev current) -1) (:rev store)))
             (vswap! stale-children conj parent-uuid))
           (assoc-in store [:children parent-uuid :stale-rev]
                     (:rev store))))))
   store
   blocks))

(defn- invalidate-resources
  [store affected-keys stale-resources]
  (reduce-kv
   (fn [store resource-key slot]
     (if (and (mounted? :resources resource-key)
              (<= (slot-revision slot) (:rev store))
              (seq (set/intersection affected-keys (:watch-keys slot))))
       (do
         (vswap! stale-resources conj resource-key)
         (assoc-in store [:resources resource-key :stale-rev]
                   (:rev store)))
       store))
   store
   (:resources store)))

(defn apply-delta!
  [{:keys [graph-id rev blocks deleted children affected-keys] :as delta}]
  (require-revision! :rev rev)
  (when-not (map? delta)
    (throw (ex-info "Invalid renderer delta" {:delta delta})))
  (when-not (map? blocks)
    (throw (ex-info "Invalid renderer block replacements" {:blocks blocks})))
  (when-not (map? deleted)
    (throw (ex-info "Invalid renderer tombstones" {:deleted deleted})))
  (when-not (map? children)
    (throw (ex-info "Invalid renderer child patches" {:children children})))
  (when-not (set? affected-keys)
    (throw (ex-info "Invalid renderer affected keys"
                    {:affected-keys affected-keys})))
  (when (seq (set/intersection (set (keys blocks)) (set (keys deleted))))
    (throw (ex-info "A block cannot be replaced and deleted in one delta"
                    {:rev rev})))
  (let [changed-blocks (volatile! #{})
        changed-children (volatile! #{})
        stale-children (volatile! #{})
        stale-resources (volatile! #{})
        applied? (volatile! false)]
    (swap! *store
           (fn [store]
             (if (or (not= graph-id (:graph-id store))
                     (<= rev (:rev store)))
               store
               (let [store (assoc store :rev rev)
                     store (reduce-kv
                            (fn [store block-uuid block]
                              (apply-block-replacement store block-uuid block
                                                       changed-blocks))
                            store
                            blocks)
                     store (reduce-kv
                            (fn [store block-uuid tombstone]
                              (apply-tombstone store rev block-uuid tombstone
                                               changed-blocks))
                            store
                            deleted)
                     store (reduce-kv
                            (fn [store parent-uuid patch]
                              (apply-child-patch store parent-uuid patch
                                                 changed-children stale-children))
                            store
                            children)
                     store (invalidate-unpatched-children store blocks children
                                                          stale-children)]
                 (vreset! applied? true)
                 (invalidate-resources store affected-keys stale-resources)))))
    (when @applied?
      (notify-keys! :children @changed-children)
      (notify-keys! :blocks @changed-blocks)
      (doseq [parent-uuid @stale-children]
        (request-reload! [:children parent-uuid]
                         #(start-children-load! parent-uuid)))
      (doseq [resource-key @stale-resources]
        (request-reload! [:resources resource-key]
                         #(start-resource-load! resource-key))))
    @applied?))
