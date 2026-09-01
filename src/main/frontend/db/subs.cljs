(ns frontend.db.subs
  "Immutable renderer snapshots loaded from the worker-owned graph database."
  (:require [cljs.cache :as cache]
            [clojure.set :as set]
            [frontend.db.subs-loader :as loader]
            [frontend.state :as state]
            [promesa.core :as p]))

(def ^:private loading-snapshot {:status :loading})
(def ^:private warm-cache-size 5000)

(defn require-uuid!
  [label value]
  (when-not (uuid? value)
    (throw (ex-info (str "Invalid " label) {label value})))
  value)

(defn- require-revision!
  [label value]
  (when-not (and (integer? value) (not (neg? value)))
    (throw (ex-info (str "Invalid " label) {label value})))
  value)

(defn block-changed?
  [old-block new-block]
  (not= (require-revision! :block/tx-id (:block/tx-id old-block))
        (require-revision! :block/tx-id (:block/tx-id new-block))))

(defn- empty-store
  [graph-id generation]
  {:graph-id graph-id
   :generation generation
   :rev -1
   :slots {}
   :resource-slot-keys #{}
   :warm (cache/lru-cache-factory {} :threshold warm-cache-size)})

(defonce ^:private *store (atom (empty-store (state/get-current-repo) 0)))
(defonce ^:private *listeners (atom {}))
(defonce ^:private *in-flight (atom {}))
(defonce ^:private *query-reloads (atom {:timer-id nil :slot-keys #{}}))

(defn ^:no-doc set-query-reload-timeout! [callback delay-ms]
  (js/setTimeout callback delay-ms))
(defn ^:no-doc clear-query-reload-timeout! [timer-id]
  (js/clearTimeout timer-id))
(defn ^:no-doc schedule-load-batch! [callback]
  (js/setTimeout callback 0))
(defn <load-block [graph-id block-uuid]
  (loader/load! graph-id [:block block-uuid] schedule-load-batch!))
(defn <load-children [graph-id parent-uuid]
  (loader/load! graph-id [:children parent-uuid] schedule-load-batch!))
(defn <load-resource [graph-id resource-key]
  (loader/load! graph-id [:resource resource-key] schedule-load-batch!))

(defn- mounted?
  [slot-key]
  (seq (get @*listeners slot-key)))

(defn- notify!
  [slot-key]
  (doseq [listener (vals (get @*listeners slot-key))]
    (listener)))

(defn- store-slot
  [store slot-key]
  (or (get-in store [:slots slot-key])
      (cache/lookup (:warm store) slot-key)))

(defn- slot-snapshot
  [slot-key]
  (or (:snapshot (store-slot @*store slot-key)) loading-snapshot))

(defn block-snapshot [block-uuid]
  (require-uuid! :block/uuid block-uuid)
  (slot-snapshot [:block block-uuid]))
(defn children-snapshot [parent-uuid]
  (require-uuid! :block/uuid parent-uuid)
  (slot-snapshot [:children parent-uuid]))
(defn resource-snapshot [resource-key]
  (slot-snapshot [:resource resource-key]))

(defn- slot-revision
  [slot]
  (max -1 (or (:basis-rev slot) -1) (or (:rev slot) -1)))

(defn- ready-slot
  [basis-rev value attributes]
  (merge {:basis-rev basis-rev
          :snapshot {:status :ready :value value}}
         attributes))

(defn- require-block!
  [block-uuid block]
  (require-uuid! :block/uuid block-uuid)
  (when-not (= block-uuid (:block/uuid block))
    (throw (ex-info "Block UUID does not match its snapshot key"
                    {:block-uuid block-uuid})))
  (require-revision! :block/tx-id (:block/tx-id block))
  block)

(defn- child-items!
  [parent-uuid items]
  (->> items
       (map (fn [[child-uuid order :as item]]
              (when-not (and (= 2 (count item)) (string? order))
                (throw (ex-info "Invalid direct-child item"
                                {:parent-uuid parent-uuid :item item})))
              [(require-uuid! :block/uuid child-uuid) order]))
       (sort-by second)
       vec))

(defn- wire-slot
  [basis-rev [kind key :as slot-key] wire]
  (case kind
    :block
    (if (:missing? wire)
      {:rev basis-rev :snapshot {:status :missing}}
      (let [block (require-block! key (:value wire))]
        (ready-slot basis-rev block {:tx-id (:block/tx-id block)})))

    :children
    (let [tx-id (require-revision! :block/tx-id (:tx-id wire))
          items (child-items! key (:items wire))]
      (ready-slot basis-rev (mapv first items) {:tx-id tx-id :items items}))

    :resource
    (let [{:keys [keys all?] :as watch} (:watch wire)]
      (when-not (and (= #{:keys :all?} (set (clojure.core/keys watch)))
                     (set? keys) (boolean? all?))
        (throw (ex-info "Invalid resource watch descriptor"
                        {:resource-key key :watch watch})))
      (ready-slot basis-rev (:value wire) {:watch watch}))

    (throw (ex-info "Invalid renderer snapshot slot" {:slot-key slot-key}))))

(defn- resource-response-stale?
  [slot-key patch]
  (let [dirty-keys (get-in @*in-flight [slot-key :dirty-keys])
        dirty-slots (get-in @*in-flight [slot-key :dirty-slots])
        hydrated-slots (disj (set (keys (:slots patch))) slot-key)
        {:keys [keys all?]} (get-in patch [:slots slot-key :watch])]
    (or (and all? (contains? dirty-keys ::changed))
        (seq (set/intersection dirty-keys keys))
        (seq (set/intersection dirty-slots hydrated-slots)))))

(defn- loaded-slot
  [slot-key current next-slot]
  (let [selected (cond
                   (> (slot-revision current) (slot-revision next-slot)) current
                   (and (= :block (first slot-key))
                        (:tx-id current)
                        (= (:tx-id current) (:tx-id next-slot))) current
                   (= current next-slot) current
                   :else next-slot)]
    (if (= (:snapshot current) (:snapshot selected))
      (assoc selected :snapshot (:snapshot current))
      selected)))

(defn- apply-patch!
  [generation requested-slot-key response]
  (let [{:keys [basis-rev slots] :as patch} response
        _ (require-revision! :basis-rev basis-rev)
        stale-resource? (and (= :resource (first requested-slot-key))
                             (resource-response-stale? requested-slot-key patch))
        changed (volatile! #{})]
    (when-not (map? slots)
      (throw (ex-info "Invalid renderer snapshot slots" {:slots slots})))
    (when-not (or stale-resource? (contains? slots requested-slot-key))
      (throw (ex-info "Missing requested renderer snapshot slot"
                      {:slot-key requested-slot-key})))
    (when-not stale-resource?
      (swap! *store
             (fn [store]
               (if (not= generation (:generation store))
                 store
                 (reduce-kv
                  (fn [store slot-key wire]
                    (let [current (store-slot store slot-key)
                          next-slot (loaded-slot slot-key current
                                                 (wire-slot basis-rev slot-key wire))]
                      (if (identical? current next-slot)
                        store
                        (do
                          (when-not (identical? (:snapshot current)
                                                (:snapshot next-slot))
                            (vswap! changed conj slot-key))
                          (if (mounted? slot-key)
                            (-> store
                                (assoc-in [:slots slot-key] next-slot)
                                (update :warm cache/evict slot-key))
                            (update store :warm cache/miss slot-key next-slot))))))
                  store
                  slots))))
      (doseq [slot-key @changed]
        (notify! slot-key)))
    stale-resource?))

(declare start-load! schedule-resource-reload!)

(defn- current-request?
  [slot-key token graph-id generation]
  (let [store @*store]
    (and (= graph-id (:graph-id store))
         (= generation (:generation store))
         (identical? token (get-in @*in-flight [slot-key :token])))))

(defn- finish-request!
  [slot-key token]
  (let [reload? (volatile! false)]
    (swap! *in-flight
           (fn [requests]
             (if (identical? token (get-in requests [slot-key :token]))
               (do (vreset! reload? (get-in requests [slot-key :reload?]))
                   (dissoc requests slot-key))
               requests)))
    (when (and @reload? (mounted? slot-key))
      (start-load! slot-key))))

(defn- load-error!
  [slot-key error]
  (let [changed? (volatile! false)]
    (swap! *store
           (fn [store]
             (let [current (store-slot store slot-key)]
               (if (or (nil? current) (:stale? current)
                       (= :error (get-in current [:snapshot :status])))
                 (do (vreset! changed? true)
                     (assoc-in store [:slots slot-key]
                               {:snapshot {:status :error :error error}}))
                 store))))
    (when @changed? (notify! slot-key))))

(defn- load-slot
  [graph-id [kind key]]
  (case kind
    :block (<load-block graph-id key)
    :children (<load-children graph-id key)
    :resource (<load-resource graph-id key)))

(defn- start-load!
  [slot-key]
  (when (and (:graph-id @*store) (not (contains? @*in-flight slot-key)))
    (let [{:keys [graph-id generation]} @*store
          token (js-obj)
          request (try (load-slot graph-id slot-key)
                       (catch :default error (p/rejected error)))]
      (swap! *in-flight assoc slot-key
             {:token token :dirty-keys #{} :dirty-slots #{} :reload? false})
      (-> request
          (p/then (fn [response]
                    (when (current-request? slot-key token graph-id generation)
                      (when (apply-patch! generation slot-key response)
                        (swap! *in-flight assoc-in [slot-key :reload?] true)))))
          (p/catch (fn [error]
                     (when (current-request? slot-key token graph-id generation)
                       (load-error! slot-key error))))
          (p/finally #(finish-request! slot-key token))))))

(defn- request-reload!
  [slot-key]
  (if (contains? @*in-flight slot-key)
    (swap! *in-flight assoc-in [slot-key :reload?] true)
    (start-load! slot-key)))

(defn- clear-query-reloads!
  []
  (when-let [timer-id (:timer-id @*query-reloads)]
    (clear-query-reload-timeout! timer-id))
  (reset! *query-reloads {:timer-id nil :slot-keys #{}}))

(defn- flush-query-reloads!
  []
  (let [slot-keys (:slot-keys @*query-reloads)]
    (reset! *query-reloads {:timer-id nil :slot-keys #{}})
    (doseq [slot-key slot-keys]
      (when (mounted? slot-key) (request-reload! slot-key)))))

(defn- schedule-resource-reload!
  [[_ resource-key :as slot-key]]
  (if (= :query (first resource-key))
    (swap! *query-reloads
           (fn [{:keys [timer-id slot-keys]}]
             {:timer-id (or timer-id
                            (set-query-reload-timeout! flush-query-reloads! 2000))
              :slot-keys (conj slot-keys slot-key)}))
    (request-reload! slot-key)))

(defn reset-graph!
  [graph-id]
  (let [generation (inc (:generation @*store))
        resource-slot-keys (into #{} (filter #(= :resource (first %)))
                                 (keys @*listeners))
        listeners (mapcat vals (vals @*listeners))
        error (ex-info "Graph changed during renderer load" {:graph-id graph-id})]
    (clear-query-reloads!)
    (reset! *store (assoc (empty-store graph-id generation)
                          :resource-slot-keys resource-slot-keys))
    (reset! *in-flight {})
    (loader/reject-pending! error)
    (run! (fn [listener] (listener)) listeners))
  nil)

(defn- retry-mounted-errors!
  [_key _ref _old-value ready?]
  (when ready?
    (doseq [slot-key (keys @*listeners)
            :when (= :error (get-in (store-slot @*store slot-key)
                                    [:snapshot :status]))]
      (start-load! slot-key))))

(add-watch state/db-worker-ready?
           ::retry-mounted-errors
           retry-mounted-errors!)

(defn- subscribe!
  [slot-key listener]
  (let [listener-id (random-uuid)]
    (swap! *listeners assoc-in [slot-key listener-id] listener)
    (swap! *store
           (fn [store]
             (let [store (cond-> store
                           (= :resource (first slot-key))
                           (update :resource-slot-keys conj slot-key))]
               (if-let [slot (cache/lookup (:warm store) slot-key)]
                 (-> store
                     (assoc-in [:slots slot-key] slot)
                     (update :warm cache/evict slot-key))
                 store))))
    (let [slot (store-slot @*store slot-key)]
      (when (or (nil? slot) (:stale? slot)
                (= :error (get-in slot [:snapshot :status])))
        (start-load! slot-key)))
    (fn []
      (swap! *listeners update slot-key dissoc listener-id)
      (when-not (mounted? slot-key)
        (swap! *listeners dissoc slot-key)
        (swap! *in-flight dissoc slot-key)
        (swap! *store
               (fn [store]
                 (let [resource? (= :resource (first slot-key))
                       store (if resource?
                               (update store :resource-slot-keys disj slot-key)
                               store)]
                   (if-let [slot (get-in store [:slots slot-key])]
                     (if resource?
                       (update store :slots dissoc slot-key)
                       (-> store
                           (update :slots dissoc slot-key)
                           (update :warm cache/miss slot-key slot)))
                     store))))))))

(defn subscribe-block! [block-uuid listener]
  (require-uuid! :block/uuid block-uuid)
  (subscribe! [:block block-uuid] listener))
(defn subscribe-children! [parent-uuid listener]
  (require-uuid! :block/uuid parent-uuid)
  (subscribe! [:children parent-uuid] listener))
(defn subscribe-resource! [resource-key listener]
  (subscribe! [:resource resource-key] listener))

(defn- put-delta-slot
  [store slot-key next-slot]
  (let [current (store-slot store slot-key)]
    (if (or (> (slot-revision current) (:rev store))
            (and (= :block (first slot-key))
                 (:tx-id current)
                 (= (:tx-id current) (:tx-id next-slot))))
      [store false]
      [(if (mounted? slot-key)
         (assoc-in store [:slots slot-key] next-slot)
         (update store :warm cache/miss slot-key next-slot))
       (not= current next-slot)])))

(defn- record-delta-slot
  [store changed slot-key next-slot]
  (let [[store changed?] (put-delta-slot store slot-key next-slot)]
    (when changed? (vswap! changed conj slot-key))
    store))

(defn- children-slot
  [rev tx-id items]
  (ready-slot rev (mapv first items) {:tx-id tx-id :items items}))

(defn- patch-items
  [parent-uuid items removed upsert]
  (let [removed (set (child-items! parent-uuid removed))
        upsert (child-items! parent-uuid upsert)
        upsert-uuids (set (map first upsert))]
    (->> items
         (remove #(or (contains? removed %)
                      (contains? upsert-uuids (first %))))
         (concat upsert)
         (sort-by second)
         vec)))

(defn- apply-delta-store
  [store {:keys [rev blocks deleted children affected-keys]}]
  (let [inserted (into #{} (mapcat #(map first (:upsert (second %)))) children)
        changed (volatile! #{})
        reload (volatile! #{})
        store (assoc store :rev rev)
        store (reduce-kv
               (fn [store block-uuid block]
                 (let [slot-key [:block block-uuid]
                       current (store-slot store slot-key)]
                   (if (or current (mounted? slot-key) (contains? inserted block-uuid))
                     (let [block (require-block! block-uuid block)]
                       (record-delta-slot
                        store changed slot-key
                        (ready-slot rev block {:tx-id (:block/tx-id block)})))
                     store)))
               store blocks)
        store (reduce-kv
               (fn [store block-uuid tombstone]
                 (let [slot-key [:block block-uuid]
                       tombstone-rev (require-revision! :rev (:rev tombstone))]
                   (when-not (= rev tombstone-rev)
                     (throw (ex-info "Tombstone revision does not match delta"
                                     {:block-uuid block-uuid})))
                   (if (or (store-slot store slot-key) (mounted? slot-key))
                     (record-delta-slot store changed slot-key
                                        {:rev rev :snapshot {:status :missing}})
                     store)))
               store deleted)
        store (reduce-kv
               (fn [store parent-uuid {:keys [base-rev upsert]
                                       removed :remove patch-rev :rev}]
                 (require-revision! :base-rev base-rev)
                 (when-not (= rev (require-revision! :rev patch-rev))
                   (throw (ex-info "Child patch revision does not match delta"
                                   {:parent-uuid parent-uuid})))
                 (let [slot-key [:children parent-uuid]
                       current (store-slot store slot-key)
                       parent-tx-id (get-in blocks [parent-uuid :block/tx-id])]
                   (cond
                     (and current
                          (= :ready (get-in current [:snapshot :status]))
                          (or (= base-rev (:basis-rev current))
                              (and (mounted? slot-key)
                                   (< (:basis-rev current) base-rev))))
                     (let [items (patch-items parent-uuid (:items current) removed upsert)]
                       (record-delta-slot store changed slot-key
                                          (children-slot rev (:tx-id current) items)))

                     (and (nil? current) parent-tx-id
                          (contains? inserted parent-uuid))
                     (let [items (patch-items parent-uuid [] removed upsert)]
                       (record-delta-slot store changed slot-key
                                          (children-slot rev parent-tx-id items)))

                     (mounted? slot-key)
                     (do (vswap! reload conj slot-key)
                         (assoc-in store [:slots slot-key]
                                   {:rev rev :stale? true}))

                     current
                     (update store :warm cache/evict slot-key)

                     :else store)))
               store children)
        store (reduce
               (fn [store slot-key]
                 (let [slot (get-in store [:slots slot-key])
                       owner (second (second slot-key))
                       watch (:watch slot)]
                   (cond
                     (and (uuid? owner) (contains? deleted owner))
                     (do (vswap! changed conj slot-key)
                         (assoc-in store [:slots slot-key]
                                   {:rev rev :snapshot {:status :missing}}))

                     (or (:all? watch)
                         (seq (set/intersection affected-keys (:keys watch))))
                     (do (vswap! reload conj slot-key)
                         (assoc-in store [:slots slot-key :stale?] true))

                     :else store)))
               store (:resource-slot-keys store))]
    [store {:changed @changed :reload @reload}]))

(defn apply-delta!
  [{:keys [graph-id rev blocks deleted children affected-keys] :as delta}]
  (when-not (and (map? delta) (map? blocks) (map? deleted)
                 (map? children) (set? affected-keys))
    (throw (ex-info "Invalid renderer delta" {:delta delta})))
  (require-revision! :rev rev)
  (let [effects (volatile! nil)]
    (swap! *store
           (fn [store]
             (if (or (not= graph-id (:graph-id store)) (<= rev (:rev store)))
               store
               (let [[store result] (apply-delta-store store delta)]
                 (vreset! effects result)
                 store))))
    (when-let [{:keys [changed reload]} @effects]
      (let [dirty-slots
            (into #{}
                  (concat (map #(vector :block %)
                               (concat (keys blocks) (keys deleted)))
                          (map #(vector :children %) (keys children))))]
        (swap! *in-flight
               (fn [requests]
                 (reduce-kv
                  (fn [requests slot-key request]
                    (if (= :resource (first slot-key))
                      (assoc requests slot-key
                             (-> request
                                 (update :dirty-keys into
                                         (conj affected-keys ::changed))
                                 (update :dirty-slots into dirty-slots)))
                      requests))
                  requests requests))))
      (run! notify! changed)
      (run! (fn [slot-key]
              (when (= :resource (first slot-key))
                (schedule-resource-reload! slot-key))
              (when (= :children (first slot-key))
                (request-reload! slot-key)))
            reload)
      true)))
