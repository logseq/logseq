(ns frontend.db.subs
  "Exact renderer subscriptions for worker-owned graph data."
  (:require [frontend.state :as state]
            [frontend.db.subs-loader :as loader]
            [frontend.db.subs-slots :as slots]
            [frontend.db.subs-blocks :as blocks]
            [promesa.core :as p]))

(def ^:private loading-snapshot {:status :loading})

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

(def require-uuid! slots/require-uuid!)
(def block-changed? slots/block-changed?)

(def ^:private children-slot-cache-ms 30000)

(defonce ^:private *query-resource-reloads
  (atom {:timer-id nil :resource-keys #{}}))

(defn ^:no-doc set-query-reload-timeout!
  [callback delay-ms]
  (js/setTimeout callback delay-ms))

(defn ^:no-doc clear-query-reload-timeout!
  [timer-id]
  (js/clearTimeout timer-id))

(defn ^:no-doc set-seeded-block-gc-timeout!
  [callback delay-ms]
  (js/setTimeout callback delay-ms))

(defn ^:no-doc schedule-load-batch!
  [callback]
  (js/setTimeout callback 0))

(defn <load-block
  [graph-id block-uuid]
  (loader/load! :blocks graph-id block-uuid schedule-load-batch!))

(defn <load-children
  [graph-id parent-uuid]
  (loader/load! :children graph-id parent-uuid schedule-load-batch!))

(defn <load-resource
  [graph-id resource-key]
  (loader/load! :resources graph-id resource-key schedule-load-batch!))


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

(defn- all-listeners
  []
  (mapcat (fn [listeners-by-key]
            (mapcat vals (vals listeners-by-key)))
          (vals @*listeners)))

(declare request-reload!
         start-block-load! start-children-load! start-resource-load!
         schedule-resource-reload!)

(defn- clear-query-resource-reloads!
  []
  (when-let [timer-id (:timer-id @*query-resource-reloads)]
    (clear-query-reload-timeout! timer-id))
  (reset! *query-resource-reloads {:timer-id nil :resource-keys #{}}))

(defn- flush-query-resource-reloads!
  []
  (let [resource-keys (:resource-keys @*query-resource-reloads)]
    (reset! *query-resource-reloads {:timer-id nil :resource-keys #{}})
    (doseq [resource-key resource-keys]
      (when (mounted? :resources resource-key)
        (request-reload! [:resources resource-key]
                         #(start-resource-load! resource-key))))))

(defn- schedule-query-resource-reload!
  [resource-key]
  (when-let [timer-id (:timer-id @*query-resource-reloads)]
    (clear-query-reload-timeout! timer-id))
  (let [timer-id (set-query-reload-timeout! flush-query-resource-reloads! 2000)]
    (swap! *query-resource-reloads
           (fn [state]
             (-> state
                 (update :resource-keys conj resource-key)
                 (assoc :timer-id timer-id))))))

(defn- schedule-resource-reload!
  [resource-key]
  (if (= :query (first resource-key))
    (schedule-query-resource-reload! resource-key)
    (request-reload! [:resources resource-key]
                     #(start-resource-load! resource-key))))

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
    (clear-query-resource-reloads!)
    (reset! *store (empty-store graph-id generation))
    (reset! *in-flight {})
    (loader/reject-pending! reset-error)
    (doseq [listener listeners]
      (listener))
    (when graph-id
      (doseq [[slot-keys start-load!]
              [[block-uuids start-block-load!]
               [parent-uuids start-children-load!]
               [resource-keys start-resource-load!]]
              key slot-keys]
        (start-load! key))))
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

(defn- error-slot
  [error]
  {:kind :error
   :snapshot {:status :error :error error}})

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

(defn- blocks-context
  []
  {:store *store
   :listeners *listeners
   :request-reload! request-reload!
   :start-children-load! start-children-load!
   :schedule-resource-reload! schedule-resource-reload!
   :set-seeded-block-gc-timeout! set-seeded-block-gc-timeout!})

(defn- start-block-load!
  [block-uuid]
  (start-request!
   [:blocks block-uuid]
   <load-block
   #(blocks/apply-block-load! (blocks-context) %1 block-uuid %2)
   #(apply-load-error! :blocks block-uuid %1 %2 %3)))

(defn- start-children-load!
  [parent-uuid]
  (start-request!
   [:children parent-uuid]
   <load-children
   #(blocks/apply-children-load! (blocks-context) %1 parent-uuid %2)
   #(apply-load-error! :children parent-uuid %1 %2 %3)))

(defn- start-resource-load!
  [resource-key]
  (start-request!
   [:resources resource-key]
   <load-resource
   #(blocks/apply-resource-load! (blocks-context) %1 resource-key %2)
   #(apply-load-error! :resources resource-key %1 %2 %3)))

(defn- collect-slot!
  [slot-type key]
  (when-not (mounted? slot-type key)
    (swap! *store update slot-type dissoc key)
    (swap! *in-flight dissoc [slot-type key])))

(defn- schedule-slot-gc!
  [slot-type key]
  (let [collect!
        (fn []
          (when-not (mounted? slot-type key)
            (let [resource-value (when (= :resources slot-type)
                                   (get-in @*store
                                           [:resources key :snapshot :value]))
                  bundles (when resource-value
                            (blocks/resource-bundles key resource-value))
                  initial-blocks (when resource-value
                                   (blocks/resource-blocks key resource-value))]
              (collect-slot! slot-type key)
              (doseq [bundle (vals bundles)]
                (doseq [block-uuid (keys (:blocks bundle))]
                  (collect-slot! :blocks block-uuid))
                (doseq [parent-uuid (keys (:children bundle))]
                  (collect-slot! :children parent-uuid)))
              (doseq [block-uuid (keys initial-blocks)]
                (collect-slot! :blocks block-uuid)))))]
    (if (= :children slot-type)
      (js/setTimeout collect! children-slot-cache-ms)
      (js/queueMicrotask collect!))))

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

(defn apply-delta!
  [delta]
  (blocks/apply-delta! (blocks-context) delta))
