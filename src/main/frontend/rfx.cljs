(ns frontend.rfx
  "RFX integration for frontend application state, subscriptions, and events."
  (:require ["react" :as react]
            [io.factorhouse.rfx.core :as rfx]
            [io.factorhouse.rfx.registry :as registry]
            [io.factorhouse.rfx.store :as store]
            [promesa.core :as p]))

(defonce !context
  (atom nil))

(defonce ^:private !app-db
  (atom {}))

(defonce ^:private !state-listeners
  (atom {}))

(defonce ^:private !state-sub-ids
  (atom #{}))

(defonce ^:private !state-path-listeners
  (atom {}))

(defonce ^:private !state-path-listener-paths
  (atom {}))

(defonce ^:private !state-write-profile
  (volatile! {:last-log-ms 0}))

(def ^:private fast-state-sub-ids
  #{:db/query-results
    :db/async-queries
    :db/latest-transacted-entity-uuids
    :sync/block-conflicts
    :ui/container-id
    :ui/cached-key->container-id
    :command-palette/commands})

(defn- now-ms
  []
  (.now js/performance))

(defn- state-path-key
  [path]
  (if (seq path)
    (pr-str path)
    "<unknown>"))

(defn- state-path-prefixes
  [path]
  (when (seq path)
    (mapv #(subvec path 0 %) (range 1 (inc (count path))))))

(defn- affected-state-path-listeners
  [listeners-by-path listener-paths changed-path]
  (if (seq changed-path)
    (let [affected-paths (into (set (state-path-prefixes changed-path))
                               (get listener-paths changed-path))]
      (vec (mapcat #(vals (get listeners-by-path %)) affected-paths)))
    (vec (mapcat vals (vals listeners-by-path)))))

(defn- affected-state-path-listeners-for-paths
  [listeners-by-path listener-paths changed-paths]
  (if (seq changed-paths)
    (vec (distinct
          (mapcat #(affected-state-path-listeners listeners-by-path listener-paths %)
                  changed-paths)))
    (vec (mapcat vals (vals listeners-by-path)))))

(defn- top-level-changed-paths
  [prev-db next-db]
  (->> (concat (keys prev-db) (keys next-db))
       (set)
       (keep (fn [k]
               (when (not= (get prev-db k)
                           (get next-db k))
                 [k])))
       (vec)))

(defn- add-state-path-listener
  [path id listener]
  (swap! !state-path-listeners assoc-in [path id] {:path path
                                                   :listener listener})
  (swap! !state-path-listener-paths
         (fn [listener-paths]
           (reduce #(update %1 %2 (fnil conj #{}) path)
                   listener-paths
                   (state-path-prefixes path)))))

(defn- remove-state-path-listener
  [path id]
  (let [path-empty? (volatile! false)]
    (swap! !state-path-listeners
           (fn [listeners-by-path]
             (let [listeners' (dissoc (get listeners-by-path path) id)]
               (vreset! path-empty? (empty? listeners'))
               (if (seq listeners')
                 (assoc listeners-by-path path listeners')
                 (dissoc listeners-by-path path)))))
    (when @path-empty?
      (swap! !state-path-listener-paths
             (fn [listener-paths]
               (reduce (fn [result prefix]
                         (let [paths' (disj (get result prefix) path)]
                           (if (seq paths')
                             (assoc result prefix paths')
                             (dissoc result prefix))))
                       listener-paths
                       (state-path-prefixes path)))))))

(defn- profile-state-write!
  [{:keys [path total-ms store-ms notify-ms checked-listeners notified-listeners]}]
  (let [now (now-ms)
        path-key (state-path-key path)
        profile' (vswap! !state-write-profile
                          (fn [{:keys [last-log-ms] :as profile}]
                            (-> profile
                                (assoc :last-log-ms (or last-log-ms 0))
                                (update :calls (fnil inc 0))
                                (update :total-ms (fnil + 0) total-ms)
                                (update :store-ms (fnil + 0) store-ms)
                                (update :notify-ms (fnil + 0) notify-ms)
                                (update :checked-listeners (fnil + 0) checked-listeners)
                                (update :notified-listeners (fnil + 0) notified-listeners)
                                (update-in [:paths path-key :calls] (fnil inc 0))
                                (update-in [:paths path-key :total-ms] (fnil + 0) total-ms)
                                (update-in [:paths path-key :store-ms] (fnil + 0) store-ms)
                                (update-in [:paths path-key :notify-ms] (fnil + 0) notify-ms)
                                (update-in [:paths path-key :checked-listeners] (fnil + 0) checked-listeners)
                                (update-in [:paths path-key :notified-listeners] (fnil + 0) notified-listeners))))]
    (when (> (- now (:last-log-ms profile')) 1000)
      ;; Uncomment when profiling rfx state writes locally.
      #_(let [paths (->> (:paths profile')
                         (map (fn [[path {:keys [calls total-ms store-ms notify-ms checked-listeners notified-listeners]}]]
                                {:path path
                                 :calls calls
                                 :total-ms (.toFixed total-ms 2)
                                 :store-ms (.toFixed store-ms 2)
                                 :notify-ms (.toFixed notify-ms 2)
                                 :checked-listeners checked-listeners
                                 :notified-listeners notified-listeners}))
                         (sort-by (fn [{:keys [total-ms]}]
                                    (- (js/parseFloat total-ms))))
                         (take 10))]
          (js/console.log
           "[rfx-state-profile]"
           (clj->js {:calls (:calls profile')
                     :total-ms (.toFixed (:total-ms profile') 2)
                     :store-ms (.toFixed (:store-ms profile') 2)
                     :notify-ms (.toFixed (:notify-ms profile') 2)
                     :checked-listeners (:checked-listeners profile')
                     :notified-listeners (:notified-listeners profile')
                     :top-paths paths})))
      (vreset! !state-write-profile {:last-log-ms now}))))

(defn- pub-event-deferred
  [event]
  (-> event meta ::deferred))

(defn- errors->exception
  [errors origin]
  (ex-info (or (:message (first errors))
               "RFX event failed.")
           {:errors errors
            :origin origin}))

(defn- error-handler
  [{:keys [errors origin] :as ctx}]
  (if-let [deferred (pub-event-deferred origin)]
    (p/reject! deferred (errors->exception errors origin))
    (rfx/log-and-continue-error-handler ctx)))

(defn- register-built-in-fx!
  [rfx-registry]
  (registry/reg-fx rfx-registry ::resolve-pub-event
                   (fn [_ {:keys [deferred value]}]
                     (p/resolve! deferred value)))
  (registry/reg-fx rfx-registry ::reject-pub-event
                   (fn [_ {:keys [deferred error]}]
                     (p/reject! deferred error))))

(defn- new-context
  [opts]
  (let [ctx (rfx/init (update opts :error-handler #(or % error-handler)))]
    (register-built-in-fx! (:registry ctx))
    ctx))

(defn context
  []
  (or @!context
      (reset! !context (new-context {:initial-value {}
                                     :registry (atom {})}))))

(defn init!
  [{:keys [initial-value registry] :as opts}]
  (let [ctx (new-context (assoc opts
                                :initial-value (or initial-value {})
                                :registry (or registry (atom {}))))]
    (reset! !context ctx)
    (reset! !app-db (or initial-value {}))
    (reset! !state-sub-ids #{})
    (reset! !state-path-listeners {})
    (reset! !state-path-listener-paths {})
    (vreset! !state-write-profile {:last-log-ms 0})
    ctx))

(defn current-registry
  []
  (:registry (context)))

(defn snapshot
  []
  @!app-db)

(defn- sync-wrapper-state-paths!
  [prev-db next-db changed-paths started-at store-ms]
  (reset! !app-db next-db)
  (let [notify-started-at (now-ms)
        path-listeners (affected-state-path-listeners-for-paths @!state-path-listeners
                                                                @!state-path-listener-paths
                                                                changed-paths)
        checked-listeners (count path-listeners)
        notified-listeners (volatile! 0)]
    (doseq [listener (vals @!state-listeners)]
      (listener next-db))
    (doseq [{:keys [path listener]} path-listeners
            :when (not= (get-in prev-db path)
                        (get-in next-db path))]
      (vswap! notified-listeners inc)
      (listener))
    (profile-state-write! {:path (if (= 1 (count changed-paths))
                                   (first changed-paths)
                                   changed-paths)
                           :total-ms (- (now-ms) started-at)
                           :store-ms store-ms
                           :notify-ms (- (now-ms) notify-started-at)
                           :checked-listeners checked-listeners
                           :notified-listeners @notified-listeners})
    next-db))

(defn- fast-state-path?
  [path]
  (contains? fast-state-sub-ids (first path)))

(defn replace-state-paths!
  [db changed-paths]
  (let [started-at (now-ms)
        prev-db (snapshot)
        store-started-at (now-ms)
        fast-state? (and (seq changed-paths)
                         (every? fast-state-path? changed-paths))
        next-db (if fast-state?
                  db
                  (store/next-state! (:store (context)) db))
        store-ms (- (now-ms) store-started-at)]
    (sync-wrapper-state-paths! prev-db next-db changed-paths started-at store-ms)))

(defn replace-state!
  ([db]
   (replace-state! db nil))
  ([db changed-path]
   (replace-state-paths! db (when changed-path [changed-path]))))

(defn listen!
  [listener-id f]
  (swap! !state-listeners assoc listener-id f)
  #(swap! !state-listeners dissoc listener-id))

(defn snapshot-sub
  [sub]
  (if (contains? @!state-sub-ids (first sub))
    (get-in (snapshot) sub)
    (rfx/snapshot-sub (context) sub)))

(defn dispatch-sync!
  [event]
  (let [ctx (context)
        prev-db (snapshot)
        result (rfx/dispatch-sync ctx event)
        next-db (reduce (fn [db k]
                          (if (contains? prev-db k)
                            (assoc db k (get prev-db k))
                            db))
                        (store/snapshot (:store ctx))
                        fast-state-sub-ids)]
    (when-not (= prev-db next-db)
      (sync-wrapper-state-paths! prev-db
                                 next-db
                                 (top-level-changed-paths prev-db next-db)
                                 (now-ms)
                                 0))
    result))

(defn use-sub
  [sub]
  (cond
    (contains? @!state-sub-ids (first sub))
    (let [path (vec sub)
          ;; React's useSyncExternalStore compares snapshots with Object.is.
          ;; (get-in (snapshot) path) may return a non-Object.is-stable value
          ;; for the same logical data (e.g. cljs-bean lazy Bean / ArrayVector
          ;; wrappers reconstructed on every property access), which would
          ;; cause an infinite re-render loop. Cache the last value and reuse
          ;; the previous reference whenever the new value is cljs `=` to it.
          *last-snapshot (react/useRef js/undefined)]
      (letfn [(get-state-path-snapshot []
                (let [v (get-in (snapshot) path)
                      prev (.-current *last-snapshot)]
                  (if (and (not (identical? prev js/undefined))
                           (= prev v))
                    prev
                    (do (set! (.-current *last-snapshot) v) v))))]
        (react/useSyncExternalStore
         (fn subscribe-to-state-path! [listener]
           (let [id (str (gensym "state-path-listener"))]
             (add-state-path-listener path id listener)
             (fn []
               (remove-state-path-listener path id))))
         get-state-path-snapshot
         get-state-path-snapshot)))

    :else
    (rfx/use-sub sub)))

(defn use-entity-tx-id
  [entity]
  (let [tx-ids-path [:db/latest-transacted-entity-uuids :entity-tx-ids]
        uuid-tx-id (use-sub (conj tx-ids-path (:block/uuid entity)))
        db-tx-id (use-sub (conj tx-ids-path (:db/id entity)))]
    (or uuid-tx-id db-tx-id)))

(defn use-entity-children-tx-id
  [entity]
  (let [tx-ids-path [:db/latest-transacted-entity-uuids :children-tx-ids]
        uuid-tx-id (use-sub (conj tx-ids-path (:block/uuid entity)))
        db-tx-id (use-sub (conj tx-ids-path (:db/id entity)))]
    (or uuid-tx-id db-tx-id)))

(defn use-entity-tree-tx-id
  [entity]
  (let [tx-ids-path [:db/latest-transacted-entity-uuids :tree-tx-ids]
        uuid-tx-id (use-sub (conj tx-ids-path (:block/uuid entity)))
        db-tx-id (use-sub (conj tx-ids-path (:db/id entity)))]
    (or uuid-tx-id db-tx-id)))

(defn register-state-sub-id!
  [sub-id]
  (swap! !state-sub-ids conj sub-id)
  nil)

(defn provider
  [child]
  (react/createElement rfx/RfxContextProvider #js {:value (context)} child))

(defn reg-sub!
  ([sub-id]
   (reg-sub! sub-id [] (fn [db _] db)))
  ([sub-id sub-f]
   (reg-sub! sub-id [] sub-f))
  ([sub-id signals sub-f]
   (registry/reg-sub (current-registry) sub-id signals sub-f)))

(defn- with-pub-event-resolution
  [event-f]
  (fn [coeffects event]
    (let [effects (event-f coeffects event)
          deferred (-> event meta ::deferred)]
      (cond-> (dissoc effects ::result ::error)
        (and deferred (contains? effects ::result))
        (assoc ::resolve-pub-event {:deferred deferred
                                    :value (get effects ::result)})

        (and deferred (contains? effects ::error))
        (assoc ::reject-pub-event {:deferred deferred
                                   :error (get effects ::error)})

        (and deferred
             (not (contains? effects ::result))
             (not (contains? effects ::error)))
        (assoc ::resolve-pub-event {:deferred deferred
                                    :value nil})))))

(defn reg-event-fx!
  ([event-id event-f]
   (reg-event-fx! event-id [] event-f))
  ([event-id interceptors event-f]
   (registry/reg-event-fx (current-registry) event-id interceptors
                          (with-pub-event-resolution event-f))))

(defn reg-event-db!
  ([event-id event-f]
   (reg-event-db! event-id [] event-f))
  ([event-id interceptors event-f]
   (reg-event-fx! event-id interceptors
                  (fn [{:keys [db]} event]
                    {:db (event-f db event)}))))

(defn pub-event!
  [event]
  (let [deferred (p/deferred)]
    (try
      (dispatch-sync! (with-meta event {::deferred deferred}))
      (catch :default e
        (p/reject! deferred e)))
    deferred))
