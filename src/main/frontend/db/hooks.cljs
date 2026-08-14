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

(defn- use-external-store
  [subscribe! snapshot key]
  (let [{:keys [status value error] :as result}
        (use-external-store-snapshot subscribe! snapshot key)]
    (case status
      :ready value
      (:loading :missing) nil
      :error (throw error)
      (throw (ex-info "Invalid renderer subscription snapshot" result)))))

(defn- use-external-store-projection
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
        {:keys [status value error] :as result}
        (react/useSyncExternalStore subscribe get-snapshot get-snapshot)]
    (case status
      :ready value
      (:loading :missing) nil
      :error (throw error)
      (throw (ex-info "Invalid renderer subscription snapshot"
                      {:key key :snapshot result})))))

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
            (let [{:keys [status value error] :as snapshot}
                  (subs/block-snapshot block-uuid)]
              (case status
                :ready value
                :missing nil
                :error (throw error)
                (throw (ex-info "Invalid settled block snapshot" snapshot)))))
          block-uuids)))

(defn use-block-projection
  [block-uuid project]
  (use-external-store-projection subs/subscribe-block! subs/block-snapshot
                                 block-uuid project))

(defn use-children
  [parent-uuid]
  (use-external-store subs/subscribe-children! subs/children-snapshot parent-uuid))

(defn use-resource
  [resource-key]
  (use-external-store subs/subscribe-resource! subs/resource-snapshot resource-key))

(defn- subscribe-nothing!
  [_key _listener]
  (fn []))

(def ^:private nil-resource-snapshot-value
  {:status :ready :value nil})

(defn- nil-resource-snapshot
  [_key]
  nil-resource-snapshot-value)

(defn use-resource-snapshot
  [resource-key]
  (let [subscribe! (if resource-key
                     subs/subscribe-resource!
                     subscribe-nothing!)
        snapshot (if resource-key
                   subs/resource-snapshot
                   nil-resource-snapshot)]
    (use-external-store-snapshot subscribe! snapshot resource-key)))
