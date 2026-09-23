(ns frontend.db.hooks
  "Hooks for DB-backed React integration."
  (:require ["react" :as react]
            [frontend.db.subs :as subs]
            [frontend.state :as state]))

(defn- use-stable-key
  [key]
  (let [key-ref (react/useRef key)]
    (when-not (= (.-current key-ref) key)
      (set! (.-current key-ref) key))
    (.-current key-ref)))

(defn- use-graph-key
  [key]
  (use-stable-key [(state/get-current-repo) key]))

(defn- use-external-store-snapshot
  [subscribe! snapshot key]
  (let [key (use-graph-key key)
        subscribe (react/useCallback
                   (fn [listener] (subscribe! (second key) listener))
                   #js [subscribe! key])
        get-snapshot (react/useCallback
                      (fn [] (snapshot (second key)))
                      #js [snapshot key])
        {:keys [status] :as result}
        (react/useSyncExternalStore
         subscribe
         get-snapshot
         get-snapshot)]
    (when-not (contains? #{:ready :loading :missing :error} status)
      (throw (ex-info "Invalid renderer subscription snapshot"
                      {:key key :snapshot result})))
    result))

(defn- snapshot-value
  [{:keys [status value error] :as result}]
  (case status
    :ready value
    (:loading :missing) nil
    :error (if (state/db-worker-uninitialized-error? error)
             nil
             (throw error))
    (throw (ex-info "Invalid renderer subscription snapshot" result))))

(defn- use-external-store
  [subscribe! snapshot key]
  (snapshot-value (use-external-store-snapshot subscribe! snapshot key)))

(defn- use-external-store-projection-snapshot
  [subscribe! snapshot key project]
  (let [key (use-graph-key key)
        projection-ref (react/useRef nil)
        subscribe (react/useCallback
                   (fn [listener] (subscribe! (second key) listener))
                   #js [subscribe! key])
        get-snapshot (react/useCallback
                      (fn []
                        (let [source (snapshot (second key))
                              cached (.-current projection-ref)]
                          (if (identical? source (:source cached))
                            (:snapshot cached)
                            (let [projected (if (= :ready (:status source))
                                              (update source :value project)
                                              source)
                                  projected (if (= projected (:snapshot cached))
                                              (:snapshot cached)
                                              projected)]
                              (set! (.-current projection-ref)
                                    {:source source :snapshot projected})
                              projected))))
                      #js [snapshot key project])
        {:keys [status] :as result}
        (react/useSyncExternalStore subscribe get-snapshot get-snapshot)]
    (when-not (contains? #{:ready :loading :missing :error} status)
      (throw (ex-info "Invalid renderer subscription snapshot"
                      {:key key :snapshot result})))
    result))

(defn- use-external-store-projection
  [subscribe! snapshot key project]
  (snapshot-value
   (use-external-store-projection-snapshot subscribe! snapshot key project)))

(defn- subscribe-nothing!
  [_key _listener]
  (fn []))

(def ^:private nil-snapshot-value
  {:status :ready :value nil})

(defn- nil-snapshot
  [_key]
  nil-snapshot-value)

(defn use-block
  [block-uuid]
  (use-external-store subs/subscribe-block! subs/block-snapshot block-uuid))

(defn use-block-prefetch
  "Keep canonical block loads alive for a render-ahead window and report when
  the whole window has settled."
  [block-uuids]
  (let [key (use-graph-key (vec block-uuids))
        block-uuids (second key)
        subscribe (react/useCallback
                   (fn [listener]
                     (let [unsubscribes
                           (mapv #(subs/subscribe-block! % listener) block-uuids)]
                       #(run! (fn [unsubscribe] (unsubscribe)) unsubscribes)))
                   #js [key])
        get-snapshot (react/useCallback
                      (fn []
                        (every? #(not= :loading (:status (subs/block-snapshot %)))
                                block-uuids))
                      #js [key])]
    (react/useSyncExternalStore subscribe get-snapshot get-snapshot)))

(defn use-blocks
  [block-uuids]
  (when (use-block-prefetch block-uuids)
    (mapv (fn [block-uuid]
            (snapshot-value (subs/block-snapshot block-uuid)))
          block-uuids)))

(defn use-block-projection
  [block-uuid project]
  (use-external-store-projection subs/subscribe-block! subs/block-snapshot
                                 block-uuid project))

(defn use-children
  "Children ids for `parent-uuid`. A nil uuid subscribes to nothing and reads
   as nil — collapsed rows pass nil so children load only when expanded."
  [parent-uuid]
  (let [subscribe! (if parent-uuid subs/subscribe-children! subscribe-nothing!)
        snapshot (if parent-uuid subs/children-snapshot nil-snapshot)]
    (use-external-store subscribe! snapshot parent-uuid)))

(defn peek-children
  "Synchronous read of a children slot's ordered uuid vector without
   subscribing. Returns nil while the slot is unloaded."
  [parent-uuid]
  (let [{:keys [status value]} (subs/children-snapshot parent-uuid)]
    (when (= :ready status) value)))

(defn use-resource
  [resource-key]
  (use-external-store subs/subscribe-resource! subs/resource-snapshot resource-key))

(defn use-block-projection-snapshot
  "Status-aware `use-block-projection`. A nil uuid reads as a ready nil value
   so a caller can wait on an upstream lookup without conditional hooks."
  [block-uuid project]
  (let [subscribe! (if block-uuid subs/subscribe-block! subscribe-nothing!)
        snapshot (if block-uuid subs/block-snapshot nil-snapshot)]
    (use-external-store-projection-snapshot subscribe! snapshot block-uuid project)))

(defn use-resource-snapshot
  [resource-key]
  (let [subscribe! (if resource-key
                     subs/subscribe-resource!
                     subscribe-nothing!)
        snapshot (if resource-key
                   subs/resource-snapshot
                   nil-snapshot)]
    (use-external-store-snapshot subscribe! snapshot resource-key)))
